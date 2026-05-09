import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { content } from "../lib/content";
import { cn, issueCopy, statusClass, TodoText, userFacingError } from "../lib/utils";
import { AppNav } from "../components/Navigation";
import { Button } from "../components/Button";
import { FloatingInput } from "../components/FormField";
import { Modal } from "../components/Modal";
import { trpc } from "../lib/trpc";

type HistoryRow = {
  id: number;
  url: string;
  status: string;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
};

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatTimestamp(value: Date): string {
  return new Date(value).toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusFromRow(status: string): string {
  if (status === "success") return "teal";
  if (status === "timeout") return "amber";
  return "rot";
}

function summaryFromRow(row: HistoryRow): string {
  if (row.status === "success") {
    return row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s Analysezeit` : "Analyse abgeschlossen";
  }
  return userFacingError(row.errorMessage ?? undefined, "Analyse fehlgeschlagen");
}

export function DashboardPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [highlightTop, setHighlightTop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyQuery = trpc.analysis.history.useQuery();
  const analyze = trpc.analysis.analyze.useMutation({
    onMutate: () => {
      setError(null);
      setProgress(3);
      setPhase(0);
    },
    onSuccess: async (data) => {
      setProgress(100);
      setModalOpen(false);
      setHighlightTop(true);
      await historyQuery.refetch();
      window.setTimeout(() => setHighlightTop(false), 1400);
      const id = typeof data._areaId === "number" ? data._areaId : null;
      if (id) navigate(`/dashboard/${id}`);
    },
    onError: async (err) => {
      setError(userFacingError(err.message, "Analyse konnte gerade nicht gestartet werden."));
      setProgress(0);
      await historyQuery.refetch();
    },
  });

  useEffect(() => {
    if (!analyze.isPending) return;
    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(90, value + Math.max(1, Math.round((90 - value) * 0.12))));
      setPhase((value) => Math.min(content.dashboard.new_analysis_modal.progress_phases.length - 1, value + 1));
    }, 760);
    return () => window.clearInterval(interval);
  }, [analyze.isPending]);

  const rows = useMemo(() => {
    const data = (historyQuery.data ?? []) as HistoryRow[];
    const query = search.trim().toLowerCase();
    return query ? data.filter((row) => `${row.url} ${row.status} ${row.errorMessage ?? ""}`.toLowerCase().includes(query)) : data;
  }, [historyQuery.data, search]);

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
            <div className="px-6 py-12 text-center text-[14px] text-[var(--area-muted)]">Reports werden geladen.</div>
          ) : null}
          {!historyQuery.isLoading && rows.length === 0 ? (
            <div className="grid place-items-center px-6 py-[120px] text-center">
              <div className="max-w-[520px]">
                <div className="mx-auto mb-8 h-20 w-28 rounded-[8px] border border-dashed border-[var(--area-line-strong)]" />
                <h2 className="font-display text-[42px] leading-tight"><TodoText value={content.dashboard.empty_state.headline} /></h2>
                <p className="mt-4 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={content.dashboard.empty_state.subline} /></p>
                <Button className="mt-8" onClick={() => setModalOpen(true)}><TodoText value={content.dashboard.empty_state.cta_label} /></Button>
              </div>
            </div>
          ) : null}

          {rows.map((row, index) => (
            <button
              key={row.id}
              onClick={() => row.status === "success" ? navigate(`/dashboard/${row.id}`) : undefined}
              className={cn("grid min-h-16 w-full grid-cols-[18px_1fr_auto_auto] items-center gap-4 border-b border-[var(--area-line)] px-4 text-left transition-colors last:border-b-0 hover:bg-[rgba(15,20,25,0.03)] md:grid-cols-[18px_1.4fr_1fr_auto_140px]", highlightTop && index === 0 && "bg-[rgba(42,157,143,0.08)]")}
            >
              <span className={cn("status-dot", statusClass(statusFromRow(row.status)))} />
              <span>
                <span className="block text-[16px] font-medium text-[var(--area-ink)]">{hostLabel(row.url)}</span>
                <span className="block text-[13px] text-[var(--area-muted)] md:hidden">{summaryFromRow(row)}</span>
              </span>
              <span className="hidden text-[14px] text-[var(--area-muted)] md:block">{summaryFromRow(row)}</span>
              <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[11px] font-tabular", row.status === "success" ? "border-[rgba(42,157,143,0.24)] bg-[rgba(42,157,143,0.06)]" : "border-[rgba(230,57,70,0.24)] bg-[rgba(230,57,70,0.06)]")}>
                <TodoText value={issueCopy(row.status === "success" ? 0 : 1)} />
              </span>
              <span className="hidden text-right text-[13px] text-[var(--area-muted)] md:block">{formatTimestamp(row.createdAt)}</span>
            </button>
          ))}
        </section>
      </main>

      <Modal open={modalOpen} onClose={() => (analyze.isPending ? undefined : setModalOpen(false))} labelledBy="new-analysis-title">
        <h2 id="new-analysis-title" className="font-display text-[42px] leading-tight"><TodoText value={content.dashboard.new_analysis_modal.headline} /></h2>
        <form
          className="mt-8 space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (!analysisUrl.trim()) return;
            analyze.mutate({ url: analysisUrl.trim() });
          }}
        >
          <FloatingInput label={content.dashboard.new_analysis_modal.url_input_label} name="url" type="url" placeholder={content.dashboard.new_analysis_modal.url_input_placeholder} value={analysisUrl} onChange={(event) => setAnalysisUrl(event.target.value)} disabled={analyze.isPending} required />
          <p className="text-[13px] leading-6 text-[var(--area-muted)]"><TodoText value={content.dashboard.new_analysis_modal.url_input_hint} /></p>
          {analyze.isPending ? (
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
          {error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{error}</p> : null}
          <Button type="submit" fullWidth disabled={analyze.isPending}>
            {analyze.isPending ? <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" /> : null}
            <TodoText value={analyze.isPending ? content.dashboard.new_analysis_modal.submit_loading_label : content.dashboard.new_analysis_modal.submit_label} />
          </Button>
        </form>
      </Modal>
    </>
  );
}
