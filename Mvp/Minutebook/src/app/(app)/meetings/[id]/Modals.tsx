'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Mail, Play, Plus, TextSelect, X } from 'lucide-react';
import { ACCOUNTS, PEOPLE, firstName, person, type ActionItem, type Meeting, type PersonId } from '@/data';
import { useApp } from '@/lib/store';
import { clock, dueShort, meetingWhen, minsLabel } from '@/lib/util';
import { Logo, Modal, PersonAvatar } from '@/shell/ui';

export function SourceModal({ meeting, line, onClose, onPlay, onShow }: { meeting: Meeting; line: number | null; onClose: () => void; onPlay: (l: number) => void; onShow: (l: number) => void }) {
  return (
    <Modal open={line !== null} onClose={onClose} title={`Source · ${meeting.title}`} width="max-w-xl">
      {line !== null && (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">Quoted at {clock(meeting.lines[line].ts)} in the recording.</p>
          <div className="space-y-2">
            {[line - 1, line, line + 1].filter((i) => i >= 0 && i < meeting.lines.length).map((i) => {
              const l = meeting.lines[i];
              const on = i === line;
              return (
                <div key={i} className={clsx('flex gap-3 rounded-xl p-3', on ? 'border border-brand-300 bg-brand-50' : 'opacity-60')}>
                  <PersonAvatar id={l.who} size={30} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-700">{person(l.who).name} · {clock(l.ts)}</p>
                    <p className="mt-0.5 text-sm text-ink-800">{on ? <mark>{l.text}</mark> : l.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn-ghost" onClick={() => onShow(line)}><TextSelect size={16} /> Show in transcript</button>
            <button className="btn-primary" onClick={() => onPlay(line)}><Play size={16} /> Play from here</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ShareModal({ meeting, actions, open, onClose }: { meeting: Meeting; actions: ActionItem[]; open: boolean; onClose: () => void }) {
  const markShared = useApp((s) => s.markShared);
  const toast = useApp((s) => s.toast);
  const role = useApp((s) => s.role) ?? 'member';
  const [to, setTo] = useState<PersonId[]>(meeting.who);
  const [adding, setAdding] = useState(false);
  const [withTranscript, setWithTranscript] = useState(true);
  useEffect(() => { if (open) { setTo(meeting.who); setAdding(false); } }, [open, meeting.who]);
  const others = PEOPLE.filter((p) => !to.includes(p.id));
  const mine = actions.filter((a) => a.meeting === meeting.id);
  const sender = person(ACCOUNTS[role].id);

  return (
    <Modal open={open} onClose={onClose} title="Share notes by email" width="max-w-2xl">
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">To</p>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-300 p-2">
            {to.map((id) => (
              <span key={id} className="flex items-center gap-1.5 rounded-full bg-ink-100 py-0.5 pl-0.5 pr-2 text-sm font-medium text-ink-800">
                <PersonAvatar id={id} size={22} /> {person(id).email}
                <button onClick={() => setTo((t) => t.filter((x) => x !== id))} className="text-ink-400 hover:text-ink-800" aria-label={`Remove ${person(id).name}`}><X size={14} /></button>
              </span>
            ))}
            {others.length > 0 && (adding ? (
              <select autoFocus className="rounded-md border border-ink-300 px-2 py-1 text-sm" onChange={(e) => { if (e.target.value) { setTo((t) => [...t, e.target.value as PersonId]); setAdding(false); } }} onBlur={() => setAdding(false)} defaultValue="">
                <option value="" disabled>Add teammate…</option>
                {others.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50"><Plus size={14} /> Add</button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" className="h-4 w-4 accent-[#e24614]" checked={withTranscript} onChange={(e) => setWithTranscript(e.target.checked)} /> Include a link to the full transcript
        </label>

        <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
          <div className="border-b border-ink-200 bg-white px-4 py-3 text-xs text-ink-500">
            <p><span className="font-semibold text-ink-700">From:</span> {sender.name} via Minutebook</p>
            <p><span className="font-semibold text-ink-700">Subject:</span> Notes: {meeting.title}</p>
          </div>
          <div className="mx-auto max-w-lg bg-white p-5 text-sm text-ink-800">
            <Logo size={24} />
            <h3 className="mt-4 font-display text-2xl font-semibold">{meeting.title}</h3>
            <p className="text-xs text-ink-500">{meetingWhen(meeting.day, meeting.time)} · {minsLabel(meeting.mins)} · {meeting.who.map(firstName).join(', ')}</p>
            <p className="mt-3 leading-relaxed text-ink-700">{meeting.summary}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-500">Decisions</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink-700">{meeting.decisions.map((d) => <li key={d.text}>{d.text}</li>)}</ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-500">Action items</p>
            <table className="mt-1.5 w-full text-left text-[13px]">
              <tbody>
                {mine.map((a) => (
                  <tr key={a.id} className="border-t border-ink-100">
                    <td className="py-1.5 pr-2 text-ink-800">{a.title}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap font-medium">{firstName(a.owner)}</td>
                    <td className="py-1.5 whitespace-nowrap text-ink-500">{a.status === 'done' ? 'Done' : dueShort(a.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={onClose} className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Open the full notes</button>
            {withTranscript && <p className="mt-2 text-xs text-ink-400">The full transcript is one click away in the notes.</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={to.length === 0}
            onClick={() => { markShared(meeting.id, to.length); toast(`Notes sent to ${to.length} ${to.length === 1 ? 'person' : 'people'}`, 'success'); onClose(); }}
          >
            <Mail size={16} /> Send to {to.length} {to.length === 1 ? 'person' : 'people'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
