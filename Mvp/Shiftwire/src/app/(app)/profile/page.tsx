'use client';
import clsx from 'clsx';
import { useState } from 'react';
import { BadgeCheck, FileText, Star } from 'lucide-react';
import { ROLES } from '@/data/seed';
import { standing, useMe, useMeAccount } from '@/lib/me';
import type { Role } from '@/data/types';
import { DAYS } from '@/lib/format';
import { useApp } from '@/lib/store';
import { PhoneFrame } from '@/shell/PhoneFrame';
import { Avatar, Chip, Field } from '@/shell/ui';

export default function ProfilePage() {
  const me = useMe();
  const acct = useMeAccount();
  const toast = useApp((s) => s.toast);
  const [skills, setSkills] = useState<Role[]>(me.skills);
  const [days, setDays] = useState<string[]>(me.days);
  const [licence, setLicence] = useState(me.licence);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <PhoneFrame className="bg-ink-50">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center gap-3">
            <Avatar name={me.name} size={56} />
            <div>
              <p className="flex items-center gap-1.5 text-lg font-semibold">{me.name}<BadgeCheck size={17} className="text-brand-600" /></p>
              <p className="text-sm text-ink-500">{me.phone}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-600"><Star size={13} className="fill-accent-400 text-accent-400" />{standing(me)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-600">{me.about}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => <button key={r} onClick={() => setSkills(toggle(skills, r))} className={clsx('rounded-full border px-3 py-1 text-xs font-medium transition', skills.includes(r) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-100')}>{r}</button>)}
          </div>
          <div className="mt-4"><Field label="Licence or certificate"><input className="input" value={licence} onChange={(e) => setLicence(e.target.value)} /></Field></div>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-ink-100 p-3 text-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{acct ? acct.fileName : 'servsafe-food-handler.pdf'}</span><span className="text-xs text-ink-500">{acct ? 'Received just now' : '212 KB'}</span></span>
            <Chip tone={acct ? 'amber' : 'green'}>{acct ? 'In review' : 'Verified'}</Chip>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Usually available</p>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => <button key={d} onClick={() => setDays(toggle(days, d))} className={clsx('rounded-lg py-2 text-xs font-medium transition', days.includes(d) ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200')}>{d.slice(0, 2)}</button>)}
          </div>
        </div>
        <button className="btn-primary w-full py-3" onClick={() => toast('Profile saved')}>Save changes</button>
      </div>
    </PhoneFrame>
  );
}
