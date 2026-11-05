import { Trans, useLingui } from '@lingui/react/macro';
import { Button, List, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { ArrowRight, CheckCircle } from '~/components/ui';
import { BRING, CLUB, CURRENT_SEASON, GROUP_SLUGS, GROUPS, PriceKind, type Group, type Price } from '~/data/club';
import { useClosures } from '~/stores/content';
import { dayjs, formatDate } from '~/utils/dates';
import { nextTrainingDay, type TrainingClosure } from '~/utils/training';

import { groupOfPrice } from './offers';

const DAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
const MAX_CLOSED_DAYS = 8;

const nextOpenTraining = (closures: readonly TrainingClosure[], group: Group) => {
  let from = dayjs();
  for (let i = 0; i < MAX_CLOSED_DAYS; i++) {
    const next = nextTrainingDay(closures, group, from);
    if (!next?.closure) return next;
    from = next.day.add(1, 'day');
  }
  return undefined;
};

type Props = { price: Price | undefined; firstName: string; parentName?: string };

export const JoinDone: FC<Props> = ({ price, firstName, parentName }) => {
  const { i18n } = useLingui();
  const closures = useClosures();
  const group = price && groupOfPrice(price);
  const next = useMemo(() => group && nextOpenTraining(closures, group), [closures, group]);
  const session = next?.sessions.at(0);
  const plays = price?.kind !== PriceKind.enum.membership;

  return (
    <Stack align="center" gap="lg" py="xl">
      <Stack align="center" gap="xs" ta="center">
        <CheckCircle width={56} height={56} color="var(--mantine-color-teal-6)" />
        <Title order={2}>
          {parentName ? <Trans>Thanks, {parentName}!</Trans> : <Trans>Welcome to the club, {firstName}!</Trans>}
        </Title>
        <Text size="lg">
          {parentName ? <Trans>{firstName} is signed up. See you on court!</Trans> : <Trans>See you on court!</Trans>}
        </Text>
      </Stack>

      {plays && (
        <Paper withBorder radius="lg" p="lg" w="100%" maw={480}>
          <Stack gap="md">
            {group && next && session && (
              <div>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  <Trans>First training</Trans>
                </Text>
                <Title order={3}>{formatDate(next.day, DAY_FORMAT)}</Title>
                <Text className="tabular">
                  {i18n._(GROUPS[group].name)}, {session.start}–{session.end}, {CLUB.venue}
                </Text>
              </div>
            )}
            <div>
              <Text fw={700}>
                <Trans>Bring</Trans>
              </Text>
              <List spacing={4}>
                {BRING.map((item) => (
                  <List.Item key={item.kind}>{i18n._(item.label)}</List.Item>
                ))}
              </List>
            </div>
            {group ? (
              <Button
                variant="light"
                rightSection={<ArrowRight />}
                renderRoot={(props) => (
                  <Link
                    {...props}
                    to="/trening/$sesong"
                    params={{ sesong: CURRENT_SEASON.id }}
                    search={{ gruppe: GROUP_SLUGS.toSlug(group) }}
                  />
                )}
              >
                <Trans>All {i18n._(GROUPS[group].name)} times</Trans>
              </Button>
            ) : (
              <Button component={Link} to="/trening" variant="light" rightSection={<ArrowRight />}>
                <Trans>See training times</Trans>
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      <Text size="sm" c="dimmed" maw={480} ta="center">
        <Trans>
          In the real flow you would now get an email with the payment request. This demo did not send anything.
        </Trans>
      </Text>
    </Stack>
  );
};
