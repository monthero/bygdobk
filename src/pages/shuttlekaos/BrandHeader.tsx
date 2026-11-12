import { useLingui } from '@lingui/react/macro';
import { ActionIcon, Container, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import { ArrowLeft, Shuttle } from '~/components/ui';

import { TAGLINE } from './labels';

import classes from './BrandHeader.module.css';

const Wordmark: FC = () => (
  <>
    Shuttle<span className={classes.kaos}>Kaos</span>
  </>
);

type Props = { title?: ReactNode; eyebrow?: ReactNode; lede?: ReactNode; back?: boolean; actions?: ReactNode };

export const BrandHeader: FC<Props> = ({ title, eyebrow, lede, back, actions }) => {
  const { t, i18n } = useLingui();
  return (
    <header className={classes.header} data-compact={title ? true : undefined}>
      <Container className={classes.inner}>
        <div className={classes.row}>
          {back ? (
            <ActionIcon
              variant="default"
              radius="xl"
              size={44}
              aria-label={t`Back to ShuttleKaos`}
              renderRoot={(props) => <Link {...props} to="/shuttlekaos" />}
            >
              <ArrowLeft />
            </ActionIcon>
          ) : (
            <span className={classes.mark} aria-hidden>
              <Shuttle />
            </span>
          )}
          <div className={classes.text}>
            {title && <Text className={classes.eyebrow}>{eyebrow ?? <Wordmark />}</Text>}
            <Title order={1} className={classes.title}>
              {title ?? <Wordmark />}
            </Title>
            {!title && <Text className={classes.tagline}>{i18n._(TAGLINE)}</Text>}
            {lede && <Text className={classes.lede}>{lede}</Text>}
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </Container>
    </header>
  );
};
