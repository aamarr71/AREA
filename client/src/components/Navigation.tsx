import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ChevronDown } from 'lucide-react';
import { content } from '../lib/content';
import { cn, safeHref, TodoText } from '../lib/utils';
import { ButtonLink } from './Button';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: content.hero.cta_secondary_label, href: content.hero.cta_secondary_anchor },
    { label: content.pricing.section_eyebrow, href: '#pricing' },
    { label: content.faq.section_eyebrow, href: '#faq' },
  ];

  return (
    <header className={cn('fixed left-0 top-0 z-50 h-16 w-full transition-all duration-300', scrolled && 'border-b border-[var(--area-line)] bg-[rgba(245,241,235,0.82)] backdrop-blur-xl')}>
      <nav className="mx-auto grid h-full max-w-shell grid-cols-[1fr_auto_1fr] items-center px-6" aria-label="AREA">
        <a href="/" className="font-display text-[22px] font-semibold tracking-[-0.04em] text-[var(--area-ink)]">
          <TodoText value={content.brand.logo_wordmark} />
        </a>
        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={safeHref(link.href)} className="link-underline font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)] transition-colors hover:text-[var(--area-ink)]">
              <TodoText value={link.label} />
            </a>
          ))}
        </div>
        <div className="flex items-center justify-end gap-4">
          <Link href="/login" className="hidden font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)] transition-colors hover:text-[var(--area-ink)] sm:inline-flex">
            <TodoText value={content.login_page.submit_label} />
          </Link>
          <ButtonLink href="#contact" size="sm">
            <TodoText value={content.hero.cta_primary_label} />
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}

export function AppNav({ admin = false, onLogout }: { admin?: boolean; onLogout?: () => void }) {
  return (
    <>
      {admin ? (
        <div className="h-10 border-b border-white/10 bg-[var(--area-ink)] text-[var(--area-paper)]">
          <div className="mx-auto flex h-full max-w-none items-center justify-between px-6 font-mono text-[12px] uppercase tracking-[0.1em]">
            <span><TodoText value={content.admin_dashboard.header_label} /></span>
            <button type="button" onClick={onLogout} className="transition-opacity hover:opacity-70">
              <TodoText value={content.admin_dashboard.logout_label} />
            </button>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 h-16 border-b border-[var(--area-line)] bg-[rgba(245,241,235,0.88)] backdrop-blur-xl">
        <nav className={cn('mx-auto flex h-full items-center justify-between px-6', admin ? 'max-w-none' : 'max-w-shell')} aria-label="AREA App">
          <Link href="/" className="font-display text-[22px] font-semibold tracking-[-0.04em] text-[var(--area-ink)]">
            <TodoText value={content.brand.logo_wordmark} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)] transition-colors hover:text-[var(--area-ink)]">
              <TodoText value={content.dashboard.page_title} />
            </Link>
            <Link href="/amar-stats" className="hidden font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)] transition-colors hover:text-[var(--area-ink)] sm:inline-flex">
              Admin
            </Link>
            <button className="flex items-center gap-2 rounded-[6px] border border-[var(--area-line)] px-3 py-2 text-[13px] text-[var(--area-muted)] transition-colors hover:bg-[rgba(15,20,25,0.03)] hover:text-[var(--area-ink)]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--area-ink)] font-mono text-[11px] text-[var(--area-paper)]"><TodoText value={content.brand.logo_icon_letter} /></span>
              <span className="hidden sm:inline"><TodoText value={content.footer.columns[2].links[0].label} /></span>
              <ChevronDown size={14} strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
