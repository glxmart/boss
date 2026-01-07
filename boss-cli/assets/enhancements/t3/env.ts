import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Environment variable validation using t3-env.
 *
 * This ensures all required environment variables are present
 * and correctly typed at build time and runtime.
 *
 * Add your environment variables here and they will be validated
 * and typed automatically.
 */
export const env = createEnv({
  /**
   * Server-side environment variables schema.
   * These are only available on the server.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Add your server-side env vars here
    // NEXTAUTH_SECRET: z.string().min(1),
    // NEXTAUTH_URL: z.string().url(),
  },

  /**
   * Client-side environment variables schema.
   * These are exposed to the client (prefixed with NEXT_PUBLIC_).
   */
  client: {
    // NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  /**
   * Runtime environment variables.
   * Destructure all client and server variables here.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    // Add your runtime env vars here
  },

  /**
   * Run validation only at build time.
   * Set to false if you want to validate at runtime as well.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined.
   */
  emptyStringAsUndefined: true,
});
