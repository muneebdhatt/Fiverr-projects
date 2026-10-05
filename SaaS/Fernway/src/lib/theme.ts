'use client';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'fernway-ui';

/** Runs before first paint so dark mode and larger text never flash. */
export const themeScript = `try{var p=JSON.parse(localStorage.getItem('${KEY}')||'{}');var d=document.documentElement;if(p.dark!==false)d.classList.add('dark');if(p.large)d.classList.add('large');}catch(e){}`;

export interface UiPrefs { dark: boolean; large: boolean; }

export function useUiPrefs() {
  const [prefs, setPrefs] = useState<UiPrefs>({ dark: false, large: false });

  useEffect(() => {
    const d = document.documentElement;
    setPrefs({ dark: d.classList.contains('dark'), large: d.classList.contains('large') });
  }, []);

  const set = useCallback((patch: Partial<UiPrefs>) => {
    setPrefs((cur) => {
      const next = { ...cur, ...patch };
      const d = document.documentElement;
      d.classList.toggle('dark', next.dark);
      d.classList.toggle('large', next.large);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: the choice still applies for this visit */
      }
      return next;
    });
  }, []);

  return { prefs, set };
}
