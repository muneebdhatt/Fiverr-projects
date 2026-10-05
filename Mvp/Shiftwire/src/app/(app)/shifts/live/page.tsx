'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, CheckCircle2, Flame, Radio, RotateCcw, Send, Timer, UserX } from 'lucide-react';
import { WORKERS } from '@/data/seed';
import { dayLabel, timeRange } from '@/lib/format';
import { buildFeed, doneAtFor, fillAtFor, spotsFilledAt, stateAt, winnerIdx, type WorkerState } from '@/lib/script';
import { useApp } from '@/lib/store';
import { Avatar, Chip, EmptyState, PageHeader } from '@/shell/ui';

const TONE: Record<WorkerState, 'gray' | 'amber' | 'green' | 'red' | 'teal'> = {
  Delivered: 'gray',
  Declined: 'gray',
  'Opted out': 'red',
  'Filled the shift': 'green',
  'Too late': 'amber',
  'Told shift filled': 'teal',
};
const RULE_TEXT = { none: '', rate: 'raise the rate by $3/hr', radius: 'widen the search to 10 miles', both: 'raise the rate by $3/hr and widen the search to 10 miles' };

export default function LiveShiftPage() {
  const broadcast = useApp((s) => s.broadcast);
  const shift = useApp((s) => s.extraShifts.find((x) => x.id === s.broadcast?.shiftId));
  const finalize = useApp((s) => s.finalizeBroadcast);
  const replay = useApp((s) => s.replayBroadcast);
  const toast = useApp((s) => s.toast);
  const [now, setNow] = useState(() => Date.now());
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 150);
    return () => clearInterval(t);
  }, []);

  const positions = broadcast?.positions ?? 1;
  const feed = useMemo(() => buildFeed(positions), [positions]);
  const fillAt = fillAtFor(positions);
  const elapsed = broadcast ? Math.min(now - broadcast.startedAt, doneAtFor(positions) + 1000) : 0;
  useEffect(() => {
    if (broadcast && elapsed >= fillAt) finalize();
  }, [broadcast, elapsed, fillAt, finalize]);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [Math.floor(elapsed / 300)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!broadcast || !shift) {
    return (
      <div>
        <PageHeader title="Live shift" />
        <div className="card"><EmptyState icon={<Radio size={22} />} title="No shift is being broadcast" body="Post a shift and the replies will appear here in real time." action={<Link href="/post-shift" prefetch={false} className="btn-primary">Post a shift</Link>} /></div>
      </div>
    );
  }

  const workers = broadcast.workerIds.map((id) => WORKERS.find((w) => w.id === id)!);
  const visible = feed.filter((e) => e.t <= elapsed);
  const filled = elapsed >= fillAt;
  const spots = spotsFilledAt(positions, elapsed);
  const winners = winnerIdx(positions).map((i) => workers[i]);
  const replies = visible.filter((e) => e.dir === 'in').length;
  const declined = workers.filter((_, i) => stateAt(i, elapsed, positions) === 'Declined').length;
  const optedOutCount = workers.filter((_, i) => stateAt(i, elapsed, positions) === 'Opted out').length;
  const countdown = Math.max(0, 120 - Math.floor(elapsed / 1000));
  const armed = !filled && shift.autoEscalate && shift.autoEscalate !== 'none';

  return (
    <div>
      <PageHeader
        title="Live shift"
        subtitle={`${positions > 1 ? `${positions} × ` : ''}${shift.role} · ${dayLabel(shift.dayOffset)} · ${timeRange(shift.start, shift.end)} · $${shift.rate}/hr`}
        actions={
          <>
            {shift.escalated && <Chip tone="amber">Escalated</Chip>}
            {filled ? <Chip tone="green">Filled</Chip> : <span className="chip bg-amber-50 text-amber-700"><span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />{positions > 1 ? `${spots} of ${positions} spots filled` : 'Waiting for replies'}</span>}
            <button className="btn-ghost" onClick={() => { replay(); toast('Broadcast restarted', 'info'); }}><RotateCcw size={15} />Replay</button>
          </>
        }
      />

      {armed && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          <Timer size={18} className="shrink-0 text-amber-600" />
          <p className="flex-1"><span className="font-semibold">Auto-escalation armed.</span> If nobody says YES in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}, Shiftwire will {RULE_TEXT[shift.autoEscalate!]} and text the next group.</p>
        </div>
      )}

      {filled && (
        <div className="pop mb-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={26} />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">{positions > 1 ? `All ${positions} spots filled` : `Filled by ${winners[0].name}`} in {(fillAt / 1000).toFixed(1)} seconds</p>
            <p className="text-sm text-emerald-800">{positions > 1 ? `${winners.map((w) => w.name).join(', ')} said YES first.` : `${winners[0].name} replied YES first.`} Everyone else has been told the shift is filled.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/shifts" prefetch={false} className="btn-ghost">View shift history</Link>
            <Link href="/post-shift" prefetch={false} className="btn-primary">Post another shift</Link>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Texts sent', workers.length],
          ['Replies', replies],
          ['Declined', declined],
          ['Opted out', optedOutCount],
        ].map(([label, value]) => (
          <div key={label} className="card p-4"><p className="text-xs font-medium text-ink-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card flex h-[34rem] flex-col lg:col-span-3">
          <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
            <Send size={16} className="text-brand-600" /><h2 className="text-sm font-semibold">Message feed</h2>
          </div>
          <div ref={feedRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4">
            <div className="mx-auto max-w-sm rounded-xl bg-white px-4 py-3 text-center text-xs text-ink-600 shadow-card">
              Broadcast sent to {workers.length} workers: “{positions > 1 ? `${positions} × ` : ''}{shift.role} needed {shift.dayOffset === 0 ? 'today' : dayLabel(shift.dayOffset)}, {timeRange(shift.start, shift.end)} at ${shift.rate}/hr. Reply YES to claim it.”
            </div>
            {visible.map((e, k) => {
              const w = workers[e.idx];
              const key = `${e.t}-${e.idx}-${k}`;
              if (e.dir === 'sys') {
                return <p key={key} className="pop flex items-center justify-center gap-1.5 text-center text-xs text-ink-500">{e.kind === 'reminder' && <BellRing size={12} />}{e.kind === 'filled' ? `“Shift filled” sent to ${w.name}` : `${w.name}: ${e.text}`}</p>;
              }
              const inbound = e.dir === 'in';
              return (
                <div key={key} className={clsx('pop flex items-end gap-2', inbound ? 'justify-start' : 'justify-end')}>
                  {inbound && <Avatar name={w.name} size={28} />}
                  <div className={clsx('max-w-[78%]', !inbound && 'text-right')}>
                    <p className="mb-0.5 px-1 text-[11px] text-ink-500">{inbound ? `${w.name} · ${w.phone}` : `To ${w.name}`}</p>
                    <div className={clsx('inline-block rounded-2xl px-3.5 py-2 text-left text-sm', inbound ? (e.kind === 'yes' ? 'rounded-bl-sm bg-emerald-600 font-semibold text-white' : e.kind === 'stop' ? 'rounded-bl-sm bg-red-100 font-semibold text-red-800' : 'rounded-bl-sm bg-white text-ink-800 shadow-card') : 'rounded-br-sm bg-brand-600 text-white')}>{e.text}</div>
                  </div>
                </div>
              );
            })}
            {!filled && <p className="px-1 text-xs text-ink-400"><span className="caret">Listening for replies</span></p>}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="border-b border-ink-100 px-4 py-3"><h2 className="text-sm font-semibold">Workers texted</h2></div>
          <ul className="divide-y divide-ink-100">
            {workers.map((w, i) => {
              const st = stateAt(i, elapsed, positions);
              return (
                <li key={w.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={w.name} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-ink-500">{w.distance} mi · {w.rating.toFixed(1)} rating · {w.reliability}% reliable</p>
                  </div>
                  {st === 'Opted out' && <UserX size={14} className="text-red-500" />}
                  <Chip tone={TONE[st]}>{st}</Chip>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
