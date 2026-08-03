import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(path.join(DB_DIR, 'sqlite.db'));
export const db = drizzle(sqlite, { schema });

// Auto-migrate (simplificado para SQLite)
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Nota: Em produção, usaríamos drizzle-kit para gerenciar migrações.
// Para este ambiente, garantimos que as tabelas existam.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS license_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    revoked INTEGER DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    total_time_seconds INTEGER DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id),
    type TEXT NOT NULL,
    title TEXT,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
