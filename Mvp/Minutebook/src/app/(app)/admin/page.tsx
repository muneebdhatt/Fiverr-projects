'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { AlertTriangle, Check, Clock, Gauge, MessageSquareQuote, Plus, UserPlus, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PEOPLE } from '@/data';
import { useApp, useMeetings, useMinutesUsed } from '@/lib/store';
import { dateFromOffset, monthDay } from '@/lib/util';
import { Avatar, Chip, Field, Modal, PersonAvatar, ProgressBar, Skeleton, useLoading } from '@/shell/ui';

const TIERS = [
  { limit: 600, price: 'Included in your plan' },
  { limit: 900, price: '+$29 per month' },
  { limit: 1200, price: '+$59 per month' },
];

export default function AdminPage() {
  const role = useApp((s) => s.role);
  const router = useRouter();
  const limit = useApp((s) => s.limit);
  const setLimit = useApp((s) => s.setLimit);
  const roles = useApp((s) => s.roles);
  const setPersonRole = useApp((s) => s.setPersonRole);
  const invites = useApp((s) => s.invites);
  const invite = useApp((s) => s.invite);
  const flags = useApp((s) => s.flags);
  const setFlag = useApp((s) => s.setFlag);
  const asks = useApp((s) => s.asks);
  const toast = useApp((s) => s.toast);
  const meetings = useMeetings();
  const used = useMinutesUsed();
  const loading = useLoading('admin');

  const [raise, setRaise] = useState(false);
  const [pick, setPick] = useState(limit);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member');

  useEffect(() => { if (role && role !== 'admin') router.replace('/home'); }, [role, router]);

  const weekly = useMemo(() => {
    const byWeek = new Map<number, number>();
    for (const m of meetings) {
      const dow = (dateFromOffset(m.day).getDay() + 6) % 7;
      const monday = m.day - dow;
      byWeek.set(monday, (byWeek.get(monday) ?? 0) + m.mins);
    }
    return [...byWeek.entries()].sort((a, b) => a[0] - b[0]).map(([monday, mins]) => ({ week: `Week of ${monthDay(monday)}`, mins }));
  }, [meetings]);

  if (role !== 'admin') return null;
  const pct = Math.round((used / limit) * 100);
  const asked = Object.values(asks).flat().filter((m) => m.from === 'me').length;
  const rows = PEOPLE.map((p) => ({
    p,
    mins: meetings.filter((m) => m.by === p.id).reduce((n, m) => n + m.mins, 0),
    count: meetings.filter((m) => m.by === p.id).length,
    role: roles[p.id] ?? (p.admin ? 'Admin' : 'Member'),
    questions: p.questions + (p.id === 'tomas' ? asked : 0),
  }));
  const totalQuestions = rows.reduce((n, r) => n + r.questions, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">Admin</h1>
        <p className="mt-1 text-ink-500">Usage, limits and who has access to Ashgrove Studio.</p>
      </div>

      {pct >= 80 && flags.alert && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle size={20} className="shrink-0 text-red-700" />
          <p className="min-w-0 flex-1 text-sm text-red-900"><span className="font-semibold">You have used {pct}% of this month&rsquo;s recording minutes.</span> At the limit, new recordings are queued until the next cycle or you raise it.</p>
          <button className="btn-dark btn-sm" onClick={() => { setPick(limit); setRaise(true); }}>Raise limit</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between text-ink-500"><h2 className="font-sans text-sm font-semibold uppercase tracking-wider">Recording minutes</h2><Gauge size={18} /></div>
          {loading ? <Skeleton className="mt-4 h-40" /> : (
            <>
              <p className="mt-3 font-display text-5xl font-semibold text-ink-900">{used.toLocaleString()}<span className="text-xl font-normal text-ink-400"> / {limit.toLocaleString()}</span></p>
              <p className="mt-1 text-sm text-ink-500">{(limit - used).toLocaleString()} minutes left · {pct}% used · last 30 days</p>
              <ProgressBar value={used} max={limit} className="mt-4" warn={pct >= 90} />
              <div className="mt-5 flex flex-wrap gap-2">
                <button className="btn-primary" onClick={() => { setPick(limit); setRaise(true); }}><Plus size={16} /> Raise limit</button>
              </div>
              <div className="mt-6 space-y-3 border-t border-ink-100 pt-5">
                <Toggle label="Alert admins at 80% of the limit" on={flags.alert} onChange={(v) => { setFlag('alert', v); toast(v ? 'Usage alerts turned on' : 'Usage alerts turned off', 'success'); }} />
                <Toggle label="Send notes to attendees automatically" on={flags.auto} onChange={(v) => { setFlag('auto', v); toast(v ? 'Notes will be emailed after processing' : 'Notes stay private until shared', 'success'); }} />
              </div>
            </>
          )}
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-3">
          <div className="flex items-center justify-between text-ink-500"><h2 className="font-sans text-sm font-semibold uppercase tracking-wider">Minutes recorded per week</h2><Clock size={18} /></div>
          {loading ? <Skeleton className="mt-4 h-56" /> : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} interval={0} tickFormatter={(v: string) => v.replace('Week of ', '')} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f4f4f5' }} formatter={(v) => [`${v} min`, 'Recorded']} contentStyle={{ borderRadius: 10, border: '1px solid #e4e4e7', fontSize: 12 }} />
                  <Bar dataKey="mins" fill="#e24614" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Meetings written up', value: meetings.length, Icon: Users },
          { label: 'Questions asked', value: totalQuestions, Icon: MessageSquareQuote },
          { label: 'Seats in use', value: `${PEOPLE.length + invites.length} of 10`, Icon: UserPlus },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Icon size={20} /></span>
            <div><p className="font-display text-3xl font-semibold text-ink-900">{value}</p><p className="text-sm text-ink-500">{label}</p></div>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <h2 className="font-sans text-base font-semibold">Teammates</h2>
          <button className="btn-ghost btn-sm" onClick={() => setInviteOpen(true)}><UserPlus size={14} /> Invite teammate</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-ink-50"><tr><th className="th">Person</th><th className="th">Role</th><th className="th">Minutes recorded</th><th className="th">Meetings</th><th className="th">Questions</th><th className="th">Last active</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map(({ p, mins, count, role: r, questions }) => (
                <tr key={p.id} className="hover:bg-ink-50">
                  <td className="td"><span className="flex items-center gap-3"><PersonAvatar id={p.id} size={34} /><span><span className="block font-semibold text-ink-900">{p.name}</span><span className="block text-xs text-ink-500">{p.email}</span></span></span></td>
                  <td className="td">
                    <select className="rounded-md border border-ink-200 bg-white px-2 py-1 text-sm font-medium" value={r} onChange={(e) => { setPersonRole(p.id, e.target.value as 'Admin' | 'Member'); toast(`${p.name.split(' ')[0]} is now ${e.target.value === 'Admin' ? 'an admin' : 'a member'}`, 'success'); }} aria-label={`Role for ${p.name}`}>
                      <option>Admin</option><option>Member</option>
                    </select>
                  </td>
                  <td className="td font-semibold tabular-nums text-ink-900">{mins}</td>
                  <td className="td tabular-nums">{count}</td>
                  <td className="td tabular-nums">{questions}</td>
                  <td className="td text-ink-500">{p.lastActive}</td>
                </tr>
              ))}
              {invites.map((i) => (
                <tr key={i.email} className="bg-ink-50/60">
                  <td className="td"><span className="flex items-center gap-3"><Avatar name={i.email} size={34} /><span className="block font-semibold text-ink-900">{i.email}</span></span></td>
                  <td className="td">{i.role}</td>
                  <td className="td" colSpan={3}><Chip tone="brand">Invitation pending</Chip></td>
                  <td className="td text-ink-500">Sent just now</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-ink-100 bg-ink-50 px-5 py-3 text-xs text-ink-500">Total recorded: <span className="font-semibold text-ink-800">{rows.reduce((n, r) => n + r.mins, 0)} minutes</span>, matching the usage above.</div>
      </section>

      <Modal open={raise} onClose={() => setRaise(false)} title="Raise your monthly limit">
        <div className="space-y-3">
          {TIERS.map((t) => (
            <button key={t.limit} onClick={() => setPick(t.limit)} className={clsx('flex w-full items-center justify-between rounded-xl border p-4 text-left transition', pick === t.limit ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300')}>
              <span><span className="block font-semibold text-ink-900">{t.limit.toLocaleString()} minutes a month</span><span className="block text-sm text-ink-500">{t.price}</span></span>
              <span className={clsx('flex h-5 w-5 items-center justify-center rounded-full border-2', pick === t.limit ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300')}>{pick === t.limit && <Check size={12} />}</span>
            </button>
          ))}
          <p className="text-xs text-ink-500">The change applies straight away and appears on your next invoice.</p>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-ghost" onClick={() => setRaise(false)}>Cancel</button>
            <button className="btn-primary" disabled={pick === limit} onClick={() => { setLimit(pick); setRaise(false); toast(`Limit raised to ${pick.toLocaleString()} minutes`, 'success'); }}>Apply new limit</button>
          </div>
        </div>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a teammate">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!email.includes('@')) return; invite({ email: email.trim(), role: inviteRole }); toast(`Invitation sent to ${email.trim()}`, 'success'); setEmail(''); setInviteOpen(false); }}>
          <Field label="Work email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoFocus /></Field>
          <Field label="Role">
            <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Member')}><option>Member</option><option>Admin</option></select>
          </Field>
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setInviteOpen(false)}>Cancel</button><button className="btn-primary" disabled={!email.includes('@')}>Send invitation</button></div>
        </form>
      </Modal>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-4 text-left" role="switch" aria-checked={on}>
      <span className="text-sm text-ink-700">{label}</span>
      <span className={clsx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand-600' : 'bg-ink-300')}><span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} /></span>
    </button>
  );
}
