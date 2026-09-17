import { pgTable, serial, varchar, numeric, timestamp, text, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const brokerAccounts = pgTable('broker_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  brokerType: varchar('broker_type', { length: 50 }).notNull(), // 'zerodha', 'dhan', 'icici'
  accessToken: varchar('access_token', { length: 500 }),
  clientId: varchar('client_id', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const positions = pgTable('positions', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  qty: numeric('qty', { precision: 10, scale: 2 }).notNull(),
  entryPrice: numeric('entry_price', { precision: 12, scale: 4 }).notNull(),
  currentPrice: numeric('current_price', { precision: 12, scale: 4 }),
  pnl: numeric('pnl', { precision: 15, scale: 2 }),
  pnlPercent: numeric('pnl_percent', { precision: 8, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  brokerId: varchar('broker_id', { length: 100 }),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  qty: numeric('qty', { precision: 10, scale: 2 }).notNull(),
  price: numeric('price', { precision: 12, scale: 4 }).notNull(),
  side: varchar('side', { length: 10 }).notNull(), // 'BUY' | 'SELL'
  status: varchar('status', { length: 20 }).notNull(), // 'PENDING' | 'FILLED' | 'REJECTED' | 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow(),
  filledAt: timestamp('filled_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});
