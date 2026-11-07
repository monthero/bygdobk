import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

import { slugMap } from '~/utils/slugs';

import { PhotoSlot } from './photos';

export const NewsKind = z.enum(['training', 'event', 'volunteer', 'club']);
export type NewsKind = z.infer<typeof NewsKind>;

export const NEWS_KINDS: Record<NewsKind, MessageDescriptor> = {
  [NewsKind.enum.training]: msg({ message: 'Training', comment: 'News category' }),
  [NewsKind.enum.event]: msg({ message: 'Event', comment: 'News category' }),
  [NewsKind.enum.volunteer]: msg({ message: 'Volunteering', comment: 'News category. Norwegian: Dugnad' }),
  [NewsKind.enum.club]: msg({ message: 'Club', comment: 'News category' }),
};

export const NEWS_BANNERS: Record<NewsKind, PhotoSlot> = {
  [NewsKind.enum.training]: PhotoSlot.enum.newsTraining,
  [NewsKind.enum.event]: PhotoSlot.enum.newsEvent,
  [NewsKind.enum.volunteer]: PhotoSlot.enum.newsVolunteer,
  [NewsKind.enum.club]: PhotoSlot.enum.newsClub,
};

export const NEWS_CARD_ASPECT = 16 / 9;
export const ARTICLE_HERO_ASPECT = 1440 / 500;

export const NEWS_KIND_SLUGS = slugMap<NewsKind>({
  [NewsKind.enum.training]: 'trening',
  [NewsKind.enum.event]: 'arrangement',
  [NewsKind.enum.volunteer]: 'dugnad',
  [NewsKind.enum.club]: 'klubben',
});

export const InternalPath = z.enum(['/trening', '/arrangementer', '/klubben', '/kontakt']);
export type InternalPath = z.infer<typeof InternalPath>;

export const NewsAuthor = z.enum(['board']);
export type NewsAuthor = z.infer<typeof NewsAuthor>;

type Author = { name: MessageDescriptor; role: MessageDescriptor; page: InternalPath; hash?: string };

export const NEWS_AUTHORS: Record<NewsAuthor, Author> = {
  [NewsAuthor.enum.board]: {
    name: msg({ message: 'The board', comment: 'Author of a news post: the club board. Norwegian: Styret' }),
    role: msg({ message: 'Bygdø Badmintonklubb', comment: 'Role under the author name of a news post' }),
    page: InternalPath.enum['/klubben'],
    hash: 'styret',
  },
};
