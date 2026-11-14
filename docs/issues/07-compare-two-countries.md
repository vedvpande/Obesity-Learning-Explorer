**Build order: 5 of 10.** Depends on: #6.

## User stories
- As **Priya**, I want to choose a second country and see both lines on the same chart, so that I can compare them in my report.
- As Priya, I want to remove the comparison easily, so that I can go back to one country.

## GOAL
An optional "Compare with" dropdown on `/explore` that adds a second country's line to the trend chart.

## CONTEXT
- Files: `src/pages/ExplorePage.tsx`, `src/components/TrendChart.tsx` (from #6).

## CONSTRAINTS
- No new packages beyond what #6 uses.
- The two lines must differ by more than colour (e.g. solid vs dashed, or different markers), so colour-blind users can tell them apart.
- Labelled input; keyboard usable; neutral colours.

## DONE WHEN (acceptance criteria)
- [ ] A labelled "Compare with (optional)" dropdown appears under the first one.
- [ ] The first country can't also be chosen as the second.
- [ ] Both lines appear on one chart with a legend naming both countries.
- [ ] The summary text and data table cover both countries.
- [ ] A "Clear comparison" button removes the second line.
- [ ] The URL updates to `/explore?country=GBR&compare=FRA`; opening it restores both.

## VERIFY
- Tests: choosing a second country adds it to the legend and table; same country is excluded; clear removes it; URL params restore both.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
