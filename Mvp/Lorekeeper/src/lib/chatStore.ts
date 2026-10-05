import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Reply } from './api';

export type Msg =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'ai'; reply: Reply; rating?: 'up' | 'down'; fresh: boolean };

type AiMsg = Extract<Msg, { role: 'ai' }>;
export type Conv = { id: string; title: string; updated: number; msgs: Msg[] };
type Bucket = { convs: Conv[]; activeId: string | null };

const EMPTY: Bucket = { convs: [], activeId: null };
const NONE: Msg[] = [];
let n = 0;
const newId = () => `c${Date.now().toString(36)}${(n++).toString(36)}`;

/** Every signed-in person keeps their own chats, keyed by user id. Saved in this browser only. */
type S = {
  byUser: Record<string, Bucket>;
  pending: { uid: string; q: string } | null;
  add: (uid: string, m: Msg) => void;
  patch: (uid: string, id: string, p: Partial<AiMsg>) => void;
  select: (uid: string, id: string | null) => void;
  rename: (uid: string, id: string, title: string) => void;
  remove: (uid: string, id: string) => void;
  ask: (uid: string, q: string) => void;
  clearPending: () => void;
};

const bucket = (s: S, uid: string): Bucket => s.byUser[uid] ?? EMPTY;
const titleOf = (text: string) => (text.length > 46 ? text.slice(0, 46).trimEnd() + '…' : text);

export const useChat = create<S>()(
  persist(
    (set) => ({
      byUser: {},
      pending: null,
      add: (uid, m) =>
        set((s) => {
          const b = bucket(s, uid);
          let convs = b.convs;
          let activeId = b.activeId;
          if (!activeId || !convs.some((c) => c.id === activeId)) {
            activeId = newId();
            convs = [{ id: activeId, title: m.role === 'user' ? titleOf(m.text) : 'New chat', updated: Date.now(), msgs: [] }, ...convs];
          }
          convs = convs.map((c) => (c.id === activeId ? { ...c, updated: Date.now(), msgs: [...c.msgs, m] } : c));
          return { byUser: { ...s.byUser, [uid]: { convs, activeId } } };
        }),
      patch: (uid, id, p) =>
        set((s) => {
          const b = bucket(s, uid);
          const convs = b.convs.map((c) => ({ ...c, msgs: c.msgs.map((m) => (m.id === id && m.role === 'ai' ? { ...m, ...p } : m)) }));
          return { byUser: { ...s.byUser, [uid]: { ...b, convs } } };
        }),
      select: (uid, id) => set((s) => ({ byUser: { ...s.byUser, [uid]: { ...bucket(s, uid), activeId: id } } })),
      rename: (uid, id, title) =>
        set((s) => {
          const b = bucket(s, uid);
          return { byUser: { ...s.byUser, [uid]: { ...b, convs: b.convs.map((c) => (c.id === id ? { ...c, title: title.trim() || c.title } : c)) } } };
        }),
      remove: (uid, id) =>
        set((s) => {
          const b = bucket(s, uid);
          return { byUser: { ...s.byUser, [uid]: { convs: b.convs.filter((c) => c.id !== id), activeId: b.activeId === id ? null : b.activeId } } };
        }),
      ask: (uid, q) => set({ pending: { uid, q } }),
      clearPending: () => set({ pending: null }),
    }),
    {
      name: 'lk_chats',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ byUser: s.byUser }),
    },
  ),
);

/** The conversations of one person, newest first, and the one that is open. */
export function useBucket(uid: string | undefined) {
  const b = useChat((s) => (uid ? s.byUser[uid] : undefined)) ?? EMPTY;
  const active = b.convs.find((c) => c.id === b.activeId) ?? null;
  return { convs: b.convs, active, msgs: active?.msgs ?? NONE };
}
