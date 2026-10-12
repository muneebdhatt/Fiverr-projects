'use client';
import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { ACCOUNTS, PEOPLE, PROJECTS, client, person, project } from '@/data/static';
import type { PersonId, ProjectId } from '@/data/types';
import { useApp, useEntries, useTasks, type Role } from '@/lib/store';
import { csvDownload, dateFromOffset, fromInputDate, hrs, money, monthDay, r2, toInputDate, weekStart, weekdayShort } from '@/lib/util';
import { Chip, EmptyState, Field, Modal, PageHead, PageSkeleton, PersonAvatar, useLoading } from '@/shell/ui';
import { TimerCard } from '@/shell/Timer';
import { Download } from 'lucide-react';

type EntryDraft = { id?: string; projectId: ProjectId; taskId: string; day: string; hours: string; note: string; billable: boolean };

export default function TimePage() {
  const role = useApp((s) => s.role)! as Exclude<Role, 'client'>;
  const loading = useLoading('time-' + role);
  const me = ACCOUNTS[role].id as PersonId;
  const entries = useEntries();
  const tasks = useTasks();
  const addEntry = useApp((s) => s.addEntry);
  const patchEntry = useApp((s) => s.patchEntry);
  const removeEntry = useApp((s) => s.removeEntry);
  const submitted = useApp((s) => s.submittedWeeks);
  const submitWeek = useApp((s) => s.submitWeek);
  const toast = useApp((s) => s.toast);
  const owner = role === 'owner';
  const [who, setWho] = useState<string>(me);
  const [ws, setWs] = useState(weekStart(0));
  const [edit, setEdit] = useState<EntryDraft | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => ws + i);
  const list = useMemo(() => entries.filter((e) => e.day >= ws && e.day < ws + 7 && (who === 'all' || e.user === who)), [entries, ws, who]);
  const projIds = PROJECTS.map((p) => p.id).filter((id) => list.some((e) => e.projectId === id));
  const total = r2(list.reduce((n, e) => n + e.hours, 0));
  const billable = r2(list.filter((e) => e.billable).reduce((n, e) => n + e.hours, 0));
  const value = list.filter((e) => e.billable).reduce((n, e) => n + e.hours * project(e.projectId).rate, 0);
  const key = `${who}:${ws}`;
  const isSubmitted = submitted[key];
  const mine = who === me;
  const editable = who === me || owner;
  const myProjects = (owner && who !== 'all' && who !== me ? PROJECTS.filter((p) => p.team.includes(who as PersonId)) : PROJECTS.filter((p) => p.team.includes(me) || owner));

  const openNew = () => setEdit({ projectId: myProjects[0].id, taskId: '', day: toInputDate(Math.min(0, ws + 6) < ws ? ws : Math.min(0, ws + 4)), hours: '1', note: '', billable: true });

  if (loading) return <PageSkeleton />;
  return (
    <div>
      <PageHead
        title="Time"
        sub={who === 'all' ? 'Everyone on the team' : `${person(who as PersonId).name}${mine ? ' (you)' : ''}`}
        actions={<>
          {owner && <button className="btn-ghost" onClick={() => { csvDownload(`timesheet-${toInputDate(ws)}.csv`, [['Date', 'Person', 'Project', 'Note', 'Hours', 'Billable'], ...list.map((e) => [toInputDate(e.day), person(e.user).name, project(e.projectId).name, e.note, e.hours, e.billable ? 'Yes' : 'No'])]); toast('Timesheet exported', 'success'); }}><Download size={16} /> Export</button>}
          <button className="btn-primary" onClick={openNew}><Plus size={16} /> Add time</button>
        </>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card h-fit p-5">
          <h2 className="mb-4 font-sans text-base font-semibold">Timer</h2>
          <TimerCard user={me} />
        </section>

        <section className="card lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-4 py-3.5">
            <div className="flex items-center gap-1">
              <button className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Previous week" onClick={() => setWs(ws - 7)}><ChevronLeft size={18} /></button>
              <p className="min-w-40 text-center text-sm font-semibold">{ws === weekStart(0) ? 'This week' : `${monthDay(ws)} to ${monthDay(ws + 6)}`}</p>
              <button className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30" aria-label="Next week" disabled={ws >= weekStart(0)} onClick={() => setWs(ws + 7)}><ChevronRight size={18} /></button>
            </div>
            {owner && (
              <select className="input ml-auto w-auto" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Person">
                <option value="all">Everyone</option>
                {PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name}{p.id === me ? ' (you)' : ''}</option>)}
              </select>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-ink-50"><tr><th className="th">Project</th>{days.map((d) => <th key={d} className={clsx('th text-center', d === 0 && 'text-brand-700')}>{weekdayShort(d)}<span className="block text-[10px] font-medium normal-case tracking-normal">{dateFromOffset(d).getDate()}</span></th>)}<th className="th text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {projIds.map((id) => (
                  <tr key={id}>
                    <td className="td"><span className="block font-medium text-ink-900">{project(id).name}</span><span className="text-xs text-ink-500">{client(project(id).clientId).name}</span></td>
                    {days.map((d) => { const h = list.filter((e) => e.projectId === id && e.day === d).reduce((n, e) => n + e.hours, 0); return <td key={d} className="td tabnum text-center">{h ? r2(h) : <span className="text-ink-300">·</span>}</td>; })}
                    <td className="td tabnum text-right font-semibold">{hrs(list.filter((e) => e.projectId === id).reduce((n, e) => n + e.hours, 0))}</td>
                  </tr>
                ))}
                {projIds.length === 0 && <tr><td colSpan={9}><EmptyState icon={<Lock size={22} />} title="No time logged this week" body="Start the timer or add time by hand." action={<button className="btn-primary btn-sm" onClick={openNew}>Add time</button>} /></td></tr>}
              </tbody>
              {projIds.length > 0 && (
                <tfoot className="border-t border-ink-200 bg-ink-50"><tr><td className="td font-semibold text-ink-900">Total</td>{days.map((d) => <td key={d} className="td tabnum text-center font-semibold">{r2(list.filter((e) => e.day === d).reduce((n, e) => n + e.hours, 0)) || ''}</td>)}<td className="td tabnum text-right font-bold text-ink-900">{hrs(total)}</td></tr></tfoot>
              )}
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 px-4 py-3 text-sm text-ink-600">
            <span>Billable <b className="tabnum text-ink-900">{hrs(billable)}</b></span>
            <span>Not billable <b className="tabnum text-ink-900">{hrs(r2(total - billable))}</b></span>
            {owner && <span>Value <b className="tabnum text-ink-900">{money(value)}</b></span>}
            {who !== 'all' && editable && (
              <span className="ml-auto">
                {isSubmitted ? <Chip tone="dark"><CheckCircle2 size={12} /> Submitted</Chip> : <button className="btn-dark btn-sm" disabled={total === 0} onClick={() => { submitWeek(key); toast('Timesheet submitted for approval', 'success'); }}>Submit timesheet</button>}
              </span>
            )}
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-x-auto">
        <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Entries</h2></div>
        <table className="w-full min-w-[680px]">
          <thead className="bg-ink-50"><tr><th className="th">Date</th>{who === 'all' && <th className="th">Person</th>}<th className="th">Project</th><th className="th">Note</th><th className="th text-right">Hours</th>{owner && <th className="th text-right">Value</th>}<th className="th">Status</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {list.slice().sort((a, b) => b.day - a.day || a.user.localeCompare(b.user)).map((e) => (
              <tr key={e.id}>
                <td className="td whitespace-nowrap">{e.day === 0 ? 'Today' : `${weekdayShort(e.day)}, ${monthDay(e.day)}`}</td>
                {who === 'all' && <td className="td"><span className="inline-flex items-center gap-2"><PersonAvatar id={e.user} size={22} />{person(e.user).name.split(' ')[0]}</span></td>}
                <td className="td">{project(e.projectId).name}</td>
                <td className="td">{e.note}</td>
                <td className="td tabnum text-right font-medium">{hrs(e.hours)}</td>
                {owner && <td className="td tabnum text-right">{e.billable ? money(e.hours * project(e.projectId).rate) : '–'}</td>}
                <td className="td">{!e.billable ? <Chip tone="gray">Not billable</Chip> : e.invoiced ? <Chip tone="dark"><Lock size={11} /> Invoiced</Chip> : <Chip tone="brand">Ready to bill</Chip>}</td>
                <td className="td text-right">
                  {!e.invoiced && (e.user === me || owner) && (
                    <span className="inline-flex gap-1">
                      <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Edit entry" onClick={() => setEdit({ id: e.id, projectId: e.projectId, taskId: e.taskId ?? '', day: toInputDate(e.day), hours: String(e.hours), note: e.note, billable: e.billable })}><Pencil size={14} /></button>
                      <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Delete entry" onClick={() => { removeEntry(e.id); toast('Entry deleted'); }}><Trash2 size={14} /></button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8} className="td py-8 text-center text-ink-500">No entries for this week.</td></tr>}
          </tbody>
        </table>
      </section>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit time entry' : 'Add time'}>
        {edit && (
          <form className="space-y-4" onSubmit={(ev) => {
            ev.preventDefault();
            const hours = Math.round(parseFloat(edit.hours) * 4) / 4;
            const day = fromInputDate(edit.day);
            if (!hours || hours <= 0 || hours > 24 || day === null || day > 0) { toast('Check the date and hours', 'warn'); return; }
            const body = { projectId: edit.projectId, taskId: edit.taskId || undefined, day, hours, note: edit.note.trim() || 'Time tracked', billable: edit.billable };
            if (edit.id) { patchEntry(edit.id, body); toast('Entry updated', 'success'); } else { addEntry({ user: who === 'all' ? me : (who as PersonId), ...body }); toast(`${hrs(hours)} added`, 'success'); }
            setEdit(null);
          }}>
            <Field label="Project">
              <select className="input" value={edit.projectId} onChange={(e) => setEdit({ ...edit, projectId: e.target.value as ProjectId, taskId: '' })}>
                {myProjects.map((p) => <option key={p.id} value={p.id}>{p.name} · {client(p.clientId).name}</option>)}
              </select>
            </Field>
            <Field label="Task (optional)">
              <select className="input" value={edit.taskId} onChange={(e) => setEdit({ ...edit, taskId: e.target.value })}>
                <option value="">No specific task</option>
                {tasks.filter((t) => t.projectId === edit.projectId).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"><input className="input" type="date" max={toInputDate(0)} value={edit.day} onChange={(e) => setEdit({ ...edit, day: e.target.value })} /></Field>
              <Field label="Hours" hint="Rounded to the nearest quarter hour"><input className="input" inputMode="decimal" value={edit.hours} onChange={(e) => setEdit({ ...edit, hours: e.target.value })} /></Field>
            </div>
            <Field label="Note"><input className="input" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="What did you work on?" /></Field>
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" className="h-4 w-4 accent-[#7538e2]" checked={edit.billable} onChange={(e) => setEdit({ ...edit, billable: e.target.checked })} /> Billable</label>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary">{edit.id ? 'Save changes' : 'Add time'}</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
