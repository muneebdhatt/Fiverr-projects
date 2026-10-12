import type { ActionItem, Meeting } from '@/data';
import { person } from '@/data';
import { tokens } from './util';

export type Hit =
  | { kind: 'meeting'; meeting: Meeting; snippet: string }
  | { kind: 'line'; meeting: Meeting; line: number; snippet: string }
  | { kind: 'action'; meeting: Meeting; action: ActionItem; snippet: string };

const has = (hay: string, words: string[]) => {
  const h = hay.toLowerCase();
  return words.every((w) => h.includes(w));
};

/** Every word has to appear (as a prefix of a word, case-insensitive). Meetings first, then transcript moments, then actions. */
export function searchAll(query: string, meetings: Meeting[], actions: ActionItem[], limit = 9): Hit[] {
  const words = tokens(query).length ? tokens(query) : query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const out: Hit[] = [];
  for (const m of meetings) if (has(`${m.title} ${m.tag} ${m.summary}`, words)) out.push({ kind: 'meeting', meeting: m, snippet: m.summary });
  for (const a of actions) {
    const m = meetings.find((x) => x.id === a.meeting);
    if (m && has(`${a.title} ${person(a.owner).name}`, words)) out.push({ kind: 'action', meeting: m, action: a, snippet: a.title });
  }
  for (const m of meetings) m.lines.forEach((l, i) => has(l.text, words) && out.push({ kind: 'line', meeting: m, line: i, snippet: l.text }));
  return out.slice(0, limit);
}

export function queryWords(query: string) {
  return tokens(query).length ? tokens(query) : query.toLowerCase().split(/\s+/).filter(Boolean);
}
