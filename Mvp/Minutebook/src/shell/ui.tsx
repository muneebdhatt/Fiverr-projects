'use client';
import clsx from 'clsx';
import { CheckCircle2, CircleDot, Circle, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { person, type PersonId, type Status } from '@/data';
import { dueLabel, initialsOf, toneOf } from '@/lib/util';
import { queryWords } from '@/lib/search';
import { useApp } from '@/lib/store';

export function Logo({ size = 32, withText = true, dark = false }: { size?: number; withText?: boolean; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#e24614" />
        <rect x="14" y="26" width="6" height="12" rx="3" fill="#fff" opacity=".8" />
        <rect x="24" y="18" width="6" height="28" rx="3" fill="#fff" />
        <rect x="34" y="12" width="6" height="40" rx="3" fill="#18181b" />
        <rect x="44" y="22" width="6" height="20" rx="3" fill="#fff" />
      </svg>
      {withText && <span className={clsx('font-display text-[22px] font-semibold tracking-tight', dark ? 'text-white' : 'text-ink-900')}>Minutebook</span>}
    </span>
  );
}

export function Avatar({ name, size = 32, ring }: { name: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', ring && 'ring-2 ring-white')}
      style={{ width: size, height: size, background: toneOf(name), fontSize: size * 0.38 }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}
export const PersonAvatar = ({ id, size = 32, ring }: { id: PersonId; size?: number; ring?: boolean }) => <Avatar name={person(id).name} size={size} ring={ring} />;

export function AvatarStack({ ids, size = 28, max = 4 }: { ids: PersonId[]; size?: number; max?: number }) {
  const shown = ids.slice(0, max);
  return (
    <span className="inline-flex items-center">
      {shown.map((id, i) => (
        <span key={id} style={{ marginLeft: i ? -size * 0.18 : 0 }} title={person(id).name}><PersonAvatar id={id} size={size} ring /></span>
      ))}
      {ids.length > max && <span className="ml-1.5 text-xs font-semibold text-ink-500">+{ids.length - max}</span>}
    </span>
  );
}

const CHIP_TONES = {
  brand: 'bg-brand-100 text-brand-800',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  gray: 'bg-ink-100 text-ink-600',
  dark: 'bg-ink-900 text-white',
  outline: 'bg-white text-ink-600 ring-1 ring-ink-300',
};
export function Chip({ tone = 'gray', children, className }: { tone?: keyof typeof CHIP_TONES; children: ReactNode; className?: string }) {
  return <span className={clsx('chip', CHIP_TONES[tone], className)}>{children}</span>;
}

export const STATUS_LABEL: Record<Status, string> = { todo: 'To do', doing: 'In progress', done: 'Done' };
export function StatusChip({ status }: { status: Status }) {
  if (status === 'done') return <Chip tone="dark"><CheckCircle2 size={12} /> Done</Chip>;
  if (status === 'doing') return <Chip tone="brand"><CircleDot size={12} /> In progress</Chip>;
  return <Chip tone="gray"><Circle size={12} /> To do</Chip>;
}
export function DueChip({ due, status }: { due: number; status: Status }) {
  if (status === 'done') return <Chip tone="gray">Completed</Chip>;
  if (due < 0) return <Chip tone="red">{dueLabel(due)}</Chip>;
  if (due <= 1) return <Chip tone="brand">{dueLabel(due)}</Chip>;
  return <Chip tone="outline">{dueLabel(due)}</Chip>;
}

export function ProgressBar({ value, max, className, warn }: { value: number; max: number; className?: string; warn?: boolean }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={clsx('h-2.5 w-full overflow-hidden rounded-full bg-ink-200', className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={clsx('h-full rounded-full transition-all duration-700', warn ? 'bg-red-600' : 'bg-brand-600')} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

/** Shows a skeleton briefly after mount so screens load like real software. */
export function useLoading(key: string, ms = 420) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [key, ms]);
  return loading;
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">{icon}</div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div className={clsx('pop max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl', width)} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
          <h2 className="font-sans text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Toaster() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 md:bottom-4 md:left-auto md:right-4 md:translate-x-0">
      {toasts.map((t) => (
        <div key={t.id} className="pop pointer-events-auto flex items-start gap-2.5 rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-lg">
          {t.tone === 'success' ? <CheckCircle2 size={18} className="mt-0.5 text-brand-600" /> : t.tone === 'warn' ? <TriangleAlert size={18} className="mt-0.5 text-red-600" /> : <Info size={18} className="mt-0.5 text-brand-600" />}
          <p className="flex-1 text-sm text-ink-800">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700" aria-label="Dismiss"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOutside();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onOutside]);
  return ref;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export function Thinking({ label = 'Thinking' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-500">
      <span className="inline-flex items-center gap-1"><span className="dot" /><span className="dot" /><span className="dot" /></span>
      {label}
    </span>
  );
}

/** Wraps matches of the query's words in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = queryWords(query).filter((w) => w.length > 1);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</>;
}

/** Deterministic waveform. `progress` (0 to 1) colours the played part; `active` animates it. */
export function Waveform({ bars = 48, active, progress, height = 44, seed = 1, className, onSeek }: { bars?: number; active?: boolean; progress?: number; height?: number; seed?: number; className?: string; onSeek?: (p: number) => void }) {
  return (
    <div
      className={clsx('flex items-center gap-[2px] sm:gap-[3px]', onSeek && 'cursor-pointer', className)}
      style={{ height }}
      onClick={onSeek ? (e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))); } : undefined}
      aria-hidden
    >
      {Array.from({ length: bars }, (_, i) => {
        const base = 0.22 + 0.78 * Math.abs(Math.sin(i * 1.7 + seed) * Math.cos(i * 0.55 + seed * 2));
        const played = progress !== undefined && i / bars < progress;
        return (
          <span
            key={i}
            className={clsx('w-[3px] flex-1 origin-center rounded-full', played ? 'bg-brand-600' : active ? 'bg-brand-400' : 'bg-ink-300')}
            style={{ height: `${Math.round(base * 100)}%`, animation: active ? `wave ${0.7 + (i % 5) * 0.12}s ease-in-out ${(i % 7) * 0.06}s infinite` : undefined }}
          />
        );
      })}
    </div>
  );
}
