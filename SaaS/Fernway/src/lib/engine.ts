import { REASONS, SYMPTOMS } from '@/data/questions';
import type { Flag, Patient, QA, Question, QuestionSet } from '@/data/types';

export type Answers = Record<string, string>;

export const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id;

/** Questions the patient should see, given what they ticked and answered so far. */
export function visibleQuestions(set: QuestionSet, symptoms: string[], answers: Answers): Question[] {
  return set.questions.filter((q) => {
    if (!q.active) return false;
    const c = q.showIf;
    if (!c) return true;
    if (c.symptom && !c.symptom.some((s) => symptoms.includes(s))) return false;
    if (c.answer) {
      const v = answers[c.answer.id];
      if (v === undefined || v === '') return false;
      if (c.answer.in && !c.answer.in.includes(v)) return false;
      if (c.answer.gte !== undefined && Number(v) < c.answer.gte) return false;
    }
    return true;
  });
}

export function conditionLabel(q: Question, set: QuestionSet): string | null {
  const c = q.showIf;
  if (!c) return null;
  if (c.symptom) return `Shown if: ${c.symptom.map((s) => symptomLabel(s).toLowerCase()).join(' or ')}`;
  if (c.answer) {
    const src = set.questions.find((x) => x.id === c.answer!.id);
    const name = src ? src.text.replace(/[?.]$/, '') : c.answer.id;
    if (c.answer.gte !== undefined) return `Shown if: "${name}" is ${c.answer.gte} or more`;
    return `Shown if: "${name}" is ${c.answer.in?.join(' or ')}`;
  }
  return null;
}

export const isFalseish = (v?: string) => !v || v === 'No';
const list = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

interface Identity { age: number; sex: 'F' | 'M'; }
const person = (i: Identity) => `${i.age}-year-old ${i.sex === 'F' ? 'woman' : 'man'}`;

function medsSentence(v?: string) {
  if (!v) return '';
  if (v === 'Nothing yet') return 'Has taken nothing for it so far.';
  if (v === 'Paracetamol or ibuprofen') return 'Has been taking paracetamol or ibuprofen.';
  if (v === 'A prescription medicine') return 'Has taken a prescription medicine for it.';
  return 'Has tried another remedy.';
}
function allergySentence(v?: string) {
  if (!v) return '';
  if (v === 'No known allergies') return 'No known medicine allergies.';
  if (v === 'Penicillin') return 'Allergic to penicillin.';
  return 'Reports an allergy to another medicine, to be confirmed.';
}
const noteSentence = (v?: string) => (v && v.trim() ? `In their words: "${v.trim()}"` : '');

export function buildQA(set: QuestionSet, symptoms: string[], answers: Answers): QA[] {
  return visibleQuestions(set, symptoms, answers)
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
    .map((q) => ({ id: q.id, q: q.text, a: q.type === 'scale' ? `${answers[q.id]} out of 10` : answers[q.id] }));
}

export function buildFlags(setId: QuestionSet['id'], symptoms: string[], a: Answers, id: Identity): Flag[] {
  const f: Flag[] = [];
  const has = (s: string) => symptoms.includes(s);
  if (has('chest-pain')) {
    f.push({ level: 'urgent', text: 'Reports chest pain, flag for nurse' });
    if (a['a-chest-radiate'] === 'Yes') f.push({ level: 'urgent', text: 'Pain spreads to arm, jaw or back' });
    if (a['a-chest-onset'] === 'In the last hour') f.push({ level: 'urgent', text: 'Chest pain started within the last hour' });
  }
  if (has('shortness-breath') && a['a-breath-rest'] === 'Yes') f.push({ level: 'urgent', text: 'Short of breath while at rest' });
  if (has('headache') && a['a-headache-sudden'] === 'Yes') f.push({ level: 'urgent', text: 'Sudden or worst-ever headache, flag for clinician' });
  if (a['b-head'] === 'Yes') f.push({ level: 'urgent', text: 'Head injury with loss of consciousness or confusion' });
  else if (a['b-where'] === 'Head or neck' && a['b-how'] === 'A fall') f.push({ level: 'review', text: 'Head or neck injury after a fall' });
  if (has('dizziness') && a['a-faint'] === 'Yes') f.push({ level: 'review', text: 'Fainted or nearly fainted today' });
  if (a['a-fever-temp'] === 'Over 39°C') f.push({ level: 'review', text: 'High fever, over 39°C' });
  if (a['b-weight'] === 'No') f.push({ level: 'review', text: 'Cannot put weight on the injured leg' });
  if (a['b-numb'] === 'Yes') f.push({ level: 'review', text: 'Numbness or tingling with the pain' });
  if (a['c-side'] === 'Yes') f.push({ level: 'review', text: 'Possible side effects from a new medicine' });
  if (a['c-mood'] === 'Nearly every day') f.push({ level: 'review', text: 'Low or worried nearly every day, offer a wellbeing check' });
  const sev = Number(a['a-severity'] ?? a['b-severity'] ?? 0);
  if (sev >= 8) f.push({ level: 'review', text: `Rates how they feel ${sev} out of 10` });
  const allergy = a['a-allergy'] ?? a['b-allergy'] ?? a['c-allergy'];
  if (allergy === 'Penicillin') f.push({ level: 'info', text: 'Allergy: penicillin' });
  else if (allergy === 'Another medicine') f.push({ level: 'info', text: 'Allergy to another medicine, confirm which' });
  if (setId === 'acute' && id.age >= 65 && f.some((x) => x.level !== 'info')) f.push({ level: 'info', text: 'Aged 65 or over' });
  const order = { urgent: 0, review: 1, info: 2 } as const;
  return f.sort((x, y) => order[x.level] - order[y.level]);
}

export function buildSummary(setId: QuestionSet['id'], reasonId: string, symptoms: string[], a: Answers, id: Identity): string {
  const p = person(id);
  const parts: string[] = [];
  if (setId === 'acute') {
    const dur = a['a-duration'];
    const durText = !dur ? '' : dur === 'Since today' ? ' since today' : ` for ${lc(dur)}`;
    const sev = a['a-severity'] ? `, rated ${a['a-severity']} out of 10` : '';
    parts.push(`${p} who feels unwell, reporting ${list(symptoms.map((s) => symptomLabel(s).toLowerCase()))}${durText}${sev}.`);
    if (a['a-chest-onset']) {
      const when = { 'In the last hour': 'within the last hour', 'Earlier today': 'earlier today', 'A few days ago': 'a few days ago' }[a['a-chest-onset']] ?? '';
      parts.push(`Chest pain began ${when}${a['a-chest-radiate'] === 'Yes' ? ' and spreads to the arm, jaw or back' : a['a-chest-radiate'] === 'No' ? ' without spreading' : ''}.`);
    }
    if (a['a-breath-rest']) parts.push(a['a-breath-rest'] === 'Yes' ? 'Finds it hard to breathe even when sitting still.' : 'Breathing is comfortable at rest.');
    if (a['a-fever-temp'] && a['a-fever-temp'] !== 'Have not measured') parts.push(`Highest temperature measured: ${a['a-fever-temp'].replace('Under ', 'under ').replace('Over ', 'over ')}.`);
    if (a['a-headache-sudden']) parts.push(a['a-headache-sudden'] === 'Yes' ? 'The headache came on suddenly.' : 'The headache built up gradually.');
    if (a['a-faint']) parts.push(a['a-faint'] === 'Yes' ? 'Has fainted or nearly fainted today.' : 'No fainting today.');
    if (a['a-contact'] === 'Yes') parts.push('Has been around someone who is unwell.');
    parts.push(medsSentence(a['a-meds']), allergySentence(a['a-allergy']), noteSentence(a['a-notes']));
  } else if (setId === 'injury') {
    const where = (a['b-where'] ?? 'unspecified area').toLowerCase();
    const how = { 'A fall': 'after a fall', 'Sport or exercise': 'during sport or exercise', 'Lifting or twisting': 'while lifting or twisting', 'Gradually, no clear cause': 'gradually with no clear cause' }[a['b-how'] ?? ''] ?? '';
    const when = a['b-when'] ? { Today: 'today', Yesterday: 'yesterday', 'This week': 'earlier this week', 'Longer ago': 'more than a week ago' }[a['b-when']] : '';
    parts.push(`${p} with pain or injury to the ${where} ${how}${when ? `, starting ${when}` : ''}${a['b-severity'] ? `, rated ${a['b-severity']} out of 10` : ''}.`);
    if (a['b-head']) parts.push(a['b-head'] === 'Yes' ? 'Lost consciousness or felt confused afterwards.' : 'No loss of consciousness or confusion.');
    if (a['b-weight']) parts.push(a['b-weight'] === 'Yes' ? 'Able to put weight on it.' : 'Unable to put weight on it.');
    if (a['b-numb']) parts.push(a['b-numb'] === 'Yes' ? 'Reports numbness or tingling.' : 'No numbness or tingling.');
    parts.push(medsSentence(a['b-meds']), allergySentence(a['b-allergy']), noteSentence(a['b-notes']));
  } else {
    const reason = REASONS.find((r) => r.id === reasonId)?.label.toLowerCase() ?? 'a visit';
    const purpose = a['c-purpose'] ? `, wanting to cover ${lc(a['c-purpose'])}` : '';
    parts.push(`${p} attending for a ${reason}${purpose}.`);
    if (a['c-change']) parts.push(a['c-change'] === 'Yes' ? `Reports a change since the last visit${a['c-change-detail'] ? `: "${a['c-change-detail'].trim()}"` : ''}.` : 'Nothing has changed since the last visit.');
    if (a['c-new-meds']) parts.push(a['c-new-meds'] === 'Yes' ? `Taking a new medicine${a['c-side'] === 'Yes' ? ' and has noticed side effects' : a['c-side'] === 'No' ? ' with no side effects' : ''}.` : 'No new medicines.');
    if (a['c-mood'] && a['c-mood'] !== 'Not at all') parts.push(`Has felt low or worried ${lc(a['c-mood'])} over the past two weeks.`);
    parts.push(allergySentence(a['c-allergy']), noteSentence(a['c-notes']));
  }
  return parts.filter(Boolean).join(' ');
}

export function allergyOf(a: Answers) {
  return a['a-allergy'] ?? a['b-allergy'] ?? a['c-allergy'] ?? 'No known allergies';
}

export function setForReason(reasonId: string): QuestionSet['id'] {
  return REASONS.find((r) => r.id === reasonId)?.set ?? 'routine';
}

/* ---------- Ask-about-this-intake (prepared answers) ---------- */

export const AI_PROMPTS = [
  'What should I check first?',
  'Any allergy or medication concerns?',
  'What questions should I ask in the room?',
  'Draft a chart note from this intake',
];

const ASK: Record<string, string> = {
  'chest-pain': 'Any history of heart disease, high blood pressure or a family history? Is the pain related to exertion, and has it eased at all?',
  'shortness-breath': 'Any wheeze, leg swelling or recent long journeys? How far can they walk before stopping?',
  fever: 'When did the fever begin, and is there a rash, stiff neck or pain passing urine?',
  cough: 'Is it dry or productive, and is there any blood in the phlegm? Are they a smoker?',
  'sore-throat': 'Can they swallow fluids comfortably, and is there swelling or drooling?',
  headache: 'Any visual changes, neck stiffness or weakness? Has anything like this happened before?',
  dizziness: 'Is it spinning or light-headed? Check lying and standing blood pressure.',
  nausea: 'Is the patient keeping fluids down, and are there signs of dehydration?',
  'abdominal-pain': 'Where is the pain, and does it move? Any changes to bowel habit or urine?',
  rash: 'Is it itchy or painful, and has it spread? Any new soaps, foods or medicines?',
  fatigue: 'How long has the tiredness lasted, and how is sleep, appetite and mood?',
  palpitations: 'Do episodes start and stop suddenly? Any caffeine, stimulants or chest discomfort?',
  'low-mood': 'How is sleep and appetite, and is there support at home? Consider a structured wellbeing questionnaire.',
  'joint-pain': 'Is there morning stiffness, swelling or locking? Any recent change in activity?',
};

export function askAbout(p: Patient, prompt: string): string {
  const q = prompt.toLowerCase();
  const urgent = p.flags.filter((f) => f.level === 'urgent');
  const review = p.flags.filter((f) => f.level === 'review');
  if (/allerg|medic|drug|interact|prescri/.test(q)) {
    const meds = p.qa.find((x) => /taken anything/i.test(x.q));
    const side = p.qa.find((x) => /side effects/i.test(x.q));
    return [
      p.allergy === 'No known allergies' ? 'No medicine allergies were reported at check-in.' : `${p.allergy === 'Penicillin' ? 'Penicillin allergy' : 'An unspecified medicine allergy'} was reported at check-in. Confirm the reaction type before prescribing and avoid related antibiotics until clarified.`,
      meds ? `Self-treatment: ${meds.a.toLowerCase()}.` : 'No self-treatment was recorded.',
      side?.a === 'Yes' ? 'The patient has noticed side effects from a new medicine, so a medication review is worthwhile.' : 'No medication side effects were reported.',
    ].join(' ');
  }
  if (/question|ask|room/.test(q)) {
    const qs = p.symptoms.slice(0, 3).map((s) => ASK[s]).filter(Boolean);
    if (qs.length === 0) return `Suggested questions: What prompted the visit today? Has anything changed since the last review? Is there anything the patient was worried about but did not write down at the kiosk?`;
    return `Suggested questions: ${qs.map((x, i) => `(${i + 1}) ${x}`).join(' ')}`;
  }
  if (/note|chart|draft|write/.test(q)) {
    return `Check-in note: ${p.summary} ${p.flags.length ? `Flags raised: ${p.flags.map((f) => f.text.toLowerCase()).join('; ')}.` : 'No flags raised.'} Examination and plan to be completed by the clinician.`;
  }
  // default and "what should I check first"
  if (urgent.length) return `Start with the urgent items: ${urgent.map((f) => f.text.toLowerCase()).join('; ')}. Consider a prompt set of observations (pulse, blood pressure, oxygen saturation) before the consultation, and let reception know this patient should not wait.`;
  if (review.length) return `Nothing urgent, but worth confirming early: ${review.map((f) => f.text.toLowerCase()).join('; ')}. Then work through the remaining answers below.`;
  return 'Nothing urgent came up at check-in. This looks suitable for a standard consultation, so begin with what the patient most wanted to cover today.';
}

export function bestPrompt(input: string): string {
  const q = input.toLowerCase();
  const score = AI_PROMPTS.map((p) => ({ p, s: p.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && q.includes(w)).length }));
  score.sort((a, b) => b.s - a.s);
  return score[0].s > 0 ? score[0].p : AI_PROMPTS[0];
}
