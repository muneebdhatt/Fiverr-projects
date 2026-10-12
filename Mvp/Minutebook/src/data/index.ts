import { wd } from '@/lib/util';
import { actionsFor } from './build';
import { LAUNCH, NORTHFIELD, ONBOARDING, PRICING } from './meetings-a';
import { ALLHANDS, HIRING, LATEST, PIPELINE, ROADMAP, SECURITY, SPRINT, SUPPORT, WEEKLY } from './meetings-b';
import type { ActionItem, Meeting } from './types';

/** Newest first. The latest recording is held back until someone records or uploads. */
export const MEETINGS: Meeting[] = [LAUNCH, PRICING, NORTHFIELD, ONBOARDING, WEEKLY, PIPELINE, SPRINT, SUPPORT, ROADMAP, SECURITY, HIRING, ALLHANDS];
export { LATEST };

export const ACTIONS: ActionItem[] = [
  ...actionsFor('a', LAUNCH.id, [
    ['Ship the batched calendar import fix', 'amara', wd('wed'), 'doing', 3],
    ['Run the Northfield dry run on a copy of their data', 'amara', wd('thu'), 'todo', 5],
    ['Draft all three migration email waves', 'lena', wd('fri'), 'todo', 10],
    ['Prepare customer segments and the send schedule', 'tomas', wd('wed'), 'doing', 11],
    ['Schedule the go or no-go call for the Thursday before launch', 'tomas', wd('mon'), 'todo', 15],
  ]),
  ...actionsFor('a', PRICING.id, [
    ['Write refund policy options with the legal view', 'tomas', wd('thu'), 'todo', 13],
    ['Update the sales deck with the new tiers and an FAQ', 'hugo', wd('wed'), 'doing', 14],
    ['Build the pricing page with a monthly and annual toggle', 'jonah', wd('wed'), 'doing', 15],
    ['Map every current plan to its new equivalent', 'lena', wd('mon'), 'todo', 17],
    ['Get leadership sign-off on the final pricing', 'elena', wd('tue'), 'todo', 9],
  ]),
  ...actionsFor('a', NORTHFIELD.id, [
    ['Confirm the one-month credit with Northfield by phone', 'hugo', -2, 'done', 6],
    ['Ship the recurring-event sync fix', 'amara', -1, 'done', 7],
    ["Re-sync Northfield's missing events", 'amara', wd('mon'), 'doing', 7],
    ['Send Northfield a plain-language write-up of what happened', 'lena', wd('tue'), 'todo', 8],
  ]),
  ...actionsFor('a', ONBOARDING.id, [
    ['Add the skip link and example week to the calendar step', 'jonah', -1, 'done', 3],
    ['Lazy-load template thumbnails behind a skeleton', 'amara', wd('tue'), 'doing', 5],
    ['Label the onboarding steps and design pasted-list invites', 'jonah', wd('mon'), 'doing', 8],
    ['Build the skip behavior and the invite paste parser', 'amara', wd('thu'), 'todo', 11],
  ]),
  ...actionsFor('a', WEEKLY.id, [
    ["Forward the payment provider's webhook notice", 'tomas', -4, 'done', 8],
    ['Update the billing service for the new webhook format', 'amara', 21, 'todo', 9],
    ['Draft the one-page launch plan', 'tomas', -2, 'done', 10],
    ['Add sales launch items to the shared plan', 'hugo', -3, 'done', 11],
  ]),
  ...actionsFor('a', PIPELINE.id, [
    ['Send the revised forecast with three committed deals', 'hugo', -5, 'done', 4],
    ['Join the Harbourline onboarding call', 'lena', -3, 'done', 6],
    ['Build a standard security pack', 'tomas', -1, 'doing', 10],
    ['Review the technical answers in the security pack', 'amara', 8, 'todo', 10],
  ]),
  ...actionsFor('a', SPRINT.id, [
    ['Share notification digest designs with engineering', 'jonah', -7, 'done', 3],
    ['Find and fix the flaky build (two-day timebox)', 'amara', -6, 'done', 8],
    ['Cover design review on UI pull requests', 'jonah', -5, 'done', 11],
    ['Size the payment webhook change for next sprint', 'amara', wd('mon'), 'doing', 6],
  ]),
  ...actionsFor('a', SUPPORT.id, [
    ['Send engineering the 47 recurring-event tickets', 'lena', -10, 'done', 4],
    ['Extend invite expiry to 14 days and add a reminder', 'amara', -8, 'done', 7],
    ['Write the billing questions guide for the help center', 'lena', -2, 'doing', 8],
  ]),
  ...actionsFor('a', ROADMAP.id, [
    ['Write the Q4 roadmap document', 'elena', wd('tue'), 'doing', 8],
    ['Scope role-based permissions for shared calendars', 'amara', -9, 'done', 2],
    ['Start the mobile web view designs', 'jonah', 12, 'doing', 11],
    ['Collect the ten most common bulk import requests', 'lena', -8, 'done', 4],
  ]),
  ...actionsFor('a', SECURITY.id, [
    ['Build a nightly purge job for deleted data', 'amara', -14, 'done', 4],
    ['Update the terms and privacy page with the lawyer', 'tomas', -12, 'done', 6],
    ['Cut IP log retention to 90 days', 'amara', -13, 'done', 7],
  ]),
  ...actionsFor('a', HIRING.id, [
    ['Write the two-hour design exercise brief', 'jonah', -20, 'done', 6],
    ['Prepare the offer template', 'tomas', -19, 'done', 5],
    ['Schedule interviews with the systems-focused candidate', 'elena', wd('mon'), 'doing', 4],
  ]),
  ...actionsFor('a', ALLHANDS.id, [
    ['Write the customer growth section', 'hugo', -24, 'done', 6],
    ['Collect two customer stories with permission', 'lena', -25, 'done', 7],
  ]),
];

/** Added when the latest recording has been processed. */
export const LATEST_ACTIONS: ActionItem[] = actionsFor('b', LATEST.id, [
  ['Add dollar savings to the annual pricing toggle', 'jonah', wd('mon'), 'todo', 3],
  ['Prepare the Northfield data copy for the dry run', 'amara', wd('mon'), 'todo', 1],
  ['Add a "nothing required" line to each migration email wave', 'lena', wd('mon'), 'todo', 7],
  ['Prepare the onboarding walkthrough for the all-hands', 'jonah', 14, 'todo', 10],
]);

export { PEOPLE, person, firstName, ACCOUNTS } from './people';
export type * from './types';
