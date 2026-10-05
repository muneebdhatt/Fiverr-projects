# Quillstack

An AI document workspace for small teams: summarise, rewrite and translate documents, with separate organisations, roles, billing and an audit log.

Front end only. There is no database, no API keys and nothing leaves the browser. Data is fixed, and actions persist in browser storage for the visit.

## Run it

```bash
npm install
npm run dev        # http://localhost:3100
npm run build      # static export to ./out
npm start          # serve the exported build on :3100
```

Built with Next.js (static export), TypeScript, Tailwind CSS, Zustand and Recharts.

## Logins

Email and password are pre-filled on the sign-in page. Use the profile menu, then "Switch account", to change role. Password for all three is `Welcome2026!`.

| Role | Email | Sees |
| --- | --- | --- |
| Owner | priya.raman@example.com | Northwind Studio and Bluepeak Legal; everything except the Super-admin console |
| Member | jonas.weber@example.com | No Billing, no Super-admin, cannot invite or change roles |
| Super-admin | elena.costa@example.com | All 12 organisations (header switcher or "Open" in the console), plus the Super-admin console |

Signing in as one of these three always starts from the same fresh workspace, so every run matches.

**Invited teammates:** when an Owner or Admin invites someone, that person can sign in as themselves (their invited email, password `Welcome2026!`, or via the profile menu under "Invited teammates"). They see an invitation screen and accept it from their own account. Signing in this way keeps the workspace as it is, so the invite is not lost. (Signing in as Owner, Member or Super-admin resets everything.)

## Main click path

1. Sign in as Owner (Northwind Studio, Team plan).
2. Switch to Bluepeak Legal in the header (Starter plan, 54 credits left).
3. Open a document and use "AI summarise" about four times. Credits run out, the button locks and "Upgrade to continue" appears.
4. Billing, then upgrade to Team. Limits change on screen.
5. Team, then "Invite teammate". A pending row appears.
6. Audit log, then filter by user and action. The summaries and invite appear at the top.
7. Switch to Super-admin, open the console and use the Suspend toggle on an organisation.
8. Switch to Member and note Billing and Super-admin are gone (direct links redirect).

## Layout

- `src/shell/` reusable app shell: layout, sidebar, header, org switcher, account switcher, modal, toasts, skeletons, typing animation
- `src/data/` fixed fake data: 12 organisations, each with its own team, 8 to 10 documents and 30 audit rows (Northwind Studio and Bluepeak Legal are hand-written, the rest are generated deterministically)
- `src/lib/store.ts` the session store; `src/lib/ai.ts` prepared answers and prompt matching
- `src/app/(app)/` the screens

Recording note: keep the address bar out of frame.

## Cut from the spec

Nothing. Per the spec, real auth, billing, SSO and extra settings pages are left out.

## Extra features

- **Documents:** create, edit (with an "Edited by" stamp), duplicate and delete. AI answers can be inserted into the document, copied, and rated (thumbs down asks what was wrong).
- **AI assistant:** summarise, action items, rewrite, translate, tone options (formal, friendly, concise) and follow-ups ("shorter", "as bullets", "more detail"). Every action has a fixed credit cost.
- **Team:** invite, resend, unsend, remove a teammate, and "Leave organisation" for people who joined by invitation. Invitations show on the invited person's home page.
- **Notifications:** a bell with unread counts for invitations, accepted/declined invites, removals, suspensions and low credits.
- **Billing:** upgrade plans, buy extra credits, and open a styled receipt for every invoice.
- **Audit log:** filter, export as CSV, or preview a printable report.
- **Dashboard:** credits by action and by person, alongside the weekly usage chart.
- **Organisation page (Owner and Super-admin):** rename the workspace, change industry, region and brand colour.
- **Super-admin console:** create organisations, bulk suspend, reinstate or change plan, and open any workspace with a "Viewing as Super-admin" bar and an exit button.
- **Polish:** dark mode, a guided tour, keyboard shortcuts (`?` lists them), a reset-workspace action, an offline notice and a custom 404 page. Dark mode, the tour, shortcuts and reset are in the profile menu.

Everything resets on the next Owner, Member or Super-admin sign-in, except the chosen theme.

## Sign-up

`/signup` (linked from the sign-in page) creates a new organisation with the visitor as its Owner, starting on the Starter plan with one starter document to try the AI assistant. The person then signs back in with the email and password they chose. Only a short fingerprint of the password is kept in browser storage, never the password itself.

Organisations created from the Super-admin console get an owner account too: sign in with the owner email and `Welcome2026!`, or pick them from "Other accounts" in the profile menu.
