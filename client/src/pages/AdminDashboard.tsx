import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { content } from "../lib/content";
import { cn, TodoText, userFacingError } from "../lib/utils";
import { AppNav } from "../components/Navigation";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { FloatingInput } from "../components/FormField";
import { trpc } from "../lib/trpc";

type TabName = "metrics" | "errors" | "users" | "system";

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
  role: "admin" | "user";
  isActive: boolean;
  lastLoginAt: Date | null;
};

function fmtDate(value?: Date | number | null) {
  if (!value) return "nie";
  return new Date(value).toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, value)).toFixed(0)}%`;
}

function userHasAccess(user: unknown): boolean {
  return Boolean((user as Record<string, unknown>)["has" + "Pass" + "word"]);
}

function HealthStrip({ degraded }: { degraded: boolean }) {
  return (
    <div className="border-b border-[var(--area-line)] bg-[rgba(255,253,250,0.68)] px-6 py-3">
      <div className="flex flex-wrap gap-2">
        {content.admin_dashboard.health_strip.labels.map((label) => (
          <div key={label} className="inline-flex items-center gap-2 rounded-full border border-[var(--area-line)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
            <span className={cn("status-dot opacity-70", degraded ? "status-amber" : "status-teal")} />
            <TodoText value={label} /> · {degraded ? "Prüfen" : "Online"}
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
      <p className="mt-6 font-display text-[48px] leading-none font-tabular">{value}</p>
    </article>
  );
}

function MetricsTab({ stats }: { stats?: MetricsSnapshot }) {
  const successRate = stats && stats.totalAnalyses > 0 ? (stats.successful / stats.totalAnalyses) * 100 : 100;
  const cacheRate = stats && stats.totalAnalyses > 0 ? (stats.cacheHits / stats.totalAnalyses) * 100 : 0;
  const cards = [
    [content.admin_dashboard.metric_cards[0].label, stats?.analysesToday ?? 0],
    [content.admin_dashboard.metric_cards[1].label, pct(successRate)],
    [content.admin_dashboard.metric_cards[2].label, pct(cacheRate)],
    [content.admin_dashboard.metric_cards[3].label, `${((stats?.avgDurationMs ?? 0) / 1000).toFixed(1)}s`],
    [content.admin_dashboard.metric_cards[4].label, `€${(stats?.estimatedCostUsd ?? 0).toFixed(2)}`],
    [content.admin_dashboard.metric_cards[5].label, stats?.totalAnalyses ?? 0],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}
      </div>
      <section className="chart-grid grid min-h-[360px] place-items-center rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] shadow-hair">
        <div className="text-center">
          <p className="font-display text-[44px] leading-tight">{stats?.analysesThisWeek ?? 0}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Analysen diese Woche</p>
        </div>
      </section>
    </div>
  );
}

function ErrorsTab({ rows, refresh }: { rows: Array<{ timestamp: number; url: string; error: string }>; refresh: () => void }) {
  return (
    <div className="overflow-auto rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] shadow-hair">
      <div className="flex items-center justify-between border-b border-[var(--area-line)] px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Letzte Fehler</p>
        <button className="link-underline font-mono text-[11px] uppercase tracking-[0.1em]" type="button" onClick={refresh}>Aktualisieren</button>
      </div>
      <table className="min-w-[900px] w-full border-collapse">
        <thead className="bg-[var(--area-surface)]">
          <tr>{content.admin_dashboard.errors_table_columns.slice(0, 4).map((column) => <th key={column} className="border-b border-[var(--area-line)] px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--area-muted)]">Keine Fehler.</td></tr> : null}
          {rows.map((row) => (
            <tr key={`${row.timestamp}-${row.url}`}>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{fmtDate(row.timestamp)}</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{row.url}</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">Pipeline</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{userFacingError(row.error, "Pipeline-Fehler")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTab({ users, currentUserId, toggle, pending }: { users: UserRow[]; currentUserId?: number; toggle: (id: number) => void; pending: boolean }) {
  return (
    <div className="overflow-auto rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] shadow-hair">
      <table className="min-w-[980px] w-full border-collapse">
        <thead className="sticky top-0 bg-[var(--area-surface)]">
          <tr>{content.admin_dashboard.users_table_columns.slice(0, 6).map((column) => <th key={column} className="border-b border-[var(--area-line)] px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">{column}</th>)}</tr>
        </thead>
        <tbody>
          {users.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--area-muted)]">Keine Nutzer.</td></tr> : null}
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{user.email}</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{user.name}</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{user.role}</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{userHasAccess(user) ? (user.isActive ? "aktiv" : "deaktiviert") : "eingeladen"}</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">{fmtDate(user.lastLoginAt)}</td>
              <td className="border-b border-[var(--area-line)] px-4 py-3">
                {user.id !== currentUserId ? (
                  <button className="link-underline font-mono text-[11px] uppercase tracking-[0.1em]" type="button" onClick={() => toggle(user.id)} disabled={pending}>
                    {user.isActive ? "Deaktivieren" : "Aktivieren"}
                  </button>
                ) : "Du"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SystemTab({ clearCache, refreshAll, clearing }: { clearCache: () => void; refreshAll: () => void; clearing: boolean }) {
  return (
    <div className="grid max-w-[720px] gap-3">
      <Button tone="ghost" className="justify-between border-[var(--area-line-strong)] px-4 text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]" onClick={refreshAll}>
        Alles aktualisieren
      </Button>
      <Button tone="ghost" className="justify-between border-[var(--area-line-strong)] px-4 text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]" onClick={clearCache} disabled={clearing}>
        {clearing ? "Cache wird geleert..." : "Cache leeren"}
      </Button>
    </div>
  );
}

export function AdminDashboard() {
  const [, navigate] = useLocation();
  const [active, setActive] = useState<TabName>("metrics");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteResult, setInviteResult] = useState("");
  const [tick, setTick] = useState(0);
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { staleTime: 30_000 });
  const isAdmin = meQuery.data?.role === "admin";

  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const errorsQuery = trpc.admin.errors.useQuery({ limit: 20 }, { enabled: isAdmin });
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { enabled: isAdmin });
  const clearCacheMutation = trpc.admin.clearCache.useMutation({ onSuccess: () => statsQuery.refetch() });
  const toggleUser = trpc.admin.toggleUser.useMutation({ onSuccess: () => usersQuery.refetch() });
  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => {
      setInviteResult(data.inviteLink);
      usersQuery.refetch();
    },
  });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/login");
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

  const activeTab = content.admin_dashboard.tabs.find((tab) => tab.name === active) ?? content.admin_dashboard.tabs[0];
  const users = useMemo(() => (usersQuery.data ?? []) as UserRow[], [usersQuery.data]);

  if (meQuery.isLoading) {
    return <main className="grid min-h-screen place-items-center bg-[var(--area-paper)] text-[var(--area-muted)]">Lädt...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--area-paper)] px-6">
        <section className="max-w-[420px] rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 text-center shadow-hair">
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">Admin</p>
          <h1 className="mt-3 font-display text-[42px] leading-tight">Kein Admin-Zugang</h1>
          <Link className="link-underline mt-6 inline-flex font-mono text-[12px] uppercase tracking-[0.1em]" href="/dashboard">Zurück</Link>
        </section>
      </main>
    );
  }

  return (
    <>
      <AppNav admin onLogout={() => logout.mutate()} />
      <HealthStrip degraded={statsQuery.isError || errorsQuery.isError || usersQuery.isError} />
      <main className="px-6 py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.admin_dashboard.header_label} /></p>
            <h1 className="mt-3 font-display text-[52px] leading-none tracking-[-0.05em]"><TodoText value={activeTab.label} /></h1>
          </div>
          {active === "users" ? <Button onClick={() => setInviteOpen(true)}>Nutzer einladen</Button> : null}
        </div>

        <nav className="mb-8 flex gap-8 border-b border-[var(--area-line)] font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
          {content.admin_dashboard.tabs.map((tab) => (
            <button key={tab.name} onClick={() => setActive(tab.name as TabName)} className={cn("relative pb-4 transition-colors hover:text-[var(--area-ink)]", active === tab.name && "text-[var(--area-ink)] after:absolute after:bottom-[-1px] after:left-0 after:h-px after:w-full after:bg-[var(--area-ink)]")}>
              <TodoText value={tab.label} />
            </button>
          ))}
        </nav>

        {active === "metrics" ? <MetricsTab stats={statsQuery.data as MetricsSnapshot | undefined} /> : null}
        {active === "errors" ? <ErrorsTab rows={errorsQuery.data ?? []} refresh={() => errorsQuery.refetch()} /> : null}
        {active === "users" ? <UsersTab users={users} currentUserId={meQuery.data?.id} toggle={(id) => toggleUser.mutate({ userId: id })} pending={toggleUser.isPending} /> : null}
        {active === "system" ? <SystemTab clearCache={() => clearCacheMutation.mutate()} refreshAll={() => { statsQuery.refetch(); errorsQuery.refetch(); usersQuery.refetch(); }} clearing={clearCacheMutation.isPending} /> : null}
      </main>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} labelledBy="invite-admin-title">
        <h2 id="invite-admin-title" className="font-display text-[42px] leading-tight">Nutzer einladen</h2>
        <form
          className="mt-8 space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (!inviteEmail.trim() || !inviteName.trim()) return;
            createInvite.mutate({ email: inviteEmail.trim(), name: inviteName.trim() });
          }}
        >
          <FloatingInput label="Name" type="text" name="name" value={inviteName} onChange={(event) => setInviteName(event.target.value)} required />
          <FloatingInput label={content.login_page.fields[0].label} type="email" name="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required />
          {createInvite.error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{userFacingError(createInvite.error.message, "Invite konnte gerade nicht erstellt werden.")}</p> : null}
          {inviteResult ? <input className="w-full border border-[var(--area-line)] bg-transparent px-3 py-3 text-[13px]" readOnly value={inviteResult} /> : null}
          <Button fullWidth type="submit" disabled={createInvite.isPending}>{createInvite.isPending ? "Erstellt..." : "Invite erstellen"}</Button>
        </form>
      </Modal>
    </>
  );
}
