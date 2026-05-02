# CC-Auftrag: PDF-Export in Analyse-History (Dashboard)

> **Datum:** 2. Mai 2026
> **Priorität:** Nice-to-have
> **Geschätzter Aufwand:** 30-45 Minuten
> **Branch:** standalone

---

## Kontext

Der "PDF exportieren" Button existiert bereits im `AnalysisReport.tsx` — direkt nach einer Analyse. Im Dashboard (`/dashboard`) sieht der User seine Analyse-History, kann aber von dort keine PDFs runterladen. Das soll gefixt werden.

---

## Aufgabe

Füge einen "PDF exportieren" Button (oder Icon-Button) zu jedem Eintrag in der Analyse-History im Dashboard hinzu.

### Dateien:

1. `client/src/pages/Dashboard.tsx` — ÄNDERN

### Was zu tun ist:

- Jeder History-Eintrag bekommt einen Download-Button
- Beim Klick: Den bestehenden PDF-Export-Flow aus `AnalysisReport.tsx` wiederverwenden (NICHT duplizieren)
- Falls die PDF-Logik aktuell inline in `AnalysisReport.tsx` lebt → in eine wiederverwendbare Funktion extrahieren (z.B. `lib/exportPdf.ts`) und aus beiden Stellen importieren
- Button-Styling: Dezent, `text-xs`, passt zum bestehenden Dashboard-Design
- Loading-State während PDF generiert wird (kann 1-2 Sekunden dauern)

### Was du NICHT ändern darfst:

- Der bestehende PDF-Export in AnalysisReport.tsx muss weiterhin funktionieren
- Kein neuer Backend-Endpoint nötig (die Analyse-Daten sind bereits via `analysis.byId` abrufbar)
- Keine neuen Dependencies

---

## Akzeptanzkriterien

- [ ] Jeder Eintrag im Dashboard hat einen PDF-Download-Button
- [ ] PDF-Inhalt ist identisch mit dem PDF aus der direkten Analyse
- [ ] Loading-Indikator während Generierung
- [ ] Bestehender PDF-Export in AnalysisReport.tsx funktioniert weiterhin
- [ ] Kein duplizierter Code — gemeinsame Export-Funktion
