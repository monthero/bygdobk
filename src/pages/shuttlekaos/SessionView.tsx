import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMemo, useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import { PageToolbar } from '~/components/layout';
import { Coffee, Segmented, type SegmentedOption } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { gamesProblem, roundsLeft, standings } from '~/shuttlekaos/engine';
import { EVERYONE_ONCE, SessionStatus, type Round, type Session, type Settings } from '~/shuttlekaos/model';

import { CourtCard } from './CourtCard';
import { BRAND, FORMAT_LABELS, namesOf, playerMap, type PlayerMap, playersOf, rankMoves } from './labels';
import { Podium } from './Podium';
import { RoundsList } from './RoundsList';
import { SessionTop } from './SessionTop';
import { StandingsTable } from './StandingsTable';

import classes from './SessionView.module.css';

const SessionTab = z.enum(['round', 'standings', 'rounds']);
type SessionTab = z.infer<typeof SessionTab>;

const WIDE_QUERY = '(min-width: 75em)';
const TAB_HEIGHT = 44;

const TAB_LABELS: Record<SessionTab, MessageDescriptor> = {
  [SessionTab.enum.round]: msg({ message: 'Round', comment: 'Tab: the round being played now' }),
  [SessionTab.enum.standings]: msg({ message: 'Standings', comment: 'Tab: the ranking so far' }),
  [SessionTab.enum.rounds]: msg({ message: 'All rounds', comment: 'Tab: every round played so far' }),
};
const RESULTS_LABEL = msg({ message: 'Results', comment: 'Tab: final ranking of a finished session' });

const RoundView: FC<{ round: Round; settings: Settings; players: PlayerMap; onEdit?: (id: string) => void }> = ({
  round,
  settings,
  players,
  onEdit,
}) => {
  const resting = namesOf(playersOf(players, round.resting));
  return (
    <Stack gap="md">
      <div className={classes.courts}>
        {round.matches.map((match) => (
          <CourtCard key={match.id} match={match} settings={settings} players={players} onEdit={onEdit} />
        ))}
      </div>
      {round.resting.length > 0 && (
        <Paper radius="lg" p="sm" className={classes.resting}>
          <Coffee aria-hidden className={classes.restingIcon} />
          <Text size="sm">
            <Trans>Resting this round: {resting}</Trans>
          </Text>
        </Paper>
      )}
    </Stack>
  );
};

const StandingsPanel: FC<{ session: Session; players: PlayerMap; title?: ReactNode; highlight?: string | null }> = ({
  session,
  players,
  title,
  highlight,
}) => {
  const rows = useMemo(() => standings(session), [session]);
  const moves = useMemo(() => rankMoves(session, session.rounds.at(-1)?.number ?? 0), [session]);
  const finished = session.status === SessionStatus.enum.finished;
  return (
    <Stack gap="lg">
      {finished && <Podium rows={rows} settings={session.settings} players={players} />}
      <Paper withBorder radius="lg" p="xs" className={classes.panel}>
        {title && (
          <Title order={2} size="h5" px="xs" pt={4} pb={6}>
            {title}
          </Title>
        )}
        <StandingsTable rows={rows} settings={session.settings} players={players} moves={moves} highlight={highlight} />
      </Paper>
    </Stack>
  );
};

type Props = {
  session: Session;
  actions?: ReactNode;
  notice?: ReactNode;
  footer?: ReactNode;
  onEdit?: (matchId: string) => void;
  highlight?: string | null;
};

export const SessionView: FC<Props> = ({ session, actions, notice, footer, onEdit, highlight }) => {
  const { t, i18n } = useLingui();
  usePageTitle(session.title || BRAND, BRAND);
  const wide = useMediaQuery(WIDE_QUERY);
  const [picked, setPicked] = useState<SessionTab>(SessionTab.enum.round);
  const [status, setStatus] = useState(session.status);
  if (status !== session.status) {
    setStatus(session.status);
    setPicked(session.status === SessionStatus.enum.finished ? SessionTab.enum.standings : SessionTab.enum.round);
  }
  const players = useMemo(() => playerMap(session.players), [session.players]);
  const finished = session.status === SessionStatus.enum.finished;
  const tab = finished && picked === SessionTab.enum.round ? SessionTab.enum.standings : picked;
  const current = session.rounds.at(-1);
  const roundNumber = current?.number ?? 0;
  const playedRounds = session.rounds.filter((r) =>
    r.matches.some((m) => gamesProblem(session.settings, m.games) === null),
  ).length;
  const roundLimit = session.settings.rounds;
  const left = roundsLeft(session);
  const roughTotal = roundNumber + (left ?? 0);
  const playerCount = session.players.length;
  const format = i18n._(FORMAT_LABELS[session.settings.format].label);

  const options = useMemo<SegmentedOption<SessionTab>[]>(
    () =>
      finished
        ? [
            { value: SessionTab.enum.standings, label: i18n._(RESULTS_LABEL) },
            { value: SessionTab.enum.rounds, label: i18n._(TAB_LABELS[SessionTab.enum.rounds]) },
          ]
        : [
            { value: SessionTab.enum.round, label: i18n._(TAB_LABELS[SessionTab.enum.round]) },
            { value: SessionTab.enum.standings, label: i18n._(TAB_LABELS[SessionTab.enum.standings]) },
            { value: SessionTab.enum.rounds, label: i18n._(TAB_LABELS[SessionTab.enum.rounds]) },
          ],
    [finished, i18n],
  );

  let progress: ReactNode;
  if (finished) progress = <Plural value={playedRounds} one="Finished after # round" other="Finished after # rounds" />;
  else if (roundLimit === EVERYONE_ONCE && left !== null) {
    progress = (
      <Trans comment="The total is an estimate, e.g. Round 3 of ~11">
        Round {roundNumber} of ~{roughTotal}
      </Trans>
    );
  } else if (typeof roundLimit === 'number')
    progress = (
      <Trans>
        Round {roundNumber} of {roundLimit}
      </Trans>
    );
  else progress = <Trans>Round {roundNumber}</Trans>;

  let content: ReactNode = null;
  if (tab === SessionTab.enum.standings) {
    content = <StandingsPanel session={session} players={players} highlight={highlight} />;
  } else if (tab === SessionTab.enum.rounds) {
    content = <RoundsList rounds={session.rounds} settings={session.settings} players={players} onEdit={onEdit} />;
  } else if (current) {
    content = (
      <div className={classes.roundLayout} data-wide={wide || undefined}>
        <RoundView round={current} settings={session.settings} players={players} onEdit={onEdit} />
        {wide && (
          <aside className={classes.aside}>
            <StandingsPanel
              session={session}
              players={players}
              highlight={highlight}
              title={i18n._(TAB_LABELS[SessionTab.enum.standings])}
            />
          </aside>
        )}
      </div>
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
      <PageToolbar>
        <Segmented label={t`View`} options={options} value={tab} onChange={setPicked} height={TAB_HEIGHT} />
      </PageToolbar>
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
