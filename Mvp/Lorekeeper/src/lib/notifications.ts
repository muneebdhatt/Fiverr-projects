import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Note = { id: string; text: string; at: number; read: boolean; href?: string };

const MIN = 60000;
const SEEDS: Record<string, { text: string; mins: number; unread?: boolean; href?: string }[]> = {
  u1: [
    { text: 'Priya Raman added Client Notes: Maple Ridge Veterinary', mins: 540, unread: true, href: '/documents' },
    { text: 'Your question about client dinner limits was marked helpful', mins: 1500, href: '/chat' },
    { text: 'Holiday Calendar 2026 was updated by Daniel Okafor', mins: 4300, href: '/documents' },
  ],
  u2: [
    { text: 'An answer about remote work was marked wrong and needs review', mins: 90, unread: true, href: '/admin' },
    { text: 'Priya Raman added Client Notes: Maple Ridge Veterinary', mins: 540, unread: true, href: '/documents' },
    { text: 'Samir Haddad joined the workspace', mins: 4300, href: '/admin' },
  ],
};
const GENERIC = [{ text: 'Welcome to Lorekeeper. Ask a question to get started.', mins: 1, unread: true, href: '/chat' }];

type S = {
  byUser: Record<string, Note[]>;
  seed: (uid: string) => void;
  push: (uid: string, text: string, href?: string) => void;
  markAllRead: (uid: string) => void;
  markRead: (uid: string, id: string) => void;
};
let n = 0;

export const useNotes = create<S>()(
  persist(
    (set) => ({
      byUser: {},
      seed: (uid) =>
        set((s) => {
          if (s.byUser[uid]) return s;
          const now = Date.now();
          const base = SEEDS[uid] ?? GENERIC;
          const notes = base.map((x, i) => ({ id: `seed-${uid}-${i}`, text: x.text, at: now - x.mins * MIN, read: !x.unread, href: x.href }));
          return { byUser: { ...s.byUser, [uid]: notes } };
        }),
      push: (uid, text, href) =>
        set((s) => ({ byUser: { ...s.byUser, [uid]: [{ id: `n-${Date.now()}-${n++}`, text, at: Date.now(), read: false, href }, ...(s.byUser[uid] ?? [])].slice(0, 30) } })),
      markAllRead: (uid) => set((s) => ({ byUser: { ...s.byUser, [uid]: (s.byUser[uid] ?? []).map((x) => ({ ...x, read: true })) } })),
      markRead: (uid, id) => set((s) => ({ byUser: { ...s.byUser, [uid]: (s.byUser[uid] ?? []).map((x) => (x.id === id ? { ...x, read: true } : x)) } })),
    }),
    { name: 'lk_notes', storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

/** Adds a notification for whoever is signed in. */
export function notify(uid: string | undefined, text: string, href?: string) {
  if (uid) useNotes.getState().push(uid, text, href);
}
