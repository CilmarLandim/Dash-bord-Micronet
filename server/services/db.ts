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
      run: (...params: unknown[]) => run(sql, params),
      get: (...params: unknown[]) => getOne(sql, params),
      all: (...params: unknown[]) => getRows(sql, params),
    };
  },
  transaction<T>(callback: () => T) {
    // sql.js mantém o banco em memória; persistimos apenas após concluir o callback.
    // Isso evita conflitos entre exportação WASM e transações explícitas.
    const result = callback();
    persist();
    return result;
  },
  pragma(_statement: string) {
    // sql.js não precisa de configuração de journal para o uso local do agente.
  },
};

rawDb.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    total_time_seconds INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    type TEXT NOT NULL,
    title TEXT,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS license_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    revoked INTEGER DEFAULT 0
  );
`);

export interface DbSession {
  id: string;
  start_time: number;
  end_time: number | null;
  total_time_seconds: number;
}

export interface DbMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const dbService = {
  createSession: (id: string) => {
    rawDb.prepare(
      'INSERT INTO sessions (id, start_time, total_time_seconds) VALUES (?, ?, 0)'
    ).run(id, Date.now());
    return { id };
  },

  getSession: (id: string): DbSession | undefined => {
    return rawDb.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as unknown as DbSession | undefined;
  },

  updateSessionTime: (id: string, seconds: number) => {
    rawDb.prepare('UPDATE sessions SET total_time_seconds = ? WHERE id = ?').run(seconds, id);
  },

  endSession: (id: string) => {
    rawDb.prepare('UPDATE sessions SET end_time = ? WHERE id = ?').run(Date.now(), id);
  },

  addMessage: (sessionId: string, role: string, content: string) => {
    rawDb.prepare(
      'INSERT INTO chat_messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)'
    ).run(sessionId, role, content, Date.now());
  },

  getHistory: (sessionId: string): DbMessage[] => {
    return rawDb
      .prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC, id ASC')
      .all(sessionId) as unknown as DbMessage[];
  },

  createDocument: (document: {
    id: string;
    sessionId?: string;
    type: string;
    title?: string;
    filePath: string;
    url: string;
  }) => {
    rawDb.prepare(
      `INSERT OR REPLACE INTO documents
        (id, session_id, type, title, file_path, url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      document.id,
      document.sessionId || null,
      document.type,
      document.title || null,
      document.filePath,
      document.url,
      Date.now(),
    );
    return document;
  },
};

