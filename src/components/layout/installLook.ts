import { z } from 'zod';

export const InstallLook = z.enum(['link', 'button']);
export type InstallLook = z.infer<typeof InstallLook>;
