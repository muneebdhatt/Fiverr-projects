import type { ShiftStatus } from '@/data/types';

export const STATUS_TONE: Record<ShiftStatus, 'amber' | 'green' | 'red' | 'gray' | 'teal'> = { Open: 'amber', Filled: 'green', Unfilled: 'red', Cancelled: 'gray', Scheduled: 'teal' };
export const STATUSES: ShiftStatus[] = ['Open', 'Scheduled', 'Filled', 'Unfilled', 'Cancelled'];
