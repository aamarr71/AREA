/*
 * ZARA Swiss Precision Design
 * Home Page: Input field, analysis trigger, report display
 * Asymmetric layout: Left sidebar input, right report area
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  ArrowRight,
  FileDown,
  Zap,
  Shield,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import AnalysisReport from "@/components/AnalysisReport";

// Demo data for showcase when no webhook is connected
const DEMO_DATA = {
  meta: { analyst: "ZARA v3.0", analyse_datum: "2026-04-09", konfidenz_score: 0.95 },
  stufe_1_extraktion: {
    objekt_id: "6145",
    titel: "CHARMANTE 4-ZIMMER-WOHNUNG IN 1180 WIEN – BALKON, STADT- UND GRÜNBLICK!",
    typ: "Wohnung",
    adresse: { bezirk: "1180", plz: "1180", strasse: null },
    flaeche: { wohnflaeche_m2: 120, nutzflaeche_m2: 120, balkon_terrasse_m2: 5, garten_m2: 0 },
    zimmer: { gesamt: 4, schlafzimmer: 2, badezimmer: 2, toiletten: 1 },
    preis: { kaufpreis_euro: 950000, miete_euro: 0, betriebskosten_euro: 580, preis_pro_m2: 7916.67, provision_prozent: 3, provision_hinweis: "3% des Kaufpreises zzgl. 20% USt." },
    baujahr: 1970,
    stockwerk: "2. Etage",
    zustand: "gepflegt",
    ausstattung: ["Balkon", "Fußbodenheizung", "hochwertige Fliesen", "Parkettboden"],
    energiekennzahl: null,
    verfuegbarkeit: "Verfügbar",
    ansprechpartner: "Melina Laussner",
  },
  stufe_2_qualitaetspruefung: {
    widersprueche: [
      { feld: "zimmeranzahl", problem: "Im Titel und Fakten werden 4 Zimmer behauptet, im Fließtext sind aber nur von 3 Zimmern die Rede.", schweregrad: "kritisch", empfehlung: "Zimmeraufteilung klären und Fließtext sowie Faktenabgleich dringend durchführen." },
      { feld: "neubau", problem: "Baujahr 1970 ist definitiv KEIN Neubau, aber im Datenfeld ist 'Neubau: Ja' angegeben.", schweregrad: "kritisch", empfehlung: "Neubau-Flag sofort auf 'Nein' ändern. 1970 ist Altbestand." },
      { feld: "energiekennzahl", problem: "Energieausweis/HWB/fGEE fehlen komplett.", schweregrad: "kritisch", empfehlung: "Gesetzlich verpflichtenden Energieausweis sowie Werte HWB und ggf. fGEE nachliefern." },
      { feld: "betriebskosten/m2", problem: "Betriebskosten liegen mit 4,83 €/m² über dem Marktdurchschnitt für Wien (2,50–4,00 €/m²)", schweregrad: "mittel", empfehlung: "Transparente Aufschlüsselung der Betriebskosten liefern und Senkung prüfen." },
      { feld: "beschreibung", problem: "Zahlreiche generische Floskeln: 'Willkommen in Ihrem neuen Zuhause', 'überzeugen Sie sich selbst'.", schweregrad: "mittel", empfehlung: "Floskeln streichen und mit konkreten Wohnargumenten ersetzen." },
    ],
    fehlende_angaben: [
      { feld: "straßenadresse", relevanz: "hoch", grund: "Konkrete Lage ist für die Zielgruppe und Preisvalidierung essenziell." },
      { feld: "heizungsart", relevanz: "mittel", grund: "Fußbodenheizung ist genannt, Energieträger jedoch nicht ausgewiesen." },
      { feld: "energieausweis/HWB/fGEE", relevanz: "hoch", grund: "Rechtlich verpflichtend und für Kaufentscheidung sowie Finanzierung relevant." },
    ],
    text_qualitaet: {
      score: 47,
      staerken: ["Konkrete Angaben zu Infrastruktur und Nahversorgung.", "Positiv herausgestellte Lichtverhältnisse und Blickachsen."],
      schwaechen: [
        "Mehrfach generische Begrüßungsformeln ('Willkommen in Ihrem neuen Zuhause').",
        "Text widerspricht sich bei Zimmeranzahl: einmal 3, einmal 4.",
        "Floskelhafte Passagen: 'überzeugen Sie sich selbst', 'einmaliges Angebot'.",
      ],
      ist_generisch: true,
    },
  },
  stufe_3_verkaufsstrategie: {
    primaere_zielgruppe: { profil: "Familien oder Paare mittleren Alters mit gehobenem Einkommen", kaufmotiv: "Größeres Platzangebot, Balkon, zentrale Grünlage", budget_einschaetzung: "ab 900.000 € aufwärts" },
    sekundaere_zielgruppen: [
      { profil: "Ärztliche oder akademische Paare ohne Kinder", kaufmotiv: "Ruhige Lage, Anbindung, Komfortausstattung" },
    ],
    top_5_verkaufsargumente: [
      { argument: "Balkon mit Stadt- und Grünblick", emotionaler_trigger: "urbanes Lebensgefühl und Entspannung" },
      { argument: "Top-Infrastruktur im Umfeld", emotionaler_trigger: "sorgloser Alltag, alle Wege fußläufig" },
      { argument: "Großzügige 120 m² Wohnfläche", emotionaler_trigger: "viel Freiraum für Familie oder Home-Office" },
      { argument: "Zwei Badezimmer für erhöhten Wohnkomfort", emotionaler_trigger: "Privatsphäre und Komfort" },
      { argument: "Gepflegter Zustand, sofort beziehbar", emotionaler_trigger: "keine Überraschungen, sofort Einziehen" },
    ],
    einwand_handling: [
      { einwand: "Hoher Kaufpreis im Vergleich zu Bezirkspreisen", wahrscheinlichkeit: "hoch", antwort_fuer_makler: "Der aktuelle Durchschnittspreis für 1180 liegt bei ca. 4.500-6.500 €/m², das Objekt liegt mit rund 7.900 €/m² darüber. Argumentieren Sie mit spezifischer Aussicht und Ausstattung.", tonalitaet: "datenbasiert" },
      { einwand: "Unklare Zimmeranzahl/Grundriss", wahrscheinlichkeit: "mittel", antwort_fuer_makler: "Dokumentierten Grundriss vorlegen und offene Fragen zur Raumaufteilung beantworten.", tonalitaet: "sachlich" },
      { einwand: "Fehlende Energiekennzahl", wahrscheinlichkeit: "hoch", antwort_fuer_makler: "Sofort nachreichen, da gesetzlich verpflichtend und für viele Banken relevant.", tonalitaet: "sachlich" },
    ],
    markteinschaetzung: { preis_bewertung: "über Markt", vergleichs_m2_preis_bezirk: 6000, verkaufsdauer_prognose_tage: 210, empfehlung: "Preis ist vom mittleren qm-Preis im 18. Bezirk deutlich entfernt. Um ernsthafte Kaufinteressenten zu gewinnen, Preisanpassung auf maximal 750.000–800.000 € in Erwägung ziehen." },
    optimiertes_kurz_expose: "120 m² gepflegte Wohnung mit Balkon und Grünblick im 18. Bezirk. 2 Bäder, gepflegte Ausstattung, top Infrastruktur, hohe Betriebskosten. Preis über Marktniveau – Verhandlung empfohlen.",
  },
};

const WEBHOOK_URL = "https://aamarr71.app.n8n.cloud/webhook/analyst";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      const response = await fetch(`${WEBHOOK_URL}?url=${encodeURIComponent(url.trim())}`);
      if (!response.ok) throw new Error(`Fehler: ${response.status}`);
      const text = await response.text();

      // Try to parse the response - it might be wrapped in an array or have extra fields
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Ungültige Antwort vom Server");
      }

      // Handle n8n response format (might be array, might have nested output)
      if (Array.isArray(parsed)) {
        parsed = parsed[0];
      }
      // If the response has an output field with message content
      if (parsed?.output?.[0]?.content?.[0]?.text) {
        parsed = JSON.parse(parsed.output[0].content[0].text);
      }
      // If the response has a message field
      if (parsed?.message?.content) {
        parsed = JSON.parse(parsed.message.content);
      }

      setAnalysisData(parsed);

      // Scroll to report
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: any) {
      setError(err.message || "Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setAnalysisData(DEMO_DATA);
    setError(null);
    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663350010070/22JJ5JVjD4oWBr593xia7T/zara-pattern-9DhFNiShm6NWvtJ2uNHbbD.webp)`,
            backgroundSize: "600px",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="relative container py-12 md:py-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-mono text-sm tracking-[0.2em] uppercase text-muted-foreground">ZARA v3.0</span>
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Immobilien-Exposé
                <br />
                <span className="text-muted-foreground">Analyst</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                KI-gestützte Qualitätsprüfung für Immobilien-Exposés. Widersprüche aufdecken, Verkaufsstrategien optimieren, Marktpreise validieren.
              </p>
            </motion.div>

            {/* Input Section */}
            <motion.div
              className="mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Immobilien-Link einfügen (z.B. zakaryan.at/de/immobilie/...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    className="pl-10 h-12 text-base bg-card border-border font-mono text-sm"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !url.trim()}
                  className="h-12 px-6 text-sm font-semibold tracking-wide"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      Analysieren
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Demo Button */}
              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={handleDemo}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Demo-Analyse anzeigen
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <span className="text-xs text-muted-foreground font-mono">Powered by GPT-4.1</span>
              </div>
            </motion.div>

            {/* Feature Badges */}
            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {[
                { icon: <Shield className="w-3.5 h-3.5" />, text: "Widersprüche erkennen" },
                { icon: <BarChart3 className="w-3.5 h-3.5" />, text: "Marktpreis validieren" },
                { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: "Haftungsrisiken aufdecken" },
              ].map((f, i) => (
                <span key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  {f.icon}
                  {f.text}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Section */}
      <AnimatePresence>
        {analysisData && (
          <motion.div
            ref={reportRef}
            className="container py-8 pb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Report Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                  Analyse-Report
                </h2>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {analysisData.meta?.analyst} | {analysisData.meta?.analyse_datum}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2 print:hidden"
              >
                <FileDown className="w-4 h-4" />
                PDF Export
              </Button>
            </div>

            <AnalysisReport data={analysisData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border py-6 print:hidden">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">ZARA v3.0 — Zakaryan Automated Real-Estate Analyst</span>
          <span>Powered by KI-Automatisierung</span>
        </div>
      </footer>
    </div>
  );
}
