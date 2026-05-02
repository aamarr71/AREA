# AREA — Projekt-Briefing für Claude (Permanente Projektdatei)

> **Zweck:** Diese Datei liegt als Projektdatei im Claude-Projekt. Sie gibt Claude in jedem neuen Chat den vollständigen technischen und strategischen Kontext, ohne dass Amar etwas erklären muss.
>
> **Letzte Aktualisierung:** 2. Mai 2026
>
> **Regel:** Wenn sich der Projektstand ändert, sag Amar dass diese Datei aktualisiert werden muss.

---

## 1. Was ist AREA?

**AREA = Automated Real Estate Analyst** — ein B2B KI-Tool für Wiener Immobilienmakler.

**Was es tut:** Makler gibt einen Link zu einem Immobilien-Exposé ein (von willhaben.at, immobilien.at, oder der eigenen Makler-Website) und bekommt einen detaillierten Qualitätsreport zurück.

**Der Report hat 3 Stufen:**
- **Stufe 1 — Extraktion:** Alle Objektdaten aus dem Exposé ziehen (Preis, Fläche, Zimmer, Ausstattung, Baujahr, Adresse, Energieausweis, etc.)
- **Stufe 2 — Qualitätsprüfung:** Widersprüche aufdecken (z.B. "4 Zimmer im Titel aber 3 im Text"), fehlende Pflichtangaben identifizieren, Textqualität bewerten mit Score und konkreten Schwächen
- **Stufe 3 — Verkaufsstrategie:** Zielgruppen-Analyse, Top-5-Verkaufsargumente mit emotionalen Triggern, Einwand-Handling-Skripte für Makler, Marktpreisvergleich pro Wiener Bezirk, Verkaufsdauer-Prognose, optimiertes Kurz-Exposé

**Ampelsystem im Report:**
- Rot (#E63946) = kritisch
- Amber (#F4A261) = mittel
- Teal (#2A9D8F) = OK

**Übersetzungsfunktion:**
- Report kann per Toggle (DE | EN) auf Englisch umgeschaltet werden
- Labels wechseln sofort via Dictionary (`client/src/lib/translations.ts`)
- Dynamische GPT-Inhalte werden über DeepSeek API übersetzt (tRPC Endpoint `analysis.translate`)
- PII-Redaction vor DeepSeek-Calls (personenbezogene Daten werden automatisiert entfernt und nach Übersetzung wiederhergestellt)
- Erweiterbar für weitere Sprachen

---

## 2. Business-Modell

- B2B-Produkt, keine Consumer-App
- Kein Self-Signup — Kunden werden einzeln über Privatgespräche akquiriert
- Admin (Amar) legt Kunden manuell an via Magic-Link-Invite
- Monetarisierung: Direktverkauf, kein Abo am Anfang
- Zielmarkt: Wien und Umgebung
- Amar ist EPU (Einzelunternehmer), Gewerbe noch nicht angemeldet (freies Gewerbe IT-Dienstleistung, Magistrat/USP)

---

## 3. Tech-Stack

| Layer | Technologie |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui + Framer Motion |
| Routing (Frontend) | wouter |
| Backend | Express + tRPC + Zod |
| HTTP Client | axios |
| Datenbank | PostgreSQL (Railway) + Drizzle ORM |
| Auth | Session-Cookies (express-session + connect-pg-simple) + bcryptjs |
| Logging | Pino (JSON in Prod, pretty in Dev) |
| Security | Helmet, CORS (explizite Whitelist), express-rate-limit, SSRF-Schutz (DNS-Resolve + IP-Blacklist) |
| Monitoring | Health-Check-Endpoint (`/health`) — prüft Server + DB + n8n |
| Analyse-Engine | n8n Self-Hosted auf Railway (n8n-production-e5ae.up.railway.app) |
| LLM (Analyse) | GPT-4.1 (OpenAI) via n8n |
| LLM (Übersetzung) | DeepSeek-V3 (deepseek-chat) direkt aus Express-Backend |
| Design | "Swiss Precision" — internationaler Typografie-Stil, minimalistisch |
| Hosting | Railway Hobby Plan (area-production-773c.up.railway.app) |
| Package Manager | pnpm |
| Monorepo | Ja — client/ und server/ im selben Repo |

---

## 4. Architektur-Flow

```
User (Makler) loggt sich ein → Session-Cookie wird gesetzt
  ↓
User gibt Immobilien-URL ein
  ↓
React Frontend (client/src/pages/Home.tsx)
  ↓ tRPC Mutation: analysis.analyze (mit url + optional force)
  ↓ (protectedProcedure — nur eingeloggte User)
Express Backend (server/routers/analysis.ts)
  ↓ 1. SSRF-Check (validateURL)
  ↓ 2. Seite fetchen + SHA-256 Hash bilden
  ↓ 3. Cache-Check (URL + Hash)
  ↓    → Cache-Hit: Return cached data
  ↓    → Cache-Miss: weiter zu n8n
  ↓ 4. fetchWithRetry → n8n Webhook (45s Timeout, 1x Retry)
n8n Webhook (n8n-production-e5ae.up.railway.app/webhook/analyst)
  ↓
n8n Workflow: HTTP Request → HTML Extract → GPT-4.1
  ↓ JSON Response (6 mögliche Formate!)
Express Backend: Bulletproof Parser (safeParse + Shape 1-6 Erkennung)
  ↓ 5. Analyse in PostgreSQL persistieren
  ↓ 6. Cache setzen + Metriken loggen
  ↓ tRPC Response
React Frontend: AnalysisReport.tsx rendert den Report
```

**Übersetzungs-Flow (separat, nach Analyse):**
```
User klickt "EN" Toggle im Report
  ↓
Labels wechseln sofort (Dictionary, client-side)
  ↓ Gleichzeitig: tRPC Mutation: analysis.translate
Express Backend → PII-Redaction (Namen, Adressen, Telefonnummern ersetzen)
  ↓ DeepSeek API (https://api.deepseek.com)
  ↓ OpenAI-kompatibles API-Format, Model: deepseek-chat
  ↓ System-Prompt: Immobilien-Fachübersetzer DE→EN
DeepSeek Response → nummerierte Liste → Parser → JSON
  ↓ PII-Restoration (Platzhalter → Originaldaten)
  ↓ tRPC Response
React Frontend: Dynamische Felder ersetzen, Skeleton → Text
```

**Health-Check-Flow:**
```
Uptime-Monitor (extern) → GET /health (alle 60s)
  ↓
Express: healthHandler (vor Rate Limiter, vor Maintenance, kein Auth)
  ↓ 1. DB-Check: SELECT 1 (5s Timeout)
  ↓ 2. n8n-Check: GET auf Webhook-URL (5s Timeout, nur Erreichbarkeit)
  ↓ 3. Server-Uptime
  ↓
HTTP 200 + { status: "healthy", checks: {...} }
oder HTTP 503 + { status: "degraded" | "maintenance" }
```

**Kritisch:** Der n8n-Response kommt in 6 verschiedenen Formaten zurück (OpenAI Responses API, Chat Completions, n8n simplified, n8n langchain, already-parsed JSON, async webhook error). Der Parser handelt alle 6. Dieser Parser ist battle-tested und darf NICHT geändert werden.

**Doppelter Fetch:** Das Backend fetcht die Immobilien-Seite für den Content-Hash, n8n fetcht sie nochmal für die Analyse. Bewusst akzeptiert — der n8n-Workflow wird nicht angefasst.

---

## 5. Repo-Struktur

```
github.com/aamarr71/AREA (public)
Branch: standalone (aktiv, deployed auf Railway)
Branch: main (Manus-Original, Fallback)

server/
  _core/
    index.ts        — Server Entry Point (Express + Helmet + CORS + Health Check + Rate Limiting + Maintenance Mode + Session + Logging + tRPC)
    env.ts          — Environment Variables (DATABASE_URL, SESSION_SECRET, DEEPSEEK_API_KEY, adminPassword, maintenanceMode, rateLimits, customDomain)
    trpc.ts         — tRPC Init (publicProcedure, protectedProcedure, adminProcedure, router)
    context.ts      — tRPC Context (req, res, session)
    vite.ts         — Vite Dev Middleware + Static Serving (serveStatic für Production)
  db/
    connection.ts   — Drizzle + postgres.js Connection (max 5 connections)
    schema.ts       — Drizzle Schema: users, invites, analyses (PostgreSQL)
    seed.ts         — Admin-User Seed Script (pnpm db:seed)
    migrate.ts      — Migration Runner
  middleware/
    ssrf.ts         — SSRF-Schutz: validateURL() mit DNS-Resolve + IP-Blacklist
    logger.ts       — Pino Logger (JSON/pretty) + generateRequestId()
    fetchWithRetry.ts — n8n-Call Wrapper: 45s Timeout, 1x Retry, typed Errors
    cache.ts        — In-Memory Analyse-Cache: URL + Content-Hash, 60min TTL, max 200 Entries
    metrics.ts      — In-Memory Metrics Store: recordAnalysis(), getMetrics(), getRecentErrors()
    session.ts      — express-session + connect-pg-simple (Session-Cookies, 7d maxAge)
    auth.ts         — hashPassword(), verifyPassword(), generateInviteToken()
    deepseek.ts     — DeepSeek API Client: translateTexts(), translateAnalysis() + PII-Redaction (extractPII/restorePII)
  routers/
    health.ts       — Health-Check-Handler: DB + n8n + Server-Uptime (purer Express, kein tRPC, kein Auth)
    auth.ts         — Auth-Router: login, logout, me, acceptInvite
    admin.ts        — Admin-Router: createInvite, listUsers, toggleUser, stats, errors, clearCache
    analysis.ts     — Analysis-Router: analyze (protected), history, byId, translate (DeepSeek)
  types/
    express-session.d.ts — Session-Typing (userId, userRole, email)

client/
  src/
    App.tsx           — Frontend Router (wouter) + Auth-State (auth.me) + Route-Guards
    main.tsx          — React Entry Point
    pages/
      Home.tsx        — Hauptseite (URL-Input + ProgressBar + Report-Anzeige + Footer)
      Login.tsx       — Login-Seite (/login)
      Invite.tsx      — Invite-Accept-Seite (/invite/:token)
      Dashboard.tsx   — Analyse-History des eingeloggten Users (/dashboard)
      AdminDashboard.tsx — Admin-Metriken + User-Verwaltung unter /amar-stats (Session-Auth)
      Impressum.tsx   — Impressum (§ 5 ECG / § 25 MedienG) — CC-Auftrag für Texte + Styling liegt vor
      Datenschutz.tsx — Datenschutzerklärung (DSGVO Art. 13/14) — CC-Auftrag für Texte + Styling liegt vor
      NotFound.tsx    — 404
    components/
      AnalysisReport.tsx — Report-Rendering (komplex) + Sprach-Toggle (DE/EN) + DeepSeek-Übersetzung + Übersetzungs-ProgressBar
      ProgressBar.tsx — Wiederverwendbare animierte Progress-Bar (Fake-Progress mit Phasen-Labels)
      Map.tsx          — Kartenkomponente
      ErrorBoundary.tsx
      ui/              — shadcn/ui Komponenten
    lib/
      trpc.ts         — tRPC Client Setup
      translations.ts — i18n Dictionary (DE/EN) + t() Helper + tAmpel() für Ampelsystem-Wörter
      utils.ts
    hooks/
    contexts/
      ThemeContext.tsx

shared/
  types.ts
  const.ts

drizzle/
  migrations/       — Drizzle Migration Files

drizzle.config.ts   — Drizzle Kit Config (PostgreSQL)
```

**Middleware-Reihenfolge in `server/_core/index.ts`:**
```
1. Helmet
2. CORS
3. Health Check (GET /health) ← vor Rate Limiter, vor Maintenance
4. Rate Limiter global
5. Rate Limiter analysis-specific
6. Maintenance Mode
7. Request Logging
8. Body Parsers
9. Session
10. tRPC
11. Frontend (Vite/Static)
```

---

## 6. Projekt-Phasen

### Phase 1 — Manus-Entkopplung ✅ DONE
Das Projekt wurde ursprünglich von Manus (AI-Agent-Plattform) gebaut. Phase 1 hat alle Manus-Dependencies entfernt: OAuth, Storage, LLM-Proxy, SDK, Plugins, CDN-Referenzen. Standalone Express-Server aufgesetzt.

### Phase 2.5 — Sicherheit + Monitoring ✅ DONE
Zwischenphase vor User-Management. Fundament gehärtet. ENV erweitert, Helmet.js, Rate Limiting, SSRF-Schutz, Pino Logger, fetchWithRetry, In-Memory Cache, Metrics Store, Admin-Dashboard, Kill-Switch, trust proxy, Error-Detail-Logging.

### Phase 2 — Auth + Dashboard + PostgreSQL ✅ DONE
User-Management, persistente Datenbank, geschützte Routen. PostgreSQL (Railway), Drizzle ORM, Session-Cookies, Auth-Router, Admin-Router, Analysis-Router, Frontend: Login/Invite/Dashboard/Auth-Guards, Admin-Seed.

### Phase 3 — Security Hardening + DSGVO + Features

**Phase 3.1 — CORS ✅ DONE (28. April 2026)**
- `cors` Package, explizite Whitelist, `credentials: true`, `CUSTOM_DOMAIN` ENV

**Feature: Report-Übersetzung DE→EN ✅ DONE (28. April 2026)**
- Statische Labels via Dictionary, dynamische Inhalte via DeepSeek API
- Immobilien-Fachbegriffe im System-Prompt
- Kosten: < $0.01 pro Übersetzung

**Feature: Animierter Ladebalken ✅ DONE (28. April 2026)**
- Wiederverwendbare `ProgressBar.tsx`, Fake-Progress mit logarithmischer Verlangsamung

**Feature: PII-Redaction ✅ DONE (29. April 2026)**
- `extractPII()` + `restorePII()` in `deepseek.ts`
- Personenbezogene Daten werden vor DeepSeek-Calls automatisch entfernt
- 17 Unit Tests grün, deployed

**Feature: Rate-Limiter IPv6-Fix ✅ DONE (29. April 2026)**
- `ipKeyGenerator` Wrapper für korrekte IPv6-Erkennung

**Phase 3.2 — DSGVO ✅ DONE (29. April 2026)**
- Alle Datenflüsse identifiziert, Rechtsgrundlagen bestimmt
- `05_AREA_VERARBEITUNGSVERZEICHNIS.md` — Internes DSGVO-Dokument (Art. 30)
- `06_AREA_DATENSCHUTZERKLAERUNG.md` → v2 in `08_AREA_IMPRESSUM_DATENSCHUTZ_V2.md` (professionelles Anwaltsdeutsch)
- `07_AREA_IMPRESSUM.md` → v2 in `08_AREA_IMPRESSUM_DATENSCHUTZ_V2.md`
- Railway DPA: auto-akzeptiert via ToS ✅
- OpenAI DPA: Amar schließt ab (openai.com/policies/data-processing-addendum) ⚠️
- DeepSeek: Kein DPA nötig — erhält keine PII dank Redaction ✅

**Feature: Health-Check-Endpoint ✅ DONE (30. April 2026)**
- `GET /health` — prüft Server, PostgreSQL, n8n-Erreichbarkeit
- Purer Express (kein tRPC, kein Auth), vor Rate Limiter gemountet
- HTTP 200 (healthy) / HTTP 503 (degraded/maintenance)
- Health-Requests werden nicht geloggt (kein Log-Spam)
- 3 Tests, 15 Assertions, alle grün
- Commit: `e2518f3`

**Phase 3.3 — Spätere Härtung (bei Wachstum)**
- 2FA via TOTP
- Audit-Log
- User-Löschfunktion (komplett statt nur deaktivieren)
- Failed Login Logging
- Sentry / Error-Tracking

---

## 7. Geplante Features (CC-Aufträge liegen vor)

### 7.1 Impressum + Datenschutz Texte einbauen ⚠️ CC-AUFTRAG BEREIT
- **Auftrag:** `CC_AUFTRAG_IMPRESSUM_DSE_V2.md`
- **Texte:** `08_AREA_IMPRESSUM_DATENSCHUTZ_V2.md` (12-Abschnitte DSE im Anwaltsdeutsch + vollständiges Impressum)
- **Was:** Platzhalter durch echte Texte ersetzen, institutionelles Styling (schmale Breite, enger Zeilenabstand, klickbares Inhaltsverzeichnis)
- **Dateien:** `Impressum.tsx`, `Datenschutz.tsx` (komplett neu)

### 7.2 Prompt-Upgrade: "Von Audit zu Assistent" ⚠️ CC-AUFTRAG BEREIT
- **Auftrag:** `CC_AUFTRAG_PROMPT_UPGRADE.md`
- **Was:** n8n System-Prompt erweitern:
  - ZARA v3.0 → AREA v3.0 umbenennen
  - Fehlende Angaben liefern: Gesetzesreferenz (EAVG, IMV, etc.) + Strafrahmen (€-Beträge) + Copy-Paste-Textbaustein
  - Hochwasser-Check via Prompt (Gewässernähe → HORA-Empfehlung)
  - Betriebskosten-Benchmark gegen Wiener Durchschnitt
  - Heizungsart-Intelligenz (wahrscheinlichster Energieträger nach Baujahr/Bezirk)
- **JSON-Erweiterung:** 3 optionale Felder pro fehlende Angabe: `rechtsgrundlage`, `konsequenz`, `textbaustein`
- **Bereich:** n8n Workflow (System-Prompt), kein Code im AREA-Repo

### 7.3 Flächenwidmung Wien — WFS-API Integration ⚠️ CC-AUFTRAG BEREIT
- **Auftrag:** `CC_AUFTRAG_FLAECHENWIDMUNG.md`
- **Was:** Automatische Flächenwidmungs-Abfrage für Wiener Adressen
  - Geocoding via Nominatim (OSM, kostenlos, 1 req/s)
  - Widmung via Wien WFS-API (data.wien.gv.at, kostenlos, CC-BY 4.0)
  - Automatischer Widmungs-Widerspruch (Exposé-Nutzung vs. tatsächliche Widmung)
- **Neue Dateien:** `server/middleware/geocoding.ts`, `server/middleware/flaechenwidmung.ts`
- **Änderungen:** `server/routers/analysis.ts` — optional Widmung nach Analyse abfragen
- **Graceful Degradation:** Wenn irgendwas fehlschlägt → Analyse läuft ohne Widmungsdaten

### 7.4 Report-Frontend: Actionable Links + Copy-Textbausteine ⚠️ CC-AUFTRAG BEREIT
- **Auftrag:** `CC_AUFTRAG_REPORT_FRONTEND.md`
- **Abhängigkeit:** Setzt 7.2 + 7.3 voraus
- **Was:**
  - Aufklappbare Rechtsgrundlage + Konsequenz bei fehlenden Angaben
  - Copy-to-Clipboard Textbausteine mit visuell hervorgehobenen Lücken (__)
  - WKO/HORA-Links bei relevanten fehlenden Angaben
  - Neue Standort-Sektion mit Widmungsdaten + Widerspruch-Warnung
  - Rückwärtskompatibel (alte Analysen ohne neue Felder rendern weiterhin)
- **Dateien:** `AnalysisReport.tsx`, `translations.ts`, `deepseek.ts`

### CC-Auftrags-Reihenfolge:
```
7.1 (Impressum/DSE)     → kann sofort
7.2 (Prompt-Upgrade)     → kann sofort (n8n, unabhängig)
7.3 (Flächenwidmung)     → kann sofort (Backend, unabhängig)
7.4 (Report-Frontend)    → NACH 7.2 + 7.3
```

---

## 8. n8n Workflow

- **Instanz:** n8n Self-Hosted auf Railway (n8n-production-e5ae.up.railway.app)
- **Webhook-URL:** https://n8n-production-e5ae.up.railway.app/webhook/analyst
- **Webhook:** Empfängt GET mit `?url=...`
- **Flow:** HTTP Request (holt Exposé-Seite) → HTML Extract (Body-Text) → GPT-4.1 (Analyse) → JSON Response
- **System-Prompt:** Heißt intern noch "ZARA v3.0" — wird zu "AREA v3.0" umbenannt (CC-Auftrag 7.2)
- **10 Pflichtprüfungen:** Zimmeranzahl, Baujahr vs Neubau-Flag, Betriebskosten/m², Energieausweis, Adresse vs PLZ, und weitere
- **Wiener Markt-Referenzpreise** pro Bezirk (1010-1230) im Prompt hinterlegt
- **Regel:** Textqualität-Score nie über 70 außer bei wirklich exzellentem Text
- **Sprache:** Österreichisches Deutsch (Top, Betriebskosten, Provision, Stiege)
- **Eigene PostgreSQL-Instanz:** n8n hat eine separate Postgres-DB auf Railway (nicht dieselbe wie AREA)

---

## 9. Bekannte Probleme / Risiken

1. **n8n Webhook async-Bug** — gefixt, kann wiederkommen (besonders nach n8n-Updates)
2. **GPT-4.1 invalid JSON** — Parser handelt bekannte Quirks, neue können kommen
3. **In-Memory Metriken** — Gehen bei Restart verloren. Analysen selbst sind in PostgreSQL persistiert.
4. **Dynamische Seiten-Inhalte** — Tracking-Pixel, Werbung können den Content-Hash ändern → Cache greift nie.
5. **DNS-Rebinding** — Theoretisches SSRF-Restrisiko. Vor Produktivbetrieb evaluieren.
6. **Kein Passwort-Reset** — Wenn ein Kunde sein Passwort vergisst, muss Amar manuell eingreifen.
7. **User nur deaktivierbar, nicht löschbar** — Echte Löschfunktion kommt in Phase 3.3.
8. **Railway Budget** — Hobby Plan ($5/Monat). AREA-Server + n8n + 2x Postgres laufen gleichzeitig.
9. **DeepSeek-Übersetzung nicht persistiert** — Wird bei jedem EN-Klick neu generiert. Bei Bedarf Caching ergänzen.
10. **HORA hat keine API** — Hochwasserdaten sind nur als WMS-Kartenbild abrufbar, nicht als strukturierte Daten. Deshalb Prompt-basierter Ansatz (GPT schätzt Gewässernähe) + Link für manuellen Check.

---

## 10. Environment Variables

```
# Aktiv (in Railway gesetzt)
DATABASE_URL=           # PostgreSQL Connection String (Railway)
N8N_WEBHOOK_URL=        # https://n8n-production-e5ae.up.railway.app/webhook/analyst
NODE_ENV=production
SESSION_SECRET=         # Zufälliger 64-Hex-String für Cookie-Signierung
DEEPSEEK_API_KEY=       # DeepSeek API Key für Report-Übersetzung
ADMIN_PASSWORD=         # Legacy — wird von Session-Auth ersetzt, noch für Fallback

# Optional (Defaults greifen wenn nicht gesetzt)
MAINTENANCE_MODE=       # "true" = Kill-Switch, alle API-Routes → 503
RATE_LIMIT_GLOBAL=      # Default: 100 (Requests pro Minute, alle Routes)
RATE_LIMIT_ANALYSIS=    # Default: 15 (Analysen pro Minute pro IP)
CUSTOM_DOMAIN=          # Custom Domain für CORS-Whitelist (z.B. "area.example.com")
```

---

## 11. Railway Deployment

- **URL:** https://area-production-773c.up.railway.app
- **Health-Check:** https://area-production-773c.up.railway.app/health
- **Plan:** Hobby ($5/Monat Guthaben)
- **Branch:** standalone
- **Build Command:** pnpm build
- **Start Command:** pnpm start
- **Auto-Deploy:** Bei Push auf standalone

**Services im AREA-Projekt:**
| Service | Funktion | Status |
|---------|----------|--------|
| AREA | Express-Server (Frontend + Backend) | Online |
| n8n | Self-Hosted n8n Workflow-Engine | Online |
| Postgres (AREA-DB) | PostgreSQL für User, Sessions, Analysen | Online |
| Postgres (n8n-DB) | PostgreSQL für n8n-interne Daten | Online |

---

## 12. BLOCKER vor erstem Kunden

| # | Was | Status |
|---|-----|--------|
| 1 | PII-Redaction deployen | ✅ Done |
| 2 | OpenAI DPA abschließen | ⚠️ Amar (openai.com/policies/data-processing-addendum) |
| 3 | Impressum + DSE Texte einbauen | ⚠️ CC-Auftrag bereit |
| 4 | Gewerbe anmelden | ⚠️ Amar (freies Gewerbe IT, Magistrat/USP) |
| 5 | Railway E-Mail-Alerts / Uptime-Monitor | ⚠️ Amar (BetterStack/UptimeRobot → /health Endpoint) |
| 6 | DeepSeek Guthaben | ✅ Aufgeladen |
| 7 | Health-Check-Endpoint | ✅ Done (Commit e2518f3) |

---

## 13. Merkliste NACH LAUNCH

1. **Prompt-Upgrade** — Gesetzesreferenzen, Strafrahmen, Textbausteine (CC-Auftrag 7.2 bereit)
2. **Flächenwidmung Wien** — WFS-API Integration (CC-Auftrag 7.3 bereit)
3. **Report-Frontend: Actionable Links** — Copy-Textbausteine, HORA-Links, Standort-Sektion (CC-Auftrag 7.4 bereit)
4. **User-Löschfunktion + auto-Löschung** (Art. 17 DSGVO)
5. **n8n eliminieren** — OpenAI direkt aus Backend
6. **Weitere Sprachen** — Übersetzungs-Architektur steht
7. **DeepSeek als Analyse-Engine** — Infrastruktur steht, Testing nötig
8. **Übersetzungs-Caching** — Übersetzte Reports in DB speichern
9. **HORA API-Zugang** — Beim LFRZ anfragen ob API für kommerzielle Nutzung verfügbar (langfristig)

---

## 14. Dokument-Konvention

Alle Projektdokumente werden aufsteigend nummeriert:
- `01_AREA_PROJECT_BRIEFING.md` (dieses Dokument, aktuell v5)
- `02_AREA_HANDOFF_CLAUDE_SESSION.md`
- `05_AREA_VERARBEITUNGSVERZEICHNIS.md`
- `06_AREA_DATENSCHUTZERKLAERUNG.md` (v1, ersetzt durch 08)
- `07_AREA_IMPRESSUM.md` (v1, ersetzt durch 08)
- `08_AREA_IMPRESSUM_DATENSCHUTZ_V2.md` (aktuelle Version, Anwaltsdeutsch)

CC-Aufträge:
- `CC_AUFTRAG_IMPRESSUM_DSE_V2.md`
- `CC_AUFTRAG_PROMPT_UPGRADE.md`
- `CC_AUFTRAG_FLAECHENWIDMUNG.md`
- `CC_AUFTRAG_REPORT_FRONTEND.md`
- `CC_AUFTRAG_HEALTH_CHECK.md` (✅ erledigt)

---

## 15. Kommunikation

- **Sprache:** Deutsch
- **Stil:** Direkt, kein Bullshit. Ruthless Mentor Modus.
- **Codewort:** "AREA-STANDALONE" = Amar bezieht sich auf dieses Projekt
- **Code-Kommentare:** Englisch
- **User-facing Strings:** Deutsch (+ Englisch via Übersetzung)
- **Workflow:** Claude gibt Arbeitsaufträge als MD-Dateien → Amar übergibt an Claude Code → CC schreibt Code → Claude prüft Ergebnis
- **Revert-Plan:** Bei Problemen → `git revert <commit-hash>` + push → Railway deployt automatisch den alten Stand
