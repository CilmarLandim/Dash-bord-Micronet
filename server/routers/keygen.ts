import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { generateKey, validateKey, listKeys, revokeKey } from '../services/keygenService';

export const keygenRouter = router({
  generate: publicProcedure
    .input(z.object({ prefix: z.string().optional() }))
    .mutation(async ({ input }) => {
      const key = await generateKey(input.prefix);
      return { key };
    }),

  validate: publicProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const isValid = await validateKey(input.key);
      return { isValid };
    }),

  list: publicProcedure.query(async () => {
    return await listKeys();
  }),

  revoke: publicProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const success = await revokeKey(input.key);
      return { success };
    }),
});
