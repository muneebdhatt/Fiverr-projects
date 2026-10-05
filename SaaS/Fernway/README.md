# Fernway

AI patient intake and staff dashboard (Fiverr gig 4, SaaS, product G4-5). A clinic check-in screen for patients on a tablet, and a live queue for the front desk and care team.

Front end only. No backend, no database, no API keys. All data is in the app and session state lives in the browser, so every sign-in starts from the same queue.

## Run it

```bash
npm install
npm run dev        # http://localhost:3500
# or a production build
npm run build && npm run start
```

Static export: `npm run build` writes the site to `out/`, which can be hosted anywhere static.

## Logins

All three accounts use the password `Welcome2026!` (already filled in on the sign-in page). Switch between them from the profile menu, "Switch account".

| Role | Email | Sees |
| --- | --- | --- |
| Clinician | elena.marsh@example.com | Queue with full intakes, AI summary, flags, notes |
| Receptionist | hannah.lindqvist@example.com | Queue and check-in details only, no clinical answers |
| Admin | naomi.castellano@example.com | Queue overview, audit trail, question sets, staff |

The patient check-in screen needs no login: `Open the patient check-in screen` on the sign-in page, or `Check-in screen` in the top bar.

## Main click path

1. Open the check-in screen, tap Start check-in, choose "I feel unwell", tick Chest pain and Fever or chills.
2. Follow-up questions change with the symptoms ticked ("Because you mentioned chest pain"). Finish consent and submit: "Thank you, please take a seat".
3. Tap Staff view and sign in as the clinician. The new patient is at the top of the queue with a Priority tag.
4. Open them: the AI summary types out, then the flagged items appear ("Reports chest pain, flag for nurse"). Use the suggested prompts under "Ask about this intake", add a clinician note, tap Start review.
5. Switch to Receptionist (queue only, clinical answers hidden), then Admin to open the audit trail, where every open, status change and note is recorded.

Starting a new check-in clears the previous walk-in, so the main path repeats cleanly.

## Screens

- Sign in, with a patient check-in link for the front desk tablet
- Patient flow (tablet layout, large touch targets): welcome, reason for visit, symptoms checklist, guided follow-up questions that adapt to answers, consent, thank-you with a live place in the queue
- Returning patients: matching name and date of birth (for example Amara Nwosu, 18 Apr 1990) shows "Welcome back" and pre-fills the allergy answer from the last visit
- Queue: status filters, search, clinician filter, sort, flagged-only, priority tags, average wait, room strip (assign patients to Room 1 to 3 or the nurse bay)
- Patient detail: typed-out AI summary with flagged items, ask box with prepared answers, answers, notes, access history, room picker, Export summary (PDF preview)
- Front desk actions: Call to desk and Let the nurse know, with a clinician Acknowledge step
- Handover report (clinician): styled report preview, Download PDF opens the print dialog
- Notifications bell: arrivals, priority alerts, room changes; click one to jump to that patient
- Waiting-room screen (`/board`, opens from the profile menu): first names only, "Now calling", rooms, up next. Open it in a second window and it follows the queue
- Insights (admin): check-ins per hour, 7-day wait trend, flag breakdown, top symptoms, per-clinician table
- Audit trail (admin): every open, status change, note, room move, alert, export, filterable
- Question sets (admin): reorder by drag or arrows, reword, show or hide, add questions, edit options and conditions on added questions, live tablet preview, publish to the check-in screen
- Staff (admin): role dropdown, active toggle, invite modal that adds a pending row
- Display: dark mode and larger text (profile menu, and Larger text on the check-in screen), guided tour (profile menu, Take a tour), keyboard shortcuts (press ?)

## Scripted moment

30 seconds after signing in and staying on the queue, one scripted walk-in (Nadia Rosen) checks in, with a toast and a notification. It happens once per sign-in.

## Cut from the spec

Nothing was cut. Notes: the patient flow auto-advances on single-choice answers, and clinical answers are hidden from the Admin queue view as well as the Receptionist view.
