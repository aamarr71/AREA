# Session Summary — AREA

> **Datum:** 25. April 2026
> **Branch:** `standalone`
> **Letzter Commit:** `bd25c4d` — polish: wouter Link im Footer + technische Fehler-Details im Dashboard

---

## Was in dieser Session passiert ist

### 1. Briefing eingelesen
- `AREA_INSTRUCTIONS_CLAUDE_CODE-1.md` komplett gelesen
- Memory-Files für das Projekt angelegt (user_profile, project_overview, critical_rules, open_tasks)

### 2. Kleine Polish-Tasks aus Phase 2.5 abgeschlossen
Drei der "bekannten offenen Punkte" aus dem Briefing wurden umgesetzt:

**Code-Änderungen (4 Files, +20/-10):**
- `client/src/pages/Home.tsx` — Footer Impressum/Datenschutz: `<a href>` → wouter `<Link href>` (kein Full-Page-Reload mehr)
- `server/middleware/fetchWithRetry.ts` — `AnalysisTimeoutError` & `AnalysisWebhookError` haben jetzt `detail`-Property mit technischem Grund (ECONNREFUSED, ETIMEDOUT, HTTP 500/502, etc.)
- `server/routers.ts` — `recordAnalysis()` loggt `error.detail || error.message`
- `client/src/pages/AdminDashboard.tsx` — Error-Spalte: `truncate` → `break-words` (volle Fehler-Message sichtbar)

### 3. Commit + Push → Railway Auto-Deploy
- Commit `bd25c4d` auf `standalone` gepusht
- Railway hat automatisch deployed

### 4. Bug-Diagnose nach User-Test
User meldete "Analyse-Service nicht erreichbar" auf Production.

**Diagnose aus Railway-Logs (`logs.1776859174667.json`):**
```
n8n_request → aamarr71.app.n8n.cloud/webhook/analyst
n8n_retry reason: server_error
AnalysisWebhookError detail: HTTP 500   ← beide Versuche
```

**Backend-Flow funktioniert korrekt:**
1. ✅ SSRF-Check OK
2. ✅ Willhaben-Seite gefetcht (~700ms)
3. ✅ Cache-Miss
4. ❌ n8n-Webhook antwortet sofort mit **HTTP 500** (kein Timeout)
5. ❌ Retry nach 3s → wieder HTTP 500
6. ✅ Error korrekt propagiert mit `detail: HTTP 500`

**Root-Cause liegt bei n8n, nicht im Code.** Mögliche Ursachen:
- OpenAI API Key abgelaufen / Quota / Billing
- n8n-Workflow-Node kaputt (z.B. HTML-Extract weil willhaben-DOM sich geändert hat)
- n8n Cloud Incident

**Positiver Nebeneffekt:** Das neue Error-Detail-Logging hat den 500er sofort sichtbar gemacht — vorher hätte nur "Analyse-Service nicht erreichbar" im Dashboard gestanden.

---

## Aktueller Stand

### Code
- Alle Phase-2.5-Polish-Tasks erledigt und deployed
- Repo ist clean, alles auf `origin/standalone`

### Production
- ⚠️ **n8n-Webhook wirft aktuell HTTP 500** — Amar muss in `aamarr71.app.n8n.cloud` einsteigen, Workflow "analyst" manuell ausführen und den fehlerhaften Node identifizieren
- App selbst läuft, Maintenance-Mode nicht aktiv, Admin-Dashboard erreichbar

### Phase 2 (Auth + MySQL + Dashboard)
- **Noch nicht begonnen** — war für nach dem Push geplant, durch n8n-Bug verzögert
- Geplante Komponenten unverändert:
  - MySQL (Railway Add-On oder PlanetScale)
  - Drizzle Schema: users, invites, analyses
  - bcrypt + JWT Sessions
  - Admin-Router: User anlegen, Invite-Token (Magic-Link)
  - Auth-Router: login, logout, invite-accept, set-password
  - Frontend: /login, /invite/:token, /dashboard mit History
  - Metriken von In-Memory → DB
- **Noch zu klären vor Start:** JWT vs. Session-Cookies, DB-Provider, DSGVO

---

## Nächste Schritte

1. **Sofort:** Amar prüft n8n-Workflow → Fix HTTP 500
2. **Verifizieren:** Eine willhaben-URL nochmal analysieren, Report muss kommen
3. **Dann:** Phase 2 starten — beginnen mit Architektur-Entscheidungen (DB-Provider, Auth-Strategie)

---

## Kritische Regeln (unverändert)

1. ❌ 6-Format-Parser in `server/routers.ts` (~Zeile 73–143) NICHT ändern
2. ❌ `server/_core/trpc.ts` und `context.ts` bis Phase-2-Start eingefroren
3. ❌ n8n-Workflow nicht anfassen (auch wenn er gerade kaputt ist — Amar fixt das in der n8n-UI)
4. ❌ Doppelter Fetch (Backend + n8n) ist bewusst, nicht optimieren
