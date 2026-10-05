'use client';
import { useMemo, useState } from 'react';
import { Download, FileText, History } from 'lucide-react';
import { AUDIT, USERS } from '@/data/seed';
import { absolute, ago } from '@/lib/time';
import { useApp, useOrg } from '@/lib/store';
import { Avatar, Chip, EmptyState, Logo, Modal, PageHeader, Skeleton, useLoading } from '@/shell/ui';

const TONE: Record<string, 'brand' | 'green' | 'amber' | 'gray' | 'teal'> = {
  'Created document': 'green', 'Edited document': 'gray', 'Exported document': 'gray', 'Invited teammate': 'teal',
  'Changed role': 'amber', 'Accepted invitation': 'green', 'Declined invitation': 'gray', 'Unsent invitation': 'gray', 'Created organisation': 'green', 'Changed plan': 'amber', 'Viewed billing': 'gray',
};
const PAGE = 12;

export default function AuditPage() {
  const { org, users } = useOrg();
  const extra = useApp((s) => s.extraAudit);
  const toast = useApp((s) => s.toast);
  const [report, setReport] = useState(false);
  const loading = useLoading(org.id);
  const [user, setUser] = useState('all');
  const [action, setAction] = useState('all');
  const [limit, setLimit] = useState(PAGE);

  const all = useMemo(() => [...extra.filter((r) => r.orgId === org.id), ...AUDIT.filter((r) => r.orgId === org.id)], [extra, org.id]);
  const actions = Array.from(new Set(all.map((r) => r.action))).sort();
  const rows = all.filter((r) => (user === 'all' || r.userId === user) && (action === 'all' || r.action === action));
  const nameOf = (id: string) => id === 'u-elena' ? 'Elena Costa' : users.find((u) => u.id === id)?.name ?? USERS[org.id].find((u) => u.id === id)?.name ?? 'A teammate';
  const mins = (r: (typeof all)[number]) => (r.at ? (Date.now() - r.at) / 60000 : r.mins);

  function exportCsv() {
    const q = (c: string) => `"${c.replace(/"/g, '""')}"`;
    const lines = [['When', 'Who', 'Action', 'Target'], ...rows.map((r) => [new Date(Date.now() - mins(r) * 60000).toISOString(), nameOf(r.userId), r.action, r.target])];
    const blob = new Blob([lines.map((l) => l.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit-log.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`${rows.length} events exported`);
  }
  const aiCount = rows.filter((r) => r.action.startsWith('AI')).length;
  const people = new Set(rows.map((r) => r.userId)).size;
  const filterNote = [user !== 'all' ? `User: ${nameOf(user)}` : null, action !== 'all' ? `Action: ${action}` : null].filter(Boolean).join(' · ') || 'All users, all actions';

  return (
    <div>
      <PageHeader title="Audit log" subtitle={`Every change made in ${org.name}, newest first`}
        actions={<>
          <button className="btn-ghost" disabled={rows.length === 0} onClick={() => setReport(true)}><FileText size={16} />Preview report</button>
          <button className="btn-primary" disabled={rows.length === 0} onClick={exportCsv}><Download size={16} />Export CSV</button>
        </>} />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
          <select className="input sm:w-56" value={user} onChange={(e) => { setUser(e.target.value); setLimit(PAGE); }} aria-label="Filter by user">
            <option value="all">All users</option>
            {users.filter((u) => !u.pending).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="input sm:w-56" value={action} onChange={(e) => { setAction(e.target.value); setLimit(PAGE); }} aria-label="Filter by action">
            <option value="all">All actions</option>
            {actions.map((a) => <option key={a}>{a}</option>)}
          </select>
          <p className="text-sm text-ink-500 sm:ml-auto">{rows.length} {rows.length === 1 ? 'event' : 'events'}</p>
        </div>
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<History size={22} />} title="No events match" body="Try a different user or action to see more of the log." action={<button className="btn-ghost" onClick={() => { setUser('all'); setAction('all'); }}>Reset filters</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-ink-100 bg-ink-50/60"><tr><th className="th">Who</th><th className="th">Action</th><th className="th">Target</th><th className="th">When</th></tr></thead>
                <tbody className="divide-y divide-ink-100">
                  {rows.slice(0, limit).map((r) => (
                    <tr key={r.id} className="hover:bg-ink-50/60">
                      <td className="td"><span className="flex items-center gap-2.5"><Avatar name={nameOf(r.userId)} size={26} /><span className="font-medium text-ink-900">{nameOf(r.userId)}</span></span></td>
                      <td className="td"><Chip tone={TONE[r.action] ?? 'brand'}>{r.action}</Chip></td>
                      <td className="td max-w-xs truncate">{r.target}</td>
                      <td className="td whitespace-nowrap" title={absolute(mins(r))}>{ago(mins(r))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {limit < rows.length && <div className="border-t border-ink-100 p-3 text-center"><button className="btn-ghost" onClick={() => setLimit(limit + PAGE)}>Show more ({rows.length - limit} remaining)</button></div>}
          </>
        )}
      </div>
      <Modal open={report} onClose={() => setReport(false)} title="Audit report" width="max-w-3xl">
        <div className="rounded-xl border border-ink-100 p-6">
          <div className="flex items-start justify-between border-b border-ink-100 pb-4">
            <div><Logo size={26} /><p className="mt-3 text-lg font-semibold">Audit report</p><p className="text-sm text-ink-500">{org.name}</p></div>
            <div className="text-right text-sm text-ink-500"><p>Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p><p>{filterNote}</p></div>
          </div>
          <div className="my-4 grid grid-cols-3 gap-3 text-center">
            {[['Events', rows.length], ['People involved', people], ['AI actions', aiCount]].map(([k, v]) => (
              <div key={k as string} className="rounded-lg bg-ink-50 py-3"><p className="text-2xl font-semibold">{v}</p><p className="text-xs text-ink-500">{k}</p></div>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400"><tr><th className="py-2 font-semibold">Who</th><th className="py-2 font-semibold">Action</th><th className="py-2 font-semibold">Target</th><th className="py-2 text-right font-semibold">When</th></tr></thead>
            <tbody>{rows.slice(0, 12).map((r) => (
              <tr key={r.id} className="border-b border-ink-100 last:border-0"><td className="py-2">{nameOf(r.userId)}</td><td className="py-2">{r.action}</td><td className="max-w-[14rem] truncate py-2 text-ink-500">{r.target}</td><td className="py-2 text-right text-ink-500">{ago(mins(r))}</td></tr>
            ))}</tbody>
          </table>
          {rows.length > 12 && <p className="mt-3 text-xs text-ink-400">Showing the latest 12 of {rows.length} events. The CSV export contains all of them.</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setReport(false)}>Close</button>
          <button className="btn-primary" onClick={() => { toast('Report downloaded', 'info'); setReport(false); }}><Download size={15} />Download PDF</button>
        </div>
      </Modal>
    </div>
  );
}
