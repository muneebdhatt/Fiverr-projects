'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CreditCard } from 'lucide-react';
import { ACCOUNTS, client, person, project, projectsOf } from '@/data/static';
import { dueDay, invoiceTotals, shownStatus } from '@/data/calc';
import { useApprovals, useFiles, useInvoices, useMilestones, useTasks, useUpdates } from '@/lib/store';
import { ago, dueShort, dueWhen, fullDate, money } from '@/lib/util';
import { ApprovalRow } from '@/shell/Approvals';
import { FileModal, FileRow } from '@/shell/Files';
import { Chip, InvoiceChip, PageHead, ProgressBar } from '@/shell/ui';
import type { ProjectFile } from '@/data/types';

export default function ClientHome() {
  const c = client(ACCOUNTS.client.clientId);
  const projs = projectsOf(c.id);
  const ids = projs.map((p) => p.id);
  const approvals = useApprovals().filter((a) => ids.includes(a.projectId));
  const pending = approvals.filter((a) => a.status === 'pending');
  const invoices = useInvoices().filter((i) => i.clientId === c.id && i.status !== 'draft');
  const due = invoices.filter((i) => i.status === 'sent');
  const tasks = useTasks().filter((t) => ids.includes(t.projectId) && !t.internal);
  const milestones = useMilestones();
  const updates = useUpdates().filter((u) => ids.includes(u.projectId)).slice(0, 3);
  const files = useFiles().filter((f) => ids.includes(f.projectId) && f.clientVisible).slice(0, 5);
  const [open, setOpen] = useState<ProjectFile | null>(null);

  return (
    <div>
      <PageHead title={`Hi ${c.contact.split(' ')[0]}`} sub={`${fullDate(0)} · Your work with Foxglove Studio`} />

      <section className="card">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <h2 className="font-sans text-base font-semibold">Needs your attention</h2>
          <span className="chip bg-ink-900 text-white">{pending.length + due.length}</span>
        </div>
        <div className="divide-y divide-ink-100">
          {due.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><CreditCard size={16} /></span>
              <div className="min-w-0 flex-1 basis-52">
                <p className="text-sm font-semibold text-ink-900">Invoice {i.number}: {money(invoiceTotals(i).total)}</p>
                <p className="text-xs text-ink-500">{shownStatus(i) === 'overdue' ? `Was due ${dueWhen(dueDay(i))}` : `Due ${dueShort(dueDay(i))}`}</p>
              </div>
              <InvoiceChip status={shownStatus(i)} />
              <Link href={`/pay/${i.id}`} className="btn-primary btn-sm">Pay now</Link>
            </div>
          ))}
          {pending.map((a) => <ApprovalRow key={a.id} a={a} canRespond />)}
          {pending.length + due.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink-500">You are all caught up. Nothing is waiting on you.</p>}
        </div>
      </section>

      <h2 className="mb-3 mt-8 font-display text-xl font-bold">Your projects</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {projs.map((p) => {
          const t = tasks.filter((x) => x.projectId === p.id);
          const done = t.filter((x) => x.status === 'done').length;
          const next = milestones.filter((m) => m.projectId === p.id && m.status !== 'done').sort((a, b) => a.due - b.due)[0];
          const waiting = approvals.filter((a) => a.projectId === p.id && a.status === 'pending').length;
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="card block p-5 transition hover:border-brand-300 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="font-display text-lg font-bold">{p.name}</h3><p className="mt-1 line-clamp-2 text-sm text-ink-500">{p.blurb}</p></div>
                {waiting > 0 && <Chip tone="brand" className="shrink-0">{waiting} to review</Chip>}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-ink-500"><span>{done} of {t.length} tasks done</span><span className="tabnum font-semibold text-ink-700">{Math.round((done / Math.max(1, t.length)) * 100)}%</span></div>
              <ProgressBar value={done} max={Math.max(1, t.length)} className="mt-1.5 h-2" />
              {next && <p className="mt-3 text-sm text-ink-600">Next milestone: <span className="font-semibold text-ink-900">{next.title}</span> · {dueShort(next.due)}</p>}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Latest updates</h2></div>
          <ul className="divide-y divide-ink-100">
            {updates.map((u) => (
              <li key={u.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-ink-900">{u.title}</p><span className="shrink-0 text-xs text-ink-400">{ago(u.day)}</span></div>
                <p className="text-xs text-ink-500">{project(u.projectId).name} · {person(u.by).name}</p>
                <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-ink-700">{u.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Recent files</h2><Link href="/projects" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">All projects <ArrowRight size={14} /></Link></div>
          <div className="divide-y divide-ink-100">{files.map((f) => <FileRow key={f.id} f={f} onOpen={setOpen} />)}</div>
        </section>
      </div>
      <FileModal f={open} onClose={() => setOpen(null)} />
    </div>
  );
}
