'use client';
import { useState } from 'react';
import type { Role, Worker } from '@/data/types';

/** Worker accounts created through sign-up. Kept in this browser only. */
export interface WorkerAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  skills: Role[];
  licence: string;
  days: string[];
  fileName: string;
}

const KEY = 'shiftwire-worker-accounts';

export function loadAccounts(): WorkerAccount[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkerAccount[]) : [];
  } catch {
    return [];
  }
}

export function addAccount(a: WorkerAccount) {
  const rest = loadAccounts().filter((x) => x.email !== a.email);
  try { localStorage.setItem(KEY, JSON.stringify([...rest, a])); } catch { /* storage may be blocked */ }
}

export function findAccount(email: string, password: string) {
  return loadAccounts().find((a) => a.email === email.trim().toLowerCase() && a.password === password);
}

export function emailTaken(email: string) {
  return loadAccounts().some((a) => a.email === email.trim().toLowerCase());
}

export function toWorker(a: WorkerAccount): Worker {
  return {
    id: a.id,
    name: a.name,
    phone: a.phone,
    primary: a.skills[0],
    skills: a.skills,
    rating: 0,
    reliability: 0,
    distance: 2.1,
    jobs: 0,
    licence: a.licence,
    days: a.days,
    joinedDays: 0,
    unsubscribed: false,
    about: 'Just joined Shiftwire. Certificate is being checked.',
  };
}

export function useAccounts() {
  // Only used by screens that render after the session is ready on the client, so reading storage up front is safe.
  const [list] = useState<WorkerAccount[]>(() => (typeof window === 'undefined' ? [] : loadAccounts()));
  return list;
}

export const isNew = (w: Worker) => w.jobs === 0;
