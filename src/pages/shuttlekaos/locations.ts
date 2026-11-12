import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { z } from 'zod';

import { queryClient } from '~/cms/queryClient';
import type { SessionLocation } from '~/shuttlekaos/model';
import { getSupabase } from '~/supabase/client';
import { foldAe } from '~/utils/search';

const LOCATIONS_KEY = 'shuttlekaos-locations';
const NEAR_KM = 0.5;
const EARTH_RADIUS_KM = 6371;
const POSITION_TIMEOUT_MS = 15_000;
const POSITION_MAX_AGE_MS = 60_000;
const STALE_MS = 3_600_000;

const LocationRow = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  sort_order: z.number(),
});

const toLocation = ({ id, name, address, lat, lng }: z.infer<typeof LocationRow>): SessionLocation => ({
  locationId: id,
  name,
  address,
  lat,
  lng,
});

const fetchLocations = async () => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('shuttlekaos_locations')
    .select('id, name, address, lat, lng, sort_order')
    .order('sort_order');
  if (error) throw error;
  return z
    .array(LocationRow)
    .parse(data)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'nb'))
    .map(toLocation);
};

type LocationsKey = readonly [typeof LOCATIONS_KEY];

export const useLocations = <T = SessionLocation[]>(
  options?: Omit<UseQueryOptions<SessionLocation[], Error, T, LocationsKey>, 'queryKey' | 'queryFn'>,
) => useQuery({ queryKey: [LOCATIONS_KEY] as const, queryFn: fetchLocations, staleTime: STALE_MS, ...options });

const FUSE_OPTIONS: IFuseOptions<SessionLocation> = {
  keys: [
    { name: 'name', weight: 2, getFn: (location) => foldAe(location.name) },
    { name: 'address', weight: 1, getFn: (location) => foldAe(location.address ?? '') },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  ignoreDiacritics: true,
  useTokenSearch: true,
  tokenMatch: 'all',
};

export const filterLocations = (locations: SessionLocation[], query: string) => {
  const text = query.trim();
  if (!text) return locations;
  return new Fuse(locations, FUSE_OPTIONS).search(foldAe(text)).map((result) => result.item);
};

export const mapsUrl = (location: SessionLocation) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.lat},${location.lng}`)}`;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceKm = (lat: number, lng: number, location: SessionLocation) => {
  const dLat = toRadians(location.lat - lat);
  const dLng = toRadians(location.lng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat)) * Math.cos(toRadians(location.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

const nearest = (locations: SessionLocation[], lat: number, lng: number) => {
  let best: { location: SessionLocation; km: number } | null = null;
  for (const location of locations) {
    const km = distanceKm(lat, lng, location);
    if (!best || km < best.km) best = { location, km };
  }
  return best && best.km <= NEAR_KM ? best.location : null;
};

const currentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not available'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: POSITION_TIMEOUT_MS,
      maximumAge: POSITION_MAX_AGE_MS,
    });
  });

const locateNearest = async () => {
  const [position, locations] = await Promise.all([
    currentPosition(),
    queryClient.fetchQuery({ queryKey: [LOCATIONS_KEY], queryFn: fetchLocations, staleTime: STALE_MS }),
  ]);
  return nearest(locations, position.coords.latitude, position.coords.longitude);
};

export const isLocationDenied = (error: unknown) =>
  typeof GeolocationPositionError !== 'undefined' &&
  error instanceof GeolocationPositionError &&
  error.code === GeolocationPositionError.PERMISSION_DENIED;

export const useNearestLocation = (options?: Omit<UseMutationOptions<SessionLocation | null>, 'mutationFn'>) =>
  useMutation({ mutationFn: locateNearest, ...options });
