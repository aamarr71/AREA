import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { content } from '../lib/content';
import { cn, issueCopy, statusClass, TodoText } from '../lib/utils';
import { AppNav } from '../components/Navigation';
import { Button } from '../components/Button';
import { FloatingInput } from '../components/FormField';
import { Modal } from '../components/Modal';

export function DashboardPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [highlightTop, setHighlightTop] = useState(false);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return content.dashboard.list_example_rows;
    return content.dashboard.list_example_rows.filter((row) => `${row.address} ${row.summary}`.toLowerCase().includes(query));
  }, [search]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(90, value + Math.max(1, Math.round((90 - value) * 0.12)));
        return next;
      });
      setPhase((value) => Math.min(content.dashboard.new_analysis_modal.progress_phases.length - 1, value + 1));
    }, 760);
    const done = window.setTimeout(() => {
      setProgress(100);
      setRunning(false);
      setModalOpen(false);
      setHighlightTop(true);
      window.setTimeout(() => setHighlightTop(false), 1400);
    }, 2600);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [running]);

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-shell px-6 py-16">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="font-display text-[52px] leading-none tracking-[-0.05em]"><TodoText value={content.dashboard.page_title} /></h1>
            <label className="relative mt-10 block max-w-[480px]">
              <Search className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[var(--area-muted)]" size={16} strokeWidth={1.5} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={content.dashboard.search_placeholder}
                className="w-full border-0 border-b border-[var(--area-line-strong)] bg-transparent py-3 pl-8 text-[15px] outline-none placeholder:text-[var(--area-muted)] focus:border-[var(--area-ink)]"
              />
            </label>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <TodoText value={content.dashboard.new_analysis_button_label} />
          </Button>
        </div>

        <section className="mt-14 overflow-hidden border-y border-[var(--area-line)]" aria-label={content.dashboard.page_title}>
          {rows.length === 0 ? (
            <div className="grid place-items-center px-6 py-[120px] text-center">
              <div className="max-w-[520px]">
                <div className="mx-auto mb-8 h-20 w-28 rounded-[8px] border border-dashed border-[var(--area-line-strong)]" />
                <h2 className="font-display text-[42px] leading-tight"><TodoText value={content.dashboard.empty_state.headline} /></h2>
                <p className="mt-4 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={content.dashboard.empty_state.subline} /></p>
                <Button className="mt-8" onClick={() => setModalOpen(true)}><TodoText value={content.dashboard.empty_state.cta_label} /></Button>
              </div>
            </div>
          ) : (
            rows.map((row, index) => (
              <button
                key={`${row.address}-${row.date}`}
                onClick={() => navigate(`/dashboard/${index + 1}`)}
                className={cn('grid min-h-16 w-full grid-cols-[18px_1fr_auto_auto] items-center gap-4 border-b border-[var(--area-line)] px-4 text-left transition-colors last:border-b-0 hover:bg-[rgba(15,20,25,0.03)] md:grid-cols-[18px_1.4fr_1fr_auto_140px]', highlightTop && index === 0 && 'bg-[rgba(42,157,143,0.08)]')}
              >
                <span className={cn('status-dot', statusClass(row.status))} />
                <span>
                  <span className="block text-[16px] font-medium text-[var(--area-ink)]"><TodoText value={row.address} /></span>
                  <span className="block text-[13px] text-[var(--area-muted)] md:hidden"><TodoText value={row.summary} /></span>
                </span>
                <span className="hidden text-[14px] text-[var(--area-muted)] md:block"><TodoText value={row.summary} /></span>
                <span className={cn('rounded-full border px-2.5 py-1 font-mono text-[11px] font-tabular', row.issues_count > 0 ? 'border-[rgba(230,57,70,0.24)] bg-[rgba(230,57,70,0.06)] text-[var(--area-ink)]' : 'border-[rgba(42,157,143,0.24)] bg-[rgba(42,157,143,0.06)] text-[var(--area-ink)]')}>
                  <TodoText value={issueCopy(row.issues_count)} />
                </span>
                <span className="hidden text-right text-[13px] text-[var(--area-muted)] md:block"><TodoText value={row.date} /></span>
              </button>
            ))
          )}
        </section>
      </main>

      <Modal open={modalOpen} onClose={() => (running ? undefined : setModalOpen(false))} labelledBy="new-analysis-title">
        <h2 id="new-analysis-title" className="font-display text-[42px] leading-tight"><TodoText value={content.dashboard.new_analysis_modal.headline} /></h2>
        <form
          className="mt-8 space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            setProgress(3);
            setPhase(0);
            setRunning(true);
          }}
        >
          <FloatingInput label={content.dashboard.new_analysis_modal.url_input_label} name="url" type="url" placeholder={content.dashboard.new_analysis_modal.url_input_placeholder} disabled={running} required />
          <p className="text-[13px] leading-6 text-[var(--area-muted)]"><TodoText value={content.dashboard.new_analysis_modal.url_input_hint} /></p>
          {running ? (
            <div>
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
                <span><TodoText value={content.dashboard.new_analysis_modal.progress_phases[phase]} /></span>
                <span className="font-tabular">{progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(15,20,25,0.08)]">
                <div className="h-full bg-[var(--area-ink)] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
          <Button type="submit" fullWidth disabled={running}>
            {running ? <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" /> : null}
            <TodoText value={running ? content.dashboard.new_analysis_modal.submit_loading_label : content.dashboard.new_analysis_modal.submit_label} />
          </Button>
        </form>
      </Modal>
    </>
  );
}
