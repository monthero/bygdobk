import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Container, Divider, Stack, Text, Timeline, Title } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { EVENT_ICONS, EventCard } from '~/components/events';
import { PageIntro } from '~/components/styles';
import { CalendarBlank, PageToolbar, Segmented, SegmentedMulti, type SegmentedOption } from '~/components/ui';
import { EVENT_YEARS, EVENTS_BY_DATE, EventsShow, eventYear, isPast, splitEvents, type ClubEvent } from '~/data/events';
import { PHOTOS } from '~/data/photos';
import { date, dayjs, formatDate, ISO_DAY, LONG_DATE } from '~/utils/dates';
import { STAY } from '~/utils/navigation';

import classes from './EventsPage.module.css';

const BULLET_SIZE = 36;
const ICON_SIZE = 20;
const UPCOMING_CLASSES = { itemBullet: classes.nextBullet };
const PAST_CLASSES = { item: classes.past, itemBullet: classes.pastBullet };
const NOW_CLASSES = { itemTitle: classes.nowTitle };
const YEAR_OPTIONS: SegmentedOption<number>[] = EVENT_YEARS.map((y) => ({ value: y, label: y }));
const NO_YEARS: number[] = [];
const NO_EVENTS: ClubEvent[] = [];
const ALL = 'all';
type ShowFilter = EventsShow | typeof ALL;

const route = getRouteApi('/arrangementer/');

export const EventsPage: FC = () => {
  const { t } = useLingui();
  const { ar: years = NO_YEARS, vis } = route.useSearch();
  const navigate = route.useNavigate();
  const todayIso = dayjs().format(ISO_DAY);
  const { upcoming, past } = useMemo(() => {
    const picked = new Set(years);
    const split = splitEvents(
      todayIso,
      picked.size > 0 ? EVENTS_BY_DATE.filter((e) => picked.has(eventYear(e))) : EVENTS_BY_DATE,
    );
    return {
      upcoming: vis === EventsShow.enum.tidligere ? NO_EVENTS : split.upcoming,
      past: vis === EventsShow.enum.kommende ? NO_EVENTS : split.past,
    };
  }, [todayIso, years, vis]);

  const thisYear = dayjs().year();
  const showToday =
    !vis && (years.length === 0 || (years.some((y) => y <= thisYear) && years.some((y) => y >= thisYear)));
  const nothingPlanned = !EVENTS_BY_DATE.some((e) => !isPast(e, todayIso));
  const isEmpty = upcoming.length === 0 && past.length === 0;

  const showOptions = useMemo<SegmentedOption<ShowFilter>[]>(
    () => [
      { value: ALL, label: t({ message: 'All', comment: 'Events filter option that shows upcoming and past events' }) },
      { value: EventsShow.enum.kommende, label: t({ message: 'Upcoming', comment: 'Events filter option' }) },
      { value: EventsShow.enum.tidligere, label: t({ message: 'Past', comment: 'Events filter option' }) },
    ],
    [t],
  );

  const pickYears = (value: number[]) =>
    navigate({ search: (prev) => ({ ...prev, ar: value.length > 0 ? value : undefined }), ...STAY });
  const pickShow = (value: ShowFilter) =>
    navigate({ search: (prev) => ({ ...prev, vis: value === ALL ? undefined : value }), ...STAY });
  const showAll = () => navigate({ search: {}, ...STAY });

  return (
    <>
      <PageIntro
        photo={PHOTOS.hallSunset}
        title={<Trans>Events</Trans>}
        lede={<Trans>Our tournaments at Bygdøhus run on volunteers. Grab a shift!</Trans>}
      />
      <PageToolbar>
        <Segmented label={t`Show`} options={showOptions} value={vis ?? ALL} onChange={pickShow} />
        {EVENT_YEARS.length > 1 && (
          <>
            <Divider orientation="vertical" className={classes.divider} />
            <SegmentedMulti
              label={t`Year`}
              allLabel={<Trans comment="Year filter option that shows events from every year">All years</Trans>}
              options={YEAR_OPTIONS}
              value={years}
              onChange={pickYears}
            />
          </>
        )}
      </PageToolbar>
      <Container py={40}>
        {isEmpty && (
          <Stack align="center" gap="sm" py={40} ta="center">
            <CalendarBlank width={40} height={40} aria-hidden className={classes.emptyIcon} />
            <Title order={2}>
              <Trans>No events match this filter</Trans>
            </Title>
            <Button variant="light" radius="xl" onClick={showAll}>
              <Trans>Show all events</Trans>
            </Button>
          </Stack>
        )}
        {!isEmpty && (
          <Timeline
            active={showToday ? past.length : past.length - 1}
            reverseActive
            bulletSize={BULLET_SIZE}
            lineWidth={2}
            className={classes.timeline}
          >
            {upcoming.map((event) => {
              const Icon = EVENT_ICONS[event.kind];
              return (
                <Timeline.Item
                  key={event.slug}
                  bullet={<Icon width={ICON_SIZE} height={ICON_SIZE} />}
                  lineVariant="dashed"
                  classNames={UPCOMING_CLASSES}
                >
                  <EventCard event={event} withIcon={false} />
                </Timeline.Item>
              );
            })}
            {showToday && (
              <Timeline.Item
                bullet={<span className={classes.dot} />}
                title={<Trans comment="Marker on the events timeline between upcoming and past events">Today</Trans>}
                classNames={NOW_CLASSES}
              >
                <Text size="sm" c="dimmed" className="tabular">
                  {formatDate(date(todayIso), LONG_DATE)}
                </Text>
                {nothingPlanned && (
                  <Text mt="xs">
                    <Trans>Nothing planned yet. New events show up here.</Trans>
                  </Text>
                )}
              </Timeline.Item>
            )}
            {past.map((event) => {
              const Icon = EVENT_ICONS[event.kind];
              return (
                <Timeline.Item
                  key={event.slug}
                  bullet={<Icon width={ICON_SIZE} height={ICON_SIZE} />}
                  classNames={PAST_CLASSES}
                >
                  <EventCard event={event} withIcon={false} compact />
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Container>
    </>
  );
};
