'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ArrowLeft, CopyPlus, Copy, FilePlus2, FileX, Lock, Pencil, Send, Sparkles, ThumbsDown, ThumbsUp, Trash2, X, Zap } from 'lucide-react';
import clsx from 'clsx';
import { CREDIT_COST } from '@/data/seed';
import type { AiAction } from '@/data/types';
import { AI_LABELS, AUDIT_LABEL, SUGGESTIONS, TONES, answerFor, routePrompt } from '@/lib/ai';
import { buildDoc } from '@/lib/newDoc';
import { currentUserId, useApp, useDocEdit, useDocs, useOrg } from '@/lib/store';
import { ago } from '@/lib/time';
import { Avatar, Chip, EmptyState, Field, Modal, ProgressBar, Skeleton, useLoading } from '@/shell/ui';
import { useTypewriter } from '@/shell/useTypewriter';

interface Turn { id: number; prompt: string; action: AiAction; text: string; done: boolean }

const REFINE = [
  { prompt: 'Make it shorter', label: 'Shorter' },
  { prompt: 'Turn it into bullet points', label: 'As bullets' },
  { prompt: 'Add more detail', label: 'More detail' },
];
const WRONG = ['Inaccurate', 'Too long', 'Missing detail', 'Wrong tone'];

export function DocumentView({ id: routeId }: { id: string }) {
  // Documents created during the visit open at /documents/draft?id=...
  const [id, setId] = useState(routeId);
  useEffect(() => {
    if (routeId === 'draft') setId(new URLSearchParams(window.location.search).get('id') ?? 'missing');
  }, [routeId]);
  const router = useRouter();
  const { org, plan, used, remaining, users } = useOrg();
  const { persona, spend, log, toast, saveAi, saved, editDoc, deleteDoc, addDoc, setFeedback } = useApp(
    useShallow((s) => ({
      persona: s.persona, spend: s.spend, log: s.log, toast: s.toast, saveAi: s.saveAi, saved: s.ai[id],
      editDoc: s.editDoc, deleteDoc: s.deleteDoc, addDoc: s.addDoc, setFeedback: s.setFeedback,
    })),
  );
  const feedback = useApp((s) => s.feedback);
  const suspendedFlag = useApp((s) => s.suspended[org.id]);
  const orgDocs = useDocs(org.id);
  const doc = orgDocs.find((d) => d.id === id);
  const edit = useDocEdit(id);
  const loading = useLoading(id);
  const [turns, setTurns] = useState<Turn[]>(() =>
    (Object.entries(saved ?? {}) as [AiAction, string][]).map(([action, text], i) => ({ id: i, prompt: AI_LABELS[action], action, text, done: true })),
  );
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', kind: 'Notes', text: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { shown, typing, start } = useTypewriter(14);
  const turnId = useRef(100);
  const bottom = useRef<HTMLDivElement>(null);

  // Switching organisation while viewing a document sends you back to that org's list.
  useEffect(() => { if (doc && doc.orgId !== org.id) router.replace('/documents'); }, [doc, org.id, router]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [turns.length, shown, thinking]);

  if (!doc) {
    // Just deleted, or a created document whose link has not been read yet: render nothing for a moment.
    if (gone || id === 'draft') return null;
    return (
      <div className="card">
        <EmptyState icon={<FileX size={22} />} title="Document not found" body="This document does not exist, or it was deleted. Head back to the list to find what you need."
          action={<Link href="/documents" className="btn-primary">Back to documents</Link>} />
      </div>
    );
  }
  if (doc.orgId !== org.id) return null;
  const me = currentUserId(persona);
  const meName = users.find((u) => u.id === me)?.name ?? (persona === 'superadmin' ? 'Elena Costa' : 'A teammate');
  const author = users.find((u) => u.id === doc.authorId);
  const busy = thinking || typing;
  const cheapest = Math.min(...Object.values(CREDIT_COST));
  const isSuspended = !!suspendedFlag && persona !== 'superadmin';
  const exhausted = remaining < cheapest || isSuspended;
  const canAfford = (a: AiAction) => remaining >= CREDIT_COST[a];
  const lastDone = [...turns].reverse().find((t) => t.done);

  function run(action: AiAction, prompt: string, prev?: string) {
    if (busy || !doc) return;
    if (!canAfford(action)) { toast('Not enough AI credits for that. Upgrade to continue.', 'warn'); return; }
    const cost = CREDIT_COST[action];
    const t: Turn = { id: turnId.current++, prompt, action, text: '', done: false };
    spend(org.id, cost, { userId: me, action });
    setTurns((p) => [...p, t]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      const text = answerFor(doc, action, prev, prompt);
      start(text, () => {
        setTurns((p) => p.map((x) => (x.id === t.id ? { ...x, text, done: true } : x)));
        saveAi(doc.id, action, text);
        log(org.id, me, AUDIT_LABEL[action], doc.title);
        toast(`${cost} credits used`, 'info');
      });
    }, 1100);
  }

  function beginEdit() {
    if (!doc) return;
    setDraft({ title: doc.title, kind: doc.kind, text: doc.body.join('\n\n') });
    setEditing(true);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc) return;
    const title = draft.title.trim();
    if (!title) return;
    const changedText = draft.text.trim() !== doc.body.join('\n\n').trim();
    const b = buildDoc(org.id, doc.authorId, title, draft.kind, draft.text);
    editDoc(doc.id, {
      title, kind: draft.kind, body: b.body, words: b.words, editedBy: meName,
      ...(changedText ? { summary: b.summary, actions: b.actions, rewrite: b.rewrite, es: b.es } : {}),
    });
    log(org.id, me, 'Edited document', title);
    toast('Changes saved');
    setEditing(false);
  }

  function duplicate() {
    if (!doc) return;
    const copy = { ...doc, id: `new-${Date.now()}`, title: `${doc.title} (copy)`, authorId: me, updatedMins: 0, createdMins: 0 };
    addDoc(copy);
    log(org.id, me, 'Created document', copy.title);
    toast('Document duplicated');
    router.push(`/documents/draft?id=${copy.id}`);
  }

  function remove() {
    if (!doc) return;
    setGone(true);
    deleteDoc(doc.id);
    log(org.id, me, 'Deleted document', doc.title);
    toast(`"${doc.title}" deleted`, 'info');
    router.push('/documents');
  }

  function insert(text: string) {
    if (!doc) return;
    const body = [...doc.body, text.replace(/^\d+\.\s/gm, '')];
    editDoc(doc.id, { body, words: body.join(' ').split(/\s+/).length, editedBy: meName });
    log(org.id, me, 'Edited document', doc.title);
    toast('Added to the document');
  }

  const live = turns.find((t) => !t.done);
  const fbKey = (t: Turn) => `${doc.id}:${t.action}:${t.text.length}`;

  return (
    <div>
      <Link href="/documents" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft size={15} />All documents</Link>
      {loading ? (
        <Skeleton className="mx-auto h-96 max-w-4xl" />
      ) : (
        <div className="mx-auto max-w-4xl pb-24">
          <article className="card p-6 sm:p-8">
            {editing ? (
              <form onSubmit={saveEdit} className="space-y-4">
                <Field label="Title"><input className="input" autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
                <Field label="Type">
                  <select className="input" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
                    {Array.from(new Set([draft.kind, 'Notes', 'Proposal', 'Contract', 'Memo', 'Policy', 'Brief', 'Minutes'])).map((k) => <option key={k}>{k}</option>)}
                  </select>
                </Field>
                <Field label="Content" hint="Leave a blank line between paragraphs.">
                  <textarea className="input min-h-[260px] resize-y leading-7" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
                </Field>
                <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button><button className="btn-primary" disabled={!draft.title.trim()}>Save changes</button></div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Chip tone="brand">{doc.kind}</Chip>
                  <div className="flex gap-1.5">
                    <button className="btn-ghost px-2.5 py-1.5" onClick={beginEdit}><Pencil size={14} />Edit</button>
                    <button className="btn-ghost px-2.5 py-1.5" onClick={duplicate}><CopyPlus size={14} />Duplicate</button>
                    <button className="btn-ghost px-2.5 py-1.5 text-red-600" onClick={() => setConfirmDelete(true)}><Trash2 size={14} />Delete</button>
                  </div>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">{doc.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                  <span className="flex items-center gap-2"><Avatar name={author?.name ?? 'Former teammate'} size={22} />{author?.name ?? 'Former teammate'}</span>
                  <span>·</span><span>{edit?.editedBy ? `Edited by ${edit.editedBy} ${ago(doc.updatedMins)}` : `Updated ${ago(doc.updatedMins)}`}</span><span>·</span><span>{doc.words.toLocaleString()} words</span>
                </div>
                <div className="mt-6 space-y-4 text-[15px] leading-7 text-ink-700">
                  {doc.body.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
                </div>
              </>
            )}
          </article>

          {/* Floating chat widget: a launcher at the bottom-right opens the assistant over the page. */}
          <button
            onClick={() => setChatOpen((o) => !o)}
            aria-label={chatOpen ? 'Close AI chat' : 'Open AI chat'}
            aria-expanded={chatOpen}
            data-tour="chat"
            className={clsx(
              'fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-brand-600 text-white shadow-xl transition hover:bg-brand-700 sm:right-6',
              chatOpen ? 'h-12 w-12 justify-center' : 'px-5 py-3 text-sm font-semibold',
            )}
          >
            {chatOpen ? <X size={20} /> : <><Sparkles size={18} />Ask AI</>}
          </button>
          {chatOpen && (
          <aside role="region" aria-label="AI assistant chat" className="pop fixed inset-x-3 bottom-20 z-50 flex h-[min(680px,calc(100dvh-6.5rem))] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[410px]">
            <div className="border-b border-ink-100 bg-brand-600/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-semibold"><Sparkles size={17} className="text-brand-500" />AI assistant</h2>
                  <p className="mt-0.5 truncate text-xs text-ink-500">About: {doc.title}</p>
                </div>
                <span className="flex shrink-0 items-center gap-2 text-xs text-ink-500">
                  <span className="flex items-center gap-1"><Zap size={13} />{remaining.toLocaleString()} left</span>
                  <button onClick={() => setChatOpen(false)} aria-label="Minimise chat" className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><X size={16} /></button>
                </span>
              </div>
              <div className="mt-2.5"><ProgressBar value={used} max={plan.credits} /></div>
            </div>

            {exhausted && (
              <div className="m-4 mb-0 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-900"><Lock size={15} />{isSuspended ? 'AI features are paused' : 'You are out of AI credits'}</p>
                <p className="mt-1 text-xs text-amber-800">{isSuspended ? `${org.name} is suspended. Contact an administrator to reinstate it.` : `${org.name} has used all ${plan.credits} credits on the ${plan.name} plan.`}</p>
                {isSuspended ? null : persona === 'member'
                  ? <p className="mt-2 text-xs font-medium text-amber-900">Ask an owner to upgrade the plan to continue.</p>
                  : <Link href="/billing" className="btn-primary mt-3 w-full">Upgrade to continue</Link>}
              </div>
            )}

            <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto p-4">
              {turns.length === 0 && !thinking && (
                <p className="text-sm text-ink-500">Ask about this document or pick a suggestion below. Each request uses AI credits.</p>
              )}
              {turns.map((t) => {
                const fb = feedback[fbKey(t)];
                return (
                  <div key={t.id} className="space-y-2">
                    <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-sm text-white">{t.prompt}</div>
                    {(t.done || t === live) && (
                      <div className="pop max-w-[95%] rounded-2xl rounded-bl-md bg-ink-50 px-3.5 py-2.5 text-sm leading-6 text-ink-800">
                        {t.done ? <p className="whitespace-pre-line">{t.text}</p> : shown ? <p className={`whitespace-pre-line ${typing ? 'caret' : ''}`}>{shown}</p> : null}
                        {t.done && (
                          <>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline" onClick={() => { navigator.clipboard?.writeText(t.text).catch(() => {}); toast('Copied to clipboard'); }}>
                                <Copy size={12} />Copy
                              </button>
                              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline" onClick={() => insert(t.text)}>
                                <FilePlus2 size={12} />Insert into document
                              </button>
                              <span className="ml-auto flex gap-1">
                                <button aria-label="Good answer" aria-pressed={fb?.vote === 'up'} onClick={() => { setFeedback(fbKey(t), 'up'); setReasonFor(null); toast('Thanks for the feedback'); }}
                                  className={clsx('rounded-md p-1 hover:bg-ink-100', fb?.vote === 'up' ? 'text-emerald-600' : 'text-ink-400')}><ThumbsUp size={14} /></button>
                                <button aria-label="Poor answer" aria-pressed={fb?.vote === 'down'} onClick={() => { setFeedback(fbKey(t), 'down'); setReasonFor(fbKey(t)); }}
                                  className={clsx('rounded-md p-1 hover:bg-ink-100', fb?.vote === 'down' ? 'text-red-600' : 'text-ink-400')}><ThumbsDown size={14} /></button>
                              </span>
                            </div>
                            {reasonFor === fbKey(t) && (
                              <div className="mt-2 rounded-lg border border-ink-200 bg-white p-2.5">
                                <p className="text-xs font-medium text-ink-700">What was wrong?</p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {WRONG.map((r) => (
                                    <button key={r} className="rounded-full border border-ink-200 px-2.5 py-1 text-xs hover:border-brand-300 hover:bg-brand-50" onClick={() => { setFeedback(fbKey(t), 'down', r); setReasonFor(null); toast('Thanks, we will use this to improve answers'); }}>{r}</button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {fb?.vote === 'down' && fb.reason && reasonFor !== fbKey(t) && <p className="mt-1.5 text-xs text-ink-500">Marked as: {fb.reason}</p>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {thinking && (
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-ink-50 px-3.5 py-3 text-sm text-ink-500">
                  <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>Reading the document…
                </div>
              )}
              <div ref={bottom} />
            </div>

            <div className="border-t border-ink-100 p-4">
              <div className="flex gap-2 no-scrollbar overflow-x-auto pb-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s.action} disabled={busy || !canAfford(s.action)} onClick={() => run(s.action, s.prompt)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-45">
                    {AI_LABELS[s.action]} <span className="text-ink-400">· {CREDIT_COST[s.action]}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 no-scrollbar overflow-x-auto pb-1">
                <span className="shrink-0 text-xs font-medium text-ink-500">Tone</span>
                {TONES.map((s) => (
                  <button key={s.action} disabled={busy || !canAfford(s.action)} onClick={() => run(s.action, s.prompt)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-45">
                    {AI_LABELS[s.action].replace(' tone', '')} <span className="text-ink-400">· {CREDIT_COST[s.action]}</span>
                  </button>
                ))}
              </div>
              {lastDone && (
                <div className="mt-2 flex items-center gap-2 no-scrollbar overflow-x-auto pb-1">
                  <span className="shrink-0 text-xs font-medium text-ink-500">Refine</span>
                  {REFINE.map((r) => (
                    <button key={r.label} disabled={busy || !canAfford('followup')} onClick={() => run('followup', r.prompt, lastDone.text)}
                      className="shrink-0 whitespace-nowrap rounded-full border border-dashed border-ink-300 px-2.5 py-1 text-xs text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-45">
                      {r.label} <span className="text-ink-400">· {CREDIT_COST.followup}</span>
                    </button>
                  ))}
                </div>
              )}
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = input.trim(); if (!v) return; const a = routePrompt(v, !!lastDone); setInput(''); run(a, v, lastDone?.text); }}>
                <input className="input" placeholder={exhausted ? 'Upgrade to keep asking' : lastDone ? 'Ask a follow-up or something new' : 'Ask about this document'} value={input} onChange={(e) => setInput(e.target.value)} disabled={exhausted || busy} aria-label="Ask the AI assistant" />
                <button className="btn-primary px-3" disabled={exhausted || busy || !input.trim()} aria-label="Send"><Send size={16} /></button>
              </form>
            </div>
          </aside>
          )}
        </div>
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete document" width="max-w-md">
        <p className="text-sm text-ink-600">&quot;{doc.title}&quot; will be removed from {org.name} for everyone on the team.</p>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button><button className="btn-danger" onClick={remove}>Delete document</button></div>
      </Modal>
    </div>
  );
}
