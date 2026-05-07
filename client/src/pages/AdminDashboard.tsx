import { useEffect, useState } from 'react';
import { Copy, Check, Lock, Power, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { content } from '../lib/content';
import { cn, TodoText } from '../lib/area-utils';
import { trpc } from '../lib/trpc';
import { AppNav } from '../components/Navigation';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FloatingInput } from '../components/FormField';

const REFRESH_INTERVAL_MS = 30_000;

type TabName = 'metrics' | 'errors' | 'users' | 'system';

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
  hasPassword: boolean;
  lastLoginAt: Date | null;
};

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

function formatTimestamp(ts: number | Date | null | undefined): string {
  if (ts === null || ts === undefined) return '__live__';
  const date = ts instanceof Date ? ts : new Date(ts);
  return date.toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HealthStrip() {
  return (
    <div className="border-b border-[var(--area-line)] bg-[rgba(255,253,250,0.68)] px-6 py-3">
      <div className="flex flex-wrap gap-2">
        {content.admin_dashboard.health_strip.labels.map((label) => (
          <div key={label} className="inline-flex items-center gap-2 rounded-full border border-[var(--area-line)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
            <span className="status-dot status-teal opacity-70" />
            <TodoText value={label} /> · online
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-5 shadow-hair">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={label} /></p>
      <p className="mt-6 font-display text-[48px] leading-none font-tabular"><TodoText value={value} /></p>
    </article>
  );
}

function MetricsTab({ stats }: { stats: MetricsSnapshot | undefined }) {
  if (!stats) {
    return <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Lädt...</p>;
  }

  const errorRate = stats.totalAnalyses > 0 ? `${((stats.failed / stats.totalAnalyses) * 100).toFixed(1)}%` : '0.0%';
  const cacheRate = stats.totalAnalyses > 0 ? `${((stats.cacheHits / stats.totalAnalyses) * 100).toFixed(1)}%` : '0.0%';
  const metrics = [
    { label: 'Analysen heute', value: stats.analysesToday },
    { label: 'Analysen diese Woche', value: stats.analysesThisWeek },
    { label: 'Analysen gesamt', value: stats.totalAnalyses },
    { label: 'Erfolgsquote (24h)', value: `${Math.max(0, 100 - Number.parseFloat(errorRate)).toFixed(1)}%` },
    { label: 'Cache-Hit-Rate', value: cacheRate },
    { label: 'Ø Analyse-Dauer', value: `${(stats.avgDurationMs / 1000).toFixed(1)}s` },
    { label: 'API-Kosten heute (€)', value: stats.estimatedCostUsd.toFixed(2) },
    { label: 'Fehlerquote', value: errorRate },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((card) => <MetricCard key={card.label} label={card.label} value={card.value} />)}
      </div>
      <section className="chart-grid min-h-[320px] rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-6 shadow-hair">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Funnel / Conversion</p>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            ['Gestartet', stats.totalAnalyses],
            ['Erfolgreich', stats.successful],
            ['Fehler', stats.failed],
            ['Cache', stats.cacheHits],
          ].map(([label, value]) => (
            <div key={label} className="border-l border-[var(--area-line-strong)] pl-4">
              <p className="font-display text-[42px] leading-none font-tabular"><TodoText value={value} /></p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={label} /></p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ErrorsTable({ errors }: { errors: Array<{ url: string; timestamp: number; error: string }> }) {
  return (
    <div className="overflow-auto rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] shadow-hair">
      <table className="min-w-[860px] w-full border-collapse">
        <thead className="sticky top-0 bg-[var(--area-surface)]">
          <tr>
            {['Zeit', 'URL', 'Fehler-Typ', 'Detail'].map((column) => (
              <th key={column} className="border-b border-[var(--area-line)] px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={column} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {errors.length > 0 ? errors.map((err) => (
            <tr key={`${err.timestamp}-${err.url}`}>
              <td className="border-b border-[var(--area-line)] px-4 py-4 font-mono text-[12px] text-[var(--area-muted)]"><TodoText value={formatTimestamp(err.timestamp)} /></td>
              <td className="border-b border-[var(--area-line)] px-4 py-4 font-mono text-[12px]"><TodoText value={err.url} /></td>
              <td className="border-b border-[var(--area-line)] px-4 py-4 text-[14px]">Analyse</td>
              <td className="border-b border-[var(--area-line)] px-4 py-4 text-[14px] text-[var(--area-red)]"><TodoText value={err.error} /></td>
            </tr>
          )) : (
            <tr><td colSpan={4} className="px-4 py-12 text-center text-[14px] text-[var(--area-muted)]">Keine Fehler.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ users, currentUserId, onToggle }: { users: UserRow[]; currentUserId: number; onToggle: (userId: number) => void }) {
  return (
    <div className="overflow-auto rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] shadow-hair">
      <table className="min-w-[980px] w-full border-collapse">
        <thead className="sticky top-0 bg-[var(--area-surface)]">
          <tr>
            {content.admin_dashboard.users_table_columns.map((column) => (
              <th key={column} className="border-b border-[var(--area-line)] px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={column} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border-b border-[var(--area-line)] px-4 py-4 font-mono text-[12px]"><TodoText value={user.email} /></td>
              <td className="border-b border-[var(--area-line)] px-4 py-4"><TodoText value={user.name} /></td>
              <td className="border-b border-[var(--area-line)] px-4 py-4"><TodoText value={user.role} /></td>
              <td className="border-b border-[var(--area-line)] px-4 py-4"><TodoText value={!user.hasPassword ? 'eingeladen' : user.isActive ? 'aktiv' : 'deaktiviert'} /></td>
              <td className="border-b border-[var(--area-line)] px-4 py-4 font-mono text-[12px] text-[var(--area-muted)]"><TodoText value={formatTimestamp(user.lastLoginAt)} /></td>
              <td className="border-b border-[var(--area-line)] px-4 py-4 font-tabular">__live__</td>
              <td className="border-b border-[var(--area-line)] px-4 py-4">
                {user.id !== currentUserId ? (
                  <Button type="button" tone="ghost" className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]" onClick={() => onToggle(user.id)}>
                    <Power size={14} strokeWidth={1.5} />
                    {user.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SystemTab({ onClearCache, clearing }: { onClearCache: () => void; clearing: boolean }) {
  return (
    <div className="grid max-w-[720px] gap-3">
      <Button type="button" tone="ghost" disabled={clearing} className="justify-between border-[var(--area-line-strong)] px-4 text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]" onClick={onClearCache}>
        <span className="inline-flex items-center gap-2"><Trash2 size={14} strokeWidth={1.5} />Cache leeren</span>
      </Button>
      {content.admin_dashboard.system_actions.filter((action) => action.danger).map((action) => (
        <Button key={action.label} type="button" tone="danger" className={cn('justify-between px-4', action.danger && 'border-[var(--area-red)]')}>
          <TodoText value={action.label} />
        </Button>
      ))}
    </div>
  );
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => {
      setInviteLink(data.inviteLink);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} labelledBy="invite-admin-title">
      <h2 id="invite-admin-title" className="font-display text-[42px] leading-tight"><TodoText value="__TODO_ADMIN_INVITE_HEADLINE__" /></h2>
      {!inviteLink ? (
        <form
          className="mt-8 space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            createInvite.mutate({ email: email.trim(), name: name.trim() });
          }}
        >
          <FloatingInput label="Name" type="text" name="name" value={name} onChange={(event) => setName(event.target.value)} disabled={createInvite.isPending} required />
          <FloatingInput label={content.login_page.fields[0].label} type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={createInvite.isPending} required />
          {error ? <p className="text-[13px] text-[var(--area-red)]">{error}</p> : null}
          <Button fullWidth type="submit" disabled={createInvite.isPending || !email.trim() || !name.trim()}>
            <UserPlus size={14} strokeWidth={1.5} />
            Invite erstellen
          </Button>
        </form>
      ) : (
        <div className="mt-8 space-y-5">
          <p className="text-[14px] leading-6 text-[var(--area-muted)]">Invite erstellt. Der Link ist 7 Tage gültig.</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input readOnly value={inviteLink} className="min-w-0 rounded-[6px] border border-[var(--area-line)] bg-transparent px-3 py-2 font-mono text-[12px]" />
            <Button
              type="button"
              tone="ghost"
              className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]"
              onClick={async () => {
                await navigator.clipboard.writeText(inviteLink);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? <Check size={15} strokeWidth={1.5} /> : <Copy size={15} strokeWidth={1.5} />}
            </Button>
          </div>
          <Button type="button" fullWidth onClick={onClose}>Schliessen</Button>
        </div>
      )}
    </Modal>
  );
}

export function AdminDashboard() {
  const [active, setActive] = useState<TabName>('metrics');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const me = meQuery.data;
  const isAdmin = me?.role === 'admin';

  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const errorsQuery = trpc.admin.errors.useQuery({ limit: 20 }, { enabled: isAdmin });
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { enabled: isAdmin });
  const clearCacheMutation = trpc.admin.clearCache.useMutation({ onSuccess: () => statsQuery.refetch() });
  const toggleUserMutation = trpc.admin.toggleUser.useMutation({ onSuccess: () => usersQuery.refetch() });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      window.location.href = '/login';
    },
  });

  useEffect(() => {
    if (!isAdmin) return;
    const id = window.setInterval(() => setTick((value) => value + 1), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || tick === 0) return;
    statsQuery.refetch();
    errorsQuery.refetch();
    if (active === 'users') usersQuery.refetch();
  }, [tick, isAdmin, active]);

  if (meQuery.isLoading) {
    return <main className="grid min-h-screen place-items-center font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Lädt...</main>;
  }

  if (!me || !isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <section className="w-full max-w-[420px] rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 text-center shadow-hair">
          <Lock className="mx-auto text-[var(--area-muted)]" size={24} strokeWidth={1.5} />
          <h1 className="mt-5 font-display text-[36px] leading-tight">Admin-Zugang</h1>
          <p className="mt-3 text-[14px] leading-6 text-[var(--area-muted)]">Dieser Bereich ist nur für Admins.</p>
        </section>
      </main>
    );
  }

  const activeTab = content.admin_dashboard.tabs.find((tab) => tab.name === active) ?? content.admin_dashboard.tabs[0];

  return (
    <>
      <AppNav admin />
      <HealthStrip />
      <main className="px-6 py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.admin_dashboard.header_label} /></p>
            <h1 className="mt-3 font-display text-[52px] leading-none tracking-[-0.05em]"><TodoText value={activeTab.label} /></h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" tone="ghost" className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]" onClick={() => { statsQuery.refetch(); errorsQuery.refetch(); usersQuery.refetch(); }}>
              <RefreshCw size={14} strokeWidth={1.5} />
              Aktualisieren
            </Button>
            {active === 'users' ? <Button type="button" onClick={() => setInviteOpen(true)}><TodoText value="__TODO_INVITE_USER_LABEL__" /></Button> : null}
            <Button type="button" tone="ghost" className="border-[var(--area-line-strong)] text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
              <TodoText value={content.admin_dashboard.logout_label} />
            </Button>
          </div>
        </div>

        <nav className="mb-8 flex gap-8 overflow-auto border-b border-[var(--area-line)] font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
          {content.admin_dashboard.tabs.map((tab) => (
            <button key={tab.name} type="button" onClick={() => setActive(tab.name as TabName)} className={cn('relative whitespace-nowrap pb-4 transition-colors hover:text-[var(--area-ink)]', active === tab.name && 'text-[var(--area-ink)] after:absolute after:bottom-[-1px] after:left-0 after:h-px after:w-full after:bg-[var(--area-ink)]')}>
              <TodoText value={tab.label} />
            </button>
          ))}
        </nav>

        {active === 'metrics' ? <MetricsTab stats={statsQuery.data as MetricsSnapshot | undefined} /> : null}
        {active === 'errors' ? <ErrorsTable errors={errorsQuery.data ?? []} /> : null}
        {active === 'users' ? <UsersTable users={usersQuery.data ?? []} currentUserId={me.id} onToggle={(userId) => toggleUserMutation.mutate({ userId })} /> : null}
        {active === 'system' ? <SystemTab clearing={clearCacheMutation.isPending} onClearCache={() => clearCacheMutation.mutate()} /> : null}
      </main>
      <InviteModal open={inviteOpen} onClose={() => { setInviteOpen(false); usersQuery.refetch(); }} />
    </>
  );
}
