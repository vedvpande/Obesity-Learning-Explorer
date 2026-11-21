import { defineConfig } from 'drizzle-kit'

// Locally, DATABASE_URL comes from .env. In GitHub Actions it is already an
// environment variable, so a missing .env file is fine.
try {
  process.loadEnvFile('.env')
} catch {
  // no .env file: use the environment as it is
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
