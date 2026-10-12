'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, CheckCircle2, Circle, Clock, ListTodo, Mic } from 'lucide-react';
import { ACCOUNTS, firstName } from '@/data';
import { useActions, useApp, useMeetings, useMinutesUsed } from '@/lib/store';
import { firstSentence, meetingWhen, minsLabel } from '@/lib/util';
import { AvatarStack, Chip, DueChip, ProgressBar, Skeleton, useLoading } from '@/shell/ui';

export default function HomePage() {
  const role = useApp((s) => s.role)!;
  const limit = useApp((s) => s.limit);
  const setStatus = useApp((s) => s.setStatus);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const meetings = useMeetings();
  const actions = useActions();
  const used = useMinutesUsed();
  const loading = useLoading('home');

  const me = ACCOUNTS[role].id;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const open = actions.filter((a) => a.status !== 'done');
  const overdue = open.filter((a) => a.due < 0);
  const mine = open.filter((a) => a.owner === me).sort((a, b) => a.due - b.due);
  const week = meetings.filter((m) => m.day > -7);
  const recent = meetings.slice(0, 5);

  const stats = [
    { label: 'Meetings this week', value: week.length, note: `${minsLabel(week.reduce((n, m) => n + m.mins, 0))} recorded`, Icon: CalendarDays },
    { label: 'Open actions', value: open.length, note: overdue.length ? `${overdue.length} overdue` : 'All on track', Icon: ListTodo },
    { label: 'Yours, due this week', value: mine.filter((a) => a.due <= 7).length, note: `${mine.length} open in total`, Icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">{greeting}, {firstName(me)}</h1>
          <p className="mt-1 text-ink-500">{week.length} meetings this week, {open.length} actions still open across the team.</p>
        </div>
        <Link href="/record" className="btn-primary hidden sm:inline-flex"><Mic size={18} /> New recording</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)
          : (
            <>
              {stats.map(({ label, value, note, Icon }) => (
                <div key={label} className="card p-5">
                  <div className="flex items-center justify-between text-ink-500"><span className="text-sm font-medium">{label}</span><Icon size={18} /></div>
                  <p className="mt-2 font-display text-4xl font-semibold text-ink-900">{value}</p>
                  <p className={`mt-1 text-xs ${note.includes('overdue') ? 'font-semibold text-red-700' : 'text-ink-500'}`}>{note}</p>
                </div>
              ))}
              <div className="card p-5">
                <div className="flex items-center justify-between text-ink-500"><span className="text-sm font-medium">Recording minutes</span><Clock size={18} /></div>
                <p className="mt-2 font-display text-4xl font-semibold text-ink-900">{used}<span className="text-lg font-normal text-ink-400"> / {limit}</span></p>
                <ProgressBar value={used} max={limit} className="mt-3 h-2" warn={used / limit >= 0.9} />
              </div>
            </>
          )}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent meetings</h2>
            <Link href="/meetings" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">All meetings <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)
              : recent.map((m) => {
                  const mine = actions.filter((a) => a.meeting === m.id);
                  const left = mine.filter((a) => a.status !== 'done').length;
                  return (
                    <Link key={m.id} href={`/meetings/${m.id}`} className="card block p-4 transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-ink-900">{m.title}</h3>
                          <p className="text-xs text-ink-500">{meetingWhen(m.day, m.time)} · {minsLabel(m.mins)} · recorded by {firstName(m.by)}</p>
                        </div>
                        <Chip tone="outline" className="shrink-0">{m.tag}</Chip>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-600">{firstSentence(m.summary)}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <AvatarStack ids={m.who} size={26} />
                        <span className="text-xs font-medium text-ink-500">{mine.length} actions · <span className={left ? 'text-brand-700' : ''}>{left} open</span></span>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your actions</h2>
            <Link href="/actions" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Action board <ArrowRight size={14} /></Link>
          </div>
          <div className="card divide-y divide-ink-100">
            {loading ? (
              Array.from({ length: 4 }, (_, i) => <div key={i} className="p-4"><Skeleton className="h-10" /></div>)
            ) : mine.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-500">Nothing waiting on you. Nice.</div>
            ) : (
              mine.slice(0, 6).map((a) => {
                const m = meetings.find((x) => x.id === a.meeting)!;
                return (
                  <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-ink-50">
                    <button onClick={() => { setStatus(a.id, 'done'); toast('Marked as done', 'success'); }} className="mt-0.5 text-ink-300 transition hover:text-brand-600" aria-label={`Mark "${a.title}" as done`}>
                      <Circle size={20} />
                    </button>
                    <button onClick={() => router.push(`/meetings/${m.id}?line=${a.line}`)} className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-medium text-ink-900">{a.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2"><DueChip due={a.due} status={a.status} /><span className="truncate text-xs text-ink-500">{m.title}</span></span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <p className="mt-3 text-xs text-ink-400">Click an action to jump to the moment it was agreed.</p>
        </section>
      </div>
    </div>
  );
}
