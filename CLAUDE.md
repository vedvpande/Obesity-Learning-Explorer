# CLAUDE.md (project memory for Claude Code : keep it short and true)

## Product

Obesity Learning Explorer: helps students look up, compare and cite adult obesity trends by country for school work, in one simple, trustworthy place.

This is a learning project. It must NEVER store real patient data.
It does not diagnose or give medical advice; it shows a disclaimer.

## Stack

- Frontend: React + Vite + TypeScript (strict) + Tailwind CSS + React Router
- Backend: Netlify Functions v2 in netlify/functions (TypeScript),
  routed with config.path under /api/*
- Database: Neon Postgres via Drizzle ORM; schema in src/db/schema.ts
- Validation: Zod on every API input
- Auth: Sign in with Google -> verify ID token on the server ->
  HttpOnly, Secure, SameSite=Lax session cookie
- Bot protection: Cloudflare Turnstile (verified on the server)
- Analytics: PostHog (never send health data in events)
- Payments: Stripe sandbox only (test keys sk_test_ / pk_test_)

## Commands

- npm run dev         netlify dev: site + /api functions at http://localhost:8888
- npm run dev:vite    site only with Vite (http://localhost:5173, no /api)
- npm run lint        ESLint
- npm run typecheck   tsc --noEmit
- npm test            Vitest
- npm run build       production build
- npm run db:generate Drizzle: create a migration from src/db/schema.ts
- npm run db:migrate  Drizzle: apply migrations to DATABASE_URL

## Rules (always follow)

1. Work in small steps. Explore -> Plan -> Code -> Verify -> Commit.
2. Never read, print or commit .env files or secrets. Secrets come
   from environment variables only. Update .env.example with NAMES only.
3. Every API route: validate input with Zod, check the logged-in user,
   and only return rows that belong to that user.
4. Use parameterised queries via Drizzle. Never build SQL with strings.
5. Write or update tests for every change. Run lint, typecheck,
   test and build before saying a task is done.
6. Do not add a new npm package without telling me its name, why it is
   needed, and confirming it is the real, widely used package.
7. Accessible UI: labels on inputs, keyboard navigation, good contrast.
8. Git: main = production, test = staging, dev = integration. Never commit
   or push directly to main, test or dev: work on feature/<short-name>, then
   a pull request into dev. Run git branch --show-current before every commit.
   Never git push --force or git reset --hard.
