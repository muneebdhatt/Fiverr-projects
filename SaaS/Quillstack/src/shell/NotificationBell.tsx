'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import clsx from 'clsx';
import { useApp, useMyEmail } from '@/lib/store';
import { ago } from '@/lib/time';
import { useClickOutside } from './ui';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const email = useMyEmail();
  const all = useApp((s) => s.notifications);
  const { markRead, markAllRead } = useApp();
  const router = useRouter();
  const mine = all.filter((n) => n.to === email).slice(0, 12);
  const unread = all.filter((n) => n.to === email && !n.read).length;

  return (
    <div ref={ref} className="relative" data-tour="bell">
      <button onClick={() => setOpen(!open)} className="relative rounded-full p-2 text-ink-600 hover:bg-ink-100" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell size={20} />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">{unread}</span>}
      </button>
      {open && (
        <div className="pop absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-ink-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <button className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-40" disabled={unread === 0} onClick={() => email && markAllRead(email)}>Mark all as read</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {mine.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500"><BellOff size={18} /></span>
                <p className="text-sm font-medium">You are all caught up</p>
                <p className="mt-0.5 text-xs text-ink-500">New invitations and alerts will show up here.</p>
              </div>
            ) : (
              mine.map((n) => (
                <button key={n.id} onClick={() => { markRead(n.id); setOpen(false); if (n.href) router.push(n.href); }}
                  className={clsx('flex w-full gap-3 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50', !n.read && 'bg-brand-50/50')}>
                  <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand-500')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-900">{n.title}</span>
                    <span className="block text-xs text-ink-600">{n.body}</span>
                    <span className="mt-0.5 block text-xs text-ink-400">{ago((Date.now() - n.at) / 60000)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
