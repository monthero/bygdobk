import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Container, Grid, Group, NavLink, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { NewsCard } from '~/components/news';
import { PageIntro, useStyleKit } from '~/components/styles';
import { Newspaper, PageToolbar, Segmented, type SegmentedOption } from '~/components/ui';
import {
  currentPosts,
  NEWS,
  NEWS_KIND_SLUGS,
  NEWS_KINDS,
  NEWS_KINDS_IN_USE,
  NewsKind,
  type NewsPost,
} from '~/data/news';
import { PHOTOS } from '~/data/photos';
import { useIsMobile } from '~/hooks/useIsMobile';
import { Style, useSettings } from '~/stores/settings';
import { date, dayjs, formatDate, ISO_DAY } from '~/utils/dates';
import { STAY } from '~/utils/navigation';

import { ComingUp } from './components/ComingUp';
import { LatestList } from './components/LatestList';
import { LeadStory } from './components/LeadStory';

import classes from './NewsPage.module.css';

const route = getRouteApi('/nyheter/');

const ALL = 'all';
type KindFilter = NewsKind | typeof ALL;
const LATEST_COUNT = 5;
const JUMP_MIN_MONTHS = 6;
const monthId = (key: string) => `maned-${key}`;

type Month = { key: string; posts: NewsPost[] };

const groupByMonth = (posts: NewsPost[]): Month[] =>
  Array.from(
    Map.groupBy(posts, (p) => p.date.slice(0, 7)),
    ([key, list]) => ({ key, posts: list }),
  );

const monthLabel = (key: string, style: 'long' | 'short') =>
  formatDate(date(`${key}-01`), { month: style, year: 'numeric' });

const jumpTo = (key: string) =>
  document.getElementById(monthId(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export const NewsPage: FC = () => {
  const { i18n, t } = useLingui();
  const { kategori } = route.useSearch();
  const navigate = route.useNavigate();
  const { NewsList } = useStyleKit();
  const isMobile = useIsMobile();
  const style = useSettings((s) => s.style);
  const cards = !isMobile && style === Style.enum.classic;

  const kind = NEWS_KIND_SLUGS.fromSlug(kategori);
  const todayIso = dayjs().format(ISO_DAY);
  const posts = useMemo(() => (kind ? NEWS.filter((p) => p.kind === kind) : NEWS), [kind]);
  const { lead, latest, months } = useMemo(() => {
    const top = currentPosts(posts, todayIso).slice(0, LATEST_COUNT);
    const inTop = new Set(top);
    return { lead: top.at(0), latest: top.slice(1), months: groupByMonth(posts.filter((p) => !inTop.has(p))) };
  }, [posts, todayIso]);

  const showJump = months.length >= JUMP_MIN_MONTHS;

  const kindOptions = useMemo<SegmentedOption<KindFilter>[]>(
    () => [
      { value: ALL, label: t`All` },
      ...NEWS_KINDS_IN_USE.map((k) => ({ value: k, label: i18n._(NEWS_KINDS[k]) })),
    ],
    [i18n, t],
  );

  const pick = (value: KindFilter) =>
    navigate({ search: { kategori: value === ALL ? undefined : NEWS_KIND_SLUGS.toSlug(value) }, ...STAY });

  return (
    <>
      <PageIntro
        photo={PHOTOS.racketCourt}
        eyebrow={<Trans>Bygdø Badmintonklubb</Trans>}
        title={<Trans>News</Trans>}
        lede={<Trans>Training changes, events, volunteering and club news, with dates.</Trans>}
      />

      <PageToolbar>
        <Segmented label={t`Category`} options={kindOptions} value={kind ?? ALL} onChange={pick} />
      </PageToolbar>

      <Container py={40}>
        <Stack gap={48}>
          {(!kind || kind === NewsKind.enum.training) && <ComingUp />}

          {!lead && (
            <Stack align="center" gap="sm" py={40} ta="center">
              <Newspaper width={40} height={40} aria-hidden className={classes.emptyIcon} />
              <Title order={2}>
                <Trans>No posts here yet</Trans>
              </Title>
              <Text c="dimmed">
                <Trans>Try another category, or see all the news.</Trans>
              </Text>
              <Button variant="light" radius="xl" onClick={() => pick(ALL)}>
                <Trans>Show all news</Trans>
              </Button>
            </Stack>
          )}

          {lead && (
            <section aria-labelledby="siste">
              <Title order={2} id="siste" className={classes.sectionTitle}>
                <Trans>Latest</Trans>
              </Title>
              <Grid gap="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <LeadStory post={lead} />
                </Grid.Col>
                {latest.length > 0 && (
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <LatestList posts={latest} />
                  </Grid.Col>
                )}
              </Grid>
            </section>
          )}

          {months.length > 0 && (
            <div className={classes.archive} data-rail={showJump || undefined}>
              {showJump && isMobile && (
                <ScrollArea type="never" className={classes.chips}>
                  <Group gap="xs" wrap="nowrap">
                    {months.map((m) => (
                      <Button key={m.key} size="compact-md" variant="default" radius="xl" onClick={() => jumpTo(m.key)}>
                        {monthLabel(m.key, 'short')}
                      </Button>
                    ))}
                  </Group>
                </ScrollArea>
              )}
              {showJump && !isMobile && (
                <nav className={classes.rail} aria-label={t`Archive`}>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                    <Trans>Jump to</Trans>
                  </Text>
                  {months.map((m) => (
                    <NavLink
                      key={m.key}
                      label={monthLabel(m.key, 'long')}
                      rightSection={
                        <Badge size="xs" variant="light" color="gray" circle>
                          {m.posts.length}
                        </Badge>
                      }
                      onClick={() => jumpTo(m.key)}
                      className={classes.railLink}
                    />
                  ))}
                </nav>
              )}
              <div className={classes.months} data-grid={cards || undefined}>
                {months.map((m) => (
                  <section
                    key={m.key}
                    id={monthId(m.key)}
                    className={classes.month}
                    data-wide={(cards && m.posts.length > 1) || undefined}
                  >
                    <Group gap="sm" align="baseline" className={classes.monthHead}>
                      <Title order={2} className={classes.monthName}>
                        {monthLabel(m.key, 'long')}
                      </Title>
                      <Text size="sm" c="dimmed">
                        <Plural value={m.posts.length} one="# post" other="# posts" />
                      </Text>
                    </Group>
                    {cards ? (
                      m.posts.map((post) => <NewsCard key={post.id} post={post} />)
                    ) : (
                      <NewsList posts={m.posts} />
                    )}
                  </section>
                ))}
              </div>
            </div>
          )}
        </Stack>
      </Container>
    </>
  );
};
