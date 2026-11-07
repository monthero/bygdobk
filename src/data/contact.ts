import { msg } from '@lingui/core/macro';
import { linkOptions } from '@tanstack/react-router';
import { z } from 'zod';

// Keep in sync with supabase/functions/contact/index.ts.
export const CONTACT_NAME_MAX = 100;
export const CONTACT_EMAIL_MAX = 254;
export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 5000;

export const ContactTopic = z.enum(['training', 'membership', 'tournaments', 'sponsor', 'other']);
export type ContactTopic = z.infer<typeof ContactTopic>;

export const TOPIC_ID = /^[a-z0-9-]{1,40}$/;

export const CONTACT_SEARCH = z.object({
  emne: z.string().regex(TOPIC_ID).optional().catch(undefined),
  melding: z
    .string()
    .trim()
    .max(CONTACT_MESSAGE_MAX)
    .transform((v) => v || undefined)
    .optional()
    .catch(undefined),
});

export const SPONSOR_DRAFT = msg`Hi! We'd like to hear more about sponsoring the club.`;

export const contactLink = (emne: string, melding?: string) =>
  linkOptions({ to: '/kontakt', search: { emne, melding } });
