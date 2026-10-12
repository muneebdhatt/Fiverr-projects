import { meeting } from './build';

export const LAUNCH = meeting({
  id: 'launch-readiness',
  title: 'Launch readiness review',
  tag: 'Launch',
  back: 0,
  time: '8:30 AM',
  mins: 42,
  by: 'elena',
  who: ['elena', 'amara', 'jonah', 'lena', 'tomas'],
  summary:
    "The team is three weeks from the Orchard 2.0 launch and went through what still stands in the way. Engineering has two blockers: the calendar import times out on accounts with more than 5,000 events, and the new billing page is not yet connected to live payment keys. Because Northfield is the largest account, a dry run on a copy of its data is now a hard gate for launch. Design is nearly finished apart from the empty states. Customer success will write the three migration email waves while operations handles segmentation and the send schedule. Launch is set for the Tuesday three weeks out, with a go or no-go call the Thursday before.",
  decisions: [
    ['The Northfield dry run is a hard gate: no dry run, no launch', 5],
    ['Launch on the Tuesday three weeks from today', 14],
    ['Hold a go or no-go call the Thursday before launch', 14],
    ['Customer success writes the migration emails; operations owns segments and the send schedule', 9],
  ],
  talk: [
    ['elena', "Okay, we're three weeks out from the Orchard 2.0 launch, so let's go through what's blocking us. Amara, start with engineering."],
    ['amara', "Two real blockers. The calendar import for existing customers still times out on accounts with more than 5,000 events, and the new billing page isn't wired to the payment provider's live keys yet."],
    ['elena', 'How long for the import fix?'],
    ['amara', "I can have a batched version ready by next Wednesday. I'd want a day on a copy of the Northfield data before we call it done, since that's our biggest account."],
    ['lena', "That's the account I'm most worried about. If their import fails on launch day we'll hear about it immediately."],
    ['elena', "Agreed. Let's make the Northfield dry run a gate. No dry run, no launch."],
    ['jonah', 'On design, the onboarding flow is done except the empty states for the shared calendar. I need two more days and a copy review from Lena.'],
    ['lena', "Send me the strings by Monday and I'll turn them around the same day."],
    ['tomas', 'Migration emails. We have 1,900 existing customers and the email goes out in three waves. Somebody needs to own the copy and the send schedule.'],
    ['elena', 'Lena, can customer success own the copy? Tomas, you handle the send schedule and the list segmentation.'],
    ['lena', "Yes, I'll draft all three waves by next Friday."],
    ['tomas', "I'll have the segments and the schedule ready before that so you can write to each group."],
    ['elena', 'Launch date. I would like to hold the Tuesday three weeks from today. Anyone against?'],
    ['amara', "Tuesday works if the dry run passes. I'd rather not launch on a Friday anyway."],
    ['elena', 'Then Tuesday it is. We also need a go or no-go call the Thursday before, with everyone in the room.'],
    ['tomas', "I'll put that on the calendar and invite the whole team."],
    ['elena', 'Great. Last thing, the status page and help center articles. Lena, are those covered?'],
    ['lena', "Eight articles to update. I have three done and I'll finish the rest by the go or no-go call."],
  ],
  qa: [
    {
      q: 'What are the launch blockers?',
      keys: ['blocker', 'blockers', 'blocking', 'risk', 'risks', 'stopping', 'problem', 'problems'],
      a: {
        text: "There are two engineering blockers and one launch gate. The calendar import still times out on accounts with more than 5,000 events [1], and Amara expects a batched fix by next Wednesday [2]. The new billing page is not wired to the payment provider's live keys yet [1]. Separately, the Northfield dry run is a hard gate: no dry run, no launch [3].",
        cites: [1, 3, 5],
      },
    },
    {
      q: 'Who owns the migration emails?',
      keys: ['migration', 'emails', 'email', 'copy', 'waves', 'send', 'schedule'],
      a: {
        text: 'Customer success owns the copy. Lena will draft all three migration email waves by next Friday [1]. Tomas owns segmentation and the send schedule for the 1,900 existing customers, and will have both ready before Lena starts writing [2]. The emails go out in three waves [3].',
        cites: [10, 11, 8],
      },
    },
    {
      q: 'What launch date did we agree on?',
      keys: ['date', 'launch', 'launching', 'when', 'day', 'tuesday', 'go-live', 'ship'],
      a: {
        text: 'Tuesday, three weeks from today [1]. Amara is fine with it as long as the Northfield dry run passes, and would rather not launch on a Friday [2]. Tomas is scheduling a go or no-go call for the Thursday before, with the whole team [3].',
        cites: [14, 13, 15],
      },
    },
    {
      q: 'Did we agree on a refund policy for annual plans?',
      keys: ['refund', 'refunds', 'refunded', 'cancel', 'cancellation', 'annual', 'policy'],
      a: {
        text: 'This was not discussed in the meeting.',
        cites: [],
        notDiscussed: true,
        closest: [
          { meeting: 'pricing-workshop', line: 11, why: 'Refunds for annual customers who cancel mid-year came up and were deferred. Tomas is writing options.' },
          { meeting: 'northfield-escalation', line: 11, why: "Northfield asked about a refund on last quarter's invoice. It was put on hold." },
        ],
      },
    },
  ],
});

export const PRICING = meeting({
  id: 'pricing-workshop',
  title: 'Pricing workshop',
  tag: 'Pricing',
  back: 1,
  time: '2:00 PM',
  mins: 55,
  by: 'elena',
  who: ['elena', 'hugo', 'lena', 'tomas', 'jonah'],
  summary:
    'The group settled the Orchard 2.0 pricing so the pricing page and the sales brief can move ahead. The free tier will be dropped for new sign-ups and replaced by a 14-day Team trial with no card required, while existing free accounts keep it for 60 days. Team is $14 per seat per month and Solo stays at $6. Annual billing takes 20 percent off, which is $11 per seat per month billed yearly. Whether annual customers can get a refund when they cancel mid-year was raised but deliberately left open for a later meeting.',
  decisions: [
    ['Drop the free tier for new sign-ups; existing free accounts keep it for 60 days', 6],
    ['Team plan is $14 per seat per month; Solo stays at $6', 9],
    ['Annual billing is 20% off: $11 per seat per month, billed yearly', 10],
    ['Refund policy for annual plans is deferred to a later meeting', 12],
  ],
  talk: [
    ['elena', 'Goal for today: land the Orchard 2.0 pricing so Jonah can design the page and Hugo can brief the sales team. Hugo, what are you hearing from prospects?'],
    ['hugo', 'Same thing in almost every call. People like the product but ask why a team of three pays the same per seat as a team of thirty. And the free tier gets us tire-kickers who never invite anyone.'],
    ['lena', 'On the support side, free-tier accounts are about 60 percent of tickets but almost none of the revenue.'],
    ['elena', "So let's talk about dropping the free tier. What would replace it?"],
    ['hugo', 'A 14-day trial of the Team plan, no card required. People get the full experience and we get a real conversion moment.'],
    ['tomas', "Finance is fine with that as long as existing free accounts get a grace period. I'd say 60 days before anything changes for them."],
    ['elena', 'Agreed. We drop the free tier for new sign-ups at launch, existing free accounts keep it for 60 days, and everyone gets a 14-day Team trial.'],
    ['jonah', 'For the page I need the actual numbers. Are we still looking at fourteen dollars per seat?'],
    ['hugo', 'Fourteen per seat per month feels right for Team. Competitors sit between twelve and eighteen.'],
    ['elena', 'Fourteen it is. Solo stays at six dollars. What about annual?'],
    ['tomas', 'Twenty percent off for annual billing keeps us above our margin target. That is eleven dollars a seat, billed yearly.'],
    ['lena', 'Should annual customers be able to cancel mid-year? That comes up a lot in support.'],
    ['elena', "Good question, but let's not settle refunds today. Tomas, can you bring a proposal to a later meeting?"],
    ['tomas', "Yes, I'll write up options with the legal view."],
    ['hugo', "I'll update the sales deck with the new tiers and a short FAQ before the launch call."],
    ['jonah', "And I'll build the pricing page with a monthly and annual toggle by the middle of next week."],
    ['elena', 'Perfect. Lena, please map every current plan to its new equivalent so the migration emails are accurate.'],
    ['lena', "Will do. I'll have a spreadsheet of old plan to new plan by Monday."],
  ],
  qa: [
    {
      q: 'What did we decide on the Team plan price?',
      keys: ['price', 'pricing', 'cost', 'seat', 'dollars', 'solo', 'annual', 'discount'],
      a: {
        text: 'Team is $14 per seat per month, and Solo stays at $6 [1]. Annual billing takes 20 percent off, which comes to $11 per seat per month billed yearly [2].',
        cites: [9, 10],
      },
    },
    {
      q: 'Why did we drop the free tier?',
      keys: ['free', 'tier', 'trial', 'drop', 'dropped', 'grace'],
      a: {
        text: 'Free accounts generate about 60 percent of support tickets but almost none of the revenue [1], and they attract sign-ups who never invite teammates [2]. The free tier is replaced by a 14-day Team trial with no card required, and existing free accounts keep it for another 60 days [3].',
        cites: [2, 1, 6],
      },
    },
  ],
});

export const NORTHFIELD = meeting({
  id: 'northfield-escalation',
  title: 'Customer escalation: Northfield',
  tag: 'Customers',
  back: 2,
  time: '11:00 AM',
  mins: 28,
  by: 'lena',
  who: ['lena', 'hugo', 'amara', 'elena'],
  summary:
    'Northfield Logistics, the largest account at about 9 percent of revenue, has been losing shared calendar events for a week and is threatening to escalate. Engineering traced it to a timeout in the sync worker when two people edit the same recurring event. The team agreed to a one-month credit worth about $2,100, to ship the fix first and then re-sync the missing events, and to give Northfield a direct line to Amara for the next month. A refund request on last quarter\'s invoice was put on hold.',
  decisions: [
    ['Offer Northfield a one-month credit, about $2,100, confirmed by phone', 5],
    ['Ship the recurring-event fix first, then re-sync missing events', 7],
    ['Give Northfield a direct line to Amara for the next month', 9],
    ['Hold the refund request on last quarter\'s invoice for now', 12],
  ],
  talk: [
    ['lena', 'Quick background: Northfield Logistics emailed earlier this week. Their shared calendar has been dropping events for about a week, and their operations director is threatening to escalate to our CEO.'],
    ['amara', 'I looked at the logs. About 140 events failed to sync last week. The cause is a timeout in the sync worker when two people edit the same recurring event.'],
    ['hugo', "They renew in six weeks and they're our largest account, about 9 percent of revenue. I don't want this turning into a renewal conversation."],
    ['elena', "What do we offer them right now? An apology on its own won't do it."],
    ['lena', 'They asked for a credit. I would suggest one month free on the Team plan, which is about $2,100 for them.'],
    ['elena', "That's reasonable. Hugo, you approve the credit since you own the relationship."],
    ['hugo', "Fine, I'll confirm it with them on a call this afternoon rather than by email."],
    ['amara', 'I can ship the recurring-event fix tomorrow and re-sync their missing events by early next week.'],
    ['lena', 'Once that is done I want to send them a plain explanation of what happened and what we changed.'],
    ['elena', "Yes, and let's give them a direct line to Amara for the next month while they're watching this closely."],
    ['amara', "Happy to. I'll set up a shared channel."],
    ['lena', "One more thing: they asked about a refund on last quarter's invoice. I told them I'd come back to them."],
    ['elena', "Hold that for now. We'll answer once the pricing and refund approach is clear."],
  ],
});

export const ONBOARDING = meeting({
  id: 'onboarding-critique',
  title: 'Design critique: onboarding flow',
  tag: 'Design',
  back: 3,
  time: '10:00 AM',
  mins: 36,
  by: 'jonah',
  who: ['jonah', 'elena', 'amara', 'lena'],
  summary:
    'Jonah walked through the new four-step onboarding: create a team, connect a calendar, invite people and pick a first template. The group worried that asking for a calendar before showing any value could lose people, so the step becomes skippable with a pre-filled example week. Template thumbnails will lazy-load behind a skeleton to hide an 800 millisecond delay, the invite step will accept a pasted list of emails shown as chips, and the progress dots get labels and a time estimate.',
  decisions: [
    ['Make the calendar step skippable and show an example week', 3],
    ['The invite step accepts a pasted list of emails, shown as chips', 8],
    ['Label the steps and add a time estimate of about two minutes', 10],
  ],
  talk: [
    ['jonah', 'This is the new onboarding. Four steps: create your team, connect a calendar, invite people, and pick a first template. I cut two screens from the old version.'],
    ['elena', "The first step feels fast. My concern is step two. Asking people to connect a calendar before they've seen any value might lose them."],
    ['lena', "In support, the number one onboarding ticket is 'I can't find where to connect my calendar'. So I like that it's visible, but maybe it can be skippable."],
    ['jonah', "I can add a 'Skip for now' link and show a pre-filled example week so the product doesn't look empty."],
    ['amara', 'From an engineering view, the template picker is the risky part. Loading templates adds about 800 milliseconds right now.'],
    ['jonah', 'I can lazy-load the thumbnails and show a skeleton so it feels instant.'],
    ['elena', 'Let us do that. On step three, inviting people, should we allow pasting a list of emails?'],
    ['lena', "Yes. Most teams invite everyone at once. Pasting a column from a spreadsheet is what they'll do."],
    ['jonah', 'Okay, I will add paste support and show each address as a chip, with invalid ones highlighted.'],
    ['elena', 'Last point: the progress indicator. Four dots is fine, but label them so people know what is left.'],
    ['jonah', "Agreed. I'll label the steps and add a short time estimate, 'about two minutes'."],
    ['amara', "Once the designs are final, I'll need a day to wire up the skip behavior and the paste parser."],
  ],
});
