# AREA — Projekt-Briefing für Claude (Permanente Projektdatei)

> **Zweck:** Diese Datei liegt als Projektdatei im Claude-Projekt. Sie gibt Claude in jedem neuen Chat den vollständigen technischen und strategischen Kontext, ohne dass Amar etwas erklären muss.
>
> **Letzte Aktualisierung:** 27. April 2026
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

---

## 2. Business-Modell

- B2B-Produkt, keine Consumer-App
- Kein Self-Signup — Kunden werden einzeln über Privatgespräche akquiriert
- Admin (Amar) legt Kunden manuell an via Magic-Link-Invite
- Monetarisierung: Direktverkauf, kein Abo am Anfang
- Zielmarkt: Wien und Umgebung

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
| Security | Helmet, express-rate-limit, SSRF-Schutz (DNS-Resolve + IP-Blacklist) |
| Analyse-Engine | n8n Self-Hosted auf Railway (n8n-production-e5ae.up.railway.app) |
| LLM | GPT-4.1 (OpenAI) via n8n |
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

**Kritisch:** Der n8n-Response kommt in 6 verschiedenen Formaten zurück (OpenAI Responses API, Chat Completions, n8n simplified, n8n langchain, already-parsed JSON, async webhook error). Der Parser handelt alle 6. Dieser Parser ist battle-tested und darf NICHT geändert werden.

**Doppelter Fetch:** Das Backend fetcht die Immobilien-Seite für den Content-Hash, n8n fetcht sie nochmal für die Analyse. Bewusst akzeptiert — der n8n-Workflow wird nicht angefasst.

---

## 5. Repo-Struktur

```
github.com/aamarr71/AREA
Branch: standalone (aktiv, deployed auf Railway)
Branch: main (Manus-Original, Fallback)

server/
  _core/
    index.ts        — Server Entry Point (Express + Helmet + Rate Limiting + Maintenance Mode + Session + Logging + tRPC)
    env.ts          — Environment Variables (DATABASE_URL, SESSION_SECRET, adminPassword, maintenanceMode, rateLimits)
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
  routers/
    auth.ts         — Auth-Router: login, logout, me, acceptInvite
    admin.ts        — Admin-Router: createInvite, listUsers, toggleUser, stats, errors, clearCache
    analysis.ts     — Analysis-Router: analyze (protected), history
  types/
    express-session.d.ts — Session-Typing (userId, userRole, email)

client/
  src/
    App.tsx           — Frontend Router (wouter) + Auth-State (auth.me) + Route-Guards
    main.tsx          — React Entry Point
    pages/
      Home.tsx        — Hauptseite (URL-Input + Report-Anzeige + Footer)
      Login.tsx       — Login-Seite (/login)
      Invite.tsx      — Invite-Accept-Seite (/invite/:token)
      Dashboard.tsx   — Analyse-History des eingeloggten Users (/dashboard)
      AdminDashboard.tsx — Admin-Metriken + User-Verwaltung unter /amar-stats (Session-Auth)
      Impressum.tsx   — Platzhalter (§ 5 ECG / § 25 MedienG)
      Datenschutz.tsx — Platzhalter (DSGVO)
      NotFound.tsx    — 404
    components/
      AnalysisReport.tsx — Report-Rendering (komplex)
      Map.tsx          — Kartenkomponente
      ErrorBoundary.tsx
      ui/              — shadcn/ui Komponenten
    lib/
      trpc.ts         — tRPC Client Setup
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

---

## 6. Projekt-Phasen

### Phase 1 — Manus-Entkopplung ✅ DONE
Das Projekt wurde ursprünglich von Manus (AI-Agent-Plattform) gebaut. Phase 1 hat alle Manus-Dependencies entfernt: OAuth, Storage, LLM-Proxy, SDK, Plugins, CDN-Referenzen. Standalone Express-Server aufgesetzt.

### Phase 2.5 — Sicherheit + Monitoring ✅ DONE
Zwischenphase vor User-Management. Fundament gehärtet.

**Was gebaut wurde:**
1. **ENV erweitert** — adminPassword, maintenanceMode, rateLimitGlobal, rateLimitAnalysis
2. **Helmet.js** — Security-HTTP-Headers (CSP, X-Frame-Options, etc.)
3. **Rate Limiting** — Global 100 req/min + Analyse 15 req/min/IP via express-rate-limit
4. **SSRF-Schutz** — DNS-Resolve + IP-Blacklist (127.x, 10.x, 172.x, 192.168.x, 169.254.x, IPv6-Äquivalente)
5. **Pino Logger** — Strukturiertes JSON-Logging in Production, pretty in Dev, Request-IDs
6. **fetchWithRetry** — n8n-Call Wrapper mit 45s Timeout (statt 180s), 1x Retry bei Timeout/5xx/Netzwerk, typed Errors
7. **In-Memory Cache** — URL + Content-Hash (SHA-256), 60min TTL, max 200 Entries, Force-Refresh-Option
8. **Metrics Store** — Analyse-Tracking (Erfolg/Fehler/Cache-Hits/Dauer/Kosten), In-Memory + Pino-Logs für Persistenz
9. **Admin-Dashboard** — /amar-stats mit Metriken-Cards, Fehler-Tabelle, Cache-Leeren, Recharts
10. **Impressum & Datenschutz** — Platzhalter-Seiten mit Footer-Links (wouter `<Link>`)
11. **Kill-Switch** — MAINTENANCE_MODE ENV → 503 auf alle API-Routes + Frontend-Wartungsseite
12. **trust proxy** — Für korrekte IP-Erkennung hinter Railway's Reverse-Proxy
13. **Error-Detail-Logging** — fetchWithRetry Error-Klassen mit `detail`-Property (technischer Grund sichtbar im Dashboard)

**Deployment-Bugs die gefixed wurden:**
- esbuild Output-Pfad (`dist/index.js` statt `dist/_core/index.js`)
- Static File Path + Node.js crypto Import (ESM-Kompatibilität)
- IPv6-Problem bei Rate Limiting (`trust proxy` fehlte)

### Phase 2 — Auth + Dashboard + PostgreSQL ✅ DONE
User-Management, persistente Datenbank, geschützte Routen. Commit `7d20121`.

**Was gebaut wurde:**
1. **PostgreSQL** — Railway Add-On, Drizzle ORM, postgres.js Driver
2. **Drizzle Schema** — Tabellen: users (id, email, name, passwordHash, role, isActive), invites (token, email, expiresAt), analyses (userId, url, result, status, durationMs)
3. **Session-Cookies** — express-session + connect-pg-simple, Sessions in PostgreSQL, 7 Tage maxAge, httpOnly, secure, sameSite: lax
4. **Auth-Router** — login, logout, me, acceptInvite (mit bcryptjs Passwort-Hashing)
5. **Admin-Router** — createInvite (Magic-Link), listUsers, toggleUser (aktivieren/deaktivieren), plus bestehende stats/errors/clearCache (von Basic-Auth auf Session-Auth migriert)
6. **Analysis-Router** — protectedProcedure (nur eingeloggte User), Analyse-Ergebnisse werden in PostgreSQL persistiert, history Endpoint
7. **Frontend: Login** — /login Seite, E-Mail + Passwort, Redirect zu Home bei Erfolg
8. **Frontend: Invite** — /invite/:token, Passwort setzen, sofort eingeloggt
9. **Frontend: Dashboard** — /dashboard mit Analyse-History pro User
10. **Frontend: Auth-Guards** — Nicht-eingeloggte User → Redirect zu /login, Admin-Dashboard nur für role: admin
11. **Admin-Dashboard** — Von Passwort-Auth auf Session-Auth umgestellt, neuer Tab: User-Verwaltung (einladen, deaktivieren)
12. **Admin-Seed** — `pnpm db:seed` Script für initialen Admin-Account

**Auth-Flow:**
- Admin (Amar) legt neuen Kunden im Admin-Dashboard an → generiert Magic-Link-Invite
- Amar schickt Link manuell an Kunden (B2B, persönlicher Kontakt)
- Kunde öffnet Link → setzt Passwort → ist sofort eingeloggt
- Login: E-Mail + Passwort → Session-Cookie → 7 Tage gültig
- Kein Self-Signup, kein Passwort-Reset (Phase 3)

### Phase 3 — Security Hardening + DSGVO (ALS NÄCHSTES)
- Phase 3.1 (vor Launch): CORS konfigurieren
- Phase 3.2 (vor erstem Kunden): DSGVO-Texte (Datenschutzerklärung, Impressum echt), AVVs mit Railway/OpenAI/n8n, Logging für failed logins, Sentry
- Phase 3.3 (bei Wachstum): 2FA via TOTP, Audit-Log, Security-Reviews, User-Löschfunktion (komplett statt nur deaktivieren)

### Geplant: DeepSeek als Alternative
- Ziel: Kosten senken bei vergleichbarer Qualität
- Muss getestet werden ob DeepSeek die JSON-Struktur zuverlässig liefert
- Könnte als Fallback oder günstigere Tier-Option kommen

### Option: n8n eliminieren
- OpenAI direkt aus dem Express-Backend rufen (kein Middleman)
- Eliminiert: doppelten Fetch, 6 Response-Formate, externe n8n-Dependency
- Nicht dringend, aber langfristig die sauberste Architektur

---

## 7. n8n Workflow

- **Instanz:** n8n Self-Hosted auf Railway (n8n-production-e5ae.up.railway.app)
- **Webhook-URL:** https://n8n-production-e5ae.up.railway.app/webhook/analyst
- **Webhook:** Empfängt GET mit `?url=...`
- **Flow:** HTTP Request (holt Exposé-Seite) → HTML Extract (Body-Text) → GPT-4.1 (Analyse) → JSON Response
- **System-Prompt:** Heißt intern noch "ZARA v3.0", wird zu "AREA v3.0" umbenannt
- **10 Pflichtprüfungen:** Zimmeranzahl, Baujahr vs Neubau-Flag, Betriebskosten/m², Energieausweis, Adresse vs PLZ, und weitere
- **Wiener Markt-Referenzpreise** pro Bezirk (1010-1230) im Prompt hinterlegt
- **Regel:** Textqualität-Score nie über 70 außer bei wirklich exzellentem Text
- **Sprache:** Österreichisches Deutsch (Top, Betriebskosten, Provision, Stiege)
- **Eigene PostgreSQL-Instanz:** n8n hat eine separate Postgres-DB auf Railway (nicht dieselbe wie AREA)

**Bekannter Bug:** n8n Webhook war mal auf async konfiguriert → gibt `{ message: "Workflow was started" }` zurück statt dem Ergebnis. Parser erkennt das und wirft spezifischen Error. Kann nach n8n-Updates wiederkommen.

**GPT-4.1 Quirk:** Gibt manchmal `6_500` statt `6500` in JSON zurück. safeParse-Funktion fixt das mit Regex.

**Historie:** n8n lief ursprünglich auf n8n Cloud (aamarr71.app.n8n.cloud). Wegen Kosten auf Self-Hosted migriert (April 2026). Workflow als JSON exportiert und importiert, OpenAI Credential neu angelegt.

---

## 8. Bekannte Probleme / Risiken

1. **n8n Webhook async-Bug** — gefixt, kann wiederkommen (besonders nach n8n-Updates)
2. **GPT-4.1 invalid JSON** — Parser handelt bekannte Quirks, neue können kommen
3. **In-Memory Metriken** — Gehen bei Restart verloren. Analysen selbst sind in PostgreSQL persistiert. Metriken werden zusätzlich via Pino in Railway-Logs geschrieben.
4. **Dynamische Seiten-Inhalte** — Tracking-Pixel, Werbung, CSRF-Token können den Content-Hash bei jedem Request ändern → Cache greift nie. Akzeptiert für jetzt, nur Kosteneffekt.
5. **DNS-Rebinding** — Theoretisches SSRF-Restrisiko. Vor Produktivbetrieb mit echten Kundendaten evaluieren.
6. **Kein Passwort-Reset** — Wenn ein Kunde sein Passwort vergisst, muss Amar manuell eingreifen. Phase 3.
7. **User nur deaktivierbar, nicht löschbar** — Bewusste Entscheidung (Datenintegrität). Echte Löschfunktion kommt in Phase 3.3.
8. **Railway Budget** — Hobby Plan ($5/Monat). AREA-Server + n8n + 2x Postgres laufen gleichzeitig. Budget im Auge behalten.

---

## 9. Frühere Analysen (Kontext)

Claude hat in früheren Sessions 3 echte Exposés von ZAKARYAN & PARTNER analysiert:

1. **Wien 17. Bezirk** (Objekt 6144) — 3-Zi-Wohnung, 73m², 400.000€. Kritisch: "Neubau: Ja" bei Baujahr 1969, MA50-Mietzinsbildung ungeklärt. Konfidenz 0.72.
2. **Kierling/Klosterneuburg** (Objekt 6138) — Haus, 112m², 620.000€. Kritisch: "Balkonfläche 165m²" (war Gartenfläche), "vermutlich Asbest" im Text, 5x "vermutlich". Konfidenz 0.78.
3. **Baden bei Wien** (Objekt 6135) — Haus, 180m², 400.000€. Kritisch: HQ300-Erklärung statistisch falsch, 0 Innenfotos bei 13 Bildern, 0 Bäder/0 Toiletten in Fakten. Konfidenz 0.58.

Wiederkehrende Patterns: Hedging-Sprache ("vermutlich", "augenscheinlich"), fehlende Innenfotos, falsche System-Flags (Neubau bei Altbau), unklare rechtliche Situationen.

---

## 10. Team-Rollen

- **Amar** — Projektinhaber, Entscheidungsträger, ITP-Student in Wien
- **Claude (Anthropic)** — Architekt, Sparring-Partner, Qualitätskontrolle. Gibt Arbeitsanweisungen für Claude Code.
- **Claude Code** — Haupt-Entwickler. Schreibt den Code basierend auf Claude's Arbeitsaufträgen.
- **Manus** — Hat das Original gebaut. Credits aufgebraucht, nur bei Bedarf
- **DeepSeek** — Strategisches Denken, Deep Reasoning, Pläne validieren, Risiken identifizieren

---

## 11. Kommunikation

- **Sprache:** Deutsch
- **Stil:** Direkt, kein Bullshit. Ruthless Mentor Modus — wenn was schlecht ist, sag es. Stress-teste alles bis es bulletproof ist. Erkläre Konzepte so dass ein ITP-Student sie versteht.
- **Codewort:** "AREA-STANDALONE" = Amar bezieht sich auf dieses Projekt
- **Code-Kommentare:** Englisch
- **User-facing Strings:** Deutsch
- **Workflow:** Claude gibt Arbeitsaufträge als MD-Dateien → Amar übergibt an Claude Code → CC schreibt Code → Claude prüft Ergebnis

---

## 12. Offene Merkliste

1. **Railway E-Mail-Alerts** — Konfigurieren für Fehler-Benachrichtigung. Kein Code nötig. VOR erstem Kunden.
2. **Impressum + Datenschutz** — Platzhalter durch echte Texte ersetzen VOR Launch.
3. **n8n Prompt** — System-Prompt von "ZARA v3.0" → "AREA v3.0" umbenennen.
4. **DSGVO klären** — WKO-Beratung, AVVs mit Railway/OpenAI/n8n abschließen. VOR erstem Kunden.
5. **OPTION: n8n eliminieren** — OpenAI direkt aus Backend rufen. Nicht dringend, aber sauberste Architektur langfristig.
6. **User-Löschfunktion** — Komplett löschen statt nur deaktivieren. Phase 3.3.

---

## 13. Environment Variables

```
# Aktiv (in Railway gesetzt)
DATABASE_URL=           # PostgreSQL Connection String (Railway, automatisch verknüpft)
N8N_WEBHOOK_URL=        # https://n8n-production-e5ae.up.railway.app/webhook/analyst
NODE_ENV=production
SESSION_SECRET=         # Zufälliger 64-Hex-String für Cookie-Signierung
ADMIN_PASSWORD=         # Legacy — wird von Session-Auth ersetzt, noch für Fallback

# Optional (Defaults greifen wenn nicht gesetzt)
MAINTENANCE_MODE=       # "true" = Kill-Switch, alle API-Routes → 503
RATE_LIMIT_GLOBAL=      # Default: 100 (Requests pro Minute, alle Routes)
RATE_LIMIT_ANALYSIS=    # Default: 15 (Analysen pro Minute pro IP)
```

---

## 14. Railway Deployment

- **URL:** https://area-production-773c.up.railway.app
- **Plan:** Hobby ($5/Monat Guthaben)
- **Branch:** standalone
- **Build Command:** pnpm build
- **Start Command:** pnpm start
- **Auto-Deploy:** Bei Push auf standalone
- **trust proxy:** Aktiviert (`app.set("trust proxy", 1)`) für korrekte IP-Erkennung hinter Railway's Reverse-Proxy

**Services im AREA-Projekt:**
| Service | Funktion | Status |
|---------|----------|--------|
| AREA | Express-Server (Frontend + Backend) | Online |
| n8n | Self-Hosted n8n Workflow-Engine | Online |
| Postgres (AREA-DB) | PostgreSQL für User, Sessions, Analysen | Online |
| Postgres (n8n-DB) | PostgreSQL für n8n-interne Daten | Online |

---

## 15. Session-Management & Checkpoint-System

**Problem:** Claude-Sessions haben begrenzten Kontext. Bei Session-Wechsel geht Arbeitswissen verloren.

**Lösung — 4-Schichten-System:**

| Schicht | Was | Wann aktualisiert |
|---------|-----|-------------------|
| 1. `AREA_PROJECT_BRIEFING.md` | Architektur, Tech-Stack, Phasen, Repo-Struktur | Bei fundamentalen Änderungen (Phase abgeschlossen, Architektur-Entscheidung) |
| 2. Claude Memories | Projektstand, Merkliste, Konventionen (kurze Stichpunkte) | Laufend durch Claude |
| 3. Checkpoint-Prompt | Kompakte Zusammenfassung des aktuellen Arbeitsstands | Am Ende jeder Session oder auf Anfrage ("Checkpoint bitte") |
| 4. Repo-Code | Die ultimative Wahrheit — was tatsächlich existiert | Bei jedem Push |

**Checkpoint-Format (immer gleich):**

```
## Checkpoint [Datum]
### Wo wir stehen
- Phase X, Schritt Y von Z
- Was ist fertig, was ist halb fertig
### Was gerade offen ist
- Aktuelle Bugs, offene Entscheidungen
### Nächster Schritt
- Was als nächstes gebaut/gefixt werden muss
### Kontext für nächste Session
- Relevante Commits, Dateien, Zeilen
```

**Regeln:**
- Claude ist in Alarmbereitschaft für das Session-Ende. Bevor die Session endet, wird ein Checkpoint erstellt.
- Amar kann jederzeit "Checkpoint bitte" sagen → Claude erstellt einen.
- Bei neuer Session: Amar gibt die Projekt-Briefing (Projektdatei) + den letzten Checkpoint als ersten Prompt.
- Bei unerwartetem Session-Ende ohne Checkpoint: Der Repo-Stand ist die Wahrheit. Die neue Session liest den Code und rekonstruiert.

**Single Source of Truth:** Diese Datei (`AREA_PROJECT_BRIEFING.md`) ist die einzige permanente Projektdatei. Separate Handoff-MDs oder DeepSeek-Briefings werden bei Bedarf live aus dieser Datei extrahiert, NICHT separat gepflegt.
