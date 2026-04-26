import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      // Refresh `auth.me` so App.tsx picks up the new session immediately.
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    login.mutate({ email: email.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              AREA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Anmeldung für autorisierte Makler
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border border-border rounded-xl p-6 bg-card">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">E-Mail</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={login.isPending}
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Passwort</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={login.isPending}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={login.isPending || !email.trim() || !password}
          >
            {login.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Anmelden…</>
            ) : (
              <>Anmelden <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Noch keinen Zugang?{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Mehr über AREA
          </Link>
        </div>
      </div>
    </div>
  );
}
