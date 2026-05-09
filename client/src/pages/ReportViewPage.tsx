import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "../lib/trpc";
import { userFacingError } from "../lib/utils";

type FlatRecord = Record<string, unknown>;
type Finding = { severity: "red" | "amber" | "teal"; title: string; detail: string };
type Report = {
  title: string;
  summary: string;
  url: string;
  facts: Array<[string, string]>;
  findings: Finding[];
  strategy: Array<[string, string, string]>;
};

function asRecord(value: unknown): FlatRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as FlatRecord : {};
}

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(asRecord(value)).map(([key, inner]) => `${key}: ${text(inner)}`).join(" · ");
  }
  return String(value);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const result = text(value);
    if (result) return result;
  }
  return "";
}

function severity(value: unknown): Finding["severity"] {
  const lowered = text(value).toLowerCase();
  if (lowered.includes("hoch") || lowered.includes("rot") || lowered.includes("fehlt")) return "red";
  if (lowered.includes("mittel") || lowered.includes("warn") || lowered.includes("amber")) return "amber";
  return "teal";
}

function collectFindings(value: unknown, bucket: Finding[] = []): Finding[] {
  if (!value || bucket.length > 16) return bucket;
  if (Array.isArray(value)) {
    value.forEach((item) => collectFindings(item, bucket));
    return bucket;
  }
  const record = asRecord(value);
  const title = first(record.title, record.titel, record.fehler, record.problem, record.name, record.pruefung);
  const detail = first(record.detail, record.beschreibung, record.hinweis, record.begruendung, record.empfehlung);
  if (title || detail) bucket.push({ severity: severity(record.severity ?? record.status ?? title), title: title || "Hinweis", detail: detail || text(record) });
  Object.values(record).forEach((inner) => typeof inner === "object" ? collectFindings(inner, bucket) : undefined);
  return bucket;
}

function demoReport(): Report {
  return {
    title: "Charmante 3-Zimmer-Altbauwohnung im Herzen von Mariahilf",
    summary: "4 Pflichtfehler · 62/100 Textqualität · 47 Tage Verkaufsdauer",
    url: "https://www.willhaben.at/iad/immobilien/d/eigentumswohnung/wien",
    facts: [["Kaufpreis", "€ 489.000"], ["Preis/m²", "€ 6.269"], ["Wohnfläche", "78 m²"], ["Baujahr", "1908"]],
    findings: [
      { severity: "red", title: "Energieausweis fehlt", detail: "EAVG Pflichtangabe. HWB und fGEE ergänzen." },
      { severity: "red", title: "Provision nicht ausgewiesen", detail: "Zahler und Höhe im Inserat klar machen." },
      { severity: "amber", title: "Widerspruch: Baujahr vs. Neubau", detail: "Irreführungsrisiko senken, Formulierung ändern." },
    ],
    strategy: [["Preisposition", "8% unter Bezirks-Ø", "Gutes Argument nach Pflichtkorrektur."], ["Zielgruppe", "Paare, Erstkäufer, Anleger", "Fokus auf Mikrolage und Altbaugefühl."], ["Verkaufsdauer", "47 Tage", "Bei vollständigen Angaben realistisch."]],
  };
}

function reportFromApi(result: unknown, url: string): Report {
  const root = asRecord(result);
  const extraction = asRecord(root.stufe_1_extraktion);
  const quality = asRecord(root.stufe_2_qualitaetspruefung);
  const strategy = asRecord(root.stufe_3_verkaufsstrategie);
  const market = asRecord(strategy.markteinschaetzung);
  const target = asRecord(strategy.primaere_zielgruppe);
  const findings = collectFindings(quality);

  return {
    title: first(extraction.titel, extraction.title, extraction.adresse, url) || "AREA Report",
    summary: [first(extraction.wohnflaeche, extraction.flaeche), first(extraction.zimmer), first(extraction.preis, extraction.kaufpreis)].filter(Boolean).join(" · ") || "Analyse abgeschlossen",
    url,
    facts: [
      ["Kaufpreis", first(extraction.preis, extraction.kaufpreis) || "nicht angegeben"],
      ["Wohnfläche", first(extraction.wohnflaeche, extraction.flaeche) || "nicht angegeben"],
      ["Zimmer", first(extraction.zimmer) || "nicht angegeben"],
      ["Baujahr", first(extraction.baujahr) || "nicht angegeben"],
    ],
    findings: findings.length ? findings : [{ severity: "teal", title: "Keine kritischen Pflichtfehler erkannt", detail: "Das gespeicherte Analyse-Ergebnis enthält keine markierten Fehler." }],
    strategy: [
      ["Preisposition", first(market.preis_bewertung, market.empfehlung, strategy.marktvergleich) || "nicht berechnet", first(market.empfehlung) || "Preisargument prüfen."],
      ["Zielgruppe", first(target.profil, strategy.zielgruppe, strategy.zielgruppen) || "nicht berechnet", first(target.kaufmotiv) || "Zielgruppe im Text schärfen."],
      ["Verkaufsdauer", first(strategy.geschaetzte_vermarktungsdauer, strategy.verkaufsdauer) || "nicht berechnet", "Nach Korrektur neu bewerten."],
    ],
  };
}

export function ReportViewPage() {
  const [, params] = useRoute("/dashboard/:id");
  const [view, setView] = useState<"visual" | "summary">("visual");
  const rawId = params?.id ?? "demo";
  const numericId = Number(rawId);
  const canFetch = Number.isInteger(numericId) && numericId > 0;
  const detailQuery = trpc.analysis.byId.useQuery({ id: canFetch ? numericId : 1 }, { enabled: canFetch, retry: false });
  const report = useMemo(() => detailQuery.data?.result ? reportFromApi(detailQuery.data.result, detailQuery.data.url) : demoReport(), [detailQuery.data]);
  const critical = report.findings.filter((finding) => finding.severity === "red").length;
  const statusLabel = critical > 0 ? "Nicht veröffentlichen" : "Veröffentlichbar";

  return (
    <div className="workspace-page">
      <main className="workspace-shell" aria-label="AREA Report">
        <aside className="workspace-sidebar">
          <Link className="app-logo" href="/dashboard">AREA</Link>
          <nav aria-label="Report Navigation">
            <Link href="/dashboard">Dashboard</Link>
            <a className="active" href="#report">Report</a>
            <a href="#quality">Qualitätsprüfung</a>
            <a href="#strategy">Strategie</a>
          </nav>
          <div className="app-user"><span>RP</span><div><b>Report</b><small>{statusLabel}</small></div></div>
        </aside>

        <section className="workspace-main">
          <header className="workspace-topbar">
            <div><p className="eyebrow">AREA Report</p><h1>{report.title}</h1></div>
            <a className="button pale" href={report.url} target="_blank" rel="noreferrer">Original öffnen</a>
          </header>

          {detailQuery.isLoading ? <p className="workspace-message">Report wird geladen.</p> : null}
          {detailQuery.isError ? <p className="workspace-message danger">{userFacingError(detailQuery.error.message, "Report konnte nicht geladen werden.")}</p> : null}

          <section id="report" className="report-section embedded-report">
            <div className="report-toolbar">
              <div><p className="eyebrow">Auswertung</p><h2>Schöner Report, aber scanbar.</h2></div>
              <div className="segmented" role="tablist" aria-label="Report Ansicht">
                <button className={view === "visual" ? "active" : ""} type="button" onClick={() => setView("visual")}>Visueller Report</button>
                <button className={view === "summary" ? "active" : ""} type="button" onClick={() => setView("summary")}>Kurzfassung</button>
              </div>
            </div>

            <div className={`report-view ${view === "visual" ? "active" : ""}`}>
              <div className="report-layout">
                <aside className="report-summary-card">
                  <span className={`status-pill ${critical > 0 ? "danger" : "good"}`}>{statusLabel}</span>
                  <h3>{critical || report.findings.length} Hinweise</h3>
                  <p>{report.summary}</p>
                  <div className="confidence">
                    <div className="quality-meter confidence-meter"><b>95%</b><span>Konfidenz</span><div className="bar light"><i style={{ width: "95%" }} /></div></div>
                    <div className="quality-meter"><b>{critical > 0 ? "62/100" : "88/100"}</b><span>Textqualität</span><div className="bar light"><i style={{ width: critical > 0 ? "62%" : "88%" }} /></div></div>
                  </div>
                  <a href="https://www.wko.at/service/wirtschaftsrecht-gewerberecht/energieausweis-pflichten" target="_blank" rel="noreferrer">Energieportal öffnen</a>
                  <a href="https://www.wko.at/branchen/information-consulting/immobilien-vermoegenstreuhaender/provision" target="_blank" rel="noreferrer">Provisionsregel prüfen</a>
                  <a href="https://www.wien.gv.at/flaechenwidmung/public/" target="_blank" rel="noreferrer">Flächenwidmung Wien</a>
                </aside>
                <div className="report-main">
                  <section className="report-card object-card">
                    <div><p className="eyebrow">Objektdaten</p><h3>{report.title}</h3></div>
                    <div className="data-grid">{report.facts.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
                  </section>
                  <section id="quality" className="report-card">
                    <div className="card-title-row"><div><p className="eyebrow">Qualitätsprüfung</p><h3>Analyse</h3></div><span className={`score ${critical > 0 ? "danger" : "good"}`}>{critical > 0 ? "Hohes Risiko" : "Geringes Risiko"}</span></div>
                    <div className="finding-list">{report.findings.map((finding) => <article key={finding.title}><span className={`dot ${finding.severity}`} /><div><b>{finding.title}</b><p>{finding.detail}</p></div><a href="#strategy">Fix</a></article>)}</div>
                  </section>
                  <section id="strategy" className="report-card action-card">
                    <div><p className="eyebrow">Verkaufsstrategie</p><h3>Nach Korrektur ist das Objekt gut vermarktbar.</h3></div>
                    <div className="strategy-columns">{report.strategy.map(([label, value, detail]) => <article key={label}><span>{label}</span><b>{value}</b><p>{detail}</p></article>)}</div>
                  </section>
                </div>
              </div>
            </div>

            <div className={`report-view ${view === "summary" ? "active" : ""}`}>
              <article className="summary-sheet">
                <div className="summary-title"><span className="status-pill danger">Kurzfassung</span><h3>Was muss ich jetzt tun?</h3></div>
                <ol>{report.findings.map((finding) => <li key={finding.title}><b>{finding.title}:</b> {finding.detail}</li>)}</ol>
              </article>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
