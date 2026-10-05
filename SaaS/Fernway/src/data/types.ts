export type Role = 'receptionist' | 'clinician' | 'admin';
export type Status = 'Waiting' | 'In review' | 'Seen';
export type FlagLevel = 'urgent' | 'review' | 'info';
export type QType = 'choice' | 'scale' | 'yesno' | 'text';

export interface Persona { id: Role; name: string; title: string; email: string; }

export interface Condition {
  /** shown if any of these symptoms was ticked */
  symptom?: string[];
  /** shown if an earlier answer matches */
  answer?: { id: string; in?: string[]; gte?: number };
}
export interface Question {
  id: string;
  text: string;
  helper?: string;
  type: QType;
  options?: string[];
  showIf?: Condition;
  active: boolean;
}
export interface QuestionSet {
  id: 'acute' | 'injury' | 'routine';
  name: string;
  blurb: string;
  usedFor: string[];
  editedBy: string;
  editedMinsAgo: number;
  questions: Question[];
}

export interface Flag { level: FlagLevel; text: string; }
export interface QA { id: string; q: string; a: string; }
export interface Note { id: string; by: string; role: Role; ts: number; text: string; }

export interface Patient {
  id: string;
  name: string;
  dob: string;
  age: number;
  sex: 'F' | 'M';
  reasonId: string;
  reason: string;
  setId: QuestionSet['id'];
  symptoms: string[];
  qa: QA[];
  flags: Flag[];
  summary: string;
  arrivedAt: number;
  apptAt: number;
  clinician: string;
  status: Status;
  startedAt?: number;
  seenAt?: number;
  notes: Note[];
  walkIn?: boolean;
  allergy: string;
}

export interface AuditRow {
  id: string;
  ts: number;
  userId: string;
  user: string;
  role: Role | 'system';
  action: 'Opened intake' | 'Changed status' | 'Added note' | 'Viewed queue' | 'Signed in' | 'Edited question set' | 'Invited staff' | 'Called to desk' | 'Alerted nurse' | 'Acknowledged alert' | 'Assigned room' | 'Exported report';
  patient?: string;
  detail: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  invited?: boolean;
  lastActiveMins: number;
}

export interface Alerts { desk?: number; nurse?: { ts: number; by: string; ack?: boolean } }

export interface Room { id: string; name: string; }
export interface Notif {
  id: string;
  ts: number;
  text: string;
  kind: 'arrival' | 'alert' | 'room' | 'info';
  patientId?: string;
  for: Role[];
  read?: boolean;
}
