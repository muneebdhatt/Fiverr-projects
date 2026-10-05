'use client';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'shiftwire-theme-v2';

/** Dark by default; the choice is remembered in the browser. */
export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem(KEY, next ? 'dark' : 'light'); } catch { /* storage may be blocked */ }
    setDark(next);
  }, []);
  return { dark, toggle };
}

// Dark is the default. Only an explicit "light" choice (saved in this browser) turns it off.
export const themeScript = "try{if(localStorage.getItem('" + KEY + "')!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}";
