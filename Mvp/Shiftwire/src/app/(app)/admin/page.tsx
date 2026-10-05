'use client';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Download, MailCheck, RefreshCw, Search } from 'lucide-react';
import { BUSINESSES, COMPLIANCE, PAST_SHIFTS, PRICE, businessById, workerById } from '@/data/seed';
import { isNew, useAccounts } from '@/lib/accounts';
import { useAllWorkers } from '@/lib/me';
import type { Business, ComplianceEvent } from '@/data/types';
import { downloadCsv } from '@/lib/csv';
import { absoluteAgo, dayLabel, money, timeRange } from '@/lib/format';
import { useApp } from '@/lib/store';
import { STATUS_TONE } from '@/shell/status';
import { Avatar, Chip, Modal, PageHeader, Skeleton, useLoading } from '@/shell/ui';

type Tab = 'Businesses' | 'Workers' | 'Shifts' | 'Compliance';
const TABS: Tab[] = ['Businesses', 'Workers', 'Shifts', 'Compliance'];
const EVENTS: ComplianceEvent[] = ['Opt-in consent', 'Consent confirmed', 'STOP received', 'START received'];
const EVENT_TONE: Record<ComplianceEvent, 'green' | 'teal' | 'red' | 'amber'> = { 'Opt-in consent': 'green', 'Consent confirmed': 'teal', 'STOP received': 'red', 'START received': 'amber' };
const chartStyle = { borderRadius: 8, border: '1px solid var(--grid)', background: 'var(--tip)', fontSize: 12 };
const axis = { fontSize: 12, fill: 'var(--axis)' };

export default function AdminPage() {
  const extra = useApp((s) => s.extraShifts);
  const optedOut = useApp((s) => s.optedOut);
  const fixed = useApp((s) => s.billingFixed);
  const fixBilling = useApp((s) => s.fixBilling);
  const complianceExtra = useApp((s) => s.complianceExtra);
  const toast = useApp((s) => s.toast);
  const loading = useLoading('admin');
  const WORKERS = useAllWorkers();
  const accounts = useAccounts();
  const wById = (id: string) => WORKERS.find((w) => w.id === id) ?? workerById(id);
  const [tab, setTab] = useState<Tab>('Businesses');
  const [q, setQ] = useState('');
  const [evt, setEvt] = useState('All');
  const [pay, setPay] = useState<Business | null>(null);
  const [busy, setBusy] = useState(false);

  const shifts = useMemo(() => [...extra, ...PAST_SHIFTS], [extra]);
  const closed = shifts.filter((s) => s.status === 'Filled' || s.status === 'Unfilled');
  const fillRate = Math.round((closed.filter((s) => s.status === 'Filled').length / closed.length) * 100);
  const isFailed = (b: Business) => b.status === 'Payment failed' && !fixed[b.id];
  const paying = BUSINESSES.filter((b) => !isFailed(b)).length;
  const atRisk = BUSINESSES.filter(isFailed).length;
  const unsubscribed = WORKERS.filter((w) => w.unsubscribed || optedOut[w.id]).length;
  const mrr = paying * PRICE;

  const months = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const ago = 6 - i;
      const active = BUSINESSES.filter((b) => b.sinceDays >= ago * 30).length - (ago === 0 ? atRisk : 0);
      const label = new Date(new Date().getFullYear(), new Date().getMonth() - ago, 1).toLocaleDateString('en-US', { month: 'short' });
      return { name: label, mrr: active * PRICE };
    });
  }, [atRisk]);
  const prevMrr = months[5].mrr;
  const growth = prevMrr ? Math.round(((mrr - prevMrr) / prevMrr) * 100) : 0;

  const weekly = useMemo(() => {
    const weeks = Array.from({ length: 7 }, (_, i) => ({ name: i === 6 ? 'This week' : `${6 - i}w ago`, shifts: 0 }));
    shifts.forEach((s) => {
      if (s.status === 'Scheduled') return;
      const idx = 6 - (s.dayOffset >= 0 ? 0 : Math.floor((-s.dayOffset - 1) / 7));
      if (idx >= 0 && idx < 7) weeks[idx].shifts += 1;
    });
    return weeks;
  }, [shifts]);

  const compliance = useMemo(() => [...complianceExtra, ...accounts.map((a) => ({ id: `c-in-${a.id}`, workerId: a.id, event: 'Opt-in consent' as const, source: 'Worker sign-up, consent box ticked', minsAgo: 0 })), ...COMPLIANCE], [complianceExtra, accounts]);
  const term = q.trim().toLowerCase();

  const bizRows = BUSINESSES.filter((b) => !term || b.name.toLowerCase().includes(term) || b.contact.toLowerCase().includes(term));
  const workerRows = WORKERS.filter((w) => !term || w.name.toLowerCase().includes(term) || w.skills.join(' ').toLowerCase().includes(term));
  const shiftRows = [...shifts].sort((a, b) => b.dayOffset - a.dayOffset).filter((s) => !term || s.role.toLowerCase().includes(term) || businessById(s.businessId)?.name.toLowerCase().includes(term));
  const compRows = compliance.filter((c) => (evt === 'All' || c.event === evt) && (!term || (wById(c.workerId)?.name.toLowerCase().includes(term) ?? false)));

  function exportCsv() {
    if (tab === 'Businesses') downloadCsv('businesses.csv', [['Business', 'Type', 'Contact', 'Email', 'Billing'], ...bizRows.map((b) => [b.name, b.type, b.contact, b.email, isFailed(b) ? 'Payment failed' : 'Active'])]);
    if (tab === 'Workers') downloadCsv('workers.csv', [['Worker', 'Phone', 'Skills', 'Rating', 'Reliability', 'Shifts', 'Texts'], ...workerRows.map((w) => [w.name, w.phone, w.skills.join(' / '), w.rating, `${w.reliability}%`, w.jobs, w.unsubscribed || optedOut[w.id] ? 'Unsubscribed' : 'Subscribed'])]);
    if (tab === 'Shifts') downloadCsv('all-shifts.csv', [['Business', 'Role', 'Workers needed', 'When', 'Rate', 'Status'], ...shiftRows.map((s) => [businessById(s.businessId)?.name ?? '', s.role, s.positions, `${dayLabel(s.dayOffset)} ${timeRange(s.start, s.end)}`, s.rate, s.status])]);
    if (tab === 'Compliance') downloadCsv('compliance-log.csv', [['When', 'Worker', 'Phone', 'Event', 'Source'], ...compRows.map((c) => [absoluteAgo(c.minsAgo), wById(c.workerId)?.name ?? '', wById(c.workerId)?.phone ?? '', c.event, c.source])]);
    toast(`${tab} exported`);
  }

  function resolve(kind: 'retry' | 'remind') {
    if (!pay) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (kind === 'retry') { fixBilling(pay.id); toast(`Payment of ${money(PRICE)} collected from ${pay.name}`); }
      else toast(`Reminder email sent to ${pay.email}`, 'info');
      setPay(null);
    }, 900);
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-56" /><div className="grid gap-3 sm:grid-cols-5"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-72" /></div>;

  return (
    <div>
      <PageHeader title="Operations overview" subtitle="Businesses, workers and shift activity across the marketplace." />
      <div data-tour="admin-kpis" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Businesses', String(BUSINESSES.length), `${paying} paying${atRisk ? `, ${atRisk} at risk` : ''}`],
          ['Workers', String(WORKERS.length), `${unsubscribed} unsubscribed`],
          ['Shifts posted', String(shifts.filter((s) => s.status !== 'Scheduled').length), 'last 7 weeks'],
          ['Fill rate', `${fillRate}%`, 'filled or unfilled only'],
          ['Revenue this month', money(mrr), `${paying} × ${money(PRICE)}`],
        ].map(([l, v, sub]) => <div key={l} className="card p-4"><p className="text-xs font-medium text-ink-500">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p><p className="text-xs text-ink-500">{sub}</p></div>)}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div data-tour="admin-mrr" className="card p-5">
          <div className="flex items-start justify-between">
            <div><h2 className="text-sm font-semibold">Monthly recurring revenue</h2><p className="mt-0.5 text-xs text-ink-500">Paying businesses × {money(PRICE)}</p></div>
            <div className="text-right"><p className="text-xl font-semibold">{money(mrr)}</p><p className={clsx('text-xs font-medium', growth >= 0 ? 'text-emerald-600' : 'text-red-600')}>{growth >= 0 ? '+' : ''}{growth}% vs last month</p></div>
          </div>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ left: -10, right: 8, top: 4 }}>
                <defs><linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid)" />
                <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v) => [money(Number(v)), 'MRR']} contentStyle={chartStyle} />
                <Area type="monotone" dataKey="mrr" stroke="var(--chart)" strokeWidth={2.5} fill="url(#mrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold">Shifts posted per week</h2>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid)" />
                <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--cursor)' }} contentStyle={chartStyle} />
                <Bar dataKey="shifts" fill="var(--chart)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center">
          <div data-tour="admin-tabs" className="flex gap-1 overflow-x-auto rounded-lg bg-ink-100 p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => { setTab(t); setQ(''); setEvt('All'); }} className={clsx('whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition', tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900')}>{t}</button>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            {tab === 'Compliance' && (
              <select className="input sm:w-48" value={evt} onChange={(e) => setEvt(e.target.value)} aria-label="Event type"><option value="All">All events</option>{EVENTS.map((e) => <option key={e}>{e}</option>)}</select>
            )}
            <div className="relative sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input data-search className="input pl-9" placeholder={`Search ${tab.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <button className="btn-ghost" onClick={exportCsv}><Download size={15} />Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {tab === 'Businesses' && (
            <table className="w-full min-w-[760px]">
              <thead className="bg-ink-50"><tr><th className="th">Business</th><th className="th">Type</th><th className="th">Contact</th><th className="th">Shifts</th><th className="th">Fill rate</th><th className="th">Billing</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {bizRows.map((b) => {
                  const mine = shifts.filter((s) => s.businessId === b.id);
                  const c = mine.filter((s) => s.status === 'Filled' || s.status === 'Unfilled');
                  const rate = c.length ? Math.round((c.filter((s) => s.status === 'Filled').length / c.length) * 100) : 0;
                  return (
                    <tr key={b.id} className="hover:bg-ink-50">
                      <td className="td"><span className="flex items-center gap-2.5"><Avatar name={b.name} size={30} /><span className="font-medium text-ink-900">{b.name}</span></span></td>
                      <td className="td">{b.type}</td><td className="td">{b.contact}</td><td className="td">{mine.length}</td><td className="td">{rate}%</td>
                      <td className="td">{isFailed(b) ? <button className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100" onClick={() => setPay(b)}><AlertTriangle size={12} />Payment failed · Resolve</button> : <Chip tone="green">Active</Chip>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {tab === 'Workers' && (
            <table className="w-full min-w-[820px]">
              <thead className="bg-ink-50"><tr><th className="th">Worker</th><th className="th">Phone</th><th className="th">Skills</th><th className="th">Rating</th><th className="th">Reliability</th><th className="th">Shifts</th><th className="th">Texts</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {workerRows.map((w) => (
                  <tr key={w.id} className="hover:bg-ink-50">
                    <td className="td"><span className="flex items-center gap-2.5"><Avatar name={w.name} size={30} /><span className="font-medium text-ink-900">{w.name}</span></span></td>
                    <td className="td">{w.phone}</td><td className="td">{w.skills.join(', ')}</td><td className="td">{isNew(w) ? 'New' : w.rating.toFixed(1)}</td><td className="td">{isNew(w) ? 'New' : `${w.reliability}%`}</td><td className="td">{w.jobs}</td>
                    <td className="td">{w.unsubscribed || optedOut[w.id] ? <Chip tone="red">Unsubscribed</Chip> : <Chip tone="green">Subscribed</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'Shifts' && (
            <table className="w-full min-w-[760px]">
              <thead className="bg-ink-50"><tr><th className="th">Business</th><th className="th">Role</th><th className="th">When</th><th className="th">Rate</th><th className="th">Filled by</th><th className="th">Status</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {shiftRows.map((s) => {
                  const names = (s.filledByIds ?? (s.filledBy ? [s.filledBy] : [])).map((id) => workerById(id)?.name).filter(Boolean);
                  return (
                    <tr key={s.id} className="hover:bg-ink-50">
                      <td className="td font-medium text-ink-900">{businessById(s.businessId)?.name}</td>
                      <td className="td">{s.positions > 1 ? `${s.positions} × ` : ''}{s.role}</td>
                      <td className="td">{dayLabel(s.dayOffset)}<span className="block text-xs text-ink-500">{timeRange(s.start, s.end)}</span></td>
                      <td className="td">${s.rate}/hr</td>
                      <td className="td">{names.length ? names.join(', ') : <span className="text-ink-400">None</span>}</td>
                      <td className="td"><Chip tone={STATUS_TONE[s.status]}>{s.status}</Chip></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {tab === 'Compliance' && (
            <table className="w-full min-w-[760px]">
              <thead className="bg-ink-50"><tr><th className="th">When</th><th className="th">Worker</th><th className="th">Phone</th><th className="th">Event</th><th className="th">Source</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {compRows.slice(0, 60).map((c) => {
                  const w = wById(c.workerId);
                  return (
                    <tr key={c.id} className="hover:bg-ink-50">
                      <td className="td whitespace-nowrap">{absoluteAgo(c.minsAgo)}</td>
                      <td className="td"><span className="flex items-center gap-2.5"><Avatar name={w?.name ?? '?'} size={26} /><span className="font-medium text-ink-900">{w?.name}</span></span></td>
                      <td className="td">{w?.phone}</td>
                      <td className="td"><Chip tone={EVENT_TONE[c.event]}>{c.event}</Chip></td>
                      <td className="td">{c.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {tab === 'Compliance' && <p className="border-t border-ink-100 px-4 py-3 text-xs text-ink-500">Every consent and opt-out is recorded with a timestamp. Showing {Math.min(60, compRows.length)} of {compRows.length} events.</p>}
      </div>

      <Modal open={!!pay} onClose={() => !busy && setPay(null)} title="Failed payment">
        {pay && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-red-50 p-3.5 text-red-900"><p className="font-semibold">{pay.name}</p><p className="mt-0.5">The {money(PRICE)} monthly charge was declined. The card on file ended in 0341 and expired last month.</p></div>
            <div className="flex justify-between"><span className="text-ink-500">Contact</span><span className="font-medium">{pay.contact} · {pay.email}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Account since</span><span className="font-medium">{pay.sinceDays} days ago</span></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="btn-ghost flex-1" disabled={busy} onClick={() => resolve('remind')}><MailCheck size={15} />Send reminder email</button>
              <button className="btn-primary flex-1" disabled={busy} onClick={() => resolve('retry')}>{busy ? 'Working…' : <><RefreshCw size={15} />Retry charge</>}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
