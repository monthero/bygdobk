import { Plural, Trans, useLingui } from '@lingui/react/macro';
import type { FC, ReactNode } from 'react';

import { useAuthReady, useSessionUserId } from '~/components/auth/hooks';
import { usePageTitle } from '~/hooks/usePageTitle';
import { LoadError } from '~/pages/board/LoadError';
import { useMyStats, type MyStats } from '~/shuttlekaos/queries';
import { formatDate, wallTime } from '~/utils/dates';

import { PageHead } from './home/PageHead';
import { HomeSection, SessionHistory } from './home/SessionCards';
import { BRAND } from './labels';
import { LoginPrompt } from './LoginPrompt';
import { EmptyStats, PartnerList, StatsOverview, StatsSkeleton, StatTiles } from './MyStats';

const SINCE: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

const StatsSub: FC<{ stats: MyStats }> = ({ stats }) => {
  const { sessions } = stats.totals;
  const first = stats.form.at(0);
  if (first && stats.form.length === sessions) {
    const month = formatDate(wallTime(first.startedAt), SINCE);
    return (
      <Trans comment="Under the stats title: the month of your first session, e.g. Since August 2026">
        Since {month}
      </Trans>
    );
  }
  return <Plural value={sessions} one="# session played" other="# sessions played" />;
};

const StatsBody: FC<{ stats: MyStats }> = ({ stats }) => {
  if (stats.totals.sessions === 0) return <EmptyStats />;
  return (
    <>
      <StatsOverview stats={stats} />
      <HomeSection title={<Trans comment="Heading for your stats tiles">Totals</Trans>}>
        <StatTiles totals={stats.totals} />
      </HomeSection>
      <HomeSection title={<Trans>Favorite partners</Trans>}>
        <PartnerList partners={stats.partners} />
      </HomeSection>
    </>
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
    body = <StatsSkeleton />;
  }

  return (
    <>
      <PageHead
        title={<Trans>Your stats</Trans>}
        sub={stats.data && stats.data.totals.sessions > 0 && <StatsSub stats={stats.data} />}
      />
      {body}
      <SessionHistory />
    </>
  );
};
