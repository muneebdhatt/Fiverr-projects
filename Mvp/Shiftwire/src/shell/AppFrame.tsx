'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, Compass, CreditCard, Keyboard, LayoutGrid, LogOut, Menu, MessageSquareText, Moon, Radio, Repeat, Search, Send, ShieldCheck, Sun, UserRound, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PERSONAS, PRICE } from '@/data/seed';
import { useMe, useMeAccount } from '@/lib/me';
import { fillAtFor } from '@/lib/script';
import type { PersonaId } from '@/data/types';
import { dayLabel } from '@/lib/format';
import { homeFor, useApp, useReady } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { NotificationBell } from './Notifications';
import { ShortcutsModal, useShortcuts } from './Shortcuts';
import { Tour } from './Tour';
import { Avatar, Logo, PageSkeleton, Toaster, useClickOutside } from './ui';

interface NavItem { href: string; label: string; icon: ReactNode; roles: PersonaId[]; needsLive?: boolean }
const NAV: NavItem[] = [
  { href: '/shifts/live', label: 'Live shift', icon: <Radio size={16} />, roles: ['business'], needsLive: true },
  { href: '/shifts', label: 'Shifts', icon: <LayoutGrid size={16} />, roles: ['business'] },
  { href: '/post-shift', label: 'Post a shift', icon: <Send size={16} />, roles: ['business'] },
  { href: '/workers', label: 'Find workers', icon: <Search size={16} />, roles: ['business'] },
  { href: '/billing', label: 'Billing', icon: <CreditCard size={16} />, roles: ['business'] },
  { href: '/offers', label: 'Shift offers', icon: <MessageSquareText size={16} />, roles: ['worker'] },
  { href: '/earnings', label: 'Earnings', icon: <Wallet size={16} />, roles: ['worker'] },
  { href: '/profile', label: 'My profile', icon: <UserRound size={16} />, roles: ['worker'] },
  { href: '/admin', label: 'Overview', icon: <ShieldCheck size={16} />, roles: ['admin'] },
];

function matchNav(path: string) {
  const hits = NAV.filter((n) => path === n.href || path.startsWith(n.href + '/'));
  return hits.sort((a, b) => b.href.length - a.href.length)[0];
}
function allowed(path: string, persona: PersonaId) {
  const item = matchNav(path);
  return !item || item.roles.includes(persona);
}

const ICON_BTN = 'rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900';

export function AppFrame({ children }: { children: ReactNode }) {
  const ready = useReady();
  const authed = useApp((s) => s.authed);
  const persona = useApp((s) => s.persona);
  const path = (usePathname() || '/').replace(/\/$/, '') || '/';
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const broadcast = useApp((s) => s.broadcast);
  const finalize = useApp((s) => s.finalizeBroadcast);

  useEffect(() => { setDrawer(false); }, [path]);
  // A broadcast keeps running even if the user leaves the live screen.
  useEffect(() => {
    if (!broadcast || broadcast.finalized) return;
    const t = setTimeout(finalize, Math.max(0, broadcast.startedAt + fillAtFor(broadcast.positions) - Date.now()));
    return () => clearTimeout(t);
  }, [broadcast, finalize]);
  useEffect(() => {
    if (!ready) return;
    if (!authed) router.replace('/');
    else if (!allowed(path, persona)) router.replace(homeFor(persona));
  }, [ready, authed, persona, path, router]);

  if (!ready || !authed || !allowed(path, persona)) {
    return <div className="min-h-screen p-8"><PageSkeleton /></div>;
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-200 bg-white lg:flex">
        <Sidebar path={path} persona={persona} />
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <aside className="pop absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <button className={clsx(ICON_BTN, 'absolute right-3 top-4')} onClick={() => setDrawer(false)} aria-label="Close menu"><X size={18} /></button>
            <Sidebar path={path} persona={persona} />
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <Header persona={persona} onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}

function NavLinks({ path, persona, vertical = false }: { path: string; persona: PersonaId; vertical?: boolean }) {
  const broadcast = useApp((s) => s.broadcast);
  const active = matchNav(path);
  return (
    <nav className={clsx('flex', vertical ? 'flex-col gap-1' : 'h-full items-stretch gap-1')}>
      {NAV.filter((n) => n.roles.includes(persona) && (!n.needsLive || broadcast)).map((n) => {
        const on = active?.href === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            prefetch={false}
            data-tour={`nav-${n.href}`}
            className={clsx(
              'relative flex items-center gap-2 whitespace-nowrap text-sm font-semibold transition',
              vertical
                ? clsx('rounded-lg px-3 py-2.5', on ? 'bg-brand-50 text-brand-700 before:absolute before:-left-3 before:inset-y-2 before:w-1 before:rounded-r-full before:bg-brand-600' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900')
                : clsx('px-3', on ? 'text-brand-700' : 'text-ink-500 hover:text-ink-900'),
            )}
          >
            {n.icon}{n.label}
            {n.needsLive && broadcast && !broadcast.finalized && <span className="h-2 w-2 animate-pulse rounded-full bg-accent-500" />}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar({ path, persona }: { path: string; persona: PersonaId }) {
  const nextChargeDays = useApp((s) => s.nextChargeDays);
  const bizName = useApp((s) => s.bizName);
  const me = useMe();
  const heading = persona === 'business' ? 'Business' : persona === 'worker' ? 'Worker' : 'Admin';
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5"><Logo size={32} /></div>
      <p className="px-5 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{heading}</p>
      <div className="flex-1 overflow-y-auto px-3"><NavLinks path={path} persona={persona} vertical /></div>
      <div className="m-3 rounded-xl border border-ink-200 bg-ink-50 p-3.5 text-xs">
        {persona === 'business' && (
          <>
            <p className="text-sm font-semibold text-ink-900">{bizName}</p>
            <p className="mt-1 text-ink-600">Shiftwire plan · ${PRICE}/month</p>
            <p className="text-ink-500">Next charge {dayLabel(nextChargeDays)}</p>
          </>
        )}
        {persona === 'worker' && (
          <>
            <p className="text-sm font-semibold text-ink-900">{me.name}</p>
            <p className="mt-1 text-ink-600">{me.jobs === 0 ? 'New on Shiftwire' : `${me.rating.toFixed(1)} rating · ${me.jobs} shifts worked`}</p>
          </>
        )}
        {persona === 'admin' && (
          <>
            <p className="text-sm font-semibold text-ink-900">Operations console</p>
            <p className="mt-1 text-ink-600">Portland metro</p>
          </>
        )}
      </div>
    </>
  );
}

function Header({ persona, onMenu }: { persona: PersonaId; onMenu: () => void }) {
  const { dark, toggle } = useTheme();
  const [help, setHelp] = useState(false);
  const [tour, setTour] = useState(false);
  const actions = useMemo(() => ({ help: () => setHelp(true), theme: toggle }), [toggle]);
  useShortcuts(persona, actions);
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        <button className={clsx(ICON_BTN, 'lg:hidden')} onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
        <div className="lg:hidden"><Logo size={30} withText={false} /></div>
        <p className="hidden text-sm font-medium text-ink-500 lg:block">{persona === 'business' ? 'Staffing dashboard' : persona === 'worker' ? 'Worker app' : 'Marketplace operations'}</p>
        <div data-tour="header-tools" className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button onClick={() => setTour(true)} className="mr-1 hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-ink-300 px-3 py-1.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 xl:flex"><Compass size={16} className="text-brand-600" />Take a tour</button>
          <button onClick={() => setTour(true)} className={clsx(ICON_BTN, 'hidden sm:block xl:hidden')} aria-label="Take a tour"><Compass size={20} /></button>
          <button onClick={() => setHelp(true)} className={clsx(ICON_BTN, 'hidden sm:block')} aria-label="Keyboard shortcuts"><Keyboard size={20} /></button>
          <button onClick={toggle} className={ICON_BTN} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={20} /> : <Moon size={20} />}</button>
          <NotificationBell />
          <ProfileMenu onTour={() => setTour(true)} />
        </div>
      </div>
      {tour && <Tour persona={persona} onClose={() => setTour(false)} />}
      <ShortcutsModal open={help} onClose={() => setHelp(false)} persona={persona} />
    </header>
  );
}

function ProfileMenu({ onTour }: { onTour: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const persona = useApp((s) => s.persona);
  const contactName = useApp((s) => s.contactName);
  const bizName = useApp((s) => s.bizName);
  const nextChargeDays = useApp((s) => s.nextChargeDays);
  const switchPersona = useApp((s) => s.switchPersona);
  const logout = useApp((s) => s.logout);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const acct = useMeAccount();
  const worker = useMe();
  const people = PERSONAS.map((p) => (p.id === 'worker' && acct ? { ...p, name: acct.name, email: acct.email, title: `Worker, ${acct.skills[0]}` } : p));
  const base = people.find((p) => p.id === persona) ?? people[0];
  const me = persona === 'business' ? { ...base, name: contactName, title: `Owner, ${bizName}` } : base;
  const detail =
    persona === 'business'
      ? `Shiftwire plan · $${PRICE}/month · next charge ${dayLabel(nextChargeDays)}`
      : persona === 'worker'
        ? worker.jobs === 0 ? 'New on Shiftwire' : `${worker.rating.toFixed(1)} rating · ${worker.jobs} shifts worked`
        : 'Operations console · Portland metro';
  return (
    <div ref={ref} className="relative">
      <button data-tour="profile-menu" onClick={() => setOpen(!open)} className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition hover:bg-ink-100">
        <Avatar name={me.name} size={32} />
        <span className="hidden text-left md:block">
          <span className="block text-sm font-semibold leading-tight text-ink-900">{me.name}</span>
          <span className="block max-w-[11rem] truncate text-xs leading-tight text-ink-500">{me.title}</span>
        </span>
      </button>
      {open && (
        <div className="pop absolute right-0 mt-2 w-80 rounded-xl border border-ink-200 bg-white p-1.5 text-ink-900 shadow-xl">
          <div className="px-2.5 py-2">
            <p className="text-sm font-semibold">{me.name}</p>
            <p className="text-xs text-ink-500">{me.email}</p>
            <p className="mt-1.5 rounded-md bg-ink-50 px-2 py-1 text-xs text-ink-600">{detail}</p>
          </div>
          <div className="my-1 border-t border-ink-100" />
          <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400"><Repeat size={12} />Switch account</p>
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setOpen(false);
                if (p.id === persona) return;
                switchPersona(p.id);
                toast(`Switched to ${p.name}`, 'info');
                router.push(homeFor(p.id));
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-50"
            >
              <Avatar name={p.name} size={28} />
              <span className="flex-1">
                <span className="block text-sm font-medium">{p.name}</span>
                <span className="block text-xs text-ink-500">{p.title}</span>
              </span>
              {p.id === persona && <Check size={16} className="text-brand-600" />}
            </button>
          ))}
          <div className="my-1 border-t border-ink-100" />
          <button onClick={() => { setOpen(false); onTour(); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50">
            <Compass size={16} />Take a tour
          </button>
          <button onClick={() => { logout(); router.replace('/'); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50">
            <LogOut size={16} />Sign out
          </button>
        </div>
      )}
    </div>
  );
}
