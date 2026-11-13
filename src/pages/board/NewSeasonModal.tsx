import { plural } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { useMemo, type FC } from 'react';

import type { Season } from '~/cms/calendar';
import type { Plan } from '~/cms/content';
import { CalendarPlus, Warning } from '~/components/ui';
import { PriceKind } from '~/data/club';
import {
  MembershipStatus,
  seasonDates,
  type AdminMembership,
  type Membership,
  type MembershipInput,
} from '~/memberships/model';
import { membershipErrorMessage, useCopySeason, useSeasonMemberships } from '~/memberships/queries';
import { planTotal } from '~/pages/join/offers';

import { formatPeriod, notifyDone, previousSeason } from './format';
import { LoadError } from './LoadError';

const RENEWABLE = new Set<PriceKind>([PriceKind.enum.season, PriceKind.enum.membership]);
const EMPTY: AdminMembership[] = [];

const holderKey = (m: Pick<Membership, 'profileId' | 'playerName' | 'planId'>) =>
  [m.profileId ?? '', m.playerName?.trim().toLowerCase() ?? '', m.planId].join('|');

type Renewals = { rows: MembershipInput[]; skipped: number; oneOff: number };

const renewalsOf = (
  previous: readonly AdminMembership[],
  target: readonly AdminMembership[],
  plans: ReadonlyMap<string, Plan>,
  season: Season,
): Renewals => {
  const taken = new Set(target.map(holderKey));
  const added = new Set<string>();
  const dates = seasonDates(season);
  const rows: MembershipInput[] = [];
  let skipped = 0;
  let oneOff = 0;
  for (const m of previous) {
    const plan = plans.get(m.planId);
    const key = holderKey(m);
    if (m.status !== MembershipStatus.enum.active || added.has(key)) continue;
    if (plan && !RENEWABLE.has(plan.kind)) {
      oneOff += 1;
      continue;
    }
    if (taken.has(key)) {
      skipped += 1;
      continue;
    }
    added.add(key);
    rows.push({
      profileId: m.profileId,
      playerName: m.playerName,
      planId: m.planId,
      ...dates,
      priceNok: plan ? planTotal(plan) : m.priceNok,
      paidAt: null,
      paymentMethod: null,
      note: null,
    });
  }
  return { rows, skipped, oneOff };
};

type Props = {
  opened: boolean;
  onClose: () => void;
  season: Season;
  target: readonly AdminMembership[];
  plans: ReadonlyMap<string, Plan>;
};

const NewSeasonBody: FC<Omit<Props, 'opened'>> = ({ onClose, season, target, plans }) => {
  const { i18n, t } = useLingui();
  const from = previousSeason(season.id);
  const previousQuery = useSeasonMemberships(from.id);
  const previous = previousQuery.data ?? EMPTY;
  const copy = useCopySeason();
  const { rows, skipped, oneOff } = useMemo(
    () => renewalsOf(previous, target, plans, season),
    [previous, target, plans, season],
  );
  const toLabel = season.label;
  const fromLabel = from.label;
  const added = rows.length;
  const period = formatPeriod(seasonDates(season));

  const confirm = () =>
    copy.mutate(
      { fromSeasonId: from.id, toSeasonId: season.id, build: (p, now) => renewalsOf(p, now, plans, season).rows },
      {
        onSuccess: (count) => {
          notifyDone(
            count > 0
              ? t`Added ${plural(count, { one: '# membership', other: '# memberships' })} to ${toLabel}`
              : t`Everyone from ${fromLabel} is already in ${toLabel}.`,
          );
          onClose();
        },
      },
    );

  if (previousQuery.isPending) {
    return (
      <Group gap="sm" py="md" c="dimmed" aria-busy>
        <Loader size="sm" />
        <Text>
          <Trans>Looking at season {fromLabel}…</Trans>
        </Text>
      </Group>
    );
  }

  if (previousQuery.isError) {
    return (
      <LoadError
        title={t`Couldn't load season ${fromLabel}`}
        error={previousQuery.error}
        retrying={previousQuery.isRefetching}
        onRetry={() => void previousQuery.refetch()}
      />
    );
  }

  return (
    <Stack gap="md">
      {added > 0 && (
        <>
          <Text>
            <Trans>
              Copy the members from {fromLabel} to {toLabel}?
            </Trans>
          </Text>
          <Text size="sm" c="dimmed">
            <Trans>Same people and plans, at today's prices. They start as not paid. Period: {period}.</Trans>
          </Text>
        </>
      )}
      {added === 0 && skipped === 0 && (
        <Text>
          <Trans>There's no one in {fromLabel} to copy.</Trans>
        </Text>
      )}
      {added === 0 && skipped > 0 && (
        <Text>
          <Trans>
            Everyone from {fromLabel} is already in {toLabel}.
          </Trans>
        </Text>
      )}
      {added > 0 && skipped > 0 && (
        <Text size="sm" c="dimmed">
          <Plural
            value={skipped}
            one="# already has the same plan this season and is skipped."
            other="# already have the same plan this season and are skipped."
          />
        </Text>
      )}
      {oneOff > 0 && (
        <Text size="sm" c="dimmed">
          <Plural
            value={oneOff}
            one="# drop-in or trial is not copied."
            other="# drop-ins and trials are not copied."
          />
        </Text>
      )}
      {copy.isError && (
        <Alert color="red" variant="light" icon={<Warning />}>
          {i18n._(membershipErrorMessage(copy.error))}
        </Alert>
      )}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          {added > 0 ? <Trans>Cancel</Trans> : <Trans>Close</Trans>}
        </Button>
        {added > 0 && (
          <Button leftSection={<CalendarPlus />} loading={copy.isPending} onClick={confirm}>
            <Plural value={added} one="Copy # membership" other="Copy # memberships" />
          </Button>
        )}
      </Group>
    </Stack>
  );
};

export const NewSeasonModal: FC<Props> = ({ opened, onClose, ...rest }) => {
  const { t } = useLingui();
  const label = rest.season.label;
  return (
    <Modal opened={opened} onClose={onClose} title={t`Start season ${label}`} centered>
      <NewSeasonBody key={rest.season.id} onClose={onClose} {...rest} />
    </Modal>
  );
};
