Part of #5. Builds the Look up a country screen on `/explore` using mock data, so the page and its tests are ready before the real data comes in.

## What it does
- A labelled "Country" dropdown lists the countries in alphabetical order. The chosen country is kept in the URL (`?country=GBR`), so a reload or a shared link selects it again.
- It shows: "In 2022, X% of adults (18+) in &lt;Country&gt; had obesity. Source: &lt;source&gt;."
- "Copy this fact" copies exactly that sentence. A screen-reader message (`aria-live`) says "Copied", or says that copying failed.
- There is a loading message, and an error message with a "Try again" button.
- The "Get started" link on the landing page now goes to `/explore`. It used to point at `/app`, which doesn't exist.

## Notes
- The mock data in `src/mocks/countries.ts` uses the same shape as the database tables planned in #11. Its values are illustrative only, and the source line says so.
- `src/hooks/useExploreData.ts` is the only file that needs to change when the real API from #11 is ready.
- No new packages and no backend changes.

## Still to do
- [ ] Check that the sentence matches the real data file for 5 countries. This depends on #11.
- [ ] Manual check in a browser: phone and laptop widths, light and dark mode, keyboard only.

## Checks run
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm test`: 15 of 15 tests passed
- `npm run build`: passed

🤖 Generated with [Claude Code](https://claude.com/claude-code)
