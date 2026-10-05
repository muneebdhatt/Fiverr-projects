'use client';
import clsx from 'clsx';
import { initialsOf, toneOf } from '@/lib/time';

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white" style={{ width: size, height: size, background: toneOf(name), fontSize: size * 0.38 }}>
      {initialsOf(name)}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-ink-200 pb-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-brand-50 text-brand-600">{icon}</div>
      <div className="text-sm font-semibold">{title}</div>
      {text && <div className="mt-1 max-w-xs text-sm text-ink-500">{text}</div>}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const tone: Record<string, string> = {
    Ready: 'bg-emerald-50 text-emerald-700',
    Processing: 'bg-amber-50 text-amber-700',
    Open: 'bg-red-50 text-red-700',
    Reviewed: 'bg-emerald-50 text-emerald-700',
    Resolved: 'bg-emerald-50 text-emerald-700',
    Pending: 'bg-amber-50 text-amber-700',
    admin: 'bg-brand-50 text-brand-700',
    member: 'bg-ink-100 text-ink-600',
  };
  return <span className={clsx('chip capitalize', tone[status] || 'bg-ink-100 text-ink-600')}>{status}</span>;
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="12" fill="#7f1d2b" />
      <path d="M14 18c6-2 12-1 18 3v27c-6-4-12-5-18-3z" fill="#fff8ea" />
      <path d="M50 18c-6-2-12-1-18 3v27c6-4 12-5 18-3z" fill="#f0dcae" />
      <path d="M40 10h6v16l-3-3-3 3z" fill="#e0b04a" />
    </svg>
  );
}
