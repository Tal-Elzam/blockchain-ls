import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const serverEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Backend URL (server-side only - not exposed to client)
    BACKEND_URL: z
      .string()
      .url()
      .default('http://localhost:8000'),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
});