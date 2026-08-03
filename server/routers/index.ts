import { router } from '../trpc';
import { chatRouter } from './chat';
import { keygenRouter } from './keygen';

export const appRouter = router({
  chat: chatRouter,
  keygen: keygenRouter,
});

export type AppRouter = typeof appRouter;
