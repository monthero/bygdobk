import { Trans } from '@lingui/react/macro';
import { Avatar, Text } from '@mantine/core';
import { memo } from 'react';

import { ScoreMode, type Settings, type Standing } from '~/shuttlekaos/model';

import { namesOf, type PlayerMap, playersOf } from './labels';
import { PlayerAvatar } from './People';

import classes from './Podium.module.css';

type Props = { rows: Standing[]; settings: Settings; players: PlayerMap };

export const Podium = memo<Props>(({ rows, settings, players }) => {
  const total = settings.scoreMode === ScoreMode.enum.total;
  const places = rows.slice(0, 3);

  return (
    <ol className={classes.podium}>
      {places.map((row, index) => {
        const members = playersOf(players, row.playerIds);
        const points = row.pointsFor;
        const won = row.won;
        return (
          <li key={row.entrantId} className={classes.place} data-place={index + 1}>
            <Avatar.Group spacing={8} className={classes.avatars}>
              {members.map((p) => (
                <PlayerAvatar key={p.id} player={p} size="lg" />
              ))}
            </Avatar.Group>
            <Text fw={700} ta="center" lineClamp={2} className={classes.name}>
              {namesOf(members)}
            </Text>
            <Text size="sm" c="dimmed" ta="center" className="tabular">
              {total ? <Trans>{points} pts</Trans> : <Trans>{won} won</Trans>}
            </Text>
            <div className={classes.step}>{row.rank}</div>
          </li>
        );
      })}
    </ol>
  );
});
