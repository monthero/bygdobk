import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Avatar, Button, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { getRouteApi, Link } from '@tanstack/react-router';
import { memo, useMemo, type FC } from 'react';

import { EventCard } from '~/components/events';
import { NewsCard } from '~/components/news';
import { ArrowRight, ArrowUpRight, ClubLogo } from '~/components/ui';
import { eventBySlug, isPast, type ClubEvent } from '~/data/events';
import { NEWS, NEWS_AUTHORS, newsBySlug, type NewsLink, type NewsPost } from '~/data/news';
import { NotFoundPage } from '~/pages/NotFoundPage';
import { dayjs, ISO_DAY } from '~/utils/dates';

import { ArticleBody } from './components/ArticleBody';
import { ArticleHero } from './components/ArticleHero';
import { ClosureNotice } from './components/ClosureNotice';
import { PostPager } from './components/PostPager';
import { ShareButtons } from './components/ShareButtons';

import classes from './NewsPostPage.module.css';

const route = getRouteApi('/nyheter/$slug');

const MORE_COUNT = 3;

const neighbors = (post: NewsPost) => {
  const index = NEWS.indexOf(post);
  const newer = index > 0 ? NEWS.at(index - 1) : undefined;
  const older = NEWS.at(index + 1);
  const skip = new Set([post, newer, older]);
  const more = NEWS.values()
    .filter((p) => !skip.has(p))
    .take(MORE_COUNT)
    .toArray();
  return { newer, older, more };
};

const ArticleLink: FC<{ link: NewsLink }> = ({ link }) => {
  const { i18n } = useLingui();
  const label = i18n._(link.label);
  if ('to' in link)
    return (
      <Button component={Link} to={link.to} hash={link.hash} variant="light" radius="xl" rightSection={<ArrowRight />}>
        {label}
      </Button>
    );
  return (
    <Button
      component="a"
      href={link.href}
      target="_blank"
      rel="noreferrer"
      variant="light"
      radius="xl"
      rightSection={<ArrowUpRight />}
    >
      {label}
    </Button>
  );
};

const EventPointer: FC<{ event: ClubEvent }> = ({ event }) => {
  const open = event.shifts !== undefined && !isPast(event, dayjs().format(ISO_DAY));
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
  const { i18n } = useLingui();
  const { newer, older, more } = useMemo(() => neighbors(post), [post]);
  const event = post.event ? eventBySlug(post.event) : undefined;
  const author = NEWS_AUTHORS[post.author];

  return (
    <>
      <ArticleHero post={post} />

      <Container py={{ base: 28, md: 40 }}>
        <Stack gap={36} className={classes.column}>
          <div className={classes.byline}>
            <Group gap="sm" wrap="nowrap">
              <Avatar size={48} radius="xl" variant="light" className={classes.avatar} aria-hidden>
                <ClubLogo mark height={30} />
              </Avatar>
              <div>
                <Anchor component={Link} to={author.page} hash={author.hash} fw={700} c="inherit">
                  {i18n._(author.name)}
                </Anchor>
                <Text size="sm" c="dimmed">
                  {i18n._(author.role)}
                </Text>
              </div>
            </Group>
            <ShareButtons title={i18n._(post.title)} text={i18n._(post.summary)} />
          </div>

          <article>
            <ArticleBody blocks={post.body} />
          </article>

          {post.closure && <ClosureNotice id={post.closure} />}
          {event && <EventPointer event={event} />}

          {post.links && (
            <Group gap="sm">
              {post.links.map((link) => (
                <ArticleLink key={link.label.id} link={link} />
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
                <NewsCard key={p.id} post={p} />
              ))}
            </SimpleGrid>
          </Container>
        </section>
      )}
    </>
  );
});

export const NewsPostPage: FC = () => {
  const { slug } = route.useParams();
  const post = newsBySlug(slug);
  if (!post) return <NotFoundPage />;
  return <Article post={post} />;
};
