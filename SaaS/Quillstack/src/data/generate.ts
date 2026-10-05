import type { Doc, PlanId, Role, User } from './types';

/** Everything the generators need to know about one organisation. */
export interface OrgRow {
  id: string; name: string; industry: string; planId: PlanId; aiCost: number; suspended: boolean;
  ownerEmail: string; region: string; team: number;
  client1: string; client2: string; project: string;
}

/** Small deterministic hash so generated data is identical on every load. */
export function hash(s: string) {
  let x = 7;
  for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x;
}

const NAME_POOL = [
  'Amara Osei', 'Callum Reid', 'Dina Petrov', 'Elliot Banks', 'Farah Nasser', 'Gideon Mbeki', 'Hana Sato', 'Ivan Kowalski',
  'Jasmine Cole', 'Kofi Mensah', 'Lucia Ferrer', 'Mateo Rivera', 'Nadia Haddad', 'Owen Pritchard', 'Paloma Reyes', 'Quinn Delaney',
  'Rosa Lindgren', 'Samir Qureshi', 'Tessa Moreau', 'Umar Siddiqui', 'Vera Novak', 'Wesley Aoki', 'Ximena Duarte', 'Yusuf Demir',
];

function nameFromEmail(email: string) {
  return email.split('@')[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
const emailFromName = (n: string) => `${n.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, '.')}@example.com`;

export function usersFor(o: OrgRow): User[] {
  const owner: User = { id: `${o.id}-u0`, name: nameFromEmail(o.ownerEmail), email: o.ownerEmail, role: 'Owner', lastActiveMins: 6 + (hash(o.id) % 40) };
  const users: User[] = [owner];
  const used = new Set([owner.name]);
  let step = 0;
  while (users.length < o.team) {
    const name = NAME_POOL[(hash(o.id) + step * 5) % NAME_POOL.length];
    step++;
    if (used.has(name)) continue;
    used.add(name);
    const i = users.length;
    const role: Role = i === 1 ? 'Admin' : i === o.team - 1 && o.team >= 6 ? 'Viewer' : 'Member';
    users.push({ id: `${o.id}-u${i}`, name, email: emailFromName(name), role, lastActiveMins: [14, 55, 130, 420, 1700, 3100, 5200][(hash(o.id) + i) % 7] });
  }
  return users;
}

const money = (n: number) => n.toLocaleString('en-US');

export function docsFor(o: OrgRow, users: User[]): Doc[] {
  const h = hash(o.id);
  const weeks = 4 + (h % 5);
  const fee = money(12000 + (h % 20) * 1500);
  const days = h % 2 ? 14 : 30;
  const proj = o.project.toLowerCase();
  const first = (i: number) => users[i % users.length].name.split(' ')[0];
  const projects = 6 + (h % 9);
  const newClients = 2 + (h % 4);
  const util = 70 + (h % 20);
  const early = 1 + (h % 3);

  type T = { title: string; kind: string; body: string[]; summary: string; actions: string[]; rewrite: string; es: string };
  const t: T[] = [
    {
      title: `${o.project} proposal: ${o.client1}`, kind: 'Proposal',
      body: [`${o.name} proposes a ${weeks}-week ${proj} engagement for ${o.client1}. The work starts with a short review of current practice, followed by delivery in two phases with a checkpoint at the end of each.`,
        `The fee is $${fee}, billed in three instalments. Two rounds of revisions are included, and any change in scope is agreed in writing before work begins.`],
      summary: `${o.name} proposes a ${weeks}-week ${proj} engagement for ${o.client1}, delivered in two phases with checkpoints. The fee is $${fee} in three instalments, with two revision rounds included.`,
      actions: [`Send the proposal to ${o.client1} by Friday`, 'Book the review session for week 1', 'Confirm the two revision rounds in the agreement'],
      rewrite: `We will deliver the ${proj} for ${o.client1} in ${weeks} weeks for $${fee}, in two phases with a checkpoint after each.`,
      es: `${o.name} propone un proyecto de ${weeks} semanas para ${o.client1}, en dos fases con puntos de control. La tarifa es de $${fee} en tres pagos, con dos rondas de revisión incluidas.`,
    },
    {
      title: 'Weekly team notes', kind: 'Notes',
      body: [`The team reviewed open work for ${o.client1} and ${o.client2}. ${first(1)} is waiting on one approval before the next stage, and the ${proj} review moved to Thursday.`,
        `Decisions: close the open items by Wednesday, and confirm the schedule with ${o.client2} once the approval arrives. The next meeting is Monday at 9:30.`],
      summary: `Open work for ${o.client1} and ${o.client2} was reviewed. ${first(1)} is waiting on one approval, the ${proj} review moved to Thursday, and open items close by Wednesday.`,
      actions: ['Close the open items by Wednesday', `Confirm the schedule with ${o.client2} after approval`, 'Move the review to Thursday in the calendar'],
      rewrite: `One approval is holding up ${o.client1}. Close open items by Wednesday and confirm timing with ${o.client2} afterwards.`,
      es: `El equipo revisó el trabajo abierto de ${o.client1} y ${o.client2}. Falta una aprobación, la revisión se movió al jueves y los puntos abiertos se cierran el miércoles.`,
    },
    {
      title: 'Working practices guide', kind: 'Policy',
      body: ['All client work follows the same path: brief, plan, delivery and review. Every project has a named owner, and the owner confirms scope and timing with the client in writing before work starts.',
        'Files are kept in the shared workspace, never on personal devices. Any concern about quality or conduct is raised with a manager within one working day.'],
      summary: 'Every client project follows brief, plan, delivery and review, with a named owner confirming scope and timing in writing. Files stay in the shared workspace and concerns go to a manager within one working day.',
      actions: ['Share the guide with new starters', 'Check every active project has a named owner', 'Review the guide at the next team meeting'],
      rewrite: 'Brief, plan, deliver, review. Every project has an owner, files stay in the shared workspace, and concerns reach a manager within a day.',
      es: 'Todo el trabajo con clientes sigue el mismo camino: brief, plan, entrega y revisión. Cada proyecto tiene un responsable y los archivos se guardan en el espacio compartido.',
    },
    {
      title: `Service agreement: ${o.client2}`, kind: 'Contract',
      body: [`This agreement covers ${proj} services provided by ${o.name} to ${o.client2}. Fees are invoiced monthly at the rates in the attached schedule, and payment is due within ${days} days.`,
        'Either party may end the agreement with thirty days written notice. Liability is limited to twelve months of fees, and both sides keep each other\'s information confidential.'],
      summary: `A service agreement for ${proj} work between ${o.name} and ${o.client2}, invoiced monthly with payment due in ${days} days. Either side can end it with thirty days notice and liability is capped at twelve months of fees.`,
      actions: [`Get ${o.client2}'s signature on the schedule`, 'Diarise the thirty-day notice period', 'Confirm the liability cap with the owner'],
      rewrite: `${o.name} will provide ${proj} services to ${o.client2}, billed monthly and payable in ${days} days. Thirty days notice ends the agreement.`,
      es: `Un contrato de servicios de ${proj} entre ${o.name} y ${o.client2}, facturado mensualmente con pago a ${days} días. Cualquiera de las partes puede terminarlo con treinta días de aviso.`,
    },
    {
      title: `Project brief: ${o.project}`, kind: 'Brief',
      body: [`The goal is a clear, well-organised ${proj} for ${o.client1} that the team can deliver on time. The tone should be professional but friendly, with plain language throughout.`,
        `Deliverables are a written plan, two working drafts and a final handover. Review checkpoints fall every second Wednesday until delivery in ${weeks} weeks.`],
      summary: `A brief for a clear, plain-language ${proj} for ${o.client1}. Deliverables are a plan, two drafts and a handover, with reviews every second Wednesday and delivery in ${weeks} weeks.`,
      actions: ['Lock the plan and scope', 'Schedule review checkpoints on alternate Wednesdays', `Brief ${first(2)} on the first draft`],
      rewrite: `Deliver a clear ${proj} for ${o.client1} in ${weeks} weeks: a plan, two drafts and a handover, reviewed every second Wednesday.`,
      es: `El objetivo es un ${proj} claro y bien organizado para ${o.client1}. Se entregarán un plan, dos borradores y una entrega final en ${weeks} semanas.`,
    },
    {
      title: 'Onboarding checklist for new starters', kind: 'Checklist',
      body: ['Every new starter gets the same first ten days. Day one covers accounts, the shared workspace and an introduction to the team. By day three they shadow a live project.',
        'By day ten the starter presents a short summary of what they learned to their manager, and any missing access is escalated to the office lead.'],
      summary: 'New starters follow a ten-day path: accounts and introductions on day one, shadowing a live project by day three, and a short presentation to their manager by day ten. Missing access goes to the office lead.',
      actions: ['Set up accounts before day one', 'Pair each starter with a project to shadow', 'Escalate missing access to the office lead'],
      rewrite: 'Ten days to get started: set up on day one, shadow a project by day three, present what you learned on day ten.',
      es: 'Los nuevos empleados siguen un camino de diez días: cuentas y presentaciones el primer día, acompañar un proyecto antes del día tres y una breve presentación el día diez.',
    },
    {
      title: 'Quarterly summary, Q3', kind: 'Report',
      body: [`This quarter ${o.name} completed ${projects} projects and added ${newClients} new clients, including ${o.client2}. Utilisation averaged ${util} percent.`,
        'The main risks are late approvals and a growing review backlog. We recommend adding one coordinator and moving approvals to a fixed weekly slot.'],
      summary: `${o.name} completed ${projects} projects and won ${newClients} new clients this quarter, with utilisation at ${util} percent. Late approvals and a review backlog are the main risks; a coordinator and a fixed weekly approval slot are recommended.`,
      actions: ['Open the coordinator vacancy', 'Set a fixed weekly approvals slot', 'Clear the review backlog by month end'],
      rewrite: `${projects} projects done, ${newClients} new clients, ${util} percent utilisation. Fix late approvals with a coordinator and a weekly slot.`,
      es: `Este trimestre ${o.name} completó ${projects} proyectos y sumó ${newClients} clientes nuevos, con una utilización del ${util} por ciento. Se recomienda un coordinador y un horario fijo de aprobaciones.`,
    },
    {
      title: `Retrospective: ${o.client2} ${proj}`, kind: 'Retrospective',
      body: [`The ${o.client2} work finished ${early} days early, but approvals cost us almost a week. The scope changed after sign-off, which meant redoing part of the work.`,
        'What worked: weekly reviews and one shared feedback document. What to change: lock scope before work begins and add a sign-off step for any later change.'],
      summary: `The ${o.client2} work finished ${early} days early despite a week lost to approvals and a late scope change. Weekly reviews and one feedback document worked; scope should be locked before work begins.`,
      actions: ['Add a sign-off step for scope changes', 'Keep the weekly review format', 'Share the retrospective with the team'],
      rewrite: `We finished ${early} days early but lost a week to a late scope change. Lock scope first and keep the weekly reviews.`,
      es: `El trabajo de ${o.client2} terminó ${early} días antes, aunque se perdió casi una semana por aprobaciones y un cambio de alcance tardío. Conviene fijar el alcance antes de empezar.`,
    },
  ];

  return t.map((d, i) => {
    const words = d.body.join(' ').split(/\s+/).length * (3 + ((h + i) % 4));
    return {
      id: `${o.id}-d${i + 1}`, orgId: o.id, title: d.title, kind: d.kind, authorId: users[(i * 2 + 1) % users.length].id,
      updatedMins: [40, 190, 520, 1500, 2900, 4800, 7600, 11000][(i + h) % 8] + (h % 30), createdMins: 3000 + i * 7000 + (h % 90),
      words, body: d.body, summary: d.summary, actions: d.actions, rewrite: d.rewrite, es: d.es,
    };
  });
}
