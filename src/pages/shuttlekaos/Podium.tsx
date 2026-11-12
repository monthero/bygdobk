import { Trans } from '@lingui/react/macro';
import { Avatar, Text } from '@mantine/core';
import { memo } from 'react';

import { CrownSimpleFill, MedalFill, TrophyFill } from '~/components/ui';
import type { Standing } from '~/shuttlekaos/model';

import { namesOf, type PlayerMap, playersOf } from './labels';
import { PlayerAvatar } from './People';

import classes from './Podium.module.css';

const BURSTS = [1, 2, 3, 4, 5, 6];

type Props = { rows: Standing[]; players: PlayerMap };

export const Podium = memo<Props>(({ rows, players }) => {
  const top = rows.at(0);
  if (!top || top.played === 0) return null;
  const shared = rows.filter((r) => r.rank === 1).length > 1;
  const places = rows.slice(0, 3);

  return (
    <section className={classes.card}>
      <div className={classes.fireworks} aria-hidden>
        {BURSTS.map((burst) => (
          <span key={burst} className={classes.burst} />
        ))}
      </div>
      <Text className={classes.eyebrow}>
        {shared ? <Trans>Shared win</Trans> : <Trans comment="Heading above the session winner">Winner</Trans>}
      </Text>
      <ol className={classes.podium}>
        {places.map((row, index) => {
          const members = playersOf(players, row.playerIds);
          const winner = row.rank === 1;
          return (
            <li key={row.entrantId} className={classes.place} data-place={index + 1} data-winner={winner || undefined}>
              <div className={classes.portrait}>
                {index === 0 && <CrownSimpleFill className={classes.crown} aria-hidden />}
                <Avatar.Group spacing={8} className={classes.avatars}>
                  {members.map((p) => (
                    <PlayerAvatar key={p.id} player={p} size={index === 0 ? 'xl' : 'lg'} />
                  ))}
                </Avatar.Group>
                <span className={classes.award} data-rank={Math.min(row.rank, 3)} aria-hidden>
                  {winner ? <TrophyFill /> : <MedalFill />}
                </span>
              </div>
              <Text fw={700} ta="center" lineClamp={2} className={classes.name}>
                {namesOf(members)}
              </Text>
              <div className={classes.step}>{row.rank}</div>
            </li>
          );
        })}
      </ol>
    </section>
  );
});
