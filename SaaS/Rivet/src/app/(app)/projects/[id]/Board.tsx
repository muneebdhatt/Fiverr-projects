'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { Clock, GripVertical, Play, Plus, Trash2 } from 'lucide-react';
import { PEOPLE, person, project } from '@/data/static';
import type { PersonId, ProjectId, Task, TaskStatus } from '@/data/types';
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER } from '@/lib/labels';
import { useApp, useEntries, useTasks } from '@/lib/store';
import { dueLabel, fromInputDate, hrs, toInputDate } from '@/lib/util';
import { Chip, Drawer, Field, PersonAvatar } from '@/shell/ui';

const PRI_DOT = { high: 'bg-ember-500', medium: 'bg-brand-500', low: 'bg-ink-300' };

export function Board({ projectId, me }: { projectId: ProjectId; me: PersonId }) {
  const tasks = useTasks().filter((t) => t.projectId === projectId);
  const patchTask = useApp((s) => s.patchTask);
  const addTask = useApp((s) => s.addTask);
  const toast = useApp((s) => s.toast);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [who, setWho] = useState('all');
  const [adding, setAdding] = useState<TaskStatus | null>(null);
  const [title, setTitle] = useState('');
  const team = project(projectId).team;
  const shown = tasks.filter((t) => who === 'all' || (who === 'me' ? t.assignee === me : t.assignee === who));

  const move = (id: string, status: TaskStatus) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    patchTask(id, { status, doneDay: status === 'done' ? 0 : undefined });
    toast(`${t.title} moved to ${STATUS_LABEL[status]}`, 'success');
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by person">
          <option value="all">Everyone</option>
          <option value="me">Assigned to me</option>
          {team.filter((id) => id !== me).map((id) => <option key={id} value={id}>{person(id).name}</option>)}
        </select>
        <p className="text-xs text-ink-500">Drag a card to another column to change its status.</p>
      </div>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {STATUS_ORDER.map((s) => {
          const col = shown.filter((t) => t.status === s).sort((a, b) => (s === 'done' ? (b.doneDay ?? 0) - (a.doneDay ?? 0) : a.due - b.due));
          return (
            <section
              key={s}
              onDragOver={(e) => { e.preventDefault(); setOver(s); }}
              onDragLeave={() => setOver((o) => (o === s ? null : o))}
              onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, s); setDragId(null); setOver(null); }}
              className={clsx('w-72 shrink-0 snap-start rounded-xl border bg-ink-100/70 p-2.5 transition lg:w-auto', over === s ? 'border-brand-400 bg-brand-50' : 'border-transparent')}
              aria-label={STATUS_LABEL[s]}
            >
              <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                <h3 className="font-sans text-sm font-semibold text-ink-800">{STATUS_LABEL[s]} <span className="ml-1 text-xs font-medium text-ink-400">{col.length}</span></h3>
                <button className="rounded-md p-1 text-ink-400 hover:bg-white hover:text-ink-700" aria-label={`Add task to ${STATUS_LABEL[s]}`} onClick={() => { setAdding(s); setTitle(''); }}><Plus size={16} /></button>
              </div>
              <div className="space-y-2.5">
                {adding === s && (
                  <form className="card p-2.5" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; addTask({ projectId, title: title.trim(), status: s, assignee: me, due: 7, est: 4, priority: 'medium', doneDay: s === 'done' ? 0 : undefined }); toast('Task added', 'success'); setAdding(null); }}>
                    <input className="input" autoFocus placeholder="Task name" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <div className="mt-2 flex gap-2"><button className="btn-primary btn-sm">Add</button><button type="button" className="btn-ghost btn-sm" onClick={() => setAdding(null)}>Cancel</button></div>
                  </form>
                )}
                {col.map((t) => (
                  <article
                    key={t.id}
                    draggable
                    onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); }}
                    onDragEnd={() => { setDragId(null); setOver(null); }}
                    onClick={() => setOpen(t.id)}
                    className={clsx('card cursor-grab select-none p-3 transition hover:border-brand-300 active:cursor-grabbing', dragId === t.id && 'dragging')}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="mt-0.5 shrink-0 text-ink-300" />
                      <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">{t.title}</p>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-500"><span className={clsx('h-2 w-2 rounded-full', PRI_DOT[t.priority])} /> {PRIORITY_LABEL[t.priority]}</span>
                      {t.status !== 'done' && <Chip tone={t.due < 0 ? 'ember' : 'outline'}>{dueLabel(t.due)}</Chip>}
                      {t.internal && <Chip tone="gray">Team only</Chip>}
                      <span className="ml-auto"><PersonAvatar id={t.assignee} size={22} /></span>
                    </div>
                  </article>
                ))}
                {col.length === 0 && adding !== s && <p className="px-2 py-6 text-center text-xs text-ink-400">Nothing here</p>}
              </div>
            </section>
          );
        })}
      </div>
      <TaskDrawer id={open} onClose={() => setOpen(null)} me={me} />
    </div>
  );
}

function TaskDrawer({ id, onClose, me }: { id: string | null; onClose: () => void; me: PersonId }) {
  const task = useTasks().find((t) => t.id === id);
  const entries = useEntries();
  const patch = useApp((s) => s.patchTask);
  const remove = useApp((s) => s.removeTask);
  const timer = useApp((s) => s.timer);
  const start = useApp((s) => s.startTimer);
  const toast = useApp((s) => s.toast);
  if (!task) return null;
  const logged = entries.filter((e) => e.taskId === task.id).reduce((n, e) => n + e.hours, 0);
  const set = (p: Partial<Task>) => patch(task.id, p);
  return (
    <Drawer
      open
      onClose={onClose}
      title={<div><p className="text-xs font-semibold text-ink-500">{project(task.projectId).name}</p><input className="mt-1 w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 font-display text-lg font-bold outline-none hover:border-ink-200 focus:border-brand-500" value={task.title} onChange={(e) => set({ title: e.target.value })} aria-label="Task name" /></div>}
      footer={
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={timer.running} onClick={() => { start({ projectId: task.projectId, taskId: task.id, note: task.title, billable: true }); toast('Timer started', 'success'); onClose(); }}><Play size={15} /> {timer.running ? 'Timer already running' : 'Start timer'}</button>
          <button className="btn-ghost" aria-label="Delete task" onClick={() => { remove(task.id); toast('Task deleted'); onClose(); }}><Trash2 size={16} /></button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select className="input" value={task.status} onChange={(e) => { const s = e.target.value as TaskStatus; set({ status: s, doneDay: s === 'done' ? 0 : undefined }); }}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" value={task.priority} onChange={(e) => set({ priority: e.target.value as Task['priority'] })}>
              {(['high', 'medium', 'low'] as const).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </Field>
          <Field label="Assignee">
            <select className="input" value={task.assignee} onChange={(e) => set({ assignee: e.target.value as PersonId })}>
              {PEOPLE.filter((p) => project(task.projectId).team.includes(p.id) || p.id === task.assignee).map((p) => <option key={p.id} value={p.id}>{p.name}{p.id === me ? ' (you)' : ''}</option>)}
            </select>
          </Field>
          <Field label="Due date"><input className="input" type="date" value={toInputDate(task.due)} onChange={(e) => { const d = fromInputDate(e.target.value); if (d !== null) set({ due: d }); }} /></Field>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-ink-600"><Clock size={15} /> Time logged</span>
          <span className="tabnum font-semibold">{hrs(logged)} <span className="font-normal text-ink-400">of {hrs(task.est)} estimated</span></span>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" className="h-4 w-4 accent-[#7538e2]" checked={!!task.internal} onChange={(e) => set({ internal: e.target.checked })} /> Team only (hide from the client portal)</label>
        <Field label="Internal note" hint="Only the team can see this. It never appears in the client portal.">
          <textarea className="input min-h-28" value={task.note ?? ''} onChange={(e) => set({ note: e.target.value })} placeholder="Context for the team" />
        </Field>
      </div>
    </Drawer>
  );
}
