import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Prefs = {
  theme: 'light' | 'dark';
  emailDigest: boolean;
  uploadAlerts: boolean;
  setTheme: (t: 'light' | 'dark') => void;
  set: (p: Partial<Pick<Prefs, 'emailDigest' | 'uploadAlerts'>>) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: 'light',
      emailDigest: true,
      uploadAlerts: true,
      setTheme: (theme) => set({ theme }),
      set: (p) => set(p),
    }),
    { name: 'lk_prefs', storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
