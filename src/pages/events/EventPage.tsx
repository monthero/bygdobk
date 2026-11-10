import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { getRouteApi, Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { isPast } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { useBannerPhoto } from '~/cms/siteData';
import {
  EventActions,
  EventVenue,
  eventVenue,
  eventWhen,
  isVisitorEvent,
  shiftDays,
  type VisitorEvent,
} from '~/components/events';
import { eventJsonLd, JsonLd } from '~/components/seo';
import { PageIntro, useStyleKit } from '~/components/styles';
import { ArrowLeft, CalendarBlank, ChatCircle, HandHeart, Info, MapPin } from '~/components/ui';
import { contactLink, ContactTopic } from '~/data/contact';
import { EVENT_KINDS } from '~/data/events';
import { PhotoSlot } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';
import { NotFoundPage } from '~/pages/NotFoundPage';
import { today } from '~/utils/dates';
import { STAY } from '~/utils/navigation';

const route = getRouteApi('/arrangementer/$slug');

export const EventPage: FC = () => {
  const { i18n, t } = useLingui();
  const { slug } = route.useParams();
  const { dag } = route.useSearch();
  const navigate = route.useNavigate();
  const { ShiftBoard } = useStyleKit();
  const { events, club } = useSiteContent();
  const event = events.find((e): e is VisitorEvent => e.slug === slug && isVisitorEvent(e));
  usePageTitle(event?.title, t`Events`);
  const photo = useBannerPhoto(event?.banner, PhotoSlot.enum.events);
  if (!event) return <NotFoundPage />;

  const eventTitle = event.title;
  const helpLink = contactLink(
    ContactTopic.enum.tournaments,
    t`Hi! I'd like to help at ${eventTitle}. Let me know where you need a hand.`,
  );
  const past = isPast(event, today());
  const hasShifts = event.shifts.length > 0;
  const days = shiftDays(event.shifts);
  const mainDay = days.find((d) => event.shifts.some((s) => s.day === d && !s.setup));
  const day = days.find((d) => d === dag) ?? mainDay ?? days.at(0) ?? '';

  return (
    <>
      <JsonLd data={eventJsonLd(event, club.venue, photo.src)} />
      <PageIntro
        photo={photo}
        eyebrow={i18n._(EVENT_KINDS[event.kind].label)}
        title={event.title}
        lede={event.description}
      >
        <Group gap="lg" mt="sm">
          <Group gap={6}>
            <CalendarBlank />
            <Text fw={600} className="tabular">
              {eventWhen(event)}
            </Text>
          </Group>
          {eventVenue(event, club.venue) && (
            <Group gap={6} wrap="nowrap">
              <MapPin />
              <Text>
                <EventVenue event={event} />
              </Text>
            </Group>
          )}
        </Group>
      </PageIntro>

      <Container py={40}>
        <Stack gap="lg">
          <Button
            component={Link}
            to="/arrangementer"
            variant="subtle"
            leftSection={<ArrowLeft />}
            w="fit-content"
            px={0}
          >
            <Trans>All events</Trans>
          </Button>
          <EventActions event={event} />
          {past && (
            <Alert icon={<HandHeart />} variant="light" color="teal" title={<Trans>Done!</Trans>}>
              <Trans>Thanks to everyone who helped.</Trans>
            </Alert>
          )}
          {!past && event.tip && (
            <Alert icon={<Info />} variant="light" title={event.tip.title}>
              {event.tip.text}
            </Alert>
          )}
          {hasShifts && (
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon variant="light" radius="xl" size="lg">
                  <HandHeart />
                </ThemeIcon>
                <Title order={2}>
                  <Trans>Volunteer shifts</Trans>
                </Title>
              </Group>
              <ShiftBoard
                eventId={event.id}
                signupUrl={event.signupUrl}
                days={days}
                shifts={event.shifts}
                day={day}
                onDayChange={(d) => navigate({ search: { dag: d }, ...STAY })}
                readOnly={past}
              />
            </Stack>
          )}
          {!hasShifts && !past && event.ownEvent && event.dateConfirmed && (
            <Alert icon={<HandHeart />} variant="light" title={<Trans>Want to help?</Trans>}>
              <Stack gap="sm" align="flex-start">
                <Text size="sm">
                  <Trans>No shifts listed yet. Tell the board you can help.</Trans>
                </Text>
                <Button
                  size="xs"
                  renderRoot={(props) => <Link {...props} {...helpLink} />}
                  leftSection={<ChatCircle />}
                >
                  <Trans>Write to the board</Trans>
                </Button>
              </Stack>
            </Alert>
          )}
          {!hasShifts && !past && event.ownEvent && !event.dateConfirmed && (
            <Alert icon={<Info />} variant="light" color="gray" title={<Trans>Shifts come later</Trans>}>
              <Trans>The volunteer shifts open here when the date is set. Members get a message in Spond.</Trans>
            </Alert>
          )}
        </Stack>
      </Container>
    </>
  );
};
