import type { ClientId, Entry, Invoice, InvoiceStatus, Line, PersonId, ProjectId } from './types';
import { PROJECTS, client, project, projectsOf } from './static';
import { TASKS } from './tasks';
import { isWeekend, monthDay, r2 } from '@/lib/util';

/* Everything below is deterministic: a seeded generator, no Math.random, so every load is identical. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const WINDOW_START = -41;
const MIX: Record<PersonId, [ProjectId, number][]> = {
  priya: [['p1', 3], ['p2', 3], ['p3', 1], ['p4', 2], ['p6', 2], ['p8', 1.5], ['p9', 1]],
  daniel: [['p1', 3], ['p3', 3], ['p5', 3], ['p7', 1.5], ['p9', 3]],
  lena: [['p3', 2], ['p5', 3], ['p7', 3], ['p9', 2], ['p10', 3]],
  tom: [['p1', 2], ['p2', 1], ['p3', 1], ['p5', 1.5], ['p7', 1.5], ['p9', 1.5], ['p10', 1.5]],
  sam: [['p1', 1.5], ['p2', 2], ['p4', 2], ['p6', 2], ['p8', 2], ['p10', 3]],
  maya: [['p2', 1], ['p6', 1], ['p9', 1]],
};
const GENERIC = ['Client call', 'Project check-in', 'Review and feedback', 'Planning and scoping', 'Handover notes', 'Status update to the client'];
const NONBILL = ['Internal review', 'Rework from our own QA', 'Team sync', 'Proposal for a possible phase 2'];
const PROJECT_START: Partial<Record<ProjectId, number>> = { p8: -30 };

function pickWeighted<T>(r: () => number, items: [T, number][]) {
  const total = items.reduce((n, [, w]) => n + w, 0);
  let x = r() * total;
  for (const [v, w] of items) { x -= w; if (x <= 0) return v; }
  return items[items.length - 1][0];
}

function genEntries(): Entry[] {
  const r = rng(20261009);
  const out: Entry[] = [];
  const days: number[] = [];
  for (let d = WINDOW_START; d <= 0; d++) if (!isWeekend(d)) days.push(d);
  const people: PersonId[] = ['tom', 'priya', 'daniel', 'lena', 'sam', 'maya'];
  for (const d of days) {
    for (const u of people) {
      if (u === 'maya' && r() > 0.38) continue;
      let target = u === 'maya' ? 1.5 + Math.floor(r() * 6) * 0.5 : u === 'sam' ? 4 + Math.floor(r() * 5) * 0.5 : 5.5 + Math.floor(r() * 8) * 0.25;
      target = Math.round(target * 4) / 4;
      if (d === 0) target = Math.min(target, 3.5);
      const parts = u === 'tom' ? 3 : u === 'maya' ? 1 : r() < 0.4 ? 2 : 1;
      let left = target;
      for (let k = 0; k < parts; k++) {
        let h = k === parts - 1 ? left : Math.max(0.5, Math.round(((left / (parts - k)) * (0.6 + r() * 0.8)) * 4) / 4);
        h = Math.min(h, left);
        if (h <= 0) break;
        left = Math.round((left - h) * 4) / 4;
        const projectId = pickWeighted(r, MIX[u].filter(([p]) => (PROJECT_START[p] ?? WINDOW_START - 1) <= d));
        const mine = TASKS.filter((t) => t.projectId === projectId && t.assignee === u && t.status !== 'backlog' && (t.status !== 'done' || (t.doneDay ?? -99) >= d - 3));
        let taskId: string | undefined;
        let note: string;
        let billable = true;
        if (mine.length && r() < 0.78) {
          const t = mine[Math.floor(r() * mine.length)];
          taskId = t.id;
          note = t.title;
          billable = r() < 0.95;
        } else if (r() < 0.88) {
          note = GENERIC[Math.floor(r() * GENERIC.length)];
        } else {
          note = NONBILL[Math.floor(r() * NONBILL.length)];
          billable = false;
        }
        out.push({ id: '', user: u, projectId, taskId, day: d, hours: h, note, billable });
      }
    }
  }
  // land on exactly 200 entries: merge the smallest same-day neighbours, or split the largest
  while (out.length > 200) {
    let best = -1;
    let bestH = 99;
    for (let i = 0; i < out.length; i++) {
      const e = out[i];
      if (e.hours < bestH && e.day !== 0 && out.some((o, j) => j !== i && o.user === e.user && o.day === e.day)) { best = i; bestH = e.hours; }
    }
    if (best < 0) { out.splice(out.length - 1, 1); continue; }
    const e = out[best];
    const mate = out.findIndex((o, j) => j !== best && o.user === e.user && o.day === e.day);
    out[mate] = { ...out[mate], hours: out[mate].hours + e.hours };
    out.splice(best, 1);
  }
  while (out.length < 200) {
    let best = 0;
    for (let i = 1; i < out.length; i++) if (out[i].hours > out[best].hours) best = i;
    const e = out[best];
    const half = Math.round((e.hours / 2) * 4) / 4;
    out[best] = { ...e, hours: e.hours - half };
    out.push({ ...e, hours: half, note: e.taskId ? e.note : GENERIC[0], billable: e.billable });
  }
  out.sort((a, b) => a.day - b.day || a.user.localeCompare(b.user));
  return out.map((e, i) => ({ ...e, id: `e${i + 1}` }));
}
export const ENTRIES: Entry[] = genEntries();

/* Invoices: eight earlier ones (hours from before the 200 entries), five that pull billable hours from
   the entries up to the cut-off, and one draft. */
export const BILLED_THROUGH = -15;
export const ISSUE_DAY = -14;

type Hist = [ClientId, number, InvoiceStatus, number | undefined, [ProjectId, number][]];
const HIST: Hist[] = [
  ['tess', -78, 'paid', -66, [['p1', 62.5], ['p2', 24]]],
  ['alder', -72, 'paid', -61, [['p9', 71]]],
  ['junip', -60, 'paid', -54, [['p3', 44], ['p4', 16]]],
  ['tess', -50, 'paid', -33, [['p1', 48], ['p2', 17.5]]],
  ['lumen', -48, 'paid', -41, [['p10', 38.5]]],
  ['cad', -45, 'sent', undefined, [['p5', 52], ['p6', 21]]],
  ['alder', -44, 'paid', -35, [['p9', 66.25]]],
  ['north', -40, 'sent', undefined, [['p7', 58.5]]],
];
const WINDOW: [ClientId, InvoiceStatus, number | undefined][] = [
  ['tess', 'sent', undefined],
  ['junip', 'paid', -6],
  ['cad', 'sent', undefined],
  ['north', 'sent', undefined],
  ['alder', 'paid', -3],
  ['lumen', 'draft', undefined],
];
const METHOD = ['Card', 'Bank transfer', 'Card', 'Bank transfer', 'Card', 'Card', 'Bank transfer'];

function histLines(issued: number, rows: [ProjectId, number][]): Line[] {
  return rows.map(([pid, h], i) => ({
    id: `l${i}`,
    projectId: pid,
    description: `${project(pid).name}: ${monthDay(issued - 30)} to ${monthDay(issued - 1)}`,
    hours: h,
    rate: project(pid).rate,
  }));
}

export function linesFromEntries(entries: Entry[]): Line[] {
  const byProject = new Map<ProjectId, number>();
  for (const e of entries) byProject.set(e.projectId, r2((byProject.get(e.projectId) ?? 0) + e.hours));
  const order = PROJECTS.map((p) => p.id).filter((id) => byProject.has(id));
  return order.map((pid, i) => {
    const days = entries.filter((e) => e.projectId === pid).map((e) => e.day);
    return {
      id: `l${i}`,
      projectId: pid,
      description: `${project(pid).name}: ${monthDay(Math.min(...days))} to ${monthDay(Math.max(...days))}`,
      hours: byProject.get(pid)!,
      rate: project(pid).rate,
    };
  });
}

function buildInvoices(): Invoice[] {
  const raw: Omit<Invoice, 'number' | 'id'>[] = [];
  HIST.forEach(([clientId, issued, status, paidDay, rows], i) => {
    const c = client(clientId);
    raw.push({ clientId, issued, terms: c.terms, status, paidDay, paidMethod: paidDay === undefined ? undefined : METHOD[i % METHOD.length], lines: histLines(issued, rows), entryIds: [], taxRate: c.taxRate });
  });
  WINDOW.forEach(([clientId, status, paidDay], i) => {
    const c = client(clientId);
    const pids = new Set(projectsOf(clientId).map((p) => p.id));
    const mine = ENTRIES.filter((e) => pids.has(e.projectId) && e.billable && e.day <= BILLED_THROUGH);
    raw.push({
      clientId, issued: status === 'draft' ? 0 : ISSUE_DAY, terms: c.terms, status, paidDay, paidMethod: paidDay === undefined ? undefined : METHOD[(i + 2) % METHOD.length],
      lines: linesFromEntries(mine), entryIds: mine.map((e) => e.id), taxRate: c.taxRate,
      note: status === 'draft' ? 'Thank you for your patience while we set up the five practice pages.' : undefined,
      periodFrom: WINDOW_START, periodTo: BILLED_THROUGH,
    });
  });
  return raw.map((x, i) => ({ ...x, id: `inv${i + 1}`, number: `INV-${2051 + i}` }));
}
export const INVOICES: Invoice[] = buildInvoices();
export const NEXT_NUMBER = 2051 + INVOICES.length;

/** Entries are locked once an invoice includes them. */
export const INVOICED_IDS = new Set(INVOICES.flatMap((i) => i.entryIds));

/** Project budget: sized so each project sits at its target burn of the hours used so far. */
export function hoursUsedBase(pid: ProjectId) {
  const p = project(pid);
  return p.priorHours + ENTRIES.filter((e) => e.projectId === pid && e.billable).reduce((n, e) => n + e.hours, 0);
}
export const BUDGET_HOURS: Record<string, number> = Object.fromEntries(PROJECTS.map((p) => [p.id, Math.max(20, Math.round(hoursUsedBase(p.id) / p.burn / 10) * 10)]));
