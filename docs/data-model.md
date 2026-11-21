# Data model

Neon Postgres, managed with Drizzle ORM. The schema lives in `src/db/schema.ts`; migrations are in `drizzle/` and run automatically in the pipeline (`npm run db:migrate`) before every deploy.

```
users ──< saved_facts >── countries ──< obesity_rates
  one user has many saved facts      one country has many yearly rates
```

## Environments

| Git branch           | GitHub environment | Neon branch   | Data                                                                 |
| -------------------- | ------------------ | ------------- | -------------------------------------------------------------------- |
| your computer, `dev` | development        | `development` | Countries, rates and the Demo Student                                |
| `test`               | staging            | `staging`     | Countries, rates and the Demo Student                                |
| `main`               | production         | `production`  | Countries, rates and, while `ALLOW_DEMO_USER=true`, the Demo Student |

`DATABASE_URL` (pooled connection) is set in `.env` locally and as a secret in each GitHub environment. It is never committed or logged.

## Tables

### `countries` (public reference data)

| Column       | Type          | Required | Notes                           |
| ------------ | ------------- | -------- | ------------------------------- |
| `code`       | `char(3)`     | yes      | **Primary key**, e.g. `GBR`     |
| `name`       | `text`        | yes      | e.g. "United Kingdom"           |
| `created_at` | `timestamptz` | yes      | default now                     |
| `updated_at` | `timestamptz` | yes      | default now, updated by the app |

- **`code` as the primary key:** it is already unique and is what URLs use (`?country=GBR`), so no extra id is needed.
- **No `user_id`:** everyone reads the same countries.

### `obesity_rates` (public reference data)

| Column                     | Type          | Required | Notes                                             |
| -------------------------- | ------------- | -------- | ------------------------------------------------- |
| `country_code`             | `char(3)`     | yes      | **Foreign key** → `countries.code`                |
| `year`                     | `smallint`    | yes      | check: 1990–2022                                  |
| `rate_percent`             | `numeric`     | yes      | check: 0–100                                      |
| `source`                   | `text`        | yes      | Our World in Data, "Obesity in adults" (WHO data) |
| `created_at`, `updated_at` | `timestamptz` | yes      |                                                   |

**Primary key:** (`country_code`, `year`). **Index:** `year`.

- **Composite primary key:** one rate per country per year, so loading the data twice can never create duplicates.
- **`numeric`, not rounded:** stores the exact value from the data file, so the screen matches the file (the brief's accuracy test).
- **Checks in the database:** impossible years or rates are refused even if the app had a bug.
- **Index on `year`:** Rankings reads every country for 1990 and 2022.

### `users` (one row per signed-in student)

| Column                     | Type          | Required | Notes                                     |
| -------------------------- | ------------- | -------- | ----------------------------------------- |
| `id`                       | `uuid`        | yes      | **Primary key**, random                   |
| `google_sub`               | `text`        | yes      | **Unique**, Google's permanent account id |
| `email`                    | `text`        | yes      | from Google                               |
| `name`                     | `text`        | no       | from Google, may be missing               |
| `created_at`, `updated_at` | `timestamptz` | yes      |                                           |

- **Random `uuid`:** does not reveal how many users exist.
- **`google_sub` is the identity:** email addresses can change, `sub` never does.
- **Nothing else is stored about a person:** no health, age, school or location data.

### `saved_facts` (My Report, owned by a user)

| Column                     | Type          | Required | Notes                                               |
| -------------------------- | ------------- | -------- | --------------------------------------------------- |
| `id`                       | `uuid`        | yes      | **Primary key**                                     |
| `user_id`                  | `uuid`        | yes      | **Foreign key** → `users.id`, **on delete cascade** |
| `country_code`             | `char(3)`     | yes      | **Foreign key** → `countries.code`                  |
| `year`                     | `smallint`    | yes      | check: 1990–2022                                    |
| `rate_percent`             | `numeric`     | yes      | copied when saved                                   |
| `source`                   | `text`        | yes      | copied when saved                                   |
| `note`                     | `text`        | yes      | default `''`, check: at most 280 characters         |
| `created_at`, `updated_at` | `timestamptz` | yes      |                                                     |

**Index:** (`user_id`, `created_at` descending).

- **`user_id` on every row:** every query filters on it, so a student only ever sees and changes their own facts (another user's id answers 404).
- **Cascade delete:** deleting an account removes all of that student's saved facts.
- **Rate and source copied by the server:** a citation never changes later, and the browser cannot send a made-up number.
- **Note limit in the database too:** 280 characters, matching the form and the Zod check.
- **Index:** matches the one query My Report runs: this user's facts, newest first.
- **At most 200 facts per user** (checked by the API), so the database cannot be filled by scripted requests.

## Not stored in the database

| What                          | Where instead                      | Why                           |
| ----------------------------- | ---------------------------------- | ----------------------------- |
| Sign-in sessions              | Signed HttpOnly cookie (next week) | Nothing to clean up           |
| Analytics                     | PostHog                            | Counts only, nothing personal |
| Donations                     | Stripe (test mode)                 | Stripe keeps payment records  |
| Health details (BMI, weight…) | **Nowhere, ever**                  | Out of scope by design        |

## Loading data

`npm run db:seed` loads `data/obesity_countries.csv` (199 countries, 1990–2022, 6,567 rates; rows without a 3-letter country code are skipped) and creates the fake Demo Student (`DEMO_USER_ID`). It is safe to run again: rows are updated, never duplicated.

## Demo user (until Google sign-in)

API requests act as the Demo Student (`DEMO_USER_ID`). On production this only works while the GitHub variable `ALLOW_DEMO_USER` is `true`; delete that variable, and the Demo Student, when real sign-in ships.
