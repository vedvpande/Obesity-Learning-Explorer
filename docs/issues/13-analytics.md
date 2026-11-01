**Build order: 9 of 10.** Depends on: #5.

## User stories
- As **the project owner**, I want to know which countries are looked up most, so that I can see what students find useful.
- As **Priya**, I want my use of the site to stay private, so that nothing personal about me is tracked.

## GOAL
A single PostHog event recorded when a country is looked up, containing only the country code.

## CONTEXT
- Files: new `src/lib/analytics.ts`, called from `src/pages/ExplorePage.tsx`.

## CONSTRAINTS
- PostHog (`posthog-js`) is a new package: name it and confirm before installing.
- Never send health data, notes, names, emails or user IDs.
- PostHog key from an environment variable; add the NAME to `.env.example`.
- If the key is missing, the site works normally and sends nothing.

## DONE WHEN (acceptance criteria)
- [ ] Choosing a country sends `country_looked_up` with `{ country: "GBR" }` and nothing else.
- [ ] No event includes name, email, user ID, notes or any rate the user saved.
- [ ] PostHog runs anonymously (no `identify` calls, no person profiles, no session recording).
- [ ] Autocapture is off, so no other events are sent by accident.
- [ ] Without a key set, no network calls to PostHog are made.

## VERIFY
- Tests: event payload has only the `country` key; no event fires when the key is missing; signed-in state doesn't change the payload.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Manual: check the PostHog dashboard shows the event with only the country.
