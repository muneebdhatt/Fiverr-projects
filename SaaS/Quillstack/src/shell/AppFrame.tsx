'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2, Check, ChevronsUpDown, CreditCard, Eye, FileText, History, Keyboard, LayoutDashboard, LogOut, Menu, Moon, Repeat,
  RotateCcw, Route, Search, Shield, Sun, Users, WifiOff, X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { CUSTOMER_ORG_IDS, PERSONAS } from '@/data/seed';
import type { Persona } from '@/data/types';
import { useApp, useIdentity, useInvitees, useMyInvites, useOrg, useOrgList, useReady } from '@/lib/store';
import { useOnline, useTheme, useUi } from '@/lib/ui';
import { Invitations } from './Invitations';
import { NotificationBell } from './NotificationBell';
import { ShortcutsHost } from './Shortcuts';
import { Tour } from './Tour';
import { Avatar, Chip, Logo, PageSkeleton, Toaster, useClickOutside } from './ui';

interface NavItem { href: string; label: string; icon: ReactNode; roles: Persona[] }
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['owner', 'member', 'superadmin'] },
  { href: '/documents', label: 'Documents', icon: <FileText size={18} />, roles: ['owner', 'member', 'superadmin'] },
  { href: '/team', label: 'Team', icon: <Users size={18} />, roles: ['owner', 'member', 'superadmin'] },
  { href: '/billing', label: 'Billing', icon: <CreditCard size={18} />, roles: ['owner', 'superadmin'] },
  { href: '/organisation', label: 'Organisation', icon: <Building2 size={18} />, roles: ['owner', 'superadmin'] },
  { href: '/audit', label: 'Audit log', icon: <History size={18} />, roles: ['owner', 'member', 'superadmin'] },
  { href: '/admin', label: 'Super-admin', icon: <Shield size={18} />, roles: ['superadmin'] },
];

function allowed(path: string, persona: Persona) {
  const item = NAV.find((n) => path === n.href || path.startsWith(n.href + '/'));
  return !item || item.roles.includes(persona);
}

export function AppFrame({ children }: { children: ReactNode }) {
  const ready = useReady();
  const authed = useApp((s) => s.authed);
  const persona = useApp((s) => s.persona);
  const path = (usePathname() || '/').replace(/\/$/, '') || '/';
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const identity = useIdentity();
  const { memberOrgIds } = useMyInvites();
  const noOrg = !!identity && memberOrgIds.length === 0;
  const inviteeId = useApp((s) => s.inviteeId);
  const logout = useApp((s) => s.logout);
  const online = useOnline();

  useEffect(() => {
    // Their invitation was withdrawn: the account no longer exists, so return to sign in.
    if (ready && authed && inviteeId && !identity) { logout(); router.replace('/'); }
  }, [ready, authed, inviteeId, identity, logout, router]);
  useEffect(() => { setDrawer(false); }, [path]);
  useEffect(() => {
    if (!ready) return;
    if (!authed) router.replace('/');
    else if (!allowed(path, persona)) router.replace('/dashboard');
  }, [ready, authed, persona, path, router]);

  if (!ready || !authed || !allowed(path, persona)) {
    return <div className="min-h-screen bg-ink-50 p-8"><PageSkeleton /></div>;
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-ink-100 bg-white lg:block">
        <Sidebar path={path} persona={persona} noOrg={noOrg} />
      </aside>
      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setDrawer(false)} />
          <aside className="pop absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl">
            <button className="absolute right-3 top-4 rounded-md p-1 text-ink-500 hover:bg-ink-100" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={18} /></button>
            <Sidebar path={path} persona={persona} noOrg={noOrg} />
          </aside>
        </div>
      )}
      <div className="lg:pl-72">
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-ink-800 px-4 py-2 text-center text-sm font-medium text-white">
            <WifiOff size={15} />You are offline. Your changes are saved on this device and everything keeps working.
          </div>
        )}
        <Header onMenu={() => setDrawer(true)} />
        {!noOrg && <OrgBanner path={path} />}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{noOrg ? <Invitations home /> : children}</main>
      </div>
      <Toaster />
      <ShortcutsHost />
      <Tour />
    </div>
  );
}

/** Shows Super-admin which organisation they are looking at, and warns everyone when it is suspended. */
function OrgBanner({ path }: { path: string }) {
  const { org } = useOrg();
  const persona = useApp((s) => s.persona);
  const suspended = useApp((s) => s.suspended[org.id]);
  const router = useRouter();
  if (persona === 'superadmin') {
    if (path === '/admin') return null;
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-brand-700 px-4 py-2 text-sm font-medium text-white">
        <span className="flex items-center gap-2"><Eye size={15} />Viewing {org.name} as Super-admin{suspended ? ' (suspended)' : ''}</span>
        <button className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/25" onClick={() => router.push('/admin')}>Exit to console</button>
      </div>
    );
  }
  if (!suspended) return null;
  return <div className="bg-red-600 px-4 py-2.5 text-center text-sm font-medium text-white">{org.name} is suspended. AI features are paused until an administrator reinstates the account.</div>;
}

function Sidebar({ path, persona, noOrg }: { path: string; persona: Persona; noOrg: boolean }) {
  const { org, plan, used } = useOrg();
  const pct = Math.min(100, Math.round((used / plan.credits) * 100));
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-7"><Logo /></div>
      {noOrg ? <p className="px-5 py-3 text-sm text-ink-500">Accept an invitation to open your workspace.</p> : <>
      <nav className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {NAV.filter((n) => n.roles.includes(persona)).map((n) => {
          const active = path === n.href || path.startsWith(n.href + '/');
          return (
            <Link key={n.href} href={n.href} prefetch={false} data-tour={`nav-${n.href.slice(1)}`} className={clsx('flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-medium transition', active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900')}>
              {n.icon}{n.label}
              {n.href === '/admin' && <span className="ml-auto"><Chip tone="brand">Staff</Chip></span>}
            </Link>
          );
        })}
      </nav>
      <div className="m-5 rounded-xl bg-ink-50 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink-700">AI credits</span>
          <span className="text-ink-500">{pct}% used</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200"><div className={clsx('h-full rounded-full', pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand-500')} style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-xs text-ink-500">{org.name} · {plan.name} plan</p>
      </div>
      </>}
    </div>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-ink-100 bg-white/90 px-4 backdrop-blur sm:gap-3 sm:px-6">
      <button className="rounded-md p-2 text-ink-600 hover:bg-ink-100 lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <div className="lg:hidden"><Logo size={28} withText={false} /></div>
      <OrgSwitcher />
      <div className="ml-auto flex items-center gap-3 sm:gap-4"><NotificationBell /><ProfileMenu /></div>
    </header>
  );
}

function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const { org, plan } = useOrg();
  const setOrg = useApp((s) => s.setOrg);
  const toast = useApp((s) => s.toast);
  const planIds = useApp((s) => s.planIds);
  const persona = useApp((s) => s.persona);
  const suspendedMap = useApp((s) => s.suspended);
  const [find, setFind] = useState('');
  const everyOrg = useOrgList();
  const identity = useIdentity();
  const my = useMyInvites();
  const visible = everyOrg.filter((o) => (identity ? my.memberOrgIds.includes(o.id) : persona === 'superadmin' || CUSTOMER_ORG_IDS.includes(o.id) || my.memberOrgIds.includes(o.id)));
  const list = visible.filter((o) => o.name.toLowerCase().includes(find.toLowerCase()));
  if (identity && my.memberOrgIds.length === 0) return null;
  return (
    <div ref={ref} className="relative" data-tour="org">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-left transition hover:bg-ink-50">
        <span className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: org.tone }}>{org.initials}</span>
        <span className="hidden sm:block">
          <span className="block text-sm font-semibold leading-tight">{org.name}</span>
          <span className="block text-xs leading-tight text-ink-500">{plan.name} plan</span>
        </span>
        <ChevronsUpDown size={15} className="text-ink-400" />
      </button>
      {open && (
        <div className="pop absolute left-0 mt-2 w-72 rounded-xl border border-ink-100 bg-white p-1.5 shadow-xl">
          <p className="px-2.5 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Organisations ({visible.length})</p>
          {visible.length > 5 && (
            <div className="relative px-1 pb-1.5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-[60%] text-ink-400" />
              <input className="input py-1.5 pl-8 text-sm" placeholder="Find an organisation" value={find} onChange={(e) => setFind(e.target.value)} aria-label="Find an organisation" />
            </div>
          )}
          <div className="max-h-80 overflow-y-auto">
          {list.length === 0 && <p className="px-2.5 py-3 text-sm text-ink-500">No organisation matches.</p>}
          {list.map((o) => (
            <button
              key={o.id}
              onClick={() => { if (o.id !== org.id) { setOrg(o.id); toast(`Switched to ${o.name}`, 'info'); } setOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: o.tone }}>{o.initials}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{o.name}</span>
                <span className="block text-xs capitalize text-ink-500">{planIds[o.id] ?? o.planId} plan · {o.industry}{suspendedMap[o.id] ? ' · suspended' : ''}</span>
              </span>
              {o.id === org.id && <Check size={16} className="text-brand-600" />}
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const persona = useApp((s) => s.persona);
  const switchPersona = useApp((s) => s.switchPersona);
  const logout = useApp((s) => s.logout);
  const resetWorkspace = useApp((s) => s.resetWorkspace);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const identity = useIdentity();
  const invitees = useInvitees().filter((x) => !PERSONAS.some((p) => p.email === x.user.email));
  const actAsInvitee = useApp((s) => s.actAsInvitee);
  const orgs = useOrgList();
  const { dark, toggle } = useTheme();
  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;
  const base = PERSONAS.find((p) => p.id === persona) ?? PERSONAS[0];
  const me = identity ? { name: identity.user.name, email: identity.user.email, title: identity.user.role } : base;
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50';
  return (
    <div ref={ref} className="relative" data-tour="profile">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-ink-50">
        <Avatar name={me.name} size={34} />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{me.name}</span>
          <span className="block text-xs leading-tight text-ink-500">{me.title}</span>
        </span>
      </button>
      {open && (
        <div className="pop absolute right-0 mt-2 max-h-[80vh] w-72 overflow-y-auto rounded-xl border border-ink-100 bg-white p-1.5 shadow-xl">
          <div className="px-2.5 py-2">
            <p className="text-sm font-semibold">{me.name}</p>
            <p className="text-xs text-ink-500">{me.email}</p>
          </div>
          <div className="my-1 border-t border-ink-100" />
          <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400"><Repeat size={12} />Switch account</p>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setOpen(false);
                if (p.id === persona && !identity) return;
                switchPersona(p.id);
                toast(`Switched to ${p.name} (${p.title})`, 'info');
                router.push('/dashboard');
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-50"
            >
              <Avatar name={p.name} size={28} />
              <span className="flex-1">
                <span className="block text-sm font-medium">{p.name}</span>
                <span className="block text-xs text-ink-500">{p.title}</span>
              </span>
              {p.id === persona && !identity && <Check size={16} className="text-brand-600" />}
            </button>
          ))}
          {invitees.length > 0 && (
            <>
              <p className="px-2.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Other accounts</p>
              {invitees.map(({ orgId, user }) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setOpen(false);
                    if (identity?.user.id === user.id) return;
                    actAsInvitee(orgId, user.id, user.role);
                    toast(`Switched to ${user.name}`, 'info');
                    router.push('/dashboard');
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-50"
                >
                  <Avatar name={user.name} size={28} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{user.name}</span>
                    <span className="block text-xs text-ink-500">{user.pending ? 'Invitation pending' : user.role} · {orgName(orgId)}</span>
                  </span>
                  {identity?.user.id === user.id && <Check size={16} className="text-brand-600" />}
                </button>
              ))}
            </>
          )}
          <div className="my-1 border-t border-ink-100" />
          <button className={item} onClick={() => { toggle(); }}>{dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? 'Light mode' : 'Dark mode'}</button>
          <button className={item} onClick={() => { setOpen(false); useUi.setState({ tour: true }); }}><Route size={16} />Take a tour</button>
          <button className={item} onClick={() => { setOpen(false); useUi.setState({ shortcuts: true }); }}><Keyboard size={16} />Keyboard shortcuts</button>
          <button className={item} onClick={() => { setOpen(false); resetWorkspace(); toast('Workspace reset to its starting state', 'info'); router.push('/dashboard'); }}><RotateCcw size={16} />Reset workspace</button>
          <div className="my-1 border-t border-ink-100" />
          <button onClick={() => { logout(); router.replace('/'); }} className={item}>
            <LogOut size={16} />Sign out
          </button>
        </div>
      )}
    </div>
  );
}
