import { useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { content } from '../lib/content';
import { TodoText } from '../lib/area-utils';
import { Button } from '../components/Button';
import { FloatingInput } from '../components/FormField';
import { trpc } from '../lib/trpc';

type AuthMode = 'login' | 'invite';

function AuthShell({ mode }: { mode: AuthMode }) {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/invite/:token');
  const token = params?.token ?? '';
  const page = mode === 'login' ? content.login_page : content.invite_page;
  const fields = page.fields;
  const utils = trpc.useUtils();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const inviteInfo = trpc.auth.inviteInfo.useQuery(
    { token },
    { enabled: mode === 'invite' && token.length === 64, retry: false },
  );

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate('/dashboard');
    },
    onError: (err) => setError(err.message),
  });

  const acceptInvite = trpc.auth.acceptInvite.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate('/dashboard');
    },
    onError: (err) => setError(err.message),
  });

  const pending = login.isPending || acceptInvite.isPending;
  const inviteInvalid = mode === 'invite' && token.length !== 64;
  const inviteSubline = inviteInfo.data
    ? `Hallo ${inviteInfo.data.name}, bitte setze ein Passwort fuer ${inviteInfo.data.email}.`
    : page.subline;

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--area-paper)] px-6 py-12">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mx-auto mb-8 block text-center font-display text-[42px] font-semibold tracking-[-0.06em] text-[var(--area-ink)]">
          <TodoText value={content.brand.logo_wordmark} />
        </Link>
        <section className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 shadow-hair" aria-labelledby="auth-title">
          <h1 id="auth-title" className="font-display text-[40px] leading-tight tracking-[-0.04em]"><TodoText value={page.headline} /></h1>
          <p className="mt-3 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={mode === 'invite' ? inviteSubline : page.subline} /></p>
          {mode === 'invite' ? (
            <p className="mt-4 inline-flex rounded-[4px] border border-[var(--area-line)] px-2 py-1 font-mono text-[11px] text-[var(--area-muted)]">
              Token: <span className="ml-2 max-w-[240px] truncate">{token || 'fehlt'}</span>
            </p>
          ) : null}
          <form
            className="mt-8 space-y-7"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              if (mode === 'login') {
                if (!email.trim() || !password) return;
                login.mutate({ email: email.trim(), password });
                return;
              }
              if (inviteInvalid) {
                setError('Ungueltiger Einladungs-Link.');
                return;
              }
              if (password.length < 8) {
                setError('Passwort muss mindestens 8 Zeichen haben.');
                return;
              }
              if (password !== passwordConfirm) {
                setError('Passwoerter stimmen nicht ueberein.');
                return;
              }
              acceptInvite.mutate({ token, password });
            }}
          >
            {fields.map((field) => (
              <FloatingInput
                key={field.name}
                name={field.name}
                type={field.type}
                label={field.label}
                minLength={'min_length' in field ? field.min_length : undefined}
                autoComplete={mode === 'login' ? (field.name === 'email' ? 'email' : 'current-password') : 'new-password'}
                value={field.name === 'email' ? email : field.name === 'password_confirm' ? passwordConfirm : password}
                onChange={(event) => {
                  if (field.name === 'email') setEmail(event.target.value);
                  else if (field.name === 'password_confirm') setPasswordConfirm(event.target.value);
                  else setPassword(event.target.value);
                }}
                disabled={pending || inviteInfo.isLoading}
                required
              />
            ))}
            {inviteInfo.error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{inviteInfo.error.message}</p> : null}
            {error ? <p className="text-[13px] leading-6 text-[var(--area-red)]">{error}</p> : null}
            <Button type="submit" fullWidth disabled={pending || inviteInfo.isLoading}>
              {pending ? <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" /> : null}
              <TodoText value={page.submit_label} />
            </Button>
          </form>
          {mode === 'login' ? (
            <div className="mt-6 text-center">
              <a href="#" className="link-underline font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)] hover:text-[var(--area-ink)]">
                <TodoText value={content.login_page.forgot_password_label} />
              </a>
              <div className="mt-8 border-t border-[var(--area-line)] pt-6 text-[13px] leading-6 text-[var(--area-muted)]">
                <p><TodoText value={content.login_page.no_account_hint} /></p>
                <a href={content.login_page.no_account_cta_href} className="link-underline mt-3 inline-flex font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-ink)]">
                  <TodoText value={content.login_page.no_account_cta_label} />
                </a>
              </div>
            </div>
          ) : null}
        </section>
        <div className="mt-6 flex justify-center gap-5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
          {content.footer.columns[1].links.slice(0, 2).map((link) => (
            <a key={link.label} href={link.href} className="link-underline hover:text-[var(--area-ink)]"><TodoText value={link.label} /></a>
          ))}
        </div>
      </div>
    </main>
  );
}

export function LoginPage() {
  return <AuthShell mode="login" />;
}

export function InvitePage() {
  return <AuthShell mode="invite" />;
}
