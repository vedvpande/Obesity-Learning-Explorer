**Build order: 2 of 10.** Depends on: #4. Needed by: #5, #6, #7, #8, #10.

## User stories
- As **Priya**, I want every page to use the same trustworthy numbers, so that the facts I copy match the chart and the table.
- As **the developer**, I want the data loaded into Postgres by a repeatable script, so that I can rebuild the database at any time.

## GOAL
Drizzle tables for countries and yearly obesity rates, a seed script that loads them from the data file, and read-only public API endpoints that the Explore and Rankings pages use.

(The `saved_facts` table and the `users` table it links to are created in #10, because they belong with sign-in.)

## CONTEXT
- Files: `src/db/schema.ts`, Drizzle migrations, new seed script, data file (e.g. `data/obesity-rates.csv`), `netlify/functions/countries.ts`, `netlify/functions/rates.ts`.
- Data: yearly adult (18+) obesity rates, 1990–2022, every country, with a source label (see `docs/brief.md`).

## CONSTRAINTS
- Neon Postgres via Drizzle; parameterised queries only, never SQL built from strings.
- Zod on every API input.
- No column anywhere for personal health data (height, weight, BMI).
- Database URL from environment variables only; add the variable NAME to `.env.example`.
- Drizzle, the Neon driver and a CSV parser are new packages: name them and confirm before installing.
- These endpoints return only public reference data, so they do not require login. (This is an agreed exception to the "check the logged-in user" rule; they never return user rows.)

## DONE WHEN (acceptance criteria)
- [ ] `countries` table: `id`, `iso3` (unique), `name`.
- [ ] `obesity_rates` table: `country_id` (FK), `year` (1990–2022), `rate_percent`, `source`; unique on (`country_id`, `year`).
- [ ] `npm run db:migrate` creates the tables; `npm run db:seed` loads the data file.
- [ ] Running the seed twice leaves the same row count (no duplicates).
- [ ] `GET /api/countries` returns all countries sorted by name.
- [ ] `GET /api/rates?country=GBR` returns that country's rows for 1990–2022.
- [ ] An invalid country code returns 400; an unknown but valid-looking code returns 404.
- [ ] For 5 chosen country/year pairs, the API value exactly matches the data file.

## VERIFY
- Tests: Zod rejects bad input (missing, lowercase, too long, SQL-like text); seed parser handles the data file; the 5 accuracy pairs.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run db:generate`, `npm run db:migrate`.
