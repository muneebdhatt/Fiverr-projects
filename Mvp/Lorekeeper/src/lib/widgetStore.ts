import { create } from 'zustand';

/** Whether the floating chat panel is open. */
export const useWidget = create<{ open: boolean; setOpen: (v: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
