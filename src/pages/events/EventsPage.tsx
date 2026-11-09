import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Container, Select, Stack, Text, Timeline, Title } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { isPast } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { useSitePhoto } from '~/cms/siteData';
import { SubscribeButton } from '~/components/calendar';
import { EVENT_ICONS, EventCard, isVisitorEvent, type VisitorEvent } from '~/components/events';
import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { CalendarBlank, Segmented, type SegmentedOption } from '~/components/ui';
import { EventsShow } from '~/data/events';
import { PhotoSlot } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';
import { date, formatDate, LONG_DATE, today, todayIso } from '~/utils/dates';
import { STAY } from '~/utils/navigation';

import classes from './EventsPage.module.css';

const BULLET_SIZE = 36;
const ICON_SIZE = 20;
const UPCOMING_CLASSES = { itemBullet: classes.nextBullet };
const PAST_CLASSES = { item: classes.past, itemBullet: classes.pastBullet };
const NOW_CLASSES = { itemTitle: classes.nowTitle };
const YEAR_CLASS_NAMES = { input: classes.year };
const NO_EVENTS: VisitorEvent[] = [];
const ALL = 'all';
type ShowFilter = EventsShow | typeof ALL;

const route = getRouteApi('/arrangementer/');

const eventYear = (event: VisitorEvent) => date(event.startDate).year();

export const EventsPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`Events`);
  const photo = useSitePhoto(PhotoSlot.enum.events);
  const { ar, vis } = route.useSearch();
  const navigate = route.useNavigate();
  const { events } = useSiteContent();
  const dayIso = todayIso();

  const visible = useMemo(() => events.filter(isVisitorEvent), [events]);
  const years = useMemo(() => [...new Set(visible.values().map(eventYear))].sort((a, b) => b - a), [visible]);
  const yearOptions = useMemo(() => Array.from(years, String), [years]);
  const thisYear = date(dayIso).year();
  const defaultYear = years.includes(thisYear) ? thisYear : years.at(0);
  const year = ar !== undefined && years.includes(ar) ? ar : defaultYear;

  const { upcoming, past, nothingPlanned } = useMemo(() => {
    const day = date(dayIso);
    const shown = visible.filter((e) => eventYear(e) === year);
    return {
      upcoming: vis === EventsShow.enum.tidligere ? NO_EVENTS : shown.filter((e) => !isPast(e, day)),
      past: vis === EventsShow.enum.kommende ? NO_EVENTS : shown.filter((e) => isPast(e, day)).reverse(),
      nothingPlanned: !visible.some((e) => !isPast(e, day)),
    };
  }, [visible, dayIso, year, vis]);

  const showToday = !vis && year === thisYear;
  const isEmpty = upcoming.length === 0 && past.length === 0;

  const showOptions = useMemo<SegmentedOption<ShowFilter>[]>(
    () => [
      { value: ALL, label: t({ message: 'All', comment: 'Events filter option that shows upcoming and past events' }) },
      { value: EventsShow.enum.kommende, label: t({ message: 'Upcoming', comment: 'Events filter option' }) },
      { value: EventsShow.enum.tidligere, label: t({ message: 'Past', comment: 'Events filter option' }) },
    ],
    [t],
  );

  const pickYear = (value: string | null) => {
    if (!value) return;
    const picked = Number(value);
    void navigate({ search: (prev) => ({ ...prev, ar: picked === defaultYear ? undefined : picked }), ...STAY });
  };
  const pickShow = (value: ShowFilter) =>
    navigate({ search: (prev) => ({ ...prev, vis: value === ALL ? undefined : value }), ...STAY });
  const showAll = () => navigate({ search: {}, ...STAY });

  return (
    <>
      <PageIntro
        photo={photo}
        title={<Trans>Events</Trans>}
        lede={<Trans>Our tournaments at Bygdøhus run on volunteers. Grab a shift!</Trans>}
      />
      <PageToolbar>
        {years.length > 1 && (
          <Select
            aria-label={t`Year`}
            data={yearOptions}
            value={String(year)}
            onChange={pickYear}
            allowDeselect={false}
            radius="xl"
            w={136}
            leftSection={<CalendarBlank />}
            classNames={YEAR_CLASS_NAMES}
          />
        )}
        <Segmented label={t`Show`} options={showOptions} value={vis ?? ALL} onChange={pickShow} />
        <div className={classes.subscribe}>
          <SubscribeButton />
        </div>
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
                  key={event.id}
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
                  {formatDate(today(), LONG_DATE)}
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
                  key={event.id}
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
