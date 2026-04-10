# AREA — Automated Real Estate Analyst

KI-gestützte Qualitätsprüfung für Immobilien-Exposés. Standalone-Version (ohne Manus-Hosting-Abhängigkeit).

## Stack
- **Frontend**: React 19 + Vite + Tailwind + shadcn/ui + Framer Motion
- **Backend**: Express + tRPC + Zod
- **Analyse-Engine**: n8n Workflow mit GPT-4.1 (extern, auf n8n Cloud)

## Setup (lokal)

```bash
# 1. Dependencies installieren
pnpm install

# 2. Environment konfigurieren
cp .env.example .env
# .env editieren, N8N_WEBHOOK_URL setzen

# 3. Dev-Server starten
pnpm dev
```

App läuft dann auf http://localhost:3000

## Deployment (Railway)

1. Neues Railway-Projekt, GitHub-Repo verbinden
2. Environment Variable setzen: `N8N_WEBHOOK_URL`
3. Build-Command: `pnpm install && pnpm build`
4. Start-Command: `pnpm start`

Railway setzt `PORT` und `NODE_ENV=production` automatisch.

## Architektur

```
Frontend (React)
  ↓ tRPC
Backend (Express)
  ↓ HTTP GET
n8n Webhook (extern)
  ↓
GPT-4.1 (Analyse)
  ↓ JSON
Frontend (Report-Rendering)
```

## Roadmap
- **Phase 1** ✅ Manus-Entkopplung, Standalone-Setup
- **Phase 2** Auth-Layer (Admin Magic-Link), User-Dashboard mit Analyse-History
- **Phase 3** Cybersecurity Integration (bcrypt, rate-limiting, SSRF-Whitelist, DSGVO)
