'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, CheckSquare, FileText, Search, Users } from 'lucide-react';
import clsx from 'clsx';
import { CLIENTS, PROJECTS, client, project, ACCOUNTS } from '@/data/static';
import { coverage } from '@/lib/search';
import { useApp, useInvoices, useTasks } from '@/lib/store';
import { money } from '@/lib/util';
import { invoiceTotals } from '@/data/calc';
import { Highlight, useClickOutside } from './ui';

type Hit = { key: string; label: string; sub: string; href: string; kind: 'project' | 'task' | 'invoice' | 'client'; score: number };
const ICON = { project: Briefcase, task: CheckSquare, invoice: FileText, client: Users };

export function SearchBox({ className }: { className?: string }) {
  const role = useApp((s) => s.role)!;
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const tasks = useTasks();
  const invoices = useInvoices();

  const hits = useMemo(() => {
    const out: Hit[] = [];
    if (q.trim().length < 2) return out;
    const myClient = ACCOUNTS.client.clientId;
    for (const p of PROJECTS) {
      if (role === 'client' && p.clientId !== myClient) continue;
      const s = coverage(q, `${p.name} ${client(p.clientId).name}`);
      if (s > 0) out.push({ key: p.id, label: p.name, sub: client(p.clientId).name, href: `/projects/${p.id}`, kind: 'project', score: s + 0.2 });
    }
    if (role !== 'client') {
      for (const t of tasks) {
        const s = coverage(q, t.title);
        if (s > 0) out.push({ key: t.id, label: t.title, sub: project(t.projectId).name, href: `/projects/${t.projectId}`, kind: 'task', score: s });
      }
    }
    if (role !== 'member') {
      for (const i of invoices) {
        if (role === 'client' && (i.clientId !== myClient || i.status === 'draft')) continue;
        const s = coverage(q, `${i.number} ${client(i.clientId).name}`);
        if (s > 0) out.push({ key: i.id, label: i.number, sub: `${client(i.clientId).name} · ${money(invoiceTotals(i).total)}`, href: `/invoices/${i.id}`, kind: 'invoice', score: s + 0.1 });
      }
    }
    if (role === 'owner') {
      for (const c of CLIENTS) {
        const s = coverage(q, `${c.name} ${c.contact}`);
        if (s > 0) out.push({ key: c.id, label: c.name, sub: c.contact, href: '/clients', kind: 'client', score: s + 0.15 });
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [q, role, tasks, invoices]);

  return (
    <div className={clsx('relative', className)} ref={ref}>
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        className="input pl-10"
        placeholder={role === 'client' ? 'Search your projects and invoices' : 'Search projects, tasks, invoices'}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        aria-label="Search"
      />
      {open && q.trim().length >= 2 && (
        <div className="pop absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl">
          {hits.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-ink-500">Nothing matches &ldquo;{q}&rdquo;. Try a project or client name.</p>
          ) : (
            hits.map((h) => {
              const Icon = ICON[h.kind];
              return (
                <button key={h.kind + h.key} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ink-50" onClick={() => { setOpen(false); setQ(''); router.push(h.href); }}>
                  <Icon size={16} className="shrink-0 text-ink-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900"><Highlight text={h.label} query={q} /></span>
                    <span className="block truncate text-xs text-ink-500">{h.sub}</span>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{h.kind}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
