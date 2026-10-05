'use client';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FileSearch, FileText, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { api, Doc, Reply } from '@/lib/api';
import { Msg, useChat } from '@/lib/chatStore';
import { notify } from '@/lib/notifications';
import { useSession } from '@/shell/session';
import { useTypewriter } from '@/shell/Typewriter';
import { toast } from '@/shell/Toast';
import { Logo } from '@/shell/ui';
import type { DocTarget } from '@/components/DocViewer';

export function Answer({ reply, fresh, onOpen, onDone, compact }: { reply: Reply; fresh: boolean; onOpen: (t: DocTarget) => void; onDone: () => void; compact?: boolean }) {
  const { shown, typing } = useTypewriter(reply.answer, fresh);
  const doneRef = useRef(false);
  useEffect(() => {
    if (!typing && !doneRef.current) { doneRef.current = true; onDone(); }
  }, [typing, onDone]);

  const parts = shown.split(/(\[\d+\])/g);
  return (
    <div className={clsx('font-serif leading-[1.65] text-ink-800', compact ? 'text-[15px]' : 'text-[17px]')}>
      <span className={clsx(typing && 'caret')}>
        {parts.map((p, i) => {
          const m = p.match(/^\[(\d+)\]$/);
          if (!m) return <span key={i}>{p}</span>;
          const c = reply.citations.find((x) => x.n === Number(m[1]));
          if (!c) return null;
          return (
            <button key={i} onClick={() => onOpen({ id: c.doc_id, quote: c.quote })} title={c.doc_title}
              className="mx-0.5 inline-flex h-[18px] min-w-[18px] -translate-y-0.5 items-center justify-center rounded-full bg-brand-100 px-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-200">
              {m[1]}
            </button>
          );
        })}
      </span>
    </div>
  );
}

export function Related({ docs, onOpen, compact }: { docs: Doc[]; onOpen: (t: DocTarget) => void; compact?: boolean }) {
  return (
    <div className="mt-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Closest related documents</div>
      <div className={clsx('grid gap-2', !compact && 'sm:grid-cols-3')}>
        {docs.map((d) => (
          <button key={d.id} onClick={() => onOpen({ id: d.id })} className="flex items-start gap-2 rounded-lg border border-ink-100 bg-white p-3 text-left hover:border-brand-300 hover:bg-brand-50/40">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span className="text-sm font-medium leading-snug">{d.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function shareText(r: Reply, withSources: boolean) {
  let t = `Q: ${r.question}\n\n${r.answer.replace(/\s*\[\d+\]/g, '')}`;
  if (withSources && r.citations.length) t += `\n\nSources:\n${r.citations.map((c) => `${c.n}. ${c.doc_title}: "${c.quote}"`).join('\n')}`;
  return t;
}

export function AiMessage({ m, onOpen, compact }: { m: Extract<Msg, { role: 'ai' }>; onOpen: (t: DocTarget) => void; compact?: boolean }) {
  const patchFor = useChat((s) => s.patch);
  const uid = useSession((s) => s.me?.id) ?? '';
  const [typingDone, setTypingDone] = useState(!m.fresh);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [share, setShare] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const onDone = useCallback(() => { setTypingDone(true); patchFor(uid, m.id, { fresh: false }); }, [patchFor, uid, m.id]);

  useEffect(() => {
    if (!share) return;
    const h = (e: MouseEvent) => { if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShare(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [share]);

  const rate = async (rating: 'up' | 'down', why = '') => {
    await api.feedback(m.reply.id, m.reply.question, rating, why);
    patchFor(uid, m.id, { rating });
    if (rating === 'up') toast('Thanks, glad that helped');
    else { toast('Thanks, we have flagged this answer for review'); notify(uid, 'Your feedback was sent to the admins for review', '/chat'); setAsking(false); }
  };

  const copy = async (withSources: boolean) => {
    try { await navigator.clipboard.writeText(shareText(m.reply, withSources)); } catch {}
    setShare(false);
    toast(withSources ? 'Answer and sources copied' : 'Answer copied');
  };

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0"><Logo size={30} /></div>
      <div className="min-w-0 flex-1">
        {m.reply.not_found ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-amber-900"><FileSearch className="h-4 w-4" /> <Answer reply={m.reply} fresh={m.fresh} onOpen={onOpen} onDone={onDone} compact={compact} /></div>
            <p className="mt-1 text-sm text-amber-900/80">None of your documents mention this, so I won&apos;t guess. These are the closest matches:</p>
            {typingDone && <Related docs={m.reply.related} onOpen={onOpen} compact={compact} />}
          </div>
        ) : (
          <div className="card px-4 py-3">
            <Answer reply={m.reply} fresh={m.fresh} onOpen={onOpen} onDone={onDone} compact={compact} />
            {typingDone && m.reply.citations.length > 0 && (
              <div className="pop mt-3 border-t border-ink-100 pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Sources</div>
                <div className="flex flex-wrap gap-2">
                  {m.reply.citations.map((c) => (
                    <button key={c.n} onClick={() => onOpen({ id: c.doc_id, quote: c.quote })} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-left text-sm hover:border-brand-300 hover:bg-brand-50/40">
                      <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-100 px-1 text-[11px] font-semibold text-brand-700">{c.n}</span>
                      <span className="font-medium">{c.doc_title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {typingDone && (
          <div className="pop mt-2 flex flex-wrap items-center gap-1 text-ink-400">
            <button aria-label="Helpful" onClick={() => rate('up')} className={clsx('rounded p-1.5 hover:bg-ink-100', m.rating === 'up' && 'text-brand-600')}><ThumbsUp className="h-4 w-4" /></button>
            <button aria-label="Not helpful" onClick={() => (m.rating === 'down' ? undefined : setAsking(!asking))} className={clsx('rounded p-1.5 hover:bg-ink-100', (m.rating === 'down' || asking) && 'text-red-600')}><ThumbsDown className="h-4 w-4" /></button>
            <div className="relative" ref={shareRef}>
              <button aria-label="Share answer" onClick={() => setShare(!share)} className="flex items-center gap-1 rounded p-1.5 text-sm hover:bg-ink-100"><Share2 className="h-4 w-4" /> <span className="hidden text-xs sm:inline">Share</span></button>
              {share && (
                <div className="card pop absolute left-0 z-20 mt-1 w-56 p-1">
                  <button onClick={() => copy(false)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">Copy answer</button>
                  {!m.reply.not_found && <button onClick={() => copy(true)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">Copy answer with sources</button>}
                </div>
              )}
            </div>
            {m.rating === 'down' && <span className="ml-1 text-xs">Flagged for review</span>}
          </div>
        )}
        {asking && (
          <div className="pop card mt-2 max-w-md p-3">
            <label className="text-sm font-medium">What was wrong?
              <textarea className="input mt-1.5 h-20 resize-none" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us what was missing or out of date" />
            </label>
            <div className="mt-2 flex gap-2">
              <button className="btn-primary" onClick={() => rate('down', reason)}>Send feedback</button>
              <button className="btn-ghost" onClick={() => setAsking(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

