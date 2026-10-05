'use client';
import { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, Search, Users } from 'lucide-react';
import type { Role } from '@/data/types';
import { useApp } from '@/lib/store';
import { ago } from '@/lib/time';
import { Avatar, Chip, EmptyState, Modal, SelectField, Skeleton, Switch } from '@/shell/ui';

const ROLES: { value: Role; label: string }[] = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'clinician', label: 'Clinician' },
  { value: 'admin', label: 'Admin' },
];
const ROLE_NOTE: Record<Role, string> = {
  receptionist: 'Sees the queue and check-in details only.',
  clinician: 'Sees full intakes, AI summaries and can add notes.',
  admin: 'Manages staff and question sets, reads the audit trail.',
};

export default function StaffPage() {
  const staff = useApp((s) => s.staff);
  const updateStaff = useApp((s) => s.updateStaff);
  const inviteStaff = useApp((s) => s.inviteStaff);
  const toast = useApp((s) => s.toast);
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('all');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('receptionist');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return staff.filter((s) => (roleF === 'all' || s.role === roleF) && (!term || `${s.name} ${s.email}`.toLowerCase().includes(term)));
  }, [staff, q, roleF]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    inviteStaff(name.trim(), email.trim(), role);
    toast(`Invitation sent to ${email.trim()}`);
    setOpen(false);
    setName('');
    setEmail('');
    setRole('receptionist');
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Alder Street Health</p>
          <h1 className="mt-1 font-display text-5xl leading-none text-heading">Staff</h1>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Invite staff</button>
      </div>

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bark-400" />
          <input className="field !rounded-full !py-2 pl-10" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search staff" />
        </div>
        <SelectField label="Filter by role" value={roleF} onChange={setRoleF} options={[{ value: 'all', label: 'All roles' }, ...ROLES]} />
        <span className="ml-auto text-sm text-bark-400">{rows.length} people</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-px">{Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-10 w-10 !rounded-full" /><Skeleton className="h-4 w-44" /><Skeleton className="ml-auto h-4 w-24" /></div>)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title="No one found" body="No staff match that search." action={<button className="btn-soft" onClick={() => { setQ(''); setRoleF('all'); }}>Clear filters</button>} />
        ) : (
          <ul className="divide-y divide-bone-200">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 hover:bg-bone-100">
                <Avatar name={s.name} size={42} />
                <div className="min-w-[180px] flex-1">
                  <p className="flex items-center gap-2 font-bold text-bark-900">{s.name}{s.invited && <Chip tone="pine">Invited</Chip>}</p>
                  <p className="text-sm text-bark-500">{s.email}</p>
                </div>
                <SelectField label={`Role for ${s.name}`} value={s.role} onChange={(v) => { updateStaff(s.id, { role: v as Role }); toast(`${s.name} is now a ${ROLES.find((r) => r.value === v)!.label.toLowerCase()}`); }} options={ROLES} />
                <p className="hidden w-32 text-sm text-bark-400 md:block">{s.invited ? 'Not signed in yet' : s.lastActiveMins < 2 ? 'Active now' : `Active ${ago(s.lastActiveMins)}`}</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-bark-500">{s.active ? 'Active' : 'Paused'}</span>
                  <Switch on={s.active} label={`Account active for ${s.name}`} onChange={(v) => { updateStaff(s.id, { active: v }); toast(v ? `${s.name} can sign in again` : `${s.name} is paused`, v ? 'success' : 'info'); }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Invite staff">
        <form onSubmit={send} className="space-y-4">
          <div><label className="label" htmlFor="sn">Full name</label><input id="sn" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Imani Okafor" autoFocus /></div>
          <div><label className="label" htmlFor="se">Work email</label><input id="se" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></div>
          <div>
            <label className="label" htmlFor="sr">Role</label>
            <SelectField className="w-full" label="Role" value={role} onChange={(v) => setRole(v as Role)} options={ROLES} />
            <p className="mt-2 text-xs text-bark-500">{ROLE_NOTE[role]}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={!name.trim() || !email.trim()}><Mail size={15} />Send invitation</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
