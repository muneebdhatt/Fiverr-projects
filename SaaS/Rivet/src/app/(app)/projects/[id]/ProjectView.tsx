'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronLeft, Circle, CircleDot, Lock, Sparkles } from 'lucide-react';
import { ACCOUNTS, PROJECTS, client, person, project } from '@/data/static';
import type { ProjectFile, ProjectId } from '@/data/types';
import { useApp, useApprovals, useEntries, useFiles, useInvoices, useMilestones, useTasks, useUpdates } from '@/lib/store';
import { projectStats } from '@/lib/derive';
import { ago, dueShort, fullDate, hrs, money, moneyRound, monthDay } from '@/lib/util';
import { ApprovalRow } from '@/shell/Approvals';
import { FileModal, FileRow, UploadButton } from '@/shell/Files';
import { AvatarStack, Chip, EmptyState, PageSkeleton, PersonAvatar, ProgressBar, Stat, Tabs, useLoading } from '@/shell/ui';
import { WeeklyUpdate } from '@/shell/WeeklyUpdate';
import { Board } from './Board';

export default function ProjectView({ id }: { id: string }) {
  const role = useApp((s) => s.role)!;
  const loading = useLoading('project-' + id + role);
  const p = PROJECTS.find((x) => x.id === id);
  if (!p || (role === 'client' && p.clientId !== ACCOUNTS.client.clientId)) {
    return <div className="card"><EmptyState icon={<Lock size={22} />} title="Project not found" body="This project does not exist or is not shared with you." action={<Link href="/projects" className="btn-primary btn-sm">Back to projects</Link>} /></div>;
  }
  if (loading) return <PageSkeleton />;
  return role === 'client' ? <ClientProject id={p.id} /> : <TeamProject id={p.id} />;
}

function Back() {
  return <Link href="/projects" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-800"><ChevronLeft size={16} /> Projects</Link>;
}

function MilestoneIcon({ s }: { s: string }) {
  return s === 'done' ? <CheckCircle2 size={20} className="text-brand-600" /> : s === 'active' ? <CircleDot size={20} className="text-brand-600" /> : <Circle size={20} className="text-ink-300" />;
}

type TeamTab = 'board' | 'milestones' | 'files' | 'time' | 'update';

function TeamProject({ id }: { id: ProjectId }) {
  const role = useApp((s) => s.role)!;
  const me = ACCOUNTS[role === 'owner' ? 'owner' : 'member'].id;
  const p = project(id);
  const cl = client(p.clientId);
  const entries = useEntries();
  const invoices = useInvoices();
  const tasks = useTasks();
  const approvals = useApprovals().filter((a) => a.projectId === id);
  const milestones = useMilestones().filter((m) => m.projectId === id);
  const files = useFiles().filter((f) => f.projectId === id);
  const updates = useUpdates().filter((u) => u.projectId === id);
  const setMilestone = useApp((s) => s.setMilestone);
  const toast = useApp((s) => s.toast);
  const [tab, setTab] = useState<TeamTab>('board');
  const [openFile, setOpenFile] = useState<ProjectFile | null>(null);
  const s = projectStats(id, entries, invoices, tasks);
  const mine = entries.filter((e) => e.projectId === id).sort((a, b) => b.day - a.day);
  const owner = role === 'owner';

  return (
    <div>
      <Back />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-700">{cl.name}</p>
          <h1 className="text-3xl leading-tight">{p.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{p.blurb}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-500"><AvatarStack ids={p.team} size={30} /><span>Due {dueShort(p.due)}</span></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4 sm:col-span-2">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Budget</p>{s.pct >= 1 ? <Chip tone="ember">Over budget</Chip> : s.pct >= 0.9 ? <Chip tone="ember">Near budget</Chip> : <Chip tone="gray">{Math.round(s.pct * 100)}% used</Chip>}</div>
          <p className="tabnum mt-2 font-display text-3xl font-bold">{owner ? moneyRound(s.usedAmount) : hrs(s.used)} <span className="text-base font-medium text-ink-400">of {owner ? moneyRound(s.budgetAmount) : hrs(s.budget)}</span></p>
          <ProgressBar value={s.used} max={s.budget} className="mt-3 h-3" warn={s.pct >= 0.9} over={s.pct >= 1} />
          {owner && <p className="mt-2 text-xs text-ink-500">{hrs(s.used)} of {hrs(s.budget)} at ${p.rate}/h</p>}
        </div>
        <Stat label="Tasks" value={`${s.tasksDone}/${s.tasksTotal}`} sub={s.overdueTasks ? `${s.overdueTasks} past due` : 'Nothing past due'} tone={s.overdueTasks ? 'ember' : undefined} />
        {owner ? <Stat label="Unbilled" value={moneyRound(s.unbilledAmount)} sub={`${hrs(s.unbilled)} not yet invoiced`} /> : <Stat label="Hours logged" value={hrs(s.logged)} sub="Across the team, last 6 weeks" />}
      </div>

      <div className="card mt-4 flex flex-wrap items-start gap-3 border-ink-200 bg-ink-50 p-4 text-sm">
        <Lock size={16} className="mt-0.5 shrink-0 text-ink-400" />
        <div><p className="font-semibold text-ink-800">Team notes <span className="font-normal text-ink-400">(never shown to the client)</span></p><p className="mt-0.5 text-ink-600">{p.internalNote}</p></div>
      </div>

      <div className="mt-6">
        <Tabs<TeamTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'board', label: 'Board', count: tasks.filter((t) => t.projectId === id).length },
            { id: 'milestones', label: 'Milestones and approvals', count: approvals.filter((a) => a.status === 'pending').length || undefined },
            { id: 'files', label: 'Files', count: files.length },
            { id: 'time', label: 'Time', count: mine.length },
            { id: 'update', label: 'Weekly update' },
          ]}
        />
        <div className="pt-5">
          {tab === 'board' && <Board projectId={id} me={me} />}

          {tab === 'milestones' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card">
                <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Milestones</h2></div>
                <ul className="divide-y divide-ink-100">
                  {milestones.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                      <MilestoneIcon s={m.status} />
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink-900">{m.title}</p><p className="text-xs text-ink-500">{m.status === 'done' ? `Completed ${m.doneDay !== undefined ? ago(m.doneDay).toLowerCase() : ''}` : `Due ${monthDay(m.due)}`}</p></div>
                      {m.status !== 'done' ? <button className="btn-ghost btn-sm" onClick={() => { setMilestone(m.id, 'done'); toast(`${m.title} marked complete`, 'success'); }}>Mark complete</button> : <button className="text-xs font-semibold text-ink-400 hover:text-ink-700" onClick={() => setMilestone(m.id, 'active')}>Reopen</button>}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="card">
                <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Client approvals</h2></div>
                <div className="divide-y divide-ink-100">
                  {approvals.map((a) => <ApprovalRow key={a.id} a={a} canRespond={false} />)}
                  {approvals.length === 0 && <EmptyState icon={<CheckCircle2 size={22} />} title="No approvals yet" body="Deliverables you send for sign-off appear here." />}
                </div>
              </section>
            </div>
          )}

          {tab === 'files' && (
            <section className="card">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Files</h2><UploadButton projectId={id} by={me} /></div>
              <div className="divide-y divide-ink-100">{files.map((f) => <FileRow key={f.id} f={f} onOpen={setOpenFile} showInternal />)}</div>
            </section>
          )}

          {tab === 'time' && (
            <section className="card overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-ink-100 bg-ink-50"><tr><th className="th">Date</th><th className="th">Person</th><th className="th">Note</th><th className="th text-right">Hours</th>{owner && <th className="th text-right">Value</th>}<th className="th">Status</th></tr></thead>
                <tbody className="divide-y divide-ink-100">
                  {mine.slice(0, 40).map((e) => (
                    <tr key={e.id}>
                      <td className="td whitespace-nowrap">{e.day === 0 ? 'Today' : monthDay(e.day)}</td>
                      <td className="td"><span className="inline-flex items-center gap-2"><PersonAvatar id={e.user} size={22} />{person(e.user).name}</span></td>
                      <td className="td">{e.note}</td>
                      <td className="td tabnum text-right font-medium">{hrs(e.hours)}</td>
                      {owner && <td className="td tabnum text-right">{e.billable ? money(e.hours * p.rate) : '–'}</td>}
                      <td className="td">{!e.billable ? <Chip tone="gray">Not billable</Chip> : e.invoiced ? <Chip tone="dark">Invoiced</Chip> : <Chip tone="brand">Ready to bill</Chip>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === 'update' && (
            <div className="grid gap-6 lg:grid-cols-5">
              <section className="card p-5 lg:col-span-3">
                <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-semibold"><Sparkles size={16} className="text-brand-600" /> Draft the weekly update</h2>
                <WeeklyUpdate projectId={id} />
              </section>
              <section className="card lg:col-span-2">
                <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Posted to the client</h2></div>
                <ul className="divide-y divide-ink-100">
                  {updates.map((u) => (
                    <li key={u.id} className="px-4 py-3.5"><div className="flex justify-between gap-2"><p className="text-sm font-semibold">{u.title}</p><span className="text-xs text-ink-400">{ago(u.day)}</span></div><p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-ink-600">{u.body}</p></li>
                  ))}
                  {updates.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-500">Nothing posted yet.</li>}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
      <FileModal f={openFile} onClose={() => setOpenFile(null)} />
    </div>
  );
}

type ClientTab = 'overview' | 'approvals' | 'files' | 'updates';

function ClientProject({ id }: { id: ProjectId }) {
  const p = project(id);
  const tasks = useTasks().filter((t) => t.projectId === id && !t.internal);
  const milestones = useMilestones().filter((m) => m.projectId === id);
  const approvals = useApprovals().filter((a) => a.projectId === id);
  const files = useFiles().filter((f) => f.projectId === id && f.clientVisible);
  const updates = useUpdates().filter((u) => u.projectId === id);
  const [tab, setTab] = useState<ClientTab>('overview');
  const [openFile, setOpenFile] = useState<ProjectFile | null>(null);
  const pending = approvals.filter((a) => a.status === 'pending');
  const done = tasks.filter((t) => t.status === 'done').length;
  const now = tasks.filter((t) => t.status === 'doing' || t.status === 'review');
  const recent = tasks.filter((t) => t.status === 'done').sort((a, b) => (b.doneDay ?? 0) - (a.doneDay ?? 0)).slice(0, 5);

  return (
    <div>
      <Back />
      <div className="mb-6"><h1 className="text-3xl leading-tight">{p.name}</h1><p className="mt-1 max-w-2xl text-sm text-ink-500">{p.blurb}</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Progress</p>
          <p className="tabnum mt-2 font-display text-3xl font-bold">{Math.round((done / Math.max(1, tasks.length)) * 100)}% <span className="text-base font-medium text-ink-400">{done} of {tasks.length} tasks done</span></p>
          <ProgressBar value={done} max={Math.max(1, tasks.length)} className="mt-3 h-3" />
        </div>
        <Stat label="Target finish" value={monthDay(p.due)} sub={fullDate(p.due)} />
      </div>
      <div className="mt-6">
        <Tabs<ClientTab> value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'approvals', label: 'Approvals', count: pending.length || undefined }, { id: 'files', label: 'Files', count: files.length }, { id: 'updates', label: 'Updates', count: updates.length }]} />
        <div className="pt-5">
          {tab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card">
                <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Milestones</h2></div>
                <ul className="divide-y divide-ink-100">
                  {milestones.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3.5"><MilestoneIcon s={m.status} /><div className="flex-1"><p className="text-sm font-semibold text-ink-900">{m.title}</p><p className="text-xs text-ink-500">{m.status === 'done' ? 'Completed' : `Due ${monthDay(m.due)}`}</p></div>{m.status === 'active' && <Chip tone="brand">In progress</Chip>}</li>
                  ))}
                </ul>
              </section>
              <section className="card">
                <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">What we are working on</h2></div>
                <ul className="divide-y divide-ink-100">
                  {now.map((t) => <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3"><span className="text-sm text-ink-800">{t.title}</span><Chip tone={t.status === 'review' ? 'brand' : 'outline'}>{t.status === 'review' ? 'In review' : 'In progress'}</Chip></li>)}
                  {recent.map((t) => <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3"><span className="text-sm text-ink-500 line-through decoration-ink-300">{t.title}</span><Chip tone="gray"><CheckCircle2 size={12} /> Done</Chip></li>)}
                </ul>
              </section>
            </div>
          )}
          {tab === 'approvals' && (
            <section className="card divide-y divide-ink-100">
              {approvals.map((a) => <ApprovalRow key={a.id} a={a} canRespond />)}
              {approvals.length === 0 && <EmptyState icon={<CheckCircle2 size={22} />} title="Nothing to approve" body="When we need your sign-off on something, it shows up here." />}
            </section>
          )}
          {tab === 'files' && (
            <section className="card">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Shared files</h2><UploadButton projectId={id} by="client" byName={ACCOUNTS.client.name} /></div>
              <div className="divide-y divide-ink-100">{files.map((f) => <FileRow key={f.id} f={f} onOpen={setOpenFile} />)}</div>
            </section>
          )}
          {tab === 'updates' && (
            <section className="space-y-4">
              {updates.map((u) => (
                <article key={u.id} className="card p-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-display text-lg font-bold">{u.title}</h3><span className="text-xs text-ink-400">{ago(u.day)} · {person(u.by).name}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{u.body}</p></article>
              ))}
              {updates.length === 0 && <div className="card"><EmptyState icon={<Sparkles size={22} />} title="No updates yet" body="We post a short update every week." /></div>}
            </section>
          )}
        </div>
      </div>
      <FileModal f={openFile} onClose={() => setOpenFile(null)} />
    </div>
  );
}
