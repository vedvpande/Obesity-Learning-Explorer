**Build order: 8 of 10.** Depends on: #5, #11. Includes **My Report**.

## User stories
- As **Priya**, I want to sign in with Google, so that I can save facts without making a new password.
- As Priya, I want to save a fact (country, year, rate, source) with a short note, so that I can collect everything for my report in one place.
- As Priya, I want to see all my saved facts on a My Report page, so that I can review them.
- As Priya, I want to copy all my citations at once, so that I can paste them into my report's sources list.
- As Priya, I want to delete a saved fact, so that I can keep only what I need.
- As Priya, I want to be sure no one else can see my saved facts.

## GOAL
Google sign-in with a secure session, and a My Report page where signed-in students save, view, delete and copy their facts. Public pages keep working without sign-in.

## CONTEXT
- Files: `src/db/schema.ts` (add `users` and `saved_facts`), `netlify/functions/auth-*.ts`, `netlify/functions/saved-facts.ts`, new `src/pages/MyReportPage.tsx`, "Save to My Report" button on `src/pages/ExplorePage.tsx`.

## CONSTRAINTS
- Google ID token verified on the server; session in an HttpOnly, Secure, SameSite=Lax cookie.
- Cloudflare Turnstile verified on the server at sign-in.
- Every API route: Zod-validated input, requires a signed-in user, only reads/writes that user's rows; Drizzle parameterised queries.
- Store only Google ID, name and email. Never store personal health information.
- Secrets from environment variables only; add NAMES to `.env.example`.
- Any new package (e.g. Google auth library) must be named and confirmed first.

## DONE WHEN (acceptance criteria)
- [ ] `users` table: `id`, `google_sub` (unique), `name`, `email`, `created_at`.
- [ ] `saved_facts` table: `id`, `user_id` (FK), `country_id`, `year`, `rate_percent`, `source`, `note` (max 280 chars), `created_at`.
- [ ] "Sign in with Google" and "Sign out" work; signing out clears the cookie.
- [ ] Signed in: "Save to My Report" on Explore saves the current fact with an optional labelled note and a character counter. The note has a hint: "Don't include personal health information."
- [ ] Signed out: the save button invites sign-in; all public features still work.
- [ ] `/my-report` lists the user's facts, newest first, each with Delete.
- [ ] "Copy all citations" copies one citation per line (country, year, rate, source).
- [ ] `GET/POST/DELETE /api/saved-facts`: 401 when signed out; 400 on bad input; deleting someone else's fact returns 404.
- [ ] Tested with two accounts: each sees only their own facts.

## VERIFY
- Tests: Zod schemas (note too long, bad year, missing fields); API returns 401 without session; queries filter by `user_id`; cross-user delete returns 404; copy-all output format.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run db:generate`, `npm run db:migrate`.
- Manual: two Google accounts, confirm isolation. Run the security-reviewer agent before opening the PR.
