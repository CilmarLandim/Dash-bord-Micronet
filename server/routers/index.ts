import { router } from '../trpc';
import { chatRouter } from './chat';
import { documentsRouter } from './documents';
import { timeRouter } from './time';
import { infoRouter } from './info';

export const appRouter = router({
  chat: chatRouter,
  documents: documentsRouter,
  time: timeRouter,
  info: infoRouter,
});

export type AppRouter = typeof appRouter;
