'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowLeft, CheckCircle2, Circle, FileSearch, Flag, Link2, ListChecks, MessageSquareQuote, Pause, Pencil, Play, Plus, Search, Send, Sparkles, X } from 'lucide-react';
import { firstName, person } from '@/data';
import { useActions, useApp, useMeeting } from '@/lib/store';
import { clock, meetingWhen, minsLabel } from '@/lib/util';
import { ActionModal, AddActionModal } from '@/shell/ActionModal';
import { AvatarStack, Chip, DueChip, EmptyState, Highlight, PersonAvatar, Skeleton, Thinking, Waveform, useLoading } from '@/shell/ui';
import { useTypewriter } from '@/shell/useTypewriter';
import { AskPanel } from './AskPanel';
import { ShareModal, SourceModal } from './Modals';

type Tab = 'notes' | 'transcript' | 'ask';
const SPEEDS = [1, 2, 4];

export default function MeetingView({ id }: { id: string }) {
  const meeting = useMeeting(id);
  const allActions = useActions();
  const loading = useLoading(id);
  const seen = useApp((s) => s.seen.includes(id));
  const markSeen = useApp((s) => s.markSeen);
  const shared = useApp((s) => s.shared[id]);
  const setStatus = useApp((s) => s.setStatus);
  const toast = useApp((s) => s.toast);

  const [tab, setTab] = useState<Tab>('notes');
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [flash, setFlash] = useState<{ line: number; n: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [source, setSource] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tq, setTq] = useState('');
  const [summaryState, setSummaryState] = useState<'writing' | 'typing' | 'done'>(seen ? 'done' : 'writing');
  const { shown, start } = useTypewriter(16, 3);
  const scroller = useRef<HTMLDivElement>(null);
  const panelTop = useRef<HTMLDivElement>(null);
  const handledQuery = useRef(false);

  const actions = useMemo(() => allActions.filter((a) => a.meeting === id).sort((a, b) => a.line - b.line), [allActions, id]);
  const total = (meeting?.mins ?? 0) * 60;
  const lines = meeting?.lines ?? [];
  const cur = useMemo(() => {
    let c = -1;
    lines.forEach((l, i) => { if (l.ts <= time) c = i; });
    return c;
  }, [lines, time]);

  // Typed-out summary on the first visit of the session.
  useEffect(() => {
    if (!meeting || loading || summaryState !== 'writing') return;
    const t = setTimeout(() => {
      markSeen(id);
      setSummaryState('typing');
      start(meeting.summary, () => setSummaryState('done'));
    }, 900);
    return () => clearTimeout(t);
  }, [meeting, loading, summaryState, id, markSeen, start]);

  // Playback clock.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setTime((x) => {
        const n = x + 0.25 * speed;
        if (n >= total) { setPlaying(false); return total; }
        return n;
      });
    }, 250);
    return () => clearInterval(t);
  }, [playing, speed, total]);

  const scrollToLine = useCallback((line: number, mode: 'center' | 'nearest') => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>(`[data-line="${line}"]`);
    if (!box || !el) return;
    const top = el.offsetTop;
    if (mode === 'center') box.scrollTo({ top: top - box.clientHeight / 3, behavior: 'smooth' });
    else if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTo({ top: top - 60, behavior: 'smooth' });
  }, []);

  // Follow the playhead while playing.
  useEffect(() => {
    if (playing && cur >= 0 && tab !== 'ask') scrollToLine(cur, 'nearest');
  }, [cur, playing, tab, scrollToLine]);

  // Bring a jumped-to line into view once the transcript is on screen.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => {
      scrollToLine(flash.line, 'center');
      if (window.matchMedia('(max-width: 1023px)').matches) panelTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    const clear = setTimeout(() => setFlash(null), 1800);
    return () => { clearTimeout(t); clearTimeout(clear); };
  }, [flash, scrollToLine]);

  const jump = useCallback((line: number, play = true) => {
    if (!meeting) return;
    setTime(meeting.lines[line].ts);
    setPlaying(play);
    setTab('transcript');
    setTq('');
    setSource(null);
    setActiveId(null);
    setFlash({ line, n: Date.now() });
  }, [meeting]);

  // Arrive from search, the action board or a "closest meeting" card with ?line=n.
  useEffect(() => {
    if (!meeting || loading || handledQuery.current) return;
    handledQuery.current = true;
    const n = Number(new URLSearchParams(window.location.search).get('line'));
    if (Number.isInteger(n) && window.location.search.includes('line=') && n >= 0 && n < meeting.lines.length) jump(n, false);
  }, [meeting, loading, jump]);

  // The header search can ask this page to jump to a moment without navigating away.
  useEffect(() => {
    const h = (e: Event) => {
      const line = (e as CustomEvent<{ line: number }>).detail?.line;
      if (typeof line === 'number') jump(line, false);
    };
    window.addEventListener('mb:jump', h);
    return () => window.removeEventListener('mb:jump', h);
  }, [jump]);

  if (!meeting) {
    return <EmptyState icon={<FileSearch size={22} />} title="We could not find that meeting" body="It may have been removed. Head back to the list to pick another." action={<Link href="/meetings" className="btn-primary">All meetings</Link>} />;
  }

  const active = activeId ? actions.find((a) => a.id === activeId) ?? null : null;
  const doneCount = actions.filter((a) => a.status === 'done').length;
  const markers = actions.map((a) => ({ a, p: meeting.lines[a.line].ts / total }));
  const filtered = tq.trim() ? lines.map((l, i) => ({ l, i })).filter(({ l }) => tq.trim().toLowerCase().split(/\s+/).every((w) => l.text.toLowerCase().includes(w) || person(l.who).name.toLowerCase().includes(w))) : lines.map((l, i) => ({ l, i }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/meetings" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft size={15} /> Meetings</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl">{meeting.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-500">
              <span>{meetingWhen(meeting.day, meeting.time)}</span>
              <span>·</span>
              <span>{minsLabel(meeting.mins)}</span>
              <Chip tone="outline">{meeting.tag}</Chip>
              <AvatarStack ids={meeting.who} size={26} max={6} />
              {shared && <Chip tone="brand"><Send size={11} /> Shared with {shared} {shared === 1 ? 'person' : 'people'}</Chip>}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => { try { navigator.clipboard?.writeText(window.location.href); } catch {} toast('Link copied', 'success'); }}><Link2 size={16} /> Copy link</button>
            <button className="btn-primary" onClick={() => setShareOpen(true)}><Send size={16} /> Share notes</button>
          </div>
        </div>
      </div>

      {/* Player */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setPlaying((p) => !p)} className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700', playing && 'ring-pulse')} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="relative">
              <Waveform bars={40} height={48} seed={meeting.mins} progress={time / total} className="sm:hidden" onSeek={(p) => { setTime(p * total); }} />
              <Waveform bars={96} height={48} seed={meeting.mins} progress={time / total} className="hidden sm:flex" onSeek={(p) => { setTime(p * total); }} />
              <div className="pointer-events-none absolute inset-x-0 -bottom-3 h-3">
                {markers.map(({ a, p }) => (
                  <button key={a.id} onClick={() => jump(a.line)} title={`${a.title} (${clock(meeting.lines[a.line].ts)})`} className="pointer-events-auto absolute -translate-x-1/2 text-ink-700 transition hover:scale-125 hover:text-brand-700" style={{ left: `${p * 100}%` }} aria-label={`Jump to action: ${a.title}`}>
                    <Flag size={12} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden shrink-0 text-right text-sm tabular-nums text-ink-600 sm:block">
            <span className="font-semibold text-ink-900">{clock(time)}</span> / {clock(total)}
          </div>
          <button onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])} className="shrink-0 rounded-md border border-ink-300 px-2 py-1 text-xs font-bold text-ink-700 hover:bg-ink-50" aria-label="Playback speed">{speed}x</button>
        </div>
        <p className="mt-4 text-xs text-ink-400 sm:hidden">{clock(time)} / {clock(total)}</p>
      </div>

      {/* Mobile tabs */}
      <div className="grid scroll-mt-32 grid-cols-3 rounded-xl bg-ink-100 p-1 lg:hidden" ref={panelTop}>
        {([['notes', 'Notes'], ['transcript', 'Transcript'], ['ask', 'Ask']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={clsx('rounded-lg py-2 text-sm font-semibold transition', tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}>{label}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Notes */}
        <div className={clsx('min-w-0 space-y-6 lg:col-span-2', tab !== 'notes' && 'hidden lg:block')}>
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-ink-500"><Sparkles size={15} className="text-brand-600" /> Summary</h2>
            {loading || summaryState === 'writing' ? (
              loading ? <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4 w-2/3" /></div> : <Thinking label="Writing the summary" />
            ) : (
              <p className={clsx('whitespace-pre-wrap text-[15px] leading-relaxed text-ink-800', summaryState === 'typing' && 'caret')}>{summaryState === 'typing' ? shown : meeting.summary}</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-ink-500"><ListChecks size={15} className="text-brand-600" /> Decisions</h2>
            {loading ? <Skeleton className="h-24" /> : (
              <ul className="space-y-2.5">
                {meeting.decisions.map((d) => (
                  <li key={d.text} className="flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                    <span className="flex-1 text-sm text-ink-800">{d.text}</span>
                    <button onClick={() => jump(d.line)} className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-ink-600 hover:bg-brand-100 hover:text-brand-800" title="Play from this moment">{clock(meeting.lines[d.line].ts)}</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-ink-500"><CheckCircle2 size={15} className="text-brand-600" /> Action items <span className="text-ink-400 normal-case tracking-normal">{doneCount}/{actions.length} done</span></h2>
              <button className="btn-ghost btn-sm" onClick={() => setAddOpen(true)}><Plus size={14} /> Add</button>
            </div>
            {loading ? <div className="space-y-2 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /></div> : (
              <ul className="divide-y divide-ink-100">
                {actions.map((a) => (
                  <li key={a.id} className={clsx('group flex items-start gap-3 px-5 py-3.5 transition hover:bg-ink-50', flash && flash.line === a.line && 'flash')}>
                    <button onClick={() => { setStatus(a.id, a.status === 'done' ? 'todo' : 'done'); toast(a.status === 'done' ? 'Reopened' : 'Marked as done', 'success'); }} className={clsx('mt-0.5 transition', a.status === 'done' ? 'text-brand-600' : 'text-ink-300 hover:text-brand-600')} aria-label={a.status === 'done' ? 'Mark as not done' : 'Mark as done'}>
                      {a.status === 'done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <button onClick={() => jump(a.line)} className="min-w-0 flex-1 text-left" title="Jump to this moment in the recording">
                      <span className={clsx('block text-sm font-medium', a.status === 'done' ? 'text-ink-400 line-through' : 'text-ink-900')}>{a.title}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-ink-600"><PersonAvatar id={a.owner} size={20} /> {firstName(a.owner)}</span>
                        <DueChip due={a.due} status={a.status} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-600 group-hover:bg-brand-100 group-hover:text-brand-800"><Play size={10} fill="currentColor" /> {clock(meeting.lines[a.line].ts)}</span>
                      </span>
                    </button>
                    <button onClick={() => setActiveId(a.id)} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-200 hover:text-ink-800" aria-label={`Edit "${a.title}"`}><Pencil size={15} /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Transcript / Ask */}
        <div className={clsx('min-w-0 lg:col-span-3', tab === 'notes' && 'hidden lg:block')}>
          <div className="card flex h-[68vh] flex-col overflow-hidden lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <div className="hidden shrink-0 border-b border-ink-200 px-2 pt-2 lg:flex">
              {([['transcript', 'Transcript', MessageSquareQuote], ['ask', 'Ask this meeting', Sparkles]] as const).map(([t, label, Icon]) => (
                <button key={t} onClick={() => setTab(t)} className={clsx('flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition', (tab === t || (t === 'transcript' && tab === 'notes')) ? 'border-brand-600 text-brand-800' : 'border-transparent text-ink-500 hover:text-ink-800')}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {tab === 'ask' ? (
              <AskPanel meeting={meeting} onCite={(l) => setSource(l)} />
            ) : (
              <>
                <div className="shrink-0 border-b border-ink-100 p-3">
                  <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input className="input py-2 pl-9 pr-9 text-[13px]" placeholder="Search this transcript" value={tq} onChange={(e) => setTq(e.target.value)} aria-label="Search this transcript" />
                    {tq && <button onClick={() => setTq('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" aria-label="Clear"><X size={15} /></button>}
                  </div>
                </div>
                <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto p-2">
                  {loading ? (
                    <div className="space-y-3 p-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
                  ) : filtered.length === 0 ? (
                    <EmptyState icon={<Search size={22} />} title="No matches in this transcript" body="Try another word, or ask the meeting a question instead." action={<button className="btn-ghost" onClick={() => setTab('ask')}>Ask this meeting</button>} />
                  ) : (
                    filtered.map(({ l, i }) => (
                      <div key={i} data-line={i} className={clsx('flex gap-3 rounded-lg border-l-[3px] px-3 py-2.5 transition-colors', cur === i ? 'border-brand-600 bg-brand-50' : 'border-transparent hover:bg-ink-50', flash?.line === i && 'flash')}>
                        <button onClick={() => jump(i)} className="mt-0.5 h-fit shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-ink-600 hover:bg-brand-100 hover:text-brand-800" title="Play from here">{clock(l.ts)}</button>
                        <PersonAvatar id={l.who} size={28} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink-700">{person(l.who).name}</p>
                          <p className="text-sm leading-relaxed text-ink-800"><Highlight text={l.text} query={tq} /></p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ActionModal action={active} onClose={() => setActiveId(null)} onJump={(a) => jump(a.line)} />
      <AddActionModal open={addOpen} onClose={() => setAddOpen(false)} meetingId={meeting.id} line={Math.max(0, cur)} />
      <ShareModal meeting={meeting} actions={allActions} open={shareOpen} onClose={() => setShareOpen(false)} />
      <SourceModal meeting={meeting} line={source} onClose={() => setSource(null)} onPlay={(l) => jump(l)} onShow={(l) => jump(l, false)} />
    </div>
  );
}
