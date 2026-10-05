'use client';
import type { Role } from '@/data/types';
import { Modal } from './ui';

const KEYS: { keys: string[]; label: string; roles?: Role[] }[] = [
  { keys: ['J', 'K'], label: 'Next or previous patient' },
  { keys: ['/'], label: 'Search the queue' },
  { keys: ['S'], label: 'Start review, then mark as seen', roles: ['clinician'] },
  { keys: ['C'], label: 'Call the selected patient to the desk', roles: ['receptionist'] },
  { keys: ['N'], label: 'Write a note', roles: ['clinician'] },
  { keys: ['Esc'], label: 'Close the patient record' },
  { keys: ['?'], label: 'Show this list' },
];

export function ShortcutsModal({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <ul className="divide-y divide-bone-200">
        {KEYS.filter((k) => !k.roles || k.roles.includes(role)).map((k) => (
          <li key={k.label} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-bark-700">{k.label}</span>
            <span className="flex gap-1.5">{k.keys.map((x) => <kbd key={x} className="min-w-[28px] rounded-lg border border-bone-300 bg-bone-200 px-2 py-1 text-center text-xs font-bold text-bark-700">{x}</kbd>)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
