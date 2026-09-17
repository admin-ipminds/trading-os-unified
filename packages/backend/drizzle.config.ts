import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/trading',
  },
  migrations: {
    prefix: 'migration_',
  },
} satisfies Config;
