import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Datenschutz() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-2xl py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-8">Datenschutz</h1>
        <p className="text-muted-foreground leading-relaxed">
          Datenschutzerklärung gemäß DSGVO wird ergänzt.
        </p>
      </main>
      <footer className="border-t border-border py-6">
        <div className="container">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Hauptseite
          </Link>
        </div>
      </footer>
    </div>
  );
}
