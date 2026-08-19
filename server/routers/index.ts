import { router } from '../trpc';
import { chatRouter } from './chat';
import { keygenRouter } from './keygen';
import { managementRouter } from './management';
import { adminRouter } from './admin';

export const appRouter = router({
  chat: chatRouter,
  keygen: keygenRouter,
  management: managementRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
