'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Compass, FileText, Home, LogOut, Menu, MessageSquareText, Moon, PenLine, Settings, ShieldCheck, Sun, X } from 'lucide-react';
import { api, Persona } from '@/lib/api';
import { useChat } from '@/lib/chatStore';
import { useNotes } from '@/lib/notifications';
import { applyTheme, usePrefs } from '@/lib/prefs';
import { DocViewer } from '@/components/DocViewer';
import { Avatar, Logo } from './ui';
import { ToastHost, toast } from './Toast';
import { NotificationBell } from './NotificationBell';
import { SearchBox } from './SearchBox';
import { useSession } from './session';
import { useViewer } from './viewer';
import { Tour, TourOffer, useTour } from './Tour';
import { ChatWidget } from '@/components/ChatWidget';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/documents', label: 'Library', icon: FileText, tour: 'documents' },
  { href: '/chat', label: 'Ask', icon: MessageSquareText },
  { href: '/drafts', label: 'Draft a reply', icon: PenLine },
  { href: '/admin', label: 'Admin', icon: ShieldCheck, admin: true },
];

const isActive = (href: string, path: string) => (href === '/' ? path === '/' : path.startsWith(href));

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { me, setMe } = useSession();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const viewer = useViewer();
  const startTour = useTour((s) => s.start);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [ready, setReady] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([usePrefs.persist.rehydrate(), useChat.persist.rehydrate(), useNotes.persist.rehydrate()]).then(() => {
      applyTheme(usePrefs.getState().theme);
      setReady(true);
    });
  }, []);
  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    if (localStorage.getItem('lk_in') !== '1') { router.replace('/login'); return; }
    api.me().then(setMe).catch(() => router.replace('/login'));
    api.personas().then(setPersonas).catch(() => {});
  }, [router, setMe]);

  useEffect(() => { if (ready && me) useNotes.getState().seed(me.id); }, [ready, me]);
  useEffect(() => { setDrawer(false); }, [path]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const switchTo = useCallback(async (p: Persona) => {
    setMenu(false);
    if (me && me.account === p.key) return;
    const next = await api.switchTo(p.key);
    setMe(next);
    toast(`Switched to ${next.name}`);
    if (next.role !== 'admin' && path.startsWith('/admin')) router.push('/');
  }, [me, path, router, setMe]);

  const signOut = async () => {
    try { await api.signout(); } catch {}
    localStorage.removeItem('lk_in');
    router.replace('/login');
  };
  const items = NAV.filter((n) => !n.admin || me?.role === 'admin');
  const tourId = (n: (typeof NAV)[number]) => `nav-${n.tour ?? n.label.toLowerCase()}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <button aria-label="Open menu" className="rounded-md p-2 text-ink-600 hover:bg-ink-100 lg:hidden" onClick={() => setDrawer(!drawer)}>
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="hidden font-serif text-2xl font-semibold leading-none tracking-tight min-[480px]:inline">Lorekeeper</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <SearchBox />
            <button onClick={startTour} className="hidden items-center gap-2 whitespace-nowrap rounded-md border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 sm:flex" aria-label="Take a tour">
              <Compass className="h-4 w-4" /><span className="hidden xl:inline">Take a tour</span>
            </button>
            <button aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-md p-2.5 text-ink-600 hover:bg-ink-100">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <NotificationBell />
            <span className="mx-1 hidden h-7 w-px bg-ink-200 sm:block" />
            <div className="relative" ref={ref} data-tour="profile">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-ink-100">
                {me ? <Avatar name={me.name} size={30} /> : <div className="skeleton h-[30px] w-[30px]" />}
                <div className="hidden text-left md:block">
                  <div className="whitespace-nowrap text-sm font-medium leading-tight">{me?.name || ' '}</div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{me?.role || ' '}</div>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
              </button>
              {menu && (
                <div className="card pop absolute right-0 mt-2 w-72 p-2">
                  <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">Switch account</div>
                  {personas.map((p) => (
                    <button key={p.key} onClick={() => switchTo(p)} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-ink-100">
                      <Avatar name={p.name} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="truncate text-xs capitalize text-ink-500">{p.role} · {p.title}</div>
                      </div>
                      {me?.account === p.key && <Check className="h-4 w-4 text-brand-600" />}
                    </button>
                  ))}
                  <div className="my-1 border-t border-ink-200" />
                  <button onClick={() => { setMenu(false); startTour(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-600 hover:bg-ink-100">
                    <Compass className="h-4 w-4" /> Take a tour
                  </button>
                  <Link href="/settings" onClick={() => setMenu(false)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-600 hover:bg-ink-100">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-600 hover:bg-ink-100">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="hidden border-t border-ink-200/70 lg:block">
          <div className="mx-auto flex max-w-6xl items-stretch gap-2 px-6">
            {items.map((n) => (
              <Link key={n.href} href={n.href} data-tour={tourId(n)} className={clsx('relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition', isActive(n.href, path) ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900')}>
                <n.icon className="h-4 w-4" />
                {n.label}
                {isActive(n.href, path) && <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-t bg-brand-600" />}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="pop absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-ink-200 px-5 py-4">
              <Logo size={30} />
              <span className="font-serif text-xl font-semibold">Lorekeeper</span>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {items.map((n) => (
                <Link key={n.href} href={n.href} className={clsx('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium', isActive(n.href, path) ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100')}>
                  <n.icon className="h-[18px] w-[18px]" /> {n.label}
                </Link>
              ))}
            </nav>
            <div className="m-3 rounded-md bg-brand-50 p-3 text-xs text-brand-800">Answers come only from your team&apos;s documents, with the source shown under every reply.</div>
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-ink-200 py-4 text-center text-xs text-ink-500">
        Answers come only from your team&apos;s documents, with the source shown under every reply. · Harbor &amp; Pine Consulting
      </footer>
      <DocViewer target={viewer.target} onClose={viewer.close} />
      {me && !path.startsWith('/chat') && <ChatWidget />}
      <Tour />
      <TourOffer />
      <ToastHost />
    </div>
  );
}
