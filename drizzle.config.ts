import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/main/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./opencook.db'
  },
  verbose: true,
  strict: true
})
