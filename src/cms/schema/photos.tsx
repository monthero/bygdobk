import { defineField, defineType } from 'sanity';
import { z } from 'zod';

import { Images } from '~/components/ui/icons';
import { PhotoSlot, SLOT_DEFAULTS } from '~/data/photos';

import classes from './photos.module.css';

const PhotoTab = z.enum(['pages', 'front', 'news', 'board']);

const SLOTS: Record<PhotoSlot, { title: string; tab: z.infer<typeof PhotoTab> }> = {
  [PhotoSlot.enum.home]: { title: 'Front page, top', tab: PhotoTab.enum.front },
  [PhotoSlot.enum.startTraining]: { title: 'Front page, "New to badminton?" card', tab: PhotoTab.enum.front },
  [PhotoSlot.enum.startJoin]: { title: 'Front page, "Signing up a child?" card', tab: PhotoTab.enum.front },
  [PhotoSlot.enum.startMembers]: { title: 'Front page, "Already a member?" card', tab: PhotoTab.enum.front },
  [PhotoSlot.enum.training]: { title: 'Training', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.events]: { title: 'Events', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.news]: { title: 'News', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.club]: { title: 'The club', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.venue]: { title: 'The hall, next to the address', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.membership]: { title: 'Membership', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.join]: { title: 'Join', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.privacy]: { title: 'Privacy', tab: PhotoTab.enum.pages },
  [PhotoSlot.enum.newsTraining]: { title: 'Training news', tab: PhotoTab.enum.news },
  [PhotoSlot.enum.newsEvent]: { title: 'Event news', tab: PhotoTab.enum.news },
  [PhotoSlot.enum.newsVolunteer]: { title: 'Volunteering news', tab: PhotoTab.enum.news },
  [PhotoSlot.enum.newsClub]: { title: 'Club news', tab: PhotoTab.enum.news },
  [PhotoSlot.enum.boardMembers]: { title: 'Memberships', tab: PhotoTab.enum.board },
  [PhotoSlot.enum.boardVolunteers]: { title: 'Volunteers', tab: PhotoTab.enum.board },
  [PhotoSlot.enum.boardAccess]: { title: 'Board access', tab: PhotoTab.enum.board },
  [PhotoSlot.enum.boardVisitors]: { title: 'Visitors', tab: PhotoTab.enum.board },
};

const hasAsset = (image: unknown) =>
  typeof image === 'object' && image !== null && 'asset' in image && Boolean(image.asset);

const slotField = (slot: PhotoSlot) =>
  defineField({
    name: slot,
    title: SLOTS[slot].title,
    type: 'image',
    group: SLOTS[slot].tab,
    options: { hotspot: true },
    description: (
      <span className={classes.fallback}>
        <img src={SLOT_DEFAULTS[slot].src} alt="" width={64} height={40} />
        <span>Empty: the site uses this photo.</span>
      </span>
    ),
    fields: [
      defineField({
        name: 'alt',
        title: 'Describe the image',
        type: 'localeString',
        validation: (rule) => rule.custom((alt, { parent }) => (hasAsset(parent) && !alt ? 'Required' : true)),
      }),
    ],
  });

export const sitePhotos = defineType({
  name: 'sitePhotos',
  title: 'Photos',
  type: 'document',
  icon: Images,
  groups: [
    { name: PhotoTab.enum.pages, title: 'Pages', default: true },
    { name: PhotoTab.enum.front, title: 'Front page' },
    { name: PhotoTab.enum.news, title: 'News without a banner' },
    { name: PhotoTab.enum.board, title: 'Board pages' },
  ],
  fields: PhotoSlot.options.map(slotField),
  preview: { prepare: () => ({ title: 'Photos' }) },
});
