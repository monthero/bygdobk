import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { getRouteApi, Navigate } from '@tanstack/react-router';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { isPast, type CalendarEvent, type Shift } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { useSitePhoto, useTeams } from '~/cms/siteData';
import { useProfile, useSignedOut } from '~/components/auth/hooks';
import { isVisitorEvent, shiftTime, TeamBadge, type VisitorEvent } from '~/components/events';
import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { HandHeart, PencilSimple, Trash, Trophy, UserPlus, Warning } from '~/components/ui';
import { Team } from '~/data/events';
import { PhotoSlot } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';
import { LoadError } from '~/pages/board/LoadError';
import { date, formatDate, todayIso } from '~/utils/dates';
import { STAY } from '~/utils/navigation';
import { percent } from '~/utils/numbers';
import { volunteerName, type AdminShiftVolunteer } from '~/volunteers/model';
import { useEventVolunteers } from '~/volunteers/queries';

import { DialogKind, type Dialog } from './dialog';
import { PrintShiftPlan } from './PrintShiftPlan';
import { DAY_TITLE, NO_VOLUNTEERS, useShiftPlan, type VolunteersByShift } from './shiftPlan';
import { VolunteerDialog } from './VolunteerDialogs';

import classes from './VolunteersPage.module.css';

const route = getRouteApi('/styret/dugnad');

const EMPTY_ICON_SIZE = 40;

const hasShifts = (e: CalendarEvent): e is VisitorEvent => isVisitorEvent(e) && e.shifts.length > 0;

type Handlers = {
  onAdd: (shift: Shift, taken: number) => void;
  onNote: (volunteer: AdminShiftVolunteer) => void;
  onRemove: (volunteer: AdminShiftVolunteer) => void;
};

const VolunteerRow: FC<{ volunteer: AdminShiftVolunteer } & Omit<Handlers, 'onAdd'>> = ({
  volunteer,
  onNote,
  onRemove,
}) => {
  const { t } = useLingui();
  const name = volunteerName(volunteer);
  return (
    <li className={classes.list__item}>
      <div className={classes.list__who}>
        <Text size="sm" fw={600}>
          {name}
        </Text>
        {volunteer.profile && (
          <Text size="xs" c="dimmed">
            {volunteer.profile.email}
          </Text>
        )}
        {volunteer.note && (
          <Text size="xs" fs="italic">
            {volunteer.note}
          </Text>
        )}
      </div>
      <ActionIcon variant="subtle" color="gray" aria-label={t`Edit note for ${name}`} onClick={() => onNote(volunteer)}>
        <PencilSimple />
      </ActionIcon>
      <ActionIcon variant="subtle" color="red" aria-label={t`Remove ${name}`} onClick={() => onRemove(volunteer)}>
        <Trash />
      </ActionIcon>
    </li>
  );
};

const ShiftPanel = memo<{ shift: Shift; volunteers: readonly AdminShiftVolunteer[] } & Handlers>(
  ({ shift, volunteers, onAdd, onNote, onRemove }) => {
    const { t } = useLingui();
    const taken = volunteers.length;
    const over = taken - shift.spots;
    const full = taken >= shift.spots;
    return (
      <Paper withBorder radius="md" p="md" className={classes.shift} data-over={over > 0 || undefined}>
        <Group justify="space-between" gap="xs">
          <Text fw={700} className="tabular">
            {shiftTime(shift)}
            {shift.setup && (
              <Text span size="sm" c="dimmed" fw={400} ml={6}>
                {t`setup or teardown`}
              </Text>
            )}
          </Text>
          <Group gap={6}>
            {over > 0 && (
              <Badge color="orange" variant="light">
                <Trans comment="Shift has more volunteers than spots, e.g. 1 over">{over} over</Trans>
              </Badge>
            )}
            <Text size="sm" fw={600} className="tabular">
              <Trans comment="How many spots of a volunteer shift are taken, e.g. 2 of 3">
                {taken} of {shift.spots}
              </Trans>
            </Text>
          </Group>
        </Group>
        <Progress
          size="sm"
          radius="xl"
          value={percent(taken, shift.spots)}
          color={full ? 'teal' : undefined}
          aria-label={t`${taken} of ${shift.spots} spots taken`}
        />
        {volunteers.length > 0 ? (
          <ul className={classes.list}>
            {volunteers.map((v) => (
              <VolunteerRow key={v.id} volunteer={v} onNote={onNote} onRemove={onRemove} />
            ))}
          </ul>
        ) : (
          <Text size="sm" c="dimmed">
            <Trans>Nobody yet.</Trans>
          </Text>
        )}
        <Button
          size="xs"
          variant={full ? 'default' : 'light'}
          leftSection={<UserPlus />}
          onClick={() => onAdd(shift, taken)}
          w="fit-content"
        >
          <Trans>Add person</Trans>
        </Button>
      </Paper>
    );
  },
);

type Gap = { team: Team; open: number };
type DayGaps = { day: string; gaps: Gap[] };

const openSpots = (shifts: readonly Shift[], byShift: VolunteersByShift) =>
  shifts.reduce((sum, s) => sum + Math.max(s.spots - (byShift.get(s._key)?.length ?? 0), 0), 0);

const WhoToFind: FC<{ openDays: readonly DayGaps[] }> = ({ openDays }) => {
  const teams = useTeams();
  return (
    <Alert
      variant="light"
      radius="lg"
      color={openDays.length > 0 ? 'yellow' : 'teal'}
      icon={<HandHeart />}
      title={<Trans>Who to find</Trans>}
    >
      {openDays.length === 0 ? (
        <Text size="sm">
          <Trans>Every spot is filled. Nice work!</Trans>
        </Text>
      ) : (
        <Stack gap="xs">
          {openDays.map(({ day, gaps }) => (
            <Group key={day} gap="xs">
              <Text size="sm" fw={600} miw={140} className="capitalize-first">
                {formatDate(date(day), DAY_TITLE)}
              </Text>
              {gaps.map(({ team, open }) => (
                <Badge key={team} variant="default" className="tabular">
                  {teams[team].name} · <Trans comment="Open spots on a volunteer team, e.g. 2 open">{open} open</Trans>
                </Badge>
              ))}
            </Group>
          ))}
        </Stack>
      )}
    </Alert>
  );
};

const LoadingShifts: FC = () => (
  <Stack gap="md" aria-busy>
    <Skeleton height={72} radius="lg" />
    <SimpleGrid cols={{ base: 1, md: 2 }}>
      <Skeleton height={160} radius="md" />
      <Skeleton height={160} radius="md" />
    </SimpleGrid>
  </Stack>
);

const EventVolunteers: FC<{ event: VisitorEvent }> = ({ event }) => {
  const { t } = useLingui();
  const list = useEventVolunteers(event.id);
  const profile = useProfile();
  const volunteers = list.data ?? NO_VOLUNTEERS;
  const failed = profile.isError ? profile : list;
  const [dialog, setDialog] = useState<Dialog>();
  const [opened, setOpened] = useState(false);

  const { days, byShift } = useShiftPlan(event.shifts, volunteers);
  const orphans = useMemo(() => {
    const keys = new Set(event.shifts.map((s) => s._key));
    return volunteers.filter((v) => !keys.has(v.shiftKey));
  }, [event.shifts, volunteers]);
  const openDays = useMemo(
    () =>
      days.flatMap(({ day, teams }) => {
        const gaps = teams
          .map(({ team, shifts }) => ({ team, open: openSpots(shifts, byShift) }))
          .filter((g) => g.open > 0);
        return gaps.length > 0 ? [{ day, gaps }] : [];
      }),
    [days, byShift],
  );

  const openDialog = useCallback((next: Dialog) => {
    setDialog(next);
    setOpened(true);
  }, []);
  const handlers = useMemo<Handlers>(
    () => ({
      onAdd: (shift, taken) => openDialog({ kind: DialogKind.enum.add, shift, taken }),
      onNote: (volunteer) => openDialog({ kind: DialogKind.enum.note, volunteer }),
      onRemove: (volunteer) => openDialog({ kind: DialogKind.enum.remove, volunteer }),
    }),
    [openDialog],
  );
  const closeDialog = useCallback(() => setOpened(false), []);

  if (failed.isError) {
    return (
      <LoadError
        title={t`Couldn't load the volunteers`}
        error={failed.error}
        retrying={failed.isRefetching}
        onRetry={() => void failed.refetch()}
      />
    );
  }

  if (list.isPending) return <LoadingShifts />;

  return (
    <Stack gap="xl">
      <WhoToFind openDays={openDays} />
      {days.map(({ day, teams }) => (
        <Stack key={day} gap="md">
          <Title order={2} size="h3" className="capitalize-first">
            {formatDate(date(day), DAY_TITLE)}
          </Title>
          {teams.map(({ team, shifts }) => (
            <Stack key={team} gap="xs">
              <TeamBadge team={team} />
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {shifts.map((shift) => (
                  <ShiftPanel
                    key={shift._key}
                    shift={shift}
                    volunteers={byShift.get(shift._key) ?? NO_VOLUNTEERS}
                    {...handlers}
                  />
                ))}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>
      ))}
      {orphans.length > 0 && (
        <Alert color="orange" variant="light" icon={<Warning />} title={<Trans>On a shift that's gone</Trans>}>
          <Stack gap="xs">
            <Text size="sm">
              <Trans>These people are on a shift that was removed in Sanity.</Trans>
            </Text>
            <ul className={classes.list}>
              {orphans.map((v) => (
                <VolunteerRow key={v.id} volunteer={v} onNote={handlers.onNote} onRemove={handlers.onRemove} />
              ))}
            </ul>
          </Stack>
        </Alert>
      )}
      <VolunteerDialog eventId={event.id} dialog={dialog} opened={opened} onClose={closeDialog} />
    </Stack>
  );
};

export const VolunteersPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`Volunteer shifts`, t`The board`);
  const photo = useSitePhoto(PhotoSlot.enum.boardVolunteers);
  const { arrangement } = route.useSearch();
  const navigate = route.useNavigate();
  const { events } = useSiteContent();
  const signedOut = useSignedOut();
  const dayIso = todayIso();

  const { upcoming, past } = useMemo(() => {
    const day = date(dayIso);
    const withShifts = events.filter(hasShifts);
    return {
      upcoming: withShifts.filter((e) => !isPast(e, day)),
      past: withShifts.filter((e) => isPast(e, day)).reverse(),
    };
  }, [events, dayIso]);

  const options = useMemo(() => {
    const toItem = (e: VisitorEvent) => ({ value: e.slug, label: e.title });
    const groups = [
      { group: t({ message: 'Upcoming', comment: 'Events filter option' }), items: upcoming.map(toItem) },
      { group: t({ message: 'Past', comment: 'Events filter option' }), items: past.map(toItem) },
    ];
    return groups.filter((g) => g.items.length > 0);
  }, [upcoming, past, t]);

  const event =
    upcoming.find((e) => e.slug === arrangement) ??
    past.find((e) => e.slug === arrangement) ??
    upcoming.at(0) ??
    past.at(0);

  const pickEvent = (value: string | null) => value && navigate({ search: { arrangement: value }, ...STAY });

  if (signedOut) return <Navigate to="/" replace />;

  return (
    <>
      <PageIntro
        eyebrow={<Trans comment="Eyebrow above the page title: the club board">The board</Trans>}
        photo={photo}
        title={<Trans>Volunteer shifts</Trans>}
        lede={<Trans>See who's on each shift, and who we still need.</Trans>}
      />

      {event && (
        <PageToolbar>
          <Select
            aria-label={t`Event`}
            data={options}
            value={event.slug}
            onChange={pickEvent}
            allowDeselect={false}
            radius="xl"
            flex={1}
            miw={0}
            maw={320}
            leftSection={<Trophy />}
          />
          <PrintShiftPlan event={event} />
        </PageToolbar>
      )}

      <Container py={32}>
        {event ? (
          <EventVolunteers key={event.id} event={event} />
        ) : (
          <Stack align="center" gap="sm" py={40} ta="center">
            <Text c="dimmed" lh={0}>
              <HandHeart width={EMPTY_ICON_SIZE} height={EMPTY_ICON_SIZE} aria-hidden />
            </Text>
            <Title order={2} size="h3">
              <Trans>No events with shifts yet</Trans>
            </Title>
            <Text c="dimmed">
              <Trans>Add shifts to an event in Sanity, and they show up here.</Trans>
            </Text>
          </Stack>
        )}
      </Container>
    </>
  );
};
