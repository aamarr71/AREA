import { Link } from 'wouter';
import { ExternalLink } from 'lucide-react';
import { content } from '../lib/content';
import { cn, objectSummaryFromDemo, safeHref, statusClass, TodoText } from '../lib/utils';
import { AppNav } from '../components/Navigation';
import { Button, ButtonLink } from '../components/Button';
import { SectionNumber } from '../components/SectionHeader';

function ExtractionSection() {
  const d = content.live_demo.demo_object;
  const rows: Array<[string, string]> = [
    [d.address, d.title_in_listing],
    [d.price_label, d.price_value],
    [d.size_label, d.size_value],
    [d.rooms_label, d.rooms_value],
    [d.year_label, d.year_value],
    [d.energy_label, d.energy_value],
    [d.operating_costs_label, d.operating_costs_value],
    [d.commission_label, d.commission_value],
    [content.live_demo.stage_1.fields_extracted[9], d.neubau_flag_in_listing],
  ];
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

function QualitySection() {
  return (
    <section id="stufe-2" className="scroll-mt-28 py-16">
      <SectionNumber number="02" label={content.report_view.section_titles.quality} />
      <div className="space-y-4">
        {content.live_demo.stage_2.issues_list.map((issue) => (
          <article key={issue.title} className={cn('rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair', statusClass(issue.severity))}>
            <div className="grid grid-cols-[4px_1fr] gap-5">
              <span className="rounded-full bg-[var(--status)]" />
              <div>
                <h3 className="font-display text-[30px] leading-tight"><TodoText value={issue.title} /></h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={issue.detail} /></p>
                {issue.law_reference ? <span className="mt-4 inline-flex rounded-[4px] border border-[var(--area-line)] px-2 py-1 font-mono text-[11px] text-[var(--area-muted)]"><TodoText value={issue.law_reference} /></span> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StrategySection() {
  return (
    <section id="stufe-3" className="scroll-mt-28 py-16">
      <SectionNumber number="03" label={content.report_view.section_titles.strategy} />
      <div className="grid gap-5">
        <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.selling_points_label} /></p>
          <ul className="mt-5 space-y-4">
            {content.live_demo.stage_3.selling_points.map((point) => (
              <li key={point} className="grid grid-cols-[20px_1fr] gap-3 text-[15px] leading-7 text-[var(--area-muted)]"><span className="mt-3 h-px bg-[var(--area-ink)]" /><span><TodoText value={point} /></span></li>
            ))}
          </ul>
        </article>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.market_comparison_label} /></p>
            <p className="mt-4 font-display text-[31px] leading-tight"><TodoText value={content.live_demo.stage_3.market_comparison_value} /></p>
          </article>
          <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.estimated_sale_duration_label} /></p>
            <p className="mt-4 font-display text-[52px] leading-none font-tabular"><TodoText value={content.live_demo.stage_3.estimated_sale_duration_value} /></p>
          </article>
        </div>
        <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
          <ul className="space-y-3">
            {content.live_demo.stage_3.target_groups.map((target) => (
              <li key={target} className="text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={target} /></li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export function ReportViewPage() {
  const demo = content.live_demo.demo_object;
  const firstRow = content.dashboard.list_example_rows[0];
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
          <header className="mt-10 grid gap-8 border-b border-[var(--area-line)] pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="font-display text-[56px] leading-[1.05] tracking-[-0.055em] md:text-[76px]"><TodoText value={demo.address} /></h1>
              <p className="mt-5 text-[18px] leading-7 text-[var(--area-muted)]"><TodoText value={objectSummaryFromDemo(demo)} /></p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <ButtonLink href={safeHref(firstRow.url)} target={content.report_view.header_url_target} rel="noreferrer" tone="ghost" className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]">
                <TodoText value={content.report_view.header_url_label} /> <ExternalLink size={14} strokeWidth={1.5} />
              </ButtonLink>
              <div className="inline-flex rounded-[6px] border border-[var(--area-line-strong)] p-1 font-mono text-[12px] uppercase tracking-[0.1em]">
                {content.report_view.header_translate_toggle.map((language, index) => <button key={language} className={cn('rounded-[4px] px-3 py-2', index === 0 ? 'bg-[var(--area-ink)] text-[var(--area-paper)]' : 'text-[var(--area-muted)]')}><TodoText value={language} /></button>)}
              </div>
              <Button><TodoText value={content.report_view.header_export_label} /></Button>
            </div>
          </header>
          <div className="mx-auto max-w-[840px]">
            <ExtractionSection />
            <QualitySection />
            <StrategySection />
          </div>
        </div>
      </main>
    </>
  );
}
