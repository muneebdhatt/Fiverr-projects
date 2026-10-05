'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, FileSearch, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ago } from '@/lib/time';
import { buildDoc } from '@/lib/newDoc';
import { currentUserId, useApp, useDocs, useOrg } from '@/lib/store';
import { useUi } from '@/lib/ui';
import { Avatar, Chip, EmptyState, Field, Modal, PageHeader, Skeleton, useLoading } from '@/shell/ui';

type Sort = 'updated' | 'title' | 'words';

export default function DocumentsPage() {
  const { org, users: orgUsers } = useOrg();
  const loading = useLoading(org.id);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('All');
  const [sort, setSort] = useState<Sort>('updated');

  const router = useRouter();
  const { persona, addDoc, log, toast } = useApp();
  const docs = useDocs(org.id);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Notes');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const newDoc = useUi((s) => s.newDoc);
  useEffect(() => { if (newDoc) { setOpen(true); useUi.setState({ newDoc: false }); } }, [newDoc]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') { setOpen(true); window.history.replaceState(null, '', '/documents'); }
  }, []);
  const authorOf = () => {
    const id = currentUserId(persona);
    return orgUsers.some((u) => u.id === id) ? id : orgUsers[0].id;
  };
  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setErr('Give the document a title.');
    const doc = buildDoc(org.id, authorOf(), title.trim(), type, text);
    addDoc(doc);
    log(org.id, currentUserId(persona), 'Created document', doc.title);
    toast('Document created');
    setOpen(false); setTitle(''); setText(''); setErr('');
    router.push(`/documents/draft?id=${doc.id}`);
  }
  const kinds = ['All', ...Array.from(new Set(docs.map((d) => d.kind)))];
  const rows = useMemo(() => {
    const list = docs.filter((d) => (kind === 'All' || d.kind === kind) && d.title.toLowerCase().includes(q.toLowerCase()));
    return list.sort((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : sort === 'words' ? b.words - a.words : a.updatedMins - b.updatedMins));
  }, [docs, q, kind, sort]);
  const author = (id: string) => orgUsers.find((u) => u.id === id)?.name ?? 'Former teammate';

  return (
    <div>
      <PageHeader title="Documents" subtitle={`${docs.length} ${docs.length === 1 ? 'document' : 'documents'} in ${org.name}`}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />New document</button>} />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-9" placeholder="Search documents" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
          </div>
          <select className="input sm:w-44" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type">
            {kinds.map((k) => <option key={k}>{k}</option>)}
          </select>
          <div className="relative sm:w-48">
            <ArrowDownUp size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <select className="input pl-9" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort documents">
              <option value="updated">Recently updated</option>
              <option value="title">Title A to Z</option>
              <option value="words">Longest first</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : docs.length === 0 ? (
          <EmptyState icon={<FileSearch size={22} />} title="No documents yet" body={`${org.name} has no documents. Create the first one to start using the AI assistant.`}
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />New document</button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<FileSearch size={22} />} title="No documents match" body={`Nothing in ${org.name} matches "${q}". Try a different word or clear the filter.`}
            action={<button className="btn-ghost" onClick={() => { setQ(''); setKind('All'); }}>Clear filters</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-ink-100 bg-ink-50/60"><tr><th className="th">Title</th><th className="th">Type</th><th className="th">Author</th><th className="th text-right">Words</th><th className="th">Updated</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((d) => (
                  <tr key={d.id} className="group transition hover:bg-brand-50/40">
                    <td className="td"><Link prefetch={false} href={d.id.startsWith('new-') ? `/documents/draft?id=${d.id}` : `/documents/${d.id}`} className="font-medium text-ink-900 group-hover:text-brand-700">{d.title}</Link></td>
                    <td className="td"><Chip tone="brand">{d.kind}</Chip></td>
                    <td className="td"><span className="flex items-center gap-2"><Avatar name={author(d.authorId)} size={24} />{author(d.authorId)}</span></td>
                    <td className="td text-right tabular-nums">{d.words.toLocaleString()}</td>
                    <td className="td whitespace-nowrap text-ink-500">{ago(d.updatedMins)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New document" width="max-w-xl">
        <form onSubmit={create} className="space-y-4">
          <Field label="Title"><input className="input" autoFocus value={title} onChange={(e) => { setTitle(e.target.value); setErr(''); }} placeholder="Give it a clear name" /></Field>
          <Field label="Type">
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {['Notes', 'Proposal', 'Contract', 'Memo', 'Policy', 'Brief', 'Minutes'].map((k) => <option key={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Content" hint="Optional. The AI assistant works from what you write here.">
            <textarea className="input min-h-[140px] resize-y" value={text} onChange={(e) => setText(e.target.value)} placeholder="Start writing or paste your text" />
          </Field>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary">Create document</button></div>
        </form>
      </Modal>
    </div>
  );
}
