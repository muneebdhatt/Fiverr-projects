# Minutebook

AI meeting notes for small teams (Fiverr gig 3, MVP, product G3-9). A recording becomes a summary, the decisions and an action list with owners and due dates, which the team then tracks. Ask any meeting a question and get an answer with citations, or an honest "This was not discussed in the meeting."

Front end only. No backend, no database, no API keys. All data is in the app and session state lives in the browser, so every sign-in starts from the same workspace.

## Run it

```bash
npm install
npm run dev        # http://localhost:3700
# or a production build
npm run build && npm run start
```

Static export: `npm run build` writes the site to `out/`, which can be hosted anywhere static.

Stack: Next.js 16 (static export), React 19, Tailwind 3, zustand (persisted to localStorage), recharts, lucide-react.

## Logins

Both accounts use the password `Welcome2026!` (already filled in on the sign-in page). Switch between them from the avatar menu, "Switch account". Switching keeps the workspace as it is, so a recording made by the member shows up in the admin's usage. A fresh sign-in resets everything.

| Role | Email | Sees |
| --- | --- | --- |
| Member (default) | elena.marsh@example.com | Home, Meetings, Actions |
| Admin | tomas.reyes@example.com | the same plus the Admin page |

## Main click path

1. Sign in, open **Launch readiness review**. The summary writes itself (thinking state, then typed out).
2. Click an action item, for example "Ship the batched calendar import fix". The transcript jumps to the moment it was agreed, highlights it and starts playing from there.
3. Open **Ask this meeting**. Click "What are the launch blockers?" for a typed answer with numbered citations, then click a citation to see the quoted passage.
4. Click "Did we agree on a refund policy for annual plans?". The answer is **This was not discussed in the meeting**, with the two closest meetings (Pricing workshop, Customer escalation: Northfield) that open at the exact moment.
5. **Share notes** shows the email preview, then sends it.
6. **New recording**: record (waveform and timer) or upload a file, process it, and the new meeting opens with its own typed summary and actions.
7. **Actions** board: drag cards between columns, filter, switch to list view, open a card to edit owner and due date.
8. Switch to the admin account: the usage limit has moved (the new recording used 28 minutes), an alert shows at 80 percent, and the limit can be raised.

## Screens

- Sign-in
- Home: stats, recent meetings, your actions
- Meetings list with search, topic and attendee filters, sort
- Meeting page: audio player with waveform and action markers, typed summary, decisions, action items, searchable transcript, Ask this meeting, share by email, add action
- New recording: record or upload, title and attendees, processing steps
- Action board: drag and drop, filters, board and list views, action detail
- Header search (Ctrl K) across meetings, transcripts and actions
- Admin: minutes used against the plan limit, weekly usage chart, teammates with roles, invitations, raise-the-limit

## Notes

- Data is fixed (`src/data`): 12 meetings, 45 action items, 6 teammates, 5 prepared Q&A pairs and 1 "not discussed" answer. Free-typed questions get the closest prepared or generated answer; a question with nothing in the transcript gets the "not discussed" answer with the closest meetings.
- Dates are relative to today ("Yesterday", "Due Wednesday"). Nothing is random, so every run looks the same.
- Transcription, calendar sync, video calls and meeting bots are intentionally not part of it. The player is a waveform with a moving playhead, not real audio.
- Dev server note: do not run `npm run build` while `npm run dev` is running (they share `.next`).
