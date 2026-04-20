import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { setupVite, serveStatic } from "./vite";
import { ENV } from "./env";
import { logger, generateRequestId } from "../middleware/logger";

// Regex for static assets that bypass maintenance mode
const STATIC_ASSET_RE = /\.(js|css|png|ico|svg|woff2?|ttf|map)$/i;

async function startServer() {
  const app = express();
  const server = createServer(app);

  // 1. Maintenance mode kill-switch (before everything else)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!ENV.maintenanceMode) return next();
    if (req.path.startsWith("/assets/") || STATIC_ASSET_RE.test(req.path)) return next();
    res.status(503).json({ message: "AREA befindet sich in Wartung. Bitte versuchen Sie es später." });
  });

  // 2. Helmet security headers
  app.use(helmet());

  // 3. Request logging middleware
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

  // 4. Global rate limiter (all routes)
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: ENV.rateLimitGlobal,
      standardHeaders: true,
      legacyHeaders: false,
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
      keyGenerator: (req) => req.ip || "unknown",
      handler: (_req, res) => {
        res.status(429).json({ message: "Analyse-Limit erreicht. Bitte warten Sie eine Minute." });
      },
    })
  );

  // 6. Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // 7. tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // 8. Frontend (Vite dev or static production)
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
