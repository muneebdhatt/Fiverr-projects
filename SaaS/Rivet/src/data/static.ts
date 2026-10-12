import type { Client, ClientId, Person, PersonId, Project, ProjectId } from './types';

export const PEOPLE: Person[] = [
  { id: 'maya', name: 'Maya Okafor', email: 'maya.okafor@example.com', title: 'Founder and creative director', capacity: 24 },
  { id: 'tom', name: 'Tom Becker', email: 'tom.becker@example.com', title: 'Project manager', capacity: 40 },
  { id: 'priya', name: 'Priya Nair', email: 'priya.nair@example.com', title: 'Senior designer', capacity: 40 },
  { id: 'daniel', name: 'Daniel Reyes', email: 'daniel.reyes@example.com', title: 'Lead developer', capacity: 40 },
  { id: 'lena', name: 'Lena Vogel', email: 'lena.vogel@example.com', title: 'Developer', capacity: 40 },
  { id: 'sam', name: 'Sam Ito', email: 'sam.ito@example.com', title: 'Copywriter', capacity: 32 },
];
export const person = (id: PersonId) => PEOPLE.find((p) => p.id === id)!;

export const CLIENTS: Client[] = [
  { id: 'tess', name: 'Tessellate Architects', contact: 'Isabel Moreau', contactEmail: 'isabel.moreau@example.com', contactTitle: 'Practice manager', phone: '(555) 014-2290', city: 'Portland', taxRate: 0.0825, terms: 30, since: -230, internalNote: 'Isabel decides fast but wants everything in writing. Partners (Rowan, Aiko) sign off on visuals, so send previews a day early.' },
  { id: 'junip', name: 'Juniper Row Bakery', contact: 'Hannah Whitlock', contactEmail: 'hannah.whitlock@example.com', contactTitle: 'Owner', phone: '(555) 014-7731', city: 'Austin', taxRate: 0.07, terms: 15, since: -160, internalNote: 'Pays within a week, always. Loves a quick Loom. Do not discuss wholesale pricing in the portal.' },
  { id: 'cad', name: 'Cadence Physio', contact: 'Omar Haddad', contactEmail: 'omar.haddad@example.com', contactTitle: 'Clinical director', phone: '(555) 014-3358', city: 'Denver', taxRate: 0.05, terms: 30, since: -120, internalNote: 'Invoices run late (AP only processes on the 15th). Scope creep risk on the booking portal, hold the line on phase 2.' },
  { id: 'north', name: 'Northgate Cycles', contact: 'Callum Reid', contactEmail: 'callum.reid@example.com', contactTitle: 'Head of e-commerce', phone: '(555) 014-9016', city: 'Seattle', taxRate: 0.08, terms: 15, since: -140, internalNote: 'Callum is happy, but their finance team is slow. Escalate to Meera in accounts if the Sept invoice is not paid by month end.' },
  { id: 'alder', name: 'Alder & Vine Wines', contact: 'Nora Lindqvist', contactEmail: 'nora.lindqvist@example.com', contactTitle: 'Founder', phone: '(555) 014-5502', city: 'Napa', taxRate: 0.1, terms: 15, since: -200, internalNote: 'Our biggest retainer. Nora messages late at night, reply by 9am. Open to a phase 2 app budget in Q1.' },
  { id: 'lumen', name: 'Lumen Dental Group', contact: 'Victor Adeyemi', contactEmail: 'victor.adeyemi@example.com', contactTitle: 'Marketing lead', phone: '(555) 014-6684', city: 'Chicago', taxRate: 0.065, terms: 15, since: -75, internalNote: 'New client, still learning how they like to review. Invoice is drafted, waiting on Maya to confirm the discount note.' },
];
export const client = (id: ClientId) => CLIENTS.find((c) => c.id === id)!;

export const PROJECTS: Project[] = [
  { id: 'p1', clientId: 'tess', name: 'Website redesign', blurb: 'A new portfolio site with project case studies, a team page and an enquiry form.', rate: 150, start: -80, due: 24, team: ['priya', 'daniel', 'tom', 'sam'], lead: 'tom', priorHours: 110.5, burn: 0.68, internalNote: 'Case-study template is the big unknown. Daniel to confirm CMS choice before we quote the extra pages.' },
  { id: 'p2', clientId: 'tess', name: 'Brand guidelines', blurb: 'A concise brand book: logo usage, colour, type and photography direction.', rate: 140, start: -60, due: 6, team: ['priya', 'sam', 'tom', 'maya'], lead: 'priya', priorHours: 41.5, burn: 0.97, internalNote: 'Close to budget. Anything beyond the photography section is change-order territory.' },
  { id: 'p3', clientId: 'junip', name: 'Online ordering site', blurb: 'Order-ahead for the bakery counter with pickup slots and a daily specials page.', rate: 145, start: -66, due: 31, team: ['daniel', 'lena', 'priya', 'tom'], lead: 'daniel', priorHours: 44, burn: 0.55, internalNote: 'Payment provider approval takes about a week. Start the paperwork early.' },
  { id: 'p4', clientId: 'junip', name: 'Seasonal campaign', blurb: 'Autumn menu launch: posters, window decals, email and social set.', rate: 130, start: -64, due: 17, team: ['priya', 'sam'], lead: 'priya', priorHours: 16, burn: 0.78, internalNote: 'Print deadline is fixed. The decal vendor needs artwork 5 working days ahead.' },
  { id: 'p5', clientId: 'cad', name: 'Booking portal', blurb: 'Online booking, reminders and a patient dashboard for a three-site physio practice.', rate: 160, start: -90, due: 20, team: ['daniel', 'lena', 'tom'], lead: 'daniel', priorHours: 52, burn: 0.94, internalNote: 'Running hot. Reminders (SMS) were added mid-project, raise a change order with Omar next week.' },
  { id: 'p6', clientId: 'cad', name: 'Clinic brand refresh', blurb: 'Updated identity, signage artwork and a patient handbook.', rate: 140, start: -78, due: 38, team: ['priya', 'sam', 'maya'], lead: 'maya', priorHours: 21, burn: 0.6, internalNote: 'Handbook copy waits on clinical review from Omar. Do not start layout until copy is locked.' },
  { id: 'p7', clientId: 'north', name: 'Shop migration', blurb: 'Move the catalogue, customers and orders to a new storefront with no downtime.', rate: 155, start: -85, due: 12, team: ['lena', 'daniel', 'tom'], lead: 'tom', priorHours: 58.5, burn: 0.85, internalNote: 'Cutover weekend is booked. Redirect map is the riskiest piece, double-check with Callum.' },
  { id: 'p8', clientId: 'north', name: 'Spring catalogue', blurb: 'The spring range as a printed and online catalogue.', rate: 125, start: -30, due: 52, team: ['priya', 'sam'], lead: 'priya', priorHours: 0, burn: 0.35, internalNote: 'Photography is still with the client. Layout is blocked until we get the final product shots.' },
  { id: 'p9', clientId: 'alder', name: 'Wine club app', blurb: 'Members app: monthly selections, tasting notes, pausing and a loyalty tier.', rate: 165, start: -95, due: 45, team: ['daniel', 'lena', 'priya', 'tom', 'maya'], lead: 'tom', priorHours: 137.25, burn: 0.72, internalNote: 'Nora wants a loyalty tier added. Quote it separately, do not absorb it.' },
  { id: 'p10', clientId: 'lumen', name: 'Website and local SEO', blurb: 'A faster, clearer website for five dental practices with local search set up properly.', rate: 150, start: -70, due: 33, team: ['lena', 'sam', 'tom'], lead: 'tom', priorHours: 38.5, burn: 0.5, internalNote: 'Per-practice pages are the bulk of the work. Content from the practices arrives late every time.' },
];
export const project = (id: ProjectId) => PROJECTS.find((p) => p.id === id)!;
export const projectsOf = (clientId: ClientId) => PROJECTS.filter((p) => p.clientId === clientId);

export const ACCOUNTS = {
  owner: { id: 'maya' as PersonId, label: 'Agency owner', email: 'maya.okafor@example.com' },
  member: { id: 'priya' as PersonId, label: 'Team member', email: 'priya.nair@example.com' },
  client: { id: 'isabel', label: 'Client', email: 'isabel.moreau@example.com', clientId: 'tess' as ClientId, name: 'Isabel Moreau' },
} as const;
export type Role = keyof typeof ACCOUNTS;
export const AGENCY = 'Foxglove Studio';
