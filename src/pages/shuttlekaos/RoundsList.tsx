import { Trans } from '@lingui/react/macro';
import { Accordion, Badge, Group, Text, UnstyledButton } from '@mantine/core';
import { memo, type FC } from 'react';

import { CheckCircle, Coffee, PencilSimple } from '~/components/ui';
import { gamesProblem, matchWinner } from '~/shuttlekaos/engine';
import type { Match, Round, Settings } from '~/shuttlekaos/model';

import { namesOf, type PlayerMap, playersOf } from './labels';

import classes from './RoundsList.module.css';

type LineProps = { match: Match; settings: Settings; players: PlayerMap; onEdit?: (matchId: string) => void };

const MatchLine: FC<LineProps> = ({ match, settings, players, onEdit }) => {
  const winner = matchWinner(settings, match);
  const [home, away] = match.sides.map((ids) => namesOf(playersOf(players, ids)));
  const court = match.court;
  const score = match.games.length > 0 ? match.games.map(([a, b]) => `${a}–${b}`).join(', ') : <Trans>No score</Trans>;
  const content = (
    <>
      <Text size="xs" c="dimmed" className={classes.court}>
        <Trans comment="Short label for a court number, e.g. C2">C{court}</Trans>
      </Text>
      <span className={classes.side} data-won={winner === 0 || undefined}>
        {home}
      </span>
      <span className={classes.score}>{score}</span>
      <span className={classes.side} data-won={winner === 1 || undefined} data-end>
        {away}
      </span>
      {onEdit && <PencilSimple className={classes.edit} aria-hidden />}
    </>
  );
  if (!onEdit) return <div className={classes.line}>{content}</div>;
  return (
    <UnstyledButton className={classes.line} data-editable onClick={() => onEdit(match.id)}>
      {content}
    </UnstyledButton>
  );
};

type Props = {
  rounds: Round[];
  settings: Settings;
  players: PlayerMap;
  onEdit?: (matchId: string) => void;
};

export const RoundsList = memo<Props>(({ rounds, settings, players, onEdit }) => {
  const newestFirst = rounds.toReversed();
  const latest = rounds.at(-1);
  return (
    <Accordion
      multiple
      variant="separated"
      radius="lg"
      defaultValue={latest ? [String(latest.number)] : []}
      chevronPosition="right"
    >
      {newestFirst.map((round) => {
        const number = round.number;
        const done = round.matches.filter((m) => gamesProblem(settings, m.games) === null).length;
        const count = round.matches.length;
        const resting = namesOf(playersOf(players, round.resting));
        return (
          <Accordion.Item key={round.number} value={String(round.number)} className={classes.item}>
            <Accordion.Control>
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Text fw={700}>
                  <Trans>Round {number}</Trans>
                </Text>
                {done === count ? (
                  <Badge color="teal" variant="light" leftSection={<CheckCircle />}>
                    <Trans comment="All courts in a round have a score">Done</Trans>
                  </Badge>
                ) : (
                  <Badge color="gray" variant="light" className="tabular">
                    <Trans comment="How many courts have a score, e.g. 1 of 3">
                      {done} of {count}
                    </Trans>
                  </Badge>
                )}
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <div className={classes.lines}>
                {round.matches.map((match) => (
                  <MatchLine key={match.id} match={match} settings={settings} players={players} onEdit={onEdit} />
                ))}
              </div>
              {round.resting.length > 0 && (
                <Text size="sm" c="dimmed" className={classes.resting}>
                  <Coffee aria-hidden /> <Trans>Resting: {resting}</Trans>
                </Text>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
});
