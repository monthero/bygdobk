import { z } from 'zod';

export const NoticeTone = z.enum(['info', 'warning']);
export type NoticeTone = z.infer<typeof NoticeTone>;
