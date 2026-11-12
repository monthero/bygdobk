import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

import bygdohusCoaching from '~/assets/photos/bygdohus-coaching.webp?responsive';
import bygdohusCourts from '~/assets/photos/bygdohus-courts.webp?responsive';
import bygdohusOutside from '~/assets/photos/bygdohus-outside.webp?responsive';
import hallSunset from '~/assets/photos/hall-sunset.webp?responsive';
import newspaperBench from '~/assets/photos/newspaper-bench.webp?responsive';
import playersCourt from '~/assets/photos/players-court.webp?responsive';
import privacyPhone from '~/assets/photos/privacy-phone.webp?responsive';
import racketCourtGreen from '~/assets/photos/racket-court-green.webp?responsive';
import serveReady from '~/assets/photos/serve-ready.webp?responsive';
import shuttleRacket from '~/assets/photos/shuttle-racket.webp?responsive';
import shuttleReady from '~/assets/photos/shuttle-ready.webp?responsive';
import shuttleStanding from '~/assets/photos/shuttle-standing.webp?responsive';

export type Photo = { src: string; srcSet?: string; alt: MessageDescriptor; position?: string };

const local = ({ src, srcset }: typeof hallSunset) => ({ src, srcSet: srcset });

export const PhotoName = z.enum([
  'playersCourt',
  'shuttleRacket',
  'hallSunset',
  'shuttleReady',
  'newspaperBench',
  'shuttleStanding',
  'serveReady',
  'racketCourtGreen',
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
  [PhotoName.enum.shuttleRacket]: {
    ...local(shuttleRacket),
    alt: msg`A shuttle resting on a racket in a sports hall`,
  },
  [PhotoName.enum.hallSunset]: {
    ...local(hallSunset),
    alt: msg`A racket, a shuttle and a phone on a bench in a badminton hall at sunset`,
  },
  [PhotoName.enum.shuttleReady]: {
    ...local(shuttleReady),
    alt: msg`A shuttle on a racket on a green court, with players blurred behind`,
    position: '70% 100%',
  },
  [PhotoName.enum.newspaperBench]: {
    ...local(newspaperBench),
    alt: msg`A person on a bench reading a newspaper that hides their face`,
    position: '50% 15%',
  },
  [PhotoName.enum.shuttleStanding]: {
    ...local(shuttleStanding),
    alt: msg`A shuttle standing on a racket on a court floor`,
    position: '57% 100%',
  },
  [PhotoName.enum.serveReady]: {
    ...local(serveReady),
    alt: msg`A hand holding a shuttle above a racket, ready to serve`,
    position: '50% 40%',
  },
  [PhotoName.enum.racketCourtGreen]: {
    ...local(racketCourtGreen),
    alt: msg`A racket leaning on a shuttle on a green court`,
    position: '60% 100%',
  },
  [PhotoName.enum.bygdohusCourts]: {
    ...local(bygdohusCourts),
    alt: msg`Players training on the courts at Bygdøhus`,
    position: '50% 42%',
  },
  [PhotoName.enum.bygdohusCoaching]: {
    ...local(bygdohusCoaching),
    alt: msg`A coach leading a group session at Bygdøhus`,
    position: '50% 62%',
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
  'boardVisitors',
]);
export type PhotoSlot = z.infer<typeof PhotoSlot>;

export const SLOT_DEFAULTS: Record<PhotoSlot, Photo> = {
  [PhotoSlot.enum.home]: PHOTOS.serveReady,
  [PhotoSlot.enum.startTraining]: PHOTOS.bygdohusCourts,
  [PhotoSlot.enum.startJoin]: PHOTOS.bygdohusCoaching,
  [PhotoSlot.enum.startMembers]: PHOTOS.bygdohusOutside,
  [PhotoSlot.enum.training]: PHOTOS.racketCourtGreen,
  [PhotoSlot.enum.events]: PHOTOS.bygdohusCourts,
  [PhotoSlot.enum.news]: PHOTOS.newspaperBench,
  [PhotoSlot.enum.club]: PHOTOS.bygdohusCoaching,
  [PhotoSlot.enum.venue]: PHOTOS.bygdohusOutside,
  [PhotoSlot.enum.membership]: PHOTOS.shuttleStanding,
  [PhotoSlot.enum.join]: PHOTOS.shuttleReady,
  [PhotoSlot.enum.privacy]: PHOTOS.privacyPhone,
  [PhotoSlot.enum.newsTraining]: PHOTOS.bygdohusCourts,
  [PhotoSlot.enum.newsEvent]: PHOTOS.hallSunset,
  [PhotoSlot.enum.newsVolunteer]: PHOTOS.playersCourt,
  [PhotoSlot.enum.newsClub]: PHOTOS.bygdohusCoaching,
  [PhotoSlot.enum.boardMembers]: PHOTOS.shuttleRacket,
  [PhotoSlot.enum.boardVolunteers]: PHOTOS.hallSunset,
  [PhotoSlot.enum.boardAccess]: PHOTOS.bygdohusOutside,
  [PhotoSlot.enum.boardVisitors]: PHOTOS.newspaperBench,
};
