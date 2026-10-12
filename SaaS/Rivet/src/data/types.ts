export type PersonId = 'maya' | 'tom' | 'priya' | 'daniel' | 'lena' | 'sam';
export type Person = { id: PersonId; name: string; email: string; title: string; capacity: number };

export type ClientId = 'tess' | 'junip' | 'cad' | 'north' | 'alder' | 'lumen';
export type Client = {
  id: ClientId;
  name: string;
  contact: string;
  contactEmail: string;
  contactTitle: string;
  phone: string;
  city: string;
  taxRate: number;
  terms: number;
  since: number; // day offset
  internalNote: string; // never shown to the client
};

export type ProjectId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10';
export type Project = {
  id: ProjectId;
  clientId: ClientId;
  name: string;
  blurb: string;
  rate: number; // internal, hidden from team members and clients
  start: number;
  due: number;
  team: PersonId[];
  lead: PersonId;
  priorHours: number; // hours already billed on earlier invoices
  burn: number; // target share of the budget used, sets the budget
  internalNote: string;
};

export type TaskStatus = 'backlog' | 'doing' | 'review' | 'done';
export type Task = {
  id: string;
  projectId: ProjectId;
  title: string;
  status: TaskStatus;
  assignee: PersonId;
  due: number;
  est: number;
  priority: 'low' | 'medium' | 'high';
  doneDay?: number;
  internal?: boolean; // hidden from the client portal
  note?: string; // internal note, never shown to clients
};

export type Entry = {
  id: string;
  user: PersonId;
  projectId: ProjectId;
  taskId?: string;
  day: number;
  hours: number;
  note: string;
  billable: boolean;
};

export type Line = { id: string; projectId?: ProjectId; description: string; hours: number; rate: number };
export type InvoiceStatus = 'draft' | 'sent' | 'paid';
export type Invoice = {
  id: string;
  number: string;
  clientId: ClientId;
  issued: number;
  terms: number;
  status: InvoiceStatus;
  paidDay?: number;
  paidMethod?: string;
  lines: Line[];
  entryIds: string[];
  taxRate: number;
  note?: string;
  periodFrom?: number;
  periodTo?: number;
  remindedDay?: number;
  sentDay?: number;
};

export type MilestoneStatus = 'done' | 'active' | 'upcoming';
export type Milestone = { id: string; projectId: ProjectId; title: string; due: number; status: MilestoneStatus; doneDay?: number };

export type ApprovalStatus = 'pending' | 'approved' | 'changes';
export type Approval = {
  id: string;
  projectId: ProjectId;
  title: string;
  body: string;
  fileId?: string;
  requested: number;
  by: PersonId;
  status: ApprovalStatus;
  response?: string;
  respondedDay?: number;
  respondedBy?: string;
};

export type FileKind = 'pdf' | 'design' | 'doc' | 'sheet' | 'zip' | 'video';
export type ProjectFile = {
  id: string;
  projectId: ProjectId;
  name: string;
  kind: FileKind;
  size: string;
  by: PersonId | 'client';
  byName?: string;
  day: number;
  version: number;
  clientVisible: boolean;
};

export type Update = { id: string; projectId: ProjectId; day: number; title: string; body: string; by: PersonId };

export type ActivityKind = 'time' | 'task' | 'invoice' | 'payment' | 'approval' | 'file' | 'update';
export type Activity = {
  id: string;
  kind: ActivityKind;
  text: string;
  day: number;
  minutes: number; // minutes ago when day is 0
  projectId?: ProjectId;
  clientId?: ClientId;
  internal?: boolean; // hidden from clients
  money?: boolean; // revenue-related, hidden from team members
};
