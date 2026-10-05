'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, MessageSquareText, ThumbsUp } from 'lucide-react';
import { api, Home } from '@/lib/api';
import { useChat } from '@/lib/chatStore';
import { ago } from '@/lib/time';
import { useSession } from '@/shell/session';
import { Avatar, EmptyState, PageHeader, Skeleton } from '@/shell/ui';

export default function HomePage() {
  const me = useSession((s) => s.me);
  const ask = useChat((s) => s.ask);
  const [home, setHome] = useState<Home | null>(null);

  useEffect(() => { api.home().then(setHome).catch(() => {}); }, []);

  const go = (question: string) => {
    if (!question.trim()) return;
    if (me) ask(me.id, question.trim()); // the chat widget opens and answers it
  };

  const stats = [
    { label: 'Documents', value: home?.doc_count, icon: FileText },
    { label: 'Ready to search', value: home?.ready_count, icon: CheckCircle2 },
    { label: 'Questions this week', value: home?.questions_this_week, icon: MessageSquareText },
  ];

  return (
    <div>
      <PageHeader title={me ? `Good to see you, ${me.name.split(' ')[0]}` : 'Welcome'} subtitle="Use the chat in the bottom right to ask a question, or pick up where your team left off." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><s.icon className="h-5 w-5" /></div>
            <div>
              {home ? <div className="text-2xl font-semibold tracking-tight">{s.value}</div> : <Skeleton className="mb-1 h-7 w-12" />}
              <div className="text-sm text-ink-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-ink-100 px-4 py-3 text-sm font-semibold">Recent questions</div>
        {!home && <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
        {home && home.recent.length === 0 && <EmptyState icon={<MessageSquareText className="h-5 w-5" />} title="No questions yet" text="Questions your team asks will show up here." />}
        {home && home.recent.length > 0 && (
          <ul className="divide-y divide-ink-100">
            {home.recent.map((r) => (
              <li key={r.id}>
                <button onClick={() => go(r.question)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50">
                  <Avatar name={r.user} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.question}</div>
                    <div className="text-xs text-ink-500">{r.user} · {ago(r.mins)}</div>
                  </div>
                  {r.rating === 'up' && <ThumbsUp className="h-4 w-4 text-brand-500" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
