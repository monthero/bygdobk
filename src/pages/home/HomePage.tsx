import { Trans } from '@lingui/react/macro';
import { Anchor, Button, Container, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { useDocumentTitle } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { isPast, type CalendarEvent } from '~/cms/calendar';
import { useSiteContent, type NewsPost } from '~/cms/content';
import { EventCard, isVisitorEvent, type VisitorEvent } from '~/components/events';
import { useStyleKit } from '~/components/styles';
import { ArrowRight, CalendarBlank, CourtTexture } from '~/components/ui';
import { CLUB } from '~/data/club';
import { date, todayIso } from '~/utils/dates';
import { currentPosts } from '~/utils/news';

import { StartCards } from './components/StartCards';

const NEWS_COUNT = 3;

const homeContent = (allNews: NewsPost[], allEvents: readonly CalendarEvent[], dayIso: string) => {
  const day = date(dayIso);
  const coming = allEvents.filter((e): e is VisitorEvent => isVisitorEvent(e) && !isPast(e, day));
  const events = coming.filter((e) => e.dateConfirmed);
  const undated = events.length ? undefined : coming.find((e) => !e.dateConfirmed);
  const shown = new Set(events.values().map((e) => e.id));
  if (undated) shown.add(undated.id);
  const news = currentPosts(allNews, allEvents, day)
    .values()
    .filter((p) => !p.eventId || !shown.has(p.eventId))
    .take(NEWS_COUNT)
    .toArray();
  return { events, undated, news };
};
const START_STYLE = { isolation: 'isolate' } as const;
const FLUSH_BUTTON_STYLE = {
  marginInlineStart: 'calc(var(--button-padding-x) * -1)',
  marginInlineEnd: 'calc(var(--button-padding-x) / -1.5)',
} as const;

export const HomePage: FC = () => {
  const { HomeHero, HomeExtra, SectionDivider, NewsList } = useStyleKit();
  const content = useSiteContent();
  const dayIso = todayIso();
  const { events, undated, news } = useMemo(
    () => homeContent(content.news, content.events, dayIso),
    [content.news, content.events, dayIso],
  );
  useDocumentTitle(CLUB.name);

  return (
    <>
      <HomeHero />
      <SectionDivider />

      <Container py={56} pos="relative" style={START_STYLE}>
        <CourtTexture />
        <Stack gap="xl">
          <Title order={2}>
            <Trans>Where do you want to start?</Trans>
          </Title>
          <StartCards />
        </Stack>
      </Container>

      <HomeExtra />
      <SectionDivider />

      <Container pb={56}>
        <Grid gap={40}>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              <Group justify="space-between" gap="xs">
                <Title order={2}>
                  <Trans>News</Trans>
                </Title>
                <Button
                  component={Link}
                  to="/nyheter"
                  variant="subtle"
                  rightSection={<ArrowRight />}
                  style={FLUSH_BUTTON_STYLE}
                >
                  <Trans>All news</Trans>
                </Button>
              </Group>
              <NewsList posts={news} />
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Group justify="space-between" gap="xs">
                <Title order={2}>
                  <Trans>Events</Trans>
                </Title>
                <Button
                  component={Link}
                  to="/arrangementer"
                  variant="subtle"
                  rightSection={<ArrowRight />}
                  style={FLUSH_BUTTON_STYLE}
                >
                  <Trans>All events</Trans>
                </Button>
              </Group>
              {events.map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))}
              {events.length === 0 && (
                <Group gap="xs" wrap="nowrap">
                  <CalendarBlank aria-hidden />
                  {undated ? (
                    <Text>
                      <Trans>
                        Next up:{' '}
                        <Anchor
                          renderRoot={(props) => (
                            <Link {...props} to="/arrangementer/$slug" params={{ slug: undated.slug }} />
                          )}
                          fw={700}
                        >
                          {undated.title}
                        </Anchor>
                        , date coming soon
                      </Trans>
                    </Text>
                  ) : (
                    <Text>
                      <Trans>Nothing planned yet. New events show up here.</Trans>
                    </Text>
                  )}
                </Group>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  );
};
