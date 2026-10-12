import { firstName, type ActionItem, type Answer, type Closest, type Meeting, type QA } from '@/data';
import { closeness, coverage, dueShort } from './util';

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

function derived(m: Meeting, actions: ActionItem[]): QA[] {
  const mine = actions.filter((a) => a.meeting === m.id);
  const decided: QA = {
    q: 'What was decided?',
    keys: ['decided', 'decision', 'decisions', 'agree', 'agreed', 'conclusion', 'outcome', 'settled'],
    a: { text: `Here is what was decided in ${m.title}:\n${m.decisions.map((d, i) => `• ${d.text} [${i + 1}]`).join('\n')}`, cites: m.decisions.map((d) => d.line) },
  };
  const owned: QA = {
    q: 'What are the action items?',
    keys: ['action', 'actions', 'todo', 'tasks', 'owner', 'owners', 'who', 'follow-up', 'followups', 'steps', 'assigned'],
    a: {
      text: `${mine.length} action items came out of this meeting:\n${mine.map((a, i) => `• ${firstName(a.owner)}: ${lowerFirst(a.title)}, ${a.status === 'done' ? 'done' : dueShort(a.due).toLowerCase()} [${i + 1}]`).join('\n')}`,
      cites: mine.map((a) => a.line),
    },
  };
  const top = mine[0];
  const recap: QA = {
    q: 'Summarize this in three bullets',
    keys: ['summary', 'summarize', 'summarise', 'overview', 'recap', 'bullets', 'tldr', 'gist'],
    a: {
      text: [
        m.decisions[0] ? `• ${m.decisions[0].text} [1]` : '',
        m.decisions[1] ? `• ${m.decisions[1].text} [2]` : '',
        top ? `• Next up: ${firstName(top.owner)} to ${lowerFirst(top.title)} [3]` : '',
      ].filter(Boolean).join('\n'),
      cites: [m.decisions[0]?.line ?? 0, m.decisions[1]?.line ?? 0, top?.line ?? 0],
    },
  };
  return [decided, owned, recap];
}

/** 3 to 5 suggested prompts: the meeting's prepared questions first, then the generic ones. */
export function promptsFor(m: Meeting, actions: ActionItem[]): string[] {
  const list = [...m.qa.map((x) => x.q), ...derived(m, actions).map((x) => x.q)];
  return list.slice(0, 5);
}

const snippet = (s: string, n = 96) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…');

function closestMeetings(text: string, m: Meeting, all: Meeting[]): Closest[] {
  const scored = all
    .filter((x) => x.id !== m.id)
    .map((x) => {
      let best = { line: 0, score: 0 };
      x.lines.forEach((l, i) => {
        const s = coverage(text, l.text);
        if (s > best.score) best = { line: i, score: s };
      });
      return { x, ...best, score: best.score + coverage(text, x.title) * 0.5 };
    })
    .sort((a, b) => b.score - a.score || b.x.day - a.x.day);
  return scored.slice(0, 2).map(({ x, line }) => ({ meeting: x.id, line, why: `${firstName(x.lines[line].who)}: "${snippet(x.lines[line].text)}"` }));
}

export function answerFor(m: Meeting, text: string, all: Meeting[], actions: ActionItem[]): Answer {
  const mine = actions.filter((a) => a.meeting === m.id);
  const cands: { a: Answer; score: number; min: number }[] = [];
  for (const x of [...m.qa, ...derived(m, actions)]) cands.push({ a: x.a, score: closeness(text, x.q, ...x.keys), min: 0.2 });
  for (const d of m.decisions) {
    cands.push({ a: { text: `The notes record this as a decision: ${d.text} [1]`, cites: [d.line] }, score: closeness(text, d.text), min: 0.4 });
  }
  for (const a of mine) {
    cands.push({
      a: { text: `${firstName(a.owner)} owns this: ${lowerFirst(a.title)}. ${a.status === 'done' ? 'It is done' : `It is ${dueShort(a.due) === 'Today' ? 'due today' : `due ${dueShort(a.due)}`}`} [1]`, cites: [a.line] },
      score: closeness(text, a.title),
      min: 0.4,
    });
  }
  const ok = cands.filter((c) => c.score >= c.min).sort((a, b) => b.score - a.score);
  if (ok.length) return ok[0].a;
  return { text: 'This was not discussed in the meeting.', cites: [], notDiscussed: true, closest: closestMeetings(text, m, all) };
}
