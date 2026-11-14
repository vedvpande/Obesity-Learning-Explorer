**Build order: 4 of 10.** Depends on: #5.

## User stories
- As **Priya**, I want to see a line chart of my country's rate from 1990 to 2022, so that I can say whether it went up or down.
- As a student using a screen reader, I want a text summary and a data table, so that I get the same information without seeing the chart.

## GOAL
A line chart on `/explore` showing the selected country's adult obesity rate for every year from 1990 to 2022, with a text summary and a table view.

## CONTEXT
- Files: `src/pages/ExplorePage.tsx`, new `src/components/TrendChart.tsx`, data from `GET /api/rates`.

## CONSTRAINTS
- A chart library (e.g. Recharts) would be a new package: name it and confirm before installing, or draw the chart with plain SVG.
- Neutral colours that work in light and dark mode; no red "danger" styling.
- Accessible: text alternative for the chart; keyboard users can reach the table.

## DONE WHEN (acceptance criteria)
- [ ] The x-axis shows years 1990–2022; the y-axis is labelled "Adults (18+) with obesity (%)" and starts at 0.
- [ ] The chart title names the country; a caption shows the source.
- [ ] A sentence below says, e.g., "From 1990 to 2022, the rate in <Country> rose from A% to B%." ("fell" when it went down).
- [ ] A "Show data as table" toggle shows every year and value.
- [ ] Values on the chart and in the table exactly match the data file for 5 chosen country/year pairs.
- [ ] Readable at 360px wide and on a laptop, in light and dark mode.

## VERIFY
- Tests: summary sentence says "rose" or "fell" correctly; table has 33 rows (1990–2022); values match fixture data; chart has an accessible name.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
