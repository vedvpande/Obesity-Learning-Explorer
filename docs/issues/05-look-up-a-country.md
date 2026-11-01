**Build order: 3 of 10.** Depends on: #4, #11.

## User stories
- As **Priya**, I want to pick my country from a dropdown and see its adult obesity rate, so that I can use it in my report.
- As Priya, I want to copy a ready-made sentence that includes the source, so that I cite the fact correctly.
- As Priya, I want the page to remember my chosen country in the link, so that I can reload or share it.

## GOAL
On `/explore`, a country dropdown that shows the selected country's latest adult obesity rate as a clear sentence, plus a "Copy this fact" button.

## CONTEXT
- Files: `src/pages/ExplorePage.tsx`, a small data-fetching hook, `GET /api/countries` and `GET /api/rates` from #11.

## CONSTRAINTS
- No new packages (use the browser Clipboard API).
- The input has a visible `<label>`; everything works with the keyboard; good contrast.
- Every number states what it measures (adults 18+), the year and the source.
- Neutral colours (no red "danger" styling), person-first wording, no medical advice.

## DONE WHEN (acceptance criteria)
- [ ] A labelled "Country" dropdown lists every country alphabetically.
- [ ] Choosing a country shows: "In 2022, X% of adults (18+) in <Country> had obesity. Source: <source>."
- [ ] "Copy this fact" copies exactly that sentence; a "Copied" message is announced to screen readers (`aria-live`).
- [ ] If copying fails, a clear message says so.
- [ ] The URL updates to `/explore?country=GBR`; opening that URL pre-selects the country.
- [ ] Loading and error states are shown (e.g. "Couldn't load data. Try again.").
- [ ] The sentence matches the data file for 5 chosen countries.

## VERIFY
- Tests: dropdown has an accessible label; selecting a country shows the right sentence; copy button calls the clipboard with country, year, rate and source; URL param pre-selects; error state renders.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
