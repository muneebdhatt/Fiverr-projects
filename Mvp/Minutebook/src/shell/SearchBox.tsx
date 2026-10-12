'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckSquare, FileText, MessageSquareQuote, Search, X } from 'lucide-react';
import { firstName } from '@/data';
import { searchAll, type Hit } from '@/lib/search';
import { useActions, useMeetings } from '@/lib/store';
import { clock, meetingDay } from '@/lib/util';
import { Highlight, useClickOutside } from './ui';

export function SearchBox({ className }: { className?: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const meetings = useMeetings();
  const actions = useActions();
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const hits = useMemo(() => (q.trim().length > 1 ? searchAll(q, meetings, actions) : []), [q, meetings, actions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (h: Hit) => {
    setOpen(false);
    setQ('');
    const line = h.kind === 'line' ? h.line : h.kind === 'action' ? h.action.line : undefined;
    if (line !== undefined && pathname === `/meetings/${h.meeting.id}`) {
      window.dispatchEvent(new CustomEvent('mb:jump', { detail: { line } }));
      return;
    }
    router.push(`/meetings/${h.meeting.id}${line !== undefined ? `?line=${line}` : ''}`);
  };

  return (
    <div className={className} ref={ref}>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          ref={inputRef}
          className="input pl-9 pr-16"
          placeholder="Search meetings, transcripts and actions"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hits[0]) go(hits[0]);
            if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
          }}
          aria-label="Search"
        />
        {q ? (
          <button onClick={() => { setQ(''); inputRef.current?.focus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700" aria-label="Clear search"><X size={15} /></button>
        ) : (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[11px] font-medium text-ink-500 sm:block">Ctrl K</kbd>
        )}
      </div>
      {open && q.trim().length > 1 && (
        <div className="pop absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-ink-200 bg-white p-1.5 shadow-xl">
          {hits.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-500">Nothing matches &ldquo;{q}&rdquo;. Try a name, a topic or a word someone said.</p>
          ) : (
            hits.map((h, i) => (
              <button key={i} onClick={() => go(h)} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-ink-50">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                  {h.kind === 'meeting' ? <FileText size={15} /> : h.kind === 'line' ? <MessageSquareQuote size={15} /> : <CheckSquare size={15} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">
                    {h.kind === 'meeting' ? <Highlight text={h.meeting.title} query={q} /> : h.kind === 'action' ? <Highlight text={h.action.title} query={q} /> : h.meeting.title}
                  </span>
                  <span className="block truncate text-xs text-ink-500">
                    {h.kind === 'meeting' && `Meeting · ${meetingDay(h.meeting.day)}`}
                    {h.kind === 'line' && <>{firstName(h.meeting.lines[h.line].who)} at {clock(h.meeting.lines[h.line].ts)}: <Highlight text={h.snippet} query={q} /></>}
                    {h.kind === 'action' && `Action · ${firstName(h.action.owner)} · in ${h.meeting.title}`}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
