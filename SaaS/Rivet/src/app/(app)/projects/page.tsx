'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Search } from 'lucide-react';
import { ACCOUNTS, CLIENTS, PROJECTS, client } from '@/data/static';
import { useApp, useApprovals, useEntries, useInvoices, useMilestones, useTasks } from '@/lib/store';
import { projectStats } from '@/lib/derive';
import { dueShort, moneyRound } from '@/lib/util';
import { coverage } from '@/lib/search';
import { AvatarStack, Chip, EmptyState, PageHead, PageSkeleton, ProgressBar, useLoading } from '@/shell/ui';

export default function ProjectsPage() {
  const role = useApp((s) => s.role)!;
  const loading = useLoading('projects-' + role);
  const entries = useEntries();
  const invoices = useInvoices();
  const tasks = useTasks();
  const milestones = useMilestones();
  const approvals = useApprovals();
  const [q, setQ] = useState('');
  const [clientId, setClientId] = useState('all');
  const [sort, setSort] = useState<'due' | 'budget' | 'name'>('due');

  const list = useMemo(() => {
    let l = PROJECTS.slice();
    if (role === 'client') l = l.filter((p) => p.clientId === ACCOUNTS.client.clientId);
    if (clientId !== 'all') l = l.filter((p) => p.clientId === clientId);
    if (q.trim()) l = l.filter((p) => coverage(q, `${p.name} ${client(p.clientId).name} ${p.blurb}`) > 0.5);
    const st = (id: string) => projectStats(id as never, entries, invoices, tasks);
    if (sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'budget') l.sort((a, b) => st(b.id).pct - st(a.id).pct);
    else l.sort((a, b) => a.due - b.due);
    return l;
  }, [q, clientId, sort, role, entries, invoices, tasks]);

  if (loading) return <PageSkeleton />;
  return (
    <div>
      <PageHead title="Projects" sub={role === 'client' ? 'Everything we are working on together' : `${PROJECTS.length} active projects`} />
      {role !== 'client' && (
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-10" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
          </div>
          <select className="input w-auto" value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Filter by client">
            <option value="all">All clients</option>
            {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
            <option value="due">Sort: due date</option>
            {role === 'owner' && <option value="budget">Sort: budget used</option>}
            <option value="name">Sort: name</option>
          </select>
        </div>
      )}
      {list.length === 0 ? (
        <div className="card"><EmptyState icon={<Briefcase size={22} />} title="No projects match" body="Try a different search or clear the client filter." action={<button className="btn-ghost btn-sm" onClick={() => { setQ(''); setClientId('all'); }}>Clear filters</button>} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const s = projectStats(p.id, entries, invoices, tasks);
            const next = milestones.filter((m) => m.projectId === p.id && m.status !== 'done').sort((a, b) => a.due - b.due)[0];
            const waiting = approvals.filter((a) => a.projectId === p.id && a.status === 'pending').length;
            const t = role === 'client' ? tasks.filter((x) => x.projectId === p.id && !x.internal) : tasks.filter((x) => x.projectId === p.id);
            const done = t.filter((x) => x.status === 'done').length;
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="card block p-5 transition hover:border-brand-300 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {role !== 'client' && <p className="mb-1 text-xs font-semibold text-ink-500">{client(p.clientId).name}</p>}
                    <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {waiting > 0 && <Chip tone="brand">{waiting} awaiting approval</Chip>}
                    {role !== 'client' && s.pct >= 1 && <Chip tone="ember">Over budget</Chip>}
                    {role !== 'client' && s.pct >= 0.9 && s.pct < 1 && <Chip tone="ember">Near budget</Chip>}
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{p.blurb}</p>
                <div className="mt-4 flex justify-between text-xs text-ink-500"><span>{done} of {t.length} tasks done</span><span className="tabnum font-semibold text-ink-700">{Math.round((done / Math.max(1, t.length)) * 100)}%</span></div>
                <ProgressBar value={done} max={Math.max(1, t.length)} className="mt-1.5 h-2" />
                {role === 'owner' && (
                  <>
                    <div className="mt-3 flex justify-between text-xs text-ink-500"><span>Budget</span><span className="tabnum">{moneyRound(s.usedAmount)} of {moneyRound(s.budgetAmount)}</span></div>
                    <ProgressBar value={s.used} max={s.budget} className="mt-1.5 h-2" warn={s.pct >= 0.9} over={s.pct >= 1} />
                  </>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm text-ink-600">{next ? <>Next: <span className="font-semibold text-ink-900">{next.title}</span> · {dueShort(next.due)}</> : 'All milestones complete'}</p>
                  {role !== 'client' && <AvatarStack ids={p.team} />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
