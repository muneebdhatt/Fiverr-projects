'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Types `text` out a few characters at a time. Call `start(text)` to begin, `reset()` to clear. */
export function useTypewriter(speedMs = 14, step = 3) {
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const start = useCallback(
    (text: string, onDone?: () => void) => {
      stop();
      setShown('');
      setTyping(true);
      let i = 0;
      timer.current = setInterval(() => {
        i += step;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          stop();
          setShown(text);
          setTyping(false);
          onDone?.();
        }
      }, speedMs);
    },
    [speedMs, step],
  );

  const reset = useCallback(() => {
    stop();
    setShown('');
    setTyping(false);
  }, []);

  useEffect(() => stop, []);
  return { shown, typing, start, reset };
}
