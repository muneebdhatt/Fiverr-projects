'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { ago } from '@/lib/time';
import { useNotes } from '@/lib/notifications';
import { useSession } from './session';

export function NotificationBell() {
  const router = useRouter();
  const uid = useSession((s) => s.me?.id);
  const notes = useNotes((s) => (uid ? s.byUser[uid] : undefined)) ?? [];
  const { markAllRead, markRead } = useNotes();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notes.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref} data-tour="bell">
      <button aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => setOpen(!open)} className="relative rounded-md p-2.5 text-ink-600 hover:bg-ink-100">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="card pop fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <div className="text-sm font-semibold">Notifications</div>
            <button disabled={!unread || !uid} onClick={() => uid && markAllRead(uid)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline disabled:opacity-40"><CheckCheck className="h-3.5 w-3.5" /> Mark all read</button>
          </div>
          <ul className="max-h-96 divide-y divide-ink-100 overflow-y-auto">
            {notes.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-500">You&apos;re all caught up.</li>}
            {notes.map((n) => (
              <li key={n.id}>
                <button onClick={() => { if (uid) markRead(uid, n.id); setOpen(false); if (n.href) router.push(n.href); }} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ink-50">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand-500'}`} />
                  <span className="min-w-0"><span className="block text-sm leading-snug">{n.text}</span><span className="text-xs text-ink-500">{ago((Date.now() - n.at) / 60000)}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
