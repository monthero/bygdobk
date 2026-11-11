import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Container, Paper, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { getRouteApi, Navigate } from '@tanstack/react-router';
import { useId, useMemo, type FC, type ReactNode } from 'react';

import { useSitePhoto } from '~/cms/siteData';
import { useSignedOut } from '~/components/auth/hooks';
import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { ChartLineUp, Segmented } from '~/components/ui';
import { PhotoSlot } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';
import { numberFormat } from '~/i18n/current';
import { LOCALE_META } from '~/i18n/locales';
import { LoadError } from '~/pages/board/LoadError';
import { StatCard } from '~/pages/board/StatCard';
import { STAY } from '~/utils/navigation';
import { percent } from '~/utils/numbers';
import {
  Bucket,
  DEFAULT_PERIOD,
  periodRange,
  VisitDevice,
  VisitPeriod,
  type PeriodRange,
  type VisitReport,
} from '~/visitors/model';
import { useBoardVisits } from '~/visitors/queries';

import { usePageName } from './pageNames';
import { Ranking } from './Ranking';
import { ViewsChart } from './ViewsChart';

import classes from './VisitorsPage.module.css';

const route = getRouteApi('/styret/besokende');

const EMPTY_ICON_SIZE = 40;
const SKELETON_CARDS = [0, 1];
const SHARE = { style: 'percent', maximumFractionDigits: 0 } as const;

const PERIOD_LABELS: Record<VisitPeriod, MessageDescriptor> = {
  [VisitPeriod.enum.uke]: msg({ message: '7 days', comment: 'Period picker for visitor numbers: the last 7 days' }),
  [VisitPeriod.enum.maned]: msg({ message: '30 days', comment: 'Period picker for visitor numbers: the last 30 days' }),
  [VisitPeriod.enum.ar]: msg({
    message: '12 months',
    comment: 'Period picker for visitor numbers: the last 12 months',
  }),
};

const DEVICE_LABELS: Record<VisitDevice, MessageDescriptor> = {
  [VisitDevice.enum.phone]: msg({ message: 'Phone', comment: 'Visitor numbers: views from mobile phones' }),
  [VisitDevice.enum.tablet]: msg({ message: 'Tablet', comment: 'Visitor numbers: views from tablets' }),
  [VisitDevice.enum.computer]: msg({
    message: 'Computer',
    comment: 'Visitor numbers: views from laptops and desktops',
  }),
};

const formatCount = (n: number) => numberFormat().format(n);

const Section: FC<{ title: ReactNode; children: ReactNode }> = ({ title, children }) => {
  const id = useId();
  return (
    <Paper component="section" withBorder radius="lg" p="md" aria-labelledby={id} className={classes.section}>
      <Stack gap="md">
        <Title order={2} size="h4" id={id}>
          {title}
        </Title>
        {children}
      </Stack>
    </Paper>
  );
};

const Report: FC<{ report: VisitReport; range: PeriodRange }> = ({ report, range }) => {
  const { t, i18n } = useLingui();
  const pageName = usePageName();
  const views = t`Views`;
  const share = numberFormat(SHARE).format(percent(report.fromOtherSites, report.views) * 0.01);

  const pages = useMemo(
    () => report.pages.map(({ path, views: value }) => ({ name: pageName(path), value })),
    [report.pages, pageName],
  );
  const referrers = useMemo(
    () => report.referrers.map(({ host, views: value }) => ({ name: host, value })),
    [report.referrers],
  );
  const devices = useMemo(
    () => report.devices.map(({ device, views: value }) => ({ name: i18n._(DEVICE_LABELS[device]), value })),
    [report.devices, i18n],
  );
  const languages = useMemo(
    () => report.languages.map(({ language, views: value }) => ({ name: LOCALE_META[language].name, value })),
    [report.languages],
  );

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
        <StatCard label={<Trans>Page views</Trans>} value={formatCount(report.views)} />
        <StatCard label={<Trans>From other sites</Trans>} value={formatCount(report.fromOtherSites)}>
          <Text size="sm" c="dimmed">
            <Trans comment="Below the number of views that came from links on other websites, e.g. 12% of all views">
              {share} of all views
            </Trans>
          </Text>
        </StatCard>
      </SimpleGrid>

      <Section
        title={range.bucket === Bucket.enum.month ? <Trans>Views per month</Trans> : <Trans>Views per day</Trans>}
      >
        <ViewsChart days={report.days} range={range} />
      </Section>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Section title={<Trans>Top pages</Trans>}>
          <Ranking
            data={pages}
            label={t({ message: 'Page', comment: 'Column heading: a page on the website' })}
            valueLabel={views}
          />
        </Section>
        <Stack gap="lg">
          <Section title={<Trans comment="Heading: websites that linked visitors to us">Other sites</Trans>}>
            {referrers.length > 0 ? (
              <Ranking
                data={referrers}
                label={t({ message: 'Site', comment: 'Column heading: another website' })}
                valueLabel={views}
              />
            ) : (
              <Text size="sm" c="dimmed">
                <Trans>No visits from other sites in this period.</Trans>
              </Text>
            )}
          </Section>
          <Section title={<Trans>Devices</Trans>}>
            <Ranking
              data={devices}
              label={t({ message: 'Device', comment: 'Column heading: phone, tablet or computer' })}
              valueLabel={views}
              total={report.views}
            />
          </Section>
          <Section title={<Trans>Languages</Trans>}>
            <Ranking data={languages} label={t`Language`} valueLabel={views} total={report.views} />
          </Section>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
};

const ReportSkeleton: FC = () => (
  <Stack gap="lg" aria-busy>
    <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
      {SKELETON_CARDS.map((i) => (
        <Skeleton key={i} height={120} radius="lg" />
      ))}
    </SimpleGrid>
    <Skeleton height={372} radius="lg" />
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      {SKELETON_CARDS.map((i) => (
        <Skeleton key={i} height={320} radius="lg" />
      ))}
    </SimpleGrid>
  </Stack>
);

const NoVisits: FC = () => (
  <Stack align="center" gap="sm" py={40} ta="center">
    <Text c="dimmed" lh={0}>
      <ChartLineUp width={EMPTY_ICON_SIZE} height={EMPTY_ICON_SIZE} aria-hidden />
    </Text>
    <Title order={2} size="h3">
      <Trans>No visits counted yet</Trans>
    </Title>
    <Text c="dimmed">
      <Trans>Try a longer period, or check back later.</Trans>
    </Text>
  </Stack>
);

export const VisitorsPage: FC = () => {
  const { t, i18n } = useLingui();
  usePageTitle(t`Visitors`, t`The board`);
  const photo = useSitePhoto(PhotoSlot.enum.boardVisitors);
  const signedOut = useSignedOut();
  const { periode = DEFAULT_PERIOD } = route.useSearch();
  const navigate = route.useNavigate();
  const range = useMemo(() => periodRange(periode), [periode]);
  const visits = useBoardVisits(range);

  const periodOptions = useMemo(
    () => VisitPeriod.options.map((value) => ({ value, label: i18n._(PERIOD_LABELS[value]) })),
    [i18n],
  );
  const pickPeriod = (value: VisitPeriod) =>
    navigate({ search: { periode: value === DEFAULT_PERIOD ? undefined : value }, ...STAY });

  if (signedOut) return <Navigate to="/" replace />;

  return (
    <>
      <PageIntro
        photo={photo}
        eyebrow={<Trans comment="Eyebrow above the page title: the club board">The board</Trans>}
        title={<Trans comment="Board screen with website visitor numbers">Visitors</Trans>}
        lede={<Trans>How many pages people open on the website. Counted without cookies or personal data.</Trans>}
      />

      <PageToolbar>
        <Segmented label={t`Period`} options={periodOptions} value={periode} onChange={pickPeriod} />
      </PageToolbar>

      <Container py={32}>
        {visits.isPending && <ReportSkeleton />}
        {visits.isError && (
          <LoadError
            title={t`Couldn't load the visitor numbers`}
            error={visits.error}
            retrying={visits.isRefetching}
            onRetry={() => void visits.refetch()}
          />
        )}
        {visits.data && visits.data.views === 0 && <NoVisits />}
        {visits.data && visits.data.views > 0 && <Report report={visits.data} range={range} />}
      </Container>
    </>
  );
};
