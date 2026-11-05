import { Trans, useLingui } from '@lingui/react/macro';
import { Paper, Text, ThemeIcon, Title } from '@mantine/core';
import { memo, type ReactNode } from 'react';

import { Drop, Racket, Shuttle, Sneaker } from '~/components/ui';
import { BRING, BRING_NOTE, BringKind } from '~/data/club';

import classes from './BringList.module.css';

const ICONS: Record<BringKind, ReactNode> = {
  [BringKind.enum.shoes]: <Sneaker />,
  [BringKind.enum.racket]: <Racket />,
  [BringKind.enum.water]: <Drop />,
};

export const BringList = memo<{ id?: string }>(({ id }) => {
  const { i18n } = useLingui();
  return (
    <Paper withBorder radius="lg" p="lg" id={id} className={classes.card}>
      <Title order={3}>
        <Trans>What to bring</Trans>
      </Title>
      <ul className={classes.items}>
        {BRING.map((item) => (
          <li key={item.kind} className={classes.item}>
            <ThemeIcon size={44} radius="md" variant="light" className={classes.icon}>
              {ICONS[item.kind]}
            </ThemeIcon>
            <div>
              <Text fw={600} lh={1.3}>
                {i18n._(item.label)}
              </Text>
              {item.note && (
                <Text size="sm" c="dimmed" lh={1.35}>
                  {i18n._(item.note)}
                </Text>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className={classes.note}>
        <Shuttle aria-hidden className={classes.noteIcon} />
        <Text size="sm">{i18n._(BRING_NOTE)}</Text>
      </div>
    </Paper>
  );
});
