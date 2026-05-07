import { useState } from 'react';
import { content } from '../lib/content';
import { cn, TodoText } from '../lib/utils';
import { AppNav } from '../components/Navigation';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FloatingInput } from '../components/FormField';

function HealthStrip() {
  return (
    <div className="border-b border-[var(--area-line)] bg-[rgba(255,253,250,0.68)] px-6 py-3">
      <div className="flex flex-wrap gap-2">
        {content.admin_dashboard.health_strip.labels.map((label) => (
          <div key={label} className="inline-flex items-center gap-2 rounded-full border border-[var(--area-line)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
            <span className="status-dot opacity-50" />
            <TodoText value={label} /> · <TodoText value={content.admin_dashboard.metric_cards[0].value} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsTab() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        {content.admin_dashboard.metric_cards.map((card) => (
          <article key={card.label} className="rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-5 shadow-hair">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={card.label} /></p>
            <p className="mt-6 font-display text-[48px] leading-none font-tabular"><TodoText value={card.value} /></p>
          </article>
        ))}
      </div>
      <section className="chart-grid grid min-h-[360px] place-items-center rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] shadow-hair">
        <div className="text-center">
          <p className="font-display text-[44px] leading-tight"><TodoText value={content.admin_dashboard.metric_cards[0].value} /></p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.admin_dashboard.tabs[0].label} /></p>
        </div>
      </section>
    </div>
  );
}

function DataTable({ columns }: { columns: string[] }) {
  return (
    <div className="overflow-auto rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] shadow-hair">
      <table className="min-w-[980px] w-full border-collapse">
        <thead className="sticky top-0 bg-[var(--area-surface)]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-[var(--area-line)] px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={column} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-4 py-12 text-center"><TodoText value={content.admin_dashboard.metric_cards[0].value} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SystemTab() {
  return (
    <div className="grid max-w-[720px] gap-3">
      {content.admin_dashboard.system_actions.map((action) => (
        <Button key={action.label} tone={action.danger ? 'danger' : 'ghost'} className={cn('justify-between border-[var(--area-line-strong)] px-4 text-[var(--area-ink)] hover:bg-[rgba(15,20,25,0.04)]', action.danger && 'border-[var(--area-red)]')}>
          <TodoText value={action.label} />
        </Button>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const [active, setActive] = useState(content.admin_dashboard.tabs[0].name);
  const [inviteOpen, setInviteOpen] = useState(false);
  const activeTab = content.admin_dashboard.tabs.find((tab) => tab.name === active) ?? content.admin_dashboard.tabs[0];

  return (
    <>
      <AppNav admin />
      <HealthStrip />
      <main className="px-6 py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]"><TodoText value={content.admin_dashboard.header_label} /></p>
            <h1 className="mt-3 font-display text-[52px] leading-none tracking-[-0.05em]"><TodoText value={activeTab.label} /></h1>
          </div>
          {active === 'users' ? <Button onClick={() => setInviteOpen(true)}><TodoText value="__TODO_INVITE_USER_LABEL__" /></Button> : null}
        </div>

        <nav className="mb-8 flex gap-8 border-b border-[var(--area-line)] font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
          {content.admin_dashboard.tabs.map((tab) => (
            <button key={tab.name} onClick={() => setActive(tab.name)} className={cn('relative pb-4 transition-colors hover:text-[var(--area-ink)]', active === tab.name && 'text-[var(--area-ink)] after:absolute after:bottom-[-1px] after:left-0 after:h-px after:w-full after:bg-[var(--area-ink)]')}>
              <TodoText value={tab.label} />
            </button>
          ))}
        </nav>

        {active === 'metrics' ? <MetricsTab /> : null}
        {active === 'errors' ? <DataTable columns={content.admin_dashboard.errors_table_columns} /> : null}
        {active === 'users' ? <DataTable columns={content.admin_dashboard.users_table_columns} /> : null}
        {active === 'system' ? <SystemTab /> : null}
      </main>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} labelledBy="invite-admin-title">
        <h2 id="invite-admin-title" className="font-display text-[42px] leading-tight"><TodoText value="__TODO_ADMIN_INVITE_HEADLINE__" /></h2>
        <form className="mt-8 space-y-7" onSubmit={(event) => event.preventDefault()}>
          <FloatingInput label={content.login_page.fields[0].label} type="email" name="email" required />
          <Button fullWidth type="submit"><TodoText value={content.invite_page.submit_label} /></Button>
        </form>
      </Modal>
    </>
  );
}
