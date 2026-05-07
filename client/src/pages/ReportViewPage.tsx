import { useMemo } from 'react';
import { Link, useRoute } from 'wouter';
import { ExternalLink } from 'lucide-react';
import { content } from '../lib/content';
import { cn, objectSummaryFromDemo, safeHref, statusClass, TodoText } from '../lib/area-utils';
import { trpc } from '../lib/trpc';
import { AppNav } from '../components/Navigation';
import { Button, ButtonLink } from '../components/Button';
import { SectionNumber } from '../components/SectionHeader';

type FlatRecord = Record<string, unknown>;

type Issue = {
  severity: string;
  title: string;
  detail: string;
  law?: string | null;
};

type ReportModel = {
  title: string;
  summary: string;
  url: string;
  extractionRows: Array<[string, string]>;
  issues: Issue[];
  sellingPoints: string[];
  targetGroups: string[];
  marketComparison: string;
  saleDuration: string;
};

function asRecord(value: unknown): FlatRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as FlatRecord : {};
}

function stringValue(value: unknown, fallback = '__live__'): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.map((item) => stringValue(item, '')).filter(Boolean).join(', ');
  if (typeof value === 'object') return Object.entries(asRecord(value)).map(([key, item]) => `${key}: ${stringValue(item, '')}`).join(' · ');
  return String(value);
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function severityFrom(value: unknown): string {
  const text = stringValue(value, '').toLowerCase();
  if (text.includes('kritisch') || text.includes('hoch') || text.includes('rot')) return 'rot';
  if (text.includes('mittel') || text.includes('amber')) return 'amber';
  return 'teal';
}

function demoReport(): ReportModel {
  const d = content.live_demo.demo_object;
  return {
    title: d.address,
    summary: objectSummaryFromDemo(d),
    url: content.dashboard.list_example_rows[0].url,
    extractionRows: [
      [d.address, d.title_in_listing],
      [d.price_label, d.price_value],
      [d.size_label, d.size_value],
      [d.rooms_label, d.rooms_value],
      [d.year_label, d.year_value],
      [d.energy_label, d.energy_value],
      [d.operating_costs_label, d.operating_costs_value],
      [d.commission_label, d.commission_value],
      [content.live_demo.stage_1.fields_extracted[9], d.neubau_flag_in_listing],
    ],
    issues: content.live_demo.stage_2.issues_list.map((issue) => ({
      severity: issue.severity,
      title: issue.title,
      detail: issue.detail,
      law: issue.law_reference,
    })),
    sellingPoints: content.live_demo.stage_3.selling_points,
    targetGroups: content.live_demo.stage_3.target_groups,
    marketComparison: content.live_demo.stage_3.market_comparison_value,
    saleDuration: content.live_demo.stage_3.estimated_sale_duration_value,
  };
}

function reportFromApi(result: unknown, url: string): ReportModel {
  const root = asRecord(result);
  const ext = asRecord(root.stufe_1_extraktion);
  const qual = asRecord(root.stufe_2_qualitaetspruefung);
  const strat = asRecord(root.stufe_3_verkaufsstrategie);
  const adresse = asRecord(ext.adresse);
  const flaeche = asRecord(ext.flaeche);
  const zimmer = asRecord(ext.zimmer);
  const preis = asRecord(ext.preis);
  const markteinschaetzung = asRecord(strat.markteinschaetzung);

  const address = [adresse.strasse, adresse.plz, adresse.bezirk].map((part) => stringValue(part, '')).filter(Boolean).join(', ');
  const title = stringValue(ext.titel, address || url);
  const size = numberValue(flaeche.wohnflaeche_m2);
  const rooms = numberValue(zimmer.gesamt);
  const price = numberValue(preis.kaufpreis_euro);
  const duration = numberValue(markteinschaetzung.verkaufsdauer_prognose_tage);

  const widersprueche = Array.isArray(qual.widersprueche) ? qual.widersprueche.map(asRecord) : [];
  const fehlendeAngaben = Array.isArray(qual.fehlende_angaben) ? qual.fehlende_angaben.map(asRecord) : [];
  const issues: Issue[] = [
    ...widersprueche.map((item) => ({
      severity: severityFrom(item.schweregrad),
      title: stringValue(item.feld, 'Befund'),
      detail: stringValue(item.problem ?? item.empfehlung),
      law: null,
    })),
    ...fehlendeAngaben.map((item) => ({
      severity: severityFrom(item.relevanz),
      title: `Fehlende Angabe: ${stringValue(item.feld, 'Feld')}`,
      detail: stringValue(item.grund),
      law: stringValue(item.rechtsgrundlage, ''),
    })),
  ];

  const topArguments = Array.isArray(strat.top_5_verkaufsargumente)
    ? strat.top_5_verkaufsargumente.map((item) => {
        const record = asRecord(item);
        return [record.argument, record.emotionaler_trigger].map((part) => stringValue(part, '')).filter(Boolean).join(' - ');
      }).filter(Boolean)
    : [];

  const secondary = Array.isArray(strat.sekundaere_zielgruppen)
    ? strat.sekundaere_zielgruppen.map((item) => stringValue(asRecord(item).profil, '')).filter(Boolean)
    : [];
  const primary = stringValue(asRecord(strat.primaere_zielgruppe).profil, '');

  return {
    title,
    summary: [
      size ? `${size} m2` : null,
      rooms ? `${rooms} Zi` : null,
      price ? new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price) : null,
    ].filter(Boolean).join(' · ') || stringValue(ext.typ, '__live__'),
    url,
    extractionRows: [
      ['Objekt', title],
      ['Adresse', address || '__live__'],
      ['Typ', stringValue(ext.typ)],
      ['Wohnflaeche', size ? `${size} m2` : '__live__'],
      ['Zimmer', rooms ? String(rooms) : '__live__'],
      ['Kaufpreis', price ? new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price) : '__live__'],
      ['Betriebskosten', stringValue(preis.betriebskosten_euro)],
      ['Provision', stringValue(preis.provision_hinweis ?? preis.provision_prozent)],
      ['Energiekennzahl', stringValue(ext.energiekennzahl)],
    ],
    issues: issues.length > 0 ? issues : demoReport().issues,
    sellingPoints: topArguments.length > 0 ? topArguments : [stringValue(strat.optimiertes_kurz_expose)],
    targetGroups: [primary, ...secondary].filter(Boolean),
    marketComparison: stringValue(markteinschaetzung.empfehlung ?? markteinschaetzung.preis_bewertung),
    saleDuration: duration ? `${duration} Tage` : '__live__',
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
        {issues.map((issue) => (
          <article key={`${issue.title}-${issue.detail}`} className={cn('rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair', statusClass(issue.severity))}>
            <div className="grid grid-cols-[4px_1fr] gap-5">
              <span className="rounded-full bg-[var(--status)]" />
              <div>
                <h3 className="font-display text-[30px] leading-tight"><TodoText value={issue.title} /></h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={issue.detail} /></p>
                {issue.law ? <span className="mt-4 inline-flex rounded-[4px] border border-[var(--area-line)] px-2 py-1 font-mono text-[11px] text-[var(--area-muted)]"><TodoText value={issue.law} /></span> : null}
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
            {report.sellingPoints.map((point) => (
              <li key={point} className="grid grid-cols-[20px_1fr] gap-3 text-[15px] leading-7 text-[var(--area-muted)]"><span className="mt-3 h-px bg-[var(--area-ink)]" /><span><TodoText value={point} /></span></li>
            ))}
          </ul>
        </article>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.market_comparison_label} /></p>
            <p className="mt-4 font-display text-[31px] leading-tight"><TodoText value={report.marketComparison} /></p>
          </article>
          <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.estimated_sale_duration_label} /></p>
            <p className="mt-4 font-display text-[52px] leading-none font-tabular"><TodoText value={report.saleDuration} /></p>
          </article>
        </div>
        <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
          <ul className="space-y-3">
            {(report.targetGroups.length > 0 ? report.targetGroups : content.live_demo.stage_3.target_groups).map((target) => (
              <li key={target} className="text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={target} /></li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export function ReportViewPage() {
  const [, params] = useRoute('/dashboard/:id');
  const rawId = params?.id ?? 'demo';
  const numericId = Number(rawId);
  const canFetch = Number.isInteger(numericId) && numericId > 0;
  const detailQuery = trpc.analysis.byId.useQuery({ id: numericId }, { enabled: canFetch, retry: false });

  const report = useMemo(() => {
    if (detailQuery.data?.result) return reportFromApi(detailQuery.data.result, detailQuery.data.url);
    return demoReport();
  }, [detailQuery.data]);

  const sideLinks = [
    { href: '#stufe-1', label: content.report_view.section_titles.extraction },
    { href: '#stufe-2', label: content.report_view.section_titles.quality },
    { href: '#stufe-3', label: content.report_view.section_titles.strategy },
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
          {detailQuery.isLoading ? <p className="mt-8 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Report wird geladen...</p> : null}
          {detailQuery.error ? <p className="mt-8 text-[14px] text-[var(--area-red)]">{detailQuery.error.message}</p> : null}
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
                {content.report_view.header_translate_toggle.map((language, index) => <button type="button" key={language} className={cn('rounded-[4px] px-3 py-2', index === 0 ? 'bg-[var(--area-ink)] text-[var(--area-paper)]' : 'text-[var(--area-muted)]')}><TodoText value={language} /></button>)}
              </div>
              <Button type="button" onClick={() => window.print()}><TodoText value={content.report_view.header_export_label} /></Button>
            </div>
          </header>
          <div className="mx-auto max-w-[840px]">
            <ExtractionSection rows={report.extractionRows} />
            <QualitySection issues={report.issues} />
            <StrategySection report={report} />
          </div>
        </div>
      </main>
    </>
  );
}
