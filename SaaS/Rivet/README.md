# Rivet

Agency client portal and billing (Fiverr gig 4, SaaS, product G4-8). An agency runs projects, tracks time, invoices clients, and gives each client a portal to approve work and pay.

Front end only. No backend, no database, no API keys. All data is in the app, and what you do during a visit is kept in the browser, so every sign-in starts from the same agency.

## Run it

```bash
npm install
npm run dev        # http://localhost:3800
npm run build      # static export to ./out
npm start          # serve the exported build on :3800
```

Built with Next.js (static export), TypeScript, Tailwind CSS, Zustand and Recharts. Brand: grape violet with an orange for attention, charcoal neutrals, Bricolage Grotesque and Inter. Recording note: keep the address bar out of frame.

## Logins

Email and password are pre-filled on the sign-in page. Password for all three is `Welcome2026!`. Switch role from the profile menu, "Switch account". Signing in resets everything to the starting state; switching account keeps what you did.

| Role | Email | Sees |
| --- | --- | --- |
| Agency owner | maya.okafor@example.com | Everything: dashboard, projects, time, invoices, clients, rates and budgets |
| Team member | priya.nair@example.com | Dashboard, projects, time. No invoices, no revenue, no rates, no dollar budgets |
| Client | isabel.moreau@example.com | Tessellate Architects only: their projects, approvals, files, updates, invoices and Pay now. Never rates, team notes or other clients |

On the sign-in page, "Use the client portal" fills in the client login.

## Main click path

1. Sign in as the owner. The dashboard lists what needs attention: overdue invoices (send a reminder), projects near budget, approvals a client has sat on (nudge the client), unbilled work (create invoice).
2. Open Website redesign. Drag a card between columns on the board, open a card for details and an internal note, check the budget bar, files and milestones.
3. Weekly update tab, then "Draft the weekly update for the client": a short thinking state, then the draft types out. Edit it, then "Post to client portal".
4. Start the timer from the header, stop it. The entry lands in Time (timesheet by week, add or edit time by hand).
5. Invoices, then New invoice for Tessellate Architects. The invoice builder pulls the unbilled billable hours; untick entries, add a line, watch the preview totals. Send to client.
6. Switch account to the client. Approve "Case study template design", open an invoice (hours and rates are not shown to clients), then Pay now: checkout, processing, receipt. The invoice stays Paid, including after a reload and when you switch back to the owner.
7. Switch to the team member and note the missing Invoices and Clients; direct links redirect to the dashboard.

## Numbers that add up

- Every invoice total is hours times rate, plus tax: line amount = hours x rate, subtotal = sum of lines, tax = subtotal x client rate (rounded to cents), total = subtotal + tax. The same function feeds the invoice, the checkout, the lists and the dashboard.
- Time entries locked to an invoice cannot be edited. Budgets, unbilled work, outstanding and overdue amounts are all calculated from the entries and invoices, nothing is typed in.
- Data is generated from a fixed seed relative to today, so it is identical on every load that day. Because dates are relative to today, the dollar totals shift a little from one day of the week to another.

## Fake data

6 clients, 10 projects, 80 tasks, 200 time entries, 14 invoices (8 paid, 2 overdue, 3 awaiting payment, 1 draft), 6 people, 16 client approvals, 40 files, 10 posted updates.

## Cut from the spec

Nothing. Left out as asked: real payments, e-signature, contracts, accounting integrations.

## Layout

- `src/data/` fixed fake data and invoice maths (`calc.ts`)
- `src/lib/store.ts` the session store and merged views; `derive.ts` project and client totals; `ai.ts` prepared update drafts and prompt matching
- `src/shell/` reusable shell: layout pieces, UI kit, timer, files and approvals, invoice document, weekly update helper
- `src/app/(app)/` the screens
