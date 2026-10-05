# Lorekeeper

An internal knowledge assistant for a small team's policies, guides and client notes (a fictional consulting firm, Harbor & Pine). Ask a question, get a typed-out answer with numbered citations, and open the quoted passage in a side panel. Draft replies from templates, and review usage as an admin.

Front end only. There is no backend, database or API keys: the workspace logic runs in the browser and keeps its state in localStorage, so nothing leaves the browser. Answers are prepared and the same on every run.

## Run it

```bash
npm install
npm run dev        # http://localhost:3200
npm run build      # production build
npm start          # serve the build on :3200
```

Built with Next.js 16 (React 19), TypeScript, Tailwind CSS, Zustand and Recharts. It deploys to any static-friendly host such as Vercel, with no environment variables.

State is saved per browser. Clearing the site's data in the browser resets uploads, chats, accounts and feedback to the starting state.

## Logins

Email and password are pre-filled on the sign-in page. The login page also has "Create an account" (new accounts are members).

| Role | Email | Password |
|---|---|---|
| Member | maya.ellison@example.com | Welcome2026! |
| Admin | daniel.okafor@example.com | Welcome2026! |

Switch between them from the profile menu ("Switch account"). Members do not see Admin.

## What is in it

- **Ask:** typed-out answers with numbered citations that open the quoted passage. 17 prepared answers across policies, guides and client notes. Anything the documents do not cover gets "I could not find this in your documents" plus the closest documents.
- **Chat widget:** the Ask Lorekeeper button at the bottom right of every page opens a chat panel. It shares its history with the full Ask page, where chats can be renamed, deleted and shared.
- **Library:** upload with a category, rename, change category, download as text, delete. Deleting a document removes the answers that depend on it.
- **Draft a reply:** two templates written from the matching client notes or meeting notes, with a "Written from" source row.
- **Search:** the box in the header (Ctrl K) finds documents and questions.
- **Notifications, settings and dark mode:** profile, password (for accounts created through sign-up), theme and notification choices.
- **Admin:** usage chart with CSV export, invite a teammate (adds a pending row you can cancel), change a person's role, and move flagged answers between Open, Reviewed and Resolved.
- **Take a tour:** a guided walkthrough from the header, the profile menu or Settings. New accounts are offered it once.

## Main click path

1. Sign in, open the Ask Lorekeeper chat and ask "What are our invoice payment terms?" Open citation 2.
2. Ask something the documents do not cover, such as "What is our stock option vesting schedule?", for the "could not find this" answer.
3. Press thumbs down and fill in "What was wrong?".
4. Library: upload `documents-to-import/Vendor_Onboarding_Guide.pdf`, then ask "When and how are vendors paid?".
5. Draft a reply: pick a template, Write draft, edit, Copy.
6. Switch to Daniel Okafor, open Admin, invite a teammate and resolve the flagged answer.

## Structure

- `src/lib/engine/seed.json` the 19 documents, 17 prepared Q&A pairs, the not-found answer, templates, users and usage.
- `src/lib/engine/engine.ts` the workspace logic: login and sign-up, documents, answers, drafts, search and admin actions. A free-typed question gets the closest prepared answer by keyword match, and never an error.
- `src/lib/api.ts` the calls the screens use. They go to the engine, with a short pause so loading states show.
- `src/shell/` the reusable shell: top navigation, account switcher, toasts, modal, side panel, search, notifications, tour, typewriter, skeletons.
- `src/components/` the chat widget, shared answer components and the document viewer.
