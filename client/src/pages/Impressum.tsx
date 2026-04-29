import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Impressum() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-2xl py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Impressum</h1>
        <p className="text-sm text-muted-foreground mb-12">Angaben gemäß § 5 ECG und § 25 MedienG</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold mb-3">Diensteanbieter</h2>
            <p className="text-muted-foreground leading-relaxed">
              Amar Mujanović<br />
              Grenzackerstraße 17/5/12<br />
              1100 Wien, Österreich
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              E-Mail:{" "}
              <a href="mailto:amuj71@icloud.com" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                amuj71@icloud.com
              </a>
              <br />
              Telefon: +43 676 4235285
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Tätigkeit</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Anwendbares Recht</h2>
            <p className="text-muted-foreground leading-relaxed">
              Österreichisches Recht
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Aufsichtsbehörde (Datenschutz)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Österreichische Datenschutzbehörde<br />
              Barichgasse 40–42, 1030 Wien<br />
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
            <h2 className="text-lg font-semibold mb-3">Haftungshinweis</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr. Die Nutzung der über AREA erstellten Analyse-Reports erfolgt auf eigenes Risiko. Die Reports stellen keine rechtsverbindliche Bewertung dar und ersetzen keine professionelle Immobilienbewertung oder Rechtsberatung.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Urheberrecht</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die auf dieser Website veröffentlichten Inhalte unterliegen dem österreichischen Urheberrecht. Jede vom Urheberrechtsgesetz nicht zugelassene Verwertung bedarf der vorherigen schriftlichen Zustimmung des Anbieters.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Streitschlichtung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. AREA ist ein B2B-Produkt und richtet sich ausschließlich an gewerbliche Kunden.
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
