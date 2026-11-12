import { Avatar, type MantineSize } from '@mantine/core';
import { memo, type FC } from 'react';

import { AVATAR_IMAGE_PROPS } from '~/components/auth';
import type { Player } from '~/shuttlekaos/model';

import { namesOf } from './labels';

import classes from './People.module.css';

type AvatarProps = { player: Pick<Player, 'name' | 'avatarUrl'>; size?: MantineSize | number };

export const PlayerAvatar: FC<AvatarProps> = ({ player, size = 'md' }) => (
  <Avatar src={player.avatarUrl} name={player.name} color="initials" size={size} imageProps={AVATAR_IMAGE_PROPS} />
);

type Props = { players: Player[]; size?: MantineSize | number; stacked?: boolean };

export const PlayerNames = memo<Props>(({ players, size = 'sm', stacked }) => {
  if (stacked) {
    return (
      <span className={classes.lines}>
        {players.map((p) => (
          <span key={p.id} className={classes.entrant}>
            <PlayerAvatar player={p} size={size} />
            <span className={classes.name}>{p.name}</span>
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className={classes.entrant}>
      <Avatar.Group spacing={4} className={classes.avatars}>
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size={size} />
        ))}
      </Avatar.Group>
      <span className={classes.name}>{namesOf(players)}</span>
    </span>
  );
});
