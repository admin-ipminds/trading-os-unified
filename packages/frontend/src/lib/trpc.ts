import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@trading-os/backend/src/trpc';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type TRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

export const trpc: TRPCClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
    }),
  ],
});