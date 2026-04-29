import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import helmet from "helmet";
import cors from "cors";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { setupVite, serveStatic } from "./vite";
import { ENV } from "./env";
import { logger, generateRequestId } from "../middleware/logger";
import { sessionMiddleware } from "../middleware/session";
import { runMigrations } from "../db/migrate";
import { healthHandler } from "../routers/health";

// Regex for static assets that bypass maintenance mode
const STATIC_ASSET_RE = /\.(js|css|png|ico|svg|woff2?|ttf|map)$/i;

async function startServer() {
  // Apply pending DB migrations before accepting traffic.
  // Idempotent: drizzle tracks applied migrations in `__drizzle_migrations`.
  if (ENV.databaseUrl) {
    await runMigrations();
  } else {
    logger.warn({ msg: "db_skipped", reason: "DATABASE_URL not set" });
  }

  const app = express();
  const server = createServer(app);

  // Trust Railway's proxy so req.ip is correct and rate-limit doesn't crash on IPv6
  app.set("trust proxy", 1);

  // 1. Helmet security headers
  app.use(helmet());

  // 2. CORS — explicit whitelist, credentials required for session cookies
  const allowedOrigins = ["https://area-production-773c.up.railway.app"];
  if (ENV.customDomain) allowedOrigins.push(`https://${ENV.customDomain}`);
  if (!ENV.isProduction) {
    allowedOrigins.push("http://localhost:5173");
    allowedOrigins.push("http://localhost:3000");
  }
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // 3. Health check — before rate limiter, maintenance, and logging (no log spam, no rate-limit block)
  app.get("/health", healthHandler);

  // 4. Global rate limiter (all routes)
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: ENV.rateLimitGlobal,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
      handler: (_req, res) => {
        res.status(429).json({ message: "Zu viele Anfragen. Bitte warten Sie einen Moment." });
      },
    })
  );

  // 5. Analysis-specific rate limiter (stricter, per IP)
  app.use(
    "/api/trpc/analysis.analyze",
    rateLimit({
      windowMs: 60_000,
      max: ENV.rateLimitAnalysis,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
      handler: (_req, res) => {
        res.status(429).json({ message: "Analyse-Limit erreicht. Bitte warten Sie eine Minute." });
      },
    })
  );

  // 6. Maintenance mode kill-switch (after health so the uptime monitor still gets through)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!ENV.maintenanceMode) return next();
    if (req.path.startsWith("/assets/") || STATIC_ASSET_RE.test(req.path)) return next();
    res.status(503).json({ message: "AREA befindet sich in Wartung. Bitte versuchen Sie es später." });
  });

  // 7. Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = generateRequestId();
    const startMs = Date.now();
    res.setHeader("X-Request-ID", requestId);
    logger.info({ msg: "request_started", method: req.method, url: req.url, ip: req.ip, requestId });
    res.on("finish", () => {
      logger.info({
        msg: "request_completed",
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - startMs,
        requestId,
      });
    });
    next();
  });

  // 8. Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // 9. Session middleware (Postgres-backed, signed cookie)
  app.use(sessionMiddleware);

  // 10. tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // 11. Frontend (Vite dev or static production)
  if (!ENV.isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(ENV.port, () => {
    logger.info(`[AREA] Server running on http://localhost:${ENV.port}/`);
  });
}

startServer().catch((err) => {
  logger.error({ msg: "server_start_failed", err });
  process.exit(1);
});
