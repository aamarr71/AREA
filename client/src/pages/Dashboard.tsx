import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import AnalysisReport from "@/components/AnalysisReport";

function formatTimestamp(d: Date): string {
  return new Date(d).toLocaleString("de-AT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function shortenUrl(url: string, max = 70): string {
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + "…";
}

const STATUS_CLASS: Record<string, string> = {
  success: "text-green-600",
  error: "text-destructive",
  timeout: "text-amber-600",
};
const STATUS_LABEL: Record<string, string> = {
  success: "Erfolg",
  error: "Fehler",
  timeout: "Timeout",
};

export default function Dashboard() {
  const [openId, setOpenId] = useState<number | null>(null);

  const historyQuery = trpc.analysis.history.useQuery();
  const detailQuery = trpc.analysis.byId.useQuery(
    { id: openId ?? 0 },
    { enabled: openId !== null }
  );

  const rows = historyQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Hauptseite
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Meine Analysen</span>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Analyse-History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ihre letzten 50 Analysen — klicken Sie auf eine Zeile für den vollen Report.
          </p>
        </div>

        {historyQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : rows.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center bg-card">
            <p className="text-sm text-muted-foreground">Noch keine Analysen.</p>
            <Link href="/" className="inline-block mt-3 text-sm text-foreground underline underline-offset-4">
              Erste Analyse starten
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Datum</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">URL</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Dauer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => r.status === "success" && setOpenId(r.id)}
                    className={`${i % 2 === 1 ? "bg-muted/10" : ""} ${
                      r.status === "success"
                        ? "cursor-pointer hover:bg-muted/30"
                        : "cursor-default"
                    } transition-colors`}
                  >
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(r.createdAt)}</td>
                    <td className="p-3 font-mono text-xs">
                      <span className="block truncate max-w-[400px]" title={r.url}>{shortenUrl(r.url)}</span>
                      {r.errorMessage && (
                        <span className="block text-destructive text-[10px] mt-0.5">{r.errorMessage}</span>
                      )}
                    </td>
                    <td className={`p-3 text-xs font-medium ${STATUS_CLASS[r.status] ?? ""}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground text-right tabular-nums">
                      {r.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)}s` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {openId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background border border-border rounded-xl shadow-lg max-w-5xl w-full my-8">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-3 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-sm font-medium truncate">
                  {detailQuery.data?.url ?? "Lädt…"}
                </h3>
                {detailQuery.data?.url && (
                  <a
                    href={detailQuery.data.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              {detailQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Lädt…</p>
              ) : detailQuery.data?.result ? (
                <AnalysisReport data={detailQuery.data.result} />
              ) : (
                <p className="text-sm text-muted-foreground">Kein Report verfügbar.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
