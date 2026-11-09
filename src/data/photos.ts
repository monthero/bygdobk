import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

import bygdohusCoaching from '~/assets/photos/bygdohus-coaching.webp?responsive';
import bygdohusCourts from '~/assets/photos/bygdohus-courts.webp?responsive';
import bygdohusOutside from '~/assets/photos/bygdohus-outside.webp?responsive';
import hallSunset from '~/assets/photos/hall-sunset.webp?responsive';
import playerServe from '~/assets/photos/player-serve.webp?responsive';
import playersCourt from '~/assets/photos/players-court.webp?responsive';
import privacyPhone from '~/assets/photos/privacy-phone.webp?responsive';
import racketCourt from '~/assets/photos/racket-court.webp?responsive';
import shuttleRacket from '~/assets/photos/shuttle-racket.webp?responsive';

export type Photo = { src: string; srcSet?: string; alt: MessageDescriptor; position?: string };

const local = ({ src, srcset }: typeof playerServe) => ({ src, srcSet: srcset });

export const PhotoName = z.enum([
  'playersCourt',
  'racketCourt',
  'shuttleRacket',
  'playerServe',
  'hallSunset',
  'bygdohusCourts',
  'bygdohusCoaching',
  'bygdohusOutside',
  'privacyPhone',
]);
export type PhotoName = z.infer<typeof PhotoName>;

export const PHOTOS = {
  [PhotoName.enum.playersCourt]: {
    ...local(playersCourt),
    alt: msg`A shuttle on a racket, with players on green courts behind`,
  },
  [PhotoName.enum.racketCourt]: {
    ...local(racketCourt),
    alt: msg`Two rackets and a shuttle on a court line`,
  },
  [PhotoName.enum.shuttleRacket]: {
    ...local(shuttleRacket),
    alt: msg`A shuttle resting on a racket in a sports hall`,
  },
  [PhotoName.enum.playerServe]: {
    ...local(playerServe),
    alt: msg`A player getting ready to serve`,
  },
  [PhotoName.enum.hallSunset]: {
    ...local(hallSunset),
    alt: msg`A racket, a shuttle and a phone on a bench in a badminton hall at sunset`,
  },
  [PhotoName.enum.bygdohusCourts]: {
    ...local(bygdohusCourts),
    alt: msg`Players training on the courts at Bygdøhus`,
  },
  [PhotoName.enum.bygdohusCoaching]: {
    ...local(bygdohusCoaching),
    alt: msg`A coach leading a group session at Bygdøhus`,
  },
  [PhotoName.enum.bygdohusOutside]: {
    ...local(bygdohusOutside),
    alt: msg`Bygdøhus seen from the car park`,
  },
  [PhotoName.enum.privacyPhone]: {
    ...local(privacyPhone),
    alt: msg`A woman looking at her phone, her face covered by a digital grid`,
    position: 'center 22%',
  },
} satisfies Record<PhotoName, Photo>;

export const PhotoSlot = z.enum([
  'home',
  'startTraining',
  'startJoin',
  'startMembers',
  'training',
  'events',
  'news',
  'club',
  'contact',
  'venue',
  'membership',
  'join',
  'privacy',
  'newsTraining',
  'newsEvent',
  'newsVolunteer',
  'newsClub',
  'boardMembers',
  'boardVolunteers',
  'boardAccess',
]);
export type PhotoSlot = z.infer<typeof PhotoSlot>;

export const SLOT_DEFAULTS: Record<PhotoSlot, Photo> = {
  [PhotoSlot.enum.home]: PHOTOS.playerServe,
  [PhotoSlot.enum.startTraining]: PHOTOS.bygdohusCourts,
  [PhotoSlot.enum.startJoin]: PHOTOS.bygdohusCoaching,
  [PhotoSlot.enum.startMembers]: PHOTOS.bygdohusOutside,
  [PhotoSlot.enum.training]: PHOTOS.bygdohusCourts,
  [PhotoSlot.enum.events]: PHOTOS.hallSunset,
  [PhotoSlot.enum.news]: PHOTOS.racketCourt,
  [PhotoSlot.enum.club]: PHOTOS.bygdohusCoaching,
  [PhotoSlot.enum.contact]: PHOTOS.bygdohusCourts,
  [PhotoSlot.enum.venue]: PHOTOS.bygdohusOutside,
  [PhotoSlot.enum.membership]: PHOTOS.shuttleRacket,
  [PhotoSlot.enum.join]: PHOTOS.playersCourt,
  [PhotoSlot.enum.privacy]: PHOTOS.privacyPhone,
  [PhotoSlot.enum.newsTraining]: PHOTOS.bygdohusCourts,
  [PhotoSlot.enum.newsEvent]: PHOTOS.hallSunset,
  [PhotoSlot.enum.newsVolunteer]: PHOTOS.playersCourt,
  [PhotoSlot.enum.newsClub]: PHOTOS.bygdohusCoaching,
  [PhotoSlot.enum.boardMembers]: PHOTOS.shuttleRacket,
  [PhotoSlot.enum.boardVolunteers]: PHOTOS.hallSunset,
  [PhotoSlot.enum.boardAccess]: PHOTOS.bygdohusOutside,
};
