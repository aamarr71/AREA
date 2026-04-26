import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, RefreshCw, Trash2, UserPlus, Copy, Check, Power, Lock } from "lucide-react";

const REFRESH_INTERVAL_MS = 30_000;

function formatTimestamp(ts: number | Date | null | undefined): string {
  if (ts === null || ts === undefined) return "—";
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleString("de-AT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type Tab = "metrics" | "users";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("metrics");
  const [tick, setTick] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const meQuery = trpc.auth.me.useQuery();
  const me = meQuery.data;
  const isAdmin = me?.role === "admin";

  // Auto-refresh every 30 seconds while admin is viewing the page
  useEffect(() => {
    if (!isAdmin) return;
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAdmin]);

  const statsQuery = trpc.admin.stats.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: false,
  });
  const errorsQuery = trpc.admin.errors.useQuery(
    { limit: 20 },
    { enabled: isAdmin, refetchInterval: false }
  );
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: false,
  });

  const clearCacheMutation = trpc.admin.clearCache.useMutation();
  const toggleUserMutation = trpc.admin.toggleUser.useMutation({
    onSuccess: () => usersQuery.refetch(),
  });

  // Re-fetch on tick
  useEffect(() => {
    if (!isAdmin || tick === 0) return;
    statsQuery.refetch();
    errorsQuery.refetch();
    if (tab === "users") usersQuery.refetch();
  }, [tick]);

  // ----- Auth gates -----
  if (meQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Lädt…</div>;
  }
  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-8 border border-border rounded-xl bg-card text-center">
          <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-background" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Admin-Zugang</h1>
          <p className="text-sm text-muted-foreground">Bitte einloggen.</p>
          <Link href="/login">
            <Button className="w-full">Zur Anmeldung</Button>
          </Link>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-8 border border-border rounded-xl bg-card text-center">
          <h1 className="text-xl font-semibold tracking-tight">Kein Zugriff</h1>
          <p className="text-sm text-muted-foreground">Dieser Bereich ist nur für Admins.</p>
          <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors justify-center">
            <ArrowLeft className="w-3 h-3" /> Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const errors = errorsQuery.data ?? [];
  const errorRate = stats && stats.totalAnalyses > 0
    ? ((stats.failed / stats.totalAnalyses) * 100).toFixed(1)
    : "0.0";
  const cacheRate = stats && stats.totalAnalyses > 0
    ? ((stats.cacheHits / stats.totalAnalyses) * 100).toFixed(1)
    : "0.0";

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("de-AT", { weekday: "short" }),
      Analysen: 0,
    };
  });

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
              onClick={() => { statsQuery.refetch(); errorsQuery.refetch(); usersQuery.refetch(); }}
              disabled={statsQuery.isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearCacheMutation.mutate(undefined, { onSuccess: () => statsQuery.refetch() })}
              disabled={clearCacheMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Cache leeren
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="container flex gap-6 h-12 items-end">
          {[
            { id: "metrics" as Tab, label: "Metriken" },
            { id: "users" as Tab, label: "User-Verwaltung" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm transition-colors border-b-2 ${
                tab === t.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container py-8 space-y-8">
        {tab === "metrics" && (
          <>
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
                          <td className="p-3 text-xs text-destructive max-w-[300px] break-words">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "users" && (
          <UsersTab
            users={usersQuery.data ?? []}
            isLoading={usersQuery.isLoading}
            onCreateClick={() => setShowInviteModal(true)}
            onToggle={(userId) => toggleUserMutation.mutate({ userId })}
            currentUserId={me.id}
          />
        )}
      </main>

      {showInviteModal && (
        <InviteModal
          onClose={() => { setShowInviteModal(false); usersQuery.refetch(); }}
        />
      )}

      <footer className="border-t border-border py-4 mt-8">
        <div className="container text-xs text-muted-foreground font-mono">
          Auto-Refresh alle 30s · AREA Admin · {me.email}
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Users Tab
// ============================================================

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
  isActive: boolean;
  hasPassword: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

function UsersTab({
  users,
  isLoading,
  onCreateClick,
  onToggle,
  currentUserId,
}: {
  users: UserRow[];
  isLoading: boolean;
  onCreateClick: () => void;
  onToggle: (userId: number) => void;
  currentUserId: number;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">User</h2>
        <Button size="sm" onClick={onCreateClick}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Neuen Kunden einladen
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Lädt…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine User.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground">E-Mail</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Rolle</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Letzter Login</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 font-mono text-xs">{u.email}</td>
                  <td className="p-3 text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded ${u.role === "admin" ? "bg-foreground text-background" : "bg-muted"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {!u.hasPassword ? (
                      <span className="text-muted-foreground">eingeladen</span>
                    ) : u.isActive ? (
                      <span className="text-green-600">aktiv</span>
                    ) : (
                      <span className="text-destructive">deaktiviert</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("de-AT", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    }) : "—"}
                  </td>
                  <td className="p-3 text-right">
                    {u.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggle(u.id)}
                      >
                        <Power className="w-3.5 h-3.5 mr-1.5" />
                        {u.isActive ? "Deaktivieren" : "Aktivieren"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ============================================================
// Invite Modal
// ============================================================

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => {
      setInviteLink(data.inviteLink);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = () => {
    setError(null);
    createInvite.mutate({ email: email.trim(), name: name.trim() });
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Neuen Kunden einladen</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        {!inviteLink ? (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  disabled={createInvite.isPending}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">E-Mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kunde@beispiel.at"
                  disabled={createInvite.isPending}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Abbrechen</Button>
              <Button
                onClick={handleSubmit}
                disabled={createInvite.isPending || !email.trim() || !name.trim()}
              >
                Invite erstellen
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Invite erstellt. Schicke diesen Link an den Kunden — er ist 7 Tage gültig.
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose}>Schließen</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
