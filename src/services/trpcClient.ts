import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/routers';

const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:3001';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      async fetch(url, options) {
        const response = await fetch(url, {
          ...options,
          credentials: 'include',
        });
        return response;
      },
    }),
  ],
});

export default trpc;
