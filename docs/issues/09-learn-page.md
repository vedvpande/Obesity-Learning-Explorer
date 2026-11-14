**Build order: 7 of 10.** Depends on: #4. (Static content, so it can also be done any time after #4.)

## User stories
- As **Priya**, I want a plain-language explanation of what an "obesity rate" measures, so that I describe the numbers correctly in my report.
- As Priya, I want to learn the common causes without blame or judgement, so that I understand the topic fairly.
- As Priya, I want an example of how to cite the data, so that my teacher accepts my sources.
- As a student who may be struggling with eating, I want a link to a support service, so that I know where to get help.

## GOAL
A `/learn` page with three short sections (what the rate measures, common causes, how to cite) plus a support link.

## CONTEXT
- Files: new `src/pages/LearnPage.tsx`. Content guidance in `docs/brief.md` (risks section).

## CONSTRAINTS
- No new packages.
- Plain language a 15-year-old can read; short paragraphs; proper heading structure (one `h1`, then `h2`s).
- Person-first language ("people with obesity"); no blame.
- No diet, calorie, exercise or weight-loss advice; no "ideal weight" numbers; no body images.
- Not medical advice: say clearly that the rate describes populations, not individuals.

## DONE WHEN (acceptance criteria)
- [ ] "What does 'obesity rate' mean?": the share of adults (18+) in a country with obesity, how it is defined at population level, and that it isn't a test for any one person.
- [ ] "Common causes": several factors (e.g. environment, income, food availability, genetics, health conditions), written without blame.
- [ ] "How to cite this data": an example citation that includes country, year, rate and source, matching the "Copy this fact" format from #5.
- [ ] A "Need support?" box links to a recognised eating-disorder support service (link opens safely with `rel="noopener noreferrer"`).
- [ ] The page passes a basic check: headings in order, link text makes sense out of context.

## VERIFY
- Tests: all three section headings render; the citation example has country, year, rate and source; the support link is present.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
