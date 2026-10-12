'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { CheckSquare, FileText, LayoutDashboard, Mic, ShieldCheck } from 'lucide-react';
import { ACCOUNTS } from '@/data';
import { useActions, useApp, useMinutesUsed, useReady } from '@/lib/store';
import { ProfileMenu } from '@/shell/ProfileMenu';
import { SearchBox } from '@/shell/SearchBox';
import { Logo, ProgressBar, Toaster } from '@/shell/ui';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const ready = useReady();
  const role = useApp((s) => s.role);
  const limit = useApp((s) => s.limit);
  const used = useMinutesUsed();
  const actions = useActions();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !role) router.replace('/');
  }, [ready, role, router]);

  if (!ready || !role) return <div className="min-h-screen bg-ink-50" />;

  const me = ACCOUNTS[role].id;
  const mineOpen = actions.filter((a) => a.owner === me && a.status !== 'done').length;
  const NAV = [
    { href: '/home', label: 'Home', Icon: LayoutDashboard },
    { href: '/meetings', label: 'Meetings', Icon: FileText },
    { href: '/actions', label: 'Actions', Icon: CheckSquare, badge: mineOpen },
    ...(role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: ShieldCheck, badge: 0 }] : []),
  ];
  const isOn = (href: string) => path === href || path.startsWith(href + '/');

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white p-4 md:flex">
        <div className="px-2 py-3"><Logo /></div>
        <Link href="/record" className="btn-primary mt-4 w-full py-3"><Mic size={18} /> New recording</Link>
        <nav className="mt-6 space-y-1" aria-label="Main">
          {NAV.map(({ href, label, Icon, badge }) => (
            <Link key={href} href={href} className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition', isOn(href) ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900')}>
              <Icon size={18} className={isOn(href) ? 'text-brand-600' : ''} /> {label}
              {!!badge && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1.5 text-[11px] font-bold text-white">{badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-ink-200 bg-ink-50 p-3.5">
          <p className="text-xs font-semibold text-ink-700">Recording minutes</p>
          <p className="mt-0.5 text-xs text-ink-500">{used.toLocaleString()} of {limit.toLocaleString()} used</p>
          <ProgressBar value={used} max={limit} className="mt-2.5 h-2" warn={used / limit >= 0.9} />
          <p className="mt-2.5 text-[11px] text-ink-400">Ashgrove Studio · 6 teammates</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-8">
            <div className="md:hidden"><Logo size={28} /></div>
            <SearchBox className="relative hidden max-w-xl flex-1 md:block" />
            <div className="ml-auto"><ProfileMenu role={role} /></div>
          </div>
          <div className="px-4 pb-3 md:hidden"><SearchBox className="relative" /></div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-ink-200 bg-white px-2 pb-2 pt-1.5 md:hidden" aria-label="Main tabs">
        {NAV.slice(0, 2).map(({ href, label, Icon }) => <Tab key={href} href={href} label={label} Icon={Icon} on={isOn(href)} />)}
        <Link href="/record" className="-mt-5 flex flex-col items-center gap-0.5 text-[11px] font-semibold text-ink-600" aria-label="New recording">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg"><Mic size={22} /></span>
          Record
        </Link>
        {NAV.slice(2).map(({ href, label, Icon, badge }) => <Tab key={href} href={href} label={label} Icon={Icon} on={isOn(href)} badge={badge} />)}
      </nav>
      <Toaster />
    </div>
  );
}

function Tab({ href, label, Icon, on, badge }: { href: string; label: string; Icon: typeof FileText; on: boolean; badge?: number }) {
  return (
    <Link href={href} className={clsx('relative flex min-w-14 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold', on ? 'text-brand-700' : 'text-ink-500')}>
      <Icon size={22} strokeWidth={on ? 2.4 : 2} />
      {label}
      {!!badge && <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">{badge}</span>}
    </Link>
  );
}
