'use client';
import clsx from 'clsx';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { initialsOf, toneOf } from '@/lib/time';
import { useApp } from '@/lib/store';

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#0a7587" />
        <path d="M18 30a16 16 0 0 1 16 16M18 16a30 30 0 0 1 30 30" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="20" cy="46" r="5" fill="#fff" />
        <circle cx="48" cy="17" r="5" fill="#f5a524" />
      </svg>
      {withText && <span className="font-display text-xl font-bold tracking-tight text-ink-900">Shiftwire</span>}
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

const CHIP_TONES: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-ink-100 text-ink-600',
  teal: 'bg-teal-50 text-teal-700',
};
export function Chip({ tone = 'gray', children }: { tone?: keyof typeof CHIP_TONES; children: ReactNode }) {
  return <span className={clsx('chip', CHIP_TONES[tone])}>{children}</span>;
}

export function ProgressBar({ value, max, tone }: { value: number; max: number; tone?: 'auto' | 'brand' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = tone === 'brand' ? 'bg-brand-500' : pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand-500';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={clsx('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

/** Shows a skeleton briefly after mount (and whenever `key` changes) so lists load like real software. */
export function useLoading(key: string, ms = 450) {
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
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">{icon}</div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
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
  // Rendered on the page body so a blurred or transformed parent (like the header) cannot shift it.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div className={clsx('pop max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl', width)} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
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
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pop pointer-events-auto flex items-start gap-2.5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-lg">
          {t.tone === 'success' ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" /> : t.tone === 'warn' ? <TriangleAlert size={18} className="mt-0.5 text-amber-500" /> : <Info size={18} className="mt-0.5 text-brand-500" />}
          <p className="flex-1 text-sm text-ink-800">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700" aria-label="Dismiss"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/** Click-outside popover used by header menus and dropdowns. */
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
