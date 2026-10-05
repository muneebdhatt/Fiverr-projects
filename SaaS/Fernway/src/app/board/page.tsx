'use client';
import { useMemo } from 'react';
import clsx from 'clsx';
import { DoorOpen, Megaphone } from 'lucide-react';
import { ROOMS } from '@/data/seed';
import { firstLast, useApp, useHydrated, useNow } from '@/lib/store';
import { clock } from '@/lib/time';
import { Frond } from '@/shell/FernArt';
import { Logo, Skeleton } from '@/shell/ui';

/** Waiting-room screen. Shows first names only and never says why anyone is here. */
export default function BoardPage() {
  const hydrated = useHydrated();
  const patients = useApp((s) => s.patients);
  const alerts = useApp((s) => s.alerts);
  const roomOf = useApp((s) => s.roomOf);
  const now = useNow(10000);

  const calling = useMemo(
    () => patients.filter((p) => alerts[p.id]?.desk && p.status !== 'Seen').sort((a, b) => (alerts[b.id]!.desk ?? 0) - (alerts[a.id]!.desk ?? 0)),
    [patients, alerts],
  );
  const next = useMemo(() => patients.filter((p) => p.status === 'Waiting').sort((a, b) => a.arrivedAt - b.arrivedAt).slice(0, 6), [patients]);
  const withTeam = patients.filter((p) => roomOf[p.id]);

  if (!hydrated) {
    return <div className="p-10"><Skeleton className="h-[70vh] w-full" /></div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <Frond className="pointer-events-none absolute -bottom-10 -right-10 h-[420px] rotate-[-16deg]" color="rgb(var(--fern-1))" />
      <header className="relative z-10 flex items-center justify-between px-8 py-6 sm:px-12">
        <div className="flex items-center gap-4">
          <Logo size={42} />
          <span className="hidden border-l border-bone-300 pl-4 text-base font-semibold text-bark-500 sm:block">Alder Street Health</span>
        </div>
        <p className="font-display text-5xl tabular-nums text-heading">{clock(now)}</p>
      </header>

      <main className="relative z-10 grid flex-1 gap-8 px-8 pb-8 sm:px-12 lg:grid-cols-[1.5fr_1fr]">
        <section className="flex flex-col gap-6">
          <div>
            <p className="eyebrow flex items-center gap-2"><Megaphone size={14} />Now calling</p>
            {calling.length === 0 ? (
              <div className="card mt-3 flex min-h-[260px] flex-col items-center justify-center px-8 text-center">
                <p className="font-display text-6xl leading-tight text-heading">Please take a seat</p>
                <p className="mt-3 text-xl text-bark-500">We will call your name as soon as we are ready for you.</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-4">
                {calling.slice(0, 3).map((p, i) => (
                  <li key={p.id} className={clsx('flex items-center gap-6 rounded-3xl bg-pine-700 px-8 py-7 text-white shadow-lift', i === 0 && 'animate-ring')}>
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15"><Megaphone size={30} /></span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-6xl leading-none">{firstLast(p.name)}</p>
                      <p className="mt-2 text-2xl text-[#f5e8c4]">{roomOf[p.id] ? `Please go to ${ROOMS.find((r) => r.id === roomOf[p.id])?.name}` : 'Please come to the front desk'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="eyebrow flex items-center gap-2"><DoorOpen size={14} />With the care team</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {ROOMS.map((r) => {
                const occ = withTeam.find((p) => roomOf[p.id] === r.id);
                return (
                  <li key={r.id} className={clsx('flex items-center justify-between rounded-2xl border px-5 py-4', occ ? 'border-tide-100 bg-tide-50' : 'border-dashed border-bone-300')}>
                    <span className="text-lg font-bold text-bark-800">{r.name}</span>
                    <span className={clsx('text-lg', occ ? 'font-semibold text-tide-700' : 'text-bark-400')}>{occ ? firstLast(occ.name) : 'Free'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <aside>
          <p className="eyebrow">Up next</p>
          <ol className="card mt-3 divide-y divide-bone-200 overflow-hidden">
            {next.length === 0 && <li className="px-6 py-10 text-center text-lg text-bark-500">Nobody is waiting.</li>}
            {next.map((p, i) => (
              <li key={p.id} className="flex items-center gap-4 px-6 py-4">
                <span className={clsx('flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold', i === 0 ? 'bg-pine-700 text-white' : 'bg-bone-200 text-bark-600')}>{i + 1}</span>
                <span className="flex-1 truncate text-2xl font-semibold text-bark-900">{firstLast(p.name)}</span>
                <span className="text-lg text-bark-500">about {Math.max(5, (i + 1) * 5)} min</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-bark-400">Times are estimates and change as people are seen. Please tell the front desk if you need to step out.</p>
        </aside>
      </main>
    </div>
  );
}
