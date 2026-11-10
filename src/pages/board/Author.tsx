import { Trans } from '@lingui/react/macro';
import type { FC } from 'react';

import { useIsOnBoard } from '~/cms/siteData';
import { BoardBadge } from '~/components/ui';
import type { AuthorRef } from '~/memberships/model';

import classes from './Author.module.css';

export const Author: FC<{ person: AuthorRef }> = ({ person }) => {
  const isOnBoard = useIsOnBoard();
  if (!person) {
    return <Trans comment="Stands in for the person who did something, when we don't know who">the board</Trans>;
  }
  return (
    <span className={classes.author}>
      {person.name}
      {isOnBoard(person.email) && <BoardBadge />}
    </span>
  );
};
