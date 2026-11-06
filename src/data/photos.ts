import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

import bygdohusCoaching from '~/assets/photos/bygdohus-coaching.webp';
import bygdohusCourts from '~/assets/photos/bygdohus-courts.webp';
import bygdohusOutside from '~/assets/photos/bygdohus-outside.webp';
import hallSunset from '~/assets/photos/hall-sunset.webp';
import playerServe from '~/assets/photos/player-serve.webp';
import playersCourt from '~/assets/photos/players-court.webp';
import privacyPhone from '~/assets/photos/privacy-phone.webp';
import racketCourt from '~/assets/photos/racket-court.webp';
import shuttleRacket from '~/assets/photos/shuttle-racket.webp';

export type Photo = { src: string; alt: MessageDescriptor; position?: string };

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
    src: playersCourt,
    alt: msg`A shuttle on a racket, with players on green courts behind`,
  },
  [PhotoName.enum.racketCourt]: {
    src: racketCourt,
    alt: msg`Two rackets and a shuttle on a court line`,
  },
  [PhotoName.enum.shuttleRacket]: {
    src: shuttleRacket,
    alt: msg`A shuttle resting on a racket in a sports hall`,
  },
  [PhotoName.enum.playerServe]: {
    src: playerServe,
    alt: msg`A player getting ready to serve`,
  },
  [PhotoName.enum.hallSunset]: {
    src: hallSunset,
    alt: msg`An empty badminton hall at sunset`,
  },
  [PhotoName.enum.bygdohusCourts]: {
    src: bygdohusCourts,
    alt: msg`Players training on the courts at Bygdøhus`,
  },
  [PhotoName.enum.bygdohusCoaching]: {
    src: bygdohusCoaching,
    alt: msg`A coach leading a group session at Bygdøhus`,
  },
  [PhotoName.enum.bygdohusOutside]: {
    src: bygdohusOutside,
    alt: msg`Bygdøhus seen from the car park`,
  },
  [PhotoName.enum.privacyPhone]: {
    src: privacyPhone,
    alt: msg`A woman looking at her phone, her face covered by a digital grid`,
    position: 'center 22%',
  },
} satisfies Record<PhotoName, Photo>;
