'use client';
import { useState } from 'react';
import { CheckCircle2, ChevronRight, MessageSquareWarning, Paperclip } from 'lucide-react';
import { person, project } from '@/data/static';
import type { Approval } from '@/data/types';
import { useApp, useFiles, nameOf } from '@/lib/store';
import { ago, dueWhen } from '@/lib/util';
import { FileIcon, FileModal } from './Files';
import { Chip, Modal } from './ui';

export function ApprovalChip({ a }: { a: Approval }) {
  if (a.status === 'approved') return <Chip tone="dark"><CheckCircle2 size={12} /> Approved</Chip>;
  if (a.status === 'changes') return <Chip tone="ember"><MessageSquareWarning size={12} /> Changes requested</Chip>;
  return <Chip tone="brand">Waiting for approval</Chip>;
}

/** One row per approval. Clients review and respond; the team sees the status. */
export function ApprovalRow({ a, canRespond }: { a: Approval; canRespond: boolean }) {
  const [open, setOpen] = useState(false);
  const files = useFiles();
  const f = files.find((x) => x.id === a.fileId);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-ink-50">
        {f ? <FileIcon kind={f.kind} /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500"><Paperclip size={16} /></span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">{a.title}</span>
          <span className="block truncate text-xs text-ink-500">{project(a.projectId).name} · sent by {person(a.by).name} {ago(a.requested).toLowerCase()}</span>
        </span>
        <ApprovalChip a={a} />
        <ChevronRight size={16} className="shrink-0 text-ink-300" />
      </button>
      {open && <ApprovalModal a={a} canRespond={canRespond} onClose={() => setOpen(false)} />}
    </>
  );
}

export function ApprovalModal({ a, canRespond, onClose }: { a: Approval; canRespond: boolean; onClose: () => void }) {
  const role = useApp((s) => s.role)!;
  const respond = useApp((s) => s.respondApproval);
  const nudge = useApp((s) => s.nudge);
  const nudged = useApp((s) => s.nudged[a.id]);
  const toast = useApp((s) => s.toast);
  const files = useFiles();
  const f = files.find((x) => x.id === a.fileId);
  const [mode, setMode] = useState<'view' | 'changes'>('view');
  const [text, setText] = useState('');
  const [fileOpen, setFileOpen] = useState(false);
  const pending = a.status === 'pending';

  return (
    <Modal open onClose={onClose} title={a.title} width="max-w-xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2"><ApprovalChip a={a} /><span className="text-xs text-ink-500">{project(a.projectId).name}</span></div>
        <p className="text-sm leading-relaxed text-ink-700">{a.body}</p>
        {f && (
          <button onClick={() => setFileOpen(true)} className="flex w-full items-center gap-3 rounded-xl border border-ink-200 p-3 text-left hover:bg-ink-50">
            <FileIcon kind={f.kind} />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{f.name}</span><span className="text-xs text-ink-500">Open to review · {f.size} · v{f.version}</span></span>
          </button>
        )}
        {!pending && a.response && (
          <div className="rounded-xl bg-ink-50 p-3.5 text-sm text-ink-700">
            <p className="mb-1 text-xs font-semibold text-ink-500">{a.respondedBy} · {a.respondedDay !== undefined ? ago(a.respondedDay).toLowerCase() : ''}</p>
            {a.response}
          </div>
        )}
        {pending && canRespond && mode === 'view' && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn-primary" onClick={() => { respond(a.id, 'approved', text || 'Approved.', nameOf(role)); toast(`${a.title} approved. Thank you!`, 'success'); onClose(); }}><CheckCircle2 size={16} /> Approve</button>
            <button className="btn-ghost" onClick={() => setMode('changes')}>Request changes</button>
          </div>
        )}
        {pending && canRespond && mode === 'changes' && (
          <div className="space-y-3">
            <textarea className="input min-h-28" placeholder="What would you like us to change?" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <button className="btn-dark" disabled={!text.trim()} onClick={() => { respond(a.id, 'changes', text.trim(), nameOf(role)); toast('Changes requested. The team has been notified.', 'success'); onClose(); }}>Send to the team</button>
              <button className="btn-ghost" onClick={() => setMode('view')}>Back</button>
            </div>
          </div>
        )}
        {pending && !canRespond && (
          <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-3">
            <p className="text-sm text-ink-500">Requested {dueWhen(a.requested)}, no response yet.</p>
            <button className="btn-ghost btn-sm ml-auto" disabled={nudged !== undefined} onClick={() => { nudge(a.id); toast('Reminder sent to the client', 'success'); }}>{nudged !== undefined ? 'Reminder sent today' : 'Nudge the client'}</button>
          </div>
        )}
      </div>
      {fileOpen && <FileModal f={f ?? null} onClose={() => setFileOpen(false)} canDownload={role !== 'client' || true} />}
    </Modal>
  );
}
