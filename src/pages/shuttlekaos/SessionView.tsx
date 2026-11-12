import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Button, Container, Group, Paper, Stack, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useMemo, useState, type FC, type ReactNode } from 'react';

import { ArrowsClockwise, ListNumbers, ResponsiveModal, Trophy } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { gamesProblem, standings } from '~/shuttlekaos/engine';
import { SessionStatus, type Game, type Session } from '~/shuttlekaos/model';

import { BRAND, FORMAT_LABELS, playerMap, rankMoves, TableVariant } from './labels';
import { Podium } from './Podium';
import { RoundBrowser } from './RoundBrowser';
import { SessionTop } from './SessionTop';
import { StandingsTable } from './StandingsTable';
import { WinnerHero } from './WinnerHero';

import classes from './SessionView.module.css';

const WIDE_QUERY = '(min-width: 75em)';

const PanelTitle: FC<{ icon: ReactNode; children: ReactNode; aside?: ReactNode }> = ({ icon, children, aside }) => (
  <Group justify="space-between" gap="xs" wrap="nowrap" px="xs" pt={4} pb={6}>
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon variant="light" color="brand" radius="xl" size={30}>
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
  usePageTitle(session.title || BRAND, BRAND);
  const wide = useMediaQuery(WIDE_QUERY);
  const [full, fullControls] = useDisclosure(false);
  const [picked, setPicked] = useState<number | null>(null);
  const players = useMemo(() => playerMap(session.players), [session.players]);
  const rows = useMemo(() => standings(session), [session]);
  const last = session.rounds.at(-1)?.number ?? 0;
  const moves = useMemo(() => rankMoves(session, last), [session, last]);
  const finished = session.status === SessionStatus.enum.finished;
  const viewed = picked !== null && picked <= last ? picked : last;
  const playerCount = session.players.length;
  const format = i18n._(FORMAT_LABELS[session.settings.format].label);
  const playedRounds = session.rounds.filter((r) =>
    r.matches.some((m) => gamesProblem(session.settings, m.games) === null),
  ).length;

  const view = (round: number) => setPicked(round === last ? null : round);

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
    />
  );

  const browser = (
    <RoundBrowser session={session} players={players} viewed={viewed} onView={view} onScore={onScore} onEdit={onEdit} />
  );

  let content: ReactNode;
  if (finished) {
    content = (
      <Stack gap="lg">
        <WinnerHero rows={rows} players={players} />
        <Podium rows={rows} settings={session.settings} players={players} />
        <Paper withBorder radius="lg" p="xs" className={classes.panel}>
          <PanelTitle icon={<Trophy />}>
            <Trans>Final standings</Trans>
          </PanelTitle>
          {table(TableVariant.enum.final)}
        </Paper>
        <Stack gap="sm">
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue" radius="xl" size={30}>
              <ArrowsClockwise />
            </ThemeIcon>
            <Title order={2} size="h5">
              <Trans>Rounds</Trans>
            </Title>
          </Group>
          {browser}
        </Stack>
      </Stack>
    );
  } else if (wide) {
    content = (
      <div className={classes.roundLayout}>
        {browser}
        <aside className={classes.aside}>
          <Paper withBorder radius="lg" p="xs" className={classes.panel}>
            <PanelTitle icon={<ListNumbers />}>
              <Trans>Standings</Trans>
            </PanelTitle>
            {table(TableVariant.enum.full)}
          </Paper>
        </aside>
      </div>
    );
  } else {
    content = (
      <Stack gap="md">
        {browser}
        <Paper withBorder radius="lg" p="xs" className={classes.panel}>
          <PanelTitle
            icon={<ListNumbers />}
            aside={
              <Button variant="subtle" color="brand" size="compact-md" h={44} onClick={fullControls.open}>
                <Trans>Full table</Trans>
              </Button>
            }
          >
            <Trans>Standings</Trans>
          </PanelTitle>
          {table(TableVariant.enum.compact)}
        </Paper>
        <ResponsiveModal opened={full} onClose={fullControls.close} title={<Trans>Standings</Trans>}>
          <div className={classes.fullTable}>{table(TableVariant.enum.full)}</div>
        </ResponsiveModal>
      </Stack>
    );
  }

  return (
    <>
      <SessionTop
        title={session.title}
        progress={progress}
        format={format}
        playerCount={playerCount}
        actions={actions}
      />
      <Container py="md" className={classes.body}>
        <Stack gap="md">
          {notice}
          {content}
        </Stack>
      </Container>
      {footer}
    </>
  );
};
