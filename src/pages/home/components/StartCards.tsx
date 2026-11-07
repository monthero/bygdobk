import { Trans } from '@lingui/react/macro';
import { Button, Card, List, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { Fragment, memo, useMemo, type FC, type ReactNode } from 'react';

import { useSiteContent } from '~/cms/content';
import { useGroups, useSitePhoto } from '~/cms/siteData';
import { ArrowRight, CalendarBlank, Coins, Racket, Shuttle, UsersThree } from '~/components/ui';
import { PhotoSlot } from '~/data/photos';
import { listFormat } from '~/i18n/current';
import { Joiner, kr, useOffers } from '~/pages/join/offers';
import { formatDate } from '~/utils/dates';
import { nextTrainingDay, offTitles, type PlannedSession } from '~/utils/training';

import classes from './StartCards.module.css';

const NEXT_DAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
const CHILD_SEARCH = { for: Joiner.enum.child };
const EMPTY_SESSIONS: PlannedSession[] = [];

type Fact = { id: string; icon: ReactNode; text: ReactNode; note?: ReactNode };

type CardProps = {
  slot: PhotoSlot;
  title: ReactNode;
  facts: Fact[];
  action: ReactNode;
};

const CARD_SIZES = '(min-width: 62em) 33vw, (min-width: 48em) 50vw, 100vw';

const StartCard = memo<CardProps>(({ slot, title, facts, action }) => {
  const photo = useSitePhoto(slot);
  return (
    <Card withBorder radius="lg" padding={0} className={classes.card}>
      <div className={classes.photo}>
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={CARD_SIZES}
          alt=""
          loading="lazy"
          decoding="async"
          className={classes.image}
          style={{ objectPosition: photo.position }}
        />
      </div>
      <Stack gap="md" p="lg" className={classes.body}>
        <Title order={3}>{title}</Title>
        <List spacing="sm" className={classes.facts}>
          {facts.map((fact) => (
            <List.Item
              key={fact.id}
              icon={
                <ThemeIcon size={28} radius="md" variant="light">
                  {fact.icon}
                </ThemeIcon>
              }
            >
              {fact.text}
              {fact.note && (
                <Text span size="sm" c="dimmed" display="block">
                  {fact.note}
                </Text>
              )}
            </List.Item>
          ))}
        </List>
        <div className={classes.action}>{action}</div>
      </Stack>
    </Card>
  );
});

export const StartCards: FC = () => {
  const { events, payment } = useSiteContent();
  const groups = useGroups();
  const { dropin, trial, trySearch } = useOffers();
  const next = useMemo(() => nextTrainingDay(events), [events]);

  const nextDay = next ? formatDate(next.day, NEXT_DAY_FORMAT) : '';
  const sessions = next?.sessions ?? EMPTY_SESSIONS;
  const reason = listFormat().format(offTitles(sessions));
  const allOff = sessions.length > 0 && sessions.every((s) => s.off);
  const nextNote = allOff ? (
    reason
  ) : (
    <>
      {sessions.map((s, index) => (
        <Fragment key={`${s.group}-${s.start.valueOf()}`}>
          {index > 0 && ' · '}
          <span className={classes.session} data-off={s.off ? true : undefined}>
            {groups[s.group].name} {s.event.startTime}–{s.event.endTime}
            {s.event.venue && ` (${s.event.venue.name})`}
          </span>
        </Fragment>
      ))}
      {reason && (
        <span className={classes.off}>
          <Trans>No training: {reason}</Trans>
        </span>
      )}
    </>
  );

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
      <StartCard
        slot={PhotoSlot.enum.startTraining}
        title={<Trans>New to badminton?</Trans>}
        facts={[
          ...(dropin?.perVisit === undefined
            ? []
            : [
                {
                  id: 'dropin',
                  icon: <Coins />,
                  text: <Trans>Drop in for {kr(dropin.perVisit)} a visit</Trans>,
                  note: <Trans>after the {kr(dropin.membership)} membership</Trans>,
                },
              ]),
          { id: 'coach', icon: <Racket />, text: <Trans>Beginners play with a coach</Trans> },
          { id: 'discount', icon: <UsersThree />, text: <Trans>Half price on Beginners your first season</Trans> },
        ]}
        action={
          <Button
            fullWidth
            rightSection={<ArrowRight />}
            renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" search={trySearch} />}
          >
            <Trans>Try a session</Trans>
          </Button>
        }
      />

      <StartCard
        slot={PhotoSlot.enum.startJoin}
        title={<Trans>Signing up a child?</Trans>}
        facts={[
          ...(trial
            ? [
                {
                  id: 'trial',
                  icon: <Shuttle />,
                  text: <Trans>Ages 7–12 try half a season for {kr(trial.membership)}</Trans>,
                },
              ]
            : []),
          { id: 'coach', icon: <UsersThree />, text: <Trans>Coached training for kids and teens</Trans> },
          { id: 'siblings', icon: <Coins />, text: <Trans>Siblings pay half</Trans> },
        ]}
        action={
          <Button
            fullWidth
            variant="light"
            rightSection={<ArrowRight />}
            renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" search={CHILD_SEARCH} />}
          >
            <Trans>Sign up your child</Trans>
          </Button>
        }
      />

      <StartCard
        slot={PhotoSlot.enum.startMembers}
        title={<Trans>Already a member?</Trans>}
        facts={[
          {
            id: 'next',
            icon: <CalendarBlank />,
            text: next ? <Trans>Next training: {nextDay}</Trans> : <Trans>No training in the next two weeks</Trans>,
            note: nextNote,
          },
          ...(dropin?.perVisit === undefined
            ? []
            : [
                {
                  id: 'vipps',
                  icon: <Coins />,
                  text: payment.vipps ? (
                    <Trans>
                      Drop-in: Vipps {kr(dropin.perVisit)} to {payment.vipps}
                    </Trans>
                  ) : (
                    <Trans>Drop-in: {kr(dropin.perVisit)} per visit</Trans>
                  ),
                },
              ]),
        ]}
        action={
          <Button component={Link} to="/medlemskap/mine" fullWidth variant="light" rightSection={<ArrowRight />}>
            <Trans>My membership</Trans>
          </Button>
        }
      />
    </SimpleGrid>
  );
};
