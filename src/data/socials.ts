import { z } from 'zod';

export const SocialPlatform = z.enum([
  'instagram',
  'facebook',
  'spond',
  'linkedin',
  'youtube',
  'tiktok',
  'x',
  'threads',
  'snapchat',
]);
export type SocialPlatform = z.infer<typeof SocialPlatform>;

export const SOCIAL_NAMES: Record<SocialPlatform, string> = {
  [SocialPlatform.enum.instagram]: 'Instagram',
  [SocialPlatform.enum.facebook]: 'Facebook',
  [SocialPlatform.enum.spond]: 'Spond',
  [SocialPlatform.enum.linkedin]: 'LinkedIn',
  [SocialPlatform.enum.youtube]: 'YouTube',
  [SocialPlatform.enum.tiktok]: 'TikTok',
  [SocialPlatform.enum.x]: 'X',
  [SocialPlatform.enum.threads]: 'Threads',
  [SocialPlatform.enum.snapchat]: 'Snapchat',
};
