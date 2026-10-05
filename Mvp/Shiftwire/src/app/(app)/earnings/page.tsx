'use client';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WORKER_SHIFTS, businessById } from '@/data/seed';
import { useMeAccount } from '@/lib/me';
import { dayLabel, money, timeRange } from '@/lib/format';
import { Chip, EmptyState, PageHeader, Skeleton, useLoading } from '@/shell/ui';
import { Wallet } from 'lucide-react';

export default function EarningsPage() {
  const loading = useLoading('earnings');
  const acct = useMeAccount();
  const rows = useMemo(() => (acct ? [] : WORKER_SHIFTS).map((s) => ({ ...s, hours: s.end - s.start, pay: (s.end - s.start) * s.rate, biz: businessById(s.businessId)?.name ?? '' })), [acct]);
  const last30 = rows.filter((r) => r.dayOffset > -30);
  const total = last30.reduce((a, r) => a + r.pay, 0);
  const hours = last30.reduce((a, r) => a + r.hours, 0);
  const weekly = useMemo(() => {
    const w = [0, 1, 2, 3].map((i) => ({ name: i === 3 ? 'This week' : `${3 - i}w ago`, earned: 0 }));
    last30.forEach((r) => { const idx = 3 - Math.min(3, Math.floor((-r.dayOffset - 1) / 7)); w[idx].earned += r.pay; });
    return w;
  }, [last30]);

  if (loading) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Earnings" subtitle="What you have earned on Shiftwire shifts in the last 30 days." />
      <div data-tour="earnings-stats" className="grid gap-3 sm:grid-cols-3">
        {[
          ['Earned', money(total)],
          ['Hours worked', String(hours)],
          ['Average rate', `$${hours ? (total / hours).toFixed(2) : '0.00'}/hr`],
        ].map(([l, v]) => <div key={l} className="card p-4"><p className="text-xs font-medium text-ink-500">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="text-sm font-semibold">Earned per week</h2>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ left: -10, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--axis)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--axis)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip cursor={{ fill: 'var(--cursor)' }} formatter={(v) => [`$${v}`, 'Earned']} contentStyle={{ borderRadius: 8, border: '1px solid var(--grid)', background: 'var(--tip)', fontSize: 12 }} />
              <Bar dataKey="earned" fill="var(--chart)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mt-6">
        <div className="border-b border-ink-100 px-5 py-4"><h2 className="text-sm font-semibold">Completed shifts</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead className="bg-ink-50"><tr><th className="th">Shift</th><th className="th">Date</th><th className="th">Hours</th><th className="th">Rate</th><th className="th text-right">Earned</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {rows.length === 0 && <tr><td colSpan={5}><EmptyState icon={<Wallet size={22} />} title="No completed shifts yet" body="Reply YES to a shift offer. Once you have worked it, your earnings show up here." /></td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50">
                  <td className="td"><span className="font-medium text-ink-900">{r.role}</span><span className="block text-xs text-ink-500">{r.biz}</span></td>
                  <td className="td">{dayLabel(r.dayOffset)}<span className="block text-xs text-ink-500">{timeRange(r.start, r.end)}</span></td>
                  <td className="td">{r.hours}</td>
                  <td className="td">${r.rate}/hr</td>
                  <td className="td text-right font-medium text-ink-900">{money(r.pay)} <Chip tone="green">Completed</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
