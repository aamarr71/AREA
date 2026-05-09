import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { ExternalLink } from "lucide-react";
import { content } from "../lib/content";
import { cn, safeHref, statusClass, TodoText, userFacingError } from "../lib/utils";
import { AppNav } from "../components/Navigation";
import { Button, ButtonLink } from "../components/Button";
import { SectionNumber } from "../components/SectionHeader";
import { trpc } from "../lib/trpc";

type FlatRecord = Record<string, unknown>;

type Issue = {
  severity: "rot" | "amber" | "teal";
  title: string;
  detail: string;
  reference?: string | null;
};

type ReportModel = {
  title: string;
  summary: string;
  url: string;
  rows: Array<[string, string]>;
  issues: Issue[];
  sellingPoints: string[];
  targets: string[];
  market: string;
  duration: string;
};

function asRecord(value: unknown): FlatRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as FlatRecord : {};
}

function labelize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function valueText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "nicht angegeben";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "nicht angegeben";
  if (typeof value === "boolean") return value ? "ja" : "nein";
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(asRecord(value))
      .map(([key, inner]) => `${labelize(key)}: ${valueText(inner)}`)
      .join(" · ");
  }
  return String(value);
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const text = valueText(value);
    if (text !== "nicht angegeben") return text;
  }
  return "";
}

function extractRows(extraction: FlatRecord): Array<[string, string]> {
  const preferred = ["titel", "adresse", "preis", "wohnflaeche", "flaeche", "zimmer", "baujahr", "energieausweis", "betriebskosten", "provision", "typ", "ausstattung"];
  const rows: Array<[string, string]> = [];
  const used = new Set<string>();

  for (const key of preferred) {
    if (key in extraction) {
      rows.push([labelize(key), valueText(extraction[key])]);
      used.add(key);
    }
  }

  for (const [key, value] of Object.entries(extraction)) {
    if (!used.has(key) && rows.length < 18) {
      rows.push([labelize(key), valueText(value)]);
    }
  }

  return rows.length ? rows : [["Status", "Keine extrahierten Daten im Ergebnis gefunden."]];
}

function severityFrom(value: unknown): Issue["severity"] {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("rot") || text.includes("hoch") || text.includes("kritisch") || text.includes("fehlt")) return "rot";
  if (text.includes("amber") || text.includes("mittel") || text.includes("warn")) return "amber";
  return "teal";
}

function collectIssues(value: unknown, issues: Issue[] = []): Issue[] {
  if (!value || issues.length >= 30) return issues;
  if (Array.isArray(value)) {
    value.forEach((item) => collectIssues(item, issues));
    return issues;
  }

  const record = asRecord(value);
  if (!Object.keys(record).length) return issues;

  const title = firstString(record.title, record.titel, record.name, record.fehler, record.problem, record.pruefung);
  const detail = firstString(record.detail, record.details, record.beschreibung, record.hinweis, record.begruendung, record.empfehlung);
  if ((title || detail) && (record.severity || record.ampel || record.status || detail)) {
    issues.push({
      severity: severityFrom(record.severity ?? record.ampel ?? record.status ?? title ?? detail),
      title: title || "Hinweis aus der Qualitätsprüfung",
      detail: detail || valueText(record),
      reference: firstString(record.law_reference, record.referenz, record.paragraf, record.gesetz) || null,
    });
  }

  for (const inner of Object.values(record)) {
    if (typeof inner === "object") collectIssues(inner, issues);
  }

  return issues;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function listFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean);
  if (typeof value === "object" && value) return Object.values(asRecord(value)).map(valueText).filter(Boolean);
  const text = valueText(value);
  return text && text !== "nicht angegeben" ? [text] : [];
}

function demoReport(): ReportModel {
  const demo = content.live_demo.demo_object;
  return {
    title: demo.address,
    summary: `${demo.size_value} · ${demo.rooms_value} Zi · ${demo.price_value}`,
    url: content.dashboard.list_example_rows[0].url,
    rows: [
      [demo.address, demo.title_in_listing],
      [demo.price_label, demo.price_value],
      [demo.size_label, demo.size_value],
      [demo.rooms_label, demo.rooms_value],
      [demo.year_label, demo.year_value],
      [demo.energy_label, demo.energy_value],
      [demo.operating_costs_label, demo.operating_costs_value],
      [demo.commission_label, demo.commission_value],
      [content.live_demo.stage_1.fields_extracted[9], demo.neubau_flag_in_listing],
    ],
    issues: content.live_demo.stage_2.issues_list.map((issue) => ({
      severity: issue.severity as Issue["severity"],
      title: issue.title,
      detail: issue.detail,
      reference: issue.law_reference,
    })),
    sellingPoints: content.live_demo.stage_3.selling_points,
    targets: content.live_demo.stage_3.target_groups,
    market: content.live_demo.stage_3.market_comparison_value,
    duration: content.live_demo.stage_3.estimated_sale_duration_value,
  };
}

function reportFromApi(result: unknown, url: string): ReportModel {
  const root = asRecord(result);
  const extraction = asRecord(root.stufe_1_extraktion);
  const quality = asRecord(root.stufe_2_qualitaetspruefung);
  const strategy = asRecord(root.stufe_3_verkaufsstrategie);
  const address = asRecord(extraction.adresse);

  const title = firstString(
    extraction.titel,
    extraction.title,
    address.strasse,
    extraction.adresse,
    url,
  ) || "AREA Report";
  const summary = unique([
    firstString(extraction.wohnflaeche, extraction.flaeche),
    firstString(extraction.zimmer),
    firstString(extraction.preis, extraction.kaufpreis),
  ]).join(" · ") || "Analyse abgeschlossen";

  const issues = collectIssues(quality);
  const widmung = asRecord(asRecord(root.standortdaten).widerspruch);
  if (Object.keys(widmung).length) {
    issues.push({
      severity: severityFrom(widmung.schweregrad ?? widmung.status ?? "amber"),
      title: firstString(widmung.titel, "Widmungs-Hinweis"),
      detail: firstString(widmung.beschreibung, widmung.detail, valueText(widmung)),
      reference: firstString(widmung.referenz) || null,
    });
  }

  const target = asRecord(strategy.primaere_zielgruppe);
  const market = asRecord(strategy.markteinschaetzung);
  const selling = strategy.top_5_verkaufsargumente ?? strategy.verkaufsargumente ?? strategy.selling_points;

  return {
    title,
    summary,
    url,
    rows: extractRows(extraction),
    issues: issues.length ? issues : [{
      severity: "teal",
      title: "Keine kritischen Pflichtfehler erkannt",
      detail: "Das gespeicherte Analyse-Ergebnis enthält keine markierten Fehler.",
      reference: null,
    }],
    sellingPoints: unique(listFrom(selling)).slice(0, 8),
    targets: unique([
      firstString(target.profil),
      firstString(target.kaufmotiv),
      firstString(target.budget_einschaetzung),
      ...listFrom(strategy.zielgruppen),
      ...listFrom(strategy.target_groups),
    ]).slice(0, 8),
    market: firstString(market.preis_bewertung, market.empfehlung, strategy.marktvergleich, strategy.market_comparison) || "Noch keine Markteinschätzung vorhanden.",
    duration: firstString(strategy.geschaetzte_vermarktungsdauer, strategy.verkaufsdauer, strategy.estimated_sale_duration) || "nicht berechnet",
  };
}

function ExtractionSection({ rows }: { rows: Array<[string, string]> }) {
  return (
    <section id="stufe-1" className="scroll-mt-28 py-16">
      <SectionNumber number="01" label={content.report_view.section_titles.extraction} />
      <table className="report-table font-tabular">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={`${label}-${value}`}>
              <th className="w-[40%] pr-8 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={label} /></th>
              <td className="text-[15px] leading-7"><TodoText value={value} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function QualitySection({ issues }: { issues: Issue[] }) {
  return (
    <section id="stufe-2" className="scroll-mt-28 py-16">
      <SectionNumber number="02" label={content.report_view.section_titles.quality} />
      <div className="space-y-4">
        {issues.map((issue, index) => (
          <article key={`${issue.title}-${index}`} className={cn("rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair", statusClass(issue.severity))}>
            <div className="grid grid-cols-[4px_1fr] gap-5">
              <span className="rounded-full bg-[var(--status)]" />
              <div>
                <h3 className="font-display text-[30px] leading-tight"><TodoText value={issue.title} /></h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={issue.detail} /></p>
                {issue.reference ? <span className="mt-4 inline-flex rounded-[4px] border border-[var(--area-line)] px-2 py-1 font-mono text-[11px] text-[var(--area-muted)]"><TodoText value={issue.reference} /></span> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StrategySection({ report }: { report: ReportModel }) {
  return (
    <section id="stufe-3" className="scroll-mt-28 py-16">
      <SectionNumber number="03" label={content.report_view.section_titles.strategy} />
      <div className="grid gap-5">
        <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.selling_points_label} /></p>
          <ul className="mt-5 space-y-4">
            {(report.sellingPoints.length ? report.sellingPoints : ["Noch keine Verkaufsargumente im Ergebnis vorhanden."]).map((point) => (
              <li key={point} className="grid grid-cols-[20px_1fr] gap-3 text-[15px] leading-7 text-[var(--area-muted)]"><span className="mt-3 h-px bg-[var(--area-ink)]" /><span><TodoText value={point} /></span></li>
            ))}
          </ul>
        </article>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.market_comparison_label} /></p>
            <p className="mt-4 font-display text-[31px] leading-tight"><TodoText value={report.market} /></p>
          </article>
          <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.estimated_sale_duration_label} /></p>
            <p className="mt-4 font-display text-[52px] leading-none font-tabular"><TodoText value={report.duration} /></p>
          </article>
        </div>
        <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
          <ul className="space-y-3">
            {(report.targets.length ? report.targets : ["Noch keine Zielgruppe im Ergebnis vorhanden."]).map((target) => (
              <li key={target} className="text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={target} /></li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export function ReportViewPage() {
  const [, params] = useRoute("/dashboard/:id");
  const rawId = params?.id ?? "";
  const numericId = Number(rawId);
  const canFetch = Number.isInteger(numericId) && numericId > 0;
  const detailQuery = trpc.analysis.byId.useQuery({ id: canFetch ? numericId : 1 }, { enabled: canFetch, retry: false });
  const report = useMemo(() => {
    if (detailQuery.data?.result) return reportFromApi(detailQuery.data.result, detailQuery.data.url);
    return demoReport();
  }, [detailQuery.data]);
  const sideLinks = [
    { href: "#stufe-1", label: content.report_view.section_titles.extraction },
    { href: "#stufe-2", label: content.report_view.section_titles.quality },
    { href: "#stufe-3", label: content.report_view.section_titles.strategy },
  ];

  return (
    <>
      <AppNav />
      <main className="mx-auto grid max-w-shell grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[180px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-3 border-l border-[var(--area-line)] pl-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
            {sideLinks.map((link) => <a key={link.href} href={link.href} className="link-underline block hover:text-[var(--area-ink)]"><TodoText value={link.label} /></a>)}
          </nav>
        </aside>
        <div>
          <Link href="/dashboard" className="link-underline font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)] hover:text-[var(--area-ink)]">
            <TodoText value={content.report_view.back_to_list_label} />
          </Link>
          {detailQuery.isLoading ? <p className="mt-8 text-[14px] text-[var(--area-muted)]">Report wird geladen.</p> : null}
          {detailQuery.isError ? <p className="mt-8 text-[14px] text-[var(--area-red)]">{userFacingError(detailQuery.error.message, "Report konnte nicht geladen werden.")}</p> : null}
          <header className="mt-10 grid gap-8 border-b border-[var(--area-line)] pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="font-display text-[56px] leading-[1.05] tracking-[-0.055em] md:text-[76px]"><TodoText value={report.title} /></h1>
              <p className="mt-5 text-[18px] leading-7 text-[var(--area-muted)]"><TodoText value={report.summary} /></p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <ButtonLink href={safeHref(report.url)} target={content.report_view.header_url_target} rel="noreferrer" tone="ghost" className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]">
                <TodoText value={content.report_view.header_url_label} /> <ExternalLink size={14} strokeWidth={1.5} />
              </ButtonLink>
              <div className="inline-flex rounded-[6px] border border-[var(--area-line-strong)] p-1 font-mono text-[12px] uppercase tracking-[0.1em]">
                {content.report_view.header_translate_toggle.map((language, index) => <button key={language} className={cn("rounded-[4px] px-3 py-2", index === 0 ? "bg-[var(--area-ink)] text-[var(--area-paper)]" : "text-[var(--area-muted)]")}><TodoText value={language} /></button>)}
              </div>
              <Button onClick={() => window.print()}><TodoText value={content.report_view.header_export_label} /></Button>
            </div>
          </header>
          <div className="mx-auto max-w-[840px]">
            <ExtractionSection rows={report.rows} />
            <QualitySection issues={report.issues} />
            <StrategySection report={report} />
          </div>
        </div>
      </main>
    </>
  );
}
