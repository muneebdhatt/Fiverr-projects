'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Mic, Search, SearchX } from 'lucide-react';
import { PEOPLE, firstName } from '@/data';
import { useActions, useMeetings } from '@/lib/store';
import { coverage, firstSentence, meetingWhen, minsLabel } from '@/lib/util';
import { AvatarStack, Chip, EmptyState, Highlight, Skeleton, useLoading } from '@/shell/ui';

export default function MeetingsPage() {
  const meetings = useMeetings();
  const actions = useActions();
  const loading = useLoading('meetings');
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('All');
  const [who, setWho] = useState('all');
  const [sort, setSort] = useState<'new' | 'old' | 'long'>('new');

  const tags = ['All', ...Array.from(new Set(meetings.map((m) => m.tag)))];
  const list = useMemo(() => {
    const out = meetings.filter((m) => (tag === 'All' || m.tag === tag) && (who === 'all' || m.who.includes(who as never)) && (!q.trim() || coverage(q, `${m.title} ${m.tag} ${m.summary} ${m.lines.map((l) => l.text).join(' ')}`) >= 0.99));
    return [...out].sort((a, b) => (sort === 'old' ? a.day - b.day : sort === 'long' ? b.mins - a.mins : b.day - a.day));
  }, [meetings, q, tag, who, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Meetings</h1>
          <p className="mt-1 text-ink-500">{meetings.length} recorded · {actions.length} action items</p>
        </div>
        <Link href="/record" className="btn-primary"><Mic size={18} /> New recording</Link>
      </div>

      <div className="card space-y-3 p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Filter by title, topic or something that was said" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter meetings" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1">
            {tags.map((t) => (
              <button key={t} onClick={() => setTag(t)} className={clsx('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition', tag === t ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200')}>{t}</button>
            ))}
          </div>
          <select className="input w-auto py-2" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by attendee">
            <option value="all">Everyone</option>
            {PEOPLE.map((p) => <option key={p.id} value={p.id}>{firstName(p.id)}</option>)}
          </select>
          <select className="input w-auto py-2" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort meetings">
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="long">Longest first</option>
          </select>
        </div>
      </div>

      <div className="card divide-y divide-ink-100 overflow-hidden">
        {loading ? (
          Array.from({ length: 6 }, (_, i) => <div key={i} className="p-5"><Skeleton className="h-14" /></div>)
        ) : list.length === 0 ? (
          <EmptyState icon={<SearchX size={22} />} title="No meetings match" body="Try a different word, or clear the filters to see every recording." action={<button className="btn-ghost" onClick={() => { setQ(''); setTag('All'); setWho('all'); }}>Clear filters</button>} />
        ) : (
          list.map((m) => {
            const mine = actions.filter((a) => a.meeting === m.id);
            const left = mine.filter((a) => a.status !== 'done').length;
            return (
              <Link key={m.id} href={`/meetings/${m.id}`} className="flex flex-col gap-3 p-4 transition hover:bg-ink-50 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-ink-900"><Highlight text={m.title} query={q} /></h3>
                    <Chip tone="outline">{m.tag}</Chip>
                    {m.id === 'latest-recording' && <Chip tone="brand">New</Chip>}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{meetingWhen(m.day, m.time)} · {minsLabel(m.mins)}</p>
                  <p className="mt-1.5 line-clamp-1 text-sm text-ink-600">{firstSentence(m.summary)}</p>
                </div>
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <AvatarStack ids={m.who} size={28} />
                  <span className="w-24 text-right text-xs font-medium text-ink-500">{mine.length} actions<br /><span className={left ? 'text-brand-700' : ''}>{left} open</span></span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
