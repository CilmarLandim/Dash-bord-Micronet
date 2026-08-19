import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export function createContext(_opts: CreateExpressContextOptions) {
  return {};
}

export type Context = ReturnType<typeof createContext>;

