'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PersonaId } from '@/data/types';
import { Modal } from './ui';

export interface ShortcutDef { keys: string; label: string }

export function shortcutsFor(persona: PersonaId): ShortcutDef[] {
  const common: ShortcutDef[] = [{ keys: '/', label: 'Focus the search box' }, { keys: 'd', label: 'Switch between light and dark' }, { keys: '?', label: 'Show this list' }];
  if (persona === 'business') return [{ keys: 'n', label: 'Post a new shift' }, { keys: 'g then s', label: 'Go to Shifts' }, { keys: 'g then l', label: 'Go to the live shift' }, { keys: 'g then w', label: 'Go to Find workers' }, { keys: 'g then b', label: 'Go to Billing' }, ...common];
  if (persona === 'worker') return [{ keys: 'g then o', label: 'Go to Shift offers' }, { keys: 'g then e', label: 'Go to Earnings' }, { keys: 'g then p', label: 'Go to My profile' }, ...common];
  return [{ keys: 'g then a', label: 'Go to Overview' }, ...common];
}

const ROUTES: Record<PersonaId, Record<string, string>> = {
  business: { s: '/shifts', l: '/shifts/live', w: '/workers', b: '/billing' },
  worker: { o: '/offers', e: '/earnings', p: '/profile' },
  admin: { a: '/admin' },
};

/** Single-key shortcuts and "g then x" chords. Ignored while typing in a field. */
export function useShortcuts(persona: PersonaId, actions: { help: () => void; theme: () => void }) {
  const router = useRouter();
  const chord = useRef<number>(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      const k = e.key;
      if (chord.current && Date.now() - chord.current < 1200) {
        chord.current = 0;
        const dest = ROUTES[persona][k.toLowerCase()];
        if (dest) { e.preventDefault(); router.push(dest); }
        return;
      }
      if (k === 'g') { chord.current = Date.now(); return; }
      if (k === '?') { e.preventDefault(); actions.help(); }
      else if (k === 'd') actions.theme();
      else if (k === 'n' && persona === 'business') router.push('/post-shift');
      else if (k === '/') {
        const el = document.querySelector<HTMLInputElement>('input[data-search]');
        if (el) { e.preventDefault(); el.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [persona, router, actions]);
}

export function ShortcutsModal({ open, onClose, persona }: { open: boolean; onClose: () => void; persona: PersonaId }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" width="max-w-md">
      <ul className="divide-y divide-ink-100 text-sm">
        {shortcutsFor(persona).map((s) => (
          <li key={s.keys} className="flex items-center justify-between py-2.5">
            <span className="text-ink-700">{s.label}</span>
            <span className="flex items-center gap-1">{s.keys.split(' ').map((p, i) => p === 'then' ? <span key={i} className="px-0.5 text-xs text-ink-400">then</span> : <kbd key={i} className="rounded-md border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs font-semibold text-ink-700">{p}</kbd>)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
