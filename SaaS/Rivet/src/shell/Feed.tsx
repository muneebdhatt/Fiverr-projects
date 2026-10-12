'use client';
import { CheckSquare, Clock, CreditCard, FileText, Megaphone, Paperclip, ThumbsUp } from 'lucide-react';
import type { Activity } from '@/data/types';
import { ago } from '@/lib/util';

const ICON = { time: Clock, task: CheckSquare, invoice: FileText, payment: CreditCard, approval: ThumbsUp, file: Paperclip, update: Megaphone };

export function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <ul className="divide-y divide-ink-100">
      {items.map((a) => {
        const Icon = ICON[a.kind];
        return (
          <li key={a.id} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600"><Icon size={14} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-800">{a.text}</p>
              <p className="mt-0.5 text-xs text-ink-400">{ago(a.day, a.minutes)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
