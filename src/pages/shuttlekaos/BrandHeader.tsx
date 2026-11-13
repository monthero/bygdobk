import { useLingui } from '@lingui/react/macro';
import { ActionIcon, Container, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import { ArrowLeft } from '~/components/ui';

import classes from './BrandHeader.module.css';

export const Wordmark: FC = () => (
  <>
    Shuttle<span className={classes.kaos}>Kaos</span>
  </>
);

export const BackButton: FC<{ size?: number }> = ({ size = 44 }) => {
  const { t } = useLingui();
  return (
    <ActionIcon
      variant="default"
      radius="xl"
      size={size}
      aria-label={t`Back to ShuttleKaos`}
      renderRoot={(props) => <Link {...props} to="/shuttlekaos" />}
    >
      <ArrowLeft />
    </ActionIcon>
  );
};

type Props = { title: ReactNode; eyebrow?: ReactNode; back?: boolean; actions?: ReactNode };

export const BrandHeader: FC<Props> = ({ title, eyebrow, back, actions }) => {
  return (
    <header className={classes.header} data-compact>
      <Container className={classes.inner}>
        <div className={classes.row}>
          {back && <BackButton />}
          <div className={classes.text}>
            <Text className={classes.eyebrow}>{eyebrow ?? <Wordmark />}</Text>
            <Title order={1} className={classes.title}>
              {title}
            </Title>
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </Container>
    </header>
  );
};
