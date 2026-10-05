'use client';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { BUSINESSES, PRICE, workerById } from '@/data/seed';
import { STOP_IDX, fillAtFor, winnerIdx } from '@/lib/script';
import { useApp } from '@/lib/store';
import { ago } from '@/lib/time';
import { useClickOutside } from './ui';

interface Note { id: string; text: string; href: string; mins: number }

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const router = useRouter();
  const persona = useApp((s) => s.persona);
  const broadcast = useApp((s) => s.broadcast);
  const fixed = useApp((s) => s.billingFixed);
  const read = useApp((s) => s.notifRead);
  const readNotifs = useApp((s) => s.readNotifs);

  const notes = useMemo<Note[]>(() => {
    if (persona === 'business') {
      const list: Note[] = [];
      if (broadcast?.finalized) {
        const names = winnerIdx(broadcast.positions).map((i) => workerById(broadcast.workerIds[i])?.name).filter(Boolean);
        list.push({ id: `n-fill-${broadcast.shiftId}`, text: `${names.join(' and ')} said YES and filled your shift in ${(fillAtFor(broadcast.positions) / 1000).toFixed(1)} seconds`, href: '/shifts/live', mins: 0 });
        list.push({ id: `n-stop-${broadcast.shiftId}`, text: `${workerById(broadcast.workerIds[STOP_IDX])?.name} replied STOP and was unsubscribed`, href: '/shifts/live', mins: 0 });
      }
      list.push(
        { id: 'n-b1', text: `Invoice INV-2041 for $${PRICE}.00 was paid`, href: '/billing', mins: 2 * 1440 },
        { id: 'n-b2', text: 'Your Bartender shift on Friday was rated 5 stars', href: '/shifts', mins: 3 * 1440 + 90 },
        { id: 'n-b3', text: 'Weekly summary: 4 shifts filled, average 3 minutes to fill', href: '/shifts', mins: 6 * 1440 },
      );
      return list;
    }
    if (persona === 'worker') {
      return [
        { id: 'n-w1', text: 'Cedar & Pine Events sent you a Bartender offer for tonight', href: '/offers', mins: 4 },
        { id: 'n-w2', text: 'Larkspur Kitchen sent you a Line Cook offer for tomorrow', href: '/offers', mins: 120 },
        { id: 'n-w3', text: 'You earned $327 over your last 3 shifts', href: '/earnings', mins: 1440 },
        { id: 'n-w4', text: 'Your ServSafe certificate was verified', href: '/profile', mins: 5 * 1440 },
      ];
    }
    const list: Note[] = [];
    if (!fixed.b8) list.push({ id: 'n-a1', text: 'Payment failed for Juniper Street Cafe', href: '/admin', mins: 180 });
    list.push(
      { id: 'n-a2', text: '2 workers replied STOP this week', href: '/admin', mins: 1440 },
      { id: 'n-a3', text: `Monthly recurring revenue reached $${(BUSINESSES.length - 1) * PRICE}`, href: '/admin', mins: 3 * 1440 },
    );
    return list;
  }, [persona, broadcast, fixed]);

  const unread = notes.filter((n) => !read[n.id]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900" aria-label="Notifications">
        <Bell size={20} />
        {unread.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{unread.length}</span>}
      </button>
      {open && (
        <div className="pop absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-ink-200 bg-white text-ink-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button disabled={unread.length === 0} onClick={() => readNotifs(notes.map((n) => n.id))} className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline disabled:text-ink-400 disabled:no-underline"><CheckCheck size={14} />Mark all read</button>
          </div>
          <ul className="max-h-96 divide-y divide-ink-100 overflow-y-auto">
            {notes.map((n) => (
              <li key={n.id}>
                <button onClick={() => { readNotifs([n.id]); setOpen(false); router.push(n.href); }} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ink-50">
                  <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', read[n.id] ? 'bg-transparent' : 'bg-brand-500')} />
                  <span className="min-w-0 flex-1"><span className={clsx('block text-sm', read[n.id] ? 'text-ink-600' : 'font-medium text-ink-900')}>{n.text}</span><span className="text-xs text-ink-500">{ago(n.mins)}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
