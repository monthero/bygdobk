import { Avatar, type MantineSize } from '@mantine/core';
import { memo, type FC } from 'react';

import { AVATAR_IMAGE_PROPS } from '~/components/auth';

import { isMe, namesOf, type ShownPlayer } from './labels';

import classes from './People.module.css';

type AvatarProps = { player: Pick<ShownPlayer, 'name' | 'avatarUrl' | 'realName'>; size?: MantineSize | number };

export const PlayerAvatar: FC<AvatarProps> = ({ player, size = 'md' }) => (
  <Avatar
    src={player.avatarUrl}
    name={player.realName ?? player.name}
    color="initials"
    size={size}
    imageProps={AVATAR_IMAGE_PROPS}
    data-me={isMe(player) || undefined}
  />
);

type Props = { players: ShownPlayer[]; size?: MantineSize | number; stacked?: boolean; end?: boolean };

export const PlayerNames = memo<Props>(({ players, size = 'sm', stacked, end }) => {
  if (stacked) {
    return (
      <span className={classes.lines} data-end={end || undefined}>
        {players.map((p) => (
          <span key={p.id} className={classes.entrant}>
            <PlayerAvatar player={p} size={size} />
            <span className={classes.name} data-me={isMe(p) || undefined}>
              {p.name}
            </span>
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
      <span className={classes.name} data-me={players.some(isMe) || undefined}>
        {namesOf(players)}
      </span>
    </span>
  );
});
