import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { cn, userFacingError } from '../lib/area-utils';

type HistoryRow = {
  id: number;
  url: string;
  status: string;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
};

function initials(name?: string | null) {
  const base = name?.trim() || 'AREA User';
  const parts = base.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'A') + (parts[1]?.[0] ?? 'M');
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function formatTimestamp(value: Date): string {
  return new Date(value).toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function seconds(value: number | null): string {
  if (!value) return 'Live';
  return `${(value / 1000).toFixed(1)}s`;
}

function riskFromStatus(status: string): 'high' | 'medium' | 'low' {
  if (status === 'success') return 'low';
  if (status === 'timeout') return 'medium';
  return 'high';
}

function riskLabel(status: string): string {
  if (status === 'success') return 'Fertig';
  if (status === 'timeout') return 'Wartet';
  return 'Fehler';
}

function Sidebar({ name, isAdmin, onLogout }: { name?: string | null; isAdmin: boolean; onLogout: () => void }) {
  return (
    <aside className="workspace-sidebar">
      <Link className="app-logo" href="/dashboard">AREA</Link>
      <nav aria-label="User Navigation">
        <Link className="active" href="/dashboard">Dashboard</Link>
        <a href="#analysis">Neue Analyse</a>
        <a href="#reports">Reports</a>
        {isAdmin ? <Link href="/amar-stats">Admin</Link> : null}
        <button type="button" onClick={onLogout}>Abmelden</button>
      </nav>
      <div className="app-user">
        <span>{initials(name)}</span>
        <div>
          <b>{name || 'Maklerbuero'}</b>
          <small>User Workspace</small>
        </div>
      </div>
    </aside>
  );
}

export function DashboardPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const meQuery = trpc.auth.me.useQuery(undefined, { staleTime: 30_000 });
  const historyQuery = trpc.analysis.history.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate('/login');
    },
  });
  const analyze = trpc.analysis.analyze.useMutation({
    onMutate: () => {
      setError(null);
      setProgress(8);
    },
    onSuccess: async (data) => {
      setProgress(100);
      await historyQuery.refetch();
      const id = typeof data._areaId === 'number' ? data._areaId : null;
      if (id) navigate(`/dashboard/${id}`);
    },
    onError: async (err) => {
      setError(userFacingError(err.message, 'Analyse konnte gerade nicht gestartet werden.'));
      setProgress(0);
      await historyQuery.refetch();
    },
  });

  useEffect(() => {
    if (!analyze.isPending) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(92, value + Math.max(2, Math.round((92 - value) * 0.16))));
    }, 700);
    return () => window.clearInterval(timer);
  }, [analyze.isPending]);

  const rows = useMemo(() => {
    const data = (historyQuery.data ?? []) as HistoryRow[];
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((row) => `${row.url} ${row.status} ${row.errorMessage ?? ''}`.toLowerCase().includes(query));
  }, [historyQuery.data, search]);

  const stats = useMemo(() => {
    const data = (historyQuery.data ?? []) as HistoryRow[];
    const todayKey = new Date().toDateString();
    const today = data.filter((row) => new Date(row.createdAt).toDateString() === todayKey).length;
    const failed = data.filter((row) => row.status !== 'success').length;
    const ready = data.filter((row) => row.status === 'success').length;
    return {
      today,
      critical: failed,
      open: Math.max(0, data.length - ready),
      ready,
    };
  }, [historyQuery.data]);

  const latest = rows[0];

  return (
    <main className="workspace-shell" aria-label="AREA User Interface">
      <Sidebar name={meQuery.data?.name} isAdmin={meQuery.data?.role === 'admin'} onLogout={() => logout.mutate()} />

      <section className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Heute prüfen, heute veröffentlichen.</h1>
          </div>
          <button className="workspace-button pale" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
            Abmelden
          </button>
        </header>

        <section className="analysis-workflow" id="analysis">
          <div>
            <p className="eyebrow">Neue Analyse</p>
            <h2>Exposé-URL einreichen</h2>
          </div>
          <form
            className="analysis-input"
            onSubmit={(event) => {
              event.preventDefault();
              if (!analysisUrl.trim()) return;
              analyze.mutate({ url: analysisUrl.trim() });
            }}
          >
            <input
              value={analysisUrl}
              onChange={(event) => setAnalysisUrl(event.target.value)}
              placeholder="https://www.willhaben.at/iad/immobilien/..."
              aria-label="Exposé URL"
              type="url"
              disabled={analyze.isPending}
              required
            />
            <button className="workspace-button dark" type="submit" disabled={analyze.isPending}>
              {analyze.isPending ? 'Läuft' : 'Analyse starten'}
            </button>
          </form>
          <div className={cn('analysis-status', analyze.isPending && 'is-running')}>
            <span />
            <b>{analyze.isPending ? 'Analyse läuft' : error ? 'Analyse gestoppt' : 'Bereit zur Prüfung'}</b>
            <small>{analyze.isPending ? `Pipeline arbeitet · ${progress}%` : error ?? 'Nach dem Start läuft die Pipeline und der Report erscheint in der Historie.'}</small>
          </div>
        </section>

        <section className="app-kpis" aria-label="Dashboard Kennzahlen">
          <article><span>Heute</span><b>{stats.today}</b><small>Analysen</small></article>
          <article><span>Kritisch</span><b>{stats.critical}</b><small>vor Veröffentlichung</small></article>
          <article><span>Offen</span><b>{stats.open}</b><small>Fixes warten</small></article>
          <article><span>Fertig</span><b>{stats.ready}</b><small>veröffentlichbar</small></article>
        </section>

        <section className="workspace-grid">
          <div className="object-queue" id="reports">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Vergangene Reports</p>
                <input
                  className="workspace-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Reports suchen"
                  aria-label="Reports suchen"
                />
              </div>
              <span>Risiko zuerst</span>
            </div>

            {historyQuery.isLoading ? <p className="workspace-empty">Reports werden geladen.</p> : null}
            {!historyQuery.isLoading && rows.length === 0 ? <p className="workspace-empty">Noch keine Reports. Starte deine erste Analyse.</p> : null}

            {rows.map((row) => (
              <article key={row.id}>
                <div>
                  <b>{hostLabel(row.url)}</b>
                  <p>{row.status === 'success' ? `${seconds(row.durationMs)} Analysezeit · ${formatTimestamp(row.createdAt)}` : userFacingError(row.errorMessage ?? undefined, 'Analyse fehlgeschlagen')}</p>
                </div>
                <span className={`risk ${riskFromStatus(row.status)}`}>{riskLabel(row.status)}</span>
                {row.status === 'success' ? <Link href={`/dashboard/${row.id}`}>Report</Link> : <button type="button" disabled>Report</button>}
              </article>
            ))}
          </div>

          <aside className="next-actions">
            <div className="panel-head">
              <p className="eyebrow">Nächste Aktionen</p>
            </div>
            <ol>
              <li><b>Analyse</b><span>{latest ? `${hostLabel(latest.url)} prüfen` : 'Erste Exposé-URL einreichen'}</span></li>
              <li><b>Reports</b><span>Fehler zuerst abarbeiten</span></li>
              <li><b>Export</b><span>Finale Reports als PDF sichern</span></li>
            </ol>
          </aside>
        </section>
      </section>
    </main>
  );
}
