'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useMemo, useState } from 'react';
import { ACTIONS, LATEST, LATEST_ACTIONS, MEETINGS, type ActionItem, type Answer, type Meeting, type PersonId, type Status } from '@/data';

export type Role = 'member' | 'admin';
export type Msg = { from: 'me' | 'ai'; text: string; answer?: Answer };
export type Toast = { id: number; message: string; tone: 'info' | 'success' | 'warn' };
export type Invite = { email: string; role: 'Admin' | 'Member' };

export const BASE_LIMIT = 600;

type State = {
  role: Role | null;
  status: Record<string, Status>;
  patch: Record<string, { owner?: PersonId; due?: number; title?: string }>;
  extra: ActionItem[];
  recorded: boolean;
  newTitle: string;
  newWho: PersonId[];
  shared: Record<string, number>;
  asks: Record<string, Msg[]>;
  seen: string[];
  limit: number;
  roles: Partial<Record<PersonId, 'Admin' | 'Member'>>;
  invites: Invite[];
  flags: { alert: boolean; auto: boolean };
  toasts: Toast[];
  signIn: (role: Role) => void;
  switchTo: (role: Role) => void;
  signOut: () => void;
  setStatus: (id: string, s: Status) => void;
  patchAction: (id: string, p: { owner?: PersonId; due?: number }) => void;
  addAction: (a: Omit<ActionItem, 'id'>) => void;
  recordLatest: (title: string, who: PersonId[]) => void;
  markShared: (meeting: string, count: number) => void;
  addAsk: (meeting: string, m: Msg) => void;
  markSeen: (meeting: string) => void;
  setLimit: (n: number) => void;
  setPersonRole: (id: PersonId, r: 'Admin' | 'Member') => void;
  invite: (i: Invite) => void;
  setFlag: (k: 'alert' | 'auto', v: boolean) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
};

const fresh = () => ({
  status: {} as Record<string, Status>,
  patch: {} as State['patch'],
  extra: [] as ActionItem[],
  recorded: false,
  newTitle: LATEST.title,
  newWho: LATEST.who,
  shared: {} as Record<string, number>,
  asks: {} as Record<string, Msg[]>,
  seen: [] as string[],
  limit: BASE_LIMIT,
  roles: {} as State['roles'],
  invites: [] as Invite[],
  flags: { alert: true, auto: false },
});

let toastId = 1;
let extraId = 1;
export const useApp = create<State>()(
  persist(
    (set, get) => ({
      role: null,
      ...fresh(),
      toasts: [],
      // Every sign-in starts from the same workspace, so each walkthrough matches the last.
      signIn: (role) => set({ ...fresh(), role, toasts: [] }),
      switchTo: (role) => set({ role }),
      signOut: () => set({ role: null, toasts: [] }),
      setStatus: (id, s) => set((st) => ({ status: { ...st.status, [id]: s } })),
      patchAction: (id, p) => set((st) => ({ patch: { ...st.patch, [id]: { ...st.patch[id], ...p } } })),
      addAction: (a) => set((st) => ({ extra: [...st.extra, { ...a, id: `x${extraId++}` }] })),
      recordLatest: (title, who) => set({ recorded: true, newTitle: title.trim() || LATEST.title, newWho: who.length ? who : LATEST.who }),
      markShared: (meeting, count) => set((st) => ({ shared: { ...st.shared, [meeting]: count } })),
      addAsk: (meeting, m) => set((st) => ({ asks: { ...st.asks, [meeting]: [...(st.asks[meeting] ?? []), m] } })),
      markSeen: (meeting) => set((st) => (st.seen.includes(meeting) ? st : { seen: [...st.seen, meeting] })),
      setLimit: (limit) => set({ limit }),
      setPersonRole: (id, r) => set((st) => ({ roles: { ...st.roles, [id]: r } })),
      invite: (i) => set((st) => ({ invites: [...st.invites, i] })),
      setFlag: (k, v) => set((st) => ({ flags: { ...st.flags, [k]: v } })),
      toast: (message, tone = 'info') => {
        const id = toastId++;
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
        setTimeout(() => get().dismissToast(id), 3600);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'minutebook-session',
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

export function useMeetings(): Meeting[] {
  const recorded = useApp((s) => s.recorded);
  const title = useApp((s) => s.newTitle);
  const who = useApp((s) => s.newWho);
  return useMemo(() => (recorded ? [{ ...LATEST, title, who }, ...MEETINGS] : MEETINGS), [recorded, title, who]);
}
export function useMeeting(id: string): Meeting | undefined {
  const all = useMeetings();
  return all.find((m) => m.id === id);
}

/** All action items with status, owner and due-date edits applied. */
export function useActions(): ActionItem[] {
  const status = useApp((s) => s.status);
  const patch = useApp((s) => s.patch);
  const extra = useApp((s) => s.extra);
  const recorded = useApp((s) => s.recorded);
  return useMemo(() => {
    const all = [...(recorded ? LATEST_ACTIONS : []), ...extra, ...ACTIONS];
    return all.map((a) => ({ ...a, ...patch[a.id], status: status[a.id] ?? a.status }));
  }, [status, patch, extra, recorded]);
}

export function useMinutesUsed() {
  const recorded = useApp((s) => s.recorded);
  return MEETINGS.reduce((n, m) => n + m.mins, 0) + (recorded ? LATEST.mins : 0);
}
