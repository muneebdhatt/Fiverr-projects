'use client';
import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Clock, FileText, Gauge, Hourglass, Plus, Send, Sparkles, ThumbsUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CLIENTS, PEOPLE, PROJECTS, client, project } from '@/data/static';
import { dueDay, invoiceTotals, shownStatus } from '@/data/calc';
import { useActivity, useApp, useApprovals, useEntries, useInvoices, useTasks } from '@/lib/store';
import { clientStats, projectStats, totalsAll } from '@/lib/derive';
import { dueShort, dueWhen, fullDate, hrs, monthDay, monthKey, monthName, money, moneyK, moneyRound, r2, weekStart } from '@/lib/util';
import { ActivityFeed } from '@/shell/Feed';
import { Chip, Modal, PageHead, ProgressBar, Stat } from '@/shell/ui';
import { WeeklyUpdate } from '@/shell/WeeklyUpdate';

type Item = { key: string; icon: ReactNode; tone: 'ember' | 'brand'; title: string; detail: string; action: ReactNode };

export default function OwnerHome() {
  const entries = useEntries();
  const invoices = useInvoices();
  const tasks = useTasks();
  const approvals = useApprovals();
  const nudged = useApp((s) => s.nudged);
  const patchInvoice = useApp((s) => s.patchInvoice);
  const nudge = useApp((s) => s.nudge);
  const log = useApp((s) => s.log);
  const toast = useApp((s) => s.toast);
  const activity = useActivity();
  const [wuOpen, setWuOpen] = useState(false);
  const t = totalsAll(entries, invoices);

  const items = useMemo(() => {
    const out: Item[] = [];
    for (const i of invoices.filter((x) => shownStatus(x) === 'overdue')) {
      const c = client(i.clientId);
      out.push({
        key: i.id, tone: 'ember', icon: <AlertTriangle size={16} />,
        title: `${i.number} from ${c.name} is ${-dueDay(i)} days overdue`,
        detail: `${money(invoiceTotals(i).total)} was due ${dueWhen(dueDay(i))}`,
        action: i.remindedDay !== undefined ? <Chip tone="gray">Reminder sent</Chip> : (
          <button className="btn-ghost btn-sm" onClick={() => { patchInvoice(i.id, { remindedDay: 0 }); log({ kind: 'invoice', text: `${i.number} reminder sent to ${c.name}`, clientId: c.id, internal: true, money: true }); toast(`Reminder sent to ${c.contact}`, 'success'); }}><Send size={13} /> Send reminder</button>
        ),
      });
    }
    for (const p of PROJECTS) {
      const s = projectStats(p.id, entries, invoices, tasks);
      if (s.pct >= 0.9) out.push({ key: 'b' + p.id, tone: 'ember', icon: <Gauge size={16} />, title: `${p.name} has used ${Math.round(s.pct * 100)}% of its budget`, detail: `${hrs(s.used)} of ${hrs(s.budget)} · ${client(p.clientId).name}`, action: <Link href={`/projects/${p.id}`} className="btn-ghost btn-sm">Review</Link> });
    }
    for (const a of approvals.filter((x) => x.status === 'pending' && x.requested <= -3).sort((x, y) => x.requested - y.requested)) {
      const c = client(project(a.projectId).clientId);
      out.push({
        key: a.id, tone: 'brand', icon: <ThumbsUp size={16} />, title: `${a.title} has waited ${-a.requested} days for ${c.name}`, detail: `${project(a.projectId).name} · sent by ${PEOPLE.find((p) => p.id === a.by)!.name}`,
        action: nudged[a.id] !== undefined ? <Chip tone="gray">Nudged today</Chip> : <button className="btn-ghost btn-sm" onClick={() => { nudge(a.id); toast(`Reminder sent to ${c.contact}`, 'success'); }}>Nudge client</button>,
      });
    }
    CLIENTS.map((c) => ({ c, s: clientStats(c.id, entries, invoices) })).filter((x) => x.s.unbilledAmount >= 5000).sort((a, b) => b.s.unbilledAmount - a.s.unbilledAmount).slice(0, 3).forEach(({ c, s }) =>
      out.push({ key: 'u' + c.id, tone: 'brand', icon: <Hourglass size={16} />, title: `${moneyRound(s.unbilledAmount)} of billable time for ${c.name} is not invoiced`, detail: `${hrs(s.unbilledHours)} logged since the last invoice`, action: <Link href={`/invoices/new?client=${c.id}`} className="btn-primary btn-sm">Create invoice</Link> }));
    for (const p of PROJECTS) {
      const s = projectStats(p.id, entries, invoices, tasks);
      if (s.overdueTasks) out.push({ key: 'o' + p.id, tone: 'ember', icon: <Clock size={16} />, title: `${s.overdueTasks} past-due task${s.overdueTasks > 1 ? 's' : ''} on ${p.name}`, detail: client(p.clientId).name, action: <Link href={`/projects/${p.id}`} className="btn-ghost btn-sm">Open board</Link> });
    }
    return out.slice(0, 9);
  }, [invoices, entries, tasks, approvals, nudged, patchInvoice, nudge, log, toast]);

  const wk = weekStart(0);
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, k) => {
    const from = wk - 7 * (5 - k);
    const inWeek = entries.filter((e) => e.day >= from && e.day < from + 7);
    return { name: k === 5 ? 'This week' : monthDay(from), Billable: r2(inWeek.filter((e) => e.billable).reduce((n, e) => n + e.hours, 0)), 'Not billable': r2(inWeek.filter((e) => !e.billable).reduce((n, e) => n + e.hours, 0)) };
  }), [entries, wk]);
  const months = useMemo(() => [-90, -60, -30, 0].map((off) => {
    const key = monthKey(off);
    const issued = invoices.filter((i) => i.status !== 'draft' && monthKey(i.issued) === key).reduce((n, i) => n + invoiceTotals(i).total, 0);
    const paid = invoices.filter((i) => i.status === 'paid' && i.paidDay !== undefined && monthKey(i.paidDay) === key).reduce((n, i) => n + invoiceTotals(i).total, 0);
    return { name: monthName(off), Invoiced: Math.round(issued), Collected: Math.round(paid) };
  }), [invoices]);

  const billableWeek = entries.filter((e) => e.day >= wk && e.billable).reduce((n, e) => n + e.hours, 0);
  const rows = PROJECTS.map((p) => ({ p, s: projectStats(p.id, entries, invoices, tasks) })).sort((a, b) => b.s.pct - a.s.pct);

  return (
    <div>
      <PageHead
        title="Welcome back, Maya"
        sub={`${fullDate(0)} · ${PROJECTS.length} active projects across ${CLIENTS.length} clients`}
        actions={<><button className="btn-ghost" onClick={() => setWuOpen(true)}><Sparkles size={16} className="text-brand-600" /> Draft the weekly update</button><Link href="/invoices/new" className="btn-primary"><Plus size={16} /> New invoice</Link></>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Outstanding" value={moneyRound(t.outstanding)} sub={`${invoices.filter((i) => i.status === 'sent').length} invoices awaiting payment`} icon={<FileText size={16} />} />
        <Stat label="Overdue" value={moneyRound(t.overdue)} tone={t.overdue ? 'ember' : undefined} sub={`${t.overdueCount} invoice${t.overdueCount === 1 ? '' : 's'} past due`} icon={<AlertTriangle size={16} />} />
        <Stat label="Collected, 30 days" value={moneyRound(t.paid30)} sub="Payments received" icon={<ThumbsUp size={16} />} />
        <Stat label="Unbilled work" value={moneyRound(t.unbilledAmount)} sub={`${hrs(billableWeek)} billable this week`} icon={<Hourglass size={16} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
            <h2 className="font-sans text-base font-semibold">Needs attention</h2>
            <span className="chip bg-ink-900 text-white">{items.length}</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {items.map((it) => (
              <li key={it.key} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${it.tone === 'ember' ? 'bg-ember-100 text-ember-700' : 'bg-brand-100 text-brand-700'}`}>{it.icon}</span>
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-sm font-semibold text-ink-900">{it.title}</p>
                  <p className="text-xs text-ink-500">{it.detail}</p>
                </div>
                {it.action}
              </li>
            ))}
            {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink-500">Nothing needs you right now.</li>}
          </ul>
        </section>

        <section className="card">
          <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Team this week</h2></div>
          <ul className="space-y-3.5 p-4">
            {PEOPLE.map((p) => {
              const h = entries.filter((e) => e.user === p.id && e.day >= wk).reduce((n, e) => n + e.hours, 0);
              return (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between text-sm"><span className="font-medium text-ink-800">{p.name}</span><span className="tabnum text-xs text-ink-500">{hrs(h)} of {p.capacity} h</span></div>
                  <ProgressBar value={h} max={p.capacity} className="mt-1.5 h-2" />
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-sans text-base font-semibold">Hours by week</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ left: -18, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(117,56,226,.06)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Billable" stackId="a" fill="#7538e2" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Not billable" stackId="a" fill="#d4d4d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-4">
          <h2 className="font-sans text-base font-semibold">Invoiced and collected</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ left: -8, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => moneyK(v)} />
                <Tooltip formatter={(v) => moneyRound(Number(v))} cursor={{ fill: 'rgba(117,56,226,.06)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Invoiced" fill="#c4a9fc" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Collected" fill="#7538e2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
            <h2 className="font-sans text-base font-semibold">Projects at a glance</h2>
            <Link href="/projects" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">All projects <ArrowRight size={14} /></Link>
          </div>
          <ul className="divide-y divide-ink-100">
            {rows.map(({ p, s }) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-ink-50">
                  <div className="min-w-0 flex-1 basis-48"><p className="truncate text-sm font-semibold text-ink-900">{p.name}</p><p className="truncate text-xs text-ink-500">{client(p.clientId).name}</p></div>
                  <div className="w-40 shrink-0 sm:w-56">
                    <div className="flex justify-between text-xs text-ink-500"><span>Budget</span><span className="tabnum">{moneyRound(s.usedAmount)} of {moneyRound(s.budgetAmount)}</span></div>
                    <ProgressBar value={s.used} max={s.budget} className="mt-1 h-2" warn={s.pct >= 0.9} over={s.pct >= 1} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Recent activity</h2></div>
          <ActivityFeed items={activity.slice(0, 8)} />
        </section>
      </div>

      <Modal open={wuOpen} onClose={() => setWuOpen(false)} title="Draft the weekly update" width="max-w-2xl">
        <WeeklyUpdate pick />
      </Modal>
    </div>
  );
}
