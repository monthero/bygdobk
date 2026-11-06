import type { MessageDescriptor } from '@lingui/core';
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

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, MessageDescriptor> = {
  [ContactTopic.enum.training]: msg`Training and groups`,
  [ContactTopic.enum.membership]: msg`Membership and payment`,
  [ContactTopic.enum.tournaments]: msg`Events and volunteering`,
  [ContactTopic.enum.sponsor]: msg`Sponsorship`,
  [ContactTopic.enum.other]: msg`Something else`,
};

export const CONTACT_SEARCH = z.object({
  emne: ContactTopic.optional().catch(undefined),
  melding: z
    .string()
    .trim()
    .max(CONTACT_MESSAGE_MAX)
    .transform((v) => v || undefined)
    .optional()
    .catch(undefined),
});

export const SPONSOR_DRAFT = msg`Hi! We'd like to hear more about sponsoring the club.`;

export const contactLink = (emne: ContactTopic, melding?: string) =>
  linkOptions({ to: '/kontakt', search: { emne, melding } });
