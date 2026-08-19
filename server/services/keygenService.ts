import { randomBytes } from 'node:crypto';
import { rawDb } from './db';

export async function generateKey(prefix: string = 'MICRONET'): Promise<string> {
  const normalizedPrefix = prefix.trim().toUpperCase() || 'MICRONET';
  const randomPart = randomBytes(8).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const key = `${normalizedPrefix}-${randomPart}-${timestamp}`;

  rawDb.prepare(`
    INSERT INTO license_keys (key, prefix, created_at, revoked)
    VALUES (?, ?, ?, 0)
  `).run(key, normalizedPrefix, Date.now());

  return key;
}

export async function validateKey(key: string): Promise<boolean> {
  const result = rawDb.prepare(`
    SELECT id FROM license_keys WHERE key = ? AND revoked = 0 LIMIT 1
  `).get(key.trim());
  return Boolean(result);
}

export async function listKeys(): Promise<string[]> {
  const rows = rawDb.prepare(`
    SELECT key FROM license_keys WHERE revoked = 0 ORDER BY created_at DESC
  `).all() as Array<{ key: string }>;
  return rows.map((row) => row.key);
}

export async function revokeKey(key: string): Promise<boolean> {
  const result = rawDb.prepare(`
    UPDATE license_keys SET revoked = 1 WHERE key = ? AND revoked = 0
  `).run(key.trim());
  return result.changes > 0;
}

