'use client';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FileSearch, FileText, Loader2, MoreVertical, Pencil, Search, Trash2, UploadCloud } from 'lucide-react';
import { api, CATEGORIES, Doc } from '@/lib/api';
import { ago } from '@/lib/time';
import { notify } from '@/lib/notifications';
import { usePrefs } from '@/lib/prefs';
import { Modal } from '@/shell/Modal';
import { useSession } from '@/shell/session';
import { toast } from '@/shell/Toast';
import { useViewer } from '@/shell/viewer';
import { EmptyState, PageHeader, Skeleton, StatusChip } from '@/shell/ui';

type SortKey = 'title' | 'category' | 'updated_mins_ago' | 'pages';

function RowMenu({ doc, onRename, onDownload, onDelete }: { doc: Doc; onRename: () => void; onDownload: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', h);
    window.addEventListener('wheel', close, { passive: true });
    window.addEventListener('touchmove', close, { passive: true });
    window.addEventListener('resize', close);
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('wheel', close); window.removeEventListener('touchmove', close); window.removeEventListener('resize', close); };
  }, [open]);
  const item = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50';
  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button aria-label={`Actions for ${doc.title}`} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const below = window.innerHeight - r.bottom > 160; setPos({ top: below ? r.bottom + 4 : r.top - 4 - 124, left: Math.max(8, r.right - 176) }); setOpen(!open); }} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><MoreVertical className="h-4 w-4" /></button>
      {open && (
        <div className="card pop fixed z-50 w-44 p-1" style={{ top: pos.top, left: pos.left }}>
          <button className={item} onClick={() => { setOpen(false); onRename(); }}><Pencil className="h-4 w-4 text-ink-400" /> Rename</button>
          <button className={item} disabled={doc.status !== 'Ready'} onClick={() => { setOpen(false); onDownload(); }}><Download className="h-4 w-4 text-ink-400" /> Download</button>
          <button className={clsx(item, 'text-red-600')} onClick={() => { setOpen(false); onDelete(); }}><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const me = useSession((s) => s.me);
  const openDoc = useViewer((s) => s.open);
  const uploadAlerts = usePrefs((s) => s.uploadAlerts);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [uploadCat, setUploadCat] = useState('Guide');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'updated_mins_ago', dir: 1 });
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCat, setEditCat] = useState('Guide');
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => api.docs().then(setDocs).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const processing = docs?.some((d) => d.status === 'Processing');
  useEffect(() => {
    if (!processing) return;
    const prev = docs?.filter((d) => d.status === 'Processing').map((d) => d.id) || [];
    const t = setInterval(async () => {
      const next = await api.docs();
      setDocs(next);
      prev.forEach((id) => {
        const d = next.find((x) => x.id === id && x.status === 'Ready');
        if (d) {
          if (uploadAlerts) toast(`${d.title} is ready to search`);
          notify(me?.id, `${d.title} is ready to search`, '/documents');
        }
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processing]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await api.upload(f.name, Math.max(1, Math.round(f.size / 1024)), uploadCat);
      toast(files.length === 1 ? 'Upload received. Processing…' : `${files.length} uploads received. Processing…`);
      await load();
    } catch {
      toast('Upload failed. Please try again.', 'err');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const openEdit = (d: Doc) => { setEditing(d); setEditTitle(d.title); setEditCat(CATEGORIES.includes(d.category) ? d.category : 'Guide'); };
  const saveEdit = async () => {
    if (!editing) return;
    try {
      await api.editDoc(editing.id, { title: editTitle, category: editCat });
      toast('Document updated');
      setEditing(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update the document', 'err');
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteDoc(deleting.id);
      toast(`${deleting.title} was deleted`);
      setDeleting(null);
      load();
    } catch {
      toast('Could not delete the document', 'err');
    }
  };
  const download = async (d: Doc) => {
    try {
      const full = await api.doc(d.id);
      const text = `${full.title}\n${full.category} · ${full.owner}\n\n${full.body.join('\n\n')}\n`;
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${full.title.replace(/[^\w\- ]+/g, '').trim() || 'document'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Download started');
    } catch {
      toast('Could not download the document', 'err');
    }
  };

  const cats = useMemo(() => ['All', ...Array.from(new Set((docs || []).map((d) => d.category)))], [docs]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (docs || []).filter((d) => (cat === 'All' || d.category === cat) && (!needle || d.title.toLowerCase().includes(needle) || d.owner.toLowerCase().includes(needle)));
    return [...list].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [docs, q, cat, sort]);

  const th = (label: string, key: SortKey, cls = '') => (
    <th className={clsx('th', cls)}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink-800">
        {label}{sort.key === key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div>
      <PageHeader title="Documents" subtitle="Everything your team has added. Answers cite these files." />

      <div className="mb-2 flex items-center justify-end gap-2 text-sm text-ink-600">
        <label htmlFor="upload-category">Add new files to</label>
        <select id="upload-category" className="input w-40" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
          {CATEGORIES.filter((c) => c !== 'Uploaded').map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div
        data-tour="upload"
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={clsx('mb-5 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition', drag ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50/40')}
      >
        <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        {uploading ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-brand-600" /> : <UploadCloud className="mb-2 h-6 w-6 text-brand-600" />}
        <div className="text-sm font-medium">Drop files here or <span className="text-brand-700">browse</span></div>
        <div className="mt-0.5 text-xs text-ink-500">PDF, Word or text files up to 25 MB</div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search documents or owners" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-ink-100 bg-ink-50/60">
              <tr>
                {th('Name', 'title')}
                {th('Category', 'category', 'hidden sm:table-cell')}
                {th('Pages', 'pages', 'hidden md:table-cell')}
                {th('Updated', 'updated_mins_ago')}
                <th className="th">Status</th>
                <th className="th w-10"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!docs && [0, 1, 2, 3, 4, 5].map((i) => (
                <tr key={i}><td className="td" colSpan={6}><Skeleton className="h-6 w-full" /></td></tr>
              ))}
              {docs && rows.map((d) => (
                <tr key={d.id} onClick={() => d.status === 'Ready' && openDoc({ id: d.id })} className={clsx('transition', d.status === 'Ready' ? 'cursor-pointer hover:bg-ink-50' : 'opacity-80')}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', d.kind === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600')}><FileText className="h-[18px] w-[18px]" /></span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink-900">{d.title}</div>
                        <div className="text-xs text-ink-500">{d.kind} · {d.size_kb >= 1024 ? `${(d.size_kb / 1024).toFixed(1)} MB` : `${d.size_kb} KB`} · {d.owner}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td hidden sm:table-cell">{d.category}</td>
                  <td className="td hidden md:table-cell">{d.pages}</td>
                  <td className="td whitespace-nowrap">{ago(d.updated_mins_ago)}</td>
                  <td className="td"><span className="inline-flex items-center gap-1.5">{d.status === 'Processing' && <Loader2 className="h-3 w-3 animate-spin text-amber-600" />}<StatusChip status={d.status} /></span></td>
                  <td className="td pr-3"><RowMenu doc={d} onRename={() => openEdit(d)} onDownload={() => download(d)} onDelete={() => setDeleting(d)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {docs && rows.length === 0 && <EmptyState icon={<FileSearch className="h-5 w-5" />} title="No documents match" text="Try a different search or clear the category filter." />}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Rename document">
        <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-3">
          <label className="block text-sm font-medium">Name
            <input className="input mt-1.5" autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={120} />
          </label>
          <label className="block text-sm font-medium">Category
            <select className="input mt-1.5" value={editCat} onChange={(e) => setEditCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" disabled={editTitle.trim().length < 2}>Save</button>
          </div>
        </form>
      </Modal>
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete this document?">
        <p className="text-sm text-ink-600">&ldquo;{deleting?.title}&rdquo; will be removed from the library. Answers that rely on it will no longer be available.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </Modal>
    </div>
  );
}
