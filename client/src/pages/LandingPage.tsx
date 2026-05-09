import { useState } from "react";
import { Link } from "wouter";

const findings = [
  ["red", "Energieausweis fehlt", "EAVG Pflichtangabe. HWB und fGEE ergänzen."],
  ["red", "Provision nicht ausgewiesen", "Zahler und Höhe im Inserat klar machen."],
  ["amber", "Widerspruch: Baujahr vs. Neubau", "Irreführungsrisiko senken, Formulierung ändern."],
];

const packages = [
  {
    name: "Starter",
    price: "49",
    detail: "Für Einzel-Makler.",
    quota: "20 Analysen / Monat",
    featured: false,
    items: ["Alle 3 Analyse-Stufen", "Alle 10 Pflichtprüfungen", "Wiener Bezirksdaten", "Report-Export als PDF", "Email-Support"],
  },
  {
    name: "Professional",
    price: "149",
    detail: "Für aktive Makler mit Volumen.",
    quota: "100 Analysen / Monat",
    featured: true,
    items: ["Alles aus Starter", "Verkaufsstrategie-Modul", "Prioritäts-Analyse", "Deutsch-Englisch Textvarianten", "Telefon-Support während Bürozeiten"],
  },
  {
    name: "Agentur",
    price: "399",
    detail: "Für Maklerbüros mit mehreren Köpfen.",
    quota: "Unbegrenzt",
    featured: false,
    items: ["Alles aus Professional", "Bis zu 10 Team-Mitglieder", "Analyse-Historie pro Mitglied", "Custom-Branding im Report", "Persönlicher Account-Manager"],
  },
];

function ListingCard() {
  return (
    <article className="listing-card">
      <p className="mono">Mariahilfer Straße 87, 1060 Wien</p>
      <h3>Charmante 3-Zimmer-Altbauwohnung im Herzen von Mariahilf</h3>
      <dl>
        <div className="field-row is-visible"><dt>Kaufpreis</dt><dd>€ 489.000</dd></div>
        <div className="field-row is-visible"><dt>Wohnfläche</dt><dd>78 m²</dd></div>
        <div className="field-row is-visible"><dt>Zimmer</dt><dd>3</dd></div>
        <div className="field-row is-visible"><dt>Baujahr</dt><dd className="warn">1908</dd></div>
        <div className="field-row is-visible"><dt>Energieausweis</dt><dd className="bad">fehlt</dd></div>
        <div className="field-row is-visible"><dt>Betriebskosten</dt><dd className="warn">nicht angegeben</dd></div>
        <div className="field-row is-visible"><dt>Provision</dt><dd className="bad">nicht ausgewiesen</dd></div>
      </dl>
      <p className="flag field-row is-visible">Als "Neubau-Charakter" beworben</p>
    </article>
  );
}

function FlowSection() {
  return (
    <section id="flow" className="section flow-section">
      <div className="section-head">
        <p className="eyebrow">So arbeitet AREA</p>
        <h2>Drei Stufen, aber ohne Textwand.</h2>
        <p>AREA baut den Report Abschnitt für Abschnitt auf: erst Rohdaten, dann Pflichtfehler, dann die konkrete Verkaufsentscheidung.</p>
      </div>

      <div className="flow-stage apple-build">
        <ListingCard />
        <div className="flow-panel scroll-report" aria-label="Scrollender Analyseaufbau">
          <article className="flow-card active is-visible">
            <p className="eyebrow">Stufe 1 - Datenextraktion</p>
            <h3>10 Felder erkannt</h3>
            <div className="mini-table">
              <div><span>Adresse</span><b>Mariahilfer Straße 87</b></div>
              <div><span>Kaufpreis</span><b>€ 489.000</b></div>
              <div><span>Wohnfläche</span><b>78 m²</b></div>
              <div><span>Energie</span><b>fehlt</b></div>
            </div>
          </article>

          <article className="flow-card active is-visible">
            <p className="eyebrow">Stufe 2 - Qualitätsprüfung</p>
            <div className="split-metric">
              <div><span>Pflichtfehler</span><strong>4</strong></div>
              <div>
                <span>Textqualität</span>
                <strong>62/100</strong>
                <div className="bar"><i style={{ width: "62%" }} /></div>
              </div>
            </div>
            <ul className="compact-list status-list">
              {findings.map(([severity, title]) => (
                <li key={title}><span className={`severity-dot ${severity}`} /><b>{title}</b></li>
              ))}
            </ul>
          </article>

          <article className="flow-card active is-visible">
            <p className="eyebrow">Stufe 3 - Verkaufsstrategie</p>
            <h3>Korrigieren, dann verkaufen.</h3>
            <div className="strategy-grid">
              <span>Markt</span><b>8% unter Bezirks-Ø</b>
              <span>Zielgruppe</span><b>Erstkäufer, Paare, Anleger</b>
              <span>Dauer</span><b>47 Tage</b>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function AnalysisSection() {
  return (
    <section id="analysis" className="section analysis-section">
      <div className="section-head">
        <p className="eyebrow">Analyse-Seite</p>
        <h2>Vorher links. Nachher rechts.</h2>
      </div>

      <div className="compare-reports">
        <article className="mini-report before">
          <div className="mini-report-head">
            <p className="eyebrow">Vorher</p>
            <span className="status-pill danger">Nicht veröffentlichen</span>
          </div>
          <div className="expose-sheet expose-before is-visible">
            <p className="mono">Mariahilfer Straße 87, 1060 Wien</p>
            <h3>Charmante 3-Zimmer-Altbauwohnung im Herzen von Mariahilf</h3>
            <div className="expose-facts">
              <div><span>Kaufpreis</span><b>€ 489.000</b></div>
              <div><span>Wohnfläche</span><b>78 m²</b></div>
              <div><span>Baujahr</span><b className="warn">1908</b></div>
              <div><span>Energie</span><b className="bad">fehlt</b></div>
              <div><span>Provision</span><b className="bad">nicht ausgewiesen</b></div>
              <div><span>Betriebskosten</span><b className="warn">nicht angegeben</b></div>
            </div>
            <p>Helle Wohnung mit <mark className="amber-mark">Neubau-Charakter</mark>, klassischer Raumaufteilung und guter Lage.</p>
            <div className="expose-result danger"><b>4 Pflichtfehler</b><span>Viele Rückfragen vor Veröffentlichung</span></div>
          </div>
        </article>

        <article className="mini-report after">
          <div className="mini-report-head">
            <p className="eyebrow">Nachher mit AREA</p>
            <span className="status-pill good">Veröffentlichbar</span>
          </div>
          <div className="expose-sheet expose-after is-visible">
            <p className="mono">Mariahilfer Straße 87, 1060 Wien</p>
            <h3>Altbauwohnung mit modernisiertem Wohngefühl in Mariahilf</h3>
            <div className="expose-facts">
              <div><span>Kaufpreis</span><b>€ 489.000</b></div>
              <div><span>Wohnfläche</span><b>78 m²</b></div>
              <div><span>Baujahr</span><b>1908, modernisiert</b></div>
              <div><span>Energie</span><b>HWB 78 / fGEE 1,12</b></div>
              <div><span>Provision</span><b>3% zzgl. USt., Käufer</b></div>
              <div><span>Betriebskosten</span><b>€ 268 / Monat</b></div>
            </div>
            <p>Gepflegter Altbau mit hoher Raumwirkung, klaren Pflichtangaben und guter Preisposition im Bezirk.</p>
            <div className="expose-result good"><b>0 kritische Fehler</b><span>Direkt scanbar und veröffentlichbar</span></div>
          </div>
          <span className="example-note">*Beispiel</span>
        </article>
      </div>
    </section>
  );
}

function ReportSection() {
  const [view, setView] = useState<"visual" | "summary">("visual");

  return (
    <section id="report" className="section report-section">
      <div className="report-toolbar">
        <div>
          <p className="eyebrow">AREA Report</p>
          <h2>Schöner Report, aber scanbar.</h2>
        </div>
        <div className="segmented" role="tablist" aria-label="Report Ansicht">
          <button className={view === "visual" ? "active" : ""} type="button" onClick={() => setView("visual")}>Visueller Report</button>
          <button className={view === "summary" ? "active" : ""} type="button" onClick={() => setView("summary")}>Kurzfassung</button>
        </div>
      </div>

      <div className={`report-view ${view === "visual" ? "active" : ""}`}>
        <div className="report-layout">
          <aside className="report-summary-card">
            <span className="status-pill danger">Nicht veröffentlichen</span>
            <h3>4 Pflichtfehler</h3>
            <p>Das Exposé hat rechtliche und vertriebliche Lücken. Zwei Punkte sollten vor Veröffentlichung zwingend korrigiert werden.</p>
            <div className="confidence">
              <div className="quality-meter confidence-meter"><b>95%</b><span>Konfidenz</span><div className="bar light"><i style={{ width: "95%" }} /></div></div>
              <div className="quality-meter"><b>62/100</b><span>Textqualität</span><div className="bar light"><i style={{ width: "62%" }} /></div></div>
            </div>
            <a href="https://www.wko.at/service/wirtschaftsrecht-gewerberecht/energieausweis-pflichten" target="_blank" rel="noreferrer">Energieportal öffnen</a>
            <a href="https://www.wko.at/branchen/information-consulting/immobilien-vermoegenstreuhaender/provision" target="_blank" rel="noreferrer">Provisionsregel prüfen</a>
            <a href="https://www.wien.gv.at/flaechenwidmung/public/" target="_blank" rel="noreferrer">Flächenwidmung Wien</a>
          </aside>
          <div className="report-main">
            <section className="report-card object-card">
              <div><p className="eyebrow">Objektdaten</p><h3>Charmante 3-Zimmer-Altbauwohnung im Herzen von Mariahilf</h3></div>
              <div className="data-grid">
                <div><span>Kaufpreis</span><b>€ 489.000</b></div>
                <div><span>Preis/m²</span><b>€ 6.269</b></div>
                <div><span>Wohnfläche</span><b>78 m²</b></div>
                <div><span>Baujahr</span><b>1908</b></div>
              </div>
            </section>
            <section className="report-card">
              <div className="card-title-row"><div><p className="eyebrow">Qualitätsprüfung</p><h3>Analyse</h3></div><span className="score danger">Hohes Risiko</span></div>
              <div className="finding-list">
                {findings.map(([severity, title, detail]) => (
                  <article key={title}><span className={`dot ${severity}`} /><div><b>{title}</b><p>{detail}</p></div><a href="#demo">Quelle</a></article>
                ))}
              </div>
            </section>
            <section className="report-card action-card">
              <div><p className="eyebrow">Verkaufsstrategie</p><h3>Nach Korrektur ist das Objekt gut vermarktbar.</h3></div>
              <div className="strategy-columns">
                <article><span>Preisposition</span><b>8% unter Bezirks-Ø</b><p>Gutes Argument nach Pflichtkorrektur.</p></article>
                <article><span>Zielgruppe</span><b>Paare, Erstkäufer, Anleger</b><p>Fokus auf Mikrolage und Altbaugefühl.</p></article>
                <article><span>Verkaufsdauer</span><b>47 Tage</b><p>Bei vollständigen Angaben realistisch.</p></article>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className={`report-view ${view === "summary" ? "active" : ""}`}>
        <article className="summary-sheet">
          <div className="summary-title"><span className="status-pill danger">Kurzfassung</span><h3>Was muss ich jetzt tun?</h3></div>
          <ol>
            <li><b>Energieausweis nachtragen:</b> HWB und fGEE ins Inserat schreiben.</li>
            <li><b>Provision konkretisieren:</b> Höhe, USt. und wer zahlt sichtbar ergänzen.</li>
            <li><b>"Neubau-Charakter" ersetzen:</b> besser: "klassischer Altbau mit modernisiertem Wohngefühl".</li>
            <li><b>Betriebskosten ergänzen:</b> Monatliche BK mit Aufschlüsselung angeben.</li>
            <li><b>Nach den Fixes verkaufen:</b> Preis wirkt attraktiv, Zielgruppe klar, erwartete Verkaufsdauer ca. 47 Tage.</li>
          </ol>
        </article>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="section pricing-section">
      <div className="section-head">
        <p className="eyebrow">Pricing</p>
        <h2>Drei Pakete. Ein klares Ziel.</h2>
        <p>Wähle nach Volumen. Jede Variante prüft Exposés auf Pflichtangaben, Widersprüche und Verkaufsrisiko.</p>
      </div>
      <div className="pricing-grid">
        {packages.map((tier) => (
          <article className={`price-card ${tier.featured ? "featured" : ""}`} key={tier.name}>
            <div>{tier.featured ? <span className="choice-pill">Beliebteste Wahl</span> : null}<h3>{tier.name}</h3><p>{tier.detail}</p></div>
            <div className="price"><span>€</span><strong>{tier.price}</strong><em>/Monat</em></div>
            <div className="quota">{tier.quota}</div>
            <ul>{tier.items.map((item) => <li key={item}>{item}</li>)}</ul>
            <a className={`button ${tier.featured ? "pale" : "dark"}`} href="#demo">Demo vereinbaren</a>
          </article>
        ))}
      </div>
      <p className="pricing-note">Alle Preise zzgl. 20% USt. Monatlich kündbar.</p>
    </section>
  );
}

function DemoForm() {
  const [sent, setSent] = useState(false);
  return (
    <section id="demo" className="section demo-section">
      <div className="section-head">
        <p className="eyebrow">Demo vereinbaren</p>
        <h2>Demo vereinbaren</h2>
        <p>Hinterlasse deine Daten - wir melden uns innerhalb von 24 Stunden mit Terminvorschlägen.</p>
      </div>
      <form className="demo-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
        <label><span>Vor- und Nachname</span><input name="name" autoComplete="name" required /></label>
        <label><span>Maklerbüro / Firma</span><input name="company" autoComplete="organization" required /></label>
        <label><span>E-Mail-Adresse</span><input name="email" type="email" autoComplete="email" required /></label>
        <label><span>Telefonnummer (optional)</span><input name="phone" autoComplete="tel" /></label>
        <label><span>Nachricht (optional)</span><textarea name="message" rows={4} /></label>
        <label className="check-row"><input type="checkbox" required /><span>Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Daten zur Kontaktaufnahme zu.</span></label>
        <button className="button dark" type="submit">{sent ? "Anfrage vorgemerkt" : "Anfrage senden"}</button>
      </form>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#landing" aria-label="AREA Start">AREA</a>
        <nav aria-label="Hauptnavigation">
          <a href="#flow">Wie es funktioniert</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Häufige Fragen</a>
          <Link href="/login">Anmelden</Link>
        </nav>
        <a className="nav-cta" href="#demo">Demo vereinbaren</a>
      </header>
      <main>
        <section id="landing" className="hero">
          <div className="grid-bg" />
          <div className="hero-inner">
            <p className="eyebrow">Für Wiener Immobilienmakler</p>
            <h1><span>Die meisten Exposés haben</span><span>3-5 Pflichtfehler.</span><span className="muted">Auch deine.</span></h1>
            <p className="hero-subline">AREA zeigt sie dir - in 30 Sekunden, bevor's der Käufer sieht.</p>
            <div className="hero-actions"><a className="button dark" href="#analysis">Demo vereinbaren</a><a className="button link" href="#flow">Wie es funktioniert</a></div>
          </div>
          <div className="hero-metrics punch-list" aria-label="AREA Prüfversprechen">
            <article><span>01 - Prüfung</span><strong>10</strong><p>Pflichtprüfungen</p></article>
            <article><span>02 - Fehler</span><strong>2-4</strong><p>Pflichtfehler im Normalfall gefunden</p></article>
            <article><span>03 - Verkauf</span><strong>34%</strong><p>schneller zum Verkauf</p></article>
          </div>
        </section>
        <FlowSection />
        <AnalysisSection />
        <ReportSection />
        <PricingSection />
        <section id="faq" className="section faq-section">
          <div className="section-head"><p className="eyebrow">Häufige Fragen</p><h2>Was Makler wissen wollen.</h2></div>
          <div className="faq-list">
            <details open><summary>Was passiert mit den Daten meiner Inserate und Kunden?</summary><p>Daten werden in der EU verarbeitet. Personenbezogene Daten werden vor externer KI-Verarbeitung anonymisiert, soweit sie für die Analyse nicht gebraucht werden.</p></details>
            <details><summary>Mit welchen Portalen funktioniert AREA?</summary><p>Der Prototyp zeigt den willhaben-Workflow. Die Produktidee ist aber portaloffen: URL rein, Exposé raus, Pflichtangaben geprüft.</p></details>
            <details><summary>Wie genau ist die KI? Kann ich mich darauf verlassen?</summary><p>AREA ersetzt keine finale Rechtsberatung. Es markiert Risiken, Pflichtlücken und Widersprüche, damit du gezielt prüfen und korrigieren kannst.</p></details>
            <details><summary>Was unterscheidet AREA von allgemeinen KI-Tools?</summary><p>AREA ist kein Chatfenster. Es ist auf österreichische Immobilien-Exposés, Pflichtangaben, Wiener Marktdaten und verkaufsfertige Reports zugeschnitten.</p></details>
          </div>
        </section>
        <section className="conversion-band" aria-label="Demo Einladung"><div><h2>Bereit, deine Lücken zu finden?</h2><div className="conversion-actions"><a className="button pale" href="#demo">Demo vereinbaren</a><a className="button outline" href="#pricing">Pricing ansehen</a></div></div></section>
        <DemoForm />
      </main>
      <footer className="site-footer">
        <div className="footer-grid-bg" />
        <div className="footer-inner">
          <section className="footer-brand" aria-label="AREA"><a className="footer-logo" href="#landing">AREA</a><p>Automated Real Estate Analyst - gebaut in Wien für den österreichischen Markt.</p></section>
          <nav className="footer-column" aria-label="Produkt"><p>Produkt</p><a href="#flow">Wie es funktioniert</a><a href="#pricing">Preise</a><a href="#demo">Demo vereinbaren</a></nav>
          <nav className="footer-column" aria-label="Rechtliches"><p>Rechtliches</p><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutzerklärung</Link><a href="#faq">AGB</a></nav>
          <nav className="footer-column" aria-label="Kontakt"><p>Kontakt</p><a className="todo-pill" href="mailto:amuj71@icloud.com">amuj71@icloud.com</a><a href="#demo">Demo vereinbaren</a></nav>
        </div>
        <div className="footer-bottom"><span>© 2026 AREA -</span><span className="todo-pill">Amar Mujanovic</span><span>ALLE RECHTE VORBEHALTEN.</span></div>
      </footer>
    </>
  );
}
