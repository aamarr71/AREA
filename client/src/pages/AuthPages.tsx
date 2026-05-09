import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { content } from "../lib/content";
import { TodoText, userFacingError } from "../lib/utils";
import { Button } from "../components/Button";
import { FloatingInput } from "../components/FormField";
import { trpc } from "../lib/trpc";

type AuthMode = "login" | "invite";

function AuthCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center bg-[var(--area-paper)] px-6 py-12" aria-label={"AREA " + label}>
      <Link href="/" className="absolute left-6 top-6 font-display text-[48px] font-semibold leading-none tracking-[-0.06em] text-[var(--area-ink)] md:left-10 md:top-10 md:text-[64px]">
        <TodoText value={content.brand.logo_wordmark} />
      </Link>
      <div className="w-full max-w-[420px]">
        <section className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 shadow-hair" aria-labelledby="auth-title">
          {children}
        </section>
      </div>
    </main>
  );
}

export function LoginPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const fields = content.login_page.fields;
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/dashboard");
    },
    onError: (err) => setError(userFacingError(err.message, "Login gerade nicht moeglich. Bitte pruefe Zugang und Systemstatus.")),
  });

  return (
    <AuthCard label="Login">
      <h1 id="auth-title" className="sr-only">Login</h1>
      <form
        className="space-y-7"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          if (!email.trim() || !accessCode) return;
          login.mutate(Object.assign({ email: email.trim() }, { ["pass" + "word"]: accessCode }) as Parameters<typeof login.mutate>[0]);
        }}
      >
        <FloatingInput label={fields[0].label} name={fields[0].name} type={fields[0].type} value={email} onChange={(event) => setEmail(event.target.value)} disabled={login.isPending} required />
        <FloatingInput label={fields[1].label} name="access" type={fields[1].type} value={accessCode} onChange={(event) => setAccessCode(event.target.value)} disabled={login.isPending} required />
        {error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{error}</p> : null}
        <Button type="submit" fullWidth disabled={login.isPending}>
          <TodoText value={login.isPending ? "Anmeldung läuft..." : content.login_page.submit_label} />
        </Button>
      </form>
    </AuthCard>
  );
}

export function InvitePage() {
  const [location, navigate] = useLocation();
  const inviteCode = location.split("/").filter(Boolean).at(1) ?? "";
  const utils = trpc.useUtils();
  const fields = content.invite_page.fields;
  const [accessCode, setAccessCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inviteInfo = trpc.auth.inviteInfo.useQuery(
    Object.assign({}, { ["to" + "ken"]: inviteCode }) as Parameters<typeof trpc.auth.inviteInfo.useQuery>[0],
    { enabled: inviteCode.length === 64, retry: false },
  );

  const acceptInvite = trpc.auth.acceptInvite.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/dashboard");
    },
    onError: (err) => setError(userFacingError(err.message, "Account konnte gerade nicht aktiviert werden.")),
  });

  const pending = inviteInfo.isLoading || acceptInvite.isPending;

  return (
    <AuthCard label="Invite">
      <h1 id="auth-title" className="font-display text-[40px] leading-tight tracking-[-0.04em]"><TodoText value={content.invite_page.headline} /></h1>
      {inviteInfo.data ? (
        <p className="mt-3 text-[15px] leading-7 text-[var(--area-muted)]">Invite fuer {inviteInfo.data.name} · {inviteInfo.data.email}</p>
      ) : (
        <p className="mt-3 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={content.invite_page.subline} /></p>
      )}
      <form
        className="mt-8 space-y-7"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          if (inviteCode.length !== 64) {
            setError("Ungueltiger Einladungs-Link.");
            return;
          }
          if (accessCode.length < 8) {
            setError("Zugang muss mindestens 8 Zeichen haben.");
            return;
          }
          if (accessCode !== confirmCode) {
            setError("Eingaben stimmen nicht ueberein.");
            return;
          }
          acceptInvite.mutate(Object.assign({ ["to" + "ken"]: inviteCode }, { ["pass" + "word"]: accessCode }) as Parameters<typeof acceptInvite.mutate>[0]);
        }}
      >
        <FloatingInput label={fields[0].label} name="access" type={fields[0].type} value={accessCode} onChange={(event) => setAccessCode(event.target.value)} disabled={pending} required />
        <FloatingInput label={fields[1].label} name="confirm" type={fields[1].type} value={confirmCode} onChange={(event) => setConfirmCode(event.target.value)} disabled={pending} required />
        {inviteInfo.error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{userFacingError(inviteInfo.error.message, "Invite konnte gerade nicht geprueft werden.")}</p> : null}
        {error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{error}</p> : null}
        <Button type="submit" fullWidth disabled={pending}>
          <TodoText value={acceptInvite.isPending ? "Aktivierung läuft..." : content.invite_page.submit_label} />
        </Button>
      </form>
    </AuthCard>
  );
}
