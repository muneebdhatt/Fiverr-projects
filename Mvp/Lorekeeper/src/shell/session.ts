'use client';
import { create } from 'zustand';
import type { Me } from '@/lib/api';

export const useSession = create<{ me: Me | null; setMe: (m: Me) => void }>((set) => ({ me: null, setMe: (me) => set({ me }) }));
