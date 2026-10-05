import type { AuditRow, Note, Patient, Persona, Role, Staff } from './types';
import { QUESTION_SETS, REASONS } from './questions';
import { allergyOf, buildFlags, buildQA, buildSummary, setForReason, type Answers } from '@/lib/engine';

export const PASSWORD = 'Welcome2026!';

export const PERSONAS: Persona[] = [
  { id: 'clinician', name: 'Dr. Elena Marsh', title: 'General practitioner', email: 'elena.marsh@example.com' },
  { id: 'receptionist', name: 'Hannah Lindqvist', title: 'Front desk', email: 'hannah.lindqvist@example.com' },
  { id: 'admin', name: 'Naomi Castellano', title: 'Practice manager', email: 'naomi.castellano@example.com' },
];

export const CLINICIANS = ['Dr. Elena Marsh', 'Dr. Samir Haddad', 'Nurse Tobias Okoye'];

export const STAFF: Staff[] = [
  { id: 's1', name: 'Naomi Castellano', email: 'naomi.castellano@example.com', role: 'admin', active: true, lastActiveMins: 4 },
  { id: 's2', name: 'Dr. Elena Marsh', email: 'elena.marsh@example.com', role: 'clinician', active: true, lastActiveMins: 1 },
  { id: 's3', name: 'Dr. Samir Haddad', email: 'samir.haddad@example.com', role: 'clinician', active: true, lastActiveMins: 9 },
  { id: 's4', name: 'Nurse Tobias Okoye', email: 'tobias.okoye@example.com', role: 'clinician', active: true, lastActiveMins: 17 },
  { id: 's5', name: 'Dr. Ruth Abernathy', email: 'ruth.abernathy@example.com', role: 'clinician', active: true, lastActiveMins: 60 * 26 },
  { id: 's6', name: 'Hannah Lindqvist', email: 'hannah.lindqvist@example.com', role: 'receptionist', active: true, lastActiveMins: 2 },
  { id: 's7', name: 'Dominic Reyes', email: 'dominic.reyes@example.com', role: 'receptionist', active: true, lastActiveMins: 60 * 5 },
  { id: 's8', name: 'Camille Boateng', email: 'camille.boateng@example.com', role: 'receptionist', active: true, invited: true, lastActiveMins: 0 },
];

interface SeedPatient {
  name: string;
  dob: string;
  age: number;
  sex: 'F' | 'M';
  reasonId: string;
  symptoms: string[];
  a: Answers;
  arrived: number; // minutes before sign-in
  appt: number; // minutes after arrival
  clinician: string;
  status: Patient['status'];
  started?: number; // minutes before sign-in
  seen?: number;
  notes?: { by: string; role: Role; mins: number; text: string }[];
}

const SEEDS: SeedPatient[] = [
  { name: 'Harold Pemberton', dob: '3 Feb 1955', age: 71, sex: 'M', reasonId: 'unwell', symptoms: ['chest-pain', 'shortness-breath'], arrived: 38, appt: 5, clinician: 'Dr. Elena Marsh', status: 'Waiting',
    a: { 'a-duration': 'Since today', 'a-severity': '7', 'a-chest-onset': 'In the last hour', 'a-chest-radiate': 'Yes', 'a-breath-rest': 'No', 'a-meds': 'Nothing yet', 'a-allergy': 'Penicillin', 'a-notes': 'Started while I was carrying shopping in.' } },
  { name: 'Lucia Fernandez', dob: '19 Sep 1992', age: 34, sex: 'F', reasonId: 'unwell', symptoms: ['headache', 'nausea', 'dizziness'], arrived: 24, appt: 10, clinician: 'Dr. Samir Haddad', status: 'Waiting',
    a: { 'a-duration': 'Since today', 'a-severity': '8', 'a-headache-sudden': 'Yes', 'a-faint': 'Yes', 'a-meds': 'Paracetamol or ibuprofen', 'a-allergy': 'No known allergies' } },
  { name: 'Tamsin Hartley', dob: '11 Jul 1997', age: 29, sex: 'F', reasonId: 'unwell', symptoms: ['fever', 'cough', 'sore-throat'], arrived: 21, appt: 15, clinician: 'Dr. Elena Marsh', status: 'Waiting',
    a: { 'a-duration': '3 to 6 days', 'a-severity': '5', 'a-fever-temp': '38 to 39°C', 'a-contact': 'Yes', 'a-meds': 'Paracetamol or ibuprofen', 'a-allergy': 'No known allergies', 'a-notes': 'I need a fit note for work if possible.' } },
  { name: 'Dev Kapoor', dob: '24 Nov 1980', age: 45, sex: 'M', reasonId: 'injury', symptoms: ['joint-pain'], arrived: 16, appt: 15, clinician: 'Nurse Tobias Okoye', status: 'Waiting',
    a: { 'b-where': 'Leg or knee', 'b-how': 'Sport or exercise', 'b-when': 'Yesterday', 'b-severity': '6', 'b-weight': 'No', 'b-numb': 'No', 'b-meds': 'Paracetamol or ibuprofen', 'b-allergy': 'No known allergies' } },
  { name: 'Ibrahim Yusuf', dob: '2 May 1967', age: 58, sex: 'M', reasonId: 'followup', symptoms: [], arrived: 9, appt: 15, clinician: 'Dr. Samir Haddad', status: 'Waiting',
    a: { 'c-purpose': 'Blood results', 'c-change': 'No', 'c-new-meds': 'No', 'c-mood': 'Not at all', 'c-allergy': 'No known allergies' } },
  { name: 'Chloe Bergstrom', dob: '30 Jan 2002', age: 23, sex: 'F', reasonId: 'forms', symptoms: ['low-mood'], arrived: 4, appt: 20, clinician: 'Dr. Elena Marsh', status: 'Waiting',
    a: { 'c-purpose': 'A form or letter', 'c-change': 'No', 'c-new-meds': 'No', 'c-mood': 'Several days', 'c-allergy': 'Another medicine', 'c-notes': 'Need a letter for my university.' } },

  { name: 'Gordon Mbeki', dob: '14 Aug 1959', age: 66, sex: 'M', reasonId: 'meds', symptoms: ['fatigue'], arrived: 52, appt: 5, clinician: 'Dr. Elena Marsh', status: 'In review', started: 12,
    a: { 'c-purpose': 'A repeat prescription', 'c-change': 'Yes', 'c-change-detail': 'My ankles swell in the evenings', 'c-new-meds': 'Yes', 'c-side': 'Yes', 'c-mood': 'Several days', 'c-allergy': 'No known allergies' },
    notes: [{ by: 'Dr. Elena Marsh', role: 'clinician', mins: 6, text: 'Ankle swelling since the new tablet started. Checking blood pressure and considering a dose change.' }] },
  { name: 'Annika Solberg', dob: '7 Dec 1988', age: 37, sex: 'F', reasonId: 'unwell', symptoms: ['abdominal-pain', 'nausea'], arrived: 47, appt: 5, clinician: 'Dr. Samir Haddad', status: 'In review', started: 8,
    a: { 'a-duration': '1 to 2 days', 'a-severity': '6', 'a-meds': 'Nothing yet', 'a-allergy': 'No known allergies' } },
  { name: 'Priscilla Dunmore', dob: '21 Mar 1945', age: 80, sex: 'F', reasonId: 'injury', symptoms: ['dizziness'], arrived: 70, appt: 0, clinician: 'Nurse Tobias Okoye', status: 'In review', started: 20,
    a: { 'b-where': 'Head or neck', 'b-how': 'A fall', 'b-when': 'Today', 'b-severity': '4', 'b-head': 'No', 'b-meds': 'Nothing yet', 'b-allergy': 'No known allergies', 'b-notes': 'I tripped on the kerb outside.' },
    notes: [{ by: 'Nurse Tobias Okoye', role: 'clinician', mins: 14, text: 'Small graze above the left eyebrow. Alert and orientated. Observations normal.' }] },

  { name: 'Owen Thackeray', dob: '9 Oct 1974', age: 51, sex: 'M', reasonId: 'checkup', symptoms: ['fatigue', 'low-mood'], arrived: 150, appt: 10, clinician: 'Dr. Elena Marsh', status: 'Seen', started: 128, seen: 105,
    a: { 'c-purpose': 'A general check-up', 'c-change': 'No', 'c-new-meds': 'No', 'c-mood': 'Nearly every day', 'c-allergy': 'No known allergies' },
    notes: [{ by: 'Dr. Elena Marsh', role: 'clinician', mins: 108, text: 'Low mood for several months. Discussed support options and booked a follow-up in two weeks.' }] },
  { name: 'Zainab Rahman', dob: '16 Jun 1994', age: 31, sex: 'F', reasonId: 'unwell', symptoms: ['cough', 'fatigue'], arrived: 175, appt: 5, clinician: 'Dr. Samir Haddad', status: 'Seen', started: 160, seen: 140,
    a: { 'a-duration': '1 to 2 days', 'a-severity': '3', 'a-contact': 'No', 'a-meds': 'Nothing yet', 'a-allergy': 'No known allergies' } },
  { name: 'Marcus Delacroix', dob: '5 Apr 1984', age: 41, sex: 'M', reasonId: 'injury', symptoms: ['joint-pain'], arrived: 205, appt: 10, clinician: 'Nurse Tobias Okoye', status: 'Seen', started: 190, seen: 170,
    a: { 'b-where': 'Back', 'b-how': 'Lifting or twisting', 'b-when': 'This week', 'b-severity': '7', 'b-numb': 'Yes', 'b-meds': 'Paracetamol or ibuprofen', 'b-allergy': 'No known allergies' },
    notes: [{ by: 'Nurse Tobias Okoye', role: 'clinician', mins: 172, text: 'Lower back strain. Tingling in the left foot, referred to Dr. Haddad for a neurological check.' }] },
  { name: 'Fiona McAllister', dob: '28 Feb 1962', age: 64, sex: 'F', reasonId: 'followup', symptoms: [], arrived: 232, appt: 10, clinician: 'Dr. Samir Haddad', status: 'Seen', started: 218, seen: 196,
    a: { 'c-purpose': 'A long-term condition', 'c-change': 'No', 'c-new-meds': 'No', 'c-mood': 'Not at all', 'c-allergy': 'Penicillin' } },
  { name: 'Kenji Watanabe', dob: '12 Jan 1998', age: 27, sex: 'M', reasonId: 'unwell', symptoms: ['rash'], arrived: 255, appt: 5, clinician: 'Dr. Elena Marsh', status: 'Seen', started: 244, seen: 230,
    a: { 'a-duration': '3 to 6 days', 'a-severity': '2', 'a-meds': 'Nothing yet', 'a-allergy': 'Penicillin', 'a-notes': 'Itchy on my forearms, got worse after the gym.' } },
  { name: 'Esther Vandenberg', dob: '23 Sep 1976', age: 49, sex: 'F', reasonId: 'unwell', symptoms: ['palpitations', 'low-mood', 'dizziness'], arrived: 281, appt: 10, clinician: 'Dr. Elena Marsh', status: 'Seen', started: 262, seen: 240,
    a: { 'a-duration': '1 to 2 days', 'a-severity': '5', 'a-faint': 'No', 'a-meds': 'Nothing yet', 'a-allergy': 'No known allergies' },
    notes: [{ by: 'Dr. Elena Marsh', role: 'clinician', mins: 244, text: 'Palpitations settled in clinic, ECG normal. Advised to cut back on caffeine and return if episodes continue.' }] },
];

let noteSeq = 1;
export function seedPatients(now: number): Patient[] {
  const min = 60000;
  return SEEDS.map((s, i) => {
    const set = QUESTION_SETS.find((x) => x.id === setForReason(s.reasonId))!;
    const id = { age: s.age, sex: s.sex };
    const notes: Note[] = (s.notes ?? []).map((n) => ({ id: `n${noteSeq++}`, by: n.by, role: n.role, ts: now - n.mins * min, text: n.text }));
    return {
      id: `p${i + 1}`,
      name: s.name,
      dob: s.dob,
      age: s.age,
      sex: s.sex,
      reasonId: s.reasonId,
      reason: REASONS.find((r) => r.id === s.reasonId)!.label,
      setId: set.id,
      symptoms: s.symptoms,
      qa: buildQA(set, s.symptoms, s.a),
      flags: buildFlags(set.id, s.symptoms, s.a, id),
      summary: buildSummary(set.id, s.reasonId, s.symptoms, s.a, id),
      arrivedAt: now - s.arrived * min,
      apptAt: now - (s.arrived - s.appt) * min,
      clinician: s.clinician,
      status: s.status,
      startedAt: s.started !== undefined ? now - s.started * min : undefined,
      seenAt: s.seen !== undefined ? now - s.seen * min : undefined,
      notes,
      allergy: allergyOf(s.a),
    };
  });
}

type A = AuditRow['action'];
const AUDIT_SEED: [number, string, A, string | undefined, string][] = [
  [3, 'Dr. Elena Marsh', 'Opened intake', 'Gordon Mbeki', 'Read full intake and AI summary'],
  [6, 'Dr. Elena Marsh', 'Added note', 'Gordon Mbeki', 'Clinician note added'],
  [8, 'Dr. Samir Haddad', 'Changed status', 'Annika Solberg', 'Waiting to In review'],
  [9, 'Dr. Samir Haddad', 'Opened intake', 'Annika Solberg', 'Read full intake and AI summary'],
  [12, 'Dr. Elena Marsh', 'Changed status', 'Gordon Mbeki', 'Waiting to In review'],
  [14, 'Nurse Tobias Okoye', 'Added note', 'Priscilla Dunmore', 'Clinician note added'],
  [18, 'Nurse Tobias Okoye', 'Opened intake', 'Priscilla Dunmore', 'Read full intake and AI summary'],
  [20, 'Nurse Tobias Okoye', 'Changed status', 'Priscilla Dunmore', 'Waiting to In review'],
  [26, 'Hannah Lindqvist', 'Viewed queue', undefined, 'Opened today\'s queue'],
  [34, 'Hannah Lindqvist', 'Signed in', undefined, 'Front desk workstation'],
  [41, 'Naomi Castellano', 'Signed in', undefined, 'Practice manager console'],
  [58, 'Dr. Elena Marsh', 'Signed in', undefined, 'Consulting room 2'],
  [96, 'Dr. Elena Marsh', 'Added note', 'Owen Thackeray', 'Clinician note added'],
  [105, 'Dr. Elena Marsh', 'Changed status', 'Owen Thackeray', 'In review to Seen'],
  [118, 'Dr. Elena Marsh', 'Opened intake', 'Owen Thackeray', 'Read full intake and AI summary'],
  [128, 'Dr. Elena Marsh', 'Changed status', 'Owen Thackeray', 'Waiting to In review'],
  [141, 'Dr. Samir Haddad', 'Changed status', 'Zainab Rahman', 'In review to Seen'],
  [158, 'Dr. Samir Haddad', 'Opened intake', 'Zainab Rahman', 'Read full intake and AI summary'],
  [172, 'Nurse Tobias Okoye', 'Added note', 'Marcus Delacroix', 'Clinician note added'],
  [176, 'Dr. Samir Haddad', 'Opened intake', 'Marcus Delacroix', 'Opened after referral'],
  [188, 'Nurse Tobias Okoye', 'Opened intake', 'Marcus Delacroix', 'Read full intake and AI summary'],
  [198, 'Dr. Samir Haddad', 'Changed status', 'Fiona McAllister', 'In review to Seen'],
  [216, 'Dr. Samir Haddad', 'Opened intake', 'Fiona McAllister', 'Read full intake and AI summary'],
  [233, 'Dr. Elena Marsh', 'Changed status', 'Kenji Watanabe', 'In review to Seen'],
  [244, 'Dr. Elena Marsh', 'Opened intake', 'Kenji Watanabe', 'Read full intake and AI summary'],
  [246, 'Dr. Elena Marsh', 'Added note', 'Esther Vandenberg', 'Clinician note added'],
  [262, 'Dr. Elena Marsh', 'Opened intake', 'Esther Vandenberg', 'Read full intake and AI summary'],
  [60 * 20, 'Naomi Castellano', 'Edited question set', undefined, 'Routine and follow-up: reworded the mood question'],
  [60 * 22, 'Naomi Castellano', 'Invited staff', undefined, 'Invited Camille Boateng as Receptionist'],
  [60 * 30, 'Dr. Samir Haddad', 'Edited question set', undefined, 'Injury or pain: reordered the first three questions'],
];

const ROLE_OF: Record<string, Role> = Object.fromEntries(STAFF.map((s) => [s.name, s.role]));
export function seedAudit(now: number): AuditRow[] {
  return AUDIT_SEED.map(([mins, user, action, patient, detail], i) => ({
    id: `a${i + 1}`,
    ts: now - mins * 60000,
    userId: STAFF.find((s) => s.name === user)!.id,
    user,
    role: ROLE_OF[user],
    action,
    patient,
    detail,
  }));
}

/* ---------- Rooms, notifications, returning patients, the scripted arrival ---------- */

import type { Notif, Room } from './types';

export const ROOMS: Room[] = [
  { id: 'r1', name: 'Room 1' },
  { id: 'r2', name: 'Room 2' },
  { id: 'r3', name: 'Room 3' },
  { id: 'r4', name: 'Nurse bay' },
];

/** Patients already in a room when the day starts: the three "In review" patients. */
export const SEED_ROOMS: Record<string, string> = { p7: 'r1', p8: 'r2', p9: 'r4' };

export function seedNotifs(now: number): Notif[] {
  const all: Role[] = ['receptionist', 'clinician', 'admin'];
  const m = 60000;
  return [
    { id: 'nf1', ts: now - 3 * m, text: 'Gordon Mbeki is in Room 1 with Dr. Elena Marsh', kind: 'room', patientId: 'p7', for: all, read: true },
    { id: 'nf2', ts: now - 9 * m, text: 'New check-in: Chloe Bergstrom', kind: 'arrival', patientId: 'p6', for: all, read: true },
    { id: 'nf3', ts: now - 24 * m, text: 'New check-in: Lucia Fernandez, flagged priority', kind: 'alert', patientId: 'p2', for: ['clinician', 'receptionist'] },
    { id: 'nf4', ts: now - 38 * m, text: 'New check-in: Harold Pemberton, flagged priority', kind: 'alert', patientId: 'p1', for: ['clinician', 'receptionist'] },
  ];
}

const isoOf = (d: string) => {
  const t = new Date(d);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};
const LAST_VISIT_DAYS = [21, 34, 9, 60, 14, 120, 5, 45, 16, 28, 70, 90, 38, 150, 12];

export interface Returning { first: string; lastVisitDays: number; allergy: string; }
export function findReturning(first: string, last: string, dobIso: string): Returning | null {
  const name = `${first.trim()} ${last.trim()}`.toLowerCase();
  const i = SEEDS.findIndex((s) => s.name.toLowerCase() === name && isoOf(s.dob) === dobIso);
  if (i >= 0) return { first: SEEDS[i].name.split(' ')[0], lastVisitDays: LAST_VISIT_DAYS[i], allergy: allergyOf(SEEDS[i].a) };
  if (name === 'amara nwosu' && dobIso === '1990-04-18') return { first: 'Amara', lastVisitDays: 38, allergy: 'Penicillin' };
  return null;
}

/** The one scripted walk-in that arrives while staff are on the queue. */
export function scriptedArrival(now: number): Patient {
  const a: Answers = { 'b-where': 'Arm or shoulder', 'b-how': 'A fall', 'b-when': 'Today', 'b-severity': '6', 'b-numb': 'Yes', 'b-meds': 'Nothing yet', 'b-allergy': 'No known allergies', 'b-notes': 'Slipped on the wet steps outside the pharmacy.' };
  const set = QUESTION_SETS.find((x) => x.id === 'injury')!;
  const id = { age: 52, sex: 'F' as const };
  return {
    id: 'p-live',
    name: 'Nadia Rosen',
    dob: '8 Jun 1974',
    age: 52,
    sex: 'F',
    reasonId: 'injury',
    reason: 'Injury or pain',
    setId: 'injury',
    symptoms: ['joint-pain'],
    qa: buildQA(set, ['joint-pain'], a),
    flags: buildFlags('injury', ['joint-pain'], a, id),
    summary: buildSummary('injury', 'injury', ['joint-pain'], a, id),
    arrivedAt: now,
    apptAt: now + 15 * 60000,
    clinician: 'Dr. Elena Marsh',
    status: 'Waiting',
    notes: [],
    allergy: 'No known allergies',
  };
}
