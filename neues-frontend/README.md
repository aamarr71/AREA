# AREA Frontend Design

React/Vite/Tailwind-Projekt für die AREA Landingpage und App-Bereiche aus `prompt_editor.md` und `content.json`.

## Enthaltene Routes

- `/` — Landingpage mit Editorial-Hero, Live-Demo, Trust, Pricing, FAQ, Final CTA, Kontakt, Footer, Cookie-Banner
- `/login` — Login-Seite
- `/invite/:token` — Invite-Accept-Seite
- `/dashboard` — User-Dashboard im Inbox-Stil
- `/dashboard/:id` — Vollbild-Report-View
- `/amar-stats` — Admin-Dashboard

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Content-Regel

Alle sichtbaren Inhalte werden aus `src/content.json` bezogen. Felder mit `__TODO__` und `__live__` werden im Interface als sichtbare gestrichelte Platzhalter gerendert.
