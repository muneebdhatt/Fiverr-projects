'use client';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export function SidePanel({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/40 transition ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{title}</div>
            {subtitle && <div className="mt-0.5 text-xs text-ink-500">{subtitle}</div>}
          </div>
          <button aria-label="Close panel" onClick={onClose} className="rounded p-1 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}
