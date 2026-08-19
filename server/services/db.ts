import fs from 'fs';
import path from 'path';
import initSqlJs, { type Database as SqlJsDatabase, type SqlValue } from 'sql.js';
import dotenv from 'dotenv';

dotenv.config();

const configuredPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sqlite.db');
const dbPath = path.resolve(configuredPath);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const SQL = await initSqlJs({
  locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
});

const sqlite: SqlJsDatabase = fs.existsSync(dbPath)
  ? new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)))
  : new SQL.Database();

function persist() {
  fs.writeFileSync(dbPath, Buffer.from(sqlite.export()));
}

function normalizeParams(params: unknown[]) {
  return params.map((param) => param === undefined ? null : param) as SqlValue[];
}

function getRows(sql: string, params: unknown[] = []) {
  const statement = sqlite.prepare(sql);
  const normalized = normalizeParams(params);
  if (normalized.length) statement.bind(normalized);

  const rows: Array<Record<string, unknown>> = [];
  while (statement.step()) {
    rows.push(statement.getAsObject() as Record<string, unknown>);
  }
  statement.free();
  return rows;
}

function getOne(sql: string, params: unknown[] = []) {
  return getRows(sql, params)[0];
}

function run(sql: string, params: unknown[] = []) {
  sqlite.run(sql, normalizeParams(params));
  const changes = sqlite.getRowsModified();
  const lastInsertRowid = Number(getOne('SELECT last_insert_rowid() AS id')?.id || 0);
  persist();
  return { changes, lastInsertRowid };
}

export const rawDb = {
  exec(sql: string) {
    sqlite.exec(sql);
    persist();
  },
  prepare(sql: string) {
    return {
      run(...params: unknown[]) {
        return run(sql, params);
      },
      get(...params: unknown[]) {
        return getOne(sql, params);
      },
      all(...params: unknown[]) {
        return getRows(sql, params);
      }
    };
  }
};

rawDb.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    total_time_seconds INTEGER DEFAULT 0,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    role TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS scrum_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'variable',
    status TEXT NOT NULL DEFAULT 'pending',
    expense_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface DbSession {
  id: string;
  start_time: string;
  end_time: string | null;
  total_time_seconds: number;
  metadata: string | null;
}

export interface DbMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type ScrumStatus = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';
export type ExpenseCategory = 'fixed' | 'variable' | 'other';
export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';

export interface ScrumItem {
  id: number;
  title: string;
  description: string | null;
  status: ScrumStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: ExpenseCategory;
  status: ExpenseStatus;
  expense_date: string;
  created_at: string;
}

export const dbService = {
  createSession: (id: string) => {
    rawDb.prepare('INSERT INTO sessions (id) VALUES (?)').run(id);
    return { id };
  },

  getSession: (id: string): DbSession | undefined => {
    return rawDb.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as unknown as DbSession | undefined;
  },

  getSessionMeta: (id: string) => {
    const session = dbService.getSession(id);
    return session ? JSON.parse(session.metadata || '{}') : {};
  },

  updateSessionTime: (id: string, seconds: number) => {
    rawDb.prepare('UPDATE sessions SET total_time_seconds = ? WHERE id = ?').run(seconds, id);
  },

  endSession: (id: string) => {
    rawDb.prepare('UPDATE sessions SET end_time = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  addMessage: (sessionId: string, role: string, content: string) => {
    rawDb.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, role, content);
  },

  getHistory: (sessionId: string): DbMessage[] => {
    return rawDb.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId) as unknown as DbMessage[];
  },

  listScrumItems: (): ScrumItem[] => {
    return rawDb.prepare("SELECT * FROM scrum_items ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC").all() as unknown as ScrumItem[];
  },

  createScrumItem: (input: { title: string; description?: string; priority: Priority; dueDate?: string }): ScrumItem => {
    const res = rawDb.prepare('INSERT INTO scrum_items (title, description, priority, due_date) VALUES (?, ?, ?, ?)').run(input.title, input.description ?? null, input.priority, input.dueDate ?? null);
    return rawDb.prepare('SELECT * FROM scrum_items WHERE id = ?').get(res.lastInsertRowid) as unknown as ScrumItem;
  },

  updateScrumItem: (id: number, input: { status?: ScrumStatus; title?: string; description?: string; priority?: Priority; dueDate?: string }): ScrumItem | undefined => {
    const current = rawDb.prepare('SELECT * FROM scrum_items WHERE id = ?').get(id) as unknown as ScrumItem | undefined;
    if (!current) return undefined;
    const next = { ...current, ...input };
    rawDb.prepare('UPDATE scrum_items SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(next.title, next.description ?? null, next.status, next.priority, next.dueDate ?? next.due_date ?? null, id);
    return rawDb.prepare('SELECT * FROM scrum_items WHERE id = ?').get(id) as unknown as ScrumItem;
  },

  deleteScrumItem: (id: number): boolean => {
    const res = rawDb.prepare('DELETE FROM scrum_items WHERE id = ?').run(id);
    return res.changes > 0;
  },

  listExpenses: (): Expense[] => {
    return rawDb.prepare('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC').all() as unknown as Expense[];
  },

  createExpense: (input: { description: string; amount: number; category: ExpenseCategory; status: ExpenseStatus; expenseDate: string }): Expense => {
    const res = rawDb.prepare('INSERT INTO expenses (description, amount, category, status, expense_date) VALUES (?, ?, ?, ?, ?)').run(input.description, input.amount, input.category, input.status, input.expenseDate);
    if (input.category === 'fixed') {
      rawDb.prepare("INSERT INTO scrum_items (title, description, priority) VALUES (?, ?, ?)").run(`Lançamento: ${input.description}`, 'Despesa fixa lançada automaticamente.', 'medium');
    }
    return rawDb.prepare('SELECT * FROM expenses WHERE id = ?').get(res.lastInsertRowid) as unknown as Expense;
  },

  updateExpenseStatus: (id: number, status: ExpenseStatus): Expense | undefined => {
    rawDb.prepare('UPDATE expenses SET status = ? WHERE id = ?').run(status, id);
    return rawDb.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as unknown as Expense | undefined;
  },

  deleteExpense: (id: number): boolean => {
    const res = rawDb.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    return res.changes > 0;
  },

  getStatistics: () => {
    const sessions = rawDb.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(total_time_seconds), 0) AS seconds FROM sessions').get() as { total: number; seconds: number };
    const messages = rawDb.prepare('SELECT COUNT(*) AS total FROM messages').get() as { total: number };
    const documents = rawDb.prepare("SELECT COUNT(*) AS total FROM documents").get() as { total: number };
    const tasks = rawDb.prepare("SELECT status, COUNT(*) AS total FROM scrum_items GROUP BY status").all() as Array<{ status: ScrumStatus; total: number }>;
    const expenses = rawDb.prepare("SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses WHERE status != 'cancelled' GROUP BY category").all() as Array<{ category: ExpenseCategory; total: number }>;
    return {
      sessions: { total: sessions.total, seconds: sessions.seconds },
      messages: messages.total,
      documents: documents.total,
      tasks,
      expenses
    };
  }
};
