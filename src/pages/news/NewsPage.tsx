import { Plural, Trans, useLingui } from '@lingui/react/macro';
import {
  Badge,
  Button,
  Container,
  Grid,
  Group,
  NavLink,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FC,
  type ReactNode,
  type SVGProps,
} from 'react';

import { useNewsBodies, useSiteContent, type NewsPost } from '~/cms/content';
import { PageToolbar } from '~/components/layout';
import { NewsCard } from '~/components/news';
import { PageIntro, useStyleKit } from '~/components/styles';
import {
  CalendarBlank,
  MagnifyingGlass,
  Newspaper,
  SearchInput,
  Segmented,
  type SegmentedOption,
} from '~/components/ui';
import { NEWS_KIND_SLUGS, NEWS_KINDS, NewsKind } from '~/data/news';
import { PHOTOS } from '~/data/photos';
import { useIsMobile } from '~/hooks/useIsMobile';
import { usePageTitle } from '~/hooks/usePageTitle';
import { Style, useSettings } from '~/stores/settings';
import { date, formatDate, todayIso } from '~/utils/dates';
import { STAY } from '~/utils/navigation';
import { currentPosts, newsYears, postYear, SEARCH_MAX } from '~/utils/news';

import { ComingUp } from './components/ComingUp';
import { LatestList } from './components/LatestList';
import { LeadStory } from './components/LeadStory';
import { YearPager } from './components/YearPager';
import { createNewsSearch, searchNews, type NewsHit } from './search';

import classes from './NewsPage.module.css';

const route = getRouteApi('/nyheter/');

const ALL = 'all';
type KindFilter = NewsKind | typeof ALL;
const LATEST_COUNT = 5;
const JUMP_MIN_MONTHS = 6;
const MIN_QUERY = 2;
const EMPTY_ICON_SIZE = 40;
const NO_HITS: NewsHit[] = [];
const NO_POSTS: NewsPost[] = [];
const YEAR_CLASS_NAMES = { input: classes.year };
const monthId = (key: string) => `maned-${key}`;

type Month = { key: string; posts: NewsPost[] };

const groupByMonth = (posts: NewsPost[]): Month[] =>
  Array.from(
    Map.groupBy(posts, (p) => date(p.date).format('YYYY-MM')),
    ([key, list]) => ({ key, posts: list }),
  );

const monthLabel = (key: string, style: 'long' | 'short') =>
  formatDate(date(`${key}-01`), { month: style, year: 'numeric' });

const jumpTo = (key: string) =>
  document.getElementById(monthId(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const EmptyState: FC<{ icon: ComponentType<SVGProps<SVGSVGElement>>; title: ReactNode; children?: ReactNode }> = ({
  icon: Icon,
  title,
  children,
}) => (
  <Stack align="center" gap="sm" py={40} ta="center">
    <Icon width={EMPTY_ICON_SIZE} height={EMPTY_ICON_SIZE} aria-hidden className={classes.emptyIcon} />
    <Title order={2}>{title}</Title>
    {children}
  </Stack>
);

export const NewsPage: FC = () => {
  const { i18n, t } = useLingui();
  usePageTitle(t`News`);
  const { kategori, sok, ar } = route.useSearch();
  const navigate = route.useNavigate();
  const { NewsList } = useStyleKit();
  const isMobile = useIsMobile();
  const style = useSettings((s) => s.style);
  const cards = !isMobile && style === Style.enum.classic;

  const { news, events } = useSiteContent();
  const kind = NEWS_KIND_SLUGS.fromSlug(kategori);

  const years = useMemo(() => newsYears(news), [news]);
  const newest = years.at(0);
  const year = ar !== undefined && years.includes(ar) ? ar : newest;
  const yearIndex = years.findIndex((y) => y === year);
  const isNewest = year === newest;
  const yearOptions = useMemo(() => Array.from(years, String), [years]);

  const topRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(sok ?? '');
  const [lastSok, setLastSok] = useState(sok);
  if (sok !== lastSok) {
    setLastSok(sok);
    if (!sok) setQuery('');
  }
  const trimmed = query.trim();
  const deferredQuery = useDeferredValue(trimmed);
  const searching = news.length > 0 && deferredQuery.length >= MIN_QUERY;
  const bodies = useNewsBodies({ enabled: trimmed.length > 0 });
  const index = useMemo(() => createNewsSearch(news, bodies), [news, bodies]);
  const hits = useMemo(
    () => (searching ? searchNews(index, deferredQuery).filter((h) => !kind || h.post.kind === kind) : NO_HITS),
    [index, searching, deferredQuery, kind],
  );
  const dayIso = todayIso();
  const posts = useMemo(
    () => news.filter((p) => (!kind || p.kind === kind) && postYear(p) === year),
    [news, kind, year],
  );
  const { lead, latest, months } = useMemo(() => {
    const top = isNewest ? currentPosts(posts, events, date(dayIso)).slice(0, LATEST_COUNT) : NO_POSTS;
    const inTop = new Set(top);
    return { lead: top.at(0), latest: top.slice(1), months: groupByMonth(posts.filter((p) => !inTop.has(p))) };
  }, [posts, events, dayIso, isNewest]);

  const showJump = months.length >= JUMP_MIN_MONTHS;

  const kindOptions = useMemo<SegmentedOption<KindFilter>[]>(
    () => [
      { value: ALL, label: t`All` },
      ...NewsKind.options
        .filter((k) => news.some((p) => p.kind === k))
        .map((k) => ({ value: k, label: i18n._(NEWS_KINDS[k]) })),
    ],
    [i18n, t, news],
  );

  const pick = (value: KindFilter) =>
    navigate({
      search: (prev) => ({ ...prev, kategori: value === ALL ? undefined : NEWS_KIND_SLUGS.toSlug(value) }),
      ...STAY,
    });

  const toTop = () => {
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' });
  };

  const pickYear = (value: string | null) => {
    if (!value) return;
    const picked = Number(value);
    toTop();
    void navigate({ search: (prev) => ({ ...prev, ar: picked === newest ? undefined : picked }), ...STAY });
  };

  const search = (value: string) => {
    setQuery(value);
    void navigate({ search: (prev) => ({ ...prev, sok: value.trim() || undefined }), ...STAY });
  };

  const clearSearch = () => {
    search('');
    searchRef.current?.focus();
  };

  const searchInput = news.length > 0 && (
    <SearchInput
      value={query}
      onChange={search}
      ref={searchRef}
      label={t`Search news`}
      maxLength={SEARCH_MAX}
      className={classes.search}
    />
  );

  return (
    <>
      <PageIntro
        photo={PHOTOS.racketCourt}
        eyebrow={<Trans>Bygdø Badmintonklubb</Trans>}
        title={<Trans>News</Trans>}
        lede={<Trans>Training changes, events, volunteering and club news, with dates.</Trans>}
      />

      <PageToolbar>
        {years.length > 1 && (
          <Select
            aria-label={t`Year`}
            data={yearOptions}
            value={searching ? null : String(year)}
            onChange={pickYear}
            disabled={searching}
            placeholder={t({
              message: 'All years',
              comment: 'Year picker while searching, since search covers every year',
            })}
            allowDeselect={false}
            radius="xl"
            w={136}
            leftSection={<CalendarBlank />}
            classNames={YEAR_CLASS_NAMES}
          />
        )}
        <Segmented label={t`Category`} options={kindOptions} value={kind ?? ALL} onChange={pick} />
        {!isMobile && searchInput}
      </PageToolbar>

      <Container py={40} ref={topRef} className={classes.content}>
        {isMobile && searchInput}
        {searching ? (
          <section
            aria-label={t`Search results`}
            className={classes.results}
            data-stale={trimmed !== deferredQuery || undefined}
          >
            {hits.length > 0 ? (
              <>
                <Text component="output" display="block" fw={600} mb="md">
                  <Plural value={hits.length} one="# post matches" other="# posts match" />
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {hits.map((h) => (
                    <NewsCard key={h.post.slug} post={h.post} highlight={h.highlight} />
                  ))}
                </SimpleGrid>
              </>
            ) : (
              <EmptyState
                icon={MagnifyingGlass}
                title={
                  <output>
                    <Trans>No posts match</Trans>
                  </output>
                }
              >
                <Button variant="light" radius="xl" onClick={clearSearch}>
                  <Trans>Clear search</Trans>
                </Button>
              </EmptyState>
            )}
          </section>
        ) : (
          <Stack gap={48}>
            {isNewest && (!kind || kind === NewsKind.enum.training) && <ComingUp />}

            {posts.length === 0 && (
              <EmptyState icon={Newspaper} title={<Trans>No posts here yet</Trans>}>
                {kind && (
                  <>
                    <Text c="dimmed">
                      <Trans>Try another category, or see all the news.</Trans>
                    </Text>
                    <Button variant="light" radius="xl" onClick={() => pick(ALL)}>
                      <Trans>Show all news</Trans>
                    </Button>
                  </>
                )}
              </EmptyState>
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
                    <Group gap="xs" wrap="nowrap" w="max-content">
                      {months.map((m) => (
                        <Button
                          key={m.key}
                          size="compact-md"
                          variant="default"
                          radius="xl"
                          onClick={() => jumpTo(m.key)}
                        >
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
                        m.posts.map((post) => <NewsCard key={post.slug} post={post} />)
                      ) : (
                        <NewsList posts={m.posts} />
                      )}
                    </section>
                  ))}
                </div>
              </div>
            )}

            <YearPager
              older={years.at(yearIndex + 1)}
              newer={yearIndex > 0 ? years.at(yearIndex - 1) : undefined}
              newest={newest}
              onPick={toTop}
            />
          </Stack>
        )}
      </Container>
    </>
  );
};
