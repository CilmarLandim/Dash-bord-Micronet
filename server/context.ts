import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  return {
    req,
    res,
    sessionId: req.headers['x-session-id'] as string,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
