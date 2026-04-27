export const ENV = {
  // Existing (Phase 1)
  databaseUrl: process.env.DATABASE_URL ?? "",
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL ?? "https://n8n-production-e5ae.up.railway.app/webhook/analyst",
  isProduction: process.env.NODE_ENV === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  // Phase 2.5
  adminPassword: process.env.ADMIN_PASSWORD ?? "area-admin-2026",
  maintenanceMode: process.env.MAINTENANCE_MODE === "true",
  rateLimitGlobal: Number(process.env.RATE_LIMIT_GLOBAL ?? 100),
  rateLimitAnalysis: Number(process.env.RATE_LIMIT_ANALYSIS ?? 15),
  // Phase 2 (Auth)
  sessionSecret: process.env.SESSION_SECRET ?? "area-dev-secret-change-in-prod",
  // Phase 3.1 (CORS)
  customDomain: process.env.CUSTOM_DOMAIN ?? "",
  // Phase 3 Feature (DeepSeek Übersetzung)
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
};
