'use client';
import { useEffect, useRef, useState } from 'react';
import { Copy, Send, Sparkles } from 'lucide-react';
import { ACCOUNTS, PROJECTS, client, person, project } from '@/data/static';
import type { PersonId, ProjectId } from '@/data/types';
import { PROMPTS, matchPrompt, weeklyDraft, type Mode } from '@/lib/ai';
import { useApp, useApprovals, useEntries, useInvoices, useMilestones, useTasks } from '@/lib/store';
import { monthDay } from '@/lib/util';
import { Thinking } from './ui';
import { useTypewriter } from './useTypewriter';

/** "Draft the weekly update": prepared prompts, a short thinking state, a typed-out draft the user edits, then post it to the client portal. */
export function WeeklyUpdate({ projectId, pick = false }: { projectId?: ProjectId; pick?: boolean }) {
  const role = useApp((s) => s.role)!;
  const addUpdate = useApp((s) => s.addUpdate);
  const log = useApp((s) => s.log);
  const toast = useApp((s) => s.toast);
  const tasks = useTasks();
  const entries = useEntries();
  const approvals = useApprovals();
  const milestones = useMilestones();
  const invoices = useInvoices();
  const me = ACCOUNTS[role === 'client' ? 'owner' : role].id as PersonId;
  const options = role === 'member' ? PROJECTS.filter((p) => p.team.includes(me)) : PROJECTS;
  const [pid, setPid] = useState<ProjectId>(projectId ?? options[0].id);
  const [input, setInput] = useState('');
  const [asked, setAsked] = useState('');
  const [mode, setMode] = useState<Mode>('full');
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'typing' | 'done'>('idle');
  const [draft, setDraft] = useState('');
  const [posted, setPosted] = useState(false);
  const tw = useTypewriter(12, 4);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (projectId) setPid(projectId); }, [projectId]);
  useEffect(() => { setPhase('idle'); setPosted(false); tw.reset(); setAsked(''); }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (label: string, m: Mode) => {
    if (phase === 'thinking' || phase === 'typing') return;
    setAsked(label);
    setMode(m);
    setInput('');
    setPosted(false);
    setPhase('thinking');
    timer.current = setTimeout(() => {
      const text = weeklyDraft(m, { projectId: pid, tasks, entries, approvals, milestones, invoices, sender: person(me).name.split(' ')[0] });
      setDraft(text);
      setPhase('typing');
      tw.start(text, () => setPhase('done'));
    }, 1100);
  };

  const p = project(pid);
  const busy = phase === 'thinking' || phase === 'typing';
  return (
    <div className="space-y-4">
      {pick && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Project</span>
          <select className="input" value={pid} onChange={(e) => setPid(e.target.value as ProjectId)}>
            {options.map((o) => <option key={o.id} value={o.id}>{o.name} · {client(o.clientId).name}</option>)}
          </select>
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((pr) => (
          <button key={pr.mode} disabled={busy} onClick={() => run(pr.label, pr.mode)} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-left text-[13px] font-medium text-brand-800 transition hover:bg-brand-100 disabled:opacity-50">
            {pr.label}
          </button>
        ))}
      </div>

      {phase !== 'idle' && (
        <div className="space-y-3">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink-900 px-4 py-2.5 text-sm text-white">{asked}</div>
          <div className="rounded-2xl rounded-bl-md border border-ink-200 bg-white p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-700"><Sparkles size={14} /> Draft for {p.name}</p>
            {phase === 'thinking' ? (
              <Thinking label="Reading tasks, hours and approvals" />
            ) : phase === 'typing' ? (
              <p className="caret whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{tw.shown}</p>
            ) : (
              <>
                <textarea className="input min-h-[300px] leading-relaxed" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Edit the draft" />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(draft).catch(() => {}); toast('Copied to clipboard', 'success'); }}><Copy size={14} /> Copy</button>
                  {mode === 'internal' ? (
                    <span className="text-xs text-ink-500">Internal notes stay inside the team. Switch to a client version to post it.</span>
                  ) : (
                    <button
                      className="btn-primary btn-sm"
                      disabled={posted}
                      onClick={() => {
                        addUpdate({ projectId: pid, day: 0, title: `Weekly update, ${monthDay(0)}`, body: draft, by: me });
                        log({ kind: 'update', text: `${person(me).name} posted the weekly update for ${p.name}`, projectId: pid });
                        setPosted(true);
                        toast(`Posted to ${client(p.clientId).contact.split(' ')[0]}’s portal`, 'success');
                      }}
                    >
                      <Send size={14} /> {posted ? 'Posted to the portal' : 'Post to client portal'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (input.trim()) run(input.trim(), matchPrompt(input)); }}>
        <input className="input" placeholder="Ask for a different version" value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} />
        <button className="btn-dark" disabled={busy || !input.trim()}>Ask</button>
      </form>
    </div>
  );
}
