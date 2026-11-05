import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { getRouteApi, Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { daySlug, eventWhen } from '~/components/events';
import { PageIntro, useStyleKit } from '~/components/styles';
import { AddressLink, ArrowLeft, CalendarBlank, HandHeart, Info, MapPin } from '~/components/ui';
import { eventBySlug, isPast } from '~/data/events';
import { PHOTOS } from '~/data/photos';
import { NotFoundPage } from '~/pages/NotFoundPage';
import { ISO_DAY, dayjs } from '~/utils/dates';
import { STAY } from '~/utils/navigation';

const route = getRouteApi('/arrangementer/$slug');

const NO_DAYS: string[] = [];

export const EventPage: FC = () => {
  const { i18n } = useLingui();
  const { slug } = route.useParams();
  const { dag } = route.useSearch();
  const navigate = route.useNavigate();
  const { ShiftBoard } = useStyleKit();
  const event = eventBySlug(slug);
  if (!event) return <NotFoundPage />;

  const past = isPast(event, dayjs().format(ISO_DAY));
  const shifts = event.shifts;
  const days = shifts?.days ?? NO_DAYS;
  const day = days.find((d) => daySlug(d) === dag) ?? days.at(1) ?? days.at(0) ?? '';

  return (
    <>
      <PageIntro
        photo={PHOTOS.hallSunset}
        eyebrow={i18n._(event.season)}
        title={event.name}
        lede={i18n._(event.description)}
      >
        <Group gap="lg" mt="sm">
          <Group gap={6}>
            <CalendarBlank />
            <Text fw={600} className="tabular">
              {eventWhen(event, i18n._(event.season))}
            </Text>
          </Group>
          <Group gap={6}>
            <MapPin />
            <Text>
              <AddressLink />
            </Text>
          </Group>
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
          {past && (
            <Alert icon={<HandHeart />} variant="light" color="teal" title={<Trans>Done!</Trans>}>
              <Trans>Thanks to everyone who helped.</Trans>
            </Alert>
          )}
          {!past && event.tip && (
            <Alert icon={<Info />} variant="light" title={i18n._(event.tip.title)}>
              {i18n._(event.tip.text)}
            </Alert>
          )}
          {shifts && (
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
                days={days}
                shifts={shifts.list}
                day={day}
                onDayChange={(d) => navigate({ search: { dag: daySlug(d) }, ...STAY })}
                readOnly={past}
              />
            </Stack>
          )}
          {!shifts && !past && (
            <Alert icon={<Info />} variant="light" color="gray" title={<Trans>Shifts come later</Trans>}>
              <Trans>The volunteer shifts open here when the date is set. Members get a message in Spond.</Trans>
            </Alert>
          )}
        </Stack>
      </Container>
    </>
  );
};
