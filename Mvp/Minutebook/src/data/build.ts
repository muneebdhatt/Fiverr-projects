import { workdaysAgo } from '@/lib/util';
import type { ActionItem, Meeting, PersonId, QA, Status } from './types';

type Raw = {
  id: string;
  title: string;
  tag: string;
  back: number; // working days ago
  time: string;
  mins: number;
  by: PersonId;
  who: PersonId[];
  summary: string;
  decisions: [string, number][];
  talk: [PersonId, string][];
  qa?: QA[];
};

/** Spreads the lines across the recording with small fixed offsets, so timestamps never change between loads. */
export function meeting(r: Raw): Meeting {
  const total = r.mins * 60;
  const n = r.talk.length;
  const lines = r.talk.map(([who, text], i) => ({ who, text, ts: i === 0 ? 8 : Math.round((i * total) / n + ((i * 53) % 37)) }));
  return {
    id: r.id,
    title: r.title,
    tag: r.tag,
    day: workdaysAgo(r.back),
    time: r.time,
    mins: r.mins,
    by: r.by,
    who: r.who,
    summary: r.summary,
    decisions: r.decisions.map(([text, line]) => ({ text, line })),
    lines,
    qa: r.qa ?? [],
  };
}

let seq = 0;
export function actionsFor(prefix: string, meetingId: string, rows: [string, PersonId, number, Status, number][]): ActionItem[] {
  return rows.map(([title, owner, due, status, line]) => ({ id: `${prefix}${++seq}`, meeting: meetingId, title, owner, due, status, line }));
}
