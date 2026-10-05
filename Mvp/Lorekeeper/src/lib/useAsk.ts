'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useChat } from '@/lib/chatStore';
import { useSession } from '@/shell/session';
import { toast } from '@/shell/Toast';

/**
 * Sends a question into the signed-in person's open chat and adds the answer when it arrives.
 * Also picks up a question another screen queued with `ask`, so only one asker should be mounted at a time.
 */
export function useAsk() {
  const addFor = useChat((s) => s.add);
  const pending = useChat((s) => s.pending);
  const clearPending = useChat((s) => s.clearPending);
  const uid = useSession((s) => s.me?.id);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const send = useCallback(async (q: string) => {
    const question = q.trim();
    if (!question || busyRef.current || !uid) return;
    busyRef.current = true;
    setBusy(true);
    addFor(uid, { id: `u-${Date.now()}`, role: 'user', text: question });
    try {
      const [reply] = await Promise.all([api.chat(question), new Promise((r) => setTimeout(r, 1300))]);
      addFor(uid, { id: `a-${Date.now()}-${reply.id}`, role: 'ai', reply, fresh: true });
    } catch {
      toast('Could not get an answer. Please try again.', 'err');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [addFor, uid]);

  useEffect(() => {
    if (pending && pending.uid === uid) { const q = pending.q; clearPending(); send(q); }
  }, [pending, uid, clearPending, send]);

  return { busy, send };
}
