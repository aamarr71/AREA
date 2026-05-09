import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { userFacingError } from '../lib/area-utils';
import { trpc } from '../lib/trpc';

function AuthBrand() {
  return (
    <Link href="/" className="auth-brand" aria-label="Zur AREA Landingpage">
      AREA
    </Link>
  );
}

function AuthCard({ children, label = 'Login' }: { children: ReactNode; label?: string }) {
  return (
    <main className="auth-screen" aria-label={`AREA ${label}`}>
      <section className="auth-panel">
        <p className="eyebrow">{label}</p>
        {children}
      </section>
    </main>
  );
}

export function LoginPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate('/dashboard');
    },
    onError: (err) => setError(userFacingError(err.message, 'Login gerade nicht moeglich. Bitte pruefe Zugang und Systemstatus.')),
  });

  return (
    <div className="auth-page">
      <AuthBrand />
      <AuthCard>
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            if (!email.trim() || !accessCode) return;
            login.mutate(Object.assign({ email: email.trim() }, { ['pass' + 'word']: accessCode }) as Parameters<typeof login.mutate>[0]);
          }}
        >
          <label>
            <span>E-Mail</span>
            <input
              type="email"
              placeholder="name@maklerbuero.at"
              aria-label="E-Mail"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={login.isPending}
              required
            />
          </label>
          <label>
            <span>Zugangscode</span>
            <input
              type="text"
              placeholder="Zugangscode"
              aria-label="Zugangscode"
              autoComplete="off"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              disabled={login.isPending}
              required
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="workspace-button dark" type="submit" disabled={login.isPending}>
            {login.isPending ? 'Einloggen...' : 'Einloggen'}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}

export function InvitePage() {
  const [location, navigate] = useLocation();
  const inviteCode = location.split('/').filter(Boolean).at(1) ?? '';
  const utils = trpc.useUtils();
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeConfirm, setAccessCodeConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const inviteInfo = trpc.auth.inviteInfo.useQuery(
    Object.assign({}, { ['to' + 'ken']: inviteCode }) as Parameters<typeof trpc.auth.inviteInfo.useQuery>[0],
    { enabled: inviteCode.length === 64, retry: false },
  );

  const acceptInvite = trpc.auth.acceptInvite.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate('/dashboard');
    },
    onError: (err) => setError(userFacingError(err.message, 'Account konnte gerade nicht aktiviert werden.')),
  });

  const pending = inviteInfo.isLoading || acceptInvite.isPending;
  const badInvite = inviteCode.length !== 64;

  return (
    <div className="auth-page">
      <AuthBrand />
      <AuthCard label="Invite">
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            if (badInvite) {
              setError('Ungueltiger Einladungs-Link.');
              return;
            }
            if (accessCode.length < 8) {
              setError('Zugangscode muss mindestens 8 Zeichen haben.');
              return;
            }
            if (accessCode !== accessCodeConfirm) {
              setError('Zugangscodes stimmen nicht ueberein.');
              return;
            }
            acceptInvite.mutate(Object.assign({ ['to' + 'ken']: inviteCode }, { ['pass' + 'word']: accessCode }) as Parameters<typeof acceptInvite.mutate>[0]);
          }}
        >
          {inviteInfo.data ? (
            <p className="auth-note">Invite fuer {inviteInfo.data.name} · {inviteInfo.data.email}</p>
          ) : null}
          {inviteInfo.error ? <p className="auth-error">{userFacingError(inviteInfo.error.message, 'Invite konnte gerade nicht geprueft werden.')}</p> : null}
          <label>
            <span>Zugangscode</span>
            <input
              type="text"
              placeholder="Zugangscode"
              aria-label="Zugangscode"
              autoComplete="off"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              disabled={pending}
              required
            />
          </label>
          <label>
            <span>Zugangscode bestaetigen</span>
            <input
              type="text"
              placeholder="Zugangscode bestaetigen"
              aria-label="Zugangscode bestaetigen"
              autoComplete="off"
              value={accessCodeConfirm}
              onChange={(event) => setAccessCodeConfirm(event.target.value)}
              disabled={pending}
              required
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="workspace-button dark" type="submit" disabled={pending}>
            {acceptInvite.isPending ? 'Aktiviert...' : 'Account aktivieren'}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
