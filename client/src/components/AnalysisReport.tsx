/*
 * ZARA Swiss Precision Design
 * AnalysisReport: Renders the JSON analysis as a readable report with Ampelsystem
 * Colors: Rot (#E63946) kritisch, Amber (#F4A261) mittel, Teal (#2A9D8F) OK
 */

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Euro,
  Home,
  BarChart3,
  Target,
  MessageSquare,
  TrendingUp,
  Clock,
  Info,
} from "lucide-react";

interface AnalysisData {
  meta?: {
    analyst?: string;
    analyse_datum?: string;
    konfidenz_score?: number;
  };
  stufe_1_extraktion?: any;
  stufe_2_qualitaetspruefung?: any;
  stufe_3_verkaufsstrategie?: any;
}

const severityColor = (s: string) => {
  if (s === "kritisch") return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: <XCircle className="w-4 h-4 text-red-500" /> };
  if (s === "mittel") return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> };
  return { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", icon: <CheckCircle2 className="w-4 h-4 text-teal-500" /> };
};

const relevanzColor = (r: string) => {
  if (r === "hoch") return "text-red-600 bg-red-50";
  if (r === "mittel") return "text-amber-600 bg-amber-50";
  return "text-teal-600 bg-teal-50";
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

function ScoreBar({ score, max = 100, label }: { score: number; max?: number; label: string }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct < 40 ? "bg-red-500" : pct < 65 ? "bg-amber-500" : "bg-teal-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>{label}</span>
        <span className="font-mono text-sm font-semibold">{score}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

function KonfidenzRing({ score }: { score: number }) {
  const pct = score * 100;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct < 60 ? "#E63946" : pct < 80 ? "#F4A261" : "#2A9D8F";

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e5e5" strokeWidth="5" />
        <motion.circle
          cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-bold" style={{ color }}>{(score * 100).toFixed(0)}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Konfidenz</span>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, index }: { icon: React.ReactNode; title: string; index: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 mb-4 pt-6 pb-2 border-b border-border"
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
    </motion.div>
  );
}

export default function AnalysisReport({ data }: { data: AnalysisData }) {
  const ext = data.stufe_1_extraktion;
  const qual = data.stufe_2_qualitaetspruefung;
  const strat = data.stufe_3_verkaufsstrategie;

  const criticalCount = qual?.widersprueche?.filter((w: any) => w.schweregrad === "kritisch").length || 0;
  const warningCount = qual?.widersprueche?.filter((w: any) => w.schweregrad === "mittel").length || 0;
  const okCount = qual?.widersprueche?.filter((w: any) => w.schweregrad === "gering").length || 0;

  return (
    <div className="space-y-6">
      {/* Header with Object ID and Konfidenz */}
      <motion.div
        className="bg-card border border-border rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-muted-foreground tracking-wider uppercase">Objekt #{ext?.objekt_id || "—"}</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="font-mono text-xs text-muted-foreground">{data.meta?.analyse_datum || "—"}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              {ext?.titel || "Unbekanntes Objekt"}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {ext?.adresse?.bezirk && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ext.adresse.bezirk} Wien</span>
              )}
              {ext?.typ && (
                <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {ext.typ}</span>
              )}
              {ext?.flaeche?.wohnflaeche_m2 && (
                <span className="font-mono">{ext.flaeche.wohnflaeche_m2} m²</span>
              )}
              {ext?.zimmer?.gesamt && (
                <span>{ext.zimmer.gesamt} Zimmer</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {data.meta?.konfidenz_score !== undefined && (
              <KonfidenzRing score={data.meta.konfidenz_score} />
            )}
          </div>
        </div>

        {/* Quick Status Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <XCircle className="w-3 h-3" /> {criticalCount} Kritisch
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <AlertTriangle className="w-3 h-3" /> {warningCount} Warnung
            </span>
          )}
          {okCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
              <CheckCircle2 className="w-3 h-3" /> {okCount} OK
            </span>
          )}
          {qual?.fehlende_angaben?.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <Info className="w-3 h-3" /> {qual.fehlende_angaben.length} Fehlende Angaben
            </span>
          )}
        </div>
      </motion.div>

      {/* STUFE 1: Extraktion */}
      <motion.div className="bg-card border border-border rounded-lg p-6" custom={1} initial="hidden" animate="visible" variants={fadeIn}>
        <SectionHeader icon={<FileText className="w-4 h-4" />} title="Objektdaten" index={1} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ext?.preis?.kaufpreis_euro && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Kaufpreis</span>
              <p className="font-mono text-lg font-bold text-primary">
                {new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(ext.preis.kaufpreis_euro)}
              </p>
            </div>
          )}
          {ext?.preis?.preis_pro_m2 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Preis/m²</span>
              <p className="font-mono text-lg font-bold">
                {new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(ext.preis.preis_pro_m2)}
              </p>
            </div>
          )}
          {ext?.preis?.betriebskosten_euro && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Betriebskosten</span>
              <p className="font-mono text-lg font-bold">
                {new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(ext.preis.betriebskosten_euro)}/Mo
              </p>
            </div>
          )}
          {ext?.baujahr && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Baujahr</span>
              <p className="font-mono text-lg font-bold">{ext.baujahr}</p>
            </div>
          )}
        </div>
        {ext?.ausstattung?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Ausstattung</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {ext.ausstattung.map((a: string, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">{a}</span>
              ))}
            </div>
          </div>
        )}
        {ext?.ansprechpartner && (
          <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            Ansprechpartner: <span className="font-medium text-foreground">{ext.ansprechpartner}</span>
          </div>
        )}
      </motion.div>

      {/* STUFE 2: Qualitätsprüfung */}
      <motion.div className="bg-card border border-border rounded-lg p-6" custom={2} initial="hidden" animate="visible" variants={fadeIn}>
        <SectionHeader icon={<AlertTriangle className="w-4 h-4" />} title="Qualitätsprüfung" index={2} />

        {/* Widersprüche */}
        {qual?.widersprueche?.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Widersprüche</h4>
            {qual.widersprueche.map((w: any, i: number) => {
              const s = severityColor(w.schweregrad);
              return (
                <motion.div
                  key={i}
                  className={`${s.bg} ${s.border} border rounded-lg p-4`}
                  custom={i + 3}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <div className="flex items-start gap-3">
                    {s.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${s.text}`}>{w.schweregrad}</span>
                        <span className="font-mono text-xs text-muted-foreground">— {w.feld}</span>
                      </div>
                      <p className="text-sm text-foreground">{w.problem}</p>
                      {w.empfehlung && (
                        <p className="text-xs text-muted-foreground mt-2 italic">Empfehlung: {w.empfehlung}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Fehlende Angaben */}
        {qual?.fehlende_angaben?.length > 0 && (
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fehlende Angaben</h4>
            {qual.fehlende_angaben.map((f: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md bg-secondary/50">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${relevanzColor(f.relevanz)}`}>{f.relevanz}</span>
                <span className="font-mono text-sm">{f.feld}</span>
                <span className="text-xs text-muted-foreground flex-1">{f.grund}</span>
              </div>
            ))}
          </div>
        )}

        {/* Textqualität */}
        {qual?.text_qualitaet && (
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Textqualität</h4>
            <ScoreBar score={qual.text_qualitaet.score} label="Qualitäts-Score" />
            {qual.text_qualitaet.ist_generisch && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Text wurde als generisch eingestuft
              </p>
            )}
            {qual.text_qualitaet.schwaechen?.length > 0 && (
              <div className="mt-3 space-y-1">
                {qual.text_qualitaet.schwaechen.map((s: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">—</span> {s}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* STUFE 3: Verkaufsstrategie */}
      <motion.div className="bg-card border border-border rounded-lg p-6" custom={3} initial="hidden" animate="visible" variants={fadeIn}>
        <SectionHeader icon={<Target className="w-4 h-4" />} title="Verkaufsstrategie" index={3} />

        {/* Zielgruppen */}
        {strat?.primaere_zielgruppe && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Primäre Zielgruppe</h4>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="font-medium text-teal-800">{strat.primaere_zielgruppe.profil}</p>
              <p className="text-sm text-teal-700 mt-1">{strat.primaere_zielgruppe.kaufmotiv}</p>
              {strat.primaere_zielgruppe.budget_einschaetzung && (
                <p className="font-mono text-xs text-teal-600 mt-2">Budget: {strat.primaere_zielgruppe.budget_einschaetzung}</p>
              )}
            </div>
          </div>
        )}

        {/* Top 5 Verkaufsargumente */}
        {strat?.top_5_verkaufsargumente?.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top Verkaufsargumente</h4>
            <div className="space-y-2">
              {strat.top_5_verkaufsargumente.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded flex items-center justify-center shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{a.argument}</p>
                    <p className="text-xs text-muted-foreground italic">{a.emotionaler_trigger}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Einwand-Handling */}
        {strat?.einwand_handling?.length > 0 && (
          <div className="mb-6">
            <SectionHeader icon={<MessageSquare className="w-4 h-4" />} title="Einwand-Handling" index={4} />
            <div className="space-y-3">
              {strat.einwand_handling.map((e: any, i: number) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">&ldquo;{e.einwand}&rdquo;</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      e.wahrscheinlichkeit === "hoch" ? "bg-red-100 text-red-700" :
                      e.wahrscheinlichkeit === "mittel" ? "bg-amber-100 text-amber-700" :
                      "bg-teal-100 text-teal-700"
                    }`}>{e.wahrscheinlichkeit}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.antwort_fuer_makler}</p>
                  {e.tonalitaet && (
                    <span className="inline-block mt-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Tonalität: {e.tonalitaet}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Markteinschätzung */}
        {strat?.markteinschaetzung && (
          <div className="mb-6">
            <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Markteinschätzung" index={5} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Preis-Bewertung</span>
                <p className={`font-mono text-lg font-bold mt-1 ${
                  strat.markteinschaetzung.preis_bewertung?.includes("über") ? "text-red-600" :
                  strat.markteinschaetzung.preis_bewertung?.includes("unter") ? "text-teal-600" :
                  "text-foreground"
                }`}>{strat.markteinschaetzung.preis_bewertung}</p>
              </div>
              {strat.markteinschaetzung.vergleichs_m2_preis_bezirk && (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Bezirks-Ø m²</span>
                  <p className="font-mono text-lg font-bold mt-1">
                    {new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(strat.markteinschaetzung.vergleichs_m2_preis_bezirk)}
                  </p>
                </div>
              )}
              {strat.markteinschaetzung.verkaufsdauer_prognose_tage && (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Verkaufsdauer</span>
                  <p className="font-mono text-lg font-bold mt-1">{strat.markteinschaetzung.verkaufsdauer_prognose_tage} Tage</p>
                </div>
              )}
            </div>
            {strat.markteinschaetzung.empfehlung && (
              <p className="text-sm text-muted-foreground mt-3 p-3 bg-secondary/30 rounded-md border-l-2 border-primary">
                {strat.markteinschaetzung.empfehlung}
              </p>
            )}
          </div>
        )}

        {/* Optimiertes Kurz-Exposé */}
        {strat?.optimiertes_kurz_expose && (
          <div>
            <SectionHeader icon={<BarChart3 className="w-4 h-4" />} title="Optimiertes Kurz-Exposé" index={6} />
            <div className="bg-primary text-primary-foreground rounded-lg p-5">
              <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                {strat.optimiertes_kurz_expose}
              </p>
              <p className="text-[10px] mt-3 opacity-60 font-mono">{strat.optimiertes_kurz_expose?.length || 0} / 300 Zeichen</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
