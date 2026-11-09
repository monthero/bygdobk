import { useLingui } from '@lingui/react/macro';
import type { MantineColor } from '@mantine/core';
import { useMemo } from 'react';

import { GROUP_COLORS, Group, GroupStatus } from '~/data/club';
import { Team } from '~/data/events';
import { SLOT_DEFAULTS, type PhotoSlot } from '~/data/photos';
import { currentLocale } from '~/i18n/current';
import { CONTENT_FALLBACK, DEFAULT_LOCALE } from '~/i18n/locales';

import {
  useSiteContent,
  type SiteContent,
  type SlotPhoto,
  type Sponsor,
  type TrainingGroup,
  type VolunteerTeam,
} from './content';
import { hotspotPosition, imageUrl } from './images';

export type GroupInfo = Omit<TrainingGroup, 'key'> & { color: MantineColor };

const groupsOf = (groups: SiteContent['groups']) => {
  const byKey = new Map(groups.map((group) => [group.key, group]));
  return Object.fromEntries(
    Group.options.map((key): [Group, GroupInfo] => {
      const group = byKey.get(key);
      return [
        key,
        {
          name: group?.name ?? key,
          who: group?.who,
          coached: group?.coached ?? false,
          status: group?.status ?? GroupStatus.enum.open,
          statusNote: group?.statusNote,
          color: GROUP_COLORS[key],
        },
      ];
    }),
  ) as Record<Group, GroupInfo>;
};

export const useGroups = () => {
  const { groups } = useSiteContent();
  return useMemo(() => groupsOf(groups), [groups]);
};

export type TeamInfo = Omit<VolunteerTeam, 'key'>;

const teamsOf = (teams: SiteContent['teams']) => {
  const byKey = new Map(teams.map((team) => [team.key, team]));
  return Object.fromEntries(
    Team.options.map((key): [Team, TeamInfo] => {
      const team = byKey.get(key);
      return [key, { name: team?.name ?? key, what: team?.what }];
    }),
  ) as Record<Team, TeamInfo>;
};

export const useTeams = () => {
  const { teams } = useSiteContent();
  return useMemo(() => teamsOf(teams), [teams]);
};

export const useClub = () => useSiteContent().club;

export type DealSponsor = Sponsor & { deal: NonNullable<Sponsor['deal']> };

export const hasDeal = (sponsor: Sponsor): sponsor is DealSponsor => sponsor.deal !== undefined;

export type SitePhoto = { src: string; srcSet?: string; alt: string; position?: string };

const WIDTHS = [640, 960, 1440, 2048];
const FALLBACK_WIDTH = 1440;

const altText = (photo: SlotPhoto) => {
  const locale = currentLocale();
  const { alt } = photo;
  return alt?.[locale] || alt?.[CONTENT_FALLBACK[locale]] || alt?.[DEFAULT_LOCALE] || '';
};

const cmsPhoto = (photo: SlotPhoto): SitePhoto => ({
  src: imageUrl(photo, FALLBACK_WIDTH),
  srcSet: WIDTHS.map((w) => `${imageUrl(photo, w)} ${w}w`).join(', '),
  alt: altText(photo),
  position: hotspotPosition(photo.hotspot),
});

export const useSitePhoto = (slot: PhotoSlot): SitePhoto => {
  const { i18n } = useLingui();
  const photo = useSiteContent().photos[slot];
  return useMemo(() => {
    if (photo) return cmsPhoto(photo);
    const fallback = SLOT_DEFAULTS[slot];
    return { ...fallback, alt: i18n._(fallback.alt) };
  }, [photo, slot, i18n]);
};
