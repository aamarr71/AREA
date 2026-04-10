import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { setupVite } from "./vite";
import { ENV } from "./env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (!ENV.isProduction) {
    // Dev: Vite middleware
    await setupVite(app, server);
  } else {
    // Production: serve built static files
    const staticPath = path.resolve(__dirname, "..", "..", "dist", "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  server.listen(ENV.port, () => {
    console.log(`[AREA] Server running on http://localhost:${ENV.port}/`);
  });
}

startServer().catch((err) => {
  console.error("[AREA] Failed to start server:", err);
  process.exit(1);
});
