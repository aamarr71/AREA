import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/area-utils';

type ButtonTone = 'solid' | 'light' | 'ghost' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-[12px]',
  md: 'min-h-11 px-5 text-[13px]',
  lg: 'min-h-12 px-6 text-[14px]',
};

const toneClass: Record<ButtonTone, string> = {
  solid: 'bg-[var(--area-ink)] text-[var(--area-paper)] border-[var(--area-ink)] hover:bg-[#1b2229]',
  light: 'bg-[var(--area-paper)] text-[var(--area-ink)] border-[var(--area-paper)] hover:bg-white',
  ghost: 'bg-transparent text-current border-current/30 hover:bg-white/10',
  text: 'bg-transparent border-transparent text-current px-0 hover:bg-transparent',
  danger: 'bg-transparent text-[var(--area-ink)] border-[var(--area-red)] hover:bg-[rgba(230,57,70,0.06)]',
};

function baseClass(size: ButtonSize, tone: ButtonTone, fullWidth?: boolean) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-[6px] border font-mono font-medium uppercase tracking-[0.08em] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
    sizeClass[size],
    toneClass[tone],
    fullWidth && 'w-full',
  );
}

export function Button({
  children,
  tone = 'solid',
  size = 'md',
  fullWidth,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; tone?: ButtonTone; size?: ButtonSize; fullWidth?: boolean }) {
  return (
    <button className={cn(baseClass(size, tone, fullWidth), className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  tone = 'solid',
  size = 'md',
  fullWidth,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; tone?: ButtonTone; size?: ButtonSize; fullWidth?: boolean }) {
  return (
    <a className={cn(baseClass(size, tone, fullWidth), className)} {...props}>
      {children}
    </a>
  );
}
