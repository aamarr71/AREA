import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { content } from '../lib/content';
import { cn, issueCopy, statusClass, TodoText } from '../lib/area-utils';
import { trpc } from '../lib/trpc';
import { AppNav } from '../components/Navigation';
import { Button } from '../components/Button';
import { FloatingInput } from '../components/FormField';
import { Modal } from '../components/Modal';

type DashboardRow = {
  id: string;
  status: string;
  address: string;
  summary: string;
  issues_count: number | string;
  date: string;
  url: string;
  disabled?: boolean;
};

function formatTimestamp(value: Date): string {
  return new Date(value).toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hostLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function statusToArea(status: string): string {
  if (status === 'success') return 'teal';
  if (status === 'timeout') return 'amber';
  return 'rot';
}

export function DashboardPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [highlightTop, setHighlightTop] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const historyQuery = trpc.analysis.history.useQuery();
  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess: (data) => {
      const id = typeof data._areaId === 'number' ? data._areaId : null;
      setProgress(100);
      setRunning(false);
      setModalOpen(false);
      setHighlightTop(true);
      historyQuery.refetch();
      window.setTimeout(() => setHighlightTop(false), 1400);
      if (id) navigate(`/dashboard/${id}`);
    },
    onError: (err) => {
      setError(err.message);
      setRunning(false);
      setProgress(0);
      historyQuery.refetch();
    },
  });

  const rows = useMemo(() => {
    const source: DashboardRow[] = historyQuery.data && historyQuery.data.length > 0
      ? historyQuery.data.map((row) => ({
          id: String(row.id),
          status: statusToArea(row.status),
          address: hostLabel(row.url),
          summary: row.status === 'success'
            ? `${row.durationMs != null ? `${(row.durationMs / 1000).toFixed(1)}s` : '__live__'} Analysezeit`
            : row.errorMessage ?? 'Analyse fehlgeschlagen',
          issues_count: row.status === 'success' ? '__live__' : 1,
          date: formatTimestamp(row.createdAt),
          url: row.url,
          disabled: row.status !== 'success',
        }))
      : content.dashboard.list_example_rows.map((row, index) => ({ ...row, id: `demo-${index + 1}` }));
    const query = search.trim().toLowerCase();
    if (!query) return source;
    return source.filter((row) => `${row.address} ${row.summary} ${row.url}`.toLowerCase().includes(query));
  }, [historyQuery.data, search]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(90, value + Math.max(1, Math.round((90 - value) * 0.12)));
        return next;
      });
      setPhase((value) => Math.min(content.dashboard.new_analysis_modal.progress_phases.length - 1, value + 1));
    }, 760);
    return () => {
      window.clearInterval(interval);
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
          {historyQuery.isLoading ? (
            <div className="px-4 py-12 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Lädt...</div>
          ) : rows.length === 0 ? (
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
                key={`${row.id}-${row.date}`}
                type="button"
                disabled={row.disabled}
                onClick={() => navigate(`/dashboard/${row.id}`)}
                className={cn('grid min-h-16 w-full grid-cols-[18px_1fr_auto_auto] items-center gap-4 border-b border-[var(--area-line)] px-4 text-left transition-colors last:border-b-0 hover:bg-[rgba(15,20,25,0.03)] disabled:cursor-not-allowed disabled:opacity-65 md:grid-cols-[18px_1.4fr_1fr_auto_140px]', highlightTop && index === 0 && 'bg-[rgba(42,157,143,0.08)]')}
              >
                <span className={cn('status-dot', statusClass(row.status))} />
                <span>
                  <span className="block text-[16px] font-medium text-[var(--area-ink)]"><TodoText value={row.address} /></span>
                  <span className="block text-[13px] text-[var(--area-muted)] md:hidden"><TodoText value={row.summary} /></span>
                </span>
                <span className="hidden text-[14px] text-[var(--area-muted)] md:block"><TodoText value={row.summary} /></span>
                <span className={cn('rounded-full border px-2.5 py-1 font-mono text-[11px] font-tabular', row.issues_count !== 0 ? 'border-[rgba(230,57,70,0.24)] bg-[rgba(230,57,70,0.06)] text-[var(--area-ink)]' : 'border-[rgba(42,157,143,0.24)] bg-[rgba(42,157,143,0.06)] text-[var(--area-ink)]')}>
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
            if (!analysisUrl.trim()) return;
            setError(null);
            setProgress(3);
            setPhase(0);
            setRunning(true);
            analyzeMutation.mutate({ url: analysisUrl.trim() });
          }}
        >
          <FloatingInput
            label={content.dashboard.new_analysis_modal.url_input_label}
            name="url"
            type="url"
            placeholder={content.dashboard.new_analysis_modal.url_input_placeholder}
            value={analysisUrl}
            onChange={(event) => setAnalysisUrl(event.target.value)}
            disabled={running}
            required
          />
          <p className="text-[13px] leading-6 text-[var(--area-muted)]"><TodoText value={content.dashboard.new_analysis_modal.url_input_hint} /></p>
          {error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{error}</p> : null}
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
