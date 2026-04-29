// Run with: pnpm tsx server/middleware/__tests__/health.test.ts
import { createHealthHandler } from "../../routers/health.js";
import { ENV } from "../../_core/env.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function makeMockRes() {
  let _status = 200;
  let _body: any;
  const res = {
    status(code: number) { _status = code; return res; },
    json(data: any) { _body = data; },
    get lastStatus() { return _status; },
    get lastBody() { return _body; },
  };
  return res;
}

// ─── Test 1: Healthy Response ─────────────────────────────────────────────────
console.log("\nTest 1: Healthy Response (DB ok + n8n ok → HTTP 200)");
{
  const handler = createHealthHandler({
    db: async () => ({ status: "healthy", latencyMs: 5 }),
    n8n: async () => ({ status: "healthy", latencyMs: 100 }),
  });
  const res = makeMockRes();
  await handler({} as any, res as any);
  assert(res.lastStatus === 200, "HTTP 200");
  assert(res.lastBody?.status === "healthy", 'status: "healthy"');
  assert(res.lastBody?.checks?.database?.status === "healthy", "database: healthy");
  assert(res.lastBody?.checks?.n8n?.status === "healthy", "n8n: healthy");
  assert(typeof res.lastBody?.checks?.server?.uptimeSeconds === "number", "server.uptimeSeconds is number");
  assert(typeof res.lastBody?.timestamp === "string", "timestamp present");
}

// ─── Test 2: Degraded Response ────────────────────────────────────────────────
console.log("\nTest 2: Degraded Response (DB timeout → HTTP 503)");
{
  const handler = createHealthHandler({
    db: async () => ({ status: "unhealthy", error: "Connection timeout" }),
    n8n: async () => ({ status: "healthy", latencyMs: 80 }),
  });
  const res = makeMockRes();
  await handler({} as any, res as any);
  assert(res.lastStatus === 503, "HTTP 503");
  assert(res.lastBody?.status === "degraded", 'status: "degraded"');
  assert(res.lastBody?.checks?.database?.status === "unhealthy", "database: unhealthy");
  assert(res.lastBody?.checks?.database?.error === "Connection timeout", "database.error correct");
  assert(res.lastBody?.checks?.n8n?.status === "healthy", "n8n still healthy");
}

// ─── Test 3: Maintenance Mode ─────────────────────────────────────────────────
console.log("\nTest 3: Maintenance Mode (MAINTENANCE_MODE=true → HTTP 503)");
{
  (ENV as any).maintenanceMode = true;
  const handler = createHealthHandler();
  const res = makeMockRes();
  await handler({} as any, res as any);
  (ENV as any).maintenanceMode = false;
  assert(res.lastStatus === 503, "HTTP 503");
  assert(res.lastBody?.status === "maintenance", 'status: "maintenance"');
  assert(res.lastBody?.checks?.database?.status === "maintenance", "database: maintenance");
  assert(res.lastBody?.checks?.n8n?.status === "maintenance", "n8n: maintenance");
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
