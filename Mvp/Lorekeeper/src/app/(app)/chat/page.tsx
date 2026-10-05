'use client';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, MessageSquarePlus, Pencil, Send, Sparkles, Trash2, X } from 'lucide-react';
import { Conv, useBucket, useChat } from '@/lib/chatStore';
import { useAsk } from '@/lib/useAsk';
import { AiMessage } from '@/components/ChatParts';
import { useSession } from '@/shell/session';
import { useViewer } from '@/shell/viewer';
import { Thinking } from '@/shell/Typewriter';
import { Modal } from '@/shell/Modal';
import { toast } from '@/shell/Toast';
import { Avatar, Logo } from '@/shell/ui';

const SUGGESTED = [
  'How many days a week can I work remotely?',
  'What is the limit for client dinner expenses?',
  'What are our invoice payment terms?',
  'What should I do in the first week with a new client?',
];

function groupConvs(convs: Conv[]) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const today = start.getTime(), yesterday = today - 86400000, week = today - 6 * 86400000;
  const groups: { label: string; items: Conv[] }[] = [
    { label: 'Today', items: [] }, { label: 'Yesterday', items: [] }, { label: 'Previous 7 days', items: [] }, { label: 'Older', items: [] },
  ];
  [...convs].sort((a, b) => b.updated - a.updated).forEach((c) => {
    groups[c.updated >= today ? 0 : c.updated >= yesterday ? 1 : c.updated >= week ? 2 : 3].items.push(c);
  });
  return groups.filter((g) => g.items.length);
}

function History({ convs, activeId, busy, onNew, onSelect, onRename, onDelete }: {
  convs: Conv[]; activeId: string | null; busy: boolean; onNew: () => void; onSelect: (id: string) => void; onRename: (c: Conv) => void; onDelete: (c: Conv) => void;
}) {
  const groups = useMemo(() => groupConvs(convs), [convs]);
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button className="btn-primary w-full" disabled={busy} onClick={onNew}><MessageSquarePlus className="h-4 w-4" /> New chat</button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-ink-500"><Clock className="mx-auto mb-2 h-5 w-5 text-ink-300" />Your chats will appear here.</div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{g.label}</div>
            {g.items.map((c) => (
              <div key={c.id} className={clsx('group flex items-center gap-1 rounded-lg pr-1', c.id === activeId ? 'bg-brand-50' : 'hover:bg-ink-50')}>
                <button disabled={busy} onClick={() => onSelect(c.id)} className={clsx('min-w-0 flex-1 truncate px-2 py-2 text-left text-sm', c.id === activeId ? 'font-medium text-brand-700' : 'text-ink-700')} title={c.title}>{c.title}</button>
                <button aria-label={`Rename ${c.title}`} onClick={() => onRename(c)} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>
                <button aria-label={`Delete ${c.title}`} onClick={() => onDelete(c)} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { select, rename, remove } = useChat();
  const me = useSession((s) => s.me);
  const uid = me?.id;
  const { convs, active, msgs } = useBucket(uid);
  const openDoc = useViewer((s) => s.open);
  const { busy, send } = useAsk();
  const [text, setText] = useState('');
  const [histOpen, setHistOpen] = useState(false);
  const [renaming, setRenaming] = useState<Conv | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleting, setDeleting] = useState<Conv | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const ask = (q: string) => { setText(''); send(q); };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length, busy, active?.id]);

  const startNew = () => { if (uid) select(uid, null); setHistOpen(false); };
  const pick = (id: string) => { if (uid) select(uid, id); setHistOpen(false); };
  const openRename = (c: Conv) => { setRenaming(c); setNewTitle(c.title); };

  const historyProps = {
    convs, activeId: active?.id ?? null, busy, onNew: startNew, onSelect: pick, onRename: openRename, onDelete: setDeleting,
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[32rem] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Ask your documents</h1>
          <p className="text-sm text-ink-500">Answers are drawn only from the documents your team has added.</p>
        </div>
        <button className="btn-ghost lg:hidden" onClick={() => setHistOpen(true)}><Clock className="h-4 w-4" /> History</button>
      </div>

      <div className="card flex min-h-0 flex-1 overflow-hidden">
        <aside data-tour="history" className="hidden w-64 shrink-0 border-r border-ink-100 lg:block"><History {...historyProps} /></aside>
        {histOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setHistOpen(false)} />
            <aside className="pop absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
              <button aria-label="Close history" onClick={() => setHistOpen(false)} className="absolute right-2 top-2 rounded p-1 text-ink-400 hover:bg-ink-100"><X className="h-4 w-4" /></button>
              <div className="h-full pt-8"><History {...historyProps} /></div>
            </aside>
          </div>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
            {msgs.length === 0 && !busy && (
              <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-brand-50 text-brand-600"><Sparkles className="h-6 w-6" /></div>
                <h2 className="text-2xl font-semibold">What would you like to know?</h2>
                <p className="mt-1 text-sm text-ink-500">Try one of these, or type your own question.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTED.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="rounded-md border border-ink-300 bg-white px-3.5 py-2 text-left text-sm text-ink-700 hover:border-brand-300 hover:bg-brand-50">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end gap-3">
                  <div className="max-w-[85%] rounded-lg rounded-tr-none bg-brand-600 px-4 py-2.5 text-[15px] text-white">{m.text}</div>
                  {me && <Avatar name={me.name} size={30} />}
                </div>
              ) : (
                <AiMessage key={m.id} m={m} onOpen={openDoc} />
              ),
            )}
            {busy && (
              <div className="flex gap-3"><div className="mt-0.5 shrink-0"><Logo size={30} /></div><div className="card px-4 py-3"><Thinking /></div></div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-ink-100 p-3 sm:p-4">
            {msgs.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {SUGGESTED.map((s) => (
                  <button key={s} disabled={busy} onClick={() => ask(s)} className="shrink-0 rounded-md border border-ink-300 bg-white px-3 py-1 text-xs text-ink-600 hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50">{s}</button>
                ))}
              </div>
            )}
            <form data-tour="chat-input" onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2">
              <input className="input" placeholder="Ask about a policy, a guide or a client…" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn-primary px-4" disabled={busy || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      </div>

      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Rename chat">
        <form onSubmit={(e) => { e.preventDefault(); if (uid && renaming && newTitle.trim()) { rename(uid, renaming.id, newTitle); toast('Chat renamed'); setRenaming(null); } }}>
          <input className="input" autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={80} aria-label="Chat name" />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
            <button className="btn-primary" disabled={!newTitle.trim()}><Check className="h-4 w-4" /> Save</button>
          </div>
        </form>
      </Modal>
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete this chat?">
        <p className="text-sm text-ink-600">&ldquo;{deleting?.title}&rdquo; and its answers will be removed from your history.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => { if (uid && deleting) { remove(uid, deleting.id); toast('Chat deleted'); setDeleting(null); } }}><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </Modal>
    </div>
  );
}
