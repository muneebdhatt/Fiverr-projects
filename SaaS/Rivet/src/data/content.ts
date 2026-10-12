import type { Activity, Approval, FileKind, Milestone, MilestoneStatus, PersonId, ProjectFile, ProjectId, Update } from './types';

type M = [ProjectId, string, number, MilestoneStatus, number?];
const MS: M[] = [
  ['p1', 'Discovery and sitemap', -62, 'done', -62], ['p1', 'Design approved', -18, 'done', -20], ['p1', 'Build complete', 10, 'active'], ['p1', 'Launch', 24, 'upcoming'],
  ['p2', 'Logo rules signed off', -26, 'done', -28], ['p2', 'Colour and type signed off', -3, 'done', -3], ['p2', 'Final PDF delivered', 6, 'active'],
  ['p3', 'Ordering flow approved', -14, 'done', -15], ['p3', 'Checkout and pickup built', 14, 'active'], ['p3', 'Payments live', 24, 'upcoming'], ['p3', 'Launch', 31, 'upcoming'],
  ['p4', 'Concept approved', -23, 'done', -24], ['p4', 'Print files out', 5, 'active'], ['p4', 'Campaign live', 17, 'upcoming'],
  ['p5', 'Booking flow live on staging', -12, 'done', -14], ['p5', 'Patient dashboard', 8, 'active'], ['p5', 'Pilot at one site', 14, 'upcoming'], ['p5', 'All three sites live', 20, 'upcoming'],
  ['p6', 'Logo route chosen', -10, 'done', -10], ['p6', 'Signage artwork', 12, 'active'], ['p6', 'Handbook printed', 38, 'upcoming'],
  ['p7', 'Catalogue and customers migrated', -6, 'done', -6], ['p7', 'Staging walkthrough', 5, 'active'], ['p7', 'Cutover weekend', 11, 'upcoming'], ['p7', 'Post-launch review', 25, 'upcoming'],
  ['p8', 'Cover approved', 4, 'active'], ['p8', 'Photography in', 14, 'upcoming'], ['p8', 'Print and online release', 52, 'upcoming'],
  ['p9', 'Design approved', -18, 'done', -20], ['p9', 'Subscriptions working', -9, 'done', -9], ['p9', 'Beta with 40 members', 21, 'active'], ['p9', 'App store release', 45, 'upcoming'],
  ['p10', 'Content audit', -33, 'done', -34], ['p10', 'Templates approved', -10, 'done', -11], ['p10', 'All practice pages live', 24, 'active'], ['p10', 'Local search set up', 33, 'upcoming'],
];
export const MILESTONES: Milestone[] = MS.map(([projectId, title, due, status, doneDay], i) => ({ id: `m${i + 1}`, projectId, title, due, status, doneDay }));

type F = [ProjectId, string, FileKind, string, PersonId | 'client', number, number, boolean, string?];
const FL: F[] = [
  ['p1', 'Tessellate-sitemap-v2.pdf', 'pdf', '420 KB', 'tom', -40, 2, true], ['p1', 'Homepage-design-r1.fig', 'design', '8.4 MB', 'priya', -24, 3, true], ['p1', 'Case-study-template.fig', 'design', '6.1 MB', 'priya', -2, 1, true], ['p1', 'Team-bios-draft.docx', 'doc', '58 KB', 'sam', -1, 2, true], ['p1', 'CMS-options-comparison.xlsx', 'sheet', '36 KB', 'daniel', -9, 1, false],
  ['p2', 'Brand-guidelines-draft-4.pdf', 'pdf', '12.3 MB', 'priya', -4, 4, true], ['p2', 'Logo-usage-rules.pdf', 'pdf', '2.2 MB', 'priya', -31, 2, true], ['p2', 'Typography-section.pdf', 'pdf', '3.8 MB', 'priya', -4, 1, true], ['p2', 'Photography-direction.pdf', 'pdf', '9.7 MB', 'priya', -1, 1, true], ['p2', 'Logo-source-files.zip', 'zip', '21 MB', 'priya', -30, 1, true],
  ['p3', 'Menu-and-pickup-rules.docx', 'doc', '41 KB', 'tom', -28, 1, true], ['p3', 'Ordering-flow-wireframes.pdf', 'pdf', '4.9 MB', 'priya', -17, 2, true], ['p3', 'Checkout-screen-v2.fig', 'design', '5.3 MB', 'priya', -4, 2, true], ['p3', 'Provider-application-checklist.pdf', 'pdf', '120 KB', 'daniel', -6, 1, true],
  ['p4', 'Campaign-concept.pdf', 'pdf', '3.1 MB', 'priya', -25, 1, true], ['p4', 'Window-decals-cut-lines.pdf', 'pdf', '2.8 MB', 'priya', -8, 2, true], ['p4', 'Menu-card-proof.pdf', 'pdf', '1.9 MB', 'priya', -5, 3, true], ['p4', 'Email-series-copy.docx', 'doc', '33 KB', 'sam', -1, 1, true],
  ['p5', 'Booking-flow-walkthrough.mp4', 'video', '86 MB', 'daniel', -14, 1, true], ['p5', 'Reminder-rules.docx', 'doc', '29 KB', 'tom', -10, 2, true], ['p5', 'Change-order-draft.docx', 'doc', '24 KB', 'tom', -2, 1, false], ['p5', 'Site-and-practitioner-list.xlsx', 'sheet', '48 KB', 'client', -80, 1, true, 'Omar Haddad'],
  ['p6', 'Logo-routes-presentation.pdf', 'pdf', '14 MB', 'priya', -20, 1, true], ['p6', 'Logo-route-two-refined.pdf', 'pdf', '2.6 MB', 'priya', -12, 2, true], ['p6', 'Handbook-copy-v3.docx', 'doc', '77 KB', 'sam', -6, 3, true], ['p6', 'Signage-measurements.xlsx', 'sheet', '22 KB', 'client', -18, 1, true, 'Omar Haddad'],
  ['p7', 'Redirect-map-top-200.xlsx', 'sheet', '112 KB', 'lena', -3, 2, true], ['p7', 'Cutover-plan.pdf', 'pdf', '210 KB', 'tom', -1, 1, true], ['p7', 'Catalogue-export.zip', 'zip', '44 MB', 'client', -40, 1, true, 'Callum Reid'],
  ['p8', 'Catalogue-page-plan.pdf', 'pdf', '1.4 MB', 'priya', -24, 1, true], ['p8', 'Cover-concepts.pdf', 'pdf', '7.2 MB', 'priya', -2, 1, true], ['p8', 'Range-copy-draft.docx', 'doc', '51 KB', 'sam', -5, 2, true],
  ['p9', 'Member-journey-map.pdf', 'pdf', '2.3 MB', 'tom', -50, 1, true], ['p9', 'Monthly-selection-screens.fig', 'design', '11 MB', 'priya', -21, 3, true], ['p9', 'Beta-rollout-plan.docx', 'doc', '38 KB', 'tom', -4, 1, true], ['p9', 'Tasting-notes-template.xlsx', 'sheet', '31 KB', 'client', -30, 1, true, 'Nora Lindqvist'],
  ['p10', 'Content-audit.xlsx', 'sheet', '95 KB', 'sam', -34, 1, true], ['p10', 'Practice-page-templates.fig', 'design', '9.5 MB', 'lena', -12, 2, true], ['p10', 'Local-listings-report.pdf', 'pdf', '640 KB', 'sam', -2, 1, true], ['p10', 'Practice-photos.zip', 'zip', '120 MB', 'client', -14, 1, true, 'Victor Adeyemi'],
];
export const FILES: ProjectFile[] = FL.map(([projectId, name, kind, size, by, day, version, clientVisible, byName], i) => ({ id: `f${i + 1}`, projectId, name, kind, size, by, byName, day, version, clientVisible }));

type A = [ProjectId, string, string, number, PersonId, Approval['status'], { file?: string; resp?: string; at?: number; who?: string }?];
const AP: A[] = [
  ['p1', 'Homepage design, round 1', 'Layout, hero and navigation for the homepage on desktop and phone.', -24, 'priya', 'approved', { file: 'Homepage-design-r1.fig', resp: 'Love the hero. Aiko asked for the project filter to sit higher, which is fine.', at: -22, who: 'Isabel Moreau' }],
  ['p1', 'Case study template design', 'The layout every case study page will use: gallery, credits and a short story.', -2, 'priya', 'pending', { file: 'Case-study-template.fig' }],
  ['p1', 'Team page copy', 'Short bios for the eleven people on the team page.', -1, 'sam', 'pending', { file: 'Team-bios-draft.docx' }],
  ['p2', 'Logo usage rules', 'Clear space, minimum size and the things not to do with the mark.', -31, 'priya', 'approved', { file: 'Logo-usage-rules.pdf', resp: 'Approved.', at: -29, who: 'Isabel Moreau' }],
  ['p2', 'Typography section', 'Type families, sizes and how headings should be set.', -4, 'priya', 'approved', { file: 'Typography-section.pdf', resp: 'Approved. Rowan likes the heading scale.', at: -3, who: 'Isabel Moreau' }],
  ['p2', 'Photography direction', 'How project photography should look, with do and don’t examples.', -1, 'priya', 'pending', { file: 'Photography-direction.pdf' }],
  ['p3', 'Ordering flow wireframes', 'From menu to confirmation, including the pickup time step.', -17, 'priya', 'approved', { file: 'Ordering-flow-wireframes.pdf', resp: 'This is exactly what I pictured.', at: -16, who: 'Hannah Whitlock' }],
  ['p3', 'Checkout screen design', 'The payment and pickup confirmation screen.', -4, 'priya', 'pending', { file: 'Checkout-screen-v2.fig' }],
  ['p4', 'Window decal artwork', 'Two window designs at actual size, with the cut lines.', -8, 'priya', 'approved', { file: 'Window-decals-cut-lines.pdf', resp: 'Great. Print them.', at: -6, who: 'Hannah Whitlock' }],
  ['p4', 'Menu card print proof', 'Final proof of the autumn menu card, front and back.', -5, 'priya', 'pending', { file: 'Menu-card-proof.pdf' }],
  ['p5', 'Booking flow, three sites', 'Click-through of the full booking flow on staging.', -16, 'daniel', 'approved', { resp: 'Looks good. Please add the physio’s photo on the confirm step.', at: -14, who: 'Omar Haddad' }],
  ['p6', 'Logo route', 'Route two, refined, with colour and mono versions.', -12, 'priya', 'changes', { file: 'Logo-route-two-refined.pdf', resp: 'We like route two but the symbol feels too thin at small sizes. Can we make it bolder?', at: -10, who: 'Omar Haddad' }],
  ['p6', 'Patient handbook copy', 'Final handbook text, needs a clinical read before layout.', -6, 'sam', 'pending', { file: 'Handbook-copy-v3.docx' }],
  ['p7', 'Redirect map', 'Old addresses mapped to new ones for the top 200 pages.', -3, 'lena', 'pending', { file: 'Redirect-map-top-200.xlsx' }],
  ['p9', 'Monthly selection screens', 'How members see, swap and confirm their monthly wines.', -21, 'priya', 'approved', { file: 'Monthly-selection-screens.fig', resp: 'Approved. The swap flow is lovely.', at: -20, who: 'Nora Lindqvist' }],
  ['p10', 'Page templates for five practices', 'One flexible template with practice-specific content blocks.', -12, 'lena', 'approved', { file: 'Practice-page-templates.fig', resp: 'Approved.', at: -11, who: 'Victor Adeyemi' }],
];
export const APPROVALS: Approval[] = AP.map(([projectId, title, body, requested, by, status, x], i) => ({
  id: `a${i + 1}`, projectId, title, body, requested, by, status, fileId: FILES.find((f) => f.name === x?.file)?.id, response: x?.resp, respondedDay: x?.at, respondedBy: x?.who,
}));

type U = [ProjectId, number, string, string, PersonId];
const UP: U[] = [
  ['p1', -7, 'Case studies take shape', 'This week we finished the case study template and sent it for your review. Homepage build has started and the navigation is working on staging. Next week: the first three case study pages and your team page copy.', 'tom'],
  ['p2', -7, 'Typography done, photography next', 'The logo and colour sections are signed off and the typography page is in. Next up is photography direction, then we lay out the final PDF.', 'priya'],
  ['p3', -7, 'Wireframes approved, checkout in design', 'Thank you for approving the ordering flow. We are designing the checkout screen now and the specials page is built. We will need your payment provider details next week.', 'daniel'],
  ['p4', -7, 'Decals approved', 'Window decals are approved and with the printer. Menu card proof is the next thing we need from you, and the email series copy is in review.', 'priya'],
  ['p5', -7, 'Calendar sync works', 'Practitioner calendars now sync in both directions. Reminder texts are in review and the patient dashboard is under way.', 'daniel'],
  ['p6', -14, 'Route two chosen', 'Thank you for choosing route two. We are refining the symbol and starting signage artwork. Handbook copy is with you for a clinical read.', 'maya'],
  ['p7', -7, 'Customers and orders moved', 'All customers and orders are on the new store. The redirect map is ready for your review and checkout rules are in progress.', 'tom'],
  ['p8', -7, 'Catalogue kicked off', 'The page plan is agreed and the cover concepts are ready for you. We will need the final product photography to move on to layout.', 'priya'],
  ['p9', -7, 'Subscriptions and pausing done', 'Members can now subscribe, pause and skip a month. The sommelier’s tasting notes editor is built. The member beta starts in three weeks.', 'tom'],
  ['p10', -7, 'First practice page live on staging', 'The shared template is approved and the first practice page is on staging for you to look at. Four more to go over the next three weeks.', 'tom'],
];
export const UPDATES: Update[] = UP.map(([projectId, day, title, body, by], i) => ({ id: `u${i + 1}`, projectId, day, title, body, by }));

type Ac = [Activity['kind'], string, number, number, ProjectId?, { internal?: boolean; money?: boolean }?];
const AC: Ac[] = [
  ['time', 'Daniel Reyes logged 2.5 h on Pickup slot picker', 0, 38, 'p3', { internal: true }],
  ['approval', 'Hannah Whitlock viewed the checkout screen design', 0, 70, 'p3'],
  ['task', 'Lena Vogel moved Order confirmation emails to In review', 0, 95, 'p3'],
  ['file', 'Priya Nair uploaded Photography-direction.pdf', -1, 0, 'p2'],
  ['payment', 'Alder & Vine Wines paid INV-2063', -3, 0, undefined, { money: true, internal: true }],
  ['invoice', 'INV-2064 drafted for Lumen Dental Group', -1, 0, undefined, { money: true, internal: true }],
  ['task', 'Priya Nair finished Case study template design', -5, 0, 'p1'],
  ['payment', 'Juniper Row Bakery paid INV-2060', -6, 0, undefined, { money: true, internal: true }],
  ['approval', 'Isabel Moreau approved Typography section', -3, 0, 'p2'],
  ['update', 'Tom Becker posted the weekly update for Website redesign', -7, 0, 'p1'],
  ['task', 'Lena Vogel finished Tasting notes editor for the sommelier', -3, 0, 'p9'],
  ['invoice', 'INV-2056 reminder sent to Cadence Physio', -2, 0, undefined, { money: true, internal: true }],
  ['task', 'Daniel Reyes finished Customer and order migration', -6, 0, 'p7'],
  ['file', 'Tom Becker uploaded Cutover-plan.pdf', -1, 0, 'p7'],
  ['approval', 'Omar Haddad requested changes on Logo route', -10, 0, 'p6'],
];
export const ACTIVITY: Activity[] = AC.map(([kind, text, day, minutes, projectId, x], i) => ({ id: `ac${i + 1}`, kind, text, day, minutes, projectId, internal: x?.internal, money: x?.money }));
