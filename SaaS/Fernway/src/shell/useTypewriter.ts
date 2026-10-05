'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Types `text` out a couple of characters at a time. `start(text)` begins, `reset()` clears. */
export function useTypewriter(speedMs = 16) {
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
        i += 2;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          stop();
          setShown(text);
          setTyping(false);
          onDone?.();
        }
      }, speedMs);
    },
    [speedMs],
  );

  const reset = useCallback(() => {
    stop();
    setShown('');
    setTyping(false);
  }, []);

  useEffect(() => stop, []);
  return { shown, typing, start, reset };
}
