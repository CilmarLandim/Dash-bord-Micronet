import { initTRPC } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.sessionId) {
    throw new Error('Session ID é obrigatório');
  }
  return next({
    ctx: {
      ...ctx,
      sessionId: ctx.sessionId,
    },
  });
});
