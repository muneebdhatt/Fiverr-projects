'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, ScrollText } from 'lucide-react';
import { useApp, useNow } from '@/lib/store';
import { agoTs, dayTime } from '@/lib/time';
import { Avatar, Chip, EmptyState, SelectField, Skeleton } from '@/shell/ui';

const ACTIONS = ['Opened intake', 'Changed status', 'Added note', 'Viewed queue', 'Signed in', 'Edited question set', 'Invited staff', 'Called to desk', 'Alerted nurse', 'Acknowledged alert', 'Assigned room', 'Exported report'];
const ROLE_LABEL = { receptionist: 'Receptionist', clinician: 'Clinician', admin: 'Admin', system: 'System' } as const;

export default function AuditPage() {
  const audit = useApp((s) => s.audit);
  const now = useNow();
  const [user, setUser] = useState('all');
  const [action, setAction] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const users = useMemo(() => Array.from(new Set(audit.map((a) => a.user))).sort(), [audit]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return audit
      .filter((a) => (user === 'all' || a.user === user) && (action === 'all' || a.action === action) && (!term || `${a.patient ?? ''} ${a.detail}`.toLowerCase().includes(term)))
      .sort((a, b) => b.ts - a.ts);
  }, [audit, user, action, q]);

  return (
    <div>
      <p className="eyebrow">Access log</p>
      <h1 className="mt-1 font-display text-5xl leading-none text-heading">Audit trail</h1>
      <p className="mt-2 max-w-2xl text-sm text-bark-500">Every time someone opens a patient record, changes a status or adds a note, it is recorded here with who and when.</p>

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bark-400" />
          <input className="field !rounded-full !py-2 pl-10" placeholder="Search patient or detail" value={q} onChange={(e) => { setQ(e.target.value); setLimit(14); }} aria-label="Search the audit trail" />
        </div>
        <SelectField label="Filter by person" value={user} onChange={(v) => { setUser(v); setLimit(14); }} options={[{ value: 'all', label: 'Everyone' }, ...users.map((u) => ({ value: u, label: u }))]} />
        <SelectField label="Filter by action" value={action} onChange={(v) => { setAction(v); setLimit(14); }} options={[{ value: 'all', label: 'All actions' }, ...ACTIONS.map((a) => ({ value: a, label: a }))]} />
        <span className="ml-auto text-sm text-bark-400">{rows.length} entries</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-px">{Array.from({ length: 7 }, (_, i) => <div key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-8 w-8 !rounded-full" /><Skeleton className="h-4 w-48" /><Skeleton className="ml-auto h-4 w-32" /></div>)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<ScrollText size={22} />} title="No matching entries" body="Nothing in the log fits those filters." action={<button className="btn-soft" onClick={() => { setUser('all'); setAction('all'); setQ(''); }}>Clear filters</button>} />
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-bone-200 bg-bone-100 text-[11px] font-bold uppercase tracking-wider text-bark-500">
                  <th className="px-5 py-3">When</th><th className="px-3 py-3">Person</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Patient</th><th className="px-5 py-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bone-200">
                {rows.slice(0, limit).map((a) => (
                  <tr key={a.id} className="hover:bg-bone-100">
                    <td className="whitespace-nowrap px-5 py-3"><p className="font-semibold text-bark-800">{agoTs(a.ts, now)}</p><p className="text-xs text-bark-400">{dayTime(a.ts)}</p></td>
                    <td className="px-3 py-3"><span className="flex items-center gap-2.5"><Avatar name={a.user} size={30} /><span><span className="block font-semibold text-bark-800">{a.user}</span><span className="block text-xs text-bark-400">{ROLE_LABEL[a.role]}</span></span></span></td>
                    <td className="px-3 py-3"><Chip tone={a.action === 'Opened intake' ? 'pine' : 'neutral'}>{a.action}</Chip></td>
                    <td className="px-3 py-3 font-semibold text-bark-800">{a.patient ?? <span className="font-normal text-bark-300">-</span>}</td>
                    <td className="px-5 py-3 text-bark-500">{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-bone-200 md:hidden">
              {rows.slice(0, limit).map((a) => (
                <li key={a.id} className="flex gap-3 p-4">
                  <Avatar name={a.user} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><b className="text-bark-800">{a.user}</b> <span className="text-bark-500">{a.action.toLowerCase()}</span>{a.patient && <b className="text-bark-800"> {a.patient}</b>}</p>
                    <p className="mt-0.5 text-xs text-bark-400">{a.detail} · {agoTs(a.ts, now)}</p>
                  </div>
                </li>
              ))}
            </ul>
            {rows.length > limit && <div className="border-t border-bone-200 p-3 text-center"><button className="btn-soft" onClick={() => setLimit((l) => l + 14)}>Show more</button></div>}
          </>
        )}
      </div>
    </div>
  );
}
