'use client';
import Link from 'next/link';
import { ArrowRight, FileText, Sparkles, UserPlus, Users, Zap, Pencil, Download, History } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AUDIT } from '@/data/seed';
import { ago } from '@/lib/time';
import { useApp, useDocs, useOrg } from '@/lib/store';
import { Avatar, Chip, PageHeader, ProgressBar, Skeleton, useLoading } from '@/shell/ui';
import { usageBreakdown } from '@/lib/usage';
import { Invitations } from '@/shell/Invitations';

const ICONS: Record<string, React.ReactNode> = {
  'Created document': <FileText size={14} />, 'Edited document': <Pencil size={14} />, 'AI summarise': <Sparkles size={14} />,
  'AI rewrite': <Sparkles size={14} />, 'AI translate': <Sparkles size={14} />, 'Exported document': <Download size={14} />,
  'Invited teammate': <UserPlus size={14} />, 'Changed role': <Users size={14} />, 'Viewed billing': <History size={14} />,
};

export default function Dashboard() {
  const { org, plan, used, remaining, users, seatsUsed } = useOrg();
  const extra = useApp((s) => s.extraAudit);
  const usageLog = useApp((s) => s.usageLog);
  const baseUsed = useApp((s) => s.creditsUsed[org.id] ?? 0) - usageLog.filter((e) => e.orgId === org.id).reduce((a, e) => a + e.credits, 0);
  const loading = useLoading(org.id);
  const docs = useDocs(org.id);
  const thisMonth = docs.filter((d) => d.createdMins < 43200).length;
  const activity = [...extra.filter((r) => r.orgId === org.id), ...AUDIT.filter((r) => r.orgId === org.id)].slice(0, 7);
  const pct = Math.round((used / plan.credits) * 100);
  const nameOf = (id: string) => (id === 'u-elena' ? 'Elena Costa' : users.find((u) => u.id === id)?.name ?? 'A teammate');
  const breakdown = usageBreakdown(org.id, Math.max(baseUsed, 0), usageLog, nameOf);

  // Credits used per week: a fixed shape scaled to this org's usage.
  const shape = [0.1, 0.16, 0.22, 0.2, 0.32];
  const weeks = shape.map((s, i) => ({ week: `Wk ${i + 1}`, credits: Math.round((used * s) / shape.reduce((a, b) => a + b, 0)) }));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div>
      </div>
    );
  }

  return (
    <div>
      <Invitations />
      <PageHeader title={`Good to see you, ${org.name}`} subtitle={`${org.industry} · ${plan.name} plan · billing renews in 12 days`}
        actions={<Link href="/documents" className="btn-primary">Open documents <ArrowRight size={16} /></Link>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm text-ink-500"><span>Documents this month</span><FileText size={18} className="text-brand-500" /></div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{thisMonth}</p>
          <p className="mt-1 text-xs text-ink-500">{docs.length} {docs.length === 1 ? 'document' : 'documents'} in the workspace</p>
        </div>
        <div className="card p-5 sm:col-span-1" data-tour="credits">
          <div className="flex items-center justify-between text-sm text-ink-500"><span>AI credits used</span><Zap size={18} className="text-brand-500" /></div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{used.toLocaleString()} <span className="text-base font-normal text-ink-400">/ {plan.credits.toLocaleString()}</span></p>
          <div className="mt-3"><ProgressBar value={used} max={plan.credits} /></div>
          <p className="mt-2 text-xs text-ink-500">{remaining > 0 ? `${remaining.toLocaleString()} credits left this cycle (${pct}% used)` : 'No credits left this cycle'}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm text-ink-500"><span>Seats</span><Users size={18} className="text-brand-500" /></div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{seatsUsed} <span className="text-base font-normal text-ink-400">/ {plan.seats}</span></p>
          <div className="mt-3 flex -space-x-2">{users.slice(0, 6).map((u) => <Avatar key={u.id} name={u.name} size={26} ring />)}</div>
        </div>
      </div>

      {remaining < 40 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900"><strong>{remaining === 0 ? 'You have run out of AI credits.' : `Only ${remaining} AI credits left.`}</strong> Upgrade your plan to keep summarising and rewriting.</p>
          <Link href="/billing" className="btn-primary shrink-0">See plans</Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {([['Credits by action', 'Where this cycle\'s credits went', breakdown.byAction], ['Credits by person', 'Who used the most', breakdown.byPerson]] as const).map(([title, sub, bars]) => (
          <div key={title} className="card p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="text-xs text-ink-500">{sub}</p>
            {bars.length === 0 ? (
              <p className="mt-5 text-sm text-ink-500">No AI credits used yet this cycle.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {bars.map((b) => (
                  <li key={b.label}>
                    <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-ink-800">{b.label}</span><span className="tabular-nums text-ink-500">{b.value.toLocaleString()}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${Math.max(4, Math.round((b.value / bars[0].value) * 100))}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-semibold">AI credit usage</h2><p className="text-xs text-ink-500">Credits spent per week this cycle</p></div>
            <Chip tone="brand">{plan.name}</Chip>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeks} margin={{ left: -18, right: 8, top: 8 }}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5753f0" stopOpacity={0.35} /><stop offset="100%" stopColor="#5753f0" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--ink-100))" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'rgb(var(--ink-400))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--ink-400))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgb(var(--ink-200))', background: 'rgb(var(--surface))', color: 'rgb(var(--ink-900))', fontSize: 12 }} />
                <Area type="monotone" dataKey="credits" stroke="#4638dc" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent activity</h2><Link href="/audit" className="text-xs font-medium text-brand-600 hover:underline">View all</Link></div>
          <ul className="space-y-3.5">
            {activity.map((r) => {
              const u = users.find((x) => x.id === r.userId);
              return (
                <li key={r.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">{ICONS[r.action] ?? <FileText size={14} />}</span>
                  <div className="min-w-0 text-sm">
                    <p><span className="font-medium">{r.userId === 'u-elena' ? 'Elena Costa' : u?.name ?? 'A teammate'}</span> <span className="text-ink-500">{r.action.replace(/^(\w)/, (c) => c.toLowerCase()).replace(/^aI /, 'AI ')}</span></p>
                    <p className="line-clamp-1 text-xs text-ink-500">{r.target}</p>
                    <p className="text-xs text-ink-400">{r.at ? ago((Date.now() - r.at) / 60000) : ago(r.mins)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
