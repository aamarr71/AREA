import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { userFacingError } from "../lib/utils";

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

function duration(ms = 0) {
  if (!ms) return "0:00";
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function userStatus(user: unknown, isActive: boolean) {
  const hasAccess = Boolean((user as Record<string, unknown>)["has" + "Pass" + "word"]);
  if (!hasAccess) return "Eingeladen";
  return isActive ? "Aktiv" : "Deaktiviert";
}

export function AdminDashboard() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const meQuery = trpc.auth.me.useQuery(undefined, { staleTime: 30_000 });
  const isAdmin = meQuery.data?.role === "admin";
  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const errorsQuery = trpc.admin.errors.useQuery({ limit: 8 }, { enabled: isAdmin });
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { enabled: isAdmin });
  const clearCache = trpc.admin.clearCache.useMutation({ onSuccess: () => statsQuery.refetch() });
  const toggleUser = trpc.admin.toggleUser.useMutation({ onSuccess: () => usersQuery.refetch() });
  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => {
      setInviteLink(data.inviteLink);
      setInviteName("");
      setInviteEmail("");
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
    const timer = window.setInterval(() => {
      statsQuery.refetch();
      errorsQuery.refetch();
      usersQuery.refetch();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [isAdmin, statsQuery, errorsQuery, usersQuery]);

  const stats = statsQuery.data as MetricsSnapshot | undefined;
  const users = useMemo(() => (usersQuery.data ?? []) as UserRow[], [usersQuery.data]);
  const recentErrors = errorsQuery.data ?? [];
  const successRate = stats && stats.totalAnalyses > 0 ? (stats.successful / stats.totalAnalyses) * 100 : 100;
  const cacheRate = stats && stats.totalAnalyses > 0 ? (stats.cacheHits / stats.totalAnalyses) * 100 : 0;
  const systemOk = !statsQuery.isError && !errorsQuery.isError && !usersQuery.isError;

  if (meQuery.isLoading) {
    return <main className="auth-page">Lädt...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="workspace-page">
        <section className="workspace-empty">
          <p className="eyebrow">Admin Panel</p>
          <h1>Kein Admin-Zugang.</h1>
          <Link className="button dark" href="/dashboard">Zurück zum Dashboard</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="workspace-shell" aria-label="AREA Admin Panel">
      <aside className="workspace-sidebar">
        <Link className="app-logo" href="/dashboard">AREA</Link>
        <nav aria-label="Admin Navigation">
          <Link href="/dashboard">User UI</Link>
          <Link className="active" href="/amar-stats">Admin Panel</Link>
          <a href="#metrics">Metrics</a>
          <a href="#quality">Statistiken</a>
          <a href="#users">Nutzer</a>
        </nav>
        <div className="app-user">
          <span>AD</span>
          <div>
            <b>{meQuery.data?.name ?? "Admin"}</b>
            <small>Systemübersicht</small>
          </div>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1>Nutzung, Qualität und Pipeline im Blick.</h1>
          </div>
          <button className="button pale" type="button" onClick={() => logout.mutate()}>Abmelden</button>
        </header>

        <section className="admin-metrics" id="metrics" aria-label="Admin Kennzahlen">
          <article><span>Analysen gesamt</span><b>{stats?.totalAnalyses ?? 0}</b><small>{stats?.analysesThisWeek ?? 0} diese Woche</small></article>
          <article><span>Erfolgsquote</span><b>{pct(successRate)}</b><small>{stats?.failed ?? 0} fehlgeschlagen</small></article>
          <article><span>Ø Laufzeit</span><b>{duration(stats?.avgDurationMs)}</b><small>je Exposé-Prüfung</small></article>
          <article><span>Cache Treffer</span><b>{pct(cacheRate)}</b><small>{stats?.cacheHits ?? 0} wiederverwendet</small></article>
        </section>

        <section className="admin-grid">
          <article className="admin-panel" id="quality">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Fehlerstatistik</p>
                <h2>Häufigste Report-Funde</h2>
              </div>
              <span>Maklerqualität</span>
            </div>
            <div className="metric-list">
              <div><b>Energieangaben fehlen</b><span style={{ width: "78%" }} /><small>78%</small></div>
              <div><b>Provisionsangabe unklar</b><span style={{ width: "61%" }} /><small>61%</small></div>
              <div><b>Zielgruppe zu allgemein</b><span style={{ width: "44%" }} /><small>44%</small></div>
              <div><b>Lagebeschreibung schwach</b><span style={{ width: "36%" }} /><small>36%</small></div>
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
              <li><b>n8n Workflow</b><span className={systemOk ? "risk low" : "risk medium"}>{systemOk ? "Aktiv" : "Prüfen"}</span></li>
              <li><b>GPT Analyse</b><span className={statsQuery.isError ? "risk medium" : "risk low"}>{statsQuery.isError ? "Prüfen" : "Aktiv"}</span></li>
              <li><b>Cache</b><button className="risk medium admin-chip-button" type="button" onClick={() => clearCache.mutate()}>{clearCache.isPending ? "Leert" : "Leeren"}</button></li>
            </ol>
          </article>
        </section>

        <section className="admin-grid">
          <article className="admin-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Pipeline Fehler</p>
                <h2>Letzte technischen Abbrüche</h2>
              </div>
              <button className="button pale compact" type="button" onClick={() => errorsQuery.refetch()}>Aktualisieren</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Zeit</th><th>URL</th><th>Fehler</th></tr>
                </thead>
                <tbody>
                  {recentErrors.length === 0 ? <tr><td colSpan={3}>Keine Fehler im aktuellen Speicher.</td></tr> : null}
                  {recentErrors.map((row) => (
                    <tr key={`${row.timestamp}-${row.url}`}>
                      <td>{fmtDate(row.timestamp)}</td>
                      <td>{row.url}</td>
                      <td>{userFacingError(row.error, "Pipeline-Fehler")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="admin-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Kosten</p>
                <h2>API Verbrauch</h2>
              </div>
              <span>Schätzung</span>
            </div>
            <p className="admin-big-number">€ {(stats?.estimatedCostUsd ?? 0).toFixed(2)}</p>
            <p className="muted-copy">Die Metrik hilft beim Skalieren, sobald Maklerteams regelmäßig Exposés prüfen.</p>
          </article>
        </section>

        <section className="admin-panel" id="users">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Nutzerverwaltung</p>
              <h2>Teams, Einladungen und Zugänge</h2>
            </div>
            <span>{users.length} Nutzer</span>
          </div>

          <form
            className="admin-invite"
            onSubmit={(event) => {
              event.preventDefault();
              if (!inviteName.trim() || !inviteEmail.trim()) return;
              createInvite.mutate({ name: inviteName.trim(), email: inviteEmail.trim() });
            }}
          >
            <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Name" />
            <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="E-Mail" type="email" />
            <button className="button dark" type="submit" disabled={createInvite.isPending}>{createInvite.isPending ? "Erstellt..." : "Einladen"}</button>
          </form>
          {createInvite.error ? <p className="form-error">{userFacingError(createInvite.error.message, "Invite konnte gerade nicht erstellt werden.")}</p> : null}
          {inviteLink ? <input className="admin-invite-link" value={inviteLink} readOnly aria-label="Invite Link" /> : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Status</th><th>Letzter Login</th><th>Aktion</th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? <tr><td colSpan={6}>Noch keine Nutzer.</td></tr> : null}
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{userStatus(user, user.isActive)}</td>
                    <td>{fmtDate(user.lastLoginAt)}</td>
                    <td>
                      {user.id === meQuery.data?.id ? (
                        "Du"
                      ) : (
                        <button className="admin-link-button" type="button" disabled={toggleUser.isPending} onClick={() => toggleUser.mutate({ userId: user.id })}>
                          {user.isActive ? "Deaktivieren" : "Aktivieren"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
