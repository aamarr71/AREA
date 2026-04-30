import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Datenschutz() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-2xl py-16">
        <h1 className="text-xl font-semibold mb-1">Datenschutzerklärung</h1>
        <p className="text-xs text-muted-foreground mb-8">Stand: April 2026</p>

        {/* Inhaltsverzeichnis */}
        <nav className="border-y border-border py-4 my-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground">Inhaltsverzeichnis</p>
          <ol className="space-y-1 text-sm text-muted-foreground list-none leading-relaxed">
            <li><a href="#section-1" className="hover:text-foreground transition-colors">1. Verantwortlicher und Kontaktdaten</a></li>
            <li><a href="#section-2" className="hover:text-foreground transition-colors">2. Allgemeine Hinweise zur Datenverarbeitung und Rechtsgrundlagen</a></li>
            <li><a href="#section-3" className="hover:text-foreground transition-colors">3. Erhebung und Verarbeitung personenbezogener Daten im Einzelnen</a></li>
            <li><a href="#section-4" className="hover:text-foreground transition-colors">4. Einsatz von Systemen künstlicher Intelligenz</a></li>
            <li><a href="#section-5" className="hover:text-foreground transition-colors">5. Cookies und vergleichbare Technologien</a></li>
            <li><a href="#section-6" className="hover:text-foreground transition-colors">6. Datenweitergabe an Dritte und Auftragsverarbeiter</a></li>
            <li><a href="#section-7" className="hover:text-foreground transition-colors">7. Übermittlung personenbezogener Daten in Drittländer</a></li>
            <li><a href="#section-8" className="hover:text-foreground transition-colors">8. Speicherdauer und Löschung personenbezogener Daten</a></li>
            <li><a href="#section-9" className="hover:text-foreground transition-colors">9. Datensicherheit und technische Maßnahmen</a></li>
            <li><a href="#section-10" className="hover:text-foreground transition-colors">10. Rechte der betroffenen Personen</a></li>
            <li><a href="#section-11" className="hover:text-foreground transition-colors">11. Beschwerderecht bei der Aufsichtsbehörde</a></li>
            <li><a href="#section-12" className="hover:text-foreground transition-colors">12. Änderungen dieser Datenschutzerklärung</a></li>
          </ol>
        </nav>

        <div className="space-y-0">
          {/* Abschnitt 1 */}
          <section id="section-1">
            <h2 className="text-base font-semibold mb-2">1. Verantwortlicher und Kontaktdaten</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Verantwortlicher im Sinne des Art. 4 Nr. 7 der Verordnung (EU) 2016/679 des Europäischen Parlaments und des Rates vom 27. April 2016 zum Schutz natürlicher Personen bei der Verarbeitung personenbezogener Daten, zum freien Datenverkehr und zur Aufhebung der Richtlinie 95/46/EG (Datenschutz-Grundverordnung — nachfolgend „DSGVO") ist:
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              Amar Mujanović<br />
              Grenzackerstraße 17/5/12<br />
              1100 Wien, Republik Österreich<br /><br />
              E-Mail:{" "}
              <a href="mailto:amuj71@icloud.com" className="underline underline-offset-4 hover:text-foreground transition-colors">
                amuj71@icloud.com
              </a>
              <br />
              Telefon: +43 676 4235285
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              Einen Datenschutzbeauftragten im Sinne des Art. 37 DSGVO hat der Verantwortliche nicht bestellt, da die Voraussetzungen für eine Bestellpflicht gemäß Art. 37 Abs. 1 DSGVO nicht vorliegen. Bei sämtlichen Fragen zum Datenschutz, zur Verarbeitung Ihrer personenbezogenen Daten oder zur Ausübung Ihrer Betroffenenrechte wenden Sie sich bitte unmittelbar an den Verantwortlichen unter den oben angegebenen Kontaktdaten.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 2 */}
          <section id="section-2">
            <h2 className="text-base font-semibold mb-2">2. Allgemeine Hinweise zur Datenverarbeitung und Rechtsgrundlagen</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              2.1 Der Verantwortliche verarbeitet personenbezogene Daten im Sinne des Art. 4 Nr. 1 DSGVO ausschließlich im Einklang mit den Bestimmungen der DSGVO, des österreichischen Datenschutzgesetzes (DSG), BGBl I Nr. 165/1999 idgF, sowie des Telekommunikationsgesetzes 2021 (TKG 2021), BGBl I Nr. 190/2021 idgF, und sonstiger anwendbarer datenschutzrechtlicher Vorschriften.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              2.2 Eine Verarbeitung personenbezogener Daten erfolgt nur, sofern hierfür eine Rechtsgrundlage gemäß Art. 6 Abs. 1 DSGVO vorliegt. Im Rahmen der über diese Website angebotenen Dienste kommen insbesondere folgende Rechtsgrundlagen zur Anwendung:
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3 pl-4">
              (a) Art. 6 Abs. 1 lit. a DSGVO — die betroffene Person hat ihre Einwilligung zu der Verarbeitung der sie betreffenden personenbezogenen Daten für einen oder mehrere bestimmte Zwecke gegeben;
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-2 pl-4">
              (b) Art. 6 Abs. 1 lit. b DSGVO — die Verarbeitung ist für die Erfüllung eines Vertrags, dessen Vertragspartei die betroffene Person ist, oder zur Durchführung vorvertraglicher Maßnahmen erforderlich, die auf Anfrage der betroffenen Person erfolgen;
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-2 pl-4">
              (c) Art. 6 Abs. 1 lit. c DSGVO — die Verarbeitung ist zur Erfüllung einer rechtlichen Verpflichtung erforderlich, der der Verantwortliche unterliegt;
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-2 pl-4">
              (d) Art. 6 Abs. 1 lit. f DSGVO — die Verarbeitung ist zur Wahrung der berechtigten Interessen des Verantwortlichen oder eines Dritten erforderlich, sofern nicht die Interessen oder Grundrechte und Grundfreiheiten der betroffenen Person, die den Schutz personenbezogener Daten erfordern, überwiegen.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              2.3 Soweit die Verarbeitung auf der Rechtsgrundlage des Art. 6 Abs. 1 lit. f DSGVO beruht, bestehen die berechtigten Interessen des Verantwortlichen insbesondere in dem sicheren, störungsfreien und wirtschaftlichen Betrieb des Dienstes, der Verhinderung missbräuchlicher Nutzung sowie in der Verbesserung des Dienstleistungsangebots.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 3 */}
          <section id="section-3">
            <h2 className="text-base font-semibold mb-4">3. Erhebung und Verarbeitung personenbezogener Daten im Einzelnen</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">3.1 Bereitstellung der Website und Erstellung von Protokolldateien (Server-Logfiles)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Bei jedem Zugriff auf diese Website werden durch den Hosting-Anbieter automatisiert Informationen in sogenannten Server-Logfiles erfasst, die Ihr Browser übermittelt. Dies umfasst insbesondere:
                </p>
                <div className="mt-2 pl-4 text-sm text-muted-foreground leading-normal space-y-1">
                  <p>— die IP-Adresse des anfragenden Rechners</p>
                  <p>— Datum und Uhrzeit des Zugriffs (Zeitstempel)</p>
                  <p>— die angeforderte URL einschließlich der verwendeten HTTP-Methode</p>
                  <p>— den HTTP-Statuscode der Serverantwort</p>
                  <p>— die übertragene Datenmenge in Byte</p>
                  <p>— die Referrer-URL (die zuvor besuchte Seite, soweit vom Browser übermittelt)</p>
                  <p>— den verwendeten Webbrowser sowie dessen Version</p>
                  <p>— das verwendete Betriebssystem</p>
                </div>
                <p className="text-sm text-muted-foreground leading-normal mt-3">
                  Diese Daten werden zum Zweck des sicheren und störungsfreien Betriebs der Website, zur Erkennung und Abwehr von Angriffen sowie zur technischen Fehleranalyse verarbeitet. Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Verarbeitung erfolgt auf Grundlage des Art. 6 Abs. 1 lit. f DSGVO; das berechtigte Interesse des Verantwortlichen ergibt sich aus den vorgenannten Zwecken der Datenerhebung.
                </p>
                <p className="text-sm text-muted-foreground leading-normal mt-2">
                  Speicherdauer: Server-Logfiles werden nach spätestens 30 Tagen automatisiert gelöscht, sofern keine darüber hinausgehende Aufbewahrung zu Zwecken der Beweissicherung im Zusammenhang mit Sicherheitsvorfällen erforderlich ist.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">3.2 Registrierung und Nutzerkonten</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Die Nutzung der AREA-Analysefunktionen setzt die vorherige Erstellung eines passwortgeschützten Benutzerkontos voraus. Benutzerkonten werden ausschließlich durch den Verantwortlichen im Wege einer persönlichen Einladung (sogenannter „Magic Link") angelegt. Eine Selbstregistrierung ist nicht vorgesehen.
                </p>
                <p className="text-sm text-muted-foreground leading-normal mt-2">
                  Im Rahmen der Registrierung werden folgende personenbezogene Daten verarbeitet:
                </p>
                <div className="mt-2 pl-4 text-sm text-muted-foreground leading-normal space-y-1">
                  <p>— E-Mail-Adresse</p>
                  <p>— Vor- und Nachname</p>
                  <p>— Passwort (das Passwort wird ausschließlich in kryptographisch gehashter Form unter Verwendung des bcrypt-Algorithmus gespeichert; eine Speicherung oder Kenntnisnahme des Klartextpassworts durch den Verantwortlichen ist technisch ausgeschlossen)</p>
                </div>
                <p className="text-sm text-muted-foreground leading-normal mt-3">
                  Die Verarbeitung dieser Daten erfolgt auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO und ist für die Begründung und Durchführung des zwischen dem Verantwortlichen und dem Nutzer bestehenden Vertragsverhältnisses über die Bereitstellung des AREA-Dienstes erforderlich.
                </p>
                <p className="text-sm text-muted-foreground leading-normal mt-2">
                  Speicherdauer: Die Account-Daten werden für die Dauer des bestehenden Vertragsverhältnisses gespeichert. Nach Beendigung des Vertragsverhältnisses und Ablauf etwaiger gesetzlicher Aufbewahrungspflichten (insbesondere gemäß §§ 131, 132 BAO) werden die Daten gelöscht.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">3.3 Sitzungsverwaltung (Session-Cookies)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Zur Authentifizierung eingeloggter Nutzer und zur Aufrechterhaltung der Sitzungszuordnung setzt der Verantwortliche ein technisch notwendiges Sitzungs-Cookie ein (siehe dazu näher Abschnitt 5 dieser Datenschutzerklärung).
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">3.4 Analyse von Immobilien-Exposés (Kernfunktionalität)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Wenn ein registrierter Nutzer eine URL zu einem öffentlich zugänglichen Immobilien-Exposé zur Analyse übermittelt, werden im Rahmen des Analysevorgangs folgende Daten verarbeitet:
                </p>
                <div className="mt-2 pl-4 text-sm text-muted-foreground leading-normal space-y-1">
                  <p>— die vom Nutzer eingegebene URL des Exposés</p>
                  <p>— der öffentlich zugängliche Textinhalt der unter dieser URL abrufbaren Webseite</p>
                  <p>— ein kryptographischer Hash (SHA-256) des abgerufenen Seiteninhalts zum Zweck der Cache-Steuerung</p>
                  <p>— das Analyse-Ergebnis (strukturierter Report)</p>
                  <p>— Metadaten des Analysevorgangs (Zeitpunkt, Dauer, Fehlerstatus)</p>
                </div>
                <p className="text-sm text-muted-foreground leading-normal mt-3">
                  Die eingegebene URL wird einer automatisierten Sicherheitsüberprüfung unterzogen, um die missbräuchliche Nutzung des Dienstes zu serverseitiger Anfragemanipulation (Server-Side Request Forgery — SSRF) auszuschließen. Die Analyse des Exposé-Inhalts erfolgt unter Einsatz eines Large Language Model (siehe hierzu Abschnitt 4 dieser Datenschutzerklärung).
                </p>
                <p className="text-sm text-muted-foreground leading-normal mt-2">
                  Die Verarbeitung erfolgt auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO, da sie zur Erfüllung der vertraglich vereinbarten Analysedienstleistung erforderlich ist.
                </p>
                <p className="text-sm text-muted-foreground leading-normal mt-2">
                  Speicherdauer: Analyse-Ergebnisse werden dauerhaft in der Datenbank des Verantwortlichen gespeichert, um dem Nutzer den jederzeitigen Zugriff auf seine Analysehistorie zu ermöglichen. Ein temporärer In-Memory-Cache (Zwischenspeicher im Arbeitsspeicher des Servers) hält Analyseergebnisse für die Dauer von 60 Minuten vor, um bei wiederholten Anfragen derselben URL eine erneute Verarbeitung zu vermeiden.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">3.5 Report-Übersetzung</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Sofern der Nutzer die optionale Übersetzungsfunktion eines Analyse-Reports in Anspruch nimmt, werden die in dem Report enthaltenen dynamischen Textinhalte an einen Übersetzungsdienst übermittelt (siehe hierzu Abschnitt 4 und 6 dieser Datenschutzerklärung). Vor der Übermittlung werden sämtliche personenbezogenen Daten, die im Exposé-Text enthalten sein können — insbesondere Namen, Adressen, Telefonnummern und E-Mail-Adressen — durch ein automatisiertes PII-Redaction-Verfahren (PII = Personally Identifiable Information) erkannt und durch anonymisierte Platzhalter ersetzt. Die Rückübersetzung der Platzhalter in die Originaldaten erfolgt ausschließlich auf dem Server des Verantwortlichen, nachdem das Übersetzungsergebnis zurückempfangen wurde.
                </p>
                <p className="text-sm text-muted-foreground leading-normal mt-2">
                  Die Verarbeitung erfolgt auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">3.6 Administration und Nutzerverwaltung</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Der Verantwortliche verarbeitet im Rahmen der Administration des Dienstes Nutzerstammdaten (E-Mail-Adresse, Name, Rolle, Aktivitätsstatus) sowie aggregierte Nutzungsstatistiken (Anzahl durchgeführter Analysen, Fehlerquoten, Cache-Trefferquoten, durchschnittliche Verarbeitungsdauer). Die Verarbeitung erfolgt auf Grundlage des Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt in der Gewährleistung eines ordnungsgemäßen Betriebs, der Kapazitätsplanung und der frühzeitigen Fehlererkennung.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 4 */}
          <section id="section-4">
            <h2 className="text-base font-semibold mb-2">4. Einsatz von Systemen künstlicher Intelligenz</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              4.1 Der Verantwortliche setzt im Rahmen der Erbringung seiner Dienstleistungen Systeme künstlicher Intelligenz (KI) in Form sogenannter Large Language Models (LLM) ein. Der Einsatz erfolgt ausschließlich zur automatisierten Analyse von öffentlich zugänglichen Immobilien-Exposé-Texten sowie zur Übersetzung der daraus generierten Reports. Es werden keine automatisierten Einzelentscheidungen im Sinne des Art. 22 DSGVO getroffen, die gegenüber den Nutzern rechtliche Wirkung entfalten oder sie in ähnlicher Weise erheblich beeinträchtigen. Die KI-generierten Analyse-Reports dienen ausschließlich der Information und Unterstützung der gewerblichen Nutzer und entfalten keine eigenständige rechtliche Wirkung.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              4.2 Im Einzelnen werden folgende KI-Systeme eingesetzt:
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3 pl-4">
              (a) <strong>GPT-4.1</strong> (Anbieter: OpenAI Ireland Ltd., 1st Floor, Burlington Plaza, Burlington Road, Dublin 4, D04 HK38, Irland / OpenAI, L.L.C., 3180 18th Street, San Francisco, CA 94110, USA) — zum Zweck der inhaltlichen Analyse von Immobilien-Exposés. An dieses System wird ausschließlich der öffentlich zugängliche Textinhalt des zu analysierenden Exposés übermittelt. Eine Übermittlung von Account-Daten oder sonstigen personenbezogenen Daten der Nutzer findet nicht statt. Die Rechtsgrundlage der Verarbeitung ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3 pl-4">
              (b) <strong>DeepSeek-V3</strong> (Anbieter: DeepSeek, Hangzhou, Volksrepublik China) — zum Zweck der Übersetzung von Analyse-Reports von deutscher in englische Sprache. An dieses System werden ausschließlich die zu übersetzenden Textfragmente nach vorheriger automatisierter Entfernung sämtlicher personenbezogener Daten (PII-Redaction) übermittelt. Die Verarbeitung hat auf Grundlage einer sorgfältigen Prüfung ergeben, dass durch das PII-Redaction-Verfahren keine personenbezogenen Daten an diesen Anbieter übermittelt werden. Die Rechtsgrundlage der Verarbeitung der zu übersetzenden Textfragmente ist Art. 6 Abs. 1 lit. b DSGVO.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              4.3 Der Einsatz der vorgenannten KI-Systeme erfolgt ausschließlich im Auftrag und unter der datenschutzrechtlichen Verantwortung des Verantwortlichen. Die KI-Anbieter erhalten keinen Zugriff auf die Nutzerkonten oder die auf dem Server des Verantwortlichen gespeicherten Analyseergebnisse.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 5 */}
          <section id="section-5">
            <h2 className="text-base font-semibold mb-2">5. Cookies und vergleichbare Technologien</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              5.1 Diese Website verwendet ausschließlich technisch notwendige Cookies im Sinne des § 165 Abs. 3 TKG 2021. Es werden keine Analyse-, Tracking-, Marketing- oder sonstigen nicht unbedingt erforderlichen Cookies oder vergleichbaren Technologien (wie Web-Beacons, Pixel-Tags oder lokale Speichertechnologien) eingesetzt.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              5.2 Im Einzelnen wird das folgende Cookie verwendet:
            </p>
            <div className="mt-3 pl-4 text-sm text-muted-foreground leading-normal space-y-1">
              <p><strong>Session-Cookie (connect.sid)</strong></p>
              <p>— Zweck: Authentifizierung und Sitzungszuordnung eingeloggter Nutzer</p>
              <p>— Rechtsgrundlage: § 165 Abs. 3 TKG 2021 (unbedingt erforderliches Cookie); Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>
              <p>— Lebensdauer: 7 Tage ab dem letzten Zugriff oder bis zum manuellen Logout durch den Nutzer</p>
              <p>— Übermittlung an Dritte: Nein</p>
              <p>— Art: HTTP-only, Secure, SameSite: Lax</p>
            </div>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              5.3 Da ausschließlich technisch notwendige Cookies eingesetzt werden, die für die Bereitstellung des vom Nutzer ausdrücklich angeforderten Dienstes unbedingt erforderlich sind, bedarf es gemäß § 165 Abs. 3 TKG 2021 keiner gesonderten Einwilligung des Nutzers.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 6 */}
          <section id="section-6">
            <h2 className="text-base font-semibold mb-2">6. Datenweitergabe an Dritte und Auftragsverarbeiter</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              6.1 Eine Weitergabe personenbezogener Daten an Dritte erfolgt nur in den in dieser Datenschutzerklärung beschriebenen Fällen sowie, soweit dies zur Erfüllung gesetzlicher Verpflichtungen, zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder auf Grundlage einer Einwilligung der betroffenen Person erforderlich ist.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              6.2 Zur Erbringung seiner Dienstleistungen bedient sich der Verantwortliche folgender Auftragsverarbeiter im Sinne des Art. 28 DSGVO:
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3 pl-4">
              (a) <strong>Railway Corporation</strong> (325 9th St, San Francisco, CA 94103, USA) — Hosting-Dienst für die AREA-Webanwendung, die Datenbank sowie die n8n-Workflow-Engine. Verarbeitete Datenkategorien: Server-Logfiles, Account-Daten, Analyse-Ergebnisse, Session-Daten. Mit Railway besteht ein Auftragsverarbeitungsvertrag in Form der in den Railway Terms of Service integrierten Datenschutzbestimmungen, die den Anforderungen des Art. 28 DSGVO entsprechen.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3 pl-4">
              (b) <strong>OpenAI</strong> (siehe Abschnitt 4.2 lit. a) — Verarbeitung von Exposé-Textinhalten zum Zweck der KI-gestützten Analyse. Mit OpenAI besteht ein Data Processing Addendum (DPA), das den Anforderungen des Art. 28 DSGVO entspricht.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3 pl-4">
              (c) <strong>n8n GmbH</strong> (Borsigstr. 27, 10115 Berlin, Deutschland) — Workflow-Automatisierung (Self-Hosted auf Railway). Die n8n-Software wird vom Verantwortlichen selbst auf der Infrastruktur von Railway betrieben; n8n GmbH erhält keinen Zugriff auf die verarbeiteten Daten. Die Auftragsverarbeitungsbeziehung besteht in diesem Fall ausschließlich mit Railway als Hosting-Provider.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              6.3 Eine Weitergabe personenbezogener Daten an sonstige Dritte, insbesondere zu Werbezwecken, findet nicht statt.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 7 */}
          <section id="section-7">
            <h2 className="text-base font-semibold mb-2">7. Übermittlung personenbezogener Daten in Drittländer</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              7.1 Im Rahmen der in Abschnitt 6 beschriebenen Auftragsverarbeitungsverhältnisse werden personenbezogene Daten teilweise in die Vereinigten Staaten von Amerika (USA) übermittelt, namentlich durch die Inanspruchnahme der Dienste von Railway Corporation und OpenAI.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              7.2 Die Zulässigkeit der Datenübermittlung in die USA stützt sich auf den Angemessenheitsbeschluss der Europäischen Kommission gemäß Art. 45 Abs. 3 DSGVO vom 10. Juli 2023 für das EU-US Data Privacy Framework (Durchführungsbeschluss (EU) 2023/1795). Beide vorgenannten Dienstleister sind unter dem EU-US Data Privacy Framework zertifiziert. Ergänzend hat der Verantwortliche mit OpenAI Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO (Durchführungsbeschluss (EU) 2021/914 der Europäischen Kommission) vereinbart, die als zusätzliche Garantie für ein angemessenes Datenschutzniveau dienen.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              7.3 Für den Fall, dass der vorgenannte Angemessenheitsbeschluss der Europäischen Kommission durch den Gerichtshof der Europäischen Union für ungültig erklärt oder durch die Europäische Kommission aufgehoben werden sollte, wird sich der Verantwortliche unverzüglich um die Vereinbarung geeigneter Garantien im Sinne des Art. 46 DSGVO, insbesondere in Form von Standardvertragsklauseln, bemühen oder die betroffenen Datenübermittlungen einstellen.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              7.4 Eine Übermittlung personenbezogener Daten in sonstige Drittländer findet derzeit nicht statt. Insbesondere werden an den in Abschnitt 4.2 lit. b genannten Übersetzungsdienst (DeepSeek, Volksrepublik China) aufgrund des vorgeschalteten PII-Redaction-Verfahrens keine personenbezogenen Daten übermittelt.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 8 */}
          <section id="section-8">
            <h2 className="text-base font-semibold mb-2">8. Speicherdauer und Löschung personenbezogener Daten</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              8.1 Der Verantwortliche speichert personenbezogene Daten nur so lange, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder soweit eine gesetzliche Aufbewahrungspflicht besteht. Nach Wegfall des Verarbeitungszwecks und Ablauf etwaiger Aufbewahrungspflichten werden die betreffenden Daten routinemäßig gelöscht oder anonymisiert.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              8.2 Im Einzelnen gelten folgende Speicherfristen:
            </p>
            <div className="mt-2 pl-4 text-sm text-muted-foreground leading-normal space-y-1">
              <p>(a) Server-Logfiles: 30 Tage</p>
              <p>(b) Session-Daten: Bis zum Logout des Nutzers, spätestens 7 Tage nach dem letzten Zugriff</p>
              <p>(c) Account-Daten: Für die Dauer des Vertragsverhältnisses, danach gemäß den gesetzlichen Aufbewahrungspflichten (insbesondere §§ 131, 132 BAO: bis zu 7 Jahre für steuerlich relevante Unterlagen)</p>
              <p>(d) Analyse-Ergebnisse: Für die Dauer des Vertragsverhältnisses; nach Beendigung des Vertragsverhältnisses werden die Analyse-Ergebnisse innerhalb von 90 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen</p>
              <p>(e) In-Memory-Cache: 60 Minuten; bei Neustart des Servers werden die Cache-Daten automatisch gelöscht</p>
              <p>(f) In-Memory-Metriken: Bis zum nächsten Neustart des Servers; es handelt sich um aggregierte, nicht personenbezogene Nutzungsstatistiken</p>
            </div>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 9 */}
          <section id="section-9">
            <h2 className="text-base font-semibold mb-2">9. Datensicherheit und technische Maßnahmen</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              9.1 Der Verantwortliche trifft angemessene technische und organisatorische Maßnahmen im Sinne des Art. 32 DSGVO, um ein dem Risiko angemessenes Schutzniveau für die verarbeiteten personenbezogenen Daten zu gewährleisten. Hierzu zählen insbesondere:
            </p>
            <div className="mt-2 pl-4 text-sm text-muted-foreground leading-normal space-y-1">
              <p>— Verschlüsselung der Datenübertragung mittels TLS/HTTPS</p>
              <p>— Kryptographisches Hashing von Passwörtern (bcrypt)</p>
              <p>— Sitzungsverwaltung mittels signierter, serverseitiger Session-Tokens (httpOnly, Secure, SameSite)</p>
              <p>— SSRF-Schutz (Server-Side Request Forgery) durch DNS-Validierung und IP-Blacklisting</p>
              <p>— HTTP-Security-Header (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options und weitere) mittels Helmet.js</p>
              <p>— Ratenbegrenzung (Rate Limiting) zur Abwehr von Denial-of-Service-Angriffen und missbräuchlicher Nutzung</p>
              <p>— PII-Redaction (automatisierte Erkennung und Entfernung personenbezogener Daten) vor der Übermittlung an externe Übersetzungsdienste</p>
              <p>— Zugriffskontrolle durch rollenbasierte Autorisierung (Trennung von Nutzer- und Administratorrechten)</p>
            </div>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              9.2 Trotz aller Sorgfalt kann eine absolute Sicherheit der Datenverarbeitung nicht gewährleistet werden. Der Verantwortliche überprüft und aktualisiert die getroffenen Sicherheitsmaßnahmen regelmäßig unter Berücksichtigung des Stands der Technik, der Implementierungskosten und der Art, des Umfangs, der Umstände und der Zwecke der Verarbeitung.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 10 */}
          <section id="section-10">
            <h2 className="text-base font-semibold mb-2">10. Rechte der betroffenen Personen</h2>
            <p className="text-sm text-muted-foreground leading-normal mb-4">
              Als von der Verarbeitung personenbezogener Daten betroffene Person stehen Ihnen die nachfolgend aufgeführten Rechte zu. Zur Ausübung dieser Rechte wenden Sie sich bitte an den in Abschnitt 1 genannten Verantwortlichen.
            </p>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium mb-2">10.1 Recht auf Auskunft (Art. 15 DSGVO)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Sie haben das Recht, vom Verantwortlichen eine Bestätigung darüber zu verlangen, ob Sie betreffende personenbezogene Daten verarbeitet werden. Sofern dies der Fall ist, haben Sie das Recht auf Auskunft über diese personenbezogenen Daten sowie auf die in Art. 15 Abs. 1 DSGVO im Einzelnen aufgeführten Informationen, insbesondere die Verarbeitungszwecke, die Kategorien personenbezogener Daten, die Empfänger oder Kategorien von Empfängern, die geplante Speicherdauer sowie das Bestehen der in den Art. 16 bis 21 DSGVO genannten Rechte.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">10.2 Recht auf Berichtigung (Art. 16 DSGVO)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Sie haben das Recht, unverzüglich die Berichtigung Sie betreffender unrichtiger personenbezogener Daten zu verlangen. Unter Berücksichtigung der Zwecke der Verarbeitung haben Sie ferner das Recht, die Vervollständigung unvollständiger personenbezogener Daten — auch mittels einer ergänzenden Erklärung — zu verlangen.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">10.3 Recht auf Löschung (Art. 17 DSGVO)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Sie haben das Recht, vom Verantwortlichen zu verlangen, dass Sie betreffende personenbezogene Daten unverzüglich gelöscht werden, sofern einer der in Art. 17 Abs. 1 DSGVO genannten Gründe zutrifft, insbesondere wenn die personenbezogenen Daten für die Zwecke, für die sie erhoben oder auf sonstige Weise verarbeitet wurden, nicht mehr notwendig sind. Das Recht auf Löschung besteht nicht, soweit die Verarbeitung zur Erfüllung einer rechtlichen Verpflichtung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">10.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Sie haben das Recht, vom Verantwortlichen die Einschränkung der Verarbeitung zu verlangen, wenn eine der in Art. 18 Abs. 1 DSGVO genannten Voraussetzungen gegeben ist, insbesondere wenn Sie die Richtigkeit der personenbezogenen Daten bestreiten, die Verarbeitung unrechtmäßig ist oder der Verantwortliche die personenbezogenen Daten für die Zwecke der Verarbeitung nicht länger benötigt, Sie diese jedoch zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigen.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">10.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Sie haben das Recht, die Sie betreffenden personenbezogenen Daten, die Sie dem Verantwortlichen bereitgestellt haben, in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten, und Sie haben das Recht, diese Daten einem anderen Verantwortlichen ohne Behinderung durch den Verantwortlichen zu übermitteln, sofern die Verarbeitung auf einer Einwilligung oder auf einem Vertrag beruht und die Verarbeitung mithilfe automatisierter Verfahren erfolgt.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">10.6 Widerspruchsrecht (Art. 21 DSGVO)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Sofern die Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) beruht, haben Sie das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen. Der Verantwortliche verarbeitet die personenbezogenen Daten dann nicht mehr, es sei denn, er kann zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die die Interessen, Rechte und Freiheiten der betroffenen Person überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">10.7 Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Soweit die Verarbeitung personenbezogener Daten auf einer von Ihnen erteilten Einwilligung beruht, haben Sie das Recht, diese Einwilligung jederzeit zu widerrufen. Durch den Widerruf der Einwilligung wird die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung nicht berührt.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 11 */}
          <section id="section-11">
            <h2 className="text-base font-semibold mb-2">11. Beschwerderecht bei der Aufsichtsbehörde</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen gemäß Art. 77 DSGVO das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat Ihres gewöhnlichen Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes, wenn Sie der Ansicht sind, dass die Verarbeitung der Sie betreffenden personenbezogenen Daten gegen die DSGVO verstößt.
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-3">
              Die zuständige Aufsichtsbehörde in Österreich ist:
            </p>
            <p className="text-sm text-muted-foreground leading-normal mt-2">
              Österreichische Datenschutzbehörde (DSB)<br />
              Barichgasse 40–42<br />
              1030 Wien<br />
              Telefon: +43 1 52152-0<br />
              E-Mail:{" "}
              <a href="mailto:dsb@dsb.gv.at" className="underline underline-offset-4 hover:text-foreground transition-colors">
                dsb@dsb.gv.at
              </a>
              <br />
              Website:{" "}
              <a
                href="https://www.dsb.gv.at"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                https://www.dsb.gv.at
              </a>
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Abschnitt 12 */}
          <section id="section-12">
            <h2 className="text-base font-semibold mb-2">12. Änderungen dieser Datenschutzerklärung</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Der Verantwortliche behält sich vor, diese Datenschutzerklärung jederzeit mit Wirkung für die Zukunft zu ändern und anzupassen, insbesondere um sie an geänderte Rechtslage, geänderte oder neue Dienste oder Verarbeitungstätigkeiten oder geänderte Rechtsprechung anzupassen. Die jeweils aktuelle Fassung dieser Datenschutzerklärung ist jederzeit unter der auf dieser Website hierfür vorgesehenen URL abrufbar. Nutzern wird empfohlen, sich regelmäßig über den Inhalt dieser Datenschutzerklärung zu informieren.
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
