'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useMemo, useState } from 'react';
import type { Activity, Approval, ApprovalStatus, Entry, Invoice, InvoiceStatus, Line, Milestone, MilestoneStatus, PersonId, ProjectFile, ProjectId, Task, TaskStatus, Update, ClientId } from '@/data/types';
import { ACCOUNTS, type Role, PROJECTS, CLIENTS } from '@/data/static';
import { TASKS } from '@/data/tasks';
import { ACTIVITY, APPROVALS, FILES, MILESTONES, UPDATES } from '@/data/content';
import { ENTRIES, INVOICES, NEXT_NUMBER, INVOICED_IDS } from '@/data/build';
import { dueDay, invoiceTotals } from '@/data/calc';
import { money } from '@/lib/util';

export type { Role };
export type Toast = { id: number; message: string; tone: 'info' | 'success' | 'warn' };
export type Timer = { running: boolean; startedAt: number; projectId: ProjectId | ''; taskId: string; note: string; billable: boolean };
export type InvoicePatch = { status?: InvoiceStatus; issued?: number; paidDay?: number; paidMethod?: string; remindedDay?: number; sentDay?: number; note?: string };
export type ApprovalPatch = { status: ApprovalStatus; response?: string; respondedDay: number; respondedBy: string };

const NAMES: Record<Role, string> = { owner: 'Maya Okafor', member: 'Priya Nair', client: 'Isabel Moreau' };
export const nameOf = (role: Role) => NAMES[role];

type State = {
  role: Role | null;
  timer: Timer;
  addedEntries: Entry[];
  entryPatch: Record<string, Partial<Entry>>;
  removedEntries: string[];
  taskPatch: Record<string, Partial<Task>>;
  addedTasks: Task[];
  removedTasks: string[];
  approvalPatch: Record<string, ApprovalPatch>;
  nudged: Record<string, number>;
  addedInvoices: Invoice[];
  invoicePatch: Record<string, InvoicePatch>;
  addedFiles: ProjectFile[];
  addedUpdates: Update[];
  addedActivity: Activity[];
  milestonePatch: Record<string, { status: MilestoneStatus; doneDay?: number }>;
  submittedWeeks: Record<string, boolean>;
  toasts: Toast[];
  signIn: (role: Role) => void;
  switchTo: (role: Role) => void;
  signOut: () => void;
  startTimer: (t: Pick<Timer, 'projectId' | 'taskId' | 'note' | 'billable'>) => void;
  setTimerField: (p: Partial<Pick<Timer, 'projectId' | 'taskId' | 'note' | 'billable'>>) => void;
  stopTimer: (user: PersonId) => number;
  discardTimer: () => void;
  addEntry: (e: Omit<Entry, 'id'>) => void;
  patchEntry: (id: string, p: Partial<Entry>) => void;
  removeEntry: (id: string) => void;
  patchTask: (id: string, p: Partial<Task>) => void;
  addTask: (t: Omit<Task, 'id'>) => void;
  removeTask: (id: string) => void;
  respondApproval: (id: string, status: Exclude<ApprovalStatus, 'pending'>, response: string, by: string) => void;
  nudge: (id: string) => void;
  createInvoice: (i: { clientId: ClientId; lines: Line[]; entryIds: string[]; terms: number; taxRate: number; note?: string; send: boolean; periodFrom?: number; periodTo?: number }) => string;
  patchInvoice: (id: string, p: InvoicePatch) => void;
  payInvoice: (id: string, method: string, by: string) => void;
  addFile: (f: Omit<ProjectFile, 'id'>) => void;
  addUpdate: (u: Omit<Update, 'id'>) => void;
  log: (a: Omit<Activity, 'id' | 'day' | 'minutes'>) => void;
  setMilestone: (id: string, status: MilestoneStatus) => void;
  submitWeek: (key: string) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
};

const idleTimer: Timer = { running: false, startedAt: 0, projectId: '', taskId: '', note: '', billable: true };
const fresh = () => ({
  timer: idleTimer,
  addedEntries: [] as Entry[],
  entryPatch: {} as State['entryPatch'],
  removedEntries: [] as string[],
  taskPatch: {} as State['taskPatch'],
  addedTasks: [] as Task[],
  removedTasks: [] as string[],
  approvalPatch: {} as State['approvalPatch'],
  nudged: {} as State['nudged'],
  addedInvoices: [] as Invoice[],
  invoicePatch: {} as State['invoicePatch'],
  addedFiles: [] as ProjectFile[],
  addedUpdates: [] as Update[],
  addedActivity: [] as Activity[],
  milestonePatch: {} as State['milestonePatch'],
  submittedWeeks: {} as State['submittedWeeks'],
});

let toastId = 1;
let seq = 1;
export const useApp = create<State>()(
  persist(
    (set, get) => ({
      role: null,
      ...fresh(),
      toasts: [],
      // Every sign-in starts from the same agency, so each walkthrough matches the last.
      signIn: (role) => set({ ...fresh(), role, toasts: [] }),
      switchTo: (role) => set({ role, toasts: [] }),
      signOut: () => set({ role: null, toasts: [] }),
      startTimer: (t) => set({ timer: { running: true, startedAt: Date.now(), ...t } }),
      setTimerField: (p) => set((s) => ({ timer: { ...s.timer, ...p } })),
      stopTimer: (user) => {
        const t = get().timer;
        if (!t.running || !t.projectId) { set({ timer: idleTimer }); return 0; }
        const hours = Math.max(0.25, Math.round(((Date.now() - t.startedAt) / 3600000) * 4) / 4);
        get().addEntry({ user, projectId: t.projectId, taskId: t.taskId || undefined, day: 0, hours, note: t.note || 'Time tracked', billable: t.billable });
        set({ timer: idleTimer });
        return hours;
      },
      discardTimer: () => set({ timer: idleTimer }),
      addEntry: (e) => set((s) => ({ addedEntries: [...s.addedEntries, { ...e, id: `n${seq++}` }] })),
      patchEntry: (id, p) => set((s) => (s.addedEntries.some((e) => e.id === id) ? { addedEntries: s.addedEntries.map((e) => (e.id === id ? { ...e, ...p } : e)) } : { entryPatch: { ...s.entryPatch, [id]: { ...s.entryPatch[id], ...p } } })),
      removeEntry: (id) => set((s) => (s.addedEntries.some((e) => e.id === id) ? { addedEntries: s.addedEntries.filter((e) => e.id !== id) } : { removedEntries: [...s.removedEntries, id] })),
      patchTask: (id, p) => set((s) => (s.addedTasks.some((t) => t.id === id) ? { addedTasks: s.addedTasks.map((t) => (t.id === id ? { ...t, ...p } : t)) } : { taskPatch: { ...s.taskPatch, [id]: { ...s.taskPatch[id], ...p } } })),
      addTask: (t) => set((s) => ({ addedTasks: [...s.addedTasks, { ...t, id: `nt${seq++}` }] })),
      removeTask: (id) => set((s) => (s.addedTasks.some((t) => t.id === id) ? { addedTasks: s.addedTasks.filter((t) => t.id !== id) } : { removedTasks: [...s.removedTasks, id] })),
      respondApproval: (id, status, response, by) => {
        set((s) => ({ approvalPatch: { ...s.approvalPatch, [id]: { status, response, respondedDay: 0, respondedBy: by } } }));
        const a = APPROVALS.find((x) => x.id === id);
        if (a) get().log({ kind: 'approval', text: `${by} ${status === 'approved' ? 'approved' : 'requested changes on'} ${a.title}`, projectId: a.projectId });
      },
      nudge: (id) => set((s) => ({ nudged: { ...s.nudged, [id]: 0 } })),
      createInvoice: ({ clientId, lines, entryIds, terms, taxRate, note, send, periodFrom, periodTo }) => {
        const n = NEXT_NUMBER + get().addedInvoices.length;
        const inv: Invoice = { id: `invn${n}`, number: `INV-${n}`, clientId, issued: 0, terms, status: send ? 'sent' : 'draft', lines, entryIds, taxRate, note, periodFrom, periodTo };
        set((s) => ({ addedInvoices: [...s.addedInvoices, inv] }));
        const total = invoiceTotals(inv).total;
        const cname = CLIENTS.find((c) => c.id === clientId)!.name;
        get().log({ kind: 'invoice', text: send ? `${inv.number} (${money(total)}) sent to ${cname}` : `${inv.number} drafted for ${cname}`, clientId, internal: true, money: true });
        return inv.id;
      },
      patchInvoice: (id, p) => set((s) => (s.addedInvoices.some((i) => i.id === id) ? { addedInvoices: s.addedInvoices.map((i) => (i.id === id ? { ...i, ...p } : i)) } : { invoicePatch: { ...s.invoicePatch, [id]: { ...s.invoicePatch[id], ...p } } })),
      payInvoice: (id, method, by) => {
        get().patchInvoice(id, { status: 'paid', paidDay: 0, paidMethod: method });
        const inv = [...INVOICES, ...get().addedInvoices].find((i) => i.id === id);
        if (inv) get().log({ kind: 'payment', text: `${CLIENTS.find((c) => c.id === inv.clientId)!.name} paid ${inv.number} (${money(invoiceTotals(inv).total)}) by ${method.toLowerCase()}${by ? '' : ''}`, clientId: inv.clientId, internal: true, money: true });
      },
      addFile: (f) => set((s) => ({ addedFiles: [...s.addedFiles, { ...f, id: `nf${seq++}` }] })),
      addUpdate: (u) => set((s) => ({ addedUpdates: [...s.addedUpdates, { ...u, id: `nu${seq++}` }] })),
      log: (a) => set((s) => ({ addedActivity: [...s.addedActivity, { ...a, id: `na${seq++}`, day: 0, minutes: 0 }] })),
      setMilestone: (id, status) => set((s) => ({ milestonePatch: { ...s.milestonePatch, [id]: { status, doneDay: status === 'done' ? 0 : undefined } } })),
      submitWeek: (key) => set((s) => ({ submittedWeeks: { ...s.submittedWeeks, [key]: true } })),
      toast: (message, tone = 'info') => {
        const id = toastId++;
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
        setTimeout(() => get().dismissToast(id), 3800);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'rivet-session',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ toasts: _t, ...rest }) => rest as unknown as State,
    },
  ),
);

/** True once the persisted state has been read on the client (avoids hydration mismatches). */
export function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const done = () => setReady(true);
    if (useApp.persist.hasHydrated()) done();
    return useApp.persist.onFinishHydration(done);
  }, []);
  return ready;
}

/* ---- Merged views of the data: seed data plus everything done during this visit ---- */
export function useEntries(): (Entry & { invoiced: boolean })[] {
  const added = useApp((s) => s.addedEntries);
  const patch = useApp((s) => s.entryPatch);
  const removed = useApp((s) => s.removedEntries);
  const invs = useInvoices();
  return useMemo(() => {
    const locked = new Set<string>(INVOICED_IDS);
    for (const i of invs) for (const id of i.entryIds) locked.add(id);
    return [...ENTRIES, ...added].filter((e) => !removed.includes(e.id)).map((e) => ({ ...e, ...patch[e.id], invoiced: locked.has(e.id) }));
  }, [added, patch, removed, invs]);
}

export function useTasks(): Task[] {
  const added = useApp((s) => s.addedTasks);
  const patch = useApp((s) => s.taskPatch);
  const removed = useApp((s) => s.removedTasks);
  return useMemo(() => [...TASKS, ...added].filter((t) => !removed.includes(t.id)).map((t) => ({ ...t, ...patch[t.id] })), [added, patch, removed]);
}

export function useInvoices(): Invoice[] {
  const added = useApp((s) => s.addedInvoices);
  const patch = useApp((s) => s.invoicePatch);
  return useMemo(() => [...INVOICES, ...added].map((i) => ({ ...i, ...patch[i.id] })), [added, patch]);
}
export const useInvoice = (id: string) => useInvoices().find((i) => i.id === id);

export function useApprovals(): Approval[] {
  const patch = useApp((s) => s.approvalPatch);
  return useMemo(() => APPROVALS.map((a) => ({ ...a, ...patch[a.id] })), [patch]);
}
export function useMilestones(): Milestone[] {
  const patch = useApp((s) => s.milestonePatch);
  return useMemo(() => MILESTONES.map((m) => ({ ...m, ...patch[m.id] })), [patch]);
}
export function useFiles(): ProjectFile[] {
  const added = useApp((s) => s.addedFiles);
  return useMemo(() => [...added.slice().reverse(), ...FILES], [added]);
}
export function useUpdates(): Update[] {
  const added = useApp((s) => s.addedUpdates);
  return useMemo(() => [...added.slice().reverse(), ...UPDATES], [added]);
}
export function useActivity(): Activity[] {
  const added = useApp((s) => s.addedActivity);
  return useMemo(() => [...added, ...ACTIVITY].sort((a, b) => b.day - a.day || a.minutes - b.minutes), [added]);
}

/** The projects a client can see. */
export const clientProjects = (clientId: ClientId) => PROJECTS.filter((p) => p.clientId === clientId);
export const MY_CLIENT = ACCOUNTS.client.clientId;
export const myUser = (role: Role): PersonId | null => (role === 'client' ? null : (ACCOUNTS[role].id as PersonId));
export { dueDay };
