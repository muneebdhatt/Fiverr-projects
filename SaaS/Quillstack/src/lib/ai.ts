import type { AiAction, Doc } from '@/data/types';

export const AI_LABELS: Record<AiAction, string> = {
  summary: 'AI summarise',
  actions: 'Extract action items',
  rewrite: 'Rewrite more clearly',
  translate: 'Translate to Spanish',
  formal: 'Formal tone',
  friendly: 'Friendly tone',
  concise: 'Make it concise',
  followup: 'Follow-up',
};

export const AUDIT_LABEL: Record<AiAction, string> = {
  summary: 'AI summarise',
  actions: 'AI action items',
  rewrite: 'AI rewrite',
  translate: 'AI translate',
  formal: 'AI rewrite',
  friendly: 'AI rewrite',
  concise: 'AI rewrite',
  followup: 'AI follow-up',
};

export const SUGGESTIONS: { action: AiAction; prompt: string }[] = [
  { action: 'summary', prompt: 'Summarise this document' },
  { action: 'actions', prompt: 'What are the action items?' },
  { action: 'rewrite', prompt: 'Rewrite this in a clearer, shorter way' },
  { action: 'translate', prompt: 'Translate the summary into Spanish' },
];

export const TONES: { action: AiAction; prompt: string }[] = [
  { action: 'formal', prompt: 'Rewrite this in a formal tone' },
  { action: 'friendly', prompt: 'Rewrite this in a friendly tone' },
  { action: 'concise', prompt: 'Make this more concise' },
];

const FOLLOWUP = /(shorter|longer|more detail|expand|elaborate|bullet|as a list|condense|trim|simplif|make it|more formal|more friendly|more casual|casual)/i;

/** Free-typed prompts always land on the closest prepared answer, never an error. */
export function routePrompt(prompt: string, hasPrevious: boolean): AiAction {
  const p = prompt.toLowerCase();
  if (hasPrevious && FOLLOWUP.test(p)) return 'followup';
  const score: Record<string, number> = { summary: 0, actions: 0, rewrite: 0, translate: 0, formal: 0, friendly: 0, concise: 0 };
  const words: Record<string, string[]> = {
    summary: ['summar', 'tl;dr', 'tldr', 'overview', 'brief', 'main points', 'gist', 'explain', 'about'],
    actions: ['action', 'todo', 'to-do', 'task', 'next step', 'follow', 'do next', 'owner', 'deadline'],
    rewrite: ['rewrite', 'rephrase', 'clearer', 'simplify', 'improve', 'edit', 'polish'],
    translate: ['translat', 'spanish', 'español', 'espanol', 'language', 'french', 'german'],
    formal: ['formal', 'professional', 'polite'],
    friendly: ['friendly', 'casual', 'warm', 'relaxed'],
    concise: ['concise', 'shorter', 'short', 'trim', 'condense'],
  };
  Object.keys(words).forEach((k) => words[k].forEach((w) => p.includes(w) && (score[k] += 1)));
  const best = Object.keys(score).sort((a, b) => score[b] - score[a])[0];
  return (score[best] === 0 ? 'summary' : best) as AiAction;
}

const sentences = (t: string) => t.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [t];
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Adjusts the previous answer according to what the user asked for. Always returns something sensible. */
export function followUp(prompt: string, prev: string, doc: Doc): string {
  const p = prompt.toLowerCase();
  const lines = prev.split('\n').filter(Boolean);
  const items = lines.map((l) => l.replace(/^\d+\.\s*/, '').replace(/^•\s*/, '').replace(/[.]$/, ''));
  // A list stays a list: its items are joined with semicolons so each one survives being split again.
  const flat = lines.length > 1 ? `${items.join('; ')}.` : prev;
  if (/(longer|more detail|expand|elaborate)/.test(p)) {
    const ctx = sentences(doc.body[0] ?? '')[0] ?? '';
    return `${flat}\n\nFor context: ${ctx}`.trim();
  }
  if (/(bullet|list)/.test(p)) {
    return (lines.length > 1 ? items : sentences(flat).map((x) => x.replace(/[.]$/, ''))).map((x) => `• ${x}`).join('\n');
  }
  if (/formal/.test(p)) return `Please note the following. ${flat}`;
  if (/(friendly|casual)/.test(p)) return `Quick update: ${flat} Shout if anything needs changing!`;
  // shorter, concise, trim, simplify, "make it ..."
  const first = lines.length > 1 ? items[0] : sentences(flat)[0] ?? flat;
  return first.length > 160 ? `${first.slice(0, 157).trimEnd()}…` : first;
}

export function answerFor(doc: Doc, action: AiAction, prev?: string, prompt?: string): string {
  switch (action) {
    case 'summary': return doc.summary;
    case 'actions': return doc.actions.map((a, i) => `${i + 1}. ${a}`).join('\n');
    case 'rewrite': return doc.rewrite;
    case 'translate': return doc.es;
    case 'formal': return `Please note the following. ${doc.rewrite}`;
    case 'friendly': return `Quick update for the team: ${lcFirst(doc.rewrite)} Shout if anything needs changing!`;
    case 'concise': return sentences(doc.summary)[0] ?? doc.summary;
    case 'followup': return followUp(prompt ?? '', prev ?? doc.summary, doc);
  }
}
