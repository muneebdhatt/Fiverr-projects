export type PersonId = 'elena' | 'tomas' | 'jonah' | 'amara' | 'lena' | 'hugo';
export type Person = { id: PersonId; name: string; email: string; title: string; admin?: boolean; lastActive: string; questions: number };

export type Line = { who: PersonId; text: string; ts: number };
export type Decision = { text: string; line: number };
export type Status = 'todo' | 'doing' | 'done';
export type ActionItem = { id: string; meeting: string; title: string; owner: PersonId; due: number; status: Status; line: number };

export type Closest = { meeting: string; line: number; why: string };
/** `text` carries [n] markers; `cites[n-1]` is the transcript line the marker points at. */
export type Answer = { text: string; cites: number[]; notDiscussed?: boolean; closest?: Closest[] };
export type QA = { q: string; keys: string[]; a: Answer };

export type Meeting = {
  id: string;
  title: string;
  tag: string;
  day: number; // offset from today, <= 0
  time: string;
  mins: number;
  by: PersonId; // who recorded it
  who: PersonId[];
  summary: string;
  decisions: Decision[];
  lines: Line[];
  qa: QA[];
};
