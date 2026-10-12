'use client';
import { useRef } from 'react';
import { Download, FileArchive, FileSpreadsheet, FileText, Film, PenTool, Upload } from 'lucide-react';
import clsx from 'clsx';
import { person, project } from '@/data/static';
import type { FileKind, ProjectFile, ProjectId } from '@/data/types';
import { useApp } from '@/lib/store';
import { ago } from '@/lib/util';
import { Modal } from './ui';

export const KIND_ICON = { pdf: FileText, design: PenTool, doc: FileText, sheet: FileSpreadsheet, zip: FileArchive, video: Film };
const KIND_LABEL: Record<FileKind, string> = { pdf: 'PDF', design: 'Design file', doc: 'Document', sheet: 'Spreadsheet', zip: 'Archive', video: 'Video' };

export function FileIcon({ kind, size = 36 }: { kind: FileKind; size?: number }) {
  const Icon = KIND_ICON[kind];
  return (
    <span className={clsx('flex shrink-0 items-center justify-center rounded-lg', kind === 'design' ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600')} style={{ width: size, height: size }}>
      <Icon size={size * 0.5} />
    </span>
  );
}

export const uploaderName = (f: ProjectFile) => (f.by === 'client' ? f.byName ?? 'Client' : person(f.by).name);

export function FileRow({ f, onOpen, showInternal }: { f: ProjectFile; onOpen: (f: ProjectFile) => void; showInternal?: boolean }) {
  return (
    <button onClick={() => onOpen(f)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-50">
      <FileIcon kind={f.kind} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink-900">{f.name}</span>
        <span className="block truncate text-xs text-ink-500">{KIND_LABEL[f.kind]} · {f.size} · v{f.version} · {uploaderName(f)} · {ago(f.day)}</span>
      </span>
      {showInternal && !f.clientVisible && <span className="chip bg-ink-100 text-ink-600">Team only</span>}
    </button>
  );
}

/** A styled stand-in for the real document, drawn in the app. */
function Preview({ f }: { f: ProjectFile }) {
  const bar = (w: string, h = 'h-2.5', c = 'bg-ink-200') => <div className={clsx('rounded-full', h, c)} style={{ width: w }} />;
  if (f.kind === 'design')
    return (
      <div className="grid aspect-[16/10] grid-cols-6 grid-rows-6 gap-2 rounded-lg border border-ink-200 bg-ink-100 p-3">
        <div className="col-span-6 row-span-1 rounded-md bg-white" />
        <div className="col-span-4 row-span-3 rounded-md bg-brand-600" />
        <div className="col-span-2 row-span-3 rounded-md bg-ink-900" />
        <div className="col-span-2 row-span-2 rounded-md bg-white" />
        <div className="col-span-2 row-span-2 rounded-md bg-brand-200" />
        <div className="col-span-2 row-span-2 rounded-md bg-white" />
      </div>
    );
  if (f.kind === 'sheet')
    return (
      <div className="overflow-hidden rounded-lg border border-ink-200 text-xs">
        {Array.from({ length: 7 }, (_, r) => (
          <div key={r} className={clsx('grid grid-cols-4 border-b border-ink-100', r === 0 ? 'bg-ink-100 font-semibold' : 'bg-white')}>
            {Array.from({ length: 4 }, (_, c) => <div key={c} className="truncate border-r border-ink-100 px-3 py-2 text-ink-600">{r === 0 ? ['Item', 'Owner', 'Status', 'Date'][c] : ['Homepage', 'Case study', 'Team page', 'Contact'][(r + c) % 4]}</div>)}
          </div>
        ))}
      </div>
    );
  if (f.kind === 'video')
    return (
      <div className="overflow-hidden rounded-lg bg-ink-900">
        <div className="flex aspect-video items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink-900"><span className="ml-1 h-0 w-0 border-y-[9px] border-l-[15px] border-y-transparent border-l-ink-900" /></span></div>
        <div className="h-1.5 bg-ink-700"><div className="h-full w-1/3 bg-brand-400" /></div>
      </div>
    );
  if (f.kind === 'zip')
    return (
      <div className="divide-y divide-ink-100 rounded-lg border border-ink-200 bg-white">
        {['logo-primary.svg', 'logo-mono.svg', 'logo-reversed.svg', 'favicon.png', 'readme.txt'].map((n) => <div key={n} className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700"><FileText size={14} className="text-ink-400" /> {n}</div>)}
      </div>
    );
  return (
    <div className="mx-auto aspect-[4/5] max-w-sm space-y-3 rounded-lg border border-ink-200 bg-white p-6 shadow-card">
      {bar('45%', 'h-4', 'bg-ink-800')}
      {bar('30%', 'h-2.5', 'bg-brand-300')}
      <div className="space-y-2 pt-3">{[100, 96, 100, 88, 100, 70].map((w, i) => <div key={i}>{bar(`${w}%`)}</div>)}</div>
      <div className="grid grid-cols-2 gap-3 pt-2"><div className="aspect-video rounded-md bg-brand-100" /><div className="aspect-video rounded-md bg-ink-100" /></div>
      <div className="space-y-2 pt-2">{[100, 92, 60].map((w, i) => <div key={i}>{bar(`${w}%`)}</div>)}</div>
    </div>
  );
}

export function FileModal({ f, onClose, canDownload = true }: { f: ProjectFile | null; onClose: () => void; canDownload?: boolean }) {
  const toast = useApp((s) => s.toast);
  if (!f) return null;
  return (
    <Modal open onClose={onClose} title={f.name} width="max-w-2xl">
      <Preview f={f} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">{project(f.projectId).name} · version {f.version} · added by {uploaderName(f)} {ago(f.day).toLowerCase()}</p>
        {canDownload && <button className="btn-ghost btn-sm" onClick={() => toast(`Downloading ${f.name}`, 'success')}><Download size={14} /> Download</button>}
      </div>
    </Modal>
  );
}

export function UploadButton({ projectId, by, byName, clientVisible = true, label = 'Upload file' }: { projectId: ProjectId; by: ProjectFile['by']; byName?: string; clientVisible?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const addFile = useApp((s) => s.addFile);
  const log = useApp((s) => s.log);
  const toast = useApp((s) => s.toast);
  const KIND = (n: string): FileKind => (/\.(png|jpe?g|fig|sketch|psd)$/i.test(n) ? 'design' : /\.(pdf)$/i.test(n) ? 'pdf' : /\.(xls|xlsx|csv)$/i.test(n) ? 'sheet' : /\.(zip)$/i.test(n) ? 'zip' : /\.(mp4|mov)$/i.test(n) ? 'video' : 'doc');
  return (
    <>
      <input ref={ref} type="file" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const size = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
        addFile({ projectId, name: file.name, kind: KIND(file.name), size, by, byName, day: 0, version: 1, clientVisible });
        log({ kind: 'file', text: `${by === 'client' ? byName : person(by).name} uploaded ${file.name}`, projectId });
        toast(`${file.name} uploaded`, 'success');
        e.target.value = '';
      }} />
      <button className="btn-ghost btn-sm" onClick={() => ref.current?.click()}><Upload size={14} /> {label}</button>
    </>
  );
}
