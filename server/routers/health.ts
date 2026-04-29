import { sql } from "drizzle-orm";
import { type Request, type Response } from "express";
import { db } from "../db/connection.js";
import { ENV } from "../_core/env.js";

const TIMEOUT_MS = 5_000;

export type CheckResult =
  | { status: "healthy"; latencyMs: number }
  | { status: "unhealthy"; error: string };

export async function checkDatabase(
  executor?: () => Promise<unknown>,
): Promise<CheckResult> {
  const run = executor ?? (() => db.execute(sql`SELECT 1`));
  const start = Date.now();
  try {
    await Promise.race([
      run(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ]);
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "timeout";
    return {
      status: "unhealthy",
      error: isTimeout ? "Connection timeout" : "Database error",
    };
  }
}

export async function checkN8n(
  fetchFn?: typeof globalThis.fetch,
): Promise<CheckResult> {
  const doFetch = fetchFn ?? globalThis.fetch;
  const start = Date.now();
  try {
    await doFetch(ENV.n8nWebhookUrl, {
      method: "GET",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "unhealthy", error: "n8n unreachable" };
  }
}

export function createHealthHandler(checks?: {
  db?: () => Promise<CheckResult>;
  n8n?: () => Promise<CheckResult>;
}) {
  return async function (_req: Request, res: Response): Promise<void> {
    if (ENV.maintenanceMode) {
      res.status(503).json({
        status: "maintenance",
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: "maintenance" },
          n8n: { status: "maintenance" },
          server: { status: "maintenance" },
        },
      });
      return;
    }

    const [dbResult, n8nResult] = await Promise.all([
      checks?.db ? checks.db() : checkDatabase(),
      checks?.n8n ? checks.n8n() : checkN8n(),
    ]);

    const allHealthy =
      dbResult.status === "healthy" && n8nResult.status === "healthy";

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        database: dbResult,
        n8n: n8nResult,
        server: {
          status: "healthy",
          uptimeSeconds: Math.floor(process.uptime()),
        },
      },
    });
  };
}

export const healthHandler = createHealthHandler();
