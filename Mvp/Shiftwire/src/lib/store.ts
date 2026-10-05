'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { BUSINESSES, ME_BUSINESS, PAST_SHIFTS, PERSONAS, TEMPLATES, WORKERS } from '@/data/seed';
import type { ComplianceRow, EscalateRule, PersonaId, Role, Shift, Template } from '@/data/types';
import { STOP_IDX, clampPositions, winnerIdx, fillAtFor } from './script';

export interface Toast { id: number; message: string; tone: 'success' | 'info' | 'warn'; }

export interface Broadcast {
  shiftId: string;
  workerIds: string[];
  positions: number;
  startedAt: number;
  finalized: boolean;
}

export interface Prefill {
  role: Role;
  rate?: number;
  start?: number;
  end?: number;
  positions?: number;
  location?: string;
  escalated?: { bump: number; radius: number };
}

interface State {
  authed: boolean;
  persona: PersonaId;
  bizName: string;
  contactName: string;
  meId: string | null;
  nextChargeDays: number;
  extraShifts: Shift[];
  broadcast: Broadcast | null;
  optedOut: Record<string, boolean>;
  favourites: Record<string, boolean>;
  prefill: Prefill | null;
  offerReply: Record<string, 'yes' | 'no'>;
  templates: Template[];
  ratings: Record<string, { stars: number; note: string }>;
  availableTonight: boolean;
  notifRead: Record<string, boolean>;
  billingFixed: Record<string, boolean>;
  complianceExtra: ComplianceRow[];
  toasts: Toast[];
  login: (persona: PersonaId, opts?: { bizName?: string; contactName?: string; nextChargeDays?: number; meId?: string }) => void;
  logout: () => void;
  switchPersona: (persona: PersonaId) => void;
  startBroadcast: (shift: Shift, workerIds: string[], extra?: Shift[]) => void;
  finalizeBroadcast: () => void;
  replayBroadcast: () => void;
  toggleFavourite: (id: string) => void;
  setPrefill: (p: Prefill | null) => void;
  setOfferReply: (id: string, reply: 'yes' | 'no') => void;
  setNextChargeDays: (n: number) => void;
  saveTemplate: (t: Omit<Template, 'id'>) => void;
  rateShift: (shiftId: string, stars: number, note: string) => void;
  setAvailable: (on: boolean) => void;
  readNotifs: (ids: string[]) => void;
  fixBilling: (businessId: string) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const initial = () => ({
  authed: false,
  persona: 'business' as PersonaId,
  bizName: BUSINESSES[0].name,
  contactName: PERSONAS[0].name,
  meId: null as string | null,
  nextChargeDays: 12,
  extraShifts: [] as Shift[],
  broadcast: null as Broadcast | null,
  optedOut: {} as Record<string, boolean>,
  favourites: { w1: true, w6: true, w11: true } as Record<string, boolean>,
  prefill: null as Prefill | null,
  offerReply: {} as Record<string, 'yes' | 'no'>,
  templates: TEMPLATES as Template[],
  ratings: {} as Record<string, { stars: number; note: string }>,
  availableTonight: false,
  notifRead: {} as Record<string, boolean>,
  billingFixed: {} as Record<string, boolean>,
  complianceExtra: [] as ComplianceRow[],
});

let toastId = 1;

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      toasts: [],
      // Every sign-in starts from the same fresh workspace so each take matches.
      login: (persona, opts) => set({ ...initial(), authed: true, persona, ...opts }),
      logout: () => set({ authed: false }),
      switchPersona: (persona) => set({ persona }),
      startBroadcast: (shift, workerIds, extra = []) =>
        set((s) => ({
          extraShifts: [shift, ...extra, ...s.extraShifts],
          broadcast: { shiftId: shift.id, workerIds, positions: clampPositions(shift.positions), startedAt: Date.now(), finalized: false },
        })),
      finalizeBroadcast: () => {
        const b = get().broadcast;
        if (!b || b.finalized) return;
        const winners = winnerIdx(b.positions).map((i) => b.workerIds[i]);
        const stopId = b.workerIds[STOP_IDX];
        set((s) => ({
          broadcast: { ...b, finalized: true },
          optedOut: { ...s.optedOut, [stopId]: true },
          complianceExtra: s.complianceExtra.some((c) => c.id === `stop-${b.shiftId}`)
            ? s.complianceExtra
            : [{ id: `stop-${b.shiftId}`, workerId: stopId, event: 'STOP received' as const, source: 'Reply to shift text', minsAgo: 0 }, ...s.complianceExtra],
          extraShifts: s.extraShifts.map((x) =>
            x.id === b.shiftId
              ? { ...x, status: 'Filled' as const, filledBy: winners[0], filledByIds: winners, replies: 4 + winners.length, secsToFill: Math.round(fillAtFor(b.positions) / 1000) }
              : x,
          ),
        }));
      },
      replayBroadcast: () => {
        const b = get().broadcast;
        if (!b) return;
        const stopId = b.workerIds[STOP_IDX];
        set((s) => {
          const optedOut = { ...s.optedOut };
          delete optedOut[stopId];
          return {
            broadcast: { ...b, startedAt: Date.now(), finalized: false },
            optedOut,
            complianceExtra: s.complianceExtra.filter((c) => c.id !== `stop-${b.shiftId}`),
            extraShifts: s.extraShifts.map((x) => (x.id === b.shiftId ? { ...x, status: 'Open' as const, filledBy: undefined, filledByIds: undefined, secsToFill: undefined, replies: 0 } : x)),
          };
        });
      },
      toggleFavourite: (id) => set((s) => ({ favourites: { ...s.favourites, [id]: !s.favourites[id] } })),
      setPrefill: (p) => set({ prefill: p }),
      setOfferReply: (id, reply) => set((s) => ({ offerReply: { ...s.offerReply, [id]: reply } })),
      setNextChargeDays: (n) => set({ nextChargeDays: n }),
      saveTemplate: (t) => set((s) => ({ templates: [...s.templates, { ...t, id: `t-${Date.now()}` }] })),
      rateShift: (shiftId, stars, note) => set((s) => ({ ratings: { ...s.ratings, [shiftId]: { stars, note } } })),
      setAvailable: (on) => set({ availableTonight: on }),
      readNotifs: (ids) => set((s) => ({ notifRead: { ...s.notifRead, ...Object.fromEntries(ids.map((i) => [i, true])) } })),
      fixBilling: (businessId) => set((s) => ({ billingFixed: { ...s.billingFixed, [businessId]: true } })),
      toast: (message, tone = 'success') => {
        const id = toastId++;
        set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
        setTimeout(() => get().dismissToast(id), 3600);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'shiftwire-session',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ toasts: _t, ...rest }) => rest as unknown as State,
      // A session saved by an older build can lack newer fields; fill them from the defaults.
      merge: (saved, current) => ({ ...current, ...initialDefaults(), ...(saved as object) }),
    },
  ),
);

function initialDefaults() {
  const { authed: _a, persona: _p, ...rest } = initial();
  return rest;
}

/** Rehydrates the persisted session on the client and reports when it is ready. */
export function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).finally(() => setReady(true));
  }, []);
  return ready;
}

export function homeFor(persona: PersonaId) {
  return persona === 'business' ? '/shifts' : persona === 'worker' ? '/offers' : '/admin';
}

/** The signed-in business's shifts, newest first, including any posted this visit. */
export function useMyShifts() {
  const extra = useApp((s) => s.extraShifts);
  return [...extra, ...PAST_SHIFTS.filter((s) => s.businessId === ME_BUSINESS)];
}

export function useOptedOut(workerId: string) {
  const o = useApp((s) => s.optedOut[workerId]);
  return !!o || !!WORKERS.find((w) => w.id === workerId)?.unsubscribed;
}

export type { EscalateRule };
