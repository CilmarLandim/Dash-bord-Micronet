import { router } from '../trpc';
import { chatRouter } from './chat';
import { keygenRouter } from './keygen';
import { adminRouter } from './admin';

export const appRouter = router({
  chat: chatRouter,
  keygen: keygenRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
