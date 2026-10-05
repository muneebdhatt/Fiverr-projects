'use client';
import { useMemo } from 'react';
import { ME_WORKER, WORKERS } from '@/data/seed';
import type { Worker } from '@/data/types';
import { toWorker, useAccounts, type WorkerAccount } from './accounts';
import { useApp } from './store';

/** The account behind the worker screens: a worker created through sign-up, or the built-in worker. */
export function useMeAccount(): WorkerAccount | null {
  const meId = useApp((s) => s.meId);
  const accounts = useAccounts();
  return meId ? accounts.find((a) => a.id === meId) ?? null : null;
}

export function useMe(): Worker {
  const acct = useMeAccount();
  return useMemo(() => (acct ? toWorker(acct) : WORKERS.find((w) => w.id === ME_WORKER)!), [acct]);
}

/** Every worker on the platform, including anyone who signed up in this browser. */
export function useAllWorkers(): Worker[] {
  const accounts = useAccounts();
  return useMemo(() => [...WORKERS, ...accounts.map(toWorker)], [accounts]);
}

export function standing(w: Worker) {
  return w.jobs === 0 ? 'New on Shiftwire' : `${w.rating.toFixed(1)} rating · ${w.reliability}% reliable`;
}
