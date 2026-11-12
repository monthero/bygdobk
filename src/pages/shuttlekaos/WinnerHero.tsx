import { Trans } from '@lingui/react/macro';
import { Avatar, Paper, Text, ThemeIcon } from '@mantine/core';
import { memo } from 'react';

import { Confetti } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import type { Standing } from '~/shuttlekaos/model';

import { namesOf, playersOf, type PlayerMap } from './labels';
import { PlayerAvatar } from './People';

import classes from './WinnerHero.module.css';

const SIGNED: Intl.NumberFormatOptions = { signDisplay: 'exceptZero' };

export const WinnerHero = memo<{ rows: Standing[]; players: PlayerMap }>(({ rows, players }) => {
  const winners = rows.filter((r) => r.rank === 1);
  const top = winners.at(0);
  if (!top || top.played === 0) return null;
  const members = winners.flatMap((w) => playersOf(players, w.playerIds));
  const names = namesOf(members);
  const shared = winners.length > 1;
  const diff = numberFormat(SIGNED).format(top.pointsFor - top.pointsAgainst);

  return (
    <Paper radius="lg" className={classes.hero}>
      <ThemeIcon variant="filled" color="brand" radius="xl" size={48} autoContrast className={classes.icon}>
        <Confetti />
      </ThemeIcon>
      <Text className={classes.eyebrow}>
        {shared ? <Trans>Shared win</Trans> : <Trans comment="Heading above the session winner">Winner</Trans>}
      </Text>
      <Avatar.Group spacing={8}>
        {members.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="lg" />
        ))}
      </Avatar.Group>
      <Text className={classes.name}>{names}</Text>
      <dl className={classes.stats}>
        <div>
          <dt>
            <Trans comment="Stat label: matches won">Wins</Trans>
          </dt>
          <dd>{top.won}</dd>
        </div>
        <div>
          <dt>
            <Trans comment="Stat label: points scored">Points</Trans>
          </dt>
          <dd>{top.pointsFor}</dd>
        </div>
        <div>
          <dt>
            <Trans comment="Stat label: points scored minus points conceded">Score difference</Trans>
          </dt>
          <dd>{diff}</dd>
        </div>
      </dl>
    </Paper>
  );
});
