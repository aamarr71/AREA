export const ENV = {
  // Existing (Phase 1)
  databaseUrl: process.env.DATABASE_URL ?? "",
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL ?? "https://aamarr71.app.n8n.cloud/webhook/analyst",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 3000),
  // Phase 2.5
  adminPassword: process.env.ADMIN_PASSWORD ?? "area-admin-2026",
  maintenanceMode: process.env.MAINTENANCE_MODE === "true",
  rateLimitGlobal: Number(process.env.RATE_LIMIT_GLOBAL ?? 100),
  rateLimitAnalysis: Number(process.env.RATE_LIMIT_ANALYSIS ?? 15),
};
