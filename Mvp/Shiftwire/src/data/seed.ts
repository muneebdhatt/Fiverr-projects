import type { Business, ComplianceRow, Persona, Role, Shift, Template, Worker } from './types';

export const ROLES: Role[] = ['Bartender', 'Server', 'Line Cook', 'Dishwasher', 'Event Setup', 'Banquet Captain'];
export const PRICE = 399;
export const ME_BUSINESS = 'b1';
export const ME_WORKER = 'w3';

export const PERSONAS: Persona[] = [
  { id: 'business', name: 'Marcus Bell', title: 'Owner, Cedar & Pine Events', email: 'marcus.bell@example.com', password: 'Welcome2026!' },
  { id: 'worker', name: 'Marisol Delgado', title: 'Worker, Line Cook', email: 'marisol.delgado@example.com', password: 'Welcome2026!' },
  { id: 'admin', name: 'Ravi Shah', title: 'Shiftwire operations', email: 'ravi.shah@example.com', password: 'Welcome2026!' },
];

const FIRST = ['Jamal', 'Priya', 'Marisol', 'Devon', 'Aisha', 'Tomas', 'Keisha', 'Luca', 'Nadia', 'Omar', 'Brianna', 'Felix', 'Sofia', 'Andre', 'Hana', 'Caleb', 'Imani', 'Mateo', 'Chloe', 'Dmitri', 'Renee', 'Isaac', 'Yara', 'Gabriel', 'Tasha', 'Noah', 'Lucia', 'Marcus', 'Zoe', 'Elias', 'Camila', 'Dante', 'Maya', 'Victor', 'Leah', 'Raj', 'Bianca', 'Owen', 'Amara', 'Theo'];
const LAST = ['Carter', 'Nair', 'Delgado', 'Brooks', 'Rahman', 'Novak', 'Johnson', 'Moretti', 'Haddad', 'Farouk', 'Ellis', 'Larsen', 'Reyes', 'Walker', 'Sato', 'Foster', 'Okafor', 'Ramos', 'Bennett', 'Volkov', 'Dubois', 'Cohen', 'Mansour', 'Silva', 'Greene', 'Kim', 'Herrera', 'Alvarez', 'Chen', 'Haile', 'Torres', 'Wright', 'Patel', 'Moreau', 'Hughes', 'Singh', 'Costa', 'Murray', 'Diallo', 'Fischer'];
const LICENCE: Record<Role, string> = {
  Bartender: 'Alcohol Server Permit',
  Server: 'Food Handler Card',
  'Line Cook': 'ServSafe Food Handler',
  Dishwasher: 'Food Handler Card',
  'Event Setup': 'OSHA 10 Certificate',
  'Banquet Captain': 'ServSafe Manager',
};
const ABOUT: Record<Role, string> = {
  Bartender: 'Fast, friendly behind the bar. Comfortable with high-volume weddings and corporate receptions.',
  Server: 'Plated and buffet service experience. Calm under pressure and always early.',
  'Line Cook': 'Hot line and prep. Can run a station solo and keeps a clean pass.',
  Dishwasher: 'Reliable on busy nights. Happy to jump onto prep when the sink is clear.',
  'Event Setup': 'Tables, linens, staging and teardown. Own transport and a good back.',
  'Banquet Captain': 'Leads a floor team of up to 12. Briefs staff and keeps timing tight with the kitchen.',
};
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WORKERS: Worker[] = FIRST.map((first, i) => {
  const primary = ROLES[i % 6];
  const second = ROLES[(i * 5 + 2) % 6];
  const skills = i % 3 !== 0 && second !== primary ? [primary, second] : [primary];
  return {
    id: `w${i + 1}`,
    name: `${first} ${LAST[i]}`,
    phone: `(503) 555-${String(100 + i).padStart(4, '0')}`,
    primary,
    skills,
    rating: Math.round((4 + ((i * 13) % 10) / 10) * 10) / 10,
    reliability: 78 + ((i * 7 + 3) % 22),
    distance: Math.round((0.8 + ((i * 7) % 23) / 2) * 10) / 10,
    jobs: 12 + ((i * 17) % 140),
    licence: LICENCE[primary],
    days: DAY_NAMES.filter((_, k) => (i + k * 3) % 4 !== 0),
    joinedDays: 20 + ((i * 23) % 400),
    unsubscribed: i === 16 || i === 32,
    about: ABOUT[primary],
  };
});

export const BUSINESSES: Business[] = [
  { id: 'b1', name: 'Cedar & Pine Events', type: 'Events and catering', address: '214 Alder Street, Portland', contact: 'Marcus Bell', email: 'marcus.bell@example.com', sinceDays: 214, status: 'Active' },
  { id: 'b2', name: 'Larkspur Kitchen', type: 'Restaurant', address: '88 Hawthorne Boulevard, Portland', contact: 'Elena Ruiz', email: 'elena.ruiz@example.com', sinceDays: 190, status: 'Active' },
  { id: 'b3', name: 'Northgate Banquet Hall', type: 'Venue', address: '1500 Northgate Way, Portland', contact: 'Peter Lund', email: 'peter.lund@example.com', sinceDays: 166, status: 'Active' },
  { id: 'b4', name: 'Tidewater Suites', type: 'Hotel', address: '40 Waterfront Drive, Portland', contact: 'Grace Okoye', email: 'grace.okoye@example.com', sinceDays: 143, status: 'Active' },
  { id: 'b5', name: 'Ember & Oak Grill', type: 'Restaurant', address: '732 Burnside Street, Portland', contact: 'Sam Whitaker', email: 'sam.whitaker@example.com', sinceDays: 98, status: 'Active' },
  { id: 'b6', name: 'Brightline Venues', type: 'Venue', address: '9 Foundry Row, Portland', contact: 'Nora Castellano', email: 'nora.castellano@example.com', sinceDays: 71, status: 'Active' },
  { id: 'b7', name: 'Maple Court Catering', type: 'Catering', address: '305 Maple Court, Beaverton', contact: 'Hiro Tanaka', email: 'hiro.tanaka@example.com', sinceDays: 44, status: 'Active' },
  { id: 'b8', name: 'Juniper Street Cafe', type: 'Cafe', address: '17 Juniper Street, Portland', contact: 'Abby Lindqvist', email: 'abby.lindqvist@example.com', sinceDays: 29, status: 'Payment failed' },
];

const BASE_RATE: Record<Role, number> = { Bartender: 24, Server: 19, 'Line Cook': 26, Dishwasher: 17, 'Event Setup': 18, 'Banquet Captain': 28 };
const STARTS = [17, 16, 11, 18, 9, 15];
const eligible = WORKERS.filter((w) => !w.unsubscribed);

export const PAST_SHIFTS: Shift[] = Array.from({ length: 25 }, (_, i) => {
  const role = ROLES[(i * 5 + 1) % 6];
  const bizIdx = i < 10 ? 0 : ((i - 10) % 7) + 1;
  const biz = BUSINESSES[bizIdx];
  const start = STARTS[i % 6];
  const unfilled = i % 6 === 4;
  const cancelled = i === 13;
  const status = cancelled ? 'Cancelled' : unfilled ? 'Unfilled' : 'Filled';
  return {
    id: `s${i + 1}`,
    businessId: biz.id,
    role,
    dayOffset: -(i * 2 + 1),
    start,
    end: start + 5 + (i % 4),
    rate: BASE_RATE[role] + (i % 3),
    location: biz.address,
    status,
    positions: i % 7 === 3 ? 2 : 1,
    filledBy: status === 'Filled' ? eligible[(i * 3 + 1) % eligible.length].id : undefined,
    filledByIds: status === 'Filled' ? (i % 7 === 3 ? [eligible[(i * 3 + 1) % eligible.length].id, eligible[(i * 3 + 7) % eligible.length].id] : [eligible[(i * 3 + 1) % eligible.length].id]) : undefined,
    sent: 10 + (i % 3),
    replies: unfilled ? 3 + (i % 3) : 4 + (i % 5),
    secsToFill: status === 'Filled' ? 40 + ((i * 53) % 400) : undefined,
  };
});

export const INVOICES = [
  { id: 'INV-2041', monthsAgo: 1, amount: PRICE },
  { id: 'INV-1987', monthsAgo: 2, amount: PRICE },
  { id: 'INV-1933', monthsAgo: 3, amount: PRICE },
  { id: 'INV-1880', monthsAgo: 4, amount: PRICE },
  { id: 'INV-1826', monthsAgo: 5, amount: PRICE },
];

export function workerById(id: string) {
  return WORKERS.find((w) => w.id === id);
}
export function businessById(id: string) {
  return BUSINESSES.find((b) => b.id === id);
}

export interface MatchOptions { favourites?: Record<string, boolean>; radius?: number; available?: boolean; count?: number }

/** Skilled workers inside the radius first, favourites and reliable workers ahead of the rest. Same result every time. */
export function matchWorkers(role: Role, optedOut: Record<string, boolean>, opts: MatchOptions = {}): string[] {
  const { favourites = {}, radius = 6, available = false, count = 12 } = opts;
  const live = WORKERS.filter((w) => !w.unsubscribed && !optedOut[w.id]);
  const tier = (w: Worker) => (w.skills.includes(role) ? 0 : 2) + (w.distance <= radius ? 0 : 1);
  const rank = (w: Worker) => (favourites[w.id] ? 100 : 0) + (available && w.id === ME_WORKER ? 60 : 0) + w.reliability * 0.5 - w.distance * 3;
  return [...live].sort((a, b) => tier(a) - tier(b) || rank(b) - rank(a)).slice(0, count).map((w) => w.id);
}

export const TEMPLATES: Template[] = [
  { id: 't1', name: 'Friday dinner bar', role: 'Bartender', start: 17, end: 23, rate: 24, location: '214 Alder Street, Portland', positions: 2 },
  { id: 't2', name: 'Banquet setup crew', role: 'Event Setup', start: 9, end: 14, rate: 18, location: '1500 Northgate Way, Portland', positions: 3 },
  { id: 't3', name: 'Weekend line cover', role: 'Line Cook', start: 16, end: 22, rate: 26, location: '214 Alder Street, Portland', positions: 1 },
];

/** Past shifts for the signed-in worker, with a pay figure per shift. */
export const WORKER_SHIFTS = [
  { id: 'e1', businessId: 'b2', role: 'Line Cook', dayOffset: -2, start: 16, end: 22, rate: 27 },
  { id: 'e2', businessId: 'b3', role: 'Line Cook', dayOffset: -5, start: 15, end: 21, rate: 26 },
  { id: 'e3', businessId: 'b5', role: 'Line Cook', dayOffset: -8, start: 17, end: 23, rate: 26 },
  { id: 'e4', businessId: 'b1', role: 'Bartender', dayOffset: -11, start: 18, end: 23, rate: 24 },
  { id: 'e5', businessId: 'b4', role: 'Line Cook', dayOffset: -14, start: 11, end: 17, rate: 26 },
  { id: 'e6', businessId: 'b2', role: 'Line Cook', dayOffset: -19, start: 16, end: 22, rate: 27 },
  { id: 'e7', businessId: 'b6', role: 'Line Cook', dayOffset: -23, start: 14, end: 21, rate: 25 },
  { id: 'e8', businessId: 'b3', role: 'Line Cook', dayOffset: -27, start: 15, end: 22, rate: 26 },
  { id: 'e9', businessId: 'b7', role: 'Line Cook', dayOffset: -38, start: 16, end: 22, rate: 25 },
];

function buildCompliance(): ComplianceRow[] {
  const rows: ComplianceRow[] = [];
  WORKERS.forEach((w, i) => {
    rows.push({ id: `c-in-${w.id}`, workerId: w.id, event: 'Opt-in consent', source: 'Worker sign-up, consent box ticked', minsAgo: w.joinedDays * 1440 + i * 17 });
    if (i % 5 === 2) rows.push({ id: `c-cf-${w.id}`, workerId: w.id, event: 'Consent confirmed', source: 'Quarterly re-confirmation text', minsAgo: 6 * 1440 + i * 211 });
  });
  rows.push({ id: 'c-stop-w17', workerId: 'w17', event: 'STOP received', source: 'Reply to shift text', minsAgo: 3 * 1440 + 140 });
  rows.push({ id: 'c-stop-w33', workerId: 'w33', event: 'STOP received', source: 'Reply to shift text', minsAgo: 9 * 1440 + 55 });
  rows.push({ id: 'c-stop-w9', workerId: 'w9', event: 'STOP received', source: 'Reply to shift text', minsAgo: 21 * 1440 + 380 });
  rows.push({ id: 'c-start-w9', workerId: 'w9', event: 'START received', source: 'Reply to reminder text', minsAgo: 15 * 1440 + 20 });
  return rows.sort((a, b) => a.minsAgo - b.minsAgo);
}
export const COMPLIANCE: ComplianceRow[] = buildCompliance();
