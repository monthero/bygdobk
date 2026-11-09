import { z } from 'zod';

export const CopyState = z.enum(['idle', 'copied', 'failed']);
export type CopyState = z.infer<typeof CopyState>;

export const copyState = (copied: boolean, error: Error | null): CopyState => {
  if (copied) return CopyState.enum.copied;
  if (error) return CopyState.enum.failed;
  return CopyState.enum.idle;
};
