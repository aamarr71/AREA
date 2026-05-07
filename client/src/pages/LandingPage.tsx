import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown, Check, Plus } from 'lucide-react';
import { content } from '../lib/content';
import { cn, safeHref, statusClass, TodoText } from '../lib/area-utils';
import { LandingNav } from '../components/Navigation';
import { Button, ButtonLink } from '../components/Button';
import { Eyebrow, Reveal, SectionHeader, SectionNumber } from '../components/SectionHeader';
import { FloatingInput, FloatingTextarea } from '../components/FormField';
import { CookieBanner } from '../components/CookieBanner';

const ease = [0.16, 1, 0.3, 1] as const;

function Hero() {
  const headline = content.hero.headline;
  const splitToken = '. Auch deine.';
  const lines = headline.includes(splitToken) ? [headline.replace(splitToken, '.'), 'Auch deine.'] : [headline];

  return (
    <section className="relative px-6 pb-[120px] pt-[160px] text-center md:pt-[180px]" aria-labelledby="hero-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.45, ease }}>
        <Eyebrow><TodoText value={content.hero.eyebrow} /></Eyebrow>
      </motion.div>
      <h1 id="hero-title" className="mx-auto mt-8 max-w-[1120px] font-display text-[52px] leading-[1.05] tracking-[-0.055em] text-[var(--area-ink)] md:text-[96px]">
        {lines.map((line, index) => (
          <span key={line} className="block overflow-hidden">
            <motion.span
              className={cn('block', index === 1 && 'text-[rgba(15,20,25,0.56)]')}
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ delay: 0.32 + index * 0.1, duration: 0.7, ease }}
            >
              <TodoText value={line} />
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p
        className="mx-auto mt-8 max-w-[640px] text-[20px] leading-[1.7] text-[var(--area-muted)] md:text-[22px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease }}
      >
        <TodoText value={content.hero.subline} />
      </motion.p>
      <motion.div
        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.55, ease }}
      >
        <ButtonLink href="#contact" size="lg"><TodoText value={content.hero.cta_primary_label} /></ButtonLink>
        <a href={safeHref(content.hero.cta_secondary_anchor)} className="link-underline font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-ink)]">
          <TodoText value={content.hero.cta_secondary_label} />
        </a>
      </motion.div>

      <Reveal delay={0.28} className="mx-auto mt-20 grid max-w-[840px] grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { name: content.live_demo.stage_1.name, value: content.live_demo.stage_1.fields_extracted.length },
          { name: content.live_demo.stage_2.name, value: content.live_demo.stage_2.issues_found_count },
          { name: content.live_demo.stage_3.name, value: content.live_demo.stage_3.estimated_sale_duration_value },
        ].map((item) => (
          <div key={item.name} className="rounded-[8px] border border-[var(--area-line)] bg-[rgba(255,253,250,0.56)] p-5 text-left shadow-hair">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={item.name} /></p>
            <p className="mt-5 font-display text-[44px] leading-none tracking-[-0.05em] font-tabular text-[var(--area-ink)]"><TodoText value={item.value} /></p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

function ListingCard({ compact = false }: { compact?: boolean }) {
  const d = content.live_demo.demo_object;
  const rows: Array<[string, string, 'normal' | 'red' | 'amber']> = [
    [d.price_label, d.price_value, 'normal'],
    [d.size_label, d.size_value, 'normal'],
    [d.rooms_label, d.rooms_value, 'normal'],
    [d.year_label, d.year_value, 'amber'],
    [d.energy_label, d.energy_value, 'red'],
    [d.operating_costs_label, d.operating_costs_value, 'amber'],
    [d.commission_label, d.commission_value, 'red'],
  ];
  return (
    <article className={cn('rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-7 shadow-hair', compact && 'p-5')}>
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={d.address} /></p>
      <h3 className="mt-4 font-display text-[34px] leading-[1.08] tracking-[-0.04em] text-[var(--area-ink)]"><TodoText value={d.title_in_listing} /></h3>
      <div className="mt-8 divide-y divide-[var(--area-line)] border-y border-[var(--area-line)]">
        {rows.map(([label, value, severity]) => (
          <div key={label} className="grid grid-cols-[1fr_auto] gap-5 py-3 text-[14px]">
            <span className="text-[var(--area-muted)]"><TodoText value={label} /></span>
            <span className={cn('font-medium font-tabular', severity === 'red' && 'under-red', severity === 'amber' && 'under-amber')}><TodoText value={value} /></span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[15px] leading-7 text-[var(--area-muted)] under-amber"><TodoText value={d.neubau_flag_in_listing} /></p>
    </article>
  );
}

function ExtractedTable() {
  const d = content.live_demo.demo_object;
  const rows: Array<[string, string]> = [
    [content.live_demo.stage_1.fields_extracted[0], d.address],
    [content.live_demo.stage_1.fields_extracted[1], d.price_value],
    [content.live_demo.stage_1.fields_extracted[2], d.size_value],
    [content.live_demo.stage_1.fields_extracted[3], d.rooms_value],
    [content.live_demo.stage_1.fields_extracted[4], d.year_value],
    [content.live_demo.stage_1.fields_extracted[5], d.energy_value],
    [content.live_demo.stage_1.fields_extracted[6], d.operating_costs_value],
    [content.live_demo.stage_1.fields_extracted[7], d.commission_value],
  ];
  return (
    <div className="mt-7 overflow-hidden rounded-[8px] border border-[var(--area-line)] bg-[rgba(255,253,250,0.72)]">
      {rows.map(([label, value], index) => (
        <motion.div
          key={label}
          className="grid grid-cols-[1.2fr_1fr] border-b border-[var(--area-line)] px-4 py-3 font-mono text-[12px] last:border-b-0"
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.035, duration: 0.35, ease }}
        >
          <span className="text-[var(--area-muted)]"><TodoText value={label} /></span>
          <span className="text-right font-tabular text-[var(--area-ink)]"><TodoText value={value} /></span>
        </motion.div>
      ))}
    </div>
  );
}

function IssuesList() {
  return (
    <div className="mt-6 space-y-3">
      {content.live_demo.stage_2.issues_list.map((issue, index) => (
        <motion.div
          key={issue.title}
          className={cn('rounded-[8px] border border-[var(--area-line)] bg-[rgba(255,253,250,0.76)] p-4', statusClass(issue.severity))}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.06, duration: 0.45, ease }}
        >
          <div className="flex gap-3">
            <span className="mt-1 h-10 w-[3px] rounded-full bg-[var(--status)]" />
            <div>
              <h4 className="font-display text-[23px] leading-tight"><TodoText value={issue.title} /></h4>
              <p className="mt-2 text-[13px] leading-6 text-[var(--area-muted)]"><TodoText value={issue.detail} /></p>
              {issue.law_reference ? <span className="mt-3 inline-flex rounded-[4px] border border-[var(--area-line)] px-2 py-1 font-mono text-[11px] text-[var(--area-muted)]"><TodoText value={issue.law_reference} /></span> : null}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AnimatedCounter({ progress }: { progress: MotionValue<number> }) {
  const count = useTransform(progress, [0.28, 0.55], [0, content.live_demo.stage_2.issues_found_count]);
  const [value, setValue] = useState(0);
  useMotionValueEvent(count, 'change', (latest) => setValue(Math.round(latest)));
  return <>{value}</>;
}

function TypewriterSellingPoints({ progress }: { progress: MotionValue<number> }) {
  const [visible, setVisible] = useState<string[]>(content.live_demo.stage_3.selling_points.map(() => ''));
  const joined = content.live_demo.stage_3.selling_points.join('\n');

  useMotionValueEvent(progress, 'change', (latest) => {
    const normalized = Math.min(1, Math.max(0, (latest - 0.58) / 0.22));
    const visibleChars = Math.floor(joined.length * normalized);
    let cursor = 0;
    setVisible(
      content.live_demo.stage_3.selling_points.map((point) => {
        const nextCursor = cursor + point.length;
        const sliceEnd = Math.max(0, Math.min(point.length, visibleChars - cursor));
        cursor = nextCursor + 1;
        return point.slice(0, sliceEnd);
      }),
    );
  });

  return (
    <ul className="mt-5 space-y-4">
      {content.live_demo.stage_3.selling_points.map((point, index) => (
        <li key={point} className="grid grid-cols-[20px_1fr] gap-3 text-[14px] leading-6 text-[var(--area-muted)]">
          <span className="mt-2 h-px bg-[var(--area-ink)]" />
          <span><TodoText value={visible[index]} /></span>
        </li>
      ))}
    </ul>
  );
}

function StagePanel({
  title,
  description,
  style,
  children,
}: {
  title: string;
  description: string;
  style: Record<string, MotionValue<number> | MotionValue<string> | number | string>;
  children: ReactNode;
}) {
  return (
    <motion.div className="absolute inset-0 overflow-auto rounded-[8px] border border-[var(--area-line)] bg-[rgba(255,253,250,0.86)] p-7 shadow-hair no-scrollbar" style={style}>
      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={title} /></p>
      <p className="mt-4 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={description} /></p>
      {children}
    </motion.div>
  );
}

function DemoDesktop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p1Opacity = useTransform(scrollYProgress, [0, 0.08, 0.26, 0.34], [0, 1, 1, 0]);
  const p2Opacity = useTransform(scrollYProgress, [0.25, 0.34, 0.55, 0.64], [0, 1, 1, 0]);
  const p3Opacity = useTransform(scrollYProgress, [0.55, 0.64, 0.78, 0.86], [0, 1, 1, 0]);
  const p4Opacity = useTransform(scrollYProgress, [0.8, 0.88], [0, 1]);
  const lift = (from: number, to: number) => useTransform(scrollYProgress, [from, to], [20, 0]);
  const scoreWidth = useTransform(scrollYProgress, [0.32, 0.56], ['0%', `${content.live_demo.stage_2.text_quality_score}%`]);
  const [after, setAfter] = useState(false);

  return (
    <div ref={ref} className="demo-scroll desktop-demo mt-24">
      <div className="demo-sticky mx-auto max-w-shell px-6">
        <div className="grid h-full grid-cols-[0.92fr_1fr] gap-8">
          <div className="self-center">
            <ListingCard />
          </div>
          <div className="relative self-center min-h-[660px]">
            <StagePanel title={content.live_demo.stage_1.name} description={content.live_demo.stage_1.description} style={{ opacity: p1Opacity, y: lift(0.02, 0.11) }}>
              <ExtractedTable />
            </StagePanel>
            <StagePanel title={content.live_demo.stage_2.name} description={content.live_demo.stage_2.description} style={{ opacity: p2Opacity, y: lift(0.28, 0.37) }}>
              <div className="mt-7 rounded-[8px] border border-[var(--area-line)] bg-[rgba(15,20,25,0.025)] p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_2.issues_label} /></p>
                    <p className="mt-2 font-display text-[76px] leading-none font-tabular"><AnimatedCounter progress={scrollYProgress} /></p>
                  </div>
                  <div className="w-[220px] pb-3">
                    <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
                      <span><TodoText value={content.live_demo.stage_2.text_quality_label} /></span>
                      <span className="font-tabular"><TodoText value={content.live_demo.stage_2.text_quality_score} />/<TodoText value={content.live_demo.stage_2.text_quality_max} /></span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(15,20,25,0.08)]">
                      <motion.div className="h-full bg-[var(--area-ink)]" style={{ width: scoreWidth }} />
                    </div>
                  </div>
                </div>
              </div>
              <IssuesList />
            </StagePanel>
            <StagePanel title={content.live_demo.stage_3.name} description={content.live_demo.stage_3.description} style={{ opacity: p3Opacity, y: lift(0.56, 0.66) }}>
              <div className="mt-7 grid grid-cols-[1fr_260px] gap-6">
                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.selling_points_label} /></p>
                  <TypewriterSellingPoints progress={scrollYProgress} />
                </div>
                <div className="rounded-[8px] border border-[var(--area-line)] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.market_comparison_label} /></p>
                  <div className="mt-5 space-y-3">
                    <div className="h-3 w-full rounded-full bg-[rgba(15,20,25,0.08)]"><div className="h-3 w-[86%] rounded-full bg-[var(--area-ink)]" /></div>
                    <div className="h-3 w-full rounded-full bg-[rgba(15,20,25,0.08)]"><div className="h-3 w-[78%] rounded-full bg-[var(--area-teal)]" /></div>
                  </div>
                  <p className="mt-4 text-[13px] leading-6 text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.market_comparison_value} /></p>
                  <motion.div className="mt-6 inline-flex rounded-full border border-[rgba(42,157,143,0.38)] px-3 py-2 font-mono text-[12px] text-[var(--area-ink)]" animate={{ scale: [1, 1.035, 1] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.4 }}>
                    <TodoText value={content.live_demo.stage_3.estimated_sale_duration_label} /> · <TodoText value={content.live_demo.stage_3.estimated_sale_duration_value} />
                  </motion.div>
                </div>
              </div>
            </StagePanel>
            <StagePanel title={content.live_demo.before_after_toggle.instruction} description={content.live_demo.stage_3.description} style={{ opacity: p4Opacity, y: lift(0.82, 0.9) }}>
              <div className="mt-8 inline-flex rounded-[6px] border border-[var(--area-line)] p-1">
                {[false, true].map((item) => (
                  <button key={String(item)} onClick={() => setAfter(item)} className={cn('rounded-[4px] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors', after === item ? 'bg-[var(--area-ink)] text-[var(--area-paper)]' : 'text-[var(--area-muted)] hover:bg-[rgba(15,20,25,0.04)]')}>
                    <TodoText value={item ? content.live_demo.before_after_toggle.after_label : content.live_demo.before_after_toggle.before_label} />
                  </button>
                ))}
              </div>
              <div className="relative mt-8 min-h-[300px] rounded-[8px] border border-[var(--area-line)] bg-[rgba(15,20,25,0.025)] p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={String(after)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    {after ? (
                      <div>
                        <h4 className="font-display text-[34px] leading-tight"><TodoText value={content.live_demo.stage_3.selling_points[1]} /></h4>
                        <ul className="mt-6 space-y-3 text-[14px] leading-6 text-[var(--area-muted)]">
                          {content.live_demo.stage_3.target_groups.map((item) => <li key={item} className="grid grid-cols-[18px_1fr] gap-3"><Check size={14} strokeWidth={1.5} className="mt-1" /><span><TodoText value={item} /></span></li>)}
                        </ul>
                      </div>
                    ) : (
                      <ListingCard compact />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </StagePanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoMobile() {
  return (
    <div className="mobile-demo mt-16 gap-6 px-6">
      <Reveal><ListingCard /></Reveal>
      <Reveal><div className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6"><Eyebrow><TodoText value={content.live_demo.stage_1.name} /></Eyebrow><p className="mt-4 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_1.description} /></p><ExtractedTable /></div></Reveal>
      <Reveal><div className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6"><Eyebrow><TodoText value={content.live_demo.stage_2.name} /></Eyebrow><p className="mt-4 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_2.description} /></p><IssuesList /></div></Reveal>
      <Reveal><div className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6"><Eyebrow><TodoText value={content.live_demo.stage_3.name} /></Eyebrow><p className="mt-4 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={content.live_demo.stage_3.description} /></p><ul className="mt-6 space-y-4">{content.live_demo.stage_3.selling_points.map((item) => <li key={item} className="grid grid-cols-[20px_1fr] gap-3 text-[14px] leading-6 text-[var(--area-muted)]"><span className="mt-2 h-px bg-[var(--area-ink)]" /><span><TodoText value={item} /></span></li>)}</ul></div></Reveal>
    </div>
  );
}

function LiveDemoSection() {
  return (
    <section id="live-demo" className="relative py-[120px] md:py-[180px]" aria-labelledby="live-demo-title">
      <SectionNumber number="01" label={content.live_demo.section_eyebrow} />
      <SectionHeader eyebrow={content.live_demo.section_eyebrow} headline={content.live_demo.section_headline} intro={content.live_demo.section_intro} />
      <DemoDesktop />
      <DemoMobile />
      <div className="mt-16 text-center">
        <a href="#pricing" className="link-underline inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)] hover:text-[var(--area-ink)]">
          <TodoText value={content.final_cta.cta_secondary_label} /> <ArrowDown size={14} strokeWidth={1.5} />
        </a>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-[120px] md:py-[180px]">
      <SectionNumber number="02" label={content.trust_strip.section_eyebrow} />
      <div className="mx-auto max-w-[1120px] px-6 text-center">
        <Reveal>
          <blockquote className="font-display text-[42px] leading-[1.12] tracking-[-0.045em] text-[var(--area-ink)] md:text-[68px]">
            <TodoText value={content.trust_strip.market_position_statement} />
          </blockquote>
        </Reveal>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {content.trust_strip.stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06}>
              <div className="h-full rounded-[8px] border border-[var(--area-line)] bg-[rgba(255,253,250,0.64)] p-7 text-left shadow-hair">
                <p className="font-display text-[80px] leading-none tracking-[-0.06em] font-tabular"><TodoText value={stat.value} /></p>
                <p className="mt-6 text-[16px] font-semibold"><TodoText value={stat.label} /></p>
                <p className="mt-3 text-[14px] leading-6 text-[var(--area-muted)]"><TodoText value={stat.detail} /></p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
            {content.trust_strip.tech_credentials.map((credential, index) => (
              <span key={credential} className="inline-flex items-center gap-4">
                <TodoText value={credential} />
                {index < content.trust_strip.tech_credentials.length - 1 ? <span className="h-1 w-1 rounded-full bg-current opacity-40" /> : null}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="py-[120px] md:py-[180px]">
      <SectionNumber number="03" label={content.problem.section_eyebrow} />
      <SectionHeader eyebrow={content.problem.section_eyebrow} headline={content.problem.section_headline} intro={content.problem.section_intro} />
      <div className="mx-auto mt-16 grid max-w-editorial gap-4 px-6 md:grid-cols-3">
        {content.problem.points.map((point, index) => (
          <Reveal key={point} delay={index * 0.05}>
            <article className="h-full border-t border-[var(--area-line-strong)] pt-6">
              <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Problem 0{index + 1}</p>
              <p className="mt-6 text-[20px] leading-8 text-[var(--area-ink)]"><TodoText value={point} /></p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="py-[120px] md:py-[180px]">
      <SectionNumber number="04" label={content.workflow.section_eyebrow} />
      <SectionHeader eyebrow={content.workflow.section_eyebrow} headline={content.workflow.section_headline} intro={content.workflow.section_intro} />
      <div className="mx-auto mt-16 max-w-editorial px-6">
        {content.workflow.steps.map((step, index) => (
          <Reveal key={step.label} delay={index * 0.06}>
            <article className="grid gap-5 border-t border-[var(--area-line)] py-8 md:grid-cols-[120px_0.8fr_1fr]">
              <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={step.label} /></p>
              <h3 className="font-display text-[34px] leading-tight"><TodoText value={step.title} /></h3>
              <p className="text-[16px] leading-8 text-[var(--area-muted)]"><TodoText value={step.detail} /></p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-[120px] md:py-[180px]" aria-labelledby="pricing-title">
      <SectionNumber number="05" label={content.pricing.section_eyebrow} />
      <SectionHeader eyebrow={content.pricing.section_eyebrow} headline={content.pricing.section_headline} intro={content.pricing.section_intro} />
      <div className="mx-auto mt-16 grid max-w-editorial gap-4 px-6 lg:grid-cols-3">
        {content.pricing.tiers.map((tier, index) => (
          <Reveal key={tier.name} delay={index * 0.05}>
            <article className={cn('relative flex min-h-[620px] flex-col rounded-[8px] border p-7 shadow-hair', tier.highlighted ? 'border-[var(--area-ink)] bg-[var(--area-ink)] text-[var(--area-paper)]' : 'border-[var(--area-line)] bg-[rgba(255,253,250,0.68)] text-[var(--area-ink)]')}>
              {'badge_label' in tier && tier.badge_label ? <span className="absolute right-5 top-5 rounded-full border border-current/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"><TodoText value={tier.badge_label} /></span> : null}
              <h3 className="font-display text-[32px] leading-none"><TodoText value={tier.name} /></h3>
              <p className={cn('mt-4 text-[14px] leading-6', tier.highlighted ? 'text-white/58' : 'text-[var(--area-muted)]')}><TodoText value={tier.tagline} /></p>
              <div className="mt-10 flex items-end gap-1 font-tabular">
                <span className="pb-2 font-display text-[24px]"><TodoText value={tier.price_currency} /></span>
                <span className="font-display text-[72px] leading-none tracking-[-0.06em]"><TodoText value={tier.price_value} /></span>
                <span className={cn('pb-3 text-[13px]', tier.highlighted ? 'text-white/58' : 'text-[var(--area-muted)]')}><TodoText value={tier.price_period} /></span>
              </div>
              <div className={cn('mt-7 rounded-[6px] border px-4 py-3 font-mono text-[12px] uppercase tracking-[0.08em]', tier.highlighted ? 'border-white/12 bg-white/6 text-white/84' : 'border-[var(--area-line)] bg-[rgba(15,20,25,0.025)] text-[var(--area-ink)]')}>
                <TodoText value={tier.analyses_per_month} />
              </div>
              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className={cn('grid grid-cols-[18px_1fr] gap-3 text-[14px] leading-6', tier.highlighted ? 'text-white/70' : 'text-[var(--area-muted)]')}>
                    <span className="mt-3 h-px bg-current" />
                    <span><TodoText value={feature} /></span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-10">
                <ButtonLink href="#contact" tone={tier.highlighted ? 'light' : 'solid'} fullWidth>
                  <TodoText value={tier.cta_label} />
                </ButtonLink>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.pricing.billing_note} /></p>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-[120px] md:py-[180px]">
      <SectionNumber number="06" label={content.faq.section_eyebrow} />
      <SectionHeader eyebrow={content.faq.section_eyebrow} headline={content.faq.section_headline} introDropcap={false} />
      <div className="mx-auto mt-16 max-w-editorial px-6">
        {content.faq.items.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.question} className="border-t border-[var(--area-line)] last:border-b">
              <button className="grid w-full grid-cols-[1fr_32px] gap-6 py-8 text-left transition-colors hover:bg-[rgba(15,20,25,0.03)]" onClick={() => setOpen(isOpen ? -1 : index)} aria-expanded={isOpen}>
                <span className="font-display text-[28px] leading-tight tracking-[-0.03em] text-[var(--area-ink)]"><TodoText value={item.question} /></span>
                <span className="grid h-8 w-8 place-items-center text-[var(--area-muted)]"><Plus size={18} strokeWidth={1.5} className={cn('transition-transform duration-300', isOpen && 'rotate-45')} /></span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                    <p className="max-w-[780px] pb-8 text-[16px] leading-8 text-[var(--area-muted)]"><TodoText value={item.answer} /></p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-[var(--area-ink)] px-6 py-[160px] text-center text-[var(--area-paper)] md:py-[200px]">
      <SectionHeader headline={content.final_cta.headline} intro={content.final_cta.subline} inverted introDropcap={false} />
      <Reveal delay={0.15} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <ButtonLink href="#contact" tone="light" size="lg"><TodoText value={content.final_cta.cta_primary_label} /></ButtonLink>
        <ButtonLink href={safeHref(content.final_cta.cta_secondary_anchor)} tone="ghost" size="lg"><TodoText value={content.final_cta.cta_secondary_label} /></ButtonLink>
      </Reveal>
    </section>
  );
}

function ContactSection() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  return (
    <section id="contact" className="px-6 py-[120px] md:py-[180px]">
      <SectionHeader headline={content.contact_form.headline} intro={content.contact_form.intro} introDropcap={false} />
      <div className="mx-auto mt-14 max-w-[480px]">
        {status === 'success' ? (
          <div className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 text-center shadow-hair">
            <p className="font-display text-[34px] leading-tight"><TodoText value={content.contact_form.success_message} /></p>
          </div>
        ) : (
          <form
            className="space-y-7"
            onSubmit={(event) => {
              event.preventDefault();
              setStatus('loading');
              window.setTimeout(() => setStatus('success'), 900);
            }}
          >
            {content.contact_form.fields.map((field) =>
              field.type === 'textarea' ? (
                <FloatingTextarea key={field.name} name={field.name} label={field.label} required={field.required} placeholder={field.placeholder} />
              ) : (
                <FloatingInput key={field.name} name={field.name} label={field.label} type={field.type} required={field.required} />
              ),
            )}
            <label className="grid grid-cols-[18px_1fr] gap-3 text-[13px] leading-6 text-[var(--area-muted)]">
              <input type="checkbox" defaultChecked={content.contact_form.consent_pre_checked} required className="mt-1 h-4 w-4 accent-[var(--area-ink)]" />
              <span><TodoText value={content.contact_form.consent_label} /></span>
            </label>
            <Button type="submit" fullWidth disabled={status === 'loading'}>
              {status === 'loading' ? <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" /> : null}
              <TodoText value={status === 'loading' ? content.contact_form.submit_loading_label : content.contact_form.submit_label} />
            </Button>
            <p className="font-mono text-[11px] leading-5 text-[var(--area-muted)]"><TodoText value={content.contact_form.spam_protection_note} /></p>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--area-line)] px-6 py-20">
      <div className="mx-auto grid max-w-shell gap-12 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <p className="font-display text-[28px] tracking-[-0.04em]"><TodoText value={content.brand.logo_wordmark} /></p>
          <p className="mt-4 max-w-[340px] text-[14px] leading-7 text-[var(--area-muted)]"><TodoText value={content.footer.tagline} /></p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {content.footer.columns.map((column) => (
            <div key={column.header}>
              <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={column.header} /></p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.header}-${link.label}`}>
                    <a
                      href={safeHref(link.href)}
                      onClick={(event) => {
                        if ('action' in link && link.action === 'openCookieBanner') {
                          event.preventDefault();
                          window.dispatchEvent(new Event('area:open-cookie-banner'));
                        }
                      }}
                      className="link-underline text-[14px] text-[var(--area-muted)] hover:text-[var(--area-ink)]"
                    >
                      <TodoText value={link.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-shell border-t border-[var(--area-line)] pt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
        <TodoText value={content.footer.copyright} />
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <LiveDemoSection />
        <TrustSection />
        <ProblemSection />
        <WorkflowSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
        <ContactSection />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
