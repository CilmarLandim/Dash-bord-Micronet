import crypto from 'crypto';
import { db } from '../db';
import { licenseKeys } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function generateKey(prefix: string = 'MICRONET'): Promise<string> {
  const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const key = `${prefix}-${randomPart}-${timestamp}`;
  
  await db.insert(licenseKeys).values({
    key,
    prefix,
    createdAt: new Date(),
    revoked: false,
  });
  
  return key;
}

export async function validateKey(key: string): Promise<boolean> {
  const result = await db.query.licenseKeys.findFirst({
    where: and(
      eq(licenseKeys.key, key),
      eq(licenseKeys.revoked, false)
    ),
  });
  
  return !!result;
}

export async function listKeys(): Promise<string[]> {
  const result = await db.select().from(licenseKeys);
  return result.map(k => k.key);
}

export async function revokeKey(key: string): Promise<boolean> {
  const result = await db.update(licenseKeys)
    .set({ revoked: true })
    .where(eq(licenseKeys.key, key))
    .returning();
    
  return result.length > 0;
}
