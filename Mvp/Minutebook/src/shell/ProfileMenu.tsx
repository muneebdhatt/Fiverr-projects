'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LogOut } from 'lucide-react';
import { ACCOUNTS, person } from '@/data';
import { useApp, type Role } from '@/lib/store';
import { PersonAvatar, useClickOutside } from './ui';

export function ProfileMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const router = useRouter();
  const switchTo = useApp((s) => s.switchTo);
  const signOut = useApp((s) => s.signOut);
  const me = person(ACCOUNTS[role].id);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full ring-brand-200 transition hover:ring-4" aria-label="Open profile menu" aria-expanded={open}>
        <PersonAvatar id={me.id} size={36} />
      </button>
      {open && (
        <div className="pop absolute right-0 top-12 z-40 w-72 rounded-xl border border-ink-200 bg-white p-1.5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-ink-100 px-3 py-3">
            <PersonAvatar id={me.id} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{me.name}</p>
              <p className="truncate text-xs text-ink-500">{me.email}</p>
            </div>
          </div>
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Switch account</p>
          {(['member', 'admin'] as const).map((r) => {
            const p = person(ACCOUNTS[r].id);
            const on = r === role;
            return (
              <button
                key={r}
                onClick={() => {
                  setOpen(false);
                  if (on) return;
                  switchTo(r);
                  router.push('/home');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-50"
              >
                <PersonAvatar id={p.id} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-900">{p.name}</span>
                  <span className="block truncate text-xs text-ink-500">{ACCOUNTS[r].label} · {p.title}</span>
                </span>
                {on && <Check size={16} className="text-brand-600" />}
              </button>
            );
          })}
          <div className="my-1 border-t border-ink-100" />
          <button onClick={() => { signOut(); router.push('/'); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink-800 hover:bg-ink-50">
            <LogOut size={16} className="text-ink-500" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
