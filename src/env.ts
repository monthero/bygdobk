import { z } from 'zod';

const Env = z.object({
  VITE_SANITY_PROJECT_ID: z.string().min(1),
  VITE_SANITY_DATASET: z.string().min(1),
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const ENV = Env.parse(import.meta.env);
