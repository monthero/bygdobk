import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, Container, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { getRouteApi, Link } from '@tanstack/react-router';
import { memo, useMemo, type FC } from 'react';

import { isPast } from '~/cms/calendar';
import { useNewsBody, useSiteContent, type NewsPost } from '~/cms/content';
import { EventCard, isVisitorEvent, type VisitorEvent } from '~/components/events';
import { ArticleBody, NewsCard } from '~/components/news';
import { ArrowRight, ArrowUpRight } from '~/components/ui';
import { EventKind } from '~/data/events';
import { usePageTitle } from '~/hooks/usePageTitle';
import { NotFoundPage } from '~/pages/NotFoundPage';
import { today } from '~/utils/dates';

import { ArticleHero } from './components/ArticleHero';
import { Byline } from './components/Byline';
import { ClosureNotice } from './components/ClosureNotice';
import { PostPager } from './components/PostPager';
import { ShareButtons } from './components/ShareButtons';

import classes from './NewsPostPage.module.css';

const route = getRouteApi('/nyheter/$slug');

const MORE_COUNT = 3;
type NewsLink = NewsPost['links'][number];

const neighbors = (post: NewsPost, news: NewsPost[]) => {
  const index = news.findIndex((p) => p.slug === post.slug);
  const newer = index > 0 ? news.at(index - 1) : undefined;
  const older = news.at(index + 1);
  const skip = new Set([post.slug, newer?.slug, older?.slug]);
  const more = news
    .values()
    .filter((p) => !skip.has(p.slug))
    .take(MORE_COUNT)
    .toArray();
  return { newer, older, more };
};

const ArticleLink: FC<{ link: NewsLink }> = ({ link }) => {
  if (link.page)
    return (
      <Button
        component={Link}
        to={link.page}
        hash={link.hash}
        variant="light"
        radius="xl"
        rightSection={<ArrowRight />}
      >
        {link.label}
      </Button>
    );
  if (!link.url) return null;
  return (
    <Button
      component="a"
      href={link.url}
      target="_blank"
      rel="noreferrer"
      variant="light"
      radius="xl"
      rightSection={<ArrowUpRight />}
    >
      {link.label}
    </Button>
  );
};

const EventPointer: FC<{ event: VisitorEvent }> = ({ event }) => {
  const open = event.shifts.length > 0 && !isPast(event, today());
  return (
    <Button
      renderRoot={(props) => <Link {...props} to="/arrangementer/$slug" params={{ slug: event.slug }} />}
      size="md"
      radius="xl"
      rightSection={<ArrowRight />}
      w="fit-content"
    >
      {open ? <Trans>Pick a shift</Trans> : <Trans>See the event</Trans>}
    </Button>
  );
};

const Article = memo<{ post: NewsPost }>(({ post }) => {
  const { news, events } = useSiteContent();
  const body = useNewsBody(post.slug);
  const { newer, older, more } = useMemo(() => neighbors(post, news), [post, news]);
  const linked = post.eventId ? events.find((e) => e.id === post.eventId) : undefined;
  const event = linked && isVisitorEvent(linked) ? linked : undefined;
  const pause = linked?.kind === EventKind.enum.break ? linked : undefined;

  return (
    <>
      <ArticleHero post={post} />

      <Container py={{ base: 28, md: 40 }}>
        <Stack gap={36} className={classes.column}>
          <div className={classes.byline}>
            <Byline author={post.author} />
            <ShareButtons title={post.title} text={post.summary} />
          </div>

          <article>
            <ArticleBody blocks={body} />
          </article>

          {pause && <ClosureNotice event={pause} />}
          {event && <EventPointer event={event} />}

          {post.links.length > 0 && (
            <Group gap="sm">
              {post.links.map((link) => (
                <ArticleLink key={link._key} link={link} />
              ))}
            </Group>
          )}

          {event && (
            <section aria-labelledby="related-event">
              <Title order={2} id="related-event" className={classes.sectionTitle}>
                <Trans>Related event</Trans>
              </Title>
              <EventCard event={event} />
            </section>
          )}

          <PostPager older={older} newer={newer} />
        </Stack>
      </Container>

      {more.length > 0 && (
        <section aria-labelledby="more-news" className={classes.more}>
          <Container py={{ base: 32, md: 48 }}>
            <Group justify="space-between" align="baseline" mb="lg">
              <Title order={2} id="more-news">
                <Trans>More news</Trans>
              </Title>
              <Anchor component={Link} to="/nyheter" fw={600} className={classes.all}>
                <Trans>All news</Trans>
                <ArrowRight aria-hidden />
              </Anchor>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              {more.map((p) => (
                <NewsCard key={p.slug} post={p} />
              ))}
            </SimpleGrid>
          </Container>
        </section>
      )}
    </>
  );
});

export const NewsPostPage: FC = () => {
  const { t } = useLingui();
  const { slug } = route.useParams();
  const { news } = useSiteContent();
  const post = news.find((p) => p.slug === slug);
  usePageTitle(post?.title, t`News`);
  if (!post) return <NotFoundPage />;
  return <Article post={post} />;
};
