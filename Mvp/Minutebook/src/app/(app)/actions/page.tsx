'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { GripVertical, LayoutGrid, List, Play, Search, SearchX } from 'lucide-react';
import { ACCOUNTS, PEOPLE, firstName, person, type ActionItem, type PersonId, type Status } from '@/data';
import { useActions, useApp, useMeetings } from '@/lib/store';
import { clock, coverage } from '@/lib/util';
import { ActionModal } from '@/shell/ActionModal';
import { DueChip, EmptyState, PersonAvatar, STATUS_LABEL, Skeleton, useLoading } from '@/shell/ui';

const COLS: Status[] = ['todo', 'doing', 'done'];

export default function ActionsPage() {
  const role = useApp((s) => s.role)!;
  const setStatus = useApp((s) => s.setStatus);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const meetings = useMeetings();
  const actions = useActions();
  const loading = useLoading('actions');
  const me = ACCOUNTS[role].id;

  const [view, setView] = useState<'board' | 'list'>('board');
  const [q, setQ] = useState('');
  const [owner, setOwner] = useState<'all' | PersonId>('all');
  const [meeting, setMeeting] = useState('all');
  const [due, setDue] = useState<'any' | 'overdue' | 'week'>('any');
  const [sort, setSort] = useState<'due' | 'owner' | 'meeting'>('due');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);

  const meetingOf = (a: ActionItem) => meetings.find((m) => m.id === a.meeting)!;
  const list = useMemo(() => {
    const out = actions.filter((a) => (owner === 'all' || a.owner === owner) && (meeting === 'all' || a.meeting === meeting) && (!q.trim() || coverage(q, `${a.title} ${person(a.owner).name}`) >= 0.99) && (due === 'any' || (due === 'overdue' ? a.status !== 'done' && a.due < 0 : a.status !== 'done' && a.due >= 0 && a.due <= 7)));
    return [...out].sort((x, y) => (sort === 'owner' ? firstName(x.owner).localeCompare(firstName(y.owner)) || x.due - y.due : sort === 'meeting' ? meetings.findIndex((m) => m.id === x.meeting) - meetings.findIndex((m) => m.id === y.meeting) : x.due - y.due));
  }, [actions, owner, meeting, q, due, sort, meetings]);

  const active = activeId ? actions.find((a) => a.id === activeId) ?? null : null;
  const move = (id: string, to: Status) => {
    const a = actions.find((x) => x.id === id);
    if (!a || a.status === to) return;
    setStatus(id, to);
    toast(`Moved to ${STATUS_LABEL[to]}`, 'success');
  };
  const jump = (a: ActionItem) => router.push(`/meetings/${a.meeting}?line=${a.line}`);
  const filtered = owner !== 'all' || meeting !== 'all' || due !== 'any' || q.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Action board</h1>
          <p className="mt-1 text-ink-500">{actions.filter((a) => a.status !== 'done').length} open · {actions.filter((a) => a.status !== 'done' && a.due < 0).length} overdue · {actions.length} in total</p>
        </div>
        <div className="inline-flex rounded-xl bg-ink-100 p-1">
          {([['board', 'Board', LayoutGrid], ['list', 'List', List]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => setView(v)} className={clsx('flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition', view === v ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800')}><Icon size={16} /> {label}</button>
          ))}
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input py-2 pl-9" placeholder="Filter actions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter actions" />
        </div>
        <button onClick={() => setOwner(owner === me ? 'all' : me)} className={clsx('rounded-lg border px-3 py-2 text-sm font-semibold transition', owner === me ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-300 bg-white text-ink-700 hover:bg-ink-50')}>Mine</button>
        <select className="input w-auto py-2" value={owner} onChange={(e) => setOwner(e.target.value as typeof owner)} aria-label="Owner">
          <option value="all">Everyone</option>
          {PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input w-auto max-w-48 py-2" value={meeting} onChange={(e) => setMeeting(e.target.value)} aria-label="Meeting">
          <option value="all">All meetings</option>
          {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        <select className="input w-auto py-2" value={due} onChange={(e) => setDue(e.target.value as typeof due)} aria-label="Due">
          <option value="any">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due this week</option>
        </select>
        <select className="input w-auto py-2" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
          <option value="due">Soonest due</option>
          <option value="owner">By owner</option>
          <option value="meeting">By meeting</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-96" />)}</div>
      ) : list.length === 0 ? (
        <div className="card"><EmptyState icon={<SearchX size={22} />} title="No actions match" body="Loosen a filter to see more of the team's follow-ups." action={<button className="btn-ghost" onClick={() => { setQ(''); setOwner('all'); setMeeting('all'); setDue('any'); }}>Clear filters</button>} /></div>
      ) : view === 'board' ? (
        <div className="no-scrollbar -mx-4 grid snap-x auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto px-4 sm:auto-cols-[60%] lg:mx-0 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {COLS.map((col) => {
            const items = list.filter((a) => a.status === col);
            return (
              <section
                key={col}
                onDragOver={(e) => { e.preventDefault(); setOver(col); }}
                onDragLeave={() => setOver((o) => (o === col ? null : o))}
                onDrop={(e) => { e.preventDefault(); setOver(null); if (dragId) move(dragId, col); setDragId(null); }}
                className={clsx('snap-start rounded-2xl border p-3 transition', over === col ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-100/60')}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="font-sans text-sm font-semibold text-ink-800">{STATUS_LABEL[col]}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink-600 ring-1 ring-ink-200">{items.length}</span>
                </div>
                <div className="space-y-2.5 lg:max-h-[68vh] lg:overflow-y-auto lg:pr-0.5">
                  {items.length === 0 && <p className="rounded-xl border border-dashed border-ink-300 py-8 text-center text-sm text-ink-400">Drop an action here</p>}
                  {items.map((a) => (
                    <article
                      key={a.id}
                      draggable
                      onDragStart={() => setDragId(a.id)}
                      onDragEnd={() => { setDragId(null); setOver(null); }}
                      onClick={() => setActiveId(a.id)}
                      className={clsx('group cursor-pointer rounded-xl border border-ink-200 bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md', dragId === a.id && 'opacity-40')}
                    >
                      <div className="flex items-start gap-2">
                        <p className={clsx('flex-1 text-sm font-semibold leading-snug', a.status === 'done' ? 'text-ink-400 line-through' : 'text-ink-900')}>{a.title}</p>
                        <GripVertical size={16} className="mt-0.5 hidden shrink-0 text-ink-300 group-hover:text-ink-500 lg:block" />
                      </div>
                      <p className="mt-1 truncate text-xs text-ink-500">{meetingOf(a).title}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-ink-700"><PersonAvatar id={a.owner} size={22} /> {firstName(a.owner)}</span>
                        <DueChip due={a.due} status={a.status} />
                        <button onClick={(e) => { e.stopPropagation(); jump(a); }} className="ml-auto inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-600 hover:bg-brand-100 hover:text-brand-800" title="Play from the moment it was agreed">
                          <Play size={10} fill="currentColor" /> {clock(meetingOf(a).lines[a.line].ts)}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-ink-200 bg-ink-50"><tr><th className="th">Action</th><th className="th">Owner</th><th className="th">Due</th><th className="th">Status</th><th className="th">Meeting</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {list.map((a) => (
                <tr key={a.id} className="cursor-pointer hover:bg-ink-50" onClick={() => setActiveId(a.id)}>
                  <td className="td max-w-xs font-medium text-ink-900">{a.title}</td>
                  <td className="td"><span className="flex items-center gap-2"><PersonAvatar id={a.owner} size={22} /> {firstName(a.owner)}</span></td>
                  <td className="td"><DueChip due={a.due} status={a.status} /></td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <select className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs font-semibold" value={a.status} onChange={(e) => move(a.id, e.target.value as Status)} aria-label={`Status of ${a.title}`}>
                      {COLS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="td text-ink-500">{meetingOf(a).title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered && !loading && list.length > 0 && <p className="text-xs text-ink-400">Showing {list.length} of {actions.length} actions.</p>}

      <ActionModal action={active} onClose={() => setActiveId(null)} onJump={jump} />
    </div>
  );
}
