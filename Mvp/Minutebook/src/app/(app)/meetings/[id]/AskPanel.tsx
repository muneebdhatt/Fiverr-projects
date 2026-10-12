'use client';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowUpRight, Search, Send, Sparkles } from 'lucide-react';
import { firstName, type Answer, type Meeting } from '@/data';
import { answerFor, promptsFor } from '@/lib/ask';
import { useActions, useApp, useMeetings, type Msg } from '@/lib/store';
import { clock, meetingDay } from '@/lib/util';
import { Thinking } from '@/shell/ui';
import { useTypewriter } from '@/shell/useTypewriter';

/** Renders [n] markers as small numbered buttons that open the source moment. */
export function CitedText({ text, cites, onCite }: { text: string; cites: number[]; onCite: (line: number) => void }) {
  const parts = text.split(/(\[\d+\])/);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^\[(\d+)\]$/.exec(p);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        const line = cites[Number(m[1]) - 1];
        if (line === undefined) return null;
        return (
          <button key={i} onClick={() => onCite(line)} className="mx-0.5 inline-flex h-[18px] min-w-[18px] -translate-y-px items-center justify-center rounded-md bg-brand-100 px-1 text-[11px] font-bold text-brand-800 transition hover:bg-brand-600 hover:text-white" aria-label={`Open source ${m[1]}`}>
            {m[1]}
          </button>
        );
      })}
    </>
  );
}

function Sources({ meeting, cites, onCite }: { meeting: Meeting; cites: number[]; onCite: (line: number) => void }) {
  if (!cites.length) return null;
  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {cites.map((line, i) => (
          <button key={i} onClick={() => onCite(line)} className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-2.5 text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">{i + 1}</span>
            {clock(meeting.lines[line].ts)} · {firstName(meeting.lines[line].who)}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotDiscussed({ answer, meetings }: { answer: Answer; meetings: Meeting[] }) {
  return (
    <div className="rounded-xl border border-ink-300 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-900"><Search size={16} className="text-ink-500" /> {answer.text}</p>
      <p className="mt-1.5 text-sm text-ink-600">I searched the whole transcript and found nothing on this, so I will not guess. These recordings come closest:</p>
      <div className="mt-3 space-y-2">
        {(answer.closest ?? []).map((c) => {
          const m = meetings.find((x) => x.id === c.meeting);
          if (!m) return null;
          return (
            <Link key={c.meeting} href={`/meetings/${m.id}?line=${c.line}`} className="group flex items-start gap-3 rounded-lg border border-ink-200 p-3 transition hover:border-brand-400 hover:bg-brand-50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{m.title}</p>
                <p className="text-xs text-ink-500">{meetingDay(m.day)} · at {clock(m.lines[c.line].ts)}</p>
                <p className="mt-1 text-sm text-ink-600">{c.why}</p>
              </div>
              <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-ink-400 group-hover:text-brand-700" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AskPanel({ meeting, onCite }: { meeting: Meeting; onCite: (line: number) => void }) {
  const msgs = useApp((s) => s.asks[meeting.id]) ?? [];
  const addAsk = useApp((s) => s.addAsk);
  const meetings = useMeetings();
  const actions = useActions();
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [pending, setPending] = useState<Answer | null>(null);
  const { shown, typing, start, reset } = useTypewriter(14, 2);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = thinking || typing;
  const prompts = useMemo(() => promptsFor(meeting, actions), [meeting, actions]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [msgs.length, shown, thinking]);

  const ask = (q: string) => {
    const t = q.trim();
    if (!t || busy) return;
    addAsk(meeting.id, { from: 'me', text: t });
    setText('');
    setThinking(true);
    const answer = answerFor(meeting, t, meetings, actions);
    setTimeout(() => {
      setThinking(false);
      setPending(answer);
      start(answer.text, () => {
        addAsk(meeting.id, { from: 'ai', text: answer.text, answer });
        setPending(null);
        reset();
      });
    }, 1100);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && !busy && (
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
            <p className="flex items-center gap-2 font-semibold"><Sparkles size={16} /> Ask this meeting anything</p>
            <p className="mt-1 text-brand-800">Answers come only from this recording and cite the moment they were said. If it was not discussed, you will be told.</p>
          </div>
        )}
        {msgs.map((m, i) => <Bubble key={i} msg={m} meeting={meeting} meetings={meetings} onCite={onCite} />)}
        {thinking && <div className="pop w-fit rounded-2xl rounded-bl-md border border-ink-200 bg-white px-4 py-3"><Thinking label="Searching the transcript" /></div>}
        {typing && (
          <div className="pop flex justify-start">
            <div className={clsx('max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-ink-200 bg-white px-4 py-3 text-sm leading-relaxed text-ink-800', 'caret')}>
              <CitedText text={shown} cites={pending?.cites ?? []} onCite={onCite} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="shrink-0 border-t border-ink-200 bg-white p-3">
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
          {prompts.map((p) => (
            <button key={p} disabled={busy} onClick={() => ask(p)} className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2">
          <input className="input" placeholder="Ask this meeting…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Ask this meeting" />
          <button className="btn-primary px-3.5" disabled={busy || !text.trim()} aria-label="Send"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ msg, meeting, meetings, onCite }: { msg: Msg; meeting: Meeting; meetings: Meeting[]; onCite: (line: number) => void }) {
  if (msg.from === 'me') {
    return <div className="pop flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-900 px-4 py-2.5 text-sm text-white">{msg.text}</div></div>;
  }
  const a = msg.answer!;
  return (
    <div className="pop flex justify-start">
      <div className="w-full max-w-[96%]">
        {a.notDiscussed ? (
          <NotDiscussed answer={a} meetings={meetings} />
        ) : (
          <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-ink-200 bg-white px-4 py-3 text-sm leading-relaxed text-ink-800">
            <CitedText text={a.text} cites={a.cites} onCite={onCite} />
            <Sources meeting={meeting} cites={a.cites} onCite={onCite} />
          </div>
        )}
      </div>
    </div>
  );
}
