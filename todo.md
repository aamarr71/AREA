# AREA TODO

## Phase 1 — Manus-Entkopplung ✅
- [x] server/_core/ von Manus-SDK befreit (trpc, context, env neu geschrieben)
- [x] server/_core/{llm,map,imageGeneration,voiceTranscription,notification,sdk,dataApi,oauth,cookies}.ts gelöscht
- [x] server/storage.ts gelöscht (Manus Storage Proxy)
- [x] server/db.ts + drizzle/ geleert (Phase 2 baut neues Schema auf)
- [x] server/routers.ts: nur noch analysis.analyze, kein auth/system mehr
- [x] vite.config.ts: Manus-Plugins raus
- [x] client: DashboardLayout, ManusDialog, AIChatBox, _core/hooks gelöscht
- [x] client/main.tsx: Auth-Redirect-Logik raus
- [x] package.json: Manus-Dependencies raus (vite-plugin-manus-runtime, jose, cookie, mysql2, drizzle-*, aws-sdk)

## Phase 2 — Auth + Dashboard (nächster Chat)
- [ ] Drizzle Schema: users, invites, analyses
- [ ] bcrypt + JWT Session-Management
- [ ] Admin-Router: User anlegen, Invite-Token generieren
- [ ] Auth-Router: login, logout, invite-accept
- [ ] analysis-Router: protected procedure + History persistieren
- [ ] Frontend: /login, /invite/:token, /dashboard
- [ ] Analyse-History im Dashboard

## Phase 3 — Cybersecurity Integration
- [ ] Helmet + express-rate-limit + CORS
- [ ] SSRF-Whitelist für Immobilien-Portale
- [ ] DSGVO: Privacy Policy, Impressum, AVV
- [ ] Sentry für Error-Tracking
- [ ] 2FA (optional, später)
