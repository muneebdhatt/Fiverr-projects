'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { PERSONAS, ROOMS, SEED_ROOMS, STAFF, scriptedArrival, seedAudit, seedNotifs, seedPatients } from '@/data/seed';
import { QUESTION_SETS } from '@/data/questions';
import type { Alerts, AuditRow, Note, Notif, Patient, Role, Staff, Status, QuestionSet } from '@/data/types';

export interface Toast { id: number; message: string; tone: 'success' | 'info' | 'warn'; }

interface State {
  authed: boolean;
  role: Role;
  patients: Patient[];
  audit: AuditRow[];
  staff: Staff[];
  sets: QuestionSet[];
  typed: Record<string, boolean>;
  alerts: Record<string, Alerts>;
  roomOf: Record<string, string>;
  notifs: Notif[];
  arrivalDone: boolean;
  focusId: string | null;
  tourOpen: boolean;
  toasts: Toast[];
  login: (role: Role) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  setStatus: (id: string, status: Status) => void;
  addNote: (id: string, text: string) => void;
  logOpen: (id: string) => void;
  logQueueView: () => void;
  markTyped: (id: string) => void;
  callToDesk: (id: string) => void;
  clearDesk: (id: string) => void;
  alertNurse: (id: string) => void;
  ackNurse: (id: string) => void;
  assignRoom: (id: string, roomId: string | null) => boolean;
  logExport: (label: string) => void;
  triggerArrival: () => void;
  readNotifs: () => void;
  setFocus: (id: string | null) => void;
  setTour: (open: boolean) => void;
  addWalkIn: (p: Patient) => void;
  clearWalkIns: () => void;
  publishSet: (set: QuestionSet) => void;
  inviteStaff: (name: string, email: string, role: Role) => void;
  updateStaff: (id: string, patch: Partial<Staff>) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

export const personaOf = (role: Role) => PERSONAS.find((p) => p.id === role)!;
export const firstLast = (name: string) => {
  const parts = name.replace(/^(Dr\.?|Nurse)\s+/i, '').split(' ');
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

let toastId = 1;
let auditSeq = 1000;
let notifSeq = 1000;

const fresh = (walkIns: Patient[] = []) => {
  const now = Date.now();
  return {
    patients: [...walkIns, ...seedPatients(now)],
    audit: seedAudit(now),
    staff: STAFF,
    sets: QUESTION_SETS,
    typed: {} as Record<string, boolean>,
    alerts: {} as Record<string, Alerts>,
    roomOf: { ...SEED_ROOMS } as Record<string, string>,
    notifs: seedNotifs(now),
    arrivalDone: false,
  };
};

const row = (role: Role, action: AuditRow['action'], detail: string, patient?: string): AuditRow => {
  const me = personaOf(role);
  const s = STAFF.find((x) => x.name === me.name)!;
  return { id: `a${auditSeq++}`, ts: Date.now(), userId: s.id, user: me.name, role, action, patient, detail };
};

const notif = (text: string, kind: Notif['kind'], forRoles: Role[], patientId?: string): Notif => ({ id: `nf${notifSeq++}`, ts: Date.now(), text, kind, patientId, for: forRoles });
const ALL: Role[] = ['receptionist', 'clinician', 'admin'];

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      authed: false,
      role: 'clinician',
      ...fresh(),
      focusId: null,
      tourOpen: false,
      toasts: [],
      // Each sign-in starts from the same queue; a patient who just checked in at the kiosk stays.
      login: (role) => set((s) => ({ ...fresh(s.patients.filter((p) => p.walkIn)), authed: true, role })),
      logout: () => set({ authed: false }),
      switchRole: (role) => set({ role }),
      setStatus: (id, status) => {
        const p = get().patients.find((x) => x.id === id);
        if (!p || p.status === status) return;
        const now = Date.now();
        set((s) => {
          const roomOf = { ...s.roomOf };
          if (status === 'Seen') delete roomOf[id];
          return {
            roomOf,
            patients: s.patients.map((x) => (x.id === id ? { ...x, status, startedAt: status === 'Waiting' ? undefined : x.startedAt ?? now, seenAt: status === 'Seen' ? now : undefined } : x)),
            audit: [row(s.role, 'Changed status', `${p.status} to ${status}`, p.name), ...s.audit],
          };
        });
      },
      addNote: (id, text) => {
        const p = get().patients.find((x) => x.id === id);
        if (!p || !text.trim()) return;
        const me = personaOf(get().role);
        const note: Note = { id: `n${Date.now()}`, by: me.name, role: get().role, ts: Date.now(), text: text.trim() };
        set((s) => ({
          patients: s.patients.map((x) => (x.id === id ? { ...x, notes: [note, ...x.notes] } : x)),
          audit: [row(s.role, 'Added note', 'Clinician note added', p.name), ...s.audit],
        }));
      },
      logOpen: (id) => {
        const s0 = get();
        const p = s0.patients.find((x) => x.id === id);
        if (!p) return;
        const r = s0.role;
        const last = s0.audit.find((a) => a.action === 'Opened intake' && a.patient === p.name && a.role === r);
        if (last && Date.now() - last.ts < 8000) return;
        set((s) => ({ audit: [row(r, 'Opened intake', r === 'clinician' ? 'Read full intake and AI summary' : 'Opened check-in details', p.name), ...s.audit] }));
      },
      logQueueView: () => {
        const s0 = get();
        const last = s0.audit.find((a) => a.action === 'Viewed queue' && a.role === s0.role);
        if (last && Date.now() - last.ts < 60000) return;
        set((s) => ({ audit: [row(s.role, 'Viewed queue', "Opened today's queue"), ...s.audit] }));
      },
      callToDesk: (id) => {
        const p = get().patients.find((x) => x.id === id);
        if (!p) return;
        set((s) => ({ alerts: { ...s.alerts, [id]: { ...s.alerts[id], desk: Date.now() } }, audit: [row(s.role, 'Called to desk', 'Patient asked to come to the front desk', p.name), ...s.audit] }));
      },
      clearDesk: (id) => set((s) => ({ alerts: { ...s.alerts, [id]: { ...s.alerts[id], desk: undefined } } })),
      alertNurse: (id) => {
        const p = get().patients.find((x) => x.id === id);
        if (!p) return;
        const by = personaOf(get().role).name;
        set((s) => ({
          alerts: { ...s.alerts, [id]: { ...s.alerts[id], nurse: { ts: Date.now(), by } } },
          audit: [row(s.role, 'Alerted nurse', 'Priority alert sent to the clinical team', p.name), ...s.audit],
          notifs: [notif(`${by} asked for a nurse to see ${p.name}`, 'alert', ['clinician'], id), ...s.notifs],
        }));
      },
      ackNurse: (id) => {
        const p = get().patients.find((x) => x.id === id);
        const a = get().alerts[id]?.nurse;
        if (!p || !a) return;
        set((s) => ({
          alerts: { ...s.alerts, [id]: { ...s.alerts[id], nurse: { ...a, ack: true } } },
          audit: [row(s.role, 'Acknowledged alert', `Acknowledged alert from ${a.by}`, p.name), ...s.audit],
          notifs: [notif(`A nurse is on their way to ${p.name}`, 'info', ['receptionist'], id), ...s.notifs],
        }));
      },
      assignRoom: (id, roomId) => {
        const s0 = get();
        const p = s0.patients.find((x) => x.id === id);
        if (!p) return false;
        if (roomId) {
          const occupant = Object.entries(s0.roomOf).find(([pid, rid]) => rid === roomId && pid !== id);
          if (occupant) {
            const o = s0.patients.find((x) => x.id === occupant[0]);
            get().toast(`${ROOMS.find((r) => r.id === roomId)!.name} is in use by ${o ? firstLast(o.name) : 'another patient'}`, 'warn');
            return false;
          }
        }
        const room = ROOMS.find((r) => r.id === roomId);
        set((s) => {
          const roomOf = { ...s.roomOf };
          if (roomId) roomOf[id] = roomId;
          else delete roomOf[id];
          return {
            roomOf,
            audit: [row(s.role, 'Assigned room', room ? `Moved to ${room.name}` : 'Room released', p.name), ...s.audit],
            notifs: room ? [notif(`${p.name} is in ${room.name}`, 'room', ALL, id), ...s.notifs] : s.notifs,
          };
        });
        return true;
      },
      logExport: (label) => set((s) => ({ audit: [row(s.role, 'Exported report', label), ...s.audit] })),
      triggerArrival: () => {
        if (get().arrivalDone || !get().authed) return;
        const p = scriptedArrival(Date.now());
        set((s) => ({
          arrivalDone: true,
          patients: [p, ...s.patients.filter((x) => x.id !== p.id)],
          notifs: [notif(`New check-in: ${p.name}, ${p.flags.some((f) => f.level === 'review') ? 'needs a closer look' : 'routine'}`, 'arrival', ALL, p.id), ...s.notifs],
        }));
      },
      readNotifs: () => set((s) => ({ notifs: s.notifs.map((n) => (n.for.includes(s.role) ? { ...n, read: true } : n)) })),
      setFocus: (id) => set({ focusId: id }),
      setTour: (open) => set({ tourOpen: open }),
      markTyped: (id) => set((s) => ({ typed: { ...s.typed, [id]: true } })),
      addWalkIn: (p) =>
        set((s) => ({
          patients: [p, ...s.patients.filter((x) => !x.walkIn)],
          notifs: [notif(`New check-in: ${p.name}${p.flags.some((f) => f.level === 'urgent') ? ', flagged priority' : ''}`, p.flags.some((f) => f.level === 'urgent') ? 'alert' : 'arrival', ALL, p.id), ...s.notifs],
        })),
      clearWalkIns: () => set((s) => ({ patients: s.patients.filter((x) => !x.walkIn) })),
      publishSet: (setObj) =>
        set((s) => ({
          sets: s.sets.map((x) => (x.id === setObj.id ? { ...setObj, editedBy: personaOf(s.role).name, editedMinsAgo: 0 } : x)),
          audit: [row(s.role, 'Edited question set', `${setObj.name}: published changes to the check-in screen`), ...s.audit],
        })),
      inviteStaff: (name, email, role) =>
        set((s) => ({
          staff: [{ id: `s${Date.now()}`, name, email, role, active: true, invited: true, lastActiveMins: 0 }, ...s.staff],
          audit: [row(s.role, 'Invited staff', `Invited ${name} as ${role === 'admin' ? 'Admin' : role === 'clinician' ? 'Clinician' : 'Receptionist'}`), ...s.audit],
        })),
      updateStaff: (id, patch) => set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      toast: (message, tone = 'success') => {
        const id = toastId++;
        set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
        setTimeout(() => get().dismissToast(id), 3200);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'fernway-session',
      version: 2,
      partialize: (s) => ({ authed: s.authed, role: s.role, patients: s.patients, audit: s.audit, staff: s.staff, sets: s.sets, typed: s.typed, alerts: s.alerts, roomOf: s.roomOf, notifs: s.notifs, arrivalDone: s.arrivalDone }),
    },
  ),
);

// A second window (for example the waiting-room board) follows changes made in this one.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'fernway-session') void useApp.persist.rehydrate();
  });
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    if (useApp.persist.hasHydrated()) setH(true);
    return useApp.persist.onFinishHydration(() => setH(true));
  }, []);
  return h;
}

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
