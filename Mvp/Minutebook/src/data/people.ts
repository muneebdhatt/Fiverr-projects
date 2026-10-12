import type { Person, PersonId } from './types';

export const PEOPLE: Person[] = [
  { id: 'elena', name: 'Elena Marsh', email: 'elena.marsh@example.com', title: 'Head of Product', lastActive: 'Active now', questions: 38 },
  { id: 'tomas', name: 'Tomas Reyes', email: 'tomas.reyes@example.com', title: 'Operations Lead', admin: true, lastActive: '12 minutes ago', questions: 21 },
  { id: 'jonah', name: 'Jonah Pike', email: 'jonah.pike@example.com', title: 'Product Designer', lastActive: '1 hour ago', questions: 17 },
  { id: 'amara', name: 'Amara Osei', email: 'amara.osei@example.com', title: 'Engineering Lead', lastActive: '3 hours ago', questions: 29 },
  { id: 'lena', name: 'Lena Fischer', email: 'lena.fischer@example.com', title: 'Customer Success', lastActive: 'Yesterday', questions: 24 },
  { id: 'hugo', name: 'Hugo Laurent', email: 'hugo.laurent@example.com', title: 'Sales Lead', lastActive: '2 days ago', questions: 12 },
];

export const person = (id: PersonId) => PEOPLE.find((p) => p.id === id)!;
export const firstName = (id: PersonId) => person(id).name.split(' ')[0];

export const ACCOUNTS = {
  member: { id: 'elena' as PersonId, label: 'Member' },
  admin: { id: 'tomas' as PersonId, label: 'Admin' },
} as const;
