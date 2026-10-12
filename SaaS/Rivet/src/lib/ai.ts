import type { Approval, Milestone, ProjectId, Task } from '@/data/types';
import { client, person, project } from '@/data/static';
import { closeness, dueShort, hrs, r2 } from '@/lib/util';
import type { E } from '@/lib/derive';
import { projectStats } from '@/lib/derive';
import type { Invoice } from '@/data/types';

export type Mode = 'full' | 'short' | 'asks' | 'internal' | 'nudge';
export const PROMPTS: { mode: Mode; label: string; keys: string }[] = [
  { mode: 'full', label: 'Draft the weekly update for the client', keys: 'weekly update draft client status report summary' },
  { mode: 'short', label: 'Make it shorter, for a quick message', keys: 'shorter short brief quick message slack text' },
  { mode: 'asks', label: 'Focus on what we need from the client', keys: 'need from client asks approvals waiting feedback blockers' },
  { mode: 'internal', label: 'Internal version with hours and risks', keys: 'internal team hours budget risks burn overrun' },
  { mode: 'nudge', label: 'Write a friendly nudge about the pending approval', keys: 'nudge remind reminder chase pending approval follow up' },
];

export function matchPrompt(input: string): Mode {
  let best: Mode = 'full';
  let score = 0;
  for (const p of PROMPTS) {
    const s = closeness(input, p.label, p.keys);
    if (s > score) { score = s; best = p.mode; }
  }
  return best;
}

type Ctx = { projectId: ProjectId; tasks: Task[]; entries: E[]; approvals: Approval[]; milestones: Milestone[]; invoices: Invoice[]; sender: string };

const bullets = (items: string[], empty: string) => (items.length ? items.map((i) => `- ${i}`).join('\n') : `- ${empty}`);

export function weeklyDraft(mode: Mode, c: Ctx) {
  const p = project(c.projectId);
  const cl = client(p.clientId);
  const first = cl.contact.split(' ')[0];
  const mine = c.tasks.filter((t) => t.projectId === p.id);
  const done = mine.filter((t) => t.status === 'done' && (t.doneDay ?? -99) >= -7 && !t.internal);
  const active = mine.filter((t) => (t.status === 'doing' || t.status === 'review') && !t.internal);
  const pending = c.approvals.filter((a) => a.projectId === p.id && a.status === 'pending');
  const next = c.milestones.filter((m) => m.projectId === p.id && m.status !== 'done').sort((a, b) => a.due - b.due)[0];
  const week = r2(c.entries.filter((e) => e.projectId === p.id && e.day > -7).reduce((n, e) => n + e.hours, 0));
  const stats = projectStats(p.id, c.entries, c.invoices, c.tasks);
  const pct = Math.round(stats.progress * 100);
  const oldest = pending.slice().sort((a, b) => a.requested - b.requested)[0];

  if (mode === 'short') {
    return `Hi ${first}, quick ${p.name.toLowerCase()} update: ${done.length ? `we finished ${done.slice(0, 2).map((t) => t.title.toLowerCase()).join(' and ')}` : 'steady progress this week'}, and ${active[0] ? `${active[0].title.toLowerCase()} is under way` : 'the next piece is starting'}. ${next ? `Next milestone is ${next.title.toLowerCase()} (${dueShort(next.due)}).` : ''} ${pending.length ? `We are waiting on your sign-off for ${pending[0].title.toLowerCase()}.` : 'Nothing needed from you right now.'} ${c.sender}`.replace(/\s+/g, ' ');
  }
  if (mode === 'asks') {
    return `Hi ${first},\n\nTo keep ${p.name} on track for ${next ? `${next.title.toLowerCase()} on ${dueShort(next.due)}` : 'the next milestone'}, here is what we need from you:\n\n${bullets(pending.map((a) => `${a.title}: waiting since ${dueShort(a.requested)}. Open it in the portal and approve it or ask for changes.`), 'Nothing outstanding. Thank you for staying on top of reviews.')}\n\nIf it is easier, reply here with comments and we will log them for you.\n\nThanks,\n${c.sender}`;
  }
  if (mode === 'nudge') {
    if (!oldest) return `Hi ${first},\n\nNothing is waiting on you for ${p.name} right now, so no action needed. We will send the next review as soon as it is ready.\n\nThanks,\n${c.sender}`;
    return `Hi ${first},\n\nA gentle nudge on "${oldest.title}" for ${p.name}. It has been in your portal since ${dueShort(oldest.requested)}, and a quick yes or a few comments would let us keep moving${next ? ` toward ${next.title.toLowerCase()} on ${dueShort(next.due)}` : ''}.\n\nIt takes about two minutes: open the portal, look at the file and choose Approve or Request changes.\n\nThank you,\n${c.sender}`;
  }
  if (mode === 'internal') {
    const risks: string[] = [];
    if (stats.pct >= 1) risks.push(`Over budget: ${hrs(stats.used)} used of ${hrs(stats.budget)}. Agree a change order before more work.`);
    else if (stats.pct >= 0.9) risks.push(`Close to budget: ${Math.round(stats.pct * 100)}% used (${hrs(stats.used)} of ${hrs(stats.budget)}).`);
    if (stats.overdueTasks) risks.push(`${stats.overdueTasks} task${stats.overdueTasks > 1 ? 's are' : ' is'} past due.`);
    if (oldest && oldest.requested <= -3) risks.push(`"${oldest.title}" has waited ${-oldest.requested} days for client sign-off.`);
    if (stats.unbilled > 0) risks.push(`${hrs(stats.unbilled)} of billable time not yet invoiced.`);
    const notes = mine.filter((t) => t.note && t.status !== 'done').map((t) => `${t.title}: ${t.note}`);
    return `${p.name} (${cl.name}), internal summary\n\nHours: ${hrs(week)} logged this week. ${hrs(stats.used)} of ${hrs(stats.budget)} budget used (${Math.round(stats.pct * 100)}%).\nTasks: ${stats.tasksDone} of ${stats.tasksTotal} done.\n\nRisks\n${bullets(risks, 'None. Hours, tasks and approvals look healthy.')}\n\nNotes from the team\n${bullets(notes.slice(0, 3), 'No open notes.')}\n\nSuggested next steps\n${bullets([pending.length ? 'Chase the pending approval from the portal.' : 'Send the client a short progress note.', stats.pct >= 0.9 ? 'Talk to the client about scope before the budget runs out.' : 'Keep the current pace.', stats.unbilled > 0 ? 'Bill the open time this week.' : 'No open time to bill.'], '')}`;
  }
  return `Hi ${first},\n\nHere is where ${p.name} stands this week.\n\nWhat we finished\n${bullets(done.map((t) => t.title), 'We spent the week on work in progress; nothing new to sign off yet.')}\n\nIn progress\n${bullets(active.slice(0, 3).map((t) => t.title), 'Planning the next stage.')}\n\nComing up\n${bullets(next ? [`${next.title} (${dueShort(next.due)})`] : [], 'Project wrap-up.')}\n\nWhat we need from you\n${bullets(pending.map((a) => `${a.title}, in your portal`), 'Nothing right now, thank you.')}\n\nOverall the project is ${pct}% through its tasks.\n\nBest,\n${c.sender}`;
}

export const personFirst = (id: Parameters<typeof person>[0]) => person(id).name.split(' ')[0];
