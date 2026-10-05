'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarX2, Download, Flame, RotateCcw, Search, Star } from 'lucide-react';
import { ROLES, workerById } from '@/data/seed';
import type { Shift } from '@/data/types';
import { downloadCsv } from '@/lib/csv';
import { dayLabel, money, timeRange } from '@/lib/format';
import { useApp, useMyShifts } from '@/lib/store';
import { STATUSES, STATUS_TONE } from '@/shell/status';
import { Avatar, Chip, EmptyState, Modal, PageHeader, Skeleton, useLoading } from '@/shell/ui';

type SortKey = 'date' | 'role' | 'rate' | 'status';
const idsOf = (s: Shift) => s.filledByIds ?? (s.filledBy ? [s.filledBy] : []);
const namesOf = (s: Shift) => idsOf(s).map((id) => workerById(id)?.name ?? '').filter(Boolean);

export default function ShiftsPage() {
  const router = useRouter();
  const shifts = useMyShifts();
  const setPrefill = useApp((s) => s.setPrefill);
  const broadcast = useApp((s) => s.broadcast);
  const replay = useApp((s) => s.replayBroadcast);
  const ratings = useApp((s) => s.ratings);
  const rateShift = useApp((s) => s.rateShift);
  const toast = useApp((s) => s.toast);
  const loading = useLoading('shifts');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [role, setRole] = useState('All');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'date', dir: -1 });
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState<Shift | null>(null);
  const [stars, setStars] = useState(5);
  const [note, setNote] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = shifts.filter((s) => (status === 'All' || s.status === status) && (role === 'All' || s.role === role) &&
      (!term || s.role.toLowerCase().includes(term) || s.location.toLowerCase().includes(term) || namesOf(s).some((n) => n.toLowerCase().includes(term))));
    return [...filtered].sort((a, b) => {
      const v = sort.key === 'date' ? a.dayOffset - b.dayOffset : sort.key === 'rate' ? a.rate - b.rate : sort.key === 'role' ? a.role.localeCompare(b.role) : a.status.localeCompare(b.status);
      return v * sort.dir;
    });
  }, [shifts, q, status, role, sort]);

  const done = shifts.filter((s) => s.status === 'Filled' || s.status === 'Unfilled');
  const fillRate = done.length ? Math.round((done.filter((s) => s.status === 'Filled').length / done.length) * 100) : 0;
  const times = shifts.filter((s) => s.secsToFill).map((s) => s.secsToFill!);
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 60) : 0;
  const hours = shifts.filter((s) => s.status === 'Filled').reduce((a, s) => a + (s.end - s.start) * s.positions, 0);

  const head = (key: SortKey, label: string) => (
    <th className="th cursor-pointer select-none" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'date' ? -1 : 1 }))}>
      <span className="inline-flex items-center gap-1">{label}{sort.key === key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</span>
    </th>
  );

  function exportCsv() {
    downloadCsv('shifts.csv', [
      ['Role', 'Date', 'Start', 'End', 'Workers needed', 'Location', 'Rate per hour', 'Status', 'Filled by', 'Seconds to fill'],
      ...rows.map((s) => [s.role, dayLabel(s.dayOffset), timeRange(s.start, s.end).split(' to ')[0], timeRange(s.start, s.end).split(' to ')[1], s.positions, s.location, s.rate, s.status, namesOf(s).join(' and '), s.secsToFill ?? '']),
    ]);
    toast(`Exported ${rows.length} shifts`);
  }

  function openShift(s: Shift) {
    setOpen(s);
    setStars(ratings[s.id]?.stars ?? 5);
    setNote(ratings[s.id]?.note ?? '');
  }

  const base = (s: Shift) => ({ role: s.role, start: s.start, end: s.end, positions: s.positions, location: s.location });

  return (
    <div>
      <PageHeader title="Shifts" subtitle="Every shift you have posted and who covered it." actions={<><button className="btn-ghost" onClick={exportCsv}><Download size={15} />Export CSV</button><Link href="/post-shift" prefetch={false} className="btn-primary">Post a shift</Link></>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Shifts posted', String(shifts.length)],
          ['Fill rate', `${fillRate}%`],
          ['Average time to fill', `${avg} min`],
          ['Hours covered', String(hours)],
        ].map(([l, v]) => <div key={l} className="card p-4"><p className="text-xs font-medium text-ink-500">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}
      </div>

      <div data-tour="shift-table" className="card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input data-search className="input pl-9" placeholder="Search role, place or worker" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="input sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)}>{['All', ...STATUSES].map((o) => <option key={o} value={o}>{o === 'All' ? 'All statuses' : o}</option>)}</select>
          <select className="input sm:w-44" value={role} onChange={(e) => setRole(e.target.value)}><option value="All">All roles</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<CalendarX2 size={22} />} title="No shifts match" body="Try a different status or role, or clear the search." action={<button className="btn-ghost" onClick={() => { setQ(''); setStatus('All'); setRole('All'); }}>Clear filters</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="border-b border-ink-100 bg-ink-50"><tr>{head('role', 'Role')}{head('date', 'Date and time')}<th className="th">Location</th>{head('rate', 'Rate')}<th className="th">Filled by</th>{head('status', 'Status')}</tr></thead>
                <tbody className="divide-y divide-ink-100">
                  {rows.slice(0, limit).map((s) => {
                    const names = namesOf(s);
                    return (
                      <tr key={s.id} className="cursor-pointer transition hover:bg-ink-50" onClick={() => openShift(s)}>
                        <td className="td font-medium text-ink-900">{s.positions > 1 ? `${s.positions} × ` : ''}{s.role}{s.recurring && <span className="ml-1.5 text-xs font-normal text-ink-400">weekly</span>}</td>
                        <td className="td">{dayLabel(s.dayOffset)}<span className="block text-xs text-ink-500">{timeRange(s.start, s.end)}</span></td>
                        <td className="td">{s.location.split(',')[0]}</td>
                        <td className="td">${s.rate}/hr</td>
                        <td className="td">{names.length ? <span className="flex items-center gap-2"><span className="flex -space-x-1.5">{names.map((n) => <Avatar key={n} name={n} size={24} ring />)}</span>{names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0]}</span> : <span className="text-ink-400">{s.status === 'Open' ? 'Waiting' : s.status === 'Scheduled' ? 'Not yet sent' : 'None'}</span>}</td>
                        <td className="td"><Chip tone={STATUS_TONE[s.status]}>{s.status}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-sm text-ink-500">
              <span>Showing {Math.min(limit, rows.length)} of {rows.length}</span>
              {limit < rows.length && <button className="font-medium text-brand-700 hover:underline" onClick={() => setLimit(limit + 10)}>Show more</button>}
            </div>
          </>
        )}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.positions > 1 ? `${open.positions} × ` : ''}${open.role} shift` : ''}>
        {open && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-ink-500">Status</span><Chip tone={STATUS_TONE[open.status]}>{open.status}</Chip></div>
            {[
              ['When', `${dayLabel(open.dayOffset)}, ${timeRange(open.start, open.end)}`],
              ['Where', open.location],
              ['Pay', `$${open.rate}/hr · ${money(open.rate * (open.end - open.start) * open.positions)} total`],
              ['Texts sent', String(open.sent)],
              ['Replies', String(open.replies)],
              ['Time to fill', open.secsToFill ? (open.secsToFill < 60 ? `${open.secsToFill} seconds` : `${Math.round(open.secsToFill / 60)} minutes`) : 'Not filled'],
            ].map(([l, v]) => <div key={l} className="flex justify-between gap-4"><span className="text-ink-500">{l}</span><span className="text-right font-medium">{v}</span></div>)}
            {idsOf(open).map((id) => {
              const w = workerById(id);
              if (!w) return null;
              return <div key={id} className="flex items-center gap-3 rounded-xl bg-ink-50 p-3"><Avatar name={w.name} size={36} /><div><p className="font-medium">{w.name}</p><p className="text-xs text-ink-500">{w.rating.toFixed(1)} rating · {w.reliability}% reliable · {w.phone}</p></div></div>;
            })}

            {open.status === 'Filled' && open.dayOffset < 0 && (
              <div className="rounded-xl border border-ink-100 p-3.5">
                {ratings[open.id] ? (
                  <p className="flex items-center gap-2 text-sm"><span className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} className={n <= ratings[open.id].stars ? 'fill-accent-400 text-accent-400' : 'text-ink-300'} />)}</span>Thanks, your rating is saved.</p>
                ) : (
                  <>
                    <p className="font-medium">Rate {namesOf(open).length > 1 ? 'the crew' : namesOf(open)[0]}</p>
                    <div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}><Star size={24} className={clsx('transition', n <= stars ? 'fill-accent-400 text-accent-400' : 'text-ink-300 hover:text-accent-400')} /></button>)}</div>
                    <input className="input mt-3" placeholder="Add a note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                    <button className="btn-primary mt-3 w-full" onClick={() => { rateShift(open.id, stars, note); toast('Rating saved, thank you'); }}>Submit rating</button>
                  </>
                )}
              </div>
            )}
            {open.status === 'Filled' && open.dayOffset >= 0 && <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">You can rate this shift once it has ended.</p>}

            <div className="flex flex-col gap-2 sm:flex-row">
              {open.status === 'Unfilled' && (
                <button className="btn-primary flex-1" onClick={() => { setPrefill({ ...base(open), rate: open.rate + 3, escalated: { bump: 3, radius: 10 } }); router.push('/post-shift'); }}><Flame size={15} />Escalate and re-broadcast</button>
              )}
              {broadcast?.shiftId === open.id && (
                <button className="btn-ghost flex-1" onClick={() => { replay(); router.push('/shifts/live'); }}><RotateCcw size={15} />Replay broadcast</button>
              )}
              <button className="btn-ghost flex-1" onClick={() => { setPrefill({ ...base(open), rate: open.rate }); router.push('/post-shift'); }}>Post this shift again</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
