import type { TaskStatus } from '@/data/types';

export const STATUS_LABEL: Record<TaskStatus, string> = { backlog: 'To do', doing: 'In progress', review: 'In review', done: 'Done' };
export const STATUS_ORDER: TaskStatus[] = ['backlog', 'doing', 'review', 'done'];
export const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' } as const;
