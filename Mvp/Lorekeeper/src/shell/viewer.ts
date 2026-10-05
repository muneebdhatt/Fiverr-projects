'use client';
import { create } from 'zustand';
import type { DocTarget } from '@/components/DocViewer';

/** Lets any screen open the document side panel that the app frame renders. */
export const useViewer = create<{ target: DocTarget; open: (t: DocTarget) => void; close: () => void }>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
