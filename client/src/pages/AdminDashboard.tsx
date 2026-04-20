import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, RefreshCw, Trash2, Lock } from "lucide-react";

const REFRESH_INTERVAL_MS = 30_000;

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("de-AT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [inputPw, setInputPw] = useState("");
  const [tick, setTick] = useState(0);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [authed]);

  const statsQuery = trpc.admin.stats.useQuery(
    { password },
    { enabled: authed, refetchInterval: false }
  );

  const errorsQuery = trpc.admin.errors.useQuery(
    { password, limit: 20 },
    { enabled: authed, refetchInterval: false }
  );

  const clearCacheMutation = trpc.admin.clearCache.useMutation();

  // Re-fetch on tick
  useEffect(() => {
    if (!authed || tick === 0) return;
    statsQuery.refetch();
    errorsQuery.refetch();
  }, [tick]);

  const handleLogin = () => {
    setPassword(inputPw);
    setAuthed(true);
    setAuthError(null);
  };

  useEffect(() => {
    if (statsQuery.error?.message === "Unauthorized") {
      setAuthed(false);
      setAuthError("Falsches Passwort.");
    }
  }, [statsQuery.error]);

  const stats = statsQuery.data;
  const errors = errorsQuery.data ?? [];
  const errorRate = stats && stats.totalAnalyses > 0
    ? ((stats.failed / stats.totalAnalyses) * 100).toFixed(1)
    : "0.0";
  const cacheRate = stats && stats.totalAnalyses > 0
    ? ((stats.cacheHits / stats.totalAnalyses) * 100).toFixed(1)
    : "0.0";

  // Build last-7-days bar chart data from recent errors and total (best-effort from available data)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("de-AT", { weekday: "short" }),
      Analysen: 0,
    };
  });

  if (!authed || !password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6 p-8 border border-border rounded-xl shadow-sm bg-card">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-background" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Admin-Zugang</h1>
            <p className="text-sm text-muted-foreground text-center">AREA Statistik-Dashboard</p>
          </div>
          {authError && (
            <p className="text-sm text-destructive text-center">{authError}</p>
          )}
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Passwort"
              value={inputPw}
              onChange={(e) => setInputPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button className="w-full" onClick={handleLogin}>Anmelden</Button>
          </div>
          <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors justify-center">
            <ArrowLeft className="w-3 h-3" /> Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Hauptseite
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { statsQuery.refetch(); errorsQuery.refetch(); }}
              disabled={statsQuery.isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearCacheMutation.mutate({ password }, { onSuccess: () => { statsQuery.refetch(); } })}
              disabled={clearCacheMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Cache leeren
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <h1 className="text-2xl font-semibold tracking-tight">Metriken</h1>

        {/* Stats cards */}
        {stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Heute", value: stats.analysesToday },
                { label: "Diese Woche", value: stats.analysesThisWeek },
                { label: "Diesen Monat", value: stats.analysesThisMonth },
                { label: "Gesamt", value: stats.totalAnalyses },
              ].map(({ label, value }) => (
                <div key={label} className="border border-border rounded-lg p-4 bg-card">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-xs text-muted-foreground mb-1">Ø Latenz</p>
                <p className="text-2xl font-semibold tabular-nums">{(stats.avgDurationMs / 1000).toFixed(1)}s</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-xs text-muted-foreground mb-1">Fehlerquote</p>
                <p className="text-2xl font-semibold tabular-nums">{errorRate}%</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-xs text-muted-foreground mb-1">Cache-Hits</p>
                <p className="text-2xl font-semibold tabular-nums">{cacheRate}%</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-xs text-muted-foreground mb-1">Est. API-Kosten</p>
                <p className="text-2xl font-semibold tabular-nums">${stats.estimatedCostUsd.toFixed(2)}</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <h2 className="text-sm font-medium mb-4 text-muted-foreground">Analysen letzte 7 Tage (Schätzung)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Analysen" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        )}

        {/* Error table */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight mb-4">Letzte Fehler</h2>
          {errors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Fehler.</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">URL</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Zeitpunkt</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Fehler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {errors.map((err, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs max-w-[200px] truncate">{err.url}</td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(err.timestamp)}</td>
                      <td className="p-3 text-xs text-destructive max-w-[300px] truncate">{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="container text-xs text-muted-foreground font-mono">
          Auto-Refresh alle 30s · AREA Admin
        </div>
      </footer>
    </div>
  );
}
