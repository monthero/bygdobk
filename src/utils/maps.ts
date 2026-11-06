import { CLUB } from '~/data/club';

export const FULL_ADDRESS = `${CLUB.venue}, ${CLUB.address}`;

const GOOGLE_MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=';
const QUERY = encodeURIComponent(FULL_ADDRESS);
const IOS = /iPad|iPhone|iPod/;

const mapHref = () => {
  const { userAgent, maxTouchPoints } = navigator;
  if (IOS.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1)) {
    return `https://maps.apple.com/?q=${QUERY}`;
  }
  if (userAgent.includes('Android')) return `geo:0,0?q=${QUERY}`;
  return `${GOOGLE_MAPS_SEARCH}${QUERY}`;
};

const HREF = mapHref();

export const MAP_LINK = HREF.startsWith('https:')
  ? { href: HREF, target: '_blank', rel: 'noopener noreferrer' }
  : { href: HREF };

export const venueMapUrl = ({ name, address, mapUrl }: { name: string; address?: string; mapUrl?: string }) =>
  mapUrl ?? `${GOOGLE_MAPS_SEARCH}${encodeURIComponent(address ?? name)}`;
