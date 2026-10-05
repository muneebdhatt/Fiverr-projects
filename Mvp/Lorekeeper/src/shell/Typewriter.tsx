'use client';
import { useEffect, useState } from 'react';

/** Reveals `text` word by word. Returns the visible text and whether it is still typing. */
export function useTypewriter(text: string, run: boolean, msPerWord = 28) {
  const [shown, setShown] = useState(run ? '' : text);
  useEffect(() => {
    if (!run) { setShown(text); return; }
    const parts = text.split(/(\s+)/);
    let i = 0;
    setShown('');
    const id = setInterval(() => {
      i += 2;
      setShown(parts.slice(0, i).join(''));
      if (i >= parts.length) clearInterval(id);
    }, msPerWord);
    return () => clearInterval(id);
  }, [text, run, msPerWord]);
  return { shown, typing: shown.length < text.length };
}

export function Thinking({ label = 'Searching your documents' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-500">
      <span className="flex gap-1"><i className="dot" /><i className="dot" /><i className="dot" /></span>
      {label}
    </div>
  );
}
