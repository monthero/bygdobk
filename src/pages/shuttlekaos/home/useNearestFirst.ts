import { useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { notifyFailed } from '~/pages/board/format';
import type { PublicSession } from '~/shuttlekaos/model';

import { currentPosition, distanceKm, isLocationDenied } from '../locations';

const PERMISSION_KEY = ['geolocation-permission'] as const;
const POSITION_KEY = ['device-position'] as const;
const POSITION_STALE_MS = 5 * 60_000;
const CAN_LOCATE = typeof navigator !== 'undefined' && 'geolocation' in navigator;

type Sortable = Pick<PublicSession, 'id' | 'location' | 'startedAt' | 'scheduledAt' | 'createdAt'>;
type Point = { lat: number; lng: number };

const permissionState = async (): Promise<PermissionState> => {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch {
    return 'prompt';
  }
};

const locate = async (): Promise<Point> => {
  const { coords } = await currentPosition();
  return { lat: coords.latitude, lng: coords.longitude };
};

const startTime = (session: Sortable) => Date.parse(session.startedAt ?? session.scheduledAt ?? session.createdAt);

export const useNearestFirst = <T extends Sortable>(sessions: T[]) => {
  const { t } = useLingui();
  const [byTime, setByTime] = useState(false);
  const permission = useQuery({
    queryKey: PERMISSION_KEY,
    queryFn: permissionState,
    enabled: CAN_LOCATE,
    staleTime: Infinity,
  });
  const position = useQuery({
    queryKey: POSITION_KEY,
    queryFn: locate,
    enabled: permission.data === 'granted',
    staleTime: POSITION_STALE_MS,
    retry: false,
  });
  const here = byTime ? undefined : position.data;

  const distances = useMemo(
    () =>
      new Map(
        here
          ? sessions.flatMap((s) => (s.location ? [[s.id, distanceKm(here.lat, here.lng, s.location)] as const] : []))
          : [],
      ),
    [sessions, here],
  );
  const sorted = useMemo(
    () =>
      sessions.toSorted(
        (a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity) || startTime(a) - startTime(b),
      ),
    [sessions, distances],
  );

  const toggle = async () => {
    if (here) {
      setByTime(true);
      return;
    }
    setByTime(false);
    if (position.data) return;
    const { error } = await position.refetch();
    if (!error) return;
    notifyFailed(
      isLocationDenied(error)
        ? t`Location access is off. Allow it in the browser to see the nearest sessions first.`
        : t`Couldn't find where you are. Try again.`,
    );
  };

  return {
    sessions: sorted,
    distances,
    nearest: here !== undefined,
    locating: position.isFetching,
    canLocate: CAN_LOCATE && permission.data !== 'denied' && !isLocationDenied(position.error),
    toggle,
  };
};

export type NearestFirst = ReturnType<typeof useNearestFirst>;
