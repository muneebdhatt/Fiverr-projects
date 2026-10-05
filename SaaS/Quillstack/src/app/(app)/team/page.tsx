'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DoorOpen, Eye, Mail, Search, Undo2, UserMinus, UserPlus, Users } from 'lucide-react';
import type { Role, User } from '@/data/types';
import { currentUserId, useApp, useMyEmail, useMyInvites, useOrg } from '@/lib/store';
import { ago } from '@/lib/time';
import { Avatar, Chip, EmptyState, Field, Logo, Modal, PageHeader, ProgressBar, Skeleton, useLoading } from '@/shell/ui';

const ROLES: Role[] = ['Owner', 'Admin', 'Member', 'Viewer'];
const ROLE_HELP: Record<Role, string> = {
  Owner: 'Full control, including billing',
  Admin: 'Manage people and documents',
  Member: 'Create and edit documents',
  Viewer: 'Read-only access',
};

export default function TeamPage() {
  const { org, plan, users, seatsUsed } = useOrg();
  const persona = useApp((s) => s.persona);
  const { setRole, invite, unsendInvite, removeMember, leaveOrg, setOrg, log, toast } = useApp();
  const router = useRouter();
  const myEmail = useMyEmail();
  const { memberOrgIds } = useMyInvites();
  const invitedHere = useApp((s) => s.invited[org.id]);
  const joinedHere = (invitedHere ?? []).find((u) => u.email === myEmail && !u.pending);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [preview, setPreview] = useState<User | null>(null);
  const loading = useLoading(org.id);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRoleState] = useState<Role>('Member');
  const [err, setErr] = useState('');
  const canManage = persona !== 'member';
  const full = seatsUsed >= plan.seats;
  const rows = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  function unsend(u: User) {
    unsendInvite(org.id, u.id);
    log(org.id, currentUserId(persona), 'Unsent invitation', u.email);
    toast(`Invitation to ${u.email} unsent`, 'info');
    setPreview(null);
  }

  function doRemove() {
    if (!removeTarget) return;
    removeMember(org.id, removeTarget.id);
    log(org.id, currentUserId(persona), 'Removed teammate', removeTarget.email);
    toast(`${removeTarget.name} was removed from ${org.name}`, 'info');
    setRemoveTarget(null);
  }

  function doLeave() {
    if (!joinedHere) return;
    const next = memberOrgIds.find((id) => id !== org.id) ?? 'northwind';
    log(org.id, joinedHere.id, 'Left organisation', joinedHere.email);
    leaveOrg(org.id, joinedHere.id);
    setOrg(next);
    toast(`You left ${org.name}`, 'info');
    setLeaving(false);
    router.push('/dashboard');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setErr('Enter a valid email address.');
    if (users.some((u) => u.email === v)) return setErr('That person is already on the team.');
    invite(org.id, v, role);
    log(org.id, currentUserId(persona), 'Invited teammate', v);
    toast(`Invitation sent to ${v}`);
    setOpen(false); setEmail(''); setErr(''); setRoleState('Member');
  }

  return (
    <div>
      <PageHeader title="Team" subtitle={`${seatsUsed} of ${plan.seats} seats used on the ${plan.name} plan`}
        actions={<>
          {joinedHere && <button className="btn-ghost" onClick={() => setLeaving(true)}><DoorOpen size={16} />Leave organisation</button>}
          {canManage && (full
            ? <Link href="/billing" className="btn-primary">Upgrade for more seats</Link>
            : <button className="btn-primary" onClick={() => setOpen(true)}><UserPlus size={16} />Invite teammate</button>)}
        </>} />
      <div className="card">
        <div className="space-y-3 border-b border-ink-100 p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-9" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search team" />
          </div>
          <div className="flex items-center gap-3"><div className="flex-1"><ProgressBar value={seatsUsed} max={plan.seats} tone="brand" /></div><span className="text-xs text-ink-500">{plan.seats - seatsUsed} seats available</span></div>
        </div>
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title="No teammates found" body={`Nobody in ${org.name} matches "${q}".`} action={<button className="btn-ghost" onClick={() => setQ('')}>Clear search</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-ink-100 bg-ink-50/60"><tr><th className="th">Teammate</th><th className="th">Role</th><th className="th">Status</th><th className="th">Last active</th><th className="th text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((u) => (
                  <tr key={u.id} className="transition hover:bg-ink-50/60">
                    <td className="td"><span className="flex items-center gap-3"><Avatar name={u.name} size={34} /><span><span className="block font-medium text-ink-900">{u.name}</span><span className="block text-xs text-ink-500">{u.email}</span></span></span></td>
                    <td className="td">
                      {canManage && u.role !== 'Owner' ? (
                        <select className="input w-32 py-1.5" value={u.role} aria-label={`Role for ${u.name}`}
                          onChange={(e) => { const r = e.target.value as Role; setRole(org.id, u.id, r); log(org.id, currentUserId(persona), 'Changed role', `${u.name} to ${r}`); toast(`${u.name} is now ${r}`); }}>
                          {ROLES.filter((r) => r !== 'Owner').map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : <Chip tone={u.role === 'Owner' ? 'brand' : 'gray'}>{u.role}</Chip>}
                    </td>
                    <td className="td">{u.pending
                      ? <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><Chip tone="amber">Pending</Chip>{canManage && <>
                          <button className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline" onClick={() => setPreview(u)}><Eye size={12} />View invite</button>
                          <button className="inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:underline" onClick={() => toast(`Invitation resent to ${u.email}`)}><Mail size={12} />Resend</button>
                          <button className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline" onClick={() => unsend(u)}><Undo2 size={12} />Unsend</button>
                        </>}</span>
                      : <Chip tone="green">Active</Chip>}</td>
                    <td className="td whitespace-nowrap text-ink-500">{u.pending ? 'Not joined yet' : ago(u.lastActiveMins)}</td>
                    <td className="td text-right">
                      {canManage && !u.pending && u.role !== 'Owner' && u.email !== myEmail
                        ? <button className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline" onClick={() => setRemoveTarget(u)}><UserMinus size={13} />Remove</button>
                        : <span className="text-ink-300">·</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!canManage && <p className="mt-3 text-xs text-ink-500">Only owners and admins can invite people or change roles.</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="Invite teammate">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email address"><input className="input" autoFocus type="email" placeholder="name@company.com" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} /></Field>
          <Field label="Role" hint={ROLE_HELP[role]}>
            <select className="input" value={role} onChange={(e) => setRoleState(e.target.value as Role)}>{ROLES.filter((r) => r !== 'Owner').map((r) => <option key={r}>{r}</option>)}</select>
          </Field>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2 pt-1"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary">Send invitation</button></div>
        </form>
      </Modal>
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Invitation email" width="max-w-xl">
        {preview && (
          <div>
            <dl className="mb-4 space-y-1 text-sm">
              <div className="flex gap-2"><dt className="w-14 text-ink-500">To</dt><dd>{preview.email}</dd></div>
              <div className="flex gap-2"><dt className="w-14 text-ink-500">Subject</dt><dd className="font-medium">You have been invited to join {org.name} on Quillstack</dd></div>
            </dl>
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-6 text-sm text-ink-700">
              <Logo size={26} />
              <p className="mt-5">Hi {preview.name.split(' ')[0]},</p>
              <p className="mt-3">{preview.invitedBy ?? users[0]?.name ?? 'Your colleague'} has invited you to join <strong>{org.name}</strong> as a <strong>{preview.role}</strong>. Quillstack helps your team summarise, rewrite and translate documents in one shared workspace.</p>
              <span className="btn-primary mt-5 inline-flex">Accept invitation</span>
              <p className="mt-5 text-xs text-ink-500">This invitation expires in 7 days. If you were not expecting it, you can ignore this email.</p>
            </div>
            <p className="mt-3 text-xs text-ink-500">{preview.name.split(' ')[0]} accepts this invitation from their own account.</p>
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { toast(`Invitation resent to ${preview.email}`); }}>Resend</button>
              <button className="btn-ghost text-red-600" onClick={() => unsend(preview)}><Undo2 size={15} />Unsend</button>
              <button className="btn-primary" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove teammate" width="max-w-md">
        {removeTarget && (
          <>
            <p className="text-sm text-ink-600">{removeTarget.name} will lose access to {org.name} straight away and their seat will be freed. Documents they wrote stay in the workspace.</p>
            <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setRemoveTarget(null)}>Cancel</button><button className="btn-danger" onClick={doRemove}>Remove {removeTarget.name.split(' ')[0]}</button></div>
          </>
        )}
      </Modal>
      <Modal open={leaving} onClose={() => setLeaving(false)} title="Leave organisation" width="max-w-md">
        <p className="text-sm text-ink-600">You will lose access to {org.name} and its documents. You can only come back if someone invites you again.</p>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setLeaving(false)}>Stay</button><button className="btn-danger" onClick={doLeave}>Leave {org.name}</button></div>
      </Modal>
    </div>
  );
}
