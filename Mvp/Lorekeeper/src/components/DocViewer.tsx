'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { api, DocFull } from '@/lib/api';
import { ago } from '@/lib/time';
import { SidePanel } from '@/shell/SidePanel';
import { Skeleton, StatusChip } from '@/shell/ui';

export type DocTarget = { id: string; quote?: string } | null;

export function DocViewer({ target, onClose }: { target: DocTarget; onClose: () => void }) {
  const [doc, setDoc] = useState<DocFull | null>(null);
  const [error, setError] = useState(false);
  const markRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setDoc(null);
    setError(false);
    if (!target) return;
    let live = true;
    api.doc(target.id).then((d) => live && setDoc(d)).catch(() => live && setError(true));
    return () => { live = false; };
  }, [target]);

  useEffect(() => {
    if (doc && markRef.current) markRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [doc]);

  const quote = target?.quote;
  const para = (text: string, i: number) => {
    const at = quote ? text.indexOf(quote) : -1;
    if (at < 0) return <p key={i} className="mb-3 leading-[1.7]">{text}</p>;
    return (
      <p key={i} className="mb-3 leading-[1.7]">
        {text.slice(0, at)}
        <mark className="quote" ref={(el) => { markRef.current = el; }}>{quote}</mark>
        {text.slice(at + quote!.length)}
      </p>
    );
  };

  return (
    <SidePanel open={!!target} onClose={onClose} title={doc?.title || 'Loading document'} subtitle={doc ? `${doc.kind} · ${doc.pages} pages · updated ${ago(doc.updated_mins_ago)}` : undefined}>
      {error && <div className="text-sm text-ink-500">This document could not be opened. Try again in a moment.</div>}
      {!doc && !error && (
        <div className="space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>
      )}
      {doc && (
        <div className="font-serif text-[16px] text-ink-800">
          <div className="mb-4 flex items-center gap-2 text-xs text-ink-500">
            <FileText className="h-4 w-4" /> {doc.owner} <StatusChip status={doc.status} />
          </div>
          {doc.body.map(para)}
        </div>
      )}
    </SidePanel>
  );
}
