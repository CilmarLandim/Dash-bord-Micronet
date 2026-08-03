import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const licenseKeys = sqliteTable('license_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  prefix: text('prefix').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  totalTimeSeconds: integer('total_time_seconds').default(0),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').references(() => sessions.id),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  type: text('type').notNull(),
  title: text('title'),
  filePath: text('file_path').notNull(),
  url: text('url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
