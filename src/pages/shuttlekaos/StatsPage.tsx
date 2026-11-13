import { Trans, useLingui } from '@lingui/react/macro';
import { Container, Skeleton, Stack, Text } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { useAuthReady, useSessionUserId } from '~/components/auth/hooks';
import { ChartLineUp, Handshake, ListNumbers } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { LoadError } from '~/pages/board/LoadError';
import { useMyStats, type MyStats } from '~/shuttlekaos/queries';

import { BrandHeader } from './BrandHeader';
import { Section } from './FormParts';
import { BRAND, SectionColor } from './labels';
import { LoginPrompt } from './LoginPrompt';
import { FormChart, PartnerList, SessionResults, StatTiles, StatTilesSkeleton } from './MyStats';
import { NewSessionButton } from './NewSessionButton';

import startClasses from './StartPage.module.css';
import classes from './StatsPage.module.css';

const StatsBody: FC<{ stats: MyStats }> = ({ stats }) => {
  if (stats.totals.sessions === 0) {
    return (
      <Stack gap="md" align="flex-start">
        <Text>
          <Trans>No stats yet. Play a session to the end and your stats show up here.</Trans>
        </Text>
        <NewSessionButton />
      </Stack>
    );
  }
  return (
    <Stack gap="lg">
      <StatTiles totals={stats.totals} full />
      <div className={classes.grid}>
        <Section
          title={<Trans comment="Heading for the chart of your place in each session">Form</Trans>}
          icon={<ChartLineUp />}
          color={SectionColor.enum.teal}
        >
          <Text size="sm" c="dimmed" mt={-8}>
            <Trans>Where you finished in each session, oldest first.</Trans>
          </Text>
          <FormChart form={stats.form} />
        </Section>
        <Section title={<Trans>Favorite partners</Trans>} icon={<Handshake />} color={SectionColor.enum.grape}>
          <PartnerList partners={stats.partners} />
        </Section>
      </div>
      <Section
        title={<Trans comment="Heading for your latest finished sessions and your place in each">Your results</Trans>}
        icon={<ListNumbers />}
        color={SectionColor.enum.blue}
      >
        <SessionResults form={stats.form} />
      </Section>
    </Stack>
  );
};

export const StatsPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t({ message: 'Your stats', comment: 'Browser tab title for your ShuttleKaos stats' }), BRAND);
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const stats = useMyStats();

  let body: ReactNode;
  if (ready && !userId) {
    body = (
      <LoginPrompt>
        <Trans>Log in to see your stats from the sessions you played.</Trans>
      </LoginPrompt>
    );
  } else if (stats.isError) {
    body = (
      <LoadError
        title={t`Couldn't load your stats`}
        error={stats.error}
        retrying={stats.isRefetching}
        onRetry={() => void stats.refetch()}
      />
    );
  } else if (stats.data) {
    body = <StatsBody stats={stats.data} />;
  } else {
    body = (
      <Stack gap="lg">
        <StatTilesSkeleton full />
        <div className={classes.grid}>
          <Skeleton height={300} radius="lg" />
          <Skeleton height={300} radius="lg" />
        </div>
      </Stack>
    );
  }

  return (
    <>
      <BrandHeader back title={<Trans>Your stats</Trans>} />
      <Container className={startClasses.main}>{body}</Container>
    </>
  );
};
