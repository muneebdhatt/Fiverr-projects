'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUi } from '@/lib/ui';
import { Modal } from './ui';

const ROWS: [string, string][] = [
  ['/', 'Focus the search box'],
  ['n', 'Create a new document'],
  ['g then d', 'Go to Dashboard'],
  ['g then o', 'Go to Documents'],
  ['g then t', 'Go to Team'],
  ['g then b', 'Go to Billing'],
  ['g then a', 'Go to Audit log'],
  ['?', 'Show this list'],
  ['Esc', 'Close a dialog'],
];
const GO: Record<string, string> = { d: '/dashboard', o: '/documents', t: '/team', b: '/billing', a: '/audit' };

/** Global keyboard shortcuts. Ignored while typing in a field or when a modifier key is held. */
export function ShortcutsHost() {
  const router = useRouter();
  const path = usePathname() || '';
  const open = useUi((s) => s.shortcuts);
  const gPressed = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const k = e.key;
      if (gPressed.current) {
        gPressed.current = false;
        const to = GO[k.toLowerCase()];
        if (to) { e.preventDefault(); router.push(to); }
        return;
      }
      if (k === '/') {
        const el = document.querySelector<HTMLInputElement>('input[aria-label^="Search"]');
        if (el) { e.preventDefault(); el.focus(); }
      } else if (k === 'n') {
        e.preventDefault();
        if (path.replace(/\/$/, '') === '/documents') useUi.setState({ newDoc: true });
        else router.push('/documents?new=1');
      } else if (k === '?') {
        e.preventDefault();
        useUi.setState({ shortcuts: true });
      } else if (k === 'g') {
        gPressed.current = true;
        clearTimeout(timer);
        timer = setTimeout(() => { gPressed.current = false; }, 1200);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer); };
  }, [router, path]);

  return (
    <Modal open={open} onClose={() => useUi.setState({ shortcuts: false })} title="Keyboard shortcuts" width="max-w-md">
      <ul className="divide-y divide-ink-100">
        {ROWS.map(([key, what]) => (
          <li key={key} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-ink-700">{what}</span>
            <span className="flex gap-1">{key.split(' then ').map((p, i) => <kbd key={i} className="rounded-md border border-ink-200 bg-ink-50 px-2 py-0.5 font-mono text-xs text-ink-700">{p}</kbd>)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
