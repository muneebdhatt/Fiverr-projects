'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileText, Flag, Lock, MailPlus, MessageSquareText, Send, Users, X } from 'lucide-react';
import { api, AdminUser, ApiError, Doc, Home, WrongRow } from '@/lib/api';
import { ago } from '@/lib/time';
import { notify } from '@/lib/notifications';
import { usePrefs } from '@/lib/prefs';
import { Modal } from '@/shell/Modal';
import { useSession } from '@/shell/session';
import { toast } from '@/shell/Toast';
import { Avatar, EmptyState, PageHeader, Skeleton, StatusChip } from '@/shell/ui';

type Stats = Awaited<ReturnType<typeof api.adminStats>>;
type Usage = Awaited<ReturnType<typeof api.adminUsage>>;

const dayOf = (offset: number) => new Date(Date.now() - offset * 86400000);
const dayLabel = (offset: number) => dayOf(offset).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(',')).join('\n') + '\n'], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const me = useSession((s) => s.me);
  const theme = usePrefs((s) => s.theme);
  const dark = theme === 'dark';
  const [denied, setDenied] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [wrong, setWrong] = useState<WrongRow[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [home, setHome] = useState<Home | null>(null);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviteError, setInviteError] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => {
    const guard = (e: unknown) => { if (e instanceof ApiError && e.status === 403) setDenied(true); };
    api.adminStats().then(setStats).catch(guard);
    api.adminUsers().then(setUsers).catch(guard);
    api.adminWrong().then(setWrong).catch(guard);
  }, []);

  useEffect(() => {
    if (!me) return;
    if (me.role !== 'admin') { setDenied(true); return; }
    setDenied(false);
    refresh();
    api.adminUsage().then(setUsage).catch(() => {});
    api.docs().then(setDocs).catch(() => {});
    api.home().then(setHome).catch(() => {});
  }, [me, refresh]);

  const chart = useMemo(() => (usage || []).map((u) => ({ day: dayLabel(u.day_offset), Questions: u.questions, Drafts: u.drafts })), [usage]);
  const axis = dark ? '#a69a86' : '#706452';
  const grid = dark ? '#37302a' : '#e6dcc8';

  const changeRole = async (u: AdminUser, next: string) => {
    try { await api.setRole(u.id, next); toast(`${u.name} is now ${next === 'admin' ? 'an admin' : 'a member'}`); refresh(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Could not change the role', 'err'); }
  };
  const setStatus = async (w: WrongRow, status: string) => {
    try { await api.setWrongStatus(w.id, status); toast(`Marked ${status.toLowerCase()}`); refresh(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Could not update the answer', 'err'); }
  };
  const revoke = async (u: AdminUser) => {
    try { await api.revokeInvite(u.id); toast(`Invitation to ${u.email} was cancelled`); refresh(); }
    catch { toast('Could not cancel the invitation', 'err'); }
  };
  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setInviteError('');
    try {
      await api.invite(email, role);
      toast(`Invitation sent to ${email.trim().toLowerCase()}`);
      notify(me?.id, `You invited ${email.trim().toLowerCase()} to the workspace`, '/admin');
      setInviting(false); setEmail(''); setRole('member');
      refresh();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not send the invitation');
    } finally { setSending(false); }
  };
  const exportUsage = () => {
    if (!usage) return;
    downloadCsv('lorekeeper-usage-14-days.csv', [['Date', 'Questions', 'Drafts'], ...usage.map((u) => [dayOf(u.day_offset).toISOString().slice(0, 10), u.questions, u.drafts])]);
    toast('Usage exported');
  };

  if (denied) {
    return <div className="card"><EmptyState icon={<Lock className="h-5 w-5" />} title="Admin access only" text="Switch to an admin account from the profile menu to see usage and review feedback." /></div>;
  }

  const cards = [
    { label: 'Users', value: stats?.users, icon: Users },
    { label: 'Documents', value: stats?.documents, icon: FileText },
    { label: 'Questions this week', value: stats?.questions_this_week, icon: MessageSquareText },
    { label: 'Answers to review', value: stats?.wrong_answers, icon: Flag },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" subtitle="Usage, people and answer quality across the workspace." action={<button data-tour="admin-invite" className="btn-primary" onClick={() => setInviting(true)}><MailPlus className="h-4 w-4" /> Invite teammate</button>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><c.icon className="h-[18px] w-[18px]" /></div>
            {stats ? <div className="text-2xl font-semibold tracking-tight">{c.value}</div> : <Skeleton className="h-8 w-14" />}
            <div className="mt-0.5 text-sm text-ink-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">AI usage, last 14 days</div>
          <button className="btn-ghost" onClick={exportUsage} disabled={!usage}><Download className="h-4 w-4" /> Export CSV</button>
        </div>
        {!usage ? <Skeleton className="h-64 w-full" /> : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={chart} margin={{ left: -20, right: 16, top: 4 }}>
                <defs>
                  <linearGradient id="gq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9a2c38" stopOpacity={0.32} /><stop offset="100%" stopColor="#9a2c38" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c99a2e" stopOpacity={0.3} /><stop offset="100%" stopColor="#c99a2e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} interval="preserveStartEnd" padding={{ left: 8, right: 8 }} />
                <YAxis tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${grid}`, fontSize: 12, background: dark ? '#221e19' : '#fffcf6', color: dark ? '#f6f1e7' : '#1c1813' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Questions" stroke="#9a2c38" strokeWidth={2} fill="url(#gq)" />
                <Area type="monotone" dataKey="Drafts" stroke="#c99a2e" strokeWidth={2} fill="url(#gd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3 text-sm font-semibold">Users</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="bg-ink-50/60"><tr><th className="th">Name</th><th className="th">Role</th><th className="th">Questions</th><th className="th">Last active</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {!users && [0, 1, 2, 3].map((i) => <tr key={i}><td className="td" colSpan={4}><Skeleton className="h-6 w-full" /></td></tr>)}
                {users?.map((u) => {
                  const self = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td className="td"><div className="flex items-center gap-2.5"><Avatar name={u.name} size={28} /><div className="min-w-0"><div className="truncate font-medium text-ink-900">{u.name}{self && <span className="ml-1.5 text-xs font-normal text-ink-400">(you)</span>}</div><div className="truncate text-xs text-ink-500">{u.email}</div></div></div></td>
                      <td className="td">
                        <select aria-label={`Role for ${u.name}`} className="input h-8 w-28 py-0 text-xs capitalize" value={u.role} disabled={self} title={self ? 'You can’t change your own role' : undefined} onChange={(e) => changeRole(u, e.target.value)}>
                          <option value="member">Member</option><option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="td">{u.status === 'Pending' ? <StatusChip status="Pending" /> : u.questions}</td>
                      <td className="td whitespace-nowrap">
                        {u.status === 'Pending'
                          ? <span className="inline-flex items-center gap-2">Invited <button aria-label={`Cancel invitation to ${u.email}`} onClick={() => revoke(u)} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></span>
                          : ago(u.last_active_mins)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3 text-sm font-semibold">Answers marked wrong</div>
          {!wrong && <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>}
          {wrong && wrong.length === 0 && <EmptyState icon={<Flag className="h-5 w-5" />} title="Nothing flagged" text="Answers your team marks as wrong will appear here." />}
          <ul className="divide-y divide-ink-100">
            {wrong?.map((w) => (
              <li key={w.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium">{w.question}</div>
                  <select aria-label={`Status for ${w.question}`} className="input h-8 w-28 shrink-0 py-0 text-xs" value={w.status} onChange={(e) => setStatus(w, e.target.value)}>
                    <option>Open</option><option>Reviewed</option><option>Resolved</option>
                  </select>
                </div>
                <div className="mt-1 text-sm text-ink-600">&ldquo;{w.reason}&rdquo;</div>
                <div className="mt-1 text-xs text-ink-500">{w.user} · {ago(w.mins)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3"><span className="text-sm font-semibold">Questions asked this week</span></div>
          {!home && <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
          <ul className="divide-y divide-ink-100">
            {home?.recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={r.user} size={28} />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{r.question}</div><div className="text-xs text-ink-500">{r.user} · {ago(r.mins)}</div></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <span className="text-sm font-semibold">Documents</span>
            <Link href="/documents" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
          </div>
          {!docs && <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
          <ul className="divide-y divide-ink-100">
            {docs?.slice(0, 6).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{d.title}</div><div className="text-xs text-ink-500">{d.owner} · {ago(d.updated_mins_ago)}</div></div>
                <StatusChip status={d.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite a teammate">
        <form onSubmit={sendInvite} noValidate className="space-y-3">
          <label className="block text-sm font-medium">Work email
            <input className="input mt-1.5" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
          </label>
          <label className="block text-sm font-medium">Role
            <select className="input mt-1.5" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member: can ask questions and draft replies</option>
              <option value="admin">Admin: can also manage people and review answers</option>
            </select>
          </label>
          {inviteError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{inviteError}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setInviting(false)}>Cancel</button>
            <button className="btn-primary" disabled={sending || !email.trim()}><Send className="h-4 w-4" /> Send invitation</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
