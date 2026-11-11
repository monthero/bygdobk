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
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { memo, useId, useMemo, type FC } from 'react';

import type { Season } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { useGroups, useSitePhoto, type GroupInfo } from '~/cms/siteData';
import { CalendarFeed, calendarFeedUrl } from '~/components/calendar';
import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { groupTimes } from '~/components/styles/court/schedule';
import { BringList, ClosureList, GroupStatusBadge, TrainingSchedule } from '~/components/training';
import {
  AddressLink,
  ArrowRight,
  ArrowUpRight,
  CalendarBlank,
  CalendarPlus,
  Info,
  MapPin,
  Segmented,
  type SegmentedOption,
  VenuePhoto,
  Warning,
} from '~/components/ui';
import { GROUP_SLUGS, Group as TrainingGroup, GroupStatus } from '~/data/club';
import { contactLink, ContactTopic } from '~/data/contact';
import { PhotoSlot } from '~/data/photos';
import { usePageMetaTitle } from '~/hooks/usePageTitle';
import { useSeasons } from '~/hooks/useSeasons';
import { listFormat } from '~/i18n/current';
import { formatDate, weekdayName } from '~/utils/dates';
import { mapLink } from '~/utils/maps';
import { STAY } from '~/utils/navigation';
import { seasonTraining, trainingBreaks, weeklySessions, type Session } from '~/utils/training';

import classes from './TrainingPage.module.css';

export const BRING_HASH = 'ta-med';

const ALL = 'all';
type GroupFilter = TrainingGroup | typeof ALL;
const SEASON_CLASS_NAMES = { input: classes.season };
const NO_BREAKS = <Trans>No breaks this season.</Trans>;
const MONTH: Intl.DateTimeFormatOptions = { month: 'long' };

const JoinLink: FC<{ group: TrainingGroup; status: GroupStatus }> = ({ group, status }) => {
  const { t } = useLingui();
  if (status === GroupStatus.enum.full) {
    const groupLink = contactLink(ContactTopic.enum.training, t`Hi! Let me know when a spot opens up in a group.`);
    return (
      <Anchor fw={600} size="sm" className={classes.link} renderRoot={(props) => <Link {...props} {...groupLink} />}>
        <Trans>Ask about a spot</Trans> <ArrowRight />
      </Anchor>
    );
  }
  return (
    <Anchor
      fw={600}
      size="sm"
      className={classes.link}
      renderRoot={(props) => (
        <Link {...props} to="/medlemskap/bli-medlem" search={{ gruppe: GROUP_SLUGS.toSlug(group) }} />
      )}
    >
      {status === GroupStatus.enum.waitlist ? <Trans>Join the waiting list</Trans> : <Trans>Prices and joining</Trans>}{' '}
      <ArrowRight />
    </Anchor>
  );
};

const GroupCalendar: FC<{ group: TrainingGroup; name: string; nameId: string }> = ({ group, name, nameId }) => (
  <CalendarFeed
    url={calendarFeedUrl(group)}
    title={<Trans>{name} in your calendar</Trans>}
    note={<Trans>Breaks and canceled sessions update by themselves.</Trans>}
    renderTarget={(props) => (
      <Anchor
        component="button"
        type="button"
        fw={600}
        size="sm"
        className={classes.link}
        aria-describedby={nameId}
        {...props}
      >
        <CalendarPlus />
        <Trans>Add to calendar</Trans>
      </Anchor>
    )}
  />
);

const GroupLine = memo<{ group: TrainingGroup; info: GroupInfo; sessions: Session[] }>(({ group, info, sessions }) => {
  const nameId = useId();
  return (
    <li className={classes.group}>
      <Badge id={nameId} color={info.color} variant="light" size="lg" className={classes.name}>
        {info.name}
      </Badge>
      <Stack gap={4} align="flex-start" className={classes.who}>
        {info.who && <Text>{info.who}</Text>}
        {info.status !== GroupStatus.enum.open && (
          <Group gap="xs" wrap="nowrap" align="baseline">
            <GroupStatusBadge status={info.status} />
            {info.statusNote && (
              <Text size="sm" c="dimmed">
                {info.statusNote}
              </Text>
            )}
          </Group>
        )}
      </Stack>
      <Text size="sm" c="dimmed" className={classes.coach}>
        {info.coached ? <Trans>With coach</Trans> : <Trans>No coach</Trans>}
      </Text>
      <Text fw={600} className={classes.times}>
        {groupTimes(group, sessions).join(', ')}
      </Text>
      <div className={classes.actions}>
        <JoinLink group={group} status={info.status} />
        <GroupCalendar group={group} name={info.name} nameId={nameId} />
      </div>
    </li>
  );
});

const SpondCode: FC<{ code: string }> = ({ code }) => (
  <Text inherit>
    <Trans comment="Spond is the app the club uses for training. Groups and Enter code are the labels in the Spond app">
      New in Spond? In the app, go to Groups, tap Enter code and type{' '}
      <Text span inherit fw={700} className="tabular">
        {code}
      </Text>
      . The board then lets you in.
    </Trans>
  </Text>
);

export const TrainingPage: FC = () => {
  const { t } = useLingui();
  usePageMetaTitle('/trening');
  const photo = useSitePhoto(PhotoSlot.enum.training);
  const { sesong } = useParams({ strict: false });
  const { gruppe } = useSearch({ strict: false });
  const navigate = useNavigate();
  const { events, club } = useSiteContent();
  const { venue } = club;
  const groupInfo = useGroups();
  const { seasons, current } = useSeasons();
  const season: Season = seasons.find((s) => s.id === sesong) ?? current;
  const group = GROUP_SLUGS.fromSlug(gruppe);
  const isCurrent = season.id === current.id;
  const currentLabel = current.label;

  const seasonOptions = useMemo(() => seasons.map((s) => ({ value: s.id, label: s.label })), [seasons]);
  const sessions = useMemo(() => weeklySessions(seasonTraining(events, season)), [events, season]);
  const otherHalls = useMemo(() => {
    const halls = new Map<string, NonNullable<Session['venue']>>();
    for (const s of sessions) if (s.venue) halls.set(s.venue.name, s.venue);
    return Array.from(halls.values());
  }, [sessions]);
  const breaks = useMemo(() => trainingBreaks(events, season.start, season.end), [events, season]);
  const weekdays = listFormat().format(
    Array.from(new Set(sessions.values().map((s) => s.weekday)), (d) => weekdayName(d)),
  );
  const fromMonth = formatDate(season.start, MONTH);
  const toMonth = formatDate(season.end, MONTH);

  const groups = group ? [group] : TrainingGroup.options;

  const groupOptions = useMemo<SegmentedOption<GroupFilter>[]>(
    () => [
      { value: ALL, label: t`All groups` },
      ...TrainingGroup.options.map((g) => ({ value: g, label: groupInfo[g].name, color: groupInfo[g].color })),
    ],
    [groupInfo, t],
  );

  const pickGroup = (value: GroupFilter) =>
    navigate({
      to: '.',
      search: { gruppe: value === ALL ? undefined : GROUP_SLUGS.toSlug(value) },
      ...STAY,
    });

  const pickSeason = (value: string | null) => {
    if (!value) return;
    if (value === current.id) void navigate({ to: '/trening', search: { gruppe }, ...STAY });
    else void navigate({ to: '/trening/$sesong', params: { sesong: value }, search: { gruppe }, ...STAY });
  };

  return (
    <>
      <PageIntro
        photo={photo}
        eyebrow={<Trans>Season {season.label}</Trans>}
        title={<Trans>Training</Trans>}
        lede={
          sessions.length > 0 ? (
            <Trans>
              We train on {weekdays} evenings, from {fromMonth} to {toMonth}.
            </Trans>
          ) : (
            <Trans>Training times for this season are coming soon.</Trans>
          )
        }
      />

      <PageToolbar>
        <Select
          aria-label={t`Season`}
          data={seasonOptions}
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
          {!isCurrent && (
            <Alert icon={<Warning />} color="yellow" variant="filled" autoContrast>
              <Group justify="space-between" gap="sm">
                <Text inherit fw={600}>
                  <Trans>This is an earlier season. Times may have changed since.</Trans>
                </Text>
                <Button
                  size="xs"
                  variant="white"
                  color="dark"
                  rightSection={<ArrowRight />}
                  renderRoot={(props) => <Link {...props} to="/trening" search={{ gruppe }} />}
                >
                  <Trans>Go to season {currentLabel}</Trans>
                </Button>
              </Group>
            </Alert>
          )}
          <Stack gap="md">
            <Title order={2}>
              <Trans>Groups</Trans>
            </Title>
            <Paper withBorder radius="lg" px="lg" py="xs">
              <ul className={classes.groups}>
                {groups.map((g) => (
                  <GroupLine key={g} group={g} info={groupInfo[g]} sessions={sessions} />
                ))}
              </ul>
            </Paper>
          </Stack>
          <Stack gap="lg">
            <Title order={2}>
              <Trans>Weekly schedule</Trans>
            </Title>
            <TrainingSchedule season={season} group={group} />
            <Alert icon={<Info />} color="brand" variant="light">
              <Stack gap={6}>
                <Text inherit>
                  <Trans>
                    Breaks and cancellations show up here as soon as the club posts them. Members also get them in
                    Spond.
                  </Trans>
                </Text>
                {club.spondCode && <SpondCode code={club.spondCode} />}
              </Stack>
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
                  <Title order={3}>{venue?.name}</Title>
                </Group>
                <Text>{venue?.address}</Text>
                {venue && (
                  <Anchor {...mapLink(venue)} fw={600}>
                    <Trans>Open in maps</Trans> <ArrowUpRight />
                  </Anchor>
                )}
                {otherHalls.length > 0 && (
                  <Stack gap={4} mt="xs">
                    <Text size="sm" fw={600}>
                      <Trans>Some sessions this season are elsewhere:</Trans>
                    </Text>
                    {otherHalls.map((hall) => (
                      <Text key={hall.name} size="sm">
                        <AddressLink place={hall} />
                      </Text>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
            <BringList id={BRING_HASH} />
          </SimpleGrid>
        </Stack>
      </Container>

      <Container pb={40}>
        <Stack gap="md">
          <Title order={2}>
            <Trans>Breaks this season</Trans>
          </Title>
          <ClosureList breaks={breaks} empty={NO_BREAKS} />
        </Stack>
      </Container>
    </>
  );
};
