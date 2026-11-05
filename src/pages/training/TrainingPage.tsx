import { Trans, useLingui } from '@lingui/react/macro';
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getRouteApi, Link } from '@tanstack/react-router';
import { memo, useMemo, type FC } from 'react';

import { useCanEdit } from '~/components/auth';
import { PageIntro } from '~/components/styles';
import { slotsOf } from '~/components/styles/court/schedule';
import { AddClosureModal, BringList, ClosureList, TrainingSchedule } from '~/components/training';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarBlank,
  Info,
  MapPin,
  PageToolbar,
  Plus,
  Segmented,
  type SegmentedOption,
  VenuePhoto,
} from '~/components/ui';
import {
  CLUB,
  CURRENT_SEASON,
  GROUP_SLUGS,
  GROUPS,
  Group as TrainingGroup,
  seasonById,
  SEASONS,
  type Season,
} from '~/data/club';
import { PHOTOS } from '~/data/photos';
import { listFormat } from '~/i18n/current';
import { useClosures } from '~/stores/content';
import { weekdayName } from '~/utils/dates';
import { MAP_LINK } from '~/utils/maps';
import { STAY } from '~/utils/navigation';
import { closuresInSeason } from '~/utils/training';

import classes from './TrainingPage.module.css';

export const BRING_HASH = 'ta-med';

const route = getRouteApi('/trening/$sesong');

const ALL = 'all';
type GroupFilter = TrainingGroup | typeof ALL;
const SEASON_OPTIONS = SEASONS.map((s) => ({ value: s.id, label: s.label }));
const SEASON_CLASS_NAMES = { input: classes.season };
const NO_BREAKS = <Trans>No breaks this season.</Trans>;

const timesOf = (group: TrainingGroup, season: Season) =>
  slotsOf(group, season.schedule)
    .map(
      (slot) => `${listFormat().format(slot.weekdays.map((d) => weekdayName(d, 'short')))} ${slot.start}–${slot.end}`,
    )
    .join(', ');

const GroupLine = memo<{ group: TrainingGroup; season: Season }>(({ group, season }) => {
  const { i18n } = useLingui();
  const { name, who, coached, color } = GROUPS[group];
  return (
    <li className={classes.group}>
      <Badge color={color} variant="light" size="lg" className={classes.name}>
        {i18n._(name)}
      </Badge>
      <Text className={classes.who}>{i18n._(who)}</Text>
      <Text size="sm" c="dimmed" className={classes.coach}>
        {coached ? <Trans>With coach</Trans> : <Trans>No coach</Trans>}
      </Text>
      <Text fw={600} className={classes.times}>
        {timesOf(group, season)}
      </Text>
      <Anchor
        fw={600}
        size="sm"
        className={classes.join}
        renderRoot={(props) => (
          <Link {...props} to="/medlemskap/bli-medlem" search={{ gruppe: GROUP_SLUGS.toSlug(group) }} />
        )}
      >
        <Trans>Prices and joining</Trans> <ArrowRight />
      </Anchor>
    </li>
  );
});

export const TrainingPage: FC = () => {
  const { i18n, t } = useLingui();
  const { sesong } = route.useParams();
  const { gruppe } = route.useSearch();
  const navigate = route.useNavigate();
  const season = seasonById(sesong) ?? CURRENT_SEASON;
  const group = GROUP_SLUGS.fromSlug(gruppe);
  const isCurrent = season.id === CURRENT_SEASON.id;

  const all = useClosures();
  const closures = useMemo(() => closuresInSeason(all, season), [all, season]);
  const canEdit = useCanEdit();
  const [adding, { open: openAdd, close: closeAdd }] = useDisclosure(false);

  const groups = group ? [group] : TrainingGroup.options;

  const groupOptions = useMemo<SegmentedOption<GroupFilter>[]>(
    () => [
      { value: ALL, label: t`All groups` },
      ...TrainingGroup.options.map((g) => ({ value: g, label: i18n._(GROUPS[g].name), color: GROUPS[g].color })),
    ],
    [i18n, t],
  );

  const pickGroup = (value: GroupFilter) =>
    navigate({
      search: { gruppe: value === ALL ? undefined : GROUP_SLUGS.toSlug(value) },
      ...STAY,
    });

  const pickSeason = (value: string | null) =>
    value && navigate({ to: '/trening/$sesong', params: { sesong: value }, search: (prev) => prev, ...STAY });

  return (
    <>
      <PageIntro
        photo={PHOTOS.bygdohusCourts}
        eyebrow={<Trans>Season {season.label}</Trans>}
        title={<Trans>Training</Trans>}
        lede={<Trans>We train on Monday, Tuesday and Thursday evenings, from August to June.</Trans>}
      />

      <PageToolbar>
        <Select
          aria-label={t`Season`}
          data={SEASON_OPTIONS}
          value={season.id}
          onChange={pickSeason}
          allowDeselect={false}
          radius="xl"
          w={140}
          leftSection={<CalendarBlank />}
          classNames={SEASON_CLASS_NAMES}
        />
        <Segmented label={t`Group`} options={groupOptions} value={group ?? ALL} onChange={pickGroup} />
      </PageToolbar>

      <Container py={40}>
        <Stack gap={32}>
          <Stack gap="md">
            <Title order={2}>
              <Trans>Groups</Trans>
            </Title>
            <Paper withBorder radius="lg" px="lg" py="xs">
              <ul className={classes.groups}>
                {groups.map((g) => (
                  <GroupLine key={g} group={g} season={season} />
                ))}
              </ul>
            </Paper>
          </Stack>
          <Stack gap="lg">
            <Title order={2}>
              <Trans>Weekly schedule</Trans>
            </Title>
            {!isCurrent && (
              <Alert icon={<Info />} color="gray" variant="light">
                <Trans>This is an earlier season. Times may have changed since.</Trans>
              </Alert>
            )}
            <TrainingSchedule season={season} group={group} />
            <Alert icon={<Info />} color="brand" variant="light">
              <Trans>
                Breaks and cancellations show up here as soon as the club posts them. Members also get them in Spond.
              </Trans>
            </Alert>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Paper withBorder radius="lg" p="lg" className={classes.venue}>
              <VenuePhoto />
              <Stack gap="sm">
                <Group gap={8}>
                  <ThemeIcon variant="light" radius="xl">
                    <MapPin />
                  </ThemeIcon>
                  <Title order={3}>{CLUB.venue}</Title>
                </Group>
                <Text>{CLUB.address}</Text>
                <Anchor {...MAP_LINK} fw={600}>
                  <Trans>Open in maps</Trans> <ArrowUpRight />
                </Anchor>
              </Stack>
            </Paper>
            <BringList id={BRING_HASH} />
          </SimpleGrid>
        </Stack>
      </Container>

      <Container pb={40}>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={2}>
              <Trans>Breaks this season</Trans>
            </Title>
            {canEdit && (
              <Button variant="light" leftSection={<Plus />} onClick={openAdd}>
                <Trans>Add break</Trans>
              </Button>
            )}
          </Group>
          <ClosureList closures={closures} editable={canEdit} empty={NO_BREAKS} />
        </Stack>
      </Container>
      <AddClosureModal opened={adding} onClose={closeAdd} />
    </>
  );
};
