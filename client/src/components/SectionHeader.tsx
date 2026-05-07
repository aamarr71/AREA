import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/area-utils';
import { TodoText } from '../lib/area-utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, inverted = false, className }: { children: ReactNode; inverted?: boolean; className?: string }) {
  return (
    <p className={cn('font-mono text-[12px] font-medium uppercase tracking-[0.12em]', inverted ? 'text-white/62' : 'text-[var(--area-muted)]', className)}>
      {children}
    </p>
  );
}

export function SectionNumber({ number, label, inverted = false }: { number: string; label: string; inverted?: boolean }) {
  return (
    <div className={cn('mx-auto mb-12 flex max-w-shell items-center gap-3 px-6 font-mono text-[12px] uppercase tracking-[0.1em]', inverted ? 'text-white/56' : 'text-[var(--area-muted)]')}>
      <span>{number}</span>
      <span className="h-px w-10 bg-current opacity-35" />
      <span><TodoText value={label} /></span>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  headline,
  intro,
  className,
  introDropcap = true,
  inverted = false,
}: {
  eyebrow?: string;
  headline: string;
  intro?: string;
  className?: string;
  introDropcap?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className={cn('mx-auto max-w-reading px-6 text-center', className)}>
      {eyebrow ? (
        <Reveal>
          <Eyebrow inverted={inverted}><TodoText value={eyebrow} /></Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={0.06}>
        <h2 className={cn('mt-5 text-[48px] leading-[1.05] md:text-[72px]', inverted ? 'text-[var(--area-paper)]' : 'text-[var(--area-ink)]')}>
          <TodoText value={headline} />
        </h2>
      </Reveal>
      {intro ? (
        <Reveal delay={0.12}>
          <p className={cn('mx-auto mt-7 max-w-reading text-[18px] leading-[1.75]', introDropcap && 'editorial-dropcap', inverted ? 'text-white/70' : 'text-[var(--area-muted)]')}>
            <TodoText value={intro} />
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
