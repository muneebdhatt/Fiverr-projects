'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Briefcase, Clock, FileText, LayoutDashboard, Mail, Users } from 'lucide-react';
import { ACCOUNTS, AGENCY, PEOPLE, person, type Role } from '@/data/static';
import { shownStatus } from '@/data/calc';
import { useApp, useApprovals, useEntries, useInvoices, useReady } from '@/lib/store';
import { hrs, weekStart } from '@/lib/util';
import { HeaderTimer } from '@/shell/Timer';
import { ProfileMenu } from '@/shell/ProfileMenu';
import { SearchBox } from '@/shell/SearchBox';
import { Logo, ProgressBar, Toaster } from '@/shell/ui';

const ALLOWED: Record<Role, string[]> = {
  owner: ['/home', '/projects', '/time', '/invoices', '/clients'],
  member: ['/home', '/projects', '/time'],
  client: ['/home', '/projects', '/invoices', '/pay'],
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const ready = useReady();
  const role = useApp((s) => s.role);
  const path = usePathname();
  const router = useRouter();
  const invoices = useInvoices();
  const approvals = useApprovals();
  const entries = useEntries();

  useEffect(() => {
    if (!ready) return;
    if (!role) { router.replace('/'); return; }
    const ok = ALLOWED[role].some((p) => path === p || path.startsWith(p + '/'));
    if (!ok) router.replace('/home');
    else if (path === '/invoices/new' && role !== 'owner') router.replace('/home');
  }, [ready, role, path, router]);

  if (!ready || !role) return <div className="min-h-screen bg-ink-50" />;

  const myClient = ACCOUNTS.client.clientId;
  const overdue = invoices.filter((i) => shownStatus(i) === 'overdue').length;
  const clientDue = invoices.filter((i) => i.clientId === myClient && i.status === 'sent').length;
  const clientApprovals = approvals.filter((a) => a.status === 'pending' && ['p1', 'p2'].includes(a.projectId)).length;

  const NAV =
    role === 'owner'
      ? [
          { href: '/home', label: 'Dashboard', Icon: LayoutDashboard, badge: 0 },
          { href: '/projects', label: 'Projects', Icon: Briefcase, badge: 0 },
          { href: '/time', label: 'Time', Icon: Clock, badge: 0 },
          { href: '/invoices', label: 'Invoices', Icon: FileText, badge: overdue },
          { href: '/clients', label: 'Clients', Icon: Users, badge: 0 },
        ]
      : role === 'member'
        ? [
            { href: '/home', label: 'My day', Icon: LayoutDashboard, badge: 0 },
            { href: '/projects', label: 'Projects', Icon: Briefcase, badge: 0 },
            { href: '/time', label: 'Time', Icon: Clock, badge: 0 },
          ]
        : [
            { href: '/home', label: 'Overview', Icon: LayoutDashboard, badge: 0 },
            { href: '/projects', label: 'Projects', Icon: Briefcase, badge: clientApprovals },
            { href: '/invoices', label: 'Invoices', Icon: FileText, badge: clientDue },
          ];
  const isOn = (href: string) => path === href || path.startsWith(href + '/') || (href === '/invoices' && path.startsWith('/pay'));

  const me = role === 'client' ? null : person(ACCOUNTS[role].id);
  const wk = weekStart(0);
  const myHours = me ? entries.filter((e) => e.user === me.id && e.day >= wk).reduce((n, e) => n + e.hours, 0) : 0;
  const contact = person('tom');

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white p-4 md:flex">
        <div className="px-2 py-3"><Logo /></div>
        <p className="mt-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{role === 'client' ? 'Client portal' : AGENCY}</p>
        <nav className="mt-2 space-y-1" aria-label="Main">
          {NAV.map(({ href, label, Icon, badge }) => (
            <Link key={href} href={href} className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition', isOn(href) ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900')}>
              <Icon size={18} className={isOn(href) ? 'text-brand-600' : ''} /> {label}
              {!!badge && <span className={clsx('ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white', href === '/invoices' && role === 'owner' ? 'bg-ember-600' : 'bg-ink-900')}>{badge}</span>}
            </Link>
          ))}
        </nav>
        {role === 'client' ? (
          <div className="mt-auto rounded-xl border border-ink-200 bg-ink-50 p-3.5">
            <p className="text-xs font-semibold text-ink-700">Your project manager</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{contact.name}</p>
            <a href={`mailto:${contact.email}`} className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-700 hover:underline"><Mail size={12} /> {contact.email}</a>
            <p className="mt-2 text-[11px] text-ink-400">{AGENCY} · usually replies within a few hours</p>
          </div>
        ) : role === 'member' ? (
          <div className="mt-auto rounded-xl border border-ink-200 bg-ink-50 p-3.5">
            <p className="text-xs font-semibold text-ink-700">Hours this week</p>
            <p className="mt-0.5 text-xs text-ink-500">{hrs(myHours)} of {me!.capacity} h</p>
            <ProgressBar value={myHours} max={me!.capacity} className="mt-2.5 h-2" />
            <p className="mt-2.5 text-[11px] text-ink-400">{AGENCY} · {PEOPLE.length} people</p>
          </div>
        ) : (
          <div className="mt-auto rounded-xl border border-ink-200 bg-ink-50 p-3.5">
            <p className="text-xs font-semibold text-ink-700">{AGENCY}</p>
            <p className="mt-0.5 text-xs text-ink-500">{PEOPLE.length} people · 6 clients · 10 active projects</p>
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-8">
            <div className="md:hidden"><Logo size={28} /></div>
            <SearchBox className="relative hidden max-w-xl flex-1 md:block" />
            <div className="ml-auto flex items-center gap-3">
              {role !== 'client' && <HeaderTimer role={role} />}
              <ProfileMenu role={role} />
            </div>
          </div>
          <div className="px-4 pb-3 md:hidden"><SearchBox className="relative" /></div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-ink-200 bg-white px-2 pb-2 pt-1.5 md:hidden" aria-label="Main tabs">
        {NAV.map(({ href, label, Icon, badge }) => (
          <Link key={href} href={href} className={clsx('relative flex min-w-14 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold', isOn(href) ? 'text-brand-700' : 'text-ink-500')}>
            <Icon size={22} strokeWidth={isOn(href) ? 2.4 : 2} />
            {label}
            {!!badge && <span className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">{badge}</span>}
          </Link>
        ))}
      </nav>
      <Toaster />
    </div>
  );
}
