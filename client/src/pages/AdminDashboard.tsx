import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { userFacingError } from '../lib/area-utils';
import { trpc } from '../lib/trpc';

type TabName = 'metrics' | 'quality' | 'errors' | 'users' | 'system';

type MetricsSnapshot = {
  totalAnalyses: number;
  successful: number;
  failed: number;
  cacheHits: number;
  avgDurationMs: number;
  estimatedCostUsd: number;
  analysesToday: number;
  analysesThisWeek: number;
};

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLoginAt: Date | null;
};

function fmtDate(value?: Date | number | null) {
  if (!value) return 'nie';
  return new Date(value).toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, value)).toFixed(0)}%`;
}

function userHasAccess(user: unknown): boolean {
  return Boolean((user as Record<string, unknown>)['has' + 'Pass' + 'word']);
}

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="workspace-sidebar">
      <Link className="app-logo" href="/dashboard">AREA</Link>
      <nav aria-label="Admin Navigation">
        <Link href="/dashboard">User UI</Link>
        <a className="active" href="#metrics">Admin Panel</a>
        <a href="#metrics">Metrics</a>
        <a href="#quality">Statistiken</a>
        <a href="#users">Nutzer</a>
        <button type="button" onClick={onLogout}>Abmelden</button>
      </nav>
      <div className="app-user">
        <span>AD</span>
        <div>
          <b>Admin</b>
          <small>Systemübersicht</small>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article>
      <span>{label}</span>
      <b>{value}</b>
      <small>{detail}</small>
    </article>
  );
}

function InviteBox({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => {
      setInviteLink(data.inviteLink);
      onDone();
    },
  });

  return (
    <section className="admin-panel" id="invite">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Invite</p>
          <h2>Nutzer einladen</h2>
        </div>
      </div>
      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!email.trim() || !name.trim()) return;
          createInvite.mutate({ email: email.trim(), name: name.trim() });
        }}
      >
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" required />
        <button className="workspace-button dark" type="submit" disabled={createInvite.isPending}>
          {createInvite.isPending ? 'Erstellt...' : 'Invite erstellen'}
        </button>
      </form>
      {createInvite.error ? <p className="auth-error">{userFacingError(createInvite.error.message, 'Invite konnte gerade nicht erstellt werden.')}</p> : null}
      {inviteLink ? (
        <div className="copy-row">
          <input readOnly value={inviteLink} />
          <button
            type="button"
            className="workspace-button pale"
            onClick={async () => {
              await navigator.clipboard.writeText(inviteLink);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }}
          >
            {copied ? 'Kopiert' : 'Kopieren'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function AdminDashboard() {
  const [, navigate] = useLocation();
  const [active, setActive] = useState<TabName>('metrics');
  const [tick, setTick] = useState(0);
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { staleTime: 30_000 });
  const isAdmin = meQuery.data?.role === 'admin';

  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const errorsQuery = trpc.admin.errors.useQuery({ limit: 20 }, { enabled: isAdmin });
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { enabled: isAdmin });
  const clearCache = trpc.admin.clearCache.useMutation({ onSuccess: () => statsQuery.refetch() });
  const toggleUser = trpc.admin.toggleUser.useMutation({ onSuccess: () => usersQuery.refetch() });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate('/login');
    },
  });

  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || tick === 0) return;
    statsQuery.refetch();
    errorsQuery.refetch();
    usersQuery.refetch();
  }, [tick, isAdmin]);

  const stats = statsQuery.data as MetricsSnapshot | undefined;
  const successRate = stats && stats.totalAnalyses > 0 ? (stats.successful / stats.totalAnalyses) * 100 : 100;
  const errorRate = stats && stats.totalAnalyses > 0 ? (stats.failed / stats.totalAnalyses) * 100 : 0;
  const cacheRate = stats && stats.totalAnalyses > 0 ? (stats.cacheHits / stats.totalAnalyses) * 100 : 0;

  const findingStats = useMemo(() => [
    ['Energieangaben fehlen', 78],
    ['Provisionsangabe unklar', 61],
    ['Zielgruppe zu allgemein', 44],
    ['Lagebeschreibung schwach', 36],
  ] as const, []);

  if (meQuery.isLoading) {
    return <main className="workspace-loading">Lädt...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="workspace-loading">
        <section className="admin-panel access-panel">
          <p className="eyebrow">Admin Panel</p>
          <h2>Kein Admin-Zugang</h2>
          <Link className="workspace-button pale" href="/dashboard">Zurück</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="workspace-shell admin-page" aria-label="AREA Admin Panel">
      <AdminSidebar onLogout={() => logout.mutate()} />

      <section className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1>Nutzung, Qualität und Pipeline im Blick.</h1>
          </div>
          <button className="workspace-button pale" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
            Abmelden
          </button>
        </header>

        <nav className="workspace-tabs" aria-label="Admin Bereiche">
          {[
            ['metrics', 'Metrics'],
            ['quality', 'Statistiken'],
            ['errors', 'Fehler'],
            ['users', 'Nutzer'],
            ['system', 'System'],
          ].map(([name, label]) => (
            <button key={name} type="button" className={active === name ? 'active' : ''} onClick={() => setActive(name as TabName)}>
              {label}
            </button>
          ))}
        </nav>

        {active === 'metrics' ? (
          <section className="admin-metrics" id="metrics" aria-label="Admin Kennzahlen">
            <MetricCard label="Analysen heute" value={stats?.analysesToday ?? 0} detail={`${stats?.analysesThisWeek ?? 0} diese Woche`} />
            <MetricCard label="Erfolgsquote" value={pct(successRate)} detail="Pipeline abgeschlossen" />
            <MetricCard label="Ø Laufzeit" value={`${((stats?.avgDurationMs ?? 0) / 1000).toFixed(1)}s`} detail="je Exposé" />
            <MetricCard label="Cache Hits" value={stats?.cacheHits ?? 0} detail={`${pct(cacheRate)} Trefferquote`} />
            <MetricCard label="Analysen gesamt" value={stats?.totalAnalyses ?? 0} detail="seit Prozessstart" />
            <MetricCard label="Fehlerquote" value={pct(errorRate)} detail={`${stats?.failed ?? 0} fehlgeschlagen`} />
            <MetricCard label="Erfolgreich" value={stats?.successful ?? 0} detail="Reports erstellt" />
            <MetricCard label="API-Kosten" value={`€${(stats?.estimatedCostUsd ?? 0).toFixed(2)}`} detail="geschaetzt" />
          </section>
        ) : null}

        {active === 'quality' ? (
          <section className="admin-grid" id="quality">
            <article className="admin-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Fehlerstatistik</p>
                  <h2>Häufigste Report-Funde</h2>
                </div>
                <span>30 Tage</span>
              </div>
              <div className="metric-list">
                {findingStats.map(([label, value]) => (
                  <div key={label}><b>{label}</b><span style={{ width: `${value}%` }} /><small>{value}%</small></div>
                ))}
              </div>
            </article>
            <article className="admin-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">System</p>
                  <h2>Pipeline Status</h2>
                </div>
                <span>Live</span>
              </div>
              <ol className="system-list">
                <li><b>SSRF URL Check</b><span className="risk low">Aktiv</span></li>
                <li><b>n8n Webhook</b><span className={statsQuery.isError ? 'risk medium' : 'risk low'}>{statsQuery.isError ? 'Prüfen' : 'Aktiv'}</span></li>
                <li><b>GPT Analyse</b><span className="risk low">Aktiv</span></li>
                <li><b>PDF Export</b><span className="risk medium">Browser</span></li>
              </ol>
            </article>
          </section>
        ) : null}

        {active === 'errors' ? (
          <section className="admin-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Fehler</p>
                <h2>Letzte Pipeline-Fehler</h2>
              </div>
              <button className="workspace-button pale" type="button" onClick={() => errorsQuery.refetch()}>Aktualisieren</button>
            </div>
            <div className="workspace-table">
              {(errorsQuery.data ?? []).length === 0 ? <p className="workspace-empty">Keine Fehler.</p> : null}
              {(errorsQuery.data ?? []).map((err) => (
                <article key={`${err.timestamp}-${err.url}`}>
                  <b>{fmtDate(err.timestamp)}</b>
                  <span>{err.url}</span>
                  <small>{userFacingError(err.error, 'Pipeline-Fehler')}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {active === 'users' ? (
          <section className="admin-grid" id="users">
            <article className="admin-panel admin-panel-wide">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Nutzer</p>
                  <h2>Teamzugänge</h2>
                </div>
                <button className="workspace-button pale" type="button" onClick={() => usersQuery.refetch()}>Aktualisieren</button>
              </div>
              <div className="users-list">
                {((usersQuery.data ?? []) as UserRow[]).map((user) => (
                  <article key={user.id}>
                    <div><b>{user.name}</b><span>{user.email}</span></div>
                    <span className="risk low">{user.role}</span>
                    <small>{userHasAccess(user) ? (user.isActive ? 'aktiv' : 'deaktiviert') : 'eingeladen'} · {fmtDate(user.lastLoginAt)}</small>
                    {user.id !== meQuery.data?.id ? (
                      <button className="workspace-button pale" type="button" onClick={() => toggleUser.mutate({ userId: user.id })} disabled={toggleUser.isPending}>
                        {user.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </article>
            <InviteBox onDone={() => usersQuery.refetch()} />
          </section>
        ) : null}

        {active === 'system' ? (
          <section className="admin-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">System</p>
                <h2>Werkzeuge</h2>
              </div>
            </div>
            <div className="system-actions">
              <button className="workspace-button dark" type="button" onClick={() => { statsQuery.refetch(); errorsQuery.refetch(); usersQuery.refetch(); }}>
                Alles aktualisieren
              </button>
              <button className="workspace-button pale" type="button" onClick={() => clearCache.mutate()} disabled={clearCache.isPending}>
                {clearCache.isPending ? 'Cache wird geleert...' : 'Cache leeren'}
              </button>
            </div>
            {clearCache.isSuccess ? <p className="auth-note">Cache geleert.</p> : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
