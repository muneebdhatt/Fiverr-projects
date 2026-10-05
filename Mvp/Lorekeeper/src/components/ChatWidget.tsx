'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Maximize2, MessageSquarePlus, MessageSquareText, Send, Sparkles, X } from 'lucide-react';
import { useBucket, useChat } from '@/lib/chatStore';
import { useAsk } from '@/lib/useAsk';
import { useWidget } from '@/lib/widgetStore';
import { Thinking } from '@/shell/Typewriter';
import { useSession } from '@/shell/session';
import { useViewer } from '@/shell/viewer';
import { Avatar, Logo } from '@/shell/ui';
import { AiMessage } from './ChatParts';

const SUGGESTED = [
  'How many days a week can I work remotely?',
  'What is the limit for client dinner expenses?',
  'What are our invoice payment terms?',
  'What should I do in the first week with a new client?',
  'How do I report a security incident?',
];

/** Floating assistant at the bottom right. It shares the same chats as the Ask page. */
export function ChatWidget() {
  const me = useSession((s) => s.me);
  const uid = me?.id;
  const { open, setOpen } = useWidget();
  const select = useChat((s) => s.select);
  const pending = useChat((s) => s.pending);
  const openDoc = useViewer((s) => s.open);
  const { msgs } = useBucket(uid);
  const { busy, send } = useAsk();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // A question queued from elsewhere opens the panel so the answer is visible.
  useEffect(() => { if (pending && pending.uid === uid) setOpen(true); }, [pending, uid, setOpen]);
  useEffect(() => { if (open) { endRef.current?.scrollIntoView({ block: 'end' }); setTimeout(() => input.current?.focus(), 150); } }, [open]);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length, busy, open]);
  useEffect(() => {
    if (!open) return;
    // Runs before the document panel's own handler, so Esc closes the panel first and the chat on the next press.
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !useViewer.getState().target) setOpen(false); };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [open, setOpen]);

  const ask = (q: string) => { setText(''); send(q); };

  return (
    <>
      {open && (
        <section
          aria-label="Ask Lorekeeper"
          className="card pop fixed z-40 flex flex-col overflow-hidden shadow-2xl max-sm:inset-2 sm:bottom-24 sm:right-6 sm:h-[600px] sm:max-h-[calc(100vh-8rem)] sm:w-[400px]"
        >
          <div className="flex items-center gap-3 bg-brand-600 px-4 py-3 text-white">
            <Logo size={30} />
            <div className="min-w-0 flex-1">
              <div className="font-serif text-lg font-semibold leading-tight">Ask Lorekeeper</div>
              <div className="text-xs text-white/75">Answers come only from your documents</div>
            </div>
            <button aria-label="New chat" title="New chat" disabled={busy || msgs.length === 0} onClick={() => uid && select(uid, null)} className="rounded-md p-2 hover:bg-white/15 disabled:opacity-40"><MessageSquarePlus className="h-4 w-4" /></button>
            <Link href="/chat" onClick={() => setOpen(false)} aria-label="Open full chat" title="Open full chat" className="rounded-md p-2 hover:bg-white/15"><Maximize2 className="h-4 w-4" /></Link>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-white/15"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-ink-50 p-4">
            {msgs.length === 0 && !busy && (
              <div className="py-2">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600"><Sparkles className="h-5 w-5" /></div>
                <h3 className="text-xl font-semibold">{me ? `Hi ${me.name.split(' ')[0]}, what can I find?` : 'What can I find?'}</h3>
                <p className="mt-1 text-sm text-ink-500">Ask about a policy, a guide or a client. Every answer shows its source.</p>
                <div className="mt-4 flex flex-col gap-2">
                  {SUGGESTED.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="rounded-md border border-ink-300 bg-white px-3 py-2 text-left text-sm text-ink-700 hover:border-brand-400 hover:bg-brand-50">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end gap-2">
                  <div className="max-w-[85%] rounded-lg rounded-tr-none bg-brand-600 px-3 py-2 text-sm text-white">{m.text}</div>
                  {me && <Avatar name={me.name} size={26} />}
                </div>
              ) : (
                <AiMessage key={m.id} m={m} onOpen={openDoc} compact />
              ),
            )}
            {busy && (
              <div className="flex gap-2"><div className="mt-0.5 shrink-0"><Logo size={26} /></div><div className="card px-3 py-2.5"><Thinking /></div></div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2 border-t border-ink-200 bg-white p-3">
            <input ref={input} className="input" placeholder="Ask your documents…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your question" />
            <button className="btn-primary px-3.5" disabled={busy || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}

      <button
        data-tour="chat-widget"
        aria-label={open ? 'Close chat' : 'Ask Lorekeeper'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={clsx('fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-brand-600 py-3.5 pl-4 text-white shadow-xl transition hover:bg-brand-700 hover:shadow-2xl', open ? 'max-sm:hidden pr-4' : 'pr-5')}
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
        {!open && <span className="text-sm font-semibold">Ask Lorekeeper</span>}
      </button>
    </>
  );
}
