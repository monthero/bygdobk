import { z } from 'zod';

export const ProfileRef = z.object({ name: z.string(), email: z.string() }).nullable();
export type ProfileRef = z.infer<typeof ProfileRef>;

export const PROFILE_REF_COLUMNS = 'profile:profiles!profile_id(name, email)';

export const personName = (name: string | null, profile: ProfileRef) => name ?? profile?.name ?? profile?.email ?? '–';
