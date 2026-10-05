'use client';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type T = { id: number; text: string; tone: 'ok' | 'err' };
type S = { items: T[]; push: (text: string, tone?: 'ok' | 'err') => void };
let n = 0;
export const useToasts = create<S>((set) => ({
  items: [],
  push: (text, tone = 'ok') => {
    const id = ++n;
    set((s) => ({ items: [...s.items, { id, text, tone }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3200);
  },
}));
export const toast = (text: string, tone: 'ok' | 'err' = 'ok') => useToasts.getState().push(text, tone);

export function ToastHost() {
  const items = useToasts((s) => s.items);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2 px-4">
      {items.map((t) => (
        <div key={t.id} className="pop pointer-events-auto flex items-center gap-2 rounded-lg border border-white/10 bg-[#2a211a] px-4 py-2.5 text-sm text-white shadow-lg">
          {t.tone === 'ok' ? <CheckCircle2 className="h-4 w-4 text-[#e0b04a]" /> : <AlertCircle className="h-4 w-4 text-red-300" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
