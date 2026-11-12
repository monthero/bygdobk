import { defineDocuments, defineLocations, type DocumentLocation } from 'sanity/presentation';

import { VISITOR_KINDS } from '~/data/events';

import { PRIVACY_PAGE_ID } from './schema';

const HOME: DocumentLocation = { title: 'Front page', href: '/' };
const NEWS: DocumentLocation = { title: 'News', href: '/nyheter' };
const EVENTS: DocumentLocation = { title: 'Events', href: '/arrangementer' };
const TRAINING: DocumentLocation = { title: 'Training', href: '/trening' };
const MEMBERSHIP: DocumentLocation = { title: 'Membership', href: '/medlemskap' };
const JOIN: DocumentLocation = { title: 'Join the club', href: '/medlemskap/bli-medlem' };
const CLUB: DocumentLocation = { title: 'The club', href: '/klubben' };
const PRIVACY: DocumentLocation = { title: 'Privacy', href: '/personvern' };

const VISITOR_KIND_SET = new Set<string>(VISITOR_KINDS);

const EVERY_PAGE = { message: 'Shown on every page.', locations: [HOME] };

const fixed = (...locations: DocumentLocation[]) => defineLocations({ locations });

export const LOCATIONS = {
  notice: defineLocations(EVERY_PAGE),
  sitePhotos: fixed(HOME, TRAINING, EVENTS, NEWS, CLUB),
  socialLinks: defineLocations(EVERY_PAGE),
  sponsor: fixed(HOME, MEMBERSHIP),
  clubDetails: fixed(CLUB),
  contactForm: fixed(CLUB),
  payment: fixed(MEMBERSHIP, JOIN),
  privacyPage: fixed(PRIVACY),
  trainingGroup: fixed(TRAINING),
  volunteerTeam: fixed(EVENTS),
  membershipPlan: fixed(MEMBERSHIP, JOIN),
  discount: fixed(MEMBERSHIP, JOIN),
  boardMember: fixed(CLUB),
  newsPost: defineLocations({
    select: { title: 'title.nb', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [
        ...(doc?.slug ? [{ title: doc.title || 'This post', href: `/nyheter/${doc.slug}` }] : []),
        NEWS,
        HOME,
      ],
    }),
  }),
  event: defineLocations({
    select: { title: 'title.nb', slug: 'slug.current', kind: 'kind' },
    resolve: (doc) => {
      if (!doc || !VISITOR_KIND_SET.has(doc.kind)) return { locations: [TRAINING] };
      const page = doc.slug ? [{ title: doc.title || 'This event', href: `/arrangementer/${doc.slug}` }] : [];
      return { locations: [...page, EVENTS, HOME] };
    },
  }),
};

export const MAIN_DOCUMENTS = defineDocuments([
  {
    route: ['/nyheter/:slug', '/:locale/nyheter/:slug'],
    filter: '_type == "newsPost" && slug.current == $slug',
  },
  {
    route: ['/arrangementer/:slug', '/:locale/arrangementer/:slug'],
    filter: '_type == "event" && slug.current == $slug',
  },
  { route: ['/personvern', '/:locale/personvern'], filter: `_id == "${PRIVACY_PAGE_ID}"` },
]);
