'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Play, Square, Timer as TimerIcon, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { ACCOUNTS, PROJECTS, client, project } from '@/data/static';
import type { PersonId, ProjectId } from '@/data/types';
import { useApp, useTasks, type Role } from '@/lib/store';
import { hrs } from '@/lib/util';
import { Field, useClickOutside } from './ui';

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
export const clockOf = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function TimerCard({ user, onDone }: { user: PersonId; onDone?: () => void }) {
  const timer = useApp((s) => s.timer);
  const start = useApp((s) => s.startTimer);
  const setField = useApp((s) => s.setTimerField);
  const stop = useApp((s) => s.stopTimer);
  const discard = useApp((s) => s.discardTimer);
  const toast = useApp((s) => s.toast);
  const tasks = useTasks();
  const now = useNow();
  const mine = useMemo(() => PROJECTS.filter((p) => p.team.includes(user)), [user]);
  const [pid, setPid] = useState<ProjectId>(timer.projectId || mine[0].id);
  const [taskId, setTaskId] = useState(timer.taskId);
  const [note, setNote] = useState(timer.note);
  const [billable, setBillable] = useState(timer.billable);
  const projTasks = tasks.filter((t) => t.projectId === (timer.running ? timer.projectId : pid) && t.status !== 'done');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className={clsx('tabnum font-display text-5xl font-bold tracking-tight', timer.running ? 'text-ink-900' : 'text-ink-300')}>{timer.running ? clockOf(now - timer.startedAt) : '0:00:00'}</p>
        <p className="mt-1 text-xs text-ink-500">{timer.running ? `Running on ${project(timer.projectId as ProjectId).name}` : 'Pick a project and start the clock'}</p>
      </div>
      <Field label="Project">
        <select className="input" value={timer.running ? timer.projectId : pid} disabled={timer.running} onChange={(e) => { setPid(e.target.value as ProjectId); setTaskId(''); }}>
          {mine.map((p) => <option key={p.id} value={p.id}>{p.name} · {client(p.clientId).name}</option>)}
        </select>
      </Field>
      <Field label="Task (optional)">
        <select className="input" value={timer.running ? timer.taskId : taskId} onChange={(e) => { setTaskId(e.target.value); if (timer.running) setField({ taskId: e.target.value }); }}>
          <option value="">No specific task</option>
          {projTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </Field>
      <Field label="What are you working on?">
        <input className="input" placeholder="e.g. Responsive fixes on the homepage" value={timer.running ? timer.note : note} onChange={(e) => { setNote(e.target.value); if (timer.running) setField({ note: e.target.value }); }} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" className="h-4 w-4 accent-[#7538e2]" checked={timer.running ? timer.billable : billable} onChange={(e) => { setBillable(e.target.checked); if (timer.running) setField({ billable: e.target.checked }); }} /> Billable
      </label>
      {timer.running ? (
        <div className="flex gap-2">
          <button className="btn-dark flex-1" onClick={() => { const h = stop(user); toast(`Logged ${hrs(h)} to ${project(timer.projectId as ProjectId).name}`, 'success'); onDone?.(); }}><Square size={16} /> Stop and save</button>
          <button className="btn-ghost" aria-label="Discard timer" onClick={() => { discard(); toast('Timer discarded'); }}><Trash2 size={16} /></button>
        </div>
      ) : (
        <button className="btn-primary w-full" onClick={() => { start({ projectId: pid, taskId, note: note || (taskId ? tasks.find((t) => t.id === taskId)?.title ?? '' : ''), billable }); toast('Timer started', 'success'); onDone?.(); }}><Play size={16} /> Start timer</button>
      )}
    </div>
  );
}

/** Header control: a running clock with Stop, or a Timer button that opens the start panel. */
export function HeaderTimer({ role }: { role: Role }) {
  const timer = useApp((s) => s.timer);
  const stop = useApp((s) => s.stopTimer);
  const toast = useApp((s) => s.toast);
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const now = useNow();
  const user = ACCOUNTS[role as 'owner' | 'member'].id as PersonId;

  return (
    <div className="relative" ref={ref}>
      {timer.running ? (
        <div className="flex items-center gap-1 rounded-full bg-ink-900 py-1 pl-3 pr-1 text-white">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm font-semibold" aria-label="Open timer">
            <span className="h-2 w-2 rounded-full bg-ember-400 ring-pulse" />
            <span className="tabnum">{clockOf(now - timer.startedAt)}</span>
            <span className="hidden max-w-32 truncate text-xs font-normal text-ink-300 lg:inline">{project(timer.projectId as ProjectId).name}</span>
          </button>
          <button className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-900 hover:bg-ink-100" aria-label="Stop timer" onClick={() => { const h = stop(user); toast(`Logged ${hrs(h)} to ${project(timer.projectId as ProjectId).name}`, 'success'); }}>
            <Square size={12} fill="currentColor" />
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen((o) => !o)} className="btn-ghost btn-sm" aria-expanded={open}><TimerIcon size={15} /> <span className="hidden sm:inline">Start timer</span></button>
      )}
      {open && (
        <div className="pop absolute right-0 top-12 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-ink-200 bg-white p-4 shadow-xl">
          <TimerCard user={user} onDone={() => setOpen(false)} />
          <Link href="/time" onClick={() => setOpen(false)} className="mt-3 block text-center text-xs font-semibold text-brand-700 hover:underline">Open timesheet</Link>
        </div>
      )}
    </div>
  );
}
