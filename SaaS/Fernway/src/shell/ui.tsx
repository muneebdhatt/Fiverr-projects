'use client';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, X } from 'lucide-react';
import { initialsOf, toneOf } from '@/lib/time';
import { useApp } from '@/lib/store';
import type { FlagLevel, Status } from '@/data/types';

export function Logo({ size = 34, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="18" fill={tone === 'dark' ? '#704f10' : '#faf7ee'} />
        <path d="M32 49V27" stroke={tone === 'dark' ? '#faf7ee' : '#704f10'} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M32 30c0-8 5-13 14-14 0 8-5 13-14 14z" fill="#d6b25a" />
        <path d="M32 38c0-7-4-11-12-12 0 7 4 11 12 12z" fill={tone === 'dark' ? '#faf7ee' : '#704f10'} />
        <circle cx="32" cy="50" r="2.6" fill="#f6dc8e" />
      </svg>
      <span className={clsx('font-display text-[26px] leading-none tracking-tight', tone === 'dark' ? 'text-heading' : 'text-[#faf7ee]')}>Fernway</span>
    </span>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: toneOf(name), fontSize: size * 0.36 }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  Waiting: 'bg-honey-100 text-honey-700',
  'In review': 'bg-tide-100 text-tide-700',
  Seen: 'bg-leaf-100 text-leaf-700',
};
const STATUS_DOT: Record<Status, string> = { Waiting: 'bg-honey-500', 'In review': 'bg-tide-500', Seen: 'bg-leaf-500' };
export function StatusPill({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', STATUS_STYLE[status], className)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {status}
    </span>
  );
}

const FLAG_STYLE: Record<FlagLevel, string> = {
  urgent: 'bg-coral-100 text-coral-700 ring-1 ring-coral-200',
  review: 'bg-honey-100 text-honey-700 ring-1 ring-honey-400/40',
  info: 'bg-tide-50 text-tide-700 ring-1 ring-tide-100',
};
export function FlagChip({ level, children }: { level: FlagLevel; children: React.ReactNode }) {
  return <span className={clsx('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold', FLAG_STYLE[level])}>{children}</span>;
}

export function Chip({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: 'neutral' | 'pine' | 'coral'; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'neutral' && 'bg-bone-200 text-bark-600',
        tone === 'pine' && 'bg-pine-100 text-accent',
        tone === 'coral' && 'bg-coral-100 text-coral-700',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: React.ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex rounded-full bg-bone-200 p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx('rounded-full font-semibold transition', size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm', o.value === value ? 'bg-snow text-heading shadow-soft' : 'text-bark-500 hover:text-bark-800')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={clsx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-pine-600' : 'bg-bone-300')}>
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-snow shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pine-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label={title} className={clsx('card w-full animate-pop rounded-b-none p-6 sm:rounded-b-2xl', width)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl text-heading">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-bark-400 hover:bg-bone-200"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex animate-rise items-center gap-2.5 rounded-full bg-pine-900 px-4 py-2.5 text-sm font-semibold text-[#faf7ee] shadow-lift"
        >
          <span className={clsx('flex h-5 w-5 items-center justify-center rounded-full', t.tone === 'warn' ? 'bg-coral-500' : 'bg-leaf-500')}><Check size={12} strokeWidth={3} /></span>
          {t.message}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-100 text-accent">{icon}</div>
      <p className="font-display text-xl text-heading">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-bark-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

/** Small dropdown used for menus (profile, filters). */
export function Menu({ trigger, children, align = 'right', width = 'w-64' }: { trigger: (open: boolean) => React.ReactNode; children: (close: () => void) => React.ReactNode; align?: 'left' | 'right'; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="block">{trigger(open)}</button>
      {open && (
        <div className={clsx('card absolute z-40 mt-2 animate-pop p-1.5 shadow-lift', width, align === 'right' ? 'right-0' : 'left-0')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function SelectField({ value, onChange, options, className, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string; label: string }) {
  return (
    <span className={clsx('relative inline-block', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-full border border-bone-300 bg-snow py-2 pl-3.5 pr-9 text-sm font-semibold text-bark-700 hover:bg-bone-100 focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-200"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-bark-400" />
    </span>
  );
}
