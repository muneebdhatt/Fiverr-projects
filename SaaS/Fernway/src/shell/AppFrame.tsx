'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ChartColumn, ChevronDown, Check, ClipboardList, Compass, ListChecks, LogOut, Monitor, Moon, RefreshCw, ScrollText, Tv, Type, Users } from 'lucide-react';
import { PERSONAS } from '@/data/seed';
import type { Role } from '@/data/types';
import { useUiPrefs } from '@/lib/theme';
import { personaOf, useApp, useHydrated } from '@/lib/store';
import { Avatar, Logo, Menu, Skeleton, Switch, Toasts } from './ui';
import { NotificationBell } from './Notifications';
import { Tour } from './Tour';

const NAV: { href: string; label: string; icon: React.ReactNode; roles: Role[] }[] = [
  { href: '/queue', label: 'Queue', icon: <ClipboardList size={16} />, roles: ['receptionist', 'clinician', 'admin'] },
  { href: '/insights', label: 'Insights', icon: <ChartColumn size={16} />, roles: ['admin'] },
  { href: '/audit', label: 'Audit trail', icon: <ScrollText size={16} />, roles: ['admin'] },
  { href: '/questions', label: 'Question sets', icon: <ListChecks size={16} />, roles: ['admin'] },
  { href: '/staff', label: 'Staff', icon: <Users size={16} />, roles: ['admin'] },
];

const ROLE_LABEL: Record<Role, string> = { receptionist: 'Receptionist', clinician: 'Clinician', admin: 'Admin' };

export function AppFrame({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const authed = useApp((s) => s.authed);
  const role = useApp((s) => s.role);
  const switchRole = useApp((s) => s.switchRole);
  const logout = useApp((s) => s.logout);
  const toast = useApp((s) => s.toast);
  const setTour = useApp((s) => s.setTour);
  const router = useRouter();
  const path = usePathname();
  const { prefs, set: setPrefs } = useUiPrefs();

  useEffect(() => {
    if (hydrated && !authed) router.replace('/');
  }, [hydrated, authed, router]);

  useEffect(() => {
    if (!hydrated || !authed) return;
    const item = NAV.find((n) => path.startsWith(n.href));
    if (item && !item.roles.includes(role)) router.replace('/queue');
  }, [hydrated, authed, role, path, router]);

  if (!hydrated || !authed) {
    return (
      <div className="min-h-screen">
        <div className="h-16 border-b border-bone-300 bg-snow" />
        <div className="mx-auto max-w-[1400px] space-y-4 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const me = personaOf(role);
  const items = NAV.filter((n) => n.roles.includes(role));

  const navLinks = (
    <>
      {items.map((n) => {
        const on = path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} className={clsx('flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition', on ? 'bg-pine-100 text-heading' : 'text-bark-500 hover:bg-bone-200 hover:text-bark-800')}>
            {n.icon}{n.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-bone-300 bg-snow/90 backdrop-blur lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-bone-300 px-5">
          <Link href="/queue" aria-label="Fernway home"><Logo /></Link>
        </div>
        <nav data-tour="nav" className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
          <p className="eyebrow px-3.5 pb-2">Workspace</p>
          {navLinks}
        </nav>
        <div className="space-y-1 border-t border-bone-300 p-3">
          <Link href="/kiosk" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-bark-500 transition hover:bg-bone-200 hover:text-bark-800"><Monitor size={16} />Check-in screen</Link>
          <a href="/board" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-bark-500 transition hover:bg-bone-200 hover:text-bark-800"><Tv size={16} />Waiting-room screen</a>
          <p className="px-3.5 pt-2 text-[11px] font-semibold text-bark-400">Alder Street Health</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-60">
      <header className="sticky top-0 z-30 border-b border-bone-300 bg-snow/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link href="/queue" aria-label="Fernway home" className="lg:hidden"><Logo /></Link>
          <nav className="no-scrollbar -mx-1 hidden flex-1 items-center gap-1 overflow-x-auto sm:flex lg:hidden" aria-label="Main">
            {items.map((n) => {
              const on = path.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={clsx('flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition', on ? 'bg-pine-100 text-heading' : 'text-bark-500 hover:bg-bone-200 hover:text-bark-800')}>
                  {n.icon}{n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/kiosk" className="btn-ghost hidden sm:inline-flex lg:hidden"><Monitor size={16} />Check-in screen</Link>
            <NotificationBell />
            <div data-tour="profile">
              <Menu
                width="w-72"
                trigger={(open) => (
                  <span className={clsx('flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 transition', open ? 'border-pine-400 bg-pine-50' : 'border-bone-300 bg-snow hover:bg-bone-200')}>
                    <Avatar name={me.name} size={32} />
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-sm font-bold text-bark-800">{me.name}</span>
                      <span className="block text-[11px] font-semibold text-bark-400">{ROLE_LABEL[role]}</span>
                    </span>
                    <ChevronDown size={14} className="text-bark-400" />
                  </span>
                )}
              >
                {(close) => (
                  <div>
                    <div className="px-3 pb-2 pt-2">
                      <p className="text-sm font-bold text-bark-800">{me.name}</p>
                      <p className="text-xs text-bark-400">{me.email}</p>
                    </div>
                    <p className="eyebrow px-3 pb-1 pt-2"><RefreshCw size={11} className="mr-1 inline" />Switch account</p>
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          close();
                          if (p.id !== role) {
                            switchRole(p.id);
                            router.push('/queue');
                            toast(`Signed in as ${p.name}`);
                          }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-bone-200"
                      >
                        <Avatar name={p.name} size={28} />
                        <span className="flex-1 leading-tight">
                          <span className="block text-sm font-semibold text-bark-800">{p.name}</span>
                          <span className="block text-xs text-bark-400">{ROLE_LABEL[p.id]}</span>
                        </span>
                        {p.id === role && <Check size={15} className="text-accent" />}
                      </button>
                    ))}
                    <div className="my-1 border-t border-bone-200" />
                    <p className="eyebrow px-3 pb-1 pt-2">Display</p>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-bark-700"><Moon size={16} /><span className="flex-1">Dark mode</span><Switch on={prefs.dark} label="Dark mode" onChange={(v) => setPrefs({ dark: v })} /></div>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-bark-700"><Type size={16} /><span className="flex-1">Larger text</span><Switch on={prefs.large} label="Larger text" onChange={(v) => setPrefs({ large: v })} /></div>
                    <div className="my-1 border-t border-bone-200" />
                    <button onClick={() => { close(); if (path !== '/queue') router.push('/queue'); setTour(true); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-bark-700 hover:bg-bone-200"><Compass size={16} />Take a tour</button>
                    <a href="/board" target="_blank" rel="noreferrer" onClick={close} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-bark-700 hover:bg-bone-200"><Tv size={16} />Open waiting-room screen</a>
                    <Link href="/kiosk" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-bark-700 hover:bg-bone-200 sm:hidden"><Monitor size={16} />Check-in screen</Link>
                    <button
                      onClick={() => {
                        close();
                        logout();
                        router.replace('/');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-bark-700 hover:bg-bone-200"
                    >
                      <LogOut size={16} />Sign out
                    </button>
                  </div>
                )}
              </Menu>
            </div>
          </div>
        </div>
        {/* phone nav */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-bone-200 px-3 py-2 sm:hidden" aria-label="Main">
          {items.map((n) => {
            const on = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={clsx('flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold', on ? 'bg-pine-100 text-heading' : 'text-bark-500')}>
                {n.icon}{n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main key={role} className="mx-auto w-full max-w-[1400px] flex-1 animate-rise px-4 py-6 sm:px-6">{children}</main>
      </div>
      <Toasts />
      <Tour />
    </div>
  );
}
