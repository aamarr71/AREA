import { Link, useLocation } from 'wouter';
import { content } from '../lib/content';
import { TodoText } from '../lib/utils';
import { Button } from '../components/Button';
import { FloatingInput } from '../components/FormField';

type AuthMode = 'login' | 'invite';

function AuthShell({ mode }: { mode: AuthMode }) {
  const [, navigate] = useLocation();
  const page = mode === 'login' ? content.login_page : content.invite_page;
  const fields = page.fields;

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--area-paper)] px-6 py-12">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mx-auto mb-8 block text-center font-display text-[42px] font-semibold tracking-[-0.06em] text-[var(--area-ink)]">
          <TodoText value={content.brand.logo_wordmark} />
        </Link>
        <section className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 shadow-hair" aria-labelledby="auth-title">
          <h1 id="auth-title" className="font-display text-[40px] leading-tight tracking-[-0.04em]"><TodoText value={page.headline} /></h1>
          <p className="mt-3 text-[15px] leading-7 text-[var(--area-muted)]"><TodoText value={page.subline} /></p>
          <form
            className="mt-8 space-y-7"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(mode === 'invite' ? '/dashboard' : '/dashboard');
            }}
          >
            {fields.map((field) => (
              <FloatingInput key={field.name} name={field.name} type={field.type} label={field.label} minLength={'min_length' in field ? field.min_length : undefined} required />
            ))}
            <Button type="submit" fullWidth>
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
