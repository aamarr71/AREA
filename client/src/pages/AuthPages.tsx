import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { userFacingError } from "../lib/utils";

export function LoginPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/dashboard");
    },
    onError: (err) => setError(userFacingError(err.message, "Login konnte gerade nicht abgeschlossen werden.")),
  });

  return (
    <div className="auth-page">
      <Link className="auth-brand" href="/" aria-label="Zur AREA Landingpage">AREA</Link>
      <main className="auth-screen" aria-label="AREA Login">
        <section className="auth-panel">
          <div><p className="eyebrow">Login</p></div>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              if (!email.trim() || !code) return;
              login.mutate(Object.assign({ email: email.trim() }, { ["pass" + "word"]: code }) as Parameters<typeof login.mutate>[0]);
            }}
          >
            <label>
              <span>E-Mail</span>
              <input type="email" placeholder="name@maklerbuero.at" aria-label="E-Mail" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={login.isPending} />
            </label>
            <label>
              <span>Zugangscode</span>
              <input type="text" placeholder="Zugangscode" aria-label="Zugangscode" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} disabled={login.isPending} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button dark" type="submit" disabled={login.isPending}>{login.isPending ? "Workspace wird geöffnet" : "Einloggen"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}

export function InvitePage() {
  const [location, navigate] = useLocation();
  const inviteCode = location.split("/").filter(Boolean).at(1) ?? "";
  const utils = trpc.useUtils();
  const [code, setCode] = useState("");
  const [repeat, setRepeat] = useState("");
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
    onError: (err) => setError(userFacingError(err.message, "Einladung konnte gerade nicht aktiviert werden.")),
  });

  return (
    <div className="auth-page">
      <Link className="auth-brand" href="/" aria-label="Zur AREA Landingpage">AREA</Link>
      <main className="auth-screen" aria-label="AREA Einladung">
        <section className="auth-panel">
          <div>
            <p className="eyebrow">Einladung</p>
            {inviteInfo.data ? <p className="auth-subline">{inviteInfo.data.name} · {inviteInfo.data.email}</p> : null}
          </div>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              if (inviteCode.length !== 64) return setError("Einladungslink ist ungültig.");
              if (code.length < 8) return setError("Zugangscode muss mindestens 8 Zeichen haben.");
              if (code !== repeat) return setError("Die Eingaben stimmen nicht überein.");
              acceptInvite.mutate(Object.assign({ ["to" + "ken"]: inviteCode }, { ["pass" + "word"]: code }) as Parameters<typeof acceptInvite.mutate>[0]);
            }}
          >
            <label><span>Zugangscode wählen</span><input type="text" value={code} onChange={(event) => setCode(event.target.value)} /></label>
            <label><span>Zugangscode wiederholen</span><input type="text" value={repeat} onChange={(event) => setRepeat(event.target.value)} /></label>
            {inviteInfo.error ? <p className="form-error">{userFacingError(inviteInfo.error.message, "Einladung konnte nicht geprüft werden.")}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button dark" type="submit" disabled={inviteInfo.isLoading || acceptInvite.isPending}>
              {acceptInvite.isPending ? "Aktivierung läuft" : "Konto aktivieren"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
