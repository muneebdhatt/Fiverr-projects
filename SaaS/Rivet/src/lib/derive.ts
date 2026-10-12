import type { Entry, Invoice, ProjectId, Task } from '@/data/types';
import { BUDGET_HOURS } from '@/data/build';
import { dueDay, invoiceTotals, lineAmount, shownStatus } from '@/data/calc';
import { CLIENTS, PROJECTS, project } from '@/data/static';
import { r2 } from '@/lib/util';

export type E = Entry & { invoiced: boolean };

export function projectStats(pid: ProjectId, entries: E[], invoices: Invoice[], tasks: Task[]) {
  const p = project(pid);
  const mine = entries.filter((e) => e.projectId === pid);
  const logged = r2(mine.reduce((n, e) => n + e.hours, 0));
  const billableLogged = r2(mine.filter((e) => e.billable).reduce((n, e) => n + e.hours, 0));
  const used = r2(p.priorHours + billableLogged);
  const budget = BUDGET_HOURS[pid];
  const unbilled = r2(mine.filter((e) => e.billable && !e.invoiced).reduce((n, e) => n + e.hours, 0));
  const billed = r2(invoices.filter((i) => i.status !== 'draft').flatMap((i) => i.lines).filter((l) => l.projectId === pid).reduce((n, l) => n + lineAmount(l), 0));
  const t = tasks.filter((x) => x.projectId === pid);
  return {
    used,
    budget,
    pct: used / budget,
    budgetAmount: r2(budget * p.rate),
    usedAmount: r2(used * p.rate),
    logged,
    unbilled,
    unbilledAmount: r2(unbilled * p.rate),
    billed,
    tasksDone: t.filter((x) => x.status === 'done').length,
    tasksTotal: t.length,
    overdueTasks: t.filter((x) => x.status !== 'done' && x.due < 0).length,
    progress: t.length ? t.filter((x) => x.status === 'done').length / t.length : 0,
  };
}

export function clientStats(clientId: string, entries: E[], invoices: Invoice[]) {
  const projs = PROJECTS.filter((p) => p.clientId === clientId).map((p) => p.id);
  const inv = invoices.filter((i) => i.clientId === clientId);
  const sum = (arr: Invoice[]) => r2(arr.reduce((n, i) => n + invoiceTotals(i).total, 0));
  const unbilledAmount = r2(entries.filter((e) => projs.includes(e.projectId) && e.billable && !e.invoiced).reduce((n, e) => n + e.hours * project(e.projectId).rate, 0));
  const unbilledHours = r2(entries.filter((e) => projs.includes(e.projectId) && e.billable && !e.invoiced).reduce((n, e) => n + e.hours, 0));
  const open = inv.filter((i) => i.status === 'sent');
  return {
    invoiced: sum(inv.filter((i) => i.status !== 'draft')),
    paid: sum(inv.filter((i) => i.status === 'paid')),
    outstanding: sum(open),
    overdue: sum(open.filter((i) => shownStatus(i) === 'overdue')),
    unbilledAmount,
    unbilledHours,
    projects: projs.length,
  };
}

export function totalsAll(entries: E[], invoices: Invoice[]) {
  const sum = (arr: Invoice[]) => r2(arr.reduce((n, i) => n + invoiceTotals(i).total, 0));
  const open = invoices.filter((i) => i.status === 'sent');
  const unbilledAmount = r2(entries.filter((e) => e.billable && !e.invoiced).reduce((n, e) => n + e.hours * project(e.projectId).rate, 0));
  return {
    outstanding: sum(open),
    overdue: sum(open.filter((i) => shownStatus(i) === 'overdue')),
    overdueCount: open.filter((i) => shownStatus(i) === 'overdue').length,
    paid30: sum(invoices.filter((i) => i.status === 'paid' && (i.paidDay ?? -999) >= -30)),
    drafts: sum(invoices.filter((i) => i.status === 'draft')),
    unbilledAmount,
  };
}

export const invoiceDueIn = (i: Invoice) => dueDay(i);
export const clientOf = (id: string) => CLIENTS.find((c) => c.id === id)!;
