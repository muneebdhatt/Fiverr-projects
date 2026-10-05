import type { Question, QuestionSet } from './types';

export const REASONS: { id: string; label: string; hint: string; set: QuestionSet['id'] }[] = [
  { id: 'unwell', label: 'I feel unwell', hint: 'Fever, cough, pain or anything new', set: 'acute' },
  { id: 'injury', label: 'Injury or pain', hint: 'A fall, strain, sore joint or back', set: 'injury' },
  { id: 'followup', label: 'Follow-up visit', hint: 'Your results or a check on how things are going', set: 'routine' },
  { id: 'meds', label: 'Medication review', hint: 'Repeat prescriptions or side effects', set: 'routine' },
  { id: 'checkup', label: 'Routine check-up', hint: 'Blood pressure, health check, screening', set: 'routine' },
  { id: 'forms', label: 'Forms or letters', hint: 'Fit notes, referrals, paperwork', set: 'routine' },
];

export const SYMPTOMS: { id: string; label: string }[] = [
  { id: 'chest-pain', label: 'Chest pain' },
  { id: 'shortness-breath', label: 'Shortness of breath' },
  { id: 'fever', label: 'Fever or chills' },
  { id: 'cough', label: 'Cough' },
  { id: 'sore-throat', label: 'Sore throat' },
  { id: 'headache', label: 'Headache' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'nausea', label: 'Nausea or vomiting' },
  { id: 'abdominal-pain', label: 'Stomach pain' },
  { id: 'rash', label: 'Rash or itching' },
  { id: 'fatigue', label: 'Unusual tiredness' },
  { id: 'palpitations', label: 'Racing heartbeat' },
  { id: 'low-mood', label: 'Low mood or worry' },
  { id: 'joint-pain', label: 'Joint or back pain' },
];

const sev = (id: string): Question => ({
  id, text: 'How much is it bothering you right now?', helper: '0 is no trouble at all, 10 is the worst you can imagine.', type: 'scale', active: true,
});
const meds = (id: string): Question => ({
  id, text: 'Have you taken anything for it?', type: 'choice', active: true,
  options: ['Nothing yet', 'Paracetamol or ibuprofen', 'A prescription medicine', 'Something else'],
});
const allergy = (id: string): Question => ({
  id, text: 'Do you have any medicine allergies?', type: 'choice', active: true,
  options: ['No known allergies', 'Penicillin', 'Another medicine'],
});
const notes = (id: string): Question => ({
  id, text: 'Is there anything else you would like the care team to know?', helper: 'Optional', type: 'text', active: true,
});

export const QUESTION_SETS: QuestionSet[] = [
  {
    id: 'acute',
    name: 'Acute illness',
    blurb: 'For patients who feel unwell today. Follow-ups adapt to the symptoms ticked.',
    usedFor: ['I feel unwell'],
    editedBy: 'Dr. Elena Marsh',
    editedMinsAgo: 60 * 24 * 6,
    questions: [
      { id: 'a-duration', text: 'How long have you felt unwell?', type: 'choice', active: true, options: ['Since today', '1 to 2 days', '3 to 6 days', 'A week or more'] },
      sev('a-severity'),
      { id: 'a-chest-onset', text: 'When did the chest pain start?', type: 'choice', active: true, showIf: { symptom: ['chest-pain'] }, options: ['In the last hour', 'Earlier today', 'A few days ago'] },
      { id: 'a-chest-radiate', text: 'Does the pain spread to your arm, jaw or back?', type: 'yesno', active: true, showIf: { symptom: ['chest-pain'] } },
      { id: 'a-breath-rest', text: 'Is it hard to breathe while sitting still?', type: 'yesno', active: true, showIf: { symptom: ['shortness-breath'] } },
      { id: 'a-fever-temp', text: 'What is the highest temperature you have measured?', type: 'choice', active: true, showIf: { symptom: ['fever'] }, options: ['Have not measured', 'Under 38°C', '38 to 39°C', 'Over 39°C'] },
      { id: 'a-headache-sudden', text: 'Did the headache come on suddenly, or is it the worst you have had?', type: 'yesno', active: true, showIf: { symptom: ['headache'] } },
      { id: 'a-faint', text: 'Have you fainted or nearly fainted today?', type: 'yesno', active: true, showIf: { symptom: ['dizziness'] } },
      { id: 'a-contact', text: 'Have you been around anyone who is sick?', type: 'yesno', active: true, showIf: { symptom: ['fever', 'cough', 'sore-throat'] } },
      meds('a-meds'),
      allergy('a-allergy'),
      notes('a-notes'),
    ],
  },
  {
    id: 'injury',
    name: 'Injury or pain',
    blurb: 'For falls, strains and aches. Asks about head injuries and weight-bearing when relevant.',
    usedFor: ['Injury or pain'],
    editedBy: 'Dr. Samir Haddad',
    editedMinsAgo: 60 * 24 * 12,
    questions: [
      { id: 'b-where', text: 'Where is the injury or pain?', type: 'choice', active: true, options: ['Head or neck', 'Arm or shoulder', 'Back', 'Leg or knee', 'Somewhere else'] },
      { id: 'b-how', text: 'How did it happen?', type: 'choice', active: true, options: ['A fall', 'Sport or exercise', 'Lifting or twisting', 'Gradually, no clear cause'] },
      { id: 'b-when', text: 'When did it start?', type: 'choice', active: true, options: ['Today', 'Yesterday', 'This week', 'Longer ago'] },
      sev('b-severity'),
      { id: 'b-head', text: 'Did you lose consciousness or feel confused afterwards?', type: 'yesno', active: true, showIf: { answer: { id: 'b-where', in: ['Head or neck'] } } },
      { id: 'b-weight', text: 'Can you put your weight on it?', type: 'yesno', active: true, showIf: { answer: { id: 'b-where', in: ['Leg or knee'] } } },
      { id: 'b-numb', text: 'Do you have any numbness or tingling?', type: 'yesno', active: true, showIf: { answer: { id: 'b-severity', gte: 5 } } },
      meds('b-meds'),
      allergy('b-allergy'),
      notes('b-notes'),
    ],
  },
  {
    id: 'routine',
    name: 'Routine and follow-up',
    blurb: 'For reviews, repeat prescriptions, check-ups and paperwork. Short and calm.',
    usedFor: ['Follow-up visit', 'Medication review', 'Routine check-up', 'Forms or letters'],
    editedBy: 'Naomi Castellano',
    editedMinsAgo: 60 * 24 * 3,
    questions: [
      { id: 'c-purpose', text: 'What would you like to cover today?', type: 'choice', active: true, options: ['Blood results', 'A repeat prescription', 'A long-term condition', 'A general check-up', 'A form or letter'] },
      { id: 'c-change', text: 'Has anything changed since your last visit?', type: 'yesno', active: true },
      { id: 'c-change-detail', text: 'Tell us what has changed.', type: 'text', active: true, showIf: { answer: { id: 'c-change', in: ['Yes'] } } },
      { id: 'c-new-meds', text: 'Are you taking any new medicines?', type: 'yesno', active: true },
      { id: 'c-side', text: 'Have you noticed any side effects?', type: 'yesno', active: true, showIf: { answer: { id: 'c-new-meds', in: ['Yes'] } } },
      { id: 'c-mood', text: 'Over the past two weeks, how often have you felt low or worried?', type: 'choice', active: true, options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      allergy('c-allergy'),
      notes('c-notes'),
    ],
  },
];
