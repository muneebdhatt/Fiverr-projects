'use client';
import clsx from 'clsx';
import { CheckCircle2, Circle, CircleDot, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { person } from '@/data/static';
import type { PersonId } from '@/data/types';
import type { ShownStatus } from '@/data/calc';
import { initialsOf, toneOf } from '@/lib/util';
import { useApp } from '@/lib/store';

export function Logo({ size = 32, withText = true, dark = false }: { size?: number; withText?: boolean; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#7538e2" />
        <circle cx="32" cy="32" r="15" fill="#fff" />
        <circle cx="32" cy="32" r="6" fill="#7538e2" />
        <circle cx="32" cy="32" r="22" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeDasharray="3 6" />
      </svg>
      {withText && <span className={clsx('font-display text-[23px] font-bold tracking-tight', dark ? 'text-white' : 'text-ink-900')}>Rivet</span>}
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

export function AvatarStack({ ids, size = 26, max = 4 }: { ids: PersonId[]; size?: number; max?: number }) {
  const shown = ids.slice(0, max);
  return (
    <span className="inline-flex items-center">
      {shown.map((id, i) => (
        <span key={id} style={{ marginLeft: i ? -size * 0.12 : 0 }} title={person(id).name}><PersonAvatar id={id} size={size} ring /></span>
      ))}
      {ids.length > max && <span className="ml-1.5 text-xs font-semibold text-ink-500">+{ids.length - max}</span>}
    </span>
  );
}

const CHIP_TONES = {
  brand: 'bg-brand-100 text-brand-800',
  ember: 'bg-ember-100 text-ember-800 ring-1 ring-ember-200',
  gray: 'bg-ink-100 text-ink-600',
  dark: 'bg-ink-900 text-white',
  outline: 'bg-white text-ink-600 ring-1 ring-ink-300',
  solid: 'bg-brand-600 text-white',
};
export function Chip({ tone = 'gray', children, className }: { tone?: keyof typeof CHIP_TONES; children: ReactNode; className?: string }) {
  return <span className={clsx('chip', CHIP_TONES[tone], className)}>{children}</span>;
}

export function InvoiceChip({ status }: { status: ShownStatus }) {
  if (status === 'paid') return <Chip tone="dark"><CheckCircle2 size={12} /> Paid</Chip>;
  if (status === 'overdue') return <Chip tone="ember"><TriangleAlert size={12} /> Overdue</Chip>;
  if (status === 'sent') return <Chip tone="brand"><CircleDot size={12} /> Awaiting payment</Chip>;
  return <Chip tone="gray"><Circle size={12} /> Draft</Chip>;
}

export function ProgressBar({ value, max, className, warn, over }: { value: number; max: number; className?: string; warn?: boolean; over?: boolean }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={clsx('h-2.5 w-full overflow-hidden rounded-full bg-ink-200', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemax={Math.round(max)}>
      <div className={clsx('h-full rounded-full transition-all duration-700', over ? 'bg-ember-700' : warn ? 'bg-ember-500' : 'bg-brand-600')} style={{ width: `${pct}%` }} />
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

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-72" />
    </div>
  );
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

/** A panel that slides in from the right (full width on phones). */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]" onMouseDown={onClose}>
      <aside className="pop flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()} role="dialog">
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0 flex-1">{title}</div>
          <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-ink-100 p-4">{footer}</div>}
      </aside>
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
          {t.tone === 'success' ? <CheckCircle2 size={18} className="mt-0.5 text-brand-600" /> : t.tone === 'warn' ? <TriangleAlert size={18} className="mt-0.5 text-ember-600" /> : <Info size={18} className="mt-0.5 text-brand-600" />}
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

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-3xl leading-tight text-ink-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-ink-200 px-1" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={clsx('relative flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold transition', value === t.id ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800')}>
          {t.label}
          {t.count !== undefined && <span className={clsx('rounded-full px-1.5 text-[11px] font-bold', value === t.id ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-500')}>{t.count}</span>}
          {value === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'ember'; icon?: ReactNode }) {
  return (
    <div className="card p-3.5 sm:p-4">
      <div className="flex items-center justify-between text-ink-500">
        <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
        {icon}
      </div>
      <p className={clsx('tabnum mt-2 font-display text-2xl font-bold sm:text-3xl', tone === 'ember' ? 'text-ember-700' : 'text-ink-900')}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
    </div>
  );
}

/** Wraps matches of the query's words in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</>;
}
