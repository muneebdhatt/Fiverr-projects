'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FileText, MessageSquareText, Search, X } from 'lucide-react';
import { api, SearchResult } from '@/lib/api';
import { useChat } from '@/lib/chatStore';
import { useSession } from './session';
import { useViewer } from './viewer';

export function SearchBox() {
  const router = useRouter();
  const me = useSession((s) => s.me);
  const ask = useChat((s) => s.ask);
  const open = useViewer((s) => s.open);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<SearchResult | null>(null);
  const [focus, setFocus] = useState(false);
  const [mobile, setMobile] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setMobile(true); setFocus(true); setTimeout(() => input.current?.focus(), 0); }
    };
    const click = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) { setFocus(false); setMobile(false); } };
    window.addEventListener('keydown', k);
    document.addEventListener('mousedown', click);
    return () => { window.removeEventListener('keydown', k); document.removeEventListener('mousedown', click); };
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return; }
    let live = true;
    const t = setTimeout(() => api.search(q.trim()).then((r) => live && setRes(r)).catch(() => {}), 180);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  const close = () => { setFocus(false); setMobile(false); setQ(''); setRes(null); };
  const showList = focus && q.trim().length >= 2;
  const empty = res && res.docs.length === 0 && res.questions.length === 0;

  return (
    <div ref={box} className={mobile ? 'absolute inset-x-0 top-0 z-40 flex h-16 items-center bg-white px-3 xl:static xl:z-auto xl:h-auto xl:bg-transparent xl:px-0' : 'relative'}>
      <button aria-label="Search" onClick={() => { setMobile(true); setFocus(true); setTimeout(() => input.current?.focus(), 0); }} className={`rounded-md p-2 text-ink-600 hover:bg-ink-100 xl:hidden ${mobile ? 'hidden' : ''}`}><Search className="h-5 w-5" /></button>
      <div data-tour="search" className={`${mobile ? 'flex' : 'hidden'} w-full items-center xl:flex xl:w-64 2xl:w-80`}>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} placeholder="Search documents and questions" className="input h-9 pl-9 pr-16" aria-label="Search documents and questions" />
          {q ? (
            <button aria-label="Clear search" onClick={close} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:bg-ink-100"><X className="h-4 w-4" /></button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 px-1.5 py-0.5 text-[10px] font-medium text-ink-400 lg:block">Ctrl K</kbd>
          )}
        </div>
      </div>
      {showList && (
        <div className="card pop absolute left-3 right-3 top-14 z-50 max-h-[70vh] overflow-y-auto p-2 xl:left-0 xl:right-auto xl:top-11 xl:w-[28rem]">
          {!res && <div className="px-3 py-3 text-sm text-ink-500">Searching…</div>}
          {empty && <div className="px-3 py-4 text-sm text-ink-500">Nothing found for &ldquo;{q}&rdquo;.</div>}
          {res && res.docs.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Documents</div>
              {res.docs.map((d) => (
                <button key={d.id} onClick={() => { open({ id: d.id, quote: d.quote ?? undefined }); close(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-50">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{d.title}</span><span className="block truncate text-xs text-ink-500">{d.snippet}</span></span>
                </button>
              ))}
            </>
          )}
          {res && res.questions.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Questions</div>
              {res.questions.map((t) => (
                <button key={t} onClick={() => { if (me) ask(me.id, t); close(); router.push('/chat'); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-50">
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span className="text-sm">{t}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
