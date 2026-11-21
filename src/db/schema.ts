import { sql } from 'drizzle-orm'
import {
  char,
  check,
  index,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// Every table gets these two columns. updated_at is refreshed by Drizzle
// whenever a row is updated through the app.
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

// Public reference data: one row per country.
export const countries = pgTable('countries', {
  code: char('code', { length: 3 }).primaryKey(),
  name: text('name').notNull(),
  ...timestamps,
})

// Public reference data: one adult (18+) obesity rate per country per year.
export const obesityRates = pgTable(
  'obesity_rates',
  {
    countryCode: char('country_code', { length: 3 })
      .notNull()
      .references(() => countries.code),
    year: smallint('year').notNull(),
    ratePercent: numeric('rate_percent', { mode: 'number' }).notNull(),
    source: text('source').notNull(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.countryCode, t.year] }),
    index('obesity_rates_year_idx').on(t.year),
    check('obesity_rates_year_range', sql`${t.year} BETWEEN 1990 AND 2022`),
    check(
      'obesity_rates_rate_range',
      sql`${t.ratePercent} >= 0 AND ${t.ratePercent} <= 100`,
    ),
  ],
)

// One row per signed-in student. Identity is Google's permanent "sub".
// Never add health or other personal details here.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  ...timestamps,
})

// My Report: facts a user saved. Rate and source are copied at save time
// so a citation never changes later. Deleting a user deletes their facts.
export const savedFacts = pgTable(
  'saved_facts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    countryCode: char('country_code', { length: 3 })
      .notNull()
      .references(() => countries.code),
    year: smallint('year').notNull(),
    ratePercent: numeric('rate_percent', { mode: 'number' }).notNull(),
    source: text('source').notNull(),
    note: text('note').notNull().default(''),
    ...timestamps,
  },
  (t) => [
    index('saved_facts_user_created_idx').on(t.userId, t.createdAt.desc()),
    check('saved_facts_year_range', sql`${t.year} BETWEEN 1990 AND 2022`),
    check(
      'saved_facts_rate_range',
      sql`${t.ratePercent} >= 0 AND ${t.ratePercent} <= 100`,
    ),
    check('saved_facts_note_length', sql`char_length(${t.note}) <= 280`),
  ],
)
