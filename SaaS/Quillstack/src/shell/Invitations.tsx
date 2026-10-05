'use client';
import { useRouter } from 'next/navigation';
import { MailCheck, MailOpen } from 'lucide-react';
import { USERS } from '@/data/seed';
import { useApp, useIdentity, useMyInvites, useOrgList } from '@/lib/store';
import { ago } from '@/lib/time';
import { Avatar } from './ui';

/** Pending invitations for whoever is signed in. `home` is the full landing view for people who belong to no organisation yet. */
export function Invitations({ home = false }: { home?: boolean }) {
  const { pending, myName } = useMyInvites();
  const orgList = useOrgList();
  const identity = useIdentity();
  const { acceptInvite, declineInvite, setOrg, log, toast, logout } = useApp();
  const router = useRouter();

  const orgInfo = (id: string) => {
    const o = orgList.find((x) => x.id === id);
    return { name: o?.name ?? id, tone: o?.tone ?? '#4638dc', initials: o?.initials ?? id.slice(0, 2).toUpperCase() };
  };
  const inviterOf = (orgId: string, sent?: string) => sent ?? USERS[orgId]?.find((u) => u.role === 'Owner')?.name ?? 'A colleague';

  if (!home && pending.length === 0) return null;

  const list = (
    <div className="space-y-3">
      {pending.map(({ orgId, user }) => {
        const o = orgInfo(orgId);
        return (
          <div key={user.id} className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-white p-4 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: o.tone }}>{o.initials}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{o.name}</p>
              <p className="text-sm text-ink-600">{inviterOf(orgId, user.invitedBy)} invited you to join as <strong>{user.role}</strong> · {ago(user.invitedAt ? (Date.now() - user.invitedAt) / 60000 : 0)}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => { declineInvite(orgId, user.id); log(orgId, user.id, 'Declined invitation', user.email); toast(`Invitation from ${o.name} declined`, 'info'); }}>Decline</button>
              <button className="btn-primary" onClick={() => {
                acceptInvite(orgId, user.id);
                log(orgId, user.id, 'Accepted invitation', user.email);
                setOrg(orgId);
                toast(`You joined ${o.name}`);
                router.push('/dashboard');
              }}>Accept invitation</button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!home) {
    return (
      <section className="card mb-6 border-brand-200 bg-brand-50/40 p-5" aria-label="Invitations">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700"><MailCheck size={17} /></span>
          <h2 className="font-semibold">Invitations <span className="ml-1 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">{pending.length}</span></h2>
        </div>
        {list}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <Avatar name={myName} size={44} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {myName.split(' ')[0]}</h1>
          <p className="text-sm text-ink-500">You are not part of an organisation yet.</p>
        </div>
      </div>
      {pending.length > 0 ? (
        <section className="card p-5" aria-label="Invitations">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700"><MailCheck size={17} /></span>
            <h2 className="font-semibold">Invitations <span className="ml-1 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">{pending.length}</span></h2>
          </div>
          {list}
        </section>
      ) : (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500"><MailOpen size={22} /></span>
          <h2 className="font-semibold">No pending invitations</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">Ask an owner or admin to invite {identity?.user.email ?? 'you'} to their organisation.</p>
          <button className="btn-ghost mt-4" onClick={() => { logout(); router.replace('/'); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}
