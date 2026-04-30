import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Impressum() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-2xl py-8 px-4">
        <h1 className="text-xl font-semibold mb-1">Impressum</h1>
        <p className="text-xs text-muted-foreground mb-8">Stand: April 2026</p>

        <p className="text-sm text-muted-foreground leading-normal mb-8">
          Angaben gemäß § 5 des Bundesgesetzes, mit dem bestimmte rechtliche Aspekte des elektronischen Geschäfts- und Rechtsverkehrs geregelt werden (E-Commerce-Gesetz — ECG), BGBl I Nr. 152/2001 idgF, sowie gemäß § 25 des Bundesgesetzes über die Presse und andere publizistische Medien (Mediengesetz — MedienG), BGBl Nr. 314/1981 idgF.
        </p>

        <div className="divide-y divide-white/10">

          <section className="pb-8">
            <h2 className="text-lg font-semibold mb-3">Diensteanbieter und Medieninhaber</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Amar Mujanović<br />
              Grenzackerstraße 17/5/12<br />
              1100 Wien<br />
              Republik Österreich
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Kontaktdaten</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              E-Mail:{" "}
              <a href="mailto:amuj71@icloud.com" className="text-primary underline underline-offset-4">
                amuj71@icloud.com
              </a>
              <br />
              Telefon: +43 676 4235285
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Unternehmensgegenstand</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik gemäß § 2 Abs. 1 Z 14 der Bundeseinheitlichen Liste der freien Gewerbe (BLFG).
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Anwendbares Recht und Gerichtsstand</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Es gilt ausschließlich österreichisches Recht unter Ausschluss der Verweisungsnormen des internationalen Privatrechts sowie des UN-Kaufrechts (CISG). Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit der Nutzung dieser Website ist, soweit gesetzlich zulässig, das sachlich zuständige Gericht in Wien.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Zuständige Aufsichtsbehörde (Datenschutz)</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Österreichische Datenschutzbehörde (DSB)<br />
              Barichgasse 40–42<br />
              1030 Wien<br />
              <a
                href="https://www.dsb.gv.at"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                https://www.dsb.gv.at
              </a>
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Grundlegende Richtung gemäß § 25 Abs. 4 MedienG</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              AREA ist eine webbasierte Softwarelösung zur automatisierten Qualitätsanalyse von Immobilien-Exposés. Die über diese Website bereitgestellten Inhalte dienen ausschließlich der Information gewerblicher Nutzer im Bereich der Immobilienwirtschaft und stellen weder eine Rechtsberatung noch eine Immobilienbewertung im Sinne des Liegenschaftsbewertungsgesetzes (LBG) dar.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Haftungsausschluss</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Die auf dieser Website dargestellten Inhalte wurden mit größtmöglicher Sorgfalt erstellt. Der Diensteanbieter übernimmt jedoch keinerlei Gewähr für die Richtigkeit, Vollständigkeit, Aktualität oder jederzeitige Verfügbarkeit der bereitgestellten Informationen und Inhalte. Die Nutzung der über AREA bereitgestellten Analyse-Reports erfolgt auf eigenes Risiko des Nutzers. Insbesondere ersetzen die durch AREA generierten Berichte keine professionelle Immobilienbewertung durch einen zertifizierten Sachverständigen, keine Rechtsberatung durch einen zugelassenen Rechtsanwalt oder Notar und keine Steuerberatung durch einen Steuerberater oder Wirtschaftsprüfer. Der Diensteanbieter haftet nicht für Schäden, die aus der Nutzung oder Nichtnutzung der bereitgestellten Informationen entstehen, sofern kein nachweislich vorsätzliches oder grob fahrlässiges Verschulden vorliegt. Für die Inhalte verlinkter externer Websites übernimmt der Diensteanbieter keine Haftung; für die Inhalte der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Urheberrecht und gewerbliche Schutzrechte</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Sämtliche auf dieser Website veröffentlichten Inhalte, einschließlich Texte, Grafiken, Logos, Schriftarten, Software und deren Zusammenstellung, unterliegen dem Schutz des österreichischen Urheberrechtsgesetzes (UrhG) sowie gegebenenfalls weiterer gewerblicher Schutzrechte. Jede über die gesetzlich eingeräumten Schranken hinausgehende Nutzung, insbesondere die Vervielfältigung, Verbreitung, öffentliche Zugänglichmachung, Bearbeitung oder Verwertung zu gewerblichen Zwecken, bedarf der vorherigen schriftlichen Zustimmung des Diensteanbieters. Der Diensteanbieter macht hiermit von seinem Recht gemäß § 42h Abs. 6 UrhG Gebrauch, der Vervielfältigung zum Zweck des Text- und Data-Mining zu widersprechen. Dies umfasst insbesondere, jedoch nicht abschließend, das Verbot der Datenerfassung und -extraktion zum Zweck des Trainierens von Systemen künstlicher Intelligenz oder zur Entwicklung darauf basierender Softwareprodukte.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold mb-3">Streitbeilegung</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Der Diensteanbieter ist weder bereit noch verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle im Sinne des Alternative-Streitbeilegung-Gesetz (AStG) teilzunehmen. AREA ist ein Produkt für den geschäftlichen Verkehr (B2B) und richtet sich ausschließlich an gewerbliche Nutzer im Sinne des § 1 KSchG. Die Europäische Plattform zur Online-Streitbeilegung (OS-Plattform) ist erreichbar unter:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                https://ec.europa.eu/consumers/odr
              </a>{" "}
              — eine Teilnahmeverpflichtung des Diensteanbieters besteht nicht.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-lg font-semibold mb-3">Salvatorische Klausel</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Sollten einzelne Bestimmungen dieses Impressums unwirksam sein oder werden, so wird die Wirksamkeit der übrigen Bestimmungen hiervon nicht berührt. An die Stelle der unwirksamen Bestimmung tritt die jeweils einschlägige gesetzliche Regelung.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container max-w-2xl px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </footer>
    </div>
  );
}
