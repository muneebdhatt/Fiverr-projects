import type { Invoice, Line } from './types';
import { r2 } from '@/lib/util';

/** Amount of one line: hours times rate. */
export const lineAmount = (l: Pick<Line, 'hours' | 'rate'>) => r2(l.hours * l.rate);

/** Invoice maths used everywhere: subtotal = sum of lines, tax = subtotal times rate, total = subtotal plus tax. */
export function totalsOf(lines: Pick<Line, 'hours' | 'rate'>[], taxRate: number) {
  const subtotal = r2(lines.reduce((n, l) => n + lineAmount(l), 0));
  const tax = r2(subtotal * taxRate);
  return { subtotal, tax, total: r2(subtotal + tax), hours: r2(lines.reduce((n, l) => n + l.hours, 0)) };
}
export const invoiceTotals = (inv: Pick<Invoice, 'lines' | 'taxRate'>) => totalsOf(inv.lines, inv.taxRate);
export const dueDay = (inv: Pick<Invoice, 'issued' | 'terms'>) => inv.issued + inv.terms;
export const taxLabel = (rate: number) => `Sales tax (${(Math.round(rate * 10000) / 100).toString()}%)`;

export type ShownStatus = 'draft' | 'sent' | 'overdue' | 'paid';
export function shownStatus(inv: Pick<Invoice, 'status' | 'issued' | 'terms'>): ShownStatus {
  if (inv.status === 'sent' && dueDay(inv) < 0) return 'overdue';
  return inv.status;
}
