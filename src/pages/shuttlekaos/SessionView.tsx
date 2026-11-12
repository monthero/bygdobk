import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Box, Container, Group, Paper, Stack, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure, useElementSize, useIntersection, useMediaQuery } from '@mantine/hooks';
import { useMemo, useState, type FC, type ReactNode } from 'react';

import { ListNumbers, Racket, ResponsiveModal, Trophy } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { gamesProblem, standings } from '~/shuttlekaos/engine';
import { SessionStatus, type Game, type Session } from '~/shuttlekaos/model';

import { BRAND, durationText, FORMAT_LABELS, playerMap, rankMoves, sessionMinutes, TableVariant, YOU } from './labels';
import { MatchGrid } from './MatchGrid';
import { Podium } from './Podium';
import { RoundBrowser, RoundNav } from './RoundBrowser';
import { SessionTop } from './SessionTop';
import { StandingsTable, StatsTitle, StatsToggle } from './StandingsTable';

import classes from './SessionView.module.css';

const WIDE_QUERY = '(min-width: 75em)';
const STICKY_MARGIN = '-64px 0px 0px 0px';
const ROUND_MARGIN = '-160px 0px 0px 0px';

type TitleProps = { icon: ReactNode; children: ReactNode; aside?: ReactNode; color?: string; inset?: boolean };

const SectionTitle: FC<TitleProps> = ({ icon, children, aside, color = 'brand', inset }) => (
  <Group justify="space-between" gap="xs" wrap="nowrap" px={inset ? 'md' : 0} pt={inset ? 4 : 0} pb={inset ? 6 : 0}>
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon variant="light" color={color} radius="xl" size={30}>
        {icon}
      </ThemeIcon>
      <Title order={2} size="h5">
        {children}
      </Title>
    </Group>
    {aside}
  </Group>
);

type Props = {
  session: Session;
  actions?: ReactNode;
  notice?: ReactNode;
  footer?: ReactNode;
  onScore?: (matchId: string, games: Game[]) => void;
  onEdit?: (matchId: string) => void;
  highlight?: string | null;
};

export const SessionView: FC<Props> = ({ session, actions, notice, footer, onScore, onEdit, highlight }) => {
  const { i18n } = useLingui();
  usePageTitle(session.title || BRAND, session.title ? BRAND : undefined);
  const wide = useMediaQuery(WIDE_QUERY);
  const [full, fullControls] = useDisclosure(false);
  const [picked, setPicked] = useState<number | null>(null);
  const you = i18n._(YOU);
  const players = useMemo(() => playerMap(session.players, highlight ?? null, you), [session.players, highlight, you]);
  const rows = useMemo(() => standings(session), [session]);
  const last = session.rounds.at(-1)?.number ?? 0;
  const moves = useMemo(() => rankMoves(session, last), [session, last]);
  const finished = session.status === SessionStatus.enum.finished;
  const { ref: sentinel, entry } = useIntersection({ rootMargin: STICKY_MARGIN });
  const compact = entry !== null && !entry.isIntersecting;
  const { ref: topRef, height: topHeight } = useElementSize();
  const { ref: roundHead, entry: headEntry } = useIntersection({ rootMargin: ROUND_MARGIN });
  const roundAway =
    !finished &&
    headEntry !== null &&
    !headEntry.isIntersecting &&
    headEntry.boundingClientRect.bottom <= (headEntry.rootBounds?.top ?? 0);
  const viewed = picked !== null && picked <= last ? picked : last;
  const playerCount = session.players.length;
  const format = i18n._(FORMAT_LABELS[session.settings.format].label);
  const playedRounds = session.rounds.filter((r) =>
    r.matches.some((m) => gamesProblem(session.settings, m.games) === null),
  ).length;

  const view = (round: number) => setPicked(round === last ? null : round);

  const minutes = finished ? sessionMinutes(session) : null;
  const duration = minutes !== null && minutes > 0 ? durationText(minutes) : undefined;
  const progress = finished ? (
    <Plural value={playedRounds} one="Finished after # round" other="Finished after # rounds" />
  ) : (
    <Trans comment="Session status: being played right now">Playing now</Trans>
  );

  const table = (variant: TableVariant) => (
    <StandingsTable
      rows={rows}
      session={session}
      players={players}
      variant={variant}
      moves={finished ? undefined : moves}
      highlight={highlight}
      adjustable={!wide}
    />
  );

  const browser = (
    <RoundBrowser
      session={session}
      players={players}
      viewed={viewed}
      onView={view}
      onScore={onScore}
      onEdit={onEdit}
      headRef={roundHead}
      onStandings={wide ? undefined : fullControls.open}
    />
  );

  let content: ReactNode;
  if (finished) {
    content = (
      <Stack gap="xl">
        <Stack gap="lg" className={classes.summary}>
          {notice}
          <Podium rows={rows} players={players} />
          <Stack gap="sm">
            <SectionTitle icon={<Trophy />} aside={!wide && <StatsToggle />}>
              <Trans>Final standings</Trans>
            </SectionTitle>
            <Paper withBorder radius="lg" pt="xs" px={0} className={classes.panel}>
              {table(TableVariant.enum.final)}
            </Paper>
          </Stack>
        </Stack>
        <Stack gap="sm">
          <SectionTitle icon={<Racket />} color="blue">
            <Trans>All matches</Trans>
          </SectionTitle>
          <MatchGrid session={session} players={players} />
        </Stack>
      </Stack>
    );
  } else if (wide) {
    content = (
      <div className={classes.roundLayout}>
        {browser}
        <aside className={classes.aside}>
          <Paper withBorder radius="lg" pt="xs" px={0} className={classes.panel}>
            <SectionTitle icon={<ListNumbers />} inset>
              <Trans>Standings</Trans>
            </SectionTitle>
            {table(TableVariant.enum.full)}
          </Paper>
        </aside>
      </div>
    );
  } else {
    content = (
      <Stack gap="md">
        {browser}
        <ResponsiveModal
          opened={full}
          onClose={fullControls.close}
          title={
            <StatsTitle>
              <Trans>Standings</Trans>
            </StatsTitle>
          }
        >
          <div className={classes.fullTable}>{table(TableVariant.enum.full)}</div>
        </ResponsiveModal>
      </Stack>
    );
  }

  return (
    <Box __vars={{ '--session-top': `${topHeight}px` }} className={classes.root}>
      <div ref={sentinel} className={classes.sentinel} aria-hidden />
      <div ref={topRef} className={classes.top}>
        <SessionTop
          title={session.title}
          progress={progress}
          duration={duration}
          format={format}
          playerCount={playerCount}
          actions={actions}
          compact={compact}
          location={session.location}
          below={
            roundAway && (
              <RoundNav
                session={session}
                viewed={viewed}
                onView={view}
                compact
                onStandings={wide ? undefined : fullControls.open}
              />
            )
          }
        />
      </div>
      <Container py="xl" className={classes.body}>
        <Stack gap="md">
          {!finished && notice}
          {content}
        </Stack>
      </Container>
      {footer}
    </Box>
  );
};
