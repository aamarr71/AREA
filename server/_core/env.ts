export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL ?? "https://aamarr71.app.n8n.cloud/webhook/analyst",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 3000),
};
