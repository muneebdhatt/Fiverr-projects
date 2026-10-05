'use client';
import { create } from 'zustand';
import { useEffect, useState } from 'react';

/** Interface state that should never be saved: open dialogs, the guided tour, one-off triggers. */
export const useUi = create<{ tour: boolean; shortcuts: boolean; newDoc: boolean }>(() => ({ tour: false, shortcuts: false, newDoc: false }));

const KEY = 'quillstack-theme';

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem(KEY, next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
    setDark(next);
  };
  return { dark, toggle };
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
