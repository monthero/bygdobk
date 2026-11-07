export type Place = { name: string; address?: string; mapUrl?: string };

const GOOGLE_MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=';
const IOS = /iPad|iPhone|iPod/;

const deviceMapHref = (query: string) => {
  const { userAgent, maxTouchPoints } = navigator;
  if (IOS.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1)) {
    return `https://maps.apple.com/?q=${query}`;
  }
  if (userAgent.includes('Android')) return `geo:0,0?q=${query}`;
  return `${GOOGLE_MAPS_SEARCH}${query}`;
};

export const placeText = ({ name, address }: Place) => [name, address].filter(Boolean).join(', ');

export const mapLink = (place: Place) => {
  const href = place.mapUrl ?? deviceMapHref(encodeURIComponent(placeText(place)));
  return href.startsWith('https:') ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };
};
