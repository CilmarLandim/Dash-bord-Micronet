import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || './micronet.db';
const dbDir = path.dirname(path.resolve(dbPath));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Inicializa as tabelas
db.exec(`
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

export const dbService = {
  createSession: (id: string) => {
    const stmt = db.prepare('INSERT INTO sessions (id) VALUES (?)');
    stmt.run(id);
    return { id };
  },

  getSession: (id: string): DbSession | undefined => {
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id) as DbSession | undefined;
  },

  getSessionMeta: (id: string) => {
    const session = dbService.getSession(id);
    return session ? JSON.parse(session.metadata || '{}') : {};
  },

  updateSessionTime: (id: string, seconds: number) => {
    const stmt = db.prepare('UPDATE sessions SET total_time_seconds = ? WHERE id = ?');
    stmt.run(seconds, id);
  },

  endSession: (id: string) => {
    const stmt = db.prepare('UPDATE sessions SET end_time = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  },

  addMessage: (sessionId: string, role: string, content: string) => {
    const stmt = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)');
    stmt.run(sessionId, role, content);
  },

  getHistory: (sessionId: string): DbMessage[] => {
    const stmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC');
    return stmt.all(sessionId) as DbMessage[];
  }
};
