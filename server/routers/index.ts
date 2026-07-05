import { router } from '../trpc';
import { chatRouter } from './chat';
import { documentsRouter } from './documents';
import { timeRouter } from './time';
import { infoRouter } from './info';
import { videoRouter } from './video';

export const appRouter = router({
  chat: chatRouter,
  documents: documentsRouter,
  time: timeRouter,
  info: infoRouter,
  video: videoRouter,
});

export type AppRouter = typeof appRouter;
