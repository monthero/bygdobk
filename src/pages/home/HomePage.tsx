import { Trans } from '@lingui/react/macro';
import { Anchor, Button, Container, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { EventCard } from '~/components/events';
import { useStyleKit } from '~/components/styles';
import { ArrowRight, CalendarBlank, CourtTexture } from '~/components/ui';
import { EVENTS_BY_DATE, isPast } from '~/data/events';
import { currentPosts, NEWS } from '~/data/news';
import { dayjs, ISO_DAY } from '~/utils/dates';

import { StartCards } from './components/StartCards';

const NEWS_COUNT = 3;

const homeContent = (todayIso: string) => {
  const events = EVENTS_BY_DATE.filter((e) => e.from !== null && !isPast(e, todayIso));
  const undated = events.length ? undefined : EVENTS_BY_DATE.find((e) => e.from === null && !isPast(e, todayIso));
  const shown = new Set(events.map((e) => e.slug));
  if (undated) shown.add(undated.slug);
  const news = currentPosts(NEWS, todayIso)
    .values()
    .filter((p) => !p.event || !shown.has(p.event))
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
  const todayIso = dayjs().format(ISO_DAY);
  const { events, undated, news } = useMemo(() => homeContent(todayIso), [todayIso]);

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
                <EventCard key={event.slug} event={event} compact />
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
                          {undated.name}
                        </Anchor>
                        , date coming soon
                      </Trans>
                    </Text>
                  ) : (
                    <Text>
                      <Trans>Next event: date coming soon</Trans>
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
