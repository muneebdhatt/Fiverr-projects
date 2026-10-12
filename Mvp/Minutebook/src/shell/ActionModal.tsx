'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Play, Quote } from 'lucide-react';
import { PEOPLE, firstName, person, type ActionItem, type PersonId, type Status } from '@/data';
import { useApp, useMeetings } from '@/lib/store';
import { clock, fromInputDate, toInputDate } from '@/lib/util';
import { Field, Modal, PersonAvatar, STATUS_LABEL } from './ui';

/** Edit an action: status, owner, due date. Shows the exact moment it was agreed. */
export function ActionModal({ action, onClose, onJump }: { action: ActionItem | null; onClose: () => void; onJump: (a: ActionItem) => void }) {
  const meetings = useMeetings();
  const setStatus = useApp((s) => s.setStatus);
  const patchAction = useApp((s) => s.patchAction);
  const toast = useApp((s) => s.toast);
  const m = action ? meetings.find((x) => x.id === action.meeting) : undefined;
  const line = m && action ? m.lines[action.line] : undefined;

  return (
    <Modal open={!!action} onClose={onClose} title="Action item" width="max-w-xl">
      {action && m && line && (
        <div className="space-y-5">
          <div>
            <h3 className="font-sans text-lg font-semibold text-ink-900">{action.title}</h3>
            <p className="mt-0.5 text-sm text-ink-500">From {m.title}</p>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-700">Status</p>
            <div className="inline-flex rounded-lg bg-ink-100 p-1">
              {(['todo', 'doing', 'done'] as Status[]).map((s) => (
                <button key={s} onClick={() => { setStatus(action.id, s); toast(`Moved to ${STATUS_LABEL[s]}`, 'success'); }} className={clsx('rounded-md px-3.5 py-1.5 text-sm font-semibold transition', action.status === s ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800')}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner">
              <select className="input" value={action.owner} onChange={(e) => { patchAction(action.id, { owner: e.target.value as PersonId }); toast(`Reassigned to ${firstName(e.target.value as PersonId)}`, 'success'); }}>
                {PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <input className="input" type="date" value={toInputDate(action.due)} onChange={(e) => { const d = fromInputDate(e.target.value); if (d !== null) patchAction(action.id, { due: d }); }} />
            </Field>
          </div>

          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500"><Quote size={13} /> Where it was agreed</p>
            <div className="flex gap-3">
              <PersonAvatar id={line.who} size={30} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-700">{person(line.who).name} · {clock(line.ts)}</p>
                <p className="mt-0.5 text-sm text-ink-700">&ldquo;{line.text}&rdquo;</p>
              </div>
            </div>
            <button className="btn-ghost btn-sm mt-3" onClick={() => onJump(action)}><Play size={14} /> Play from this moment</button>
          </div>
          <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Done</button></div>
        </div>
      )}
    </Modal>
  );
}

export function AddActionModal({ open, onClose, meetingId, line }: { open: boolean; onClose: () => void; meetingId: string; line: number }) {
  const addAction = useApp((s) => s.addAction);
  const toast = useApp((s) => s.toast);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState<PersonId>('elena');
  const [due, setDue] = useState(7);
  useEffect(() => { if (open) { setTitle(''); setDue(7); } }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Add an action item">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addAction({ meeting: meetingId, title: title.trim(), owner, due, status: 'todo', line });
          toast('Action added to the board', 'success');
          onClose();
        }}
      >
        <Field label="What needs to happen?"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Send the revised proposal to the client" autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner">
            <select className="input" value={owner} onChange={(e) => setOwner(e.target.value as PersonId)}>{PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </Field>
          <Field label="Due date"><input className="input" type="date" value={toInputDate(due)} onChange={(e) => { const d = fromInputDate(e.target.value); if (d !== null) setDue(d); }} /></Field>
        </div>
        <p className="text-xs text-ink-500">It will be linked to the moment you are viewing in the recording.</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!title.trim()}>Add action</button>
        </div>
      </form>
    </Modal>
  );
}
