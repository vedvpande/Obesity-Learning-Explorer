**Build order: 1 of 10.** Depends on: nothing. Everything else sits inside this layout.

## User stories
- As **Priya, a Year 10 student**, I want to open the site and use it straight away without making an account, so that I can get facts for my report quickly.
- As Priya, I want a clear menu, so that I can move between Explore, Rankings and Learn.
- As any visitor, I want to see that the site is for learning only, so that I don't mistake it for medical advice.

## GOAL
A shared layout (header with navigation, main area, footer with disclaimer) and routes for every public page, all usable without signing in.

## CONTEXT
- Files: `src/App.tsx`, `src/pages/LandingPage.tsx`, new `src/components/Layout.tsx`, placeholder pages for `/explore`, `/rankings`, `/learn`.
- Brief: `docs/brief.md`.

## CONSTRAINTS
- React + TypeScript (strict) + Tailwind + React Router. No new packages.
- Accessible: keyboard navigation, visible focus, good contrast in light and dark mode.
- No medical advice; neutral, person-first wording.

## DONE WHEN (acceptance criteria)
- [ ] `/`, `/explore`, `/rankings` and `/learn` all render inside the shared layout.
- [ ] Any unknown URL shows a "Page not found" page with a link home.
- [ ] Header links work with the keyboard (Tab + Enter); the current page has `aria-current="page"`.
- [ ] A "Skip to main content" link is the first thing Tab reaches.
- [ ] Every page shows the footer disclaimer: "For learning only. This site does not diagnose or give medical advice."
- [ ] No public page asks the user to sign in or redirects to a login screen.
- [ ] Works at 360px wide and on a laptop, in light and dark mode, with no console errors.

## VERIFY
- Tests: each route renders with its heading; nav link for the current page has `aria-current`; disclaimer is on every page; unknown route shows 404.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
