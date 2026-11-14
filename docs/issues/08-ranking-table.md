**Build order: 6 of 10.** Depends on: #4, #11.

## User stories
- As **Priya**, I want to see every country in one table, so that I can see where my country sits.
- As Priya, I want to sort the table by clicking a column heading, so that I can find the highest, lowest or biggest change.

## GOAL
A `/rankings` page with a table of all countries that sorts when a column heading is clicked.

## CONTEXT
- Files: new `src/pages/RankingsPage.tsx`; data from #11 (add a `GET /api/rankings` endpoint if needed, with Zod-validated query).

## CONSTRAINTS
- No new packages.
- Real `<table>` with `<caption>` and `<th scope="col">`; each sortable heading is a `<button>` so it works with the keyboard.
- Neutral wording and colours; no "worst country" language.

## DONE WHEN (acceptance criteria)
- [ ] Columns: Country, Rate 1990 (%), Rate 2022 (%), Change (percentage points).
- [ ] The caption states: adults (18+), the years and the source.
- [ ] Clicking a heading sorts by that column; clicking again reverses it.
- [ ] The sorted heading has `aria-sort="ascending"` or `"descending"`.
- [ ] Each country name links to `/explore?country=<code>`.
- [ ] On a phone, the table scrolls sideways inside its own box; the page itself doesn't.
- [ ] Values match the data file for 5 chosen countries.

## VERIFY
- Tests: sorting by each column in both directions; `aria-sort` updates; sorting works with Enter/Space; links point to the right URL.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
