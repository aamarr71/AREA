import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { userFacingError } from "../lib/utils";

type HistoryRow = {
  id: number;
  url: string;
  status: string;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
};

const demoRows = [
  { id: 0, title: "Mariahilfer Straße 87", risk: "Hoch", riskClass: "high", text: "4 Fehler · Energie, Provision, Neubau-Wording" },
  { id: -1, title: "Margaretenstraße 22", risk: "Mittel", riskClass: "medium", text: "2 Fehler · Betriebskosten, Zielgruppe" },
  { id: -2, title: "Praterstraße 41", risk: "Fertig", riskClass: "low", text: "0 kritische Fehler · veröffentlichbar" },
];

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function rowRisk(row: HistoryRow) {
  if (row.status === "success") return { label: "Fertig", klass: "low", text: row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s Analysezeit` : "Analyse abgeschlossen" };
  if (row.status === "timeout") return { label: "Mittel", klass: "medium", text: "Timeout · erneut prüfen" };
  return { label: "Hoch", klass: "high", text: userFacingError(row.errorMessage ?? undefined, "Analyse fehlgeschlagen") };
}

export function DashboardPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [url, setUrl] = useState("https://www.willhaben.at/iad/immobilien/d/eigentumswohnung/wien");
  const [status, setStatus] = useState({ title: "Bereit zur Prüfung", detail: "Nach dem Start läuft die Pipeline und der Report erscheint in der Historie." });

  const historyQuery = trpc.analysis.history.useQuery(undefined, { retry: false });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/login");
    },
  });
  const analyze = trpc.analysis.analyze.useMutation({
    onMutate: () => setStatus({ title: "Analyse läuft", detail: "URL validiert, Pipeline gestartet, Report wird vorbereitet." }),
    onSuccess: async (data) => {
      setStatus({ title: "Report erstellt", detail: "Analyse abgeschlossen. Der neue Report liegt in deiner Historie." });
      await historyQuery.refetch();
      const id = typeof data._areaId === "number" ? data._areaId : null;
      if (id) navigate(`/dashboard/${id}`);
    },
    onError: (err) => setStatus({ title: "Analyse gestoppt", detail: userFacingError(err.message, "Analyse konnte nicht gestartet werden.") }),
  });

  const rows = useMemo(() => (historyQuery.data ?? []) as HistoryRow[], [historyQuery.data]);
  const today = rows.filter((row) => new Date(row.createdAt).toDateString() === new Date().toDateString()).length;
  const failed = rows.filter((row) => row.status !== "success").length;
  const done = rows.filter((row) => row.status === "success").length;

  return (
    <div className="workspace-page">
      <main className="workspace-shell" aria-label="AREA User Interface">
        <aside className="workspace-sidebar">
          <Link className="app-logo" href="/dashboard">AREA</Link>
          <nav aria-label="User Navigation">
            <Link className="active" href="/dashboard">Dashboard</Link>
            <a href="#analysis">Neue Analyse</a>
            <a href="#reports">Reports</a>
            <Link href="/amar-stats">Admin</Link>
          </nav>
          <div className="app-user"><span>AM</span><div><b>Maklerbüro Wien</b><small>User Workspace</small></div></div>
        </aside>

        <section className="workspace-main">
          <header className="workspace-topbar">
            <div><p className="eyebrow">Dashboard</p><h1>Heute prüfen, heute veröffentlichen.</h1></div>
            <button className="button pale" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>Abmelden</button>
          </header>

          <section className="analysis-workflow" id="analysis">
            <div><p className="eyebrow">Neue Analyse</p><h2>Exposé-URL einreichen</h2></div>
            <form
              className="analysis-input"
              onSubmit={(event) => {
                event.preventDefault();
                if (!url.trim()) return;
                analyze.mutate({ url: url.trim() });
              }}
            >
              <input value={url} aria-label="Exposé URL" onChange={(event) => setUrl(event.target.value)} />
              <button className="button dark" type="submit" disabled={analyze.isPending}>{analyze.isPending ? "Läuft" : "Analyse starten"}</button>
            </form>
            <div className={`analysis-status ${analyze.isPending ? "is-running" : ""}`}>
              <span />
              <b>{status.title}</b>
              <small>{status.detail}</small>
            </div>
          </section>

          <section className="app-kpis" aria-label="Dashboard Kennzahlen">
            <article><span>Heute</span><b>{today}</b><small>Analysen</small></article>
            <article><span>Kritisch</span><b>{failed}</b><small>vor Veröffentlichung</small></article>
            <article><span>Offen</span><b>{analyze.isPending ? 1 : 0}</b><small>Pipeline aktiv</small></article>
            <article><span>Fertig</span><b>{done}</b><small>veröffentlichbar</small></article>
          </section>

          <section className="workspace-grid">
            <div className="object-queue" id="reports">
              <div className="panel-head"><p className="eyebrow">Vergangene Reports</p><span>Risiko zuerst</span></div>
              {historyQuery.isLoading ? <p className="queue-empty">Reports werden geladen.</p> : null}
              {!historyQuery.isLoading && rows.length > 0 ? rows.map((row) => {
                const risk = rowRisk(row);
                return (
                  <article key={row.id}>
                    <b>{hostLabel(row.url)}</b>
                    <span className={`risk ${risk.klass}`}>{risk.label}</span>
                    <p>{risk.text}</p>
                    {row.status === "success" ? <Link href={`/dashboard/${row.id}`}>Report</Link> : <span>Fehler</span>}
                  </article>
                );
              }) : null}
              {!historyQuery.isLoading && rows.length === 0 ? demoRows.map((row) => (
                <article key={row.id}>
                  <b>{row.title}</b>
                  <span className={`risk ${row.riskClass}`}>{row.risk}</span>
                  <p>{row.text}</p>
                  <Link href="/dashboard/demo">Report</Link>
                </article>
              )) : null}
            </div>

            <aside className="next-actions">
              <div className="panel-head"><p className="eyebrow">Nächste Aktionen</p></div>
              <ol>
                <li><b>Energie</b><span>HWB/fGEE ergänzen</span></li>
                <li><b>Provision</b><span>Zahler und Höhe nennen</span></li>
                <li><b>Text</b><span>Neubau-Charakter ersetzen</span></li>
              </ol>
            </aside>
          </section>
        </section>
      </main>
    </div>
  );
}
