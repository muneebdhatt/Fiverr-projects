export type Role = 'Bartender' | 'Server' | 'Line Cook' | 'Dishwasher' | 'Event Setup' | 'Banquet Captain';
export type PersonaId = 'business' | 'worker' | 'admin';
export type ShiftStatus = 'Open' | 'Filled' | 'Unfilled' | 'Cancelled' | 'Scheduled';
export type EscalateRule = 'none' | 'rate' | 'radius' | 'both';

export interface Persona { id: PersonaId; name: string; title: string; email: string; password: string }

export interface Worker {
  id: string;
  name: string;
  phone: string;
  primary: Role;
  skills: Role[];
  rating: number;
  reliability: number;
  distance: number;
  jobs: number;
  licence: string;
  days: string[];
  joinedDays: number;
  unsubscribed: boolean;
  about: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  address: string;
  contact: string;
  email: string;
  sinceDays: number;
  status: 'Active' | 'Payment failed';
}

export interface Shift {
  id: string;
  businessId: string;
  role: Role;
  dayOffset: number;
  start: number;
  end: number;
  rate: number;
  location: string;
  status: ShiftStatus;
  positions: number;
  filledBy?: string;
  filledByIds?: string[];
  sent: number;
  replies: number;
  secsToFill?: number;
  autoEscalate?: EscalateRule;
  escalated?: { bump: number; radius: number };
  recurring?: boolean;
}

export interface Template {
  id: string;
  name: string;
  role: Role;
  start: number;
  end: number;
  rate: number;
  location: string;
  positions: number;
}

export type ComplianceEvent = 'Opt-in consent' | 'STOP received' | 'START received' | 'Consent confirmed';
export interface ComplianceRow {
  id: string;
  workerId: string;
  event: ComplianceEvent;
  source: string;
  minsAgo: number;
}
