'use client';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { AlertTriangle, Bell, CheckCheck, DoorOpen, Info, UserPlus } from 'lucide-react';
import { useApp, useNow } from '@/lib/store';
import { agoTs } from '@/lib/time';
import { Menu } from './ui';

const ICON = {
  arrival: <UserPlus size={15} />,
  alert: <AlertTriangle size={15} />,
  room: <DoorOpen size={15} />,
  info: <Info size={15} />,
} as const;

export function NotificationBell() {
  const notifs = useApp((s) => s.notifs);
  const role = useApp((s) => s.role);
  const readNotifs = useApp((s) => s.readNotifs);
  const setFocus = useApp((s) => s.setFocus);
  const router = useRouter();
  const now = useNow(20000);
  const mine = notifs.filter((n) => n.for.includes(role)).sort((a, b) => b.ts - a.ts).slice(0, 12);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <div data-tour="bell">
      <Menu
        width="w-[340px] max-w-[92vw]"
        trigger={(open) => (
          <span className={clsx('relative flex h-10 w-10 items-center justify-center rounded-full border transition', open ? 'border-pine-400 bg-pine-50' : 'border-bone-300 bg-snow hover:bg-bone-200')}>
            <Bell size={17} className="text-bark-600" />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
            <span className="sr-only">Notifications</span>
          </span>
        )}
      >
        {(close) => (
          <div>
            <div className="flex items-center justify-between px-3 pb-2 pt-2">
              <p className="text-sm font-bold text-bark-800">Notifications</p>
              <button className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline disabled:opacity-40" disabled={unread === 0} onClick={() => readNotifs()}><CheckCheck size={13} />Mark all as read</button>
            </div>
            {mine.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-bark-400">You are all caught up.</p>
            ) : (
              <ul className="scroll-thin max-h-[360px] overflow-y-auto">
                {mine.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        close();
                        if (n.patientId) {
                          setFocus(n.patientId);
                          router.push('/queue');
                        }
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-bone-200"
                    >
                      <span className={clsx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.kind === 'alert' ? 'bg-coral-100 text-coral-700' : 'bg-pine-100 text-accent')}>{ICON[n.kind]}</span>
                      <span className="min-w-0 flex-1">
                        <span className={clsx('block text-sm leading-snug', n.read ? 'text-bark-600' : 'font-semibold text-bark-900')}>{n.text}</span>
                        <span className="mt-0.5 block text-xs text-bark-400">{agoTs(n.ts, now)}</span>
                      </span>
                      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-coral-500" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Menu>
    </div>
  );
}
