import { meeting } from './build';

export const WEEKLY = meeting({
  id: 'weekly-product-sync',
  title: 'Weekly product sync',
  tag: 'Planning',
  back: 4,
  time: '9:30 AM',
  mins: 32,
  by: 'elena',
  who: ['elena', 'tomas', 'jonah', 'amara', 'lena', 'hugo'],
  summary:
    'A short round of wins and risks. Two new team trials came out of last week\'s webinar, support volume is down 12 percent, and the notification settings page shipped. The new risk is that the payment provider is changing its webhook format next month, which affects renewals, so the billing service needs a small change. Tomas will draft a one-page launch plan and everyone adds their launch items to the shared doc.',
  decisions: [
    ['Track the payment webhook change as engineering work for Amara', 9],
    ['Everyone adds launch items to the shared plan before the one-pager is drafted', 11],
  ],
  talk: [
    ['elena', "Let's keep this tight. Wins first, then risks. Anyone?"],
    ['hugo', 'Two new team trials started from the webinar last week, and one of them is already inviting colleagues.'],
    ['lena', 'Support volume is down 12 percent week over week. The new help article on recurring events is getting a lot of views.'],
    ['amara', 'We shipped the notification settings page. Next up is the import work for the launch.'],
    ['jonah', "Pricing page and onboarding are both in progress. I'm blocked on final numbers for the pricing page."],
    ['elena', 'The pricing workshop is later this week, so that unblocks you.'],
    ['tomas', 'Risk: our payment provider is changing their webhook format next month. It affects renewals.'],
    ['amara', "I didn't know that. Can you forward the notice? We'll need a small change in the billing service."],
    ['tomas', "Sending it over now. They've given us until the end of next month."],
    ['elena', "Let's capture that as work for Amara. Also, I want a one-page launch plan from someone."],
    ['tomas', "I can draft it, but I'd need input from everyone first."],
    ['elena', 'Good. Everyone, add your launch items to the shared doc.'],
  ],
});

export const PIPELINE = meeting({
  id: 'pipeline-review',
  title: 'Sales pipeline review',
  tag: 'Sales',
  back: 5,
  time: '1:30 PM',
  mins: 33,
  by: 'hugo',
  who: ['hugo', 'elena', 'lena', 'tomas'],
  summary:
    'The qualified pipeline stands at about $186,000 across 22 deals, with eight at proposal stage. Five deals worth roughly $64,000 could close this quarter, but only three have signed order forms, so the forecast will treat those three as committed and the other two as upside. Deals mostly stall on procurement and security questionnaires, costing about a week each time, so Tomas will build a standard security pack. Customer success will join the Harbourline onboarding call.',
  decisions: [
    ['Forecast only the three deals with signed order forms as committed', 4],
    ['Build a standard security pack to answer questionnaires up front', 10],
  ],
  talk: [
    ['hugo', 'Pipeline stands at about $186,000 in qualified opportunities, across 22 deals. Eight are in the proposal stage.'],
    ['elena', 'Which ones are likely to close this quarter?'],
    ['hugo', 'Five, worth roughly $64,000. Two of them depend on seeing the new calendar sharing, which ships with 2.0.'],
    ['tomas', "From the forecast side, I'd count only three of those as committed. The other two have no signed order form."],
    ['hugo', "Fair. I'll treat three as committed and two as upside until the paperwork is in."],
    ['lena', 'Harbourline asked for an onboarding call before they sign. Can customer success join the call?'],
    ['hugo', 'Yes please. It would help to have you walk them through the migration plan.'],
    ['elena', "What's the biggest reason deals stall?"],
    ['hugo', 'Procurement and security questionnaires. We lose about a week each time.'],
    ['tomas', 'We could prepare a standard security pack and answer most questions up front.'],
    ['elena', "Let's do that. Tomas, can you own it with Amara's help?"],
    ['tomas', "Yes, I'll start with the questionnaire we answered for Northfield."],
  ],
});

export const SPRINT = meeting({
  id: 'sprint-planning',
  title: 'Engineering planning: sprint 24',
  tag: 'Engineering',
  back: 7,
  time: '10:30 AM',
  mins: 47,
  by: 'amara',
  who: ['amara', 'elena', 'jonah', 'tomas'],
  summary:
    'Sprint 24 is planned to 36 points, slightly under capacity after last sprint finished 34 of 36. Launch critical-path work comes first: calendar import at 13 points, the billing page at 8 and notification digests at 5, with digests last so design has time to deliver. A three-point reserve covers the payment webhook change, and the team will spend a two-day timebox on the flaky build. Jonah covers design review on UI pull requests while Amara is out for two days.',
  decisions: [
    ['Plan the sprint to 36 points', 0],
    ['Launch critical-path work goes first, digests last', 4],
    ['Timebox two days to fix the flaky build', 8],
  ],
  talk: [
    ['amara', 'Sprint 24 has capacity for about 38 points. Last sprint we finished 34 of 36, so I am proposing we plan to 36.'],
    ['elena', "Top priority is anything on the launch critical path. What's on that list?"],
    ['amara', 'Calendar import is the biggest one at 13 points. Then the billing page, 8 points, and notification digests at 5.'],
    ['jonah', 'Digests need a design pass first. I can have it to you by midweek.'],
    ['amara', "Then I'll put digests last in the sprint so we don't wait on design."],
    ['tomas', 'Should we leave room for the webhook change from the payment provider?'],
    ['amara', "That's not due for a while. I'll reserve 3 points for it and decide next sprint."],
    ['elena', "Also, can we pay down the flaky build? Everyone's losing time to it."],
    ['amara', 'Agreed. I will timebox two days to find the cause and fix what we can.'],
    ['elena', 'Good. Anything else?'],
    ['amara', 'One risk: I am out for two days next week, so the review queue could slow down.'],
    ['elena', 'Jonah, can you cover design reviews on pull requests that touch the UI?'],
    ['jonah', 'Sure.'],
  ],
});

export const SUPPORT = meeting({
  id: 'support-retro',
  title: 'Support trends retro',
  tag: 'Customers',
  back: 8,
  time: '3:00 PM',
  mins: 30,
  by: 'lena',
  who: ['lena', 'elena', 'amara'],
  summary:
    'Support handled 412 tickets last month, up from 361, almost all of the growth coming from free accounts. Calendar sync is the top category at 31 percent, followed by teammate invites at 18 percent and billing questions at 12 percent. Lena tagged 47 tickets that match one recurring-event bug. Invites expire after seven days without people realizing, so the expiry moves to fourteen days with a reminder, and Lena will write a billing guide for the help center.',
  decisions: [
    ['Extend invite expiry to 14 days and add a reminder email', 7],
    ['Write a billing questions guide for the help center', 8],
  ],
  talk: [
    ['lena', 'Let me share the numbers. We handled 412 tickets last month, up from 361. Almost all of the growth is from free accounts.'],
    ['elena', 'What are the top three categories?'],
    ['lena', 'Calendar sync, 31 percent. Inviting teammates, 18 percent. Billing questions, 12 percent.'],
    ['amara', 'The sync tickets worry me most. A lot of them look like the same recurring event bug.'],
    ['lena', "Yes, I've tagged 47 that match. I'll send you the list."],
    ['elena', 'And for invites?'],
    ['lena', "People don't realize invites expire after seven days. We could make that clearer in the email."],
    ['amara', 'Easy change. I can extend the expiry to fourteen days and add a reminder.'],
    ['elena', "Let's do both. Lena, can you also write a short guide on billing questions for the help center?"],
    ['lena', "Yes, I'll write it this week."],
  ],
});

export const ROADMAP = meeting({
  id: 'roadmap-q4',
  title: 'Q4 roadmap prioritization',
  tag: 'Planning',
  back: 10,
  time: '1:00 PM',
  mins: 62,
  by: 'elena',
  who: ['elena', 'hugo', 'jonah', 'amara', 'lena', 'tomas'],
  summary:
    'With more ideas than capacity, the team ranked Q4 work by customer impact and effort. Shared calendars with role-based permissions is the one item that moves revenue this quarter and is roughly six weeks of engineering. The bulk import tool follows, and a mobile-friendly web view is a stretch goal that may slip to January. Chat integrations are valued by customers but not a reason to choose Orchard, so they move beyond Q4.',
  decisions: [
    ['Q4 commits to shared calendars with permissions, then the bulk import tool', 10],
    ['Mobile web view is a stretch goal and may slip to January', 10],
    ['Chat integrations move beyond Q4', 6],
  ],
  talk: [
    ['elena', 'We have more ideas than capacity. Let me put the list up and we will rank by impact for customers and effort.'],
    ['hugo', 'Top of my list is shared calendars with permissions. Prospects ask about it in almost every call.'],
    ['amara', "That's roughly six weeks of engineering if we include role-based permissions."],
    ['jonah', 'Second, a mobile-friendly web view. Support keeps getting complaints from people checking on their phones.'],
    ['lena', "I'd add a bulk import tool. It's the thing customers ask for most when they switch from a competitor."],
    ['elena', 'What about integrations with chat tools?'],
    ['hugo', "Customers like them but nobody is choosing us because of them. I'd put it after Q4."],
    ['tomas', 'From a cost view, shared calendars is the only one that moves revenue this quarter.'],
    ['elena', 'Then Q4 is shared calendars with permissions, the bulk import tool, and the mobile web view in that order.'],
    ['amara', 'Together that is more than we have capacity for. The mobile web view might slip to January.'],
    ['elena', "Let's accept that. We'll commit to the first two and treat mobile as a stretch goal."],
    ['jonah', "I'll start on mobile designs anyway so the work is ready when engineering has room."],
  ],
});

export const SECURITY = meeting({
  id: 'security-retention',
  title: 'Security review: data retention',
  tag: 'Engineering',
  back: 12,
  time: '11:30 AM',
  mins: 38,
  by: 'tomas',
  who: ['tomas', 'amara', 'elena'],
  summary:
    'A large customer asked how long deleted calendar data is kept, and the honest answer was indefinitely because soft-deleted events were never purged. The team set a 30-day retention window for deleted data, backed by a nightly purge job that runs after a backup, and will write it into the terms and privacy page. Logs that store IP addresses for a year will be cut to ninety days.',
  decisions: [
    ['Purge deleted calendar data after 30 days', 5],
    ['Cut IP address log retention from one year to 90 days', 8],
  ],
  talk: [
    ['tomas', "A large customer asked how long we keep deleted calendar data. Right now the honest answer is 'indefinitely'."],
    ['amara', 'Technically soft-deleted events stay in the database until someone runs a clean-up, and nobody has.'],
    ['elena', 'What should the policy be?'],
    ['tomas', 'Thirty days is common. Long enough to recover from a mistake, short enough to satisfy most security questionnaires.'],
    ['amara', "I can build a nightly purge job. I'd want to back up before the first run."],
    ['elena', "Agreed on thirty days. Let's write it into our terms too."],
    ['tomas', "I'll check the wording with our lawyer and update the privacy page."],
    ['amara', 'Also, our logs keep IP addresses for a year. We should cut that to ninety days.'],
    ['elena', 'Yes. Add it to the same ticket.'],
  ],
});

export const HIRING = meeting({
  id: 'hiring-design',
  title: 'Hiring sync: product designer',
  tag: 'People',
  back: 15,
  time: '4:00 PM',
  mins: 25,
  by: 'elena',
  who: ['elena', 'jonah', 'tomas'],
  summary:
    'Four candidates are in play for the second designer role. Two stand out, one for design systems and one for motion and prototyping. Because Jonah is spending too much time keeping components consistent, the team will interview the systems candidate first and keep the other on hold. A short take-home exercise of up to two hours will be optional and paid, and Tomas will prepare the offer template.',
  decisions: [
    ['Interview the systems-focused candidate first; keep the motion candidate on hold', 4],
    ['The take-home exercise is optional, paid and capped at two hours', 7],
  ],
  talk: [
    ['elena', "We have four candidates for the second designer role. Jonah, you've seen the portfolios."],
    ['jonah', 'Two stand out. One has strong systems work, the other is great at motion and prototyping.'],
    ['tomas', 'What do we need most right now?'],
    ['jonah', "Systems. As the product grows, I'm spending too much time keeping components consistent."],
    ['elena', "Then let's interview the systems candidate first, and keep the other on hold."],
    ['tomas', "Budget-wise we're fine up to the agreed band. I'll prepare the offer template."],
    ['jonah', "I'd like a short take-home exercise, no more than two hours."],
    ['elena', "Okay, but let's keep it optional and paid."],
  ],
});

export const ALLHANDS = meeting({
  id: 'allhands-prep',
  title: 'Quarterly all-hands prep',
  tag: 'Planning',
  back: 18,
  time: '9:00 AM',
  mins: 40,
  by: 'tomas',
  who: ['tomas', 'elena', 'hugo', 'lena', 'jonah'],
  summary:
    'The team agreed the all-hands story: what shipped, what was learned and what comes next. It opens with the customer count crossing 1,900 teams, includes two customer stories from support, and keeps the finance update brief with revenue up 18 percent and burn on plan. Jonah will show a three-minute walkthrough of the new onboarding instead of slides, and the whole session is capped at 45 minutes with 15 for questions.',
  decisions: [
    ['Cap the all-hands at 45 minutes, including 15 for questions', 5],
    ['Include a three-minute walkthrough of the new onboarding', 4],
  ],
  talk: [
    ['elena', "All-hands is in two weeks. Let's agree on the story: what we shipped, what we learned, what's next."],
    ['hugo', 'Customer count crossed 1,900 teams this quarter. That should be the opening number.'],
    ['lena', 'I would like to share two customer stories. People on the team rarely hear the good feedback directly.'],
    ['tomas', 'Finance update should be brief. Revenue is up 18 percent and burn is on plan.'],
    ['jonah', 'Can we show a short walkthrough of the new onboarding? It will land better than slides.'],
    ['elena', "Yes, three minutes maximum. Let's cap the whole thing at 45 minutes with 15 for questions."],
    ['hugo', "I'll write the customer growth section."],
    ['lena', "I'll collect the two stories and ask the customers for permission."],
    ['tomas', "I'll send the slide template tomorrow."],
  ],
});

/** The recording that the "New recording" flow produces. Hidden until someone records or uploads. */
export const LATEST = meeting({
  id: 'latest-recording',
  title: 'Weekly product sync',
  tag: 'Planning',
  back: 0,
  time: 'Just now',
  mins: 28,
  by: 'elena',
  who: ['elena', 'amara', 'jonah', 'hugo', 'lena', 'tomas'],
  summary:
    'A short status round before launch. The batched calendar import passes on the largest internal calendar, and the Northfield copy is being prepared for the dry run. The pricing page toggle is in, and the team agreed to show annual savings in dollars rather than as a percentage. Customer success will open each migration email wave with a one-line summary saying nothing is required from the customer, the go or no-go invite has gone out to all six, and Jonah will walk the company through the new onboarding at the all-hands.',
  decisions: [
    ['Show annual savings in dollars on the pricing page', 4],
    ['Open each migration email wave with a one-line "nothing required" summary', 6],
    ['Jonah presents the new onboarding at the all-hands', 10],
  ],
  talk: [
    ['elena', 'Quick status round. Amara, where is the calendar import?'],
    ['amara', "The batched version passes on our largest internal calendar. I'm preparing the Northfield copy for the dry run."],
    ['elena', 'Good. Jonah, pricing page?'],
    ['jonah', "The monthly and annual toggle is in. Hugo's feedback was that the annual saving should show in dollars, not only as a percentage, so I'm adding that."],
    ['hugo', "Right, prospects respond better to 'save $36 per seat a year' than to twenty percent."],
    ['lena', 'Quick flag from customer success: three existing customers asked whether the migration email means they have to do anything.'],
    ['elena', 'Good catch. The email should say clearly that nothing is required.'],
    ['lena', "I'll add a one-line summary at the top of each wave."],
    ['tomas', 'The go or no-go invite is out. All six of you are on it.'],
    ['elena', "Great. Last item: who walks the company through the new onboarding at the all-hands?"],
    ['jonah', "I can do that. It's my flow, and three minutes is plenty."],
  ],
});
