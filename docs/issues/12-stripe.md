**Build order: 10 of 10.** Depends on: #4 (and #10 if we choose "Export citations").

## User stories
- As **a visitor who likes the project**, I want a "Support this project" button, so that I can make a small (test) donation.
- As **the developer**, I want Stripe to run in test mode only, so that no real money can ever be taken.

## GOAL
A "Support this project" button that opens Stripe Checkout in test mode and returns to a thank-you page.

(Alternative from the brief: an "Export citations" extra for signed-in users. Pick one before starting.)

## CONTEXT
- Files: new `netlify/functions/create-checkout.ts`, button in the footer or Learn page, new `src/pages/ThanksPage.tsx`.

## CONSTRAINTS
- Stripe sandbox only: the server refuses to run unless the secret key starts with `sk_test_` (and the public key with `pk_test_`).
- Keys from environment variables only; add NAMES to `.env.example`.
- Card details never touch our server (Stripe Checkout handles them).
- Zod-validates the amount on the server.
- The `stripe` package is new: name it and confirm before installing.
- Optional for users: no feature is locked behind payment.

## DONE WHEN (acceptance criteria)
- [ ] "Support this project" lets the user pick a fixed amount (e.g. 3, 5 or 10) and opens Stripe Checkout.
- [ ] Paying with Stripe's test card `4242 4242 4242 4242` returns to `/thanks`.
- [ ] Cancelling returns to the page the user came from with no error.
- [ ] With a live key (`sk_live_`), the function returns an error and creates nothing.
- [ ] The page says clearly this is a test-mode demo and no real money is taken.

## VERIFY
- Tests: Zod rejects amounts outside the allowed list; function refuses non-`sk_test_` keys; button is keyboard-accessible.
- Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Manual: full test-card payment and a cancel.
