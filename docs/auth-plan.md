# Plan: Sign in with Google and protect every /api route

Branch: `feature/auth` (from `dev`). To continue in a new conversation, paste:
"Read CLAUDE.md and docs/auth-plan.md, then continue with the next unticked step."

## Decisions (approved)

- Real Postgres in tests with `@electric-sql/pglite` (dev only) for the two-user test.
- Demo Student rows: KEPT in all three databases (decided after login worked). Harmless: it cannot be signed into (no real Google sub) and owns no saved facts.
- Save this plan here so a fresh conversation can continue.

## Packages (checked on npm, installed in step 1)

| Package                      | Version | Why                                                                                                                    |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `google-auth-library`        | 11.3.4  | Google's official library: verifies the Google ID token on the server (signature, expiry, audience = GOOGLE_CLIENT_ID) |
| `jose`                       | 6.2.18  | Signs and verifies the session cookie with SESSION_SECRET                                                              |
| `@electric-sql/pglite` (dev) | 0.5.17  | Real Postgres inside tests, so the two-user test proves the SQL filters by user                                        |

The Google button and the Turnstile widget load as official scripts (`accounts.google.com/gsi/client`, `challenges.cloudflare.com/turnstile/v0/api.js`): no packages.

## Server (netlify/lib and netlify/functions)

- `netlify/lib/session.ts`: create/verify a signed token (jose, HS256, SESSION_SECRET, 7 days) holding only the user id; build the cookie `HttpOnly; Secure (except APP_ENV=local); SameSite=Lax; Path=/; Max-Age=604800` and the clearing cookie.
- `netlify/lib/auth.ts`: `requireUser(req)` returns `{ userId }` or a 401 Response. Replaces `currentUserId()` and DEMO_USER_ID.
- `netlify/lib/turnstile.ts`: `verifyTurnstile(token, ip)` via Cloudflare siteverify with TURNSTILE_SECRET_KEY.
- `netlify/lib/google.ts`: `verifyGoogleIdToken(credential)` with google-auth-library; audience GOOGLE_CLIENT_ID; email must be verified; returns sub, email, name.
- `netlify/lib/csrf.ts`: POST/PATCH/DELETE need `Content-Type: application/json` and an `Origin` matching APP_URL (else 403); small body size limit.
- `POST /api/auth/google`: Zod `{ credential, turnstileToken }` → Turnstile first (403) → Google token (401) → find or create user by `google_sub` (update name/email) → set cookie → 200 `{ name }`.
- `GET /api/auth/me`: requireUser → own name and email (200) or 401.
- `POST /api/auth/logout`: clear cookie → 204.
- `saved-facts`: requireUser + CSRF check; every query already filters by user_id.
- Public reference endpoints (countries, rates, rankings, health) stay public.

## Browser

- `/login`: Turnstile widget first; Google button appears after Turnstile passes; POST both tokens; go to `?next=` (own paths only, no open redirects). Accessible labels and messages.
- `AuthProvider`: real session from `GET /api/auth/me`; Sign out → `/api/auth/logout`.
- `RequireAuth` wraps `/my-report`: logged out → `/login?next=/my-report`.
- Header: "Sign in" link / name + "Sign out". No more "(demo)".
- Explore "Save to My Report" when signed out → "Sign in to save" link.

## Remove the demo user

Code (auth stub, ALLOW_DEMO_USER, seed demo user, ci-cd.yml lines), docs/data-model.md, GitHub (DEMO_USER_ID ×3, ALLOW_DEMO_USER on production), and the Demo Student rows (ask first).

## Environment variables (names only; never paste values in chat)

| Where                       | Names                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Local `.env`                | GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_ID, SESSION_SECRET, APP_ENV=local, VITE_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY (Cloudflare test keys) |
| GitHub environments (all 3) | Variable GOOGLE_CLIENT_ID; secret SESSION_SECRET (different per environment); TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY (already set)           |
| Google Cloud Console        | OAuth Web client; JavaScript origins: the 3 Netlify sites and http://localhost:8888                                                             |

## Steps

- [x] 1. Branch feature/auth; check and install packages; save this plan
- [x] 2. Server helpers (session, requireUser, turnstile, google, csrf) + tests
- [x] 3. Auth endpoints (google, me, logout) + tests
- [x] 4. Protect saved-facts; CSRF check; two-user access test (pglite)
- [x] 5. Login page, RequireAuth, header, Save button + tests
- [x] 6. Remove the demo user; manual test at localhost:8888 with a real Google account
- [x] 7. Security-reviewer run; lint, typecheck, test, build; commit; PR into dev

## Done when

Login/logout work; pages with data redirect to login when logged out; a user cannot read, change or delete another user's data. Tests for requireUser and a two-user access test pass; lint, typecheck, test and build pass.

## Follow-ups (from the security review, none blocking)

- Content-Security-Policy (self, accounts.google.com, challenges.cloudflare.com) and security headers on /api responses
- `Cache-Control: private, no-store` on all JSON API responses
- Sign-out failure: show an error and re-check instead of always showing "signed out"
- Turnstile: also check the returned `hostname` (and optionally an `action`)
- Session: issuer/audience claims; a way to revoke sessions early; a different SESSION_SECRET per environment
- Rate limits on /api/auth/* and /api/saved-facts
- Stream the request body and stop at 4 KB
