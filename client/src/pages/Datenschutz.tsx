import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Datenschutz() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-2xl py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-muted-foreground mb-12">Stand: April 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Verantwortlicher</h2>
            <p className="text-muted-foreground leading-relaxed">
              Amar Mujanović<br />
              Grenzackerstraße 17/5/12<br />
              1100 Wien, Österreich<br /><br />
              E-Mail:{" "}
              <a href="mailto:amuj71@icloud.com" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                amuj71@icloud.com
              </a>
              <br />
              Telefon: +43 676 4235285
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Überblick</h2>
            <p className="text-muted-foreground leading-relaxed">
              AREA („Automated Real Estate Analyst") ist ein webbasiertes Tool zur Qualitätsanalyse von Immobilien-Exposés. Diese Datenschutzerklärung informiert Sie gemäß Art. 13 und 14 der Datenschutz-Grundverordnung (DSGVO) darüber, welche personenbezogenen Daten wir verarbeiten, warum und auf welcher Rechtsgrundlage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Welche Daten wir verarbeiten</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-2">3.1 Account-Daten (bei Registrierung)</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Wenn Sie von uns eingeladen werden und einen Account erstellen, verarbeiten wir:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>E-Mail-Adresse</li>
                  <li>Name</li>
                  <li>Passwort (wird ausschließlich als kryptographischer Hash gespeichert — wir kennen Ihr Passwort nicht)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung (Bereitstellung des vereinbarten Services).
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">3.2 Nutzungsdaten (bei Verwendung des Services)</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Bei jeder Analyse verarbeiten wir:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Die von Ihnen eingegebene Exposé-URL</li>
                  <li>Den Textinhalt der verlinkten Exposé-Seite (wird automatisch abgerufen)</li>
                  <li>Das Analyse-Ergebnis (strukturierter Qualitätsreport)</li>
                  <li>Zeitstempel der Analyse</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Der Textinhalt des Exposés kann Angaben enthalten, die auf dem jeweiligen Immobilienportal öffentlich zugänglich sind, wie etwa Adressen, Bezirke oder Maklernamen.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung (Kernfunktion des Produkts). Für Daten indirekt betroffener Personen (z.B. Eigentümer, deren Daten im öffentlichen Exposé stehen): Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an der Qualitätssicherung öffentlich verfügbarer Immobilienangebote.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">3.3 Session-Daten</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Für die Aufrechterhaltung Ihres Login-Zustands verwenden wir ein technisch notwendiges Session-Cookie. Dieses Cookie enthält eine zufällig generierte Session-ID und dient ausschließlich der Authentifizierung. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung (technisch notwendig für die Login-Funktionalität). Für technisch notwendige Cookies ist kein gesondertes Cookie-Consent erforderlich (§ 165 Abs. 3 TKG 2021).
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">3.4 System-Metriken</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Zur Sicherstellung des Betriebs erfassen wir aggregierte, nicht-personenbezogene Metriken wie Analyse-Dauer, Fehlerraten und Cache-Nutzung. Diese Daten lassen keinen Rückschluss auf einzelne Personen zu.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an Systemstabilität und Fehleranalyse.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Übersetzungsfunktion</h2>
            <p className="text-muted-foreground leading-relaxed">
              AREA bietet eine optionale Übersetzung des Analyse-Reports von Deutsch nach Englisch an. Für diese Übersetzung wird ein externer KI-Übersetzungsdienst eingesetzt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <span className="text-foreground font-medium">Datenschutzmaßnahme:</span> Bevor Texte an den Übersetzungsdienst übermittelt werden, werden alle potenziell personenbezogenen Daten (insbesondere Adressen, Straßennamen und Personennamen) automatisch durch technische Platzhalter ersetzt. Der Übersetzungsdienst erhält ausschließlich anonymisierte Texte. Nach der Übersetzung werden die Platzhalter automatisch durch die Originaldaten ersetzt. Personenbezogene Daten verlassen in diesem Prozess nicht unsere Infrastruktur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Empfänger und Drittlandtransfers</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Zur Bereitstellung des Services setzen wir folgende Dienstleister ein:
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-2">5.1 Railway Inc. (Hosting)</h3>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>Sitz: San Francisco, USA</li>
                  <li>Zweck: Hosting des Servers, der Datenbank und der Logs</li>
                  <li>Absicherung: Data Processing Addendum (DPA) mit EU Standard Contractual Clauses (SCCs) gemäß Art. 46 DSGVO</li>
                  <li>
                    DPA:{" "}
                    <a
                      href="https://railway.com/legal/dpa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                    >
                      railway.com/legal/dpa
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">5.2 OpenAI (KI-Analyse)</h3>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>Vertragspartner für den EWR: OpenAI Ireland Limited, Irland</li>
                  <li>Zweck: KI-gestützte Analyse der Exposé-Inhalte (GPT-4.1)</li>
                  <li>Absicherung: Data Processing Addendum (DPA) mit SCCs für Drittlandtransfers</li>
                  <li>
                    DPA:{" "}
                    <a
                      href="https://openai.com/policies/data-processing-addendum"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                    >
                      openai.com/policies/data-processing-addendum
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">5.3 Übersetzungsdienst</h3>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>Zweck: Maschinelle Übersetzung der Analyse-Reports (DE→EN)</li>
                  <li>Datenschutz: Der Dienst erhält ausschließlich anonymisierte Texte ohne personenbezogene Daten (siehe Abschnitt 4). Es findet kein Transfer personenbezogener Daten statt.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Aufbewahrungsfristen</h2>
            <ul className="text-muted-foreground space-y-3 leading-relaxed">
              <li>
                <span className="text-foreground font-medium">Account-Daten</span> (E-Mail, Name, Passwort-Hash): Solange der Account aktiv ist. Nach Account-Deaktivierung: vollständige Löschung innerhalb von 30 Tagen.
              </li>
              <li>
                <span className="text-foreground font-medium">Analyse-Ergebnisse:</span> 1 Jahr nach Erstellung, danach automatische Löschung — außer der Account ist noch aktiv (dann bleiben Reports abrufbar, solange der Account besteht). Nach Account-Deaktivierung: vollständige Löschung innerhalb von 30 Tagen.
              </li>
              <li>
                <span className="text-foreground font-medium">Session-Daten:</span> 7 Tage (automatisches Ablaufen des Session-Cookies).
              </li>
              <li>
                <span className="text-foreground font-medium">Übersetzungen:</span> Werden nicht gespeichert. Existieren nur für die Dauer der Anfrage.
              </li>
              <li>
                <span className="text-foreground font-medium">System-Metriken:</span> Kein Personenbezug. Server-Logs: 7 Tage.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Auf Anfrage erfolgt eine sofortige, vollständige Löschung aller Ihrer personenbezogenen Daten aus der Datenbank (siehe Abschnitt 7).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Ihre Rechte</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Sie haben gemäß DSGVO folgende Rechte:
            </p>
            <ul className="text-muted-foreground space-y-3 leading-relaxed">
              <li>
                <span className="text-foreground font-medium">Auskunft (Art. 15):</span> Sie können jederzeit Auskunft darüber verlangen, welche personenbezogenen Daten wir über Sie gespeichert haben.
              </li>
              <li>
                <span className="text-foreground font-medium">Berichtigung (Art. 16):</span> Sie können die Berichtigung unrichtiger Daten verlangen.
              </li>
              <li>
                <span className="text-foreground font-medium">Löschung (Art. 17):</span> Sie können die vollständige Löschung aller Ihrer personenbezogenen Daten verlangen. Wir löschen daraufhin sämtliche Daten unwiderruflich aus unserer Datenbank — Account-Daten, gespeicherte Analysen und alle zugehörigen Einträge.
              </li>
              <li>
                <span className="text-foreground font-medium">Einschränkung der Verarbeitung (Art. 18):</span> Sie können unter bestimmten Voraussetzungen die Einschränkung der Verarbeitung verlangen.
              </li>
              <li>
                <span className="text-foreground font-medium">Datenübertragbarkeit (Art. 20):</span> Sie können verlangen, dass wir Ihnen Ihre Daten in einem strukturierten, gängigen, maschinenlesbaren Format bereitstellen.
              </li>
              <li>
                <span className="text-foreground font-medium">Widerspruch (Art. 21):</span> Soweit die Verarbeitung auf berechtigtem Interesse beruht, können Sie Widerspruch einlegen.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
              <a href="mailto:amuj71@icloud.com" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                amuj71@icloud.com
              </a>
              <br />
              Wir werden Ihre Anfrage unverzüglich, spätestens jedoch innerhalb eines Monats, beantworten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Beschwerderecht</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Österreichische Datenschutzbehörde<br />
              Barichgasse 40–42<br />
              1030 Wien<br />
              Telefon: +43 1 52 152-0<br />
              E-Mail:{" "}
              <a href="mailto:dsb@dsb.gv.at" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                dsb@dsb.gv.at
              </a>
              <br />
              Web:{" "}
              <a
                href="https://www.dsb.gv.at"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                www.dsb.gv.at
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Sicherheitsmaßnahmen</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Wir schützen Ihre Daten durch folgende technische und organisatorische Maßnahmen:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
              <li>Verschlüsselte Übertragung aller Daten via HTTPS/TLS</li>
              <li>Passwörter werden ausschließlich als bcrypt-Hashes gespeichert</li>
              <li>Session-Cookies mit httpOnly-, Secure- und SameSite-Attributen</li>
              <li>Schutz vor Server-Side Request Forgery (SSRF) durch DNS-Validierung</li>
              <li>Zugriffsbeschränkung durch Rate Limiting</li>
              <li>Security-HTTP-Headers (Helmet.js)</li>
              <li>Strikte CORS-Konfiguration (nur autorisierte Domains)</li>
              <li>Automatische PII-Redaction bei Drittanbieter-API-Calls</li>
              <li>Kein Self-Signup — Zugang ausschließlich per Einladung durch den Administrator</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Änderungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diese Datenschutzerklärung kann bei Bedarf aktualisiert werden, insbesondere bei Änderungen an den eingesetzten Diensten oder der Verarbeitungszwecke. Die jeweils aktuelle Version ist auf dieser Seite abrufbar.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container max-w-2xl">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Hauptseite
          </Link>
        </div>
      </footer>
    </div>
  );
}
