import type { SiteContent } from '~/cms/content';
import { icsEvent, type Venue, type VisitorEvent } from '~/components/events/eventMeta';
import { CLUB } from '~/data/club';
import { EventKind } from '~/data/events';
import { currentLocale } from '~/i18n/current';
import { LOCALE_META } from '~/i18n/locales';
import { dayjs } from '~/utils/dates';
import type { Place } from '~/utils/maps';

import { PAGE_META, SITE_URL } from './pageMeta';

export type JsonLdData = Record<string, unknown>;

const CONTEXT = 'https://schema.org';
const TIME_ZONE = 'Europe/Oslo';
const CLUB_ID = `${SITE_URL}/#club`;
const LOGO = `${SITE_URL}/icon-512.png`;
const NORWEGIAN_ADDRESS = /^(?<street>.+?),\s*(?<code>\d{4})\s+(?<city>.+)$/;
const NORWAY_ORG_NR_ICD = '0192';

const postalAddress = (address: string) => {
  const parts = NORWEGIAN_ADDRESS.exec(address)?.groups;
  if (!parts) return address;
  return {
    '@type': 'PostalAddress',
    streetAddress: parts.street,
    postalCode: parts.code,
    addressLocality: parts.city,
    addressCountry: 'NO',
  };
};

const place = ({ name, address }: Place) => ({ '@type': 'Place', name, address: postalAddress(address ?? name) });

const ORGANIZER = { '@type': 'SportsClub', '@id': CLUB_ID, name: CLUB.name, url: `${SITE_URL}/` };

export const clubJsonLd = ({ club, socials }: Pick<SiteContent, 'club' | 'socials'>): JsonLdData => {
  const locale = currentLocale();
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'WebSite',
        name: CLUB.name,
        alternateName: CLUB.shortName,
        url: `${SITE_URL}/`,
        inLanguage: LOCALE_META[locale].lang,
      },
      {
        ...ORGANIZER,
        alternateName: CLUB.shortName,
        description: PAGE_META['/'][locale].description,
        logo: LOGO,
        image: `${SITE_URL}/og-image.jpg`,
        foundingDate: String(CLUB.founded),
        knowsAbout: 'Badminton',
        email: club.email,
        address: club.venue?.address && postalAddress(club.venue.address),
        areaServed: { '@type': 'City', name: 'Oslo' },
        iso6523Code: club.orgNr && `${NORWAY_ORG_NR_ICD}:${club.orgNr.replaceAll(/\s/g, '')}`,
        sameAs: socials.length > 0 ? socials.map((social) => social.url) : undefined,
      },
    ],
  };
};

const dateTime = (day: string, time: string | undefined) =>
  time ? dayjs.tz(`${day}T${time}`, TIME_ZONE).format() : day;

export const eventJsonLd = (
  event: VisitorEvent,
  home: Venue | undefined,
  image: string | undefined,
): JsonLdData | undefined => {
  const { url, venue } = icsEvent(event, home);
  if (!event.dateConfirmed || !venue || event.kind === EventKind.enum.trip) return undefined;
  const sports = event.kind === EventKind.enum.tournament;
  return {
    '@context': CONTEXT,
    '@type': sports ? 'SportsEvent' : 'Event',
    name: event.title,
    description: event.description,
    url,
    startDate: dateTime(event.startDate, event.startTime),
    endDate: dateTime(event.endDate ?? event.startDate, event.endTime),
    eventStatus: `${CONTEXT}/EventScheduled`,
    eventAttendanceMode: `${CONTEXT}/OfflineEventAttendanceMode`,
    location: place(venue),
    image: image && new URL(image, SITE_URL).href,
    organizer: ORGANIZER,
    sport: sports ? 'Badminton' : undefined,
  };
};
