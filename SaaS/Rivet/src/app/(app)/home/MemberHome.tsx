'use client';
import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Play, Sparkles } from 'lucide-react';
import { ACCOUNTS, PROJECTS, client, person, project } from '@/data/static';
import type { TaskStatus } from '@/data/types';
import { useActivity, useApp, useEntries, useInvoices, useTasks } from '@/lib/store';
import { projectStats } from '@/lib/derive';
import { dueLabel, fullDate, hrs, r2, weekStart, weekdayShort } from '@/lib/util';
import { ActivityFeed } from '@/shell/Feed';
import { TimerCard } from '@/shell/Timer';
import { Chip, Modal, PageHead, ProgressBar, Stat } from '@/shell/ui';
import { WeeklyUpdate } from '@/shell/WeeklyUpdate';
import { STATUS_LABEL } from '@/lib/labels';

export default function MemberHome() {
  const me = person(ACCOUNTS.member.id);
  const entries = useEntries();
  const tasks = useTasks();
  const invoices = useInvoices();
  const activity = useActivity().filter((a) => !a.money && !a.internal);
  const patchTask = useApp((s) => s.patchTask);
  const timer = useApp((s) => s.timer);
  const startTimer = useApp((s) => s.startTimer);
  const toast = useApp((s) => s.toast);
  const [wuOpen, setWuOpen] = useState(false);

  const wk = weekStart(0);
  const mine = entries.filter((e) => e.user === me.id);
  const weekHours = r2(mine.filter((e) => e.day >= wk).reduce((n, e) => n + e.hours, 0));
  const billableShare = weekHours ? Math.round((mine.filter((e) => e.day >= wk && e.billable).reduce((n, e) => n + e.hours, 0) / weekHours) * 100) : 0;
  const open = tasks.filter((t) => t.assignee === me.id && t.status !== 'done').sort((a, b) => a.due - b.due);
  const days = Array.from({ length: 5 }, (_, i) => wk + i);
  const myProjects = PROJECTS.filter((p) => p.team.includes(me.id));

  return (
    <div>
      <PageHead title={`Hi ${me.name.split(' ')[0]}`} sub={`${fullDate(0)} · ${open.length} open tasks assigned to you`} actions={<button className="btn-ghost" onClick={() => setWuOpen(true)}><Sparkles size={16} className="text-brand-600" /> Draft the weekly update</button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold">Timer</h2>
          <TimerCard user={me.id} />
        </section>
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="This week" value={hrs(weekHours)} sub={`of ${me.capacity} h capacity`} />
            <Stat label="Billable" value={`${billableShare}%`} sub="Share of your logged hours" />
            <Stat label="Due soon" value={open.filter((t) => t.due <= 3).length} sub="Tasks due in 3 days" />
          </div>
          <section className="card p-4">
            <h2 className="font-sans text-base font-semibold">Your hours this week</h2>
            <div className="mt-4 flex items-end justify-between gap-3">
              {days.map((d) => {
                const h = mine.filter((e) => e.day === d).reduce((n, e) => n + e.hours, 0);
                return (
                  <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="tabnum text-xs text-ink-500">{h ? r2(h) : ''}</span>
                    <div className="flex h-24 w-full items-end"><div className={clsx('w-full rounded-t-md', h ? 'bg-brand-600' : 'bg-ink-200')} style={{ height: h ? `${Math.min(100, (h / 8) * 100)}%` : 3 }} /></div>
                    <span className={clsx('text-xs font-semibold', d === 0 ? 'text-brand-700' : 'text-ink-500')}>{weekdayShort(d)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">My tasks</h2></div>
          <ul className="divide-y divide-ink-100">
            {open.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 basis-52">
                  <Link href={`/projects/${t.projectId}`} className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-700">{t.title}</Link>
                  <p className="truncate text-xs text-ink-500">{project(t.projectId).name} · {client(project(t.projectId).clientId).name}</p>
                </div>
                <Chip tone={t.due < 0 ? 'ember' : t.due <= 1 ? 'brand' : 'outline'}>{dueLabel(t.due)}</Chip>
                <select className="rounded-lg border border-ink-300 bg-white px-2 py-1.5 text-xs font-medium" value={t.status} aria-label="Status" onChange={(e) => { const s = e.target.value as TaskStatus; patchTask(t.id, { status: s, doneDay: s === 'done' ? 0 : undefined }); toast(`${t.title} moved to ${STATUS_LABEL[s]}`, 'success'); }}>
                  {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <button className="btn-ghost btn-sm" disabled={timer.running} title={timer.running ? 'Stop the running timer first' : 'Start timer'} onClick={() => { startTimer({ projectId: t.projectId, taskId: t.id, note: t.title, billable: true }); toast('Timer started', 'success'); }}><Play size={13} /> Start</button>
              </li>
            ))}
            {open.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink-500">You are all caught up.</li>}
          </ul>
        </section>
        <div className="space-y-6">
          <section className="card">
            <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">My projects</h2></div>
            <ul className="divide-y divide-ink-100">
              {myProjects.map((p) => {
                const s = projectStats(p.id, entries, invoices, tasks);
                return (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="block px-4 py-3 hover:bg-ink-50">
                      <div className="flex justify-between text-sm"><span className="truncate font-semibold text-ink-900">{p.name}</span><span className="tabnum text-xs text-ink-500">{Math.round(s.progress * 100)}%</span></div>
                      <ProgressBar value={s.tasksDone} max={s.tasksTotal} className="mt-1.5 h-1.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card">
            <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Team activity</h2></div>
            <ActivityFeed items={activity.slice(0, 5)} />
          </section>
        </div>
      </div>
      <Modal open={wuOpen} onClose={() => setWuOpen(false)} title="Draft the weekly update" width="max-w-2xl"><WeeklyUpdate pick /></Modal>
    </div>
  );
}
