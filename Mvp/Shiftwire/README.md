# Shiftwire

Shift-broadcast staffing app (Fiverr gig 3, MVP, product G3-3). Businesses post an open shift, nearby workers get a text, the first YES wins the shift.

Front end only. No backend, no database, no API keys. All data is in the app and session state lives in the browser, so every sign-in starts from the same workspace.

## Run it

```bash
npm install
npm run dev        # http://localhost:3300
# or a production build
npm run build && npm run start
```

Static export: `npm run build` writes the site to `out/`, which can be hosted anywhere static.

## Logins

All three accounts use the password `Welcome2026!` (already filled in on the login page). Switch between them from the profile menu, "Switch account".

| Role | Email | Lands on |
| --- | --- | --- |
| Business owner | marcus.bell@example.com | Shifts |
| Worker | marisol.delgado@example.com | Shift offers (phone layout) |
| Admin | ravi.shah@example.com | Operations overview |

Sign-up flows: `Start hiring` (business, paywall, checkout) and `Find shifts` (worker, any 6-digit code works) on the login page.

## Main click path

Sign in as the business, Post a shift, Broadcast. Twelve workers are texted, replies arrive on the live feed, the first YES fills the shift, everyone else is told it is filled and one worker replies STOP and shows as unsubscribed. The shift appears in Shifts as Filled and the admin view counts the new opt-out.

## Screens

- Login, business sign-up with terms, $399/month paywall, checkout, billing with next charge date
- Worker sign-up (phone layout): number, code, profile card, file chip upload, text consent
- Worker search with skill, distance and rating filters, sort, favourites, profile view
- Post a shift, broadcast animation, live feed
- Shift history with filters, sorting and detail view
- Worker app: offers (reply YES or NO), my shifts, profile
- Admin: businesses, workers, shifts, fill rate, revenue

## Extra features

- Auto-escalation: choose what happens if nobody says YES in 2 minutes. An unfilled shift can also be escalated and re-broadcast (rate raised, wider radius)
- Replay broadcast: restart the live feed on the current shift (live page or shift detail)
- Worker reliability score: shown on profiles, sortable, and used when choosing who gets texted
- Favourites first: favourites and available workers rank ahead in each broadcast
- Multi-position shifts: need 1 to 3 workers, the shift fills when the last spot is taken
- Recurring shifts (repeat weekly), saved shift templates, cost estimate before broadcasting
- Rate workers after a completed shift
- Worker app: available-tonight toggle, earnings page, reminder texts
- Admin: compliance log (consents and STOP/START), MRR chart, failed-payment resolve flow
- Dark mode, notification bell, CSV export, keyboard shortcuts (press ? for the list)
- Take a tour: a guided walkthrough for each role, from the header button or the profile menu (arrow keys and Esc work)

## Not included

Real SMS, real phone verification, maps and worker payouts.
