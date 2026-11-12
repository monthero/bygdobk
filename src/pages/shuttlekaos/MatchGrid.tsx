import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Paper, Select, Text } from '@mantine/core';
import { memo, useMemo, useState, type FC, type ReactNode } from 'react';

import { Clock, Coffee, Users } from '~/components/ui';
import { gamesProblem, matchWinner } from '~/shuttlekaos/engine';
import type { Match, Round, Session, Settings } from '~/shuttlekaos/model';

import { isMe, matchMinutes, namesOf, playersOf, type PlayerMap } from './labels';
import { PlayerAvatar, PlayerNames } from './People';

import classes from './MatchGrid.module.css';

const firstName = (name: string) => name.split(' ').at(0) ?? name;

type FilterButtonProps = { active: boolean; label?: string; onClick: () => void; children: ReactNode };

const FilterButton: FC<FilterButtonProps> = ({ active, label, onClick, children }) => (
  <Button
    h={40}
    radius="xl"
    variant={active ? 'filled' : 'default'}
    color={active ? 'brand' : undefined}
    autoContrast
    aria-pressed={active}
    aria-label={label}
    onClick={onClick}
    className={classes.chip}
  >
    {children}
  </Button>
);

type CardProps = { match: Match; round: Round; settings: Settings; players: PlayerMap; withRound?: boolean };

const MatchCard = memo<CardProps>(({ match, round, settings, players, withRound }) => {
  const { t } = useLingui();
  const done = gamesProblem(settings, match.games) === null;
  const winner = done ? matchWinner(settings, match) : null;
  const court = match.court;
  const number = round.number;
  const minutes = matchMinutes(round, match);

  let note: ReactNode = null;
  if (!done) note = <Trans comment="A match that has no valid score">No score</Trans>;
  else if (winner === null) note = <Trans comment="A match that ended level">Draw</Trans>;

  return (
    <Paper withBorder radius="md" className={classes.card}>
      <div className={classes.head}>
        <Text size="xs" fw={700} c="dimmed">
          {withRound ? (
            <Trans comment="Card header, e.g. Round 3 · Court 2">
              Round {number} · Court {court}
            </Trans>
          ) : (
            <Trans>Court {court}</Trans>
          )}
        </Text>
        <div className={classes.meta}>
          {note && (
            <Text size="xs" c="dimmed">
              {note}
            </Text>
          )}
          {minutes !== null && (
            <Text size="xs" c="dimmed" className={classes.minutes} aria-label={t`About ${minutes} minutes`}>
              <Clock aria-hidden />
              {minutes}'
            </Text>
          )}
        </div>
      </div>
      {match.sides.map((ids, side) => (
        <div
          key={side}
          className={classes.side}
          data-won={(winner !== null && winner === side) || undefined}
          data-lost={(winner !== null && winner !== side) || undefined}
        >
          <PlayerNames players={playersOf(players, ids)} size={20} stacked />
          <span className={classes.score}>
            {done ? (
              match.games.map((game, i) => (
                <span key={i} className={classes.game}>
                  {game[side]}
                </span>
              ))
            ) : (
              <span className={classes.game}>–</span>
            )}
          </span>
        </div>
      ))}
    </Paper>
  );
});

const RestCard: FC<{ round: number }> = ({ round }) => (
  <Paper radius="md" className={classes.rest}>
    <Coffee aria-hidden className={classes.restIcon} />
    <Text size="sm" c="dimmed">
      <Trans comment="Card for a round the chosen player sat out, e.g. Round 2 · Resting">
        Round {round} · Resting
      </Trans>
    </Text>
  </Paper>
);

type GroupProps = { round: Round; settings: Settings; players: PlayerMap };

const RoundGroup: FC<GroupProps> = ({ round, settings, players }) => {
  const number = round.number;
  const names = namesOf(playersOf(players, round.resting).map((p) => ({ ...p, name: firstName(p.name) })));
  return (
    <section className={classes.group}>
      <div className={classes.groupHead}>
        <Text component="h3" fw={800} size="sm" m={0}>
          <Trans>Round {number}</Trans>
        </Text>
        {round.resting.length > 0 && (
          <Badge
            variant="light"
            color="gray"
            size="md"
            tt="none"
            leftSection={<Coffee aria-hidden />}
            className={classes.resting}
          >
            <Trans comment="Followed by the names of players who sat out the round">Resting: {names}</Trans>
          </Badge>
        )}
      </div>
      <div className={classes.grid}>
        {round.matches.map((match) => (
          <MatchCard key={match.id} match={match} round={round} settings={settings} players={players} />
        ))}
      </div>
    </section>
  );
};

type Props = { session: Session; players: PlayerMap };

export const MatchGrid: FC<Props> = ({ session, players }) => {
  const { t } = useLingui();
  const [roundFilter, setRoundFilter] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const { rounds, settings } = session;
  const options = useMemo(
    () =>
      players
        .values()
        .toArray()
        .sort((a, b) => Number(isMe(b)) - Number(isMe(a)) || a.name.localeCompare(b.name))
        .map((p) => ({ value: p.id, label: p.name })),
    [players],
  );
  const shown = roundFilter === null ? rounds : rounds.filter((r) => r.number === roundFilter);
  const picked = playerId === null ? undefined : players.get(playerId);

  let results: ReactNode;
  if (playerId === null) {
    results = shown.map((round) => (
      <RoundGroup key={round.number} round={round} settings={settings} players={players} />
    ));
  } else {
    results = (
      <div className={classes.grid}>
        {shown.map((round) => {
          const match = round.matches.find((m) => m.sides.some((ids) => ids.includes(playerId)));
          if (match) {
            return (
              <MatchCard key={match.id} match={match} round={round} settings={settings} players={players} withRound />
            );
          }
          return round.resting.includes(playerId) ? <RestCard key={round.number} round={round.number} /> : null;
        })}
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.filters}>
        <fieldset className={classes.rounds} aria-label={t`Rounds`}>
          <FilterButton active={roundFilter === null} onClick={() => setRoundFilter(null)}>
            <Trans comment="Filter option: show every round">All</Trans>
          </FilterButton>
          {rounds.map(({ number }) => (
            <FilterButton
              key={number}
              active={roundFilter === number}
              label={t`Round ${number}`}
              onClick={() => setRoundFilter(number)}
            >
              <Trans comment="Short label for a round number, e.g. R3 for Round 3">R{number}</Trans>
            </FilterButton>
          ))}
        </fieldset>
        <Select
          className={classes.player}
          classNames={{ input: classes.playerInput, section: classes.playerSection }}
          data={options}
          value={playerId}
          onChange={setPlayerId}
          placeholder={t`All players`}
          aria-label={t`Player`}
          leftSection={picked ? <PlayerAvatar player={picked} size={22} /> : <Users />}
          clearable
          searchable
          radius="xl"
          size="md"
        />
      </div>
      {results}
    </div>
  );
};
