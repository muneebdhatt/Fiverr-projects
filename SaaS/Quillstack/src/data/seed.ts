import { DOCS as HAND_DOCS } from './docs';
import { docsFor, hash, usersFor, type OrgRow } from './generate';
import { initialsOf, toneOf } from '@/lib/time';
import type { AdminOrg, AuditRow, Doc, Org, PersonaInfo, Plan, PlanId, User } from './types';

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter', name: 'Starter', price: 29, seats: 8, credits: 300, tagline: 'For small teams getting started',
    features: ['8 seats', '300 AI credits a month', 'Summarise, rewrite and translate', 'Email support'],
  },
  team: {
    id: 'team', name: 'Team', price: 79, seats: 20, credits: 1500, tagline: 'For growing teams who write every day',
    features: ['20 seats', '1,500 AI credits a month', 'Shared workspace and roles', 'Full audit log', 'Priority support'],
  },
  business: {
    id: 'business', name: 'Business', price: 199, seats: 75, credits: 6000, tagline: 'For firms with compliance needs',
    features: ['75 seats', '6,000 AI credits a month', 'Extended audit retention', 'Dedicated success manager', 'Single sign-on ready'],
  },
};

export const CREDIT_COST = { summary: 12, actions: 8, rewrite: 15, translate: 10, formal: 10, friendly: 10, concise: 8, followup: 6 } as const;
export const AI_COST_PER_CREDIT = 0.018;

// ---------------- The 12 organisations ----------------
// Northwind Studio and Bluepeak Legal keep their hand-written people and documents.
// Every other organisation is generated deterministically from this table.
const ORG_TABLE: OrgRow[] = [
  { id: 'northwind', name: 'Northwind Studio', industry: 'Design studio', planId: 'team', aiCost: 16.416, suspended: false, ownerEmail: 'priya.raman@example.com', region: 'US East', team: 7, client1: '', client2: '', project: '' },
  { id: 'bluepeak', name: 'Bluepeak Legal', industry: 'Law firm', planId: 'starter', aiCost: 4.428, suspended: false, ownerEmail: 'priya.raman@example.com', region: 'US West', team: 6, client1: '', client2: '', project: '' },
  { id: 'cedarline', name: 'Cedarline Architects', industry: 'Architecture practice', planId: 'business', aiCost: 88.2, suspended: false, ownerEmail: 'lena.hoffman@example.com', region: 'EU Central', team: 8, client1: 'Riverside Library', client2: 'Maple Court Housing', project: 'Design review' },
  { id: 'fernhill', name: 'Fernhill Dental Group', industry: 'Dental group', planId: 'team', aiCost: 21.78, suspended: false, ownerEmail: 'omar.sayed@example.com', region: 'UK', team: 7, client1: 'Oakfield Primary', client2: 'Westgate Care Home', project: 'Clinic rollout' },
  { id: 'quarrylane', name: 'Quarry Lane Media', industry: 'Media agency', planId: 'starter', aiCost: 3.96, suspended: false, ownerEmail: 'kate.nolan@example.com', region: 'US East', team: 4, client1: 'Tidewater Brewing', client2: 'Foxglove Books', project: 'Content campaign' },
  { id: 'ostrander', name: 'Ostrander & Pike', industry: 'Law firm', planId: 'business', aiCost: 104.4, suspended: false, ownerEmail: 'victor.pike@example.com', region: 'US Central', team: 8, client1: 'Corvin Freight', client2: 'Hartley Estates', project: 'Contract review' },
  { id: 'brightwater', name: 'Brightwater Realty', industry: 'Real estate agency', planId: 'team', aiCost: 24.3, suspended: false, ownerEmail: 'tamsin.grey@example.com', region: 'US West', team: 7, client1: 'Linden Square', client2: 'Harbour View Apartments', project: 'Listing campaign' },
  { id: 'lumen', name: 'Lumen Logistics', industry: 'Logistics company', planId: 'team', aiCost: 19.2, suspended: true, ownerEmail: 'raj.malhotra@example.com', region: 'APAC', team: 6, client1: 'Northgate Retail', client2: 'Pioneer Foods', project: 'Delivery planning' },
  { id: 'harrow', name: 'Harrow & Finch Accounting', industry: 'Accounting firm', planId: 'starter', aiCost: 4.7, suspended: false, ownerEmail: 'ines.duarte@example.com', region: 'EU West', team: 5, client1: 'Bramble Bakery', client2: 'Kestrel Cycles', project: 'Year-end review' },
  { id: 'tallgrass', name: 'Tallgrass Consulting', industry: 'Consulting firm', planId: 'team', aiCost: 12.84, suspended: false, ownerEmail: 'ben.achterberg@example.com', region: 'US Central', team: 6, client1: 'Summit Health', client2: 'Granger Textiles', project: 'Operations review' },
  { id: 'meadowbank', name: 'Meadowbank Schools Trust', industry: 'Education trust', planId: 'business', aiCost: 61.5, suspended: false, ownerEmail: 'chloe.adeyemi@example.com', region: 'UK', team: 8, client1: 'Elmwood Academy', client2: 'Fairlawn Primary', project: 'Curriculum review' },
  { id: 'pinecrest', name: 'Pinecrest Studios', industry: 'Film studio', planId: 'starter', aiCost: 1.89, suspended: false, ownerEmail: 'felix.moreau@example.com', region: 'EU West', team: 4, client1: 'Ashby Outdoors', client2: 'Lantern Records', project: 'Brand film' },
];

export const ORGS: Org[] = ORG_TABLE.map((o) => ({
  id: o.id, name: o.name, initials: initialsOf(o.name.replace('&', '')).slice(0, 2),
  tone: toneOf(o.name), planId: o.planId, creditsUsed: Math.round(o.aiCost / AI_COST_PER_CREDIT), industry: o.industry,
}));
// Fixed brand colours for the first two so they match the original look.
ORGS[0].tone = '#4638dc';
ORGS[1].tone = '#0d9488';

export const DEFAULT_PLAN: Record<string, PlanId> = Object.fromEntries(ORG_TABLE.map((o) => [o.id, o.planId]));
/** Orgs a customer-side Owner or Member can switch between. Super-admin sees all of them. */
export const CUSTOMER_ORG_IDS = ['northwind', 'bluepeak'];

export const PERSONAS: PersonaInfo[] = [
  { id: 'owner', userId: 'u-priya', name: 'Priya Raman', email: 'priya.raman@example.com', title: 'Owner', password: 'Welcome2026!' },
  { id: 'member', userId: 'u-jonas', name: 'Jonas Weber', email: 'jonas.weber@example.com', title: 'Member', password: 'Welcome2026!' },
  { id: 'superadmin', userId: 'u-elena', name: 'Elena Costa', email: 'elena.costa@example.com', title: 'Super-admin', password: 'Welcome2026!' },
];

const HAND_USERS: Record<string, User[]> = {
  northwind: [
    { id: 'u-priya', name: 'Priya Raman', email: 'priya.raman@example.com', role: 'Owner', lastActiveMins: 12 },
    { id: 'u-tomas', name: 'Tomás Alvarez', email: 'tomas.alvarez@example.com', role: 'Admin', lastActiveMins: 48 },
    { id: 'u-hannah', name: 'Hannah Okafor', email: 'hannah.okafor@example.com', role: 'Member', lastActiveMins: 7 },
    { id: 'u-sofia', name: 'Sofia Marchetti', email: 'sofia.marchetti@example.com', role: 'Member', lastActiveMins: 190 },
    { id: 'u-liam', name: 'Liam Brennan', email: 'liam.brennan@example.com', role: 'Member', lastActiveMins: 1500 },
    { id: 'u-daniel', name: 'Daniel Cho', email: 'daniel.cho@example.com', role: 'Viewer', lastActiveMins: 4300 },
    { id: 'u-jonas', name: 'Jonas Weber', email: 'jonas.weber@example.com', role: 'Member', lastActiveMins: 25 },
  ],
  bluepeak: [
    { id: 'u-priya', name: 'Priya Raman', email: 'priya.raman@example.com', role: 'Owner', lastActiveMins: 12 },
    { id: 'u-marcus', name: 'Marcus Hale', email: 'marcus.hale@example.com', role: 'Admin', lastActiveMins: 20 },
    { id: 'u-aisha', name: 'Aisha Karim', email: 'aisha.karim@example.com', role: 'Member', lastActiveMins: 65 },
    { id: 'u-oliver', name: 'Oliver Lindqvist', email: 'oliver.lindqvist@example.com', role: 'Member', lastActiveMins: 320 },
    { id: 'u-grace', name: 'Grace Whitfield', email: 'grace.whitfield@example.com', role: 'Admin', lastActiveMins: 2900 },
    { id: 'u-jonas', name: 'Jonas Weber', email: 'jonas.weber@example.com', role: 'Member', lastActiveMins: 25 },
  ],
};

export const USERS: Record<string, User[]> = Object.fromEntries(
  ORG_TABLE.map((o) => [o.id, HAND_USERS[o.id] ?? usersFor(o)]),
);

export const DOCS: Doc[] = [
  ...HAND_DOCS,
  ...ORG_TABLE.filter((o) => !HAND_USERS[o.id]).flatMap((o) => docsFor(o, USERS[o.id])),
];

export const SUPERADMIN_USER: User = {
  id: 'u-elena', name: 'Elena Costa', email: 'elena.costa@example.com', role: 'Owner', lastActiveMins: 3,
};

// ---------------- Audit log: 30 rows per org, fully deterministic ----------------
const ACTIONS = [
  'Created document', 'Edited document', 'AI summarise', 'Edited document', 'AI rewrite', 'Exported document',
  'AI summarise', 'Invited teammate', 'Changed role', 'Viewed billing', 'AI translate', 'Created document',
];

function auditFor(orgId: string): AuditRow[] {
  const users = USERS[orgId];
  const docs = DOCS.filter((d) => d.orgId === orgId);
  const offset = HAND_USERS[orgId] ? 0 : hash(orgId) % 30;
  const rows: AuditRow[] = [];
  for (let i = 0; i < 30; i++) {
    const action = ACTIONS[(i * 5 + 2) % ACTIONS.length];
    let user = users[(i * 3 + 1) % users.length];
    // Billing and role changes are only done by owners and admins.
    if (action === 'Viewed billing' || action === 'Changed role' || action === 'Invited teammate') {
      const privileged = users.filter((u) => u.role === 'Owner' || u.role === 'Admin');
      user = privileged[i % privileged.length];
    }
    let target = docs[(i * 7 + 3) % docs.length].title;
    if (action === 'Invited teammate') target = ['ruben.diaz@example.com', 'mei.tanaka@example.com', 'noah.petrov@example.com'][i % 3];
    if (action === 'Changed role') target = `${users[(i + 2) % users.length].name} to ${(i % 2 ? 'Admin' : 'Member')}`;
    if (action === 'Viewed billing') target = 'Billing and plan';
    rows.push({
      id: `au-${orgId}-${i}`, orgId, userId: user.id, action, target,
      mins: Math.round(14 + i * 46 + i * i * 3.1) + offset,
    });
  }
  return rows;
}

export const AUDIT: AuditRow[] = ORG_TABLE.flatMap((o) => auditFor(o.id));

// ---------------- Super-admin list: derived from the same registry ----------------
export const ADMIN_ORGS: AdminOrg[] = ORG_TABLE.map((o) => ({
  id: o.id, name: o.name, planId: o.planId, seats: USERS[o.id].length, seatLimit: PLANS[o.planId].seats,
  aiCost: o.aiCost, suspended: o.suspended, owner: o.ownerEmail, region: o.region,
}));

export const ALL_ACTIONS = Array.from(new Set(ACTIONS));

// ---------------- Organisations created during a visit ----------------
export interface CustomOrg {
  id: string; name: string; industry: string; planId: PlanId; ownerName: string; ownerEmail: string; region: string;
}
export const orgFromCustom = (c: CustomOrg): Org => ({
  id: c.id, name: c.name, initials: initialsOf(c.name.replace('&', '')).slice(0, 2), tone: toneOf(c.name),
  planId: c.planId, creditsUsed: 0, industry: c.industry,
});
export const adminFromCustom = (c: CustomOrg): AdminOrg => ({
  id: c.id, name: c.name, planId: c.planId, seats: 1, seatLimit: PLANS[c.planId].seats, aiCost: 0, suspended: false, owner: c.ownerEmail, region: c.region,
});
/** Makes a created organisation's owner available to every page that looks people up by org id. */
export function registerOrg(c: CustomOrg) {
  USERS[c.id] = [{ id: `${c.id}-u0`, name: c.ownerName, email: c.ownerEmail, role: 'Owner', lastActiveMins: 0 }];
}
export const INDUSTRIES = ['Design studio', 'Law firm', 'Architecture practice', 'Accounting firm', 'Consulting firm', 'Media agency', 'Real estate agency', 'Education trust', 'Dental group', 'Logistics company'];
export const REGIONS = ['US East', 'US West', 'US Central', 'UK', 'EU West', 'EU Central', 'APAC'];
