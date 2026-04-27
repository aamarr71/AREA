/*
 * AREA Swiss Precision Design
 * AnalysisReport: Renders the JSON analysis as a readable report with Ampelsystem
 * Colors: Rot (#E63946) kritisch, Amber (#F4A261) mittel, Teal (#2A9D8F) OK
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Home,
  BarChart3,
  Target,
  MessageSquare,
  TrendingUp,
  Clock,
  Info,
} from "lucide-react";
import { t, tAmpel, type Lang } from "../lib/translations";
import { trpc } from "../lib/trpc";

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

// Skeleton for dynamic text fields while translation is loading
function Skel({ w = "full", h = 4 }: { w?: string; h?: number }) {
  return <div className={`h-${h} w-${w} bg-muted animate-pulse rounded`} />;
}

function SkelLines({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skel key={i} w={i === lines - 1 && lines > 1 ? "2/3" : "full"} />
      ))}
    </div>
  );
}

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

function KonfidenzRing({ score, label }: { score: number; label: string }) {
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
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
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

export default function AnalysisReport({ data, analysisId }: { data: AnalysisData; analysisId?: number | null }) {
  const [lang, setLang] = useState<Lang>("de");
  const [translatedData, setTranslatedData] = useState<AnalysisData | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);

  const locale = lang === "de" ? "de-AT" : "en-GB";

  // Use translated data when available in EN mode, otherwise original
  const display: AnalysisData = lang === "en" && translatedData ? translatedData : data;
  const ext = display.stufe_1_extraktion;
  const qual = display.stufe_2_qualitaetspruefung;
  const strat = display.stufe_3_verkaufsstrategie;

  // For badge counts always use original data (counts don't change)
  const origQual = data.stufe_2_qualitaetspruefung;
  const criticalCount = origQual?.widersprueche?.filter((w: any) => w.schweregrad === "kritisch").length || 0;
  const warningCount = origQual?.widersprueche?.filter((w: any) => w.schweregrad === "mittel").length || 0;
  const okCount = origQual?.widersprueche?.filter((w: any) => w.schweregrad === "gering").length || 0;

  const translateMutation = trpc.analysis.translate.useMutation({
    onSuccess: (translated) => {
      setTranslatedData(translated as AnalysisData);
      setIsTranslating(false);
      setTranslateError(false);
    },
    onError: () => {
      setIsTranslating(false);
      setTranslateError(true);
    },
  });

  const handleSetLang = (next: Lang) => {
    setLang(next);
    if (next === "en" && !translatedData && !isTranslating) {
      setIsTranslating(true);
      setTranslateError(false);
      if (analysisId) {
        translateMutation.mutate({ analysisId, targetLang: "en" });
      } else {
        // Demo mode or missing DB id — pass data directly
        translateMutation.mutate({ inlineData: data, targetLang: "en" });
      }
    }
  };

  const loading = lang === "en" && isTranslating;

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
              <span className="font-mono text-xs text-muted-foreground tracking-wider uppercase">{t("objekt", lang)}{data.stufe_1_extraktion?.objekt_id || "—"}</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="font-mono text-xs text-muted-foreground">{data.meta?.analyse_datum || "—"}</span>
            </div>
            {loading ? (
              <div className="h-7 bg-muted animate-pulse rounded w-3/4 mt-1 mb-3" />
            ) : (
              <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {ext?.titel || "Unbekanntes Objekt"}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {data.stufe_1_extraktion?.adresse?.bezirk && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {data.stufe_1_extraktion.adresse.bezirk} {t("wien", lang)}</span>
              )}
              {data.stufe_1_extraktion?.typ && (
                <span className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  {loading ? <Skel w="16" /> : ext?.typ}
                </span>
              )}
              {data.stufe_1_extraktion?.flaeche?.wohnflaeche_m2 && (
                <span className="font-mono">{data.stufe_1_extraktion.flaeche.wohnflaeche_m2} m²</span>
              )}
              {data.stufe_1_extraktion?.zimmer?.gesamt && (
                <span>{data.stufe_1_extraktion.zimmer.gesamt} {t("zimmer", lang)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
              <button
                onClick={() => handleSetLang("de")}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  lang === "de" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >DE</button>
              <button
                onClick={() => handleSetLang("en")}
                disabled={isTranslating}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                } disabled:opacity-50`}
              >EN</button>
            </div>
            {data.meta?.konfidenz_score !== undefined && (
              <KonfidenzRing score={data.meta.konfidenz_score} label={t("konfidenz", lang)} />
            )}
          </div>
        </div>

        {/* Quick Status Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <XCircle className="w-3 h-3" /> {criticalCount} {t("kritisch", lang)}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <AlertTriangle className="w-3 h-3" /> {warningCount} {t("warnung", lang)}
            </span>
          )}
          {okCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
              <CheckCircle2 className="w-3 h-3" /> {okCount} {t("ok", lang)}
            </span>
          )}
          {origQual?.fehlende_angaben?.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <Info className="w-3 h-3" /> {origQual.fehlende_angaben.length} {t("fehlende_angaben", lang)}
            </span>
          )}
        </div>
      </motion.div>

      {/* STUFE 1: Extraktion */}
      <motion.div className="bg-card border border-border rounded-lg p-6" custom={1} initial="hidden" animate="visible" variants={fadeIn}>
        <SectionHeader icon={<FileText className="w-4 h-4" />} title={t("objektdaten", lang)} index={1} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.stufe_1_extraktion?.preis?.kaufpreis_euro && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("kaufpreis", lang)}</span>
              <p className="font-mono text-lg font-bold text-primary">
                {new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(data.stufe_1_extraktion.preis.kaufpreis_euro)}
              </p>
            </div>
          )}
          {data.stufe_1_extraktion?.preis?.preis_pro_m2 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("preis_m2", lang)}</span>
              <p className="font-mono text-lg font-bold">
                {new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(data.stufe_1_extraktion.preis.preis_pro_m2)}
              </p>
            </div>
          )}
          {data.stufe_1_extraktion?.preis?.betriebskosten_euro && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("betriebskosten", lang)}</span>
              <p className="font-mono text-lg font-bold">
                {new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(data.stufe_1_extraktion.preis.betriebskosten_euro)}{t("mo", lang)}
              </p>
            </div>
          )}
          {data.stufe_1_extraktion?.baujahr && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("baujahr", lang)}</span>
              <p className="font-mono text-lg font-bold">{data.stufe_1_extraktion.baujahr}</p>
            </div>
          )}
        </div>
        {data.stufe_1_extraktion?.ausstattung?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("ausstattung", lang)}</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {loading ? (
                data.stufe_1_extraktion.ausstattung.map((_: any, i: number) => (
                  <div key={i} className="h-6 w-20 bg-muted animate-pulse rounded-md" />
                ))
              ) : (
                (ext?.ausstattung ?? data.stufe_1_extraktion.ausstattung).map((a: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">{a}</span>
                ))
              )}
            </div>
          </div>
        )}
        {data.stufe_1_extraktion?.ansprechpartner && (
          <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            {t("ansprechpartner", lang)}: <span className="font-medium text-foreground">{data.stufe_1_extraktion.ansprechpartner}</span>
          </div>
        )}
      </motion.div>

      {/* STUFE 2: Qualitätsprüfung */}
      <motion.div className="bg-card border border-border rounded-lg p-6" custom={2} initial="hidden" animate="visible" variants={fadeIn}>
        <SectionHeader icon={<AlertTriangle className="w-4 h-4" />} title={t("qualitaetspruefung", lang)} index={2} />

        {/* Widersprüche */}
        {origQual?.widersprueche?.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("widersprueche", lang)}</h4>
            {loading ? (
              origQual.widersprueche.map((_: any, i: number) => {
                const s = severityColor(origQual.widersprueche[i].schweregrad);
                return (
                  <div key={i} className={`${s.bg} ${s.border} border rounded-lg p-4 space-y-2 animate-pulse`}>
                    <div className="h-3 bg-muted/60 rounded w-1/4" />
                    <div className="h-4 bg-muted/60 rounded w-full" />
                    <div className="h-3 bg-muted/60 rounded w-3/4" />
                  </div>
                );
              })
            ) : (
              qual?.widersprueche?.map((w: any, i: number) => {
                const s = severityColor(w.schweregrad);
                return (
                  <motion.div key={i} className={`${s.bg} ${s.border} border rounded-lg p-4`} custom={i + 3} initial="hidden" animate="visible" variants={fadeIn}>
                    <div className="flex items-start gap-3">
                      {s.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${s.text}`}>{tAmpel(w.schweregrad, lang)}</span>
                          <span className="font-mono text-xs text-muted-foreground">— {w.feld}</span>
                        </div>
                        <p className="text-sm text-foreground">{w.problem}</p>
                        {w.empfehlung && (
                          <p className="text-xs text-muted-foreground mt-2 italic">{t("empfehlung", lang)} {w.empfehlung}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Fehlende Angaben */}
        {origQual?.fehlende_angaben?.length > 0 && (
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("fehlende_angaben", lang)}</h4>
            {loading ? (
              origQual.fehlende_angaben.map((_: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md bg-secondary/50 animate-pulse">
                  <div className="h-5 w-12 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 flex-1 bg-muted rounded" />
                </div>
              ))
            ) : (
              qual?.fehlende_angaben?.map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md bg-secondary/50">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${relevanzColor(f.relevanz)}`}>{tAmpel(f.relevanz, lang)}</span>
                  <span className="font-mono text-sm">{f.feld}</span>
                  <span className="text-xs text-muted-foreground flex-1">{f.grund}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Textqualität */}
        {origQual?.text_qualitaet && (
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("textqualitaet", lang)}</h4>
            <ScoreBar score={origQual.text_qualitaet.score} label={t("qualitaets_score", lang)} />
            {origQual.text_qualitaet.ist_generisch && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t("generisch", lang)}
              </p>
            )}
            {origQual.text_qualitaet.schwaechen?.length > 0 && (
              <div className="mt-3 space-y-1">
                {loading ? (
                  origQual.text_qualitaet.schwaechen.map((_: any, i: number) => (
                    <div key={i} className="h-4 bg-muted animate-pulse rounded w-full" />
                  ))
                ) : (
                  (qual?.text_qualitaet?.schwaechen ?? origQual.text_qualitaet.schwaechen).map((s: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">—</span> {s}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* STUFE 3: Verkaufsstrategie */}
      <motion.div className="bg-card border border-border rounded-lg p-6" custom={3} initial="hidden" animate="visible" variants={fadeIn}>
        <SectionHeader icon={<Target className="w-4 h-4" />} title={t("verkaufsstrategie", lang)} index={3} />

        {/* Zielgruppen */}
        {data.stufe_3_verkaufsstrategie?.primaere_zielgruppe && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("primaere_zielgruppe", lang)}</h4>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-5 bg-teal-200 rounded w-3/4" />
                  <div className="h-4 bg-teal-200 rounded w-full" />
                  <div className="h-3 bg-teal-200 rounded w-1/2" />
                </div>
              ) : (
                <>
                  <p className="font-medium text-teal-800">{strat?.primaere_zielgruppe?.profil}</p>
                  <p className="text-sm text-teal-700 mt-1">{strat?.primaere_zielgruppe?.kaufmotiv}</p>
                  {strat?.primaere_zielgruppe?.budget_einschaetzung && (
                    <p className="font-mono text-xs text-teal-600 mt-2">{t("budget", lang)} {strat.primaere_zielgruppe.budget_einschaetzung}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Top 5 Verkaufsargumente */}
        {data.stufe_3_verkaufsstrategie?.top_5_verkaufsargumente?.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("top_verkaufsargumente", lang)}</h4>
            <div className="space-y-2">
              {loading ? (
                data.stufe_3_verkaufsstrategie.top_5_verkaufsargumente.map((_: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 animate-pulse">
                    <div className="w-6 h-6 bg-muted rounded shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                strat?.top_5_verkaufsargumente?.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded flex items-center justify-center shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{a.argument}</p>
                      <p className="text-xs text-muted-foreground italic">{a.emotionaler_trigger}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Einwand-Handling */}
        {data.stufe_3_verkaufsstrategie?.einwand_handling?.length > 0 && (
          <div className="mb-6">
            <SectionHeader icon={<MessageSquare className="w-4 h-4" />} title={t("einwand_handling", lang)} index={4} />
            <div className="space-y-3">
              {loading ? (
                data.stufe_3_verkaufsstrategie.einwand_handling.map((_: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-2 animate-pulse">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <SkelLines lines={2} />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                ))
              ) : (
                strat?.einwand_handling?.map((e: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">&ldquo;{e.einwand}&rdquo;</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        e.wahrscheinlichkeit === "hoch" ? "bg-red-100 text-red-700" :
                        e.wahrscheinlichkeit === "mittel" ? "bg-amber-100 text-amber-700" :
                        "bg-teal-100 text-teal-700"
                      }`}>{tAmpel(e.wahrscheinlichkeit, lang)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{e.antwort_fuer_makler}</p>
                    {e.tonalitaet && (
                      <span className="inline-block mt-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{t("tonalitaet", lang)} {e.tonalitaet}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Markteinschätzung */}
        {data.stufe_3_verkaufsstrategie?.markteinschaetzung && (
          <div className="mb-6">
            <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title={t("markteinschaetzung", lang)} index={5} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("preis_bewertung", lang)}</span>
                {loading ? (
                  <div className="h-6 bg-muted animate-pulse rounded w-2/3 mx-auto mt-1" />
                ) : (
                  <p className={`font-mono text-lg font-bold mt-1 ${
                    strat?.markteinschaetzung?.preis_bewertung?.includes("über") ? "text-red-600" :
                    strat?.markteinschaetzung?.preis_bewertung?.includes("unter") ? "text-teal-600" :
                    "text-foreground"
                  }`}>{strat?.markteinschaetzung?.preis_bewertung}</p>
                )}
              </div>
              {data.stufe_3_verkaufsstrategie.markteinschaetzung.vergleichs_m2_preis_bezirk && (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("bezirks_m2", lang)}</span>
                  <p className="font-mono text-lg font-bold mt-1">
                    {new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(data.stufe_3_verkaufsstrategie.markteinschaetzung.vergleichs_m2_preis_bezirk)}
                  </p>
                </div>
              )}
              {data.stufe_3_verkaufsstrategie.markteinschaetzung.verkaufsdauer_prognose_tage && (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> {t("verkaufsdauer", lang)}</span>
                  <p className="font-mono text-lg font-bold mt-1">{data.stufe_3_verkaufsstrategie.markteinschaetzung.verkaufsdauer_prognose_tage} {t("tage", lang)}</p>
                </div>
              )}
            </div>
            {data.stufe_3_verkaufsstrategie.markteinschaetzung.empfehlung && (
              <div className="mt-3 p-3 bg-secondary/30 rounded-md border-l-2 border-primary">
                {loading ? <SkelLines lines={2} /> : (
                  <p className="text-sm text-muted-foreground">{strat?.markteinschaetzung?.empfehlung}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Optimiertes Kurz-Exposé */}
        {data.stufe_3_verkaufsstrategie?.optimiertes_kurz_expose && (
          <div>
            <SectionHeader icon={<BarChart3 className="w-4 h-4" />} title={t("kurz_expose", lang)} index={6} />
            <div className="bg-primary text-primary-foreground rounded-lg p-5">
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-primary-foreground/20 rounded w-full" />
                  <div className="h-4 bg-primary-foreground/20 rounded w-full" />
                  <div className="h-4 bg-primary-foreground/20 rounded w-2/3" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                  {strat?.optimiertes_kurz_expose}
                </p>
              )}
              <p className="text-[10px] mt-3 opacity-60 font-mono">
                {(strat?.optimiertes_kurz_expose ?? data.stufe_3_verkaufsstrategie?.optimiertes_kurz_expose)?.length || 0} / 300 {t("zeichen", lang)}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bottom hint — only shown on translation error */}
      {lang === "en" && !loading && translateError && (
        <p className="text-xs text-muted-foreground italic text-center">
          Labels translated — content translation temporarily unavailable.
        </p>
      )}
    </div>
  );
}
