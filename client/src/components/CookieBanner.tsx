import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { content } from '../lib/content';
import { Button } from './Button';
import { Modal } from './Modal';
import { cn, safeHref, TodoText } from '../lib/area-utils';

const STORAGE_KEY = 'area-cookie-choice';

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem(STORAGE_KEY);
    setOpen(!choice);
    const reopen = () => setOpen(true);
    window.addEventListener('area:open-cookie-banner', reopen);
    return () => window.removeEventListener('area:open-cookie-banner', reopen);
  }, []);

  const choose = (choice: 'acceptAll' | 'rejectAll') => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, analysis: choice === 'acceptAll' || analysisEnabled }));
    setOpen(false);
    setSettingsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed bottom-5 left-1/2 z-[70] w-[min(960px,calc(100vw-32px))] -translate-x-1/2 rounded-[8px] border border-[var(--area-line-strong)] bg-[var(--area-surface)] p-5 shadow-hair"
            initial={{ opacity: 0, y: 32, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 24, x: '-50%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-title"
          >
            <a href={safeHref(content.cookie_banner.legal_link_href)} className="link-underline absolute right-5 top-5 hidden font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)] hover:text-[var(--area-ink)] md:inline-flex">
              <TodoText value={content.cookie_banner.legal_link_label} />
            </a>
            <div className="grid gap-5 md:grid-cols-[1fr_390px] md:items-end">
              <div className="max-w-[520px] pr-0 md:pr-8">
                <h2 id="cookie-title" className="font-display text-[28px] leading-tight tracking-[-0.03em]"><TodoText value={content.cookie_banner.headline} /></h2>
                <p className="mt-3 text-[14px] leading-6 text-[var(--area-muted)]"><TodoText value={content.cookie_banner.intro} /></p>
                <a href={safeHref(content.cookie_banner.legal_link_href)} className="link-underline mt-4 inline-flex font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)] hover:text-[var(--area-ink)] md:hidden">
                  <TodoText value={content.cookie_banner.legal_link_label} />
                </a>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {content.cookie_banner.buttons.map((button) => (
                  <Button
                    key={button.action}
                    type="button"
                    tone="ghost"
                    className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]"
                    onClick={() => {
                      if (button.action === 'openSettings') setSettingsOpen(true);
                      if (button.action === 'acceptAll') choose('acceptAll');
                      if (button.action === 'rejectAll') choose('rejectAll');
                    }}
                  >
                    <TodoText value={button.label} />
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} labelledBy="cookie-settings-title">
        <h2 id="cookie-settings-title" className="font-display text-[36px] leading-tight"><TodoText value={content.cookie_banner.buttons.find((b) => b.action === 'openSettings')?.label ?? ''} /></h2>
        <div className="mt-8 divide-y divide-[var(--area-line)] border-y border-[var(--area-line)]">
          {content.cookie_banner.settings_categories.map((category) => {
            const active = category.always_active || analysisEnabled;
            return (
              <div key={category.name} className="flex items-start justify-between gap-6 py-5">
                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em]"><TodoText value={category.name} /></p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--area-muted)]"><TodoText value={category.description} /></p>
                </div>
                <button
                  type="button"
                  disabled={category.always_active}
                  aria-pressed={active}
                  onClick={() => setAnalysisEnabled((value) => !value)}
                  className="relative mt-1 h-7 w-12 rounded-full border border-[var(--area-line-strong)] bg-[rgba(15,20,25,0.05)] transition-colors disabled:opacity-70 aria-pressed:bg-[var(--area-ink)]"
                >
                  <span className={cn('absolute left-1 top-1 h-5 w-5 rounded-full bg-[var(--area-surface)] shadow-hair transition-transform', active && 'translate-x-5')} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" tone="ghost" className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]" onClick={() => choose('rejectAll')}>
            <TodoText value={content.cookie_banner.buttons.find((b) => b.action === 'rejectAll')?.label ?? ''} />
          </Button>
          <Button type="button" onClick={() => choose('acceptAll')}>
            <TodoText value={content.cookie_banner.buttons.find((b) => b.action === 'acceptAll')?.label ?? ''} />
          </Button>
        </div>
      </Modal>
    </>
  );
}
