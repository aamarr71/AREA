import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Zap, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function Invite() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const token = params?.token ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inviteInfo = trpc.auth.inviteInfo.useQuery(
    { token },
    { enabled: token.length === 64, retry: false }
  );

  const utils = trpc.useUtils();
  const accept = trpc.auth.acceptInvite.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    accept.mutate({ token, password });
  };

  if (token.length !== 64) {
    return <InvalidInvite reason="Ungültiger Einladungs-Link." />;
  }
  if (inviteInfo.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Lädt…</div>;
  }
  if (inviteInfo.error) {
    return <InvalidInvite reason={inviteInfo.error.message} />;
  }
  const info = inviteInfo.data;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Willkommen bei AREA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hallo {info?.name}, bitte setzen Sie Ihr Passwort.
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{info?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border border-border rounded-xl p-6 bg-card">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Passwort (min. 8 Zeichen)</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={accept.isPending}
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Passwort bestätigen</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={accept.isPending}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={accept.isPending || !password || !confirm}
          >
            {accept.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Einrichten…</>
            ) : (
              <>Account aktivieren <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function InvalidInvite({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 border border-border rounded-xl p-8 bg-card text-center">
        <h1 className="text-xl font-semibold tracking-tight">Einladung ungültig</h1>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Link href="/login" className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground">
          Zur Anmeldung
        </Link>
      </div>
    </div>
  );
}
