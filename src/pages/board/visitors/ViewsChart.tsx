import { Trans, useLingui } from '@lingui/react/macro';
import { AreaChart, BarChart, type AreaChartSeries } from '@mantine/charts';
import { Button, Collapse, Stack, Table } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useId, useMemo, type FC } from 'react';

import { CaretDown } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import { formatDate } from '~/utils/dates';
import { Bucket, viewsOverTime, type PeriodRange, type VisitReport } from '~/visitors/model';

import classes from './VisitorsPage.module.css';

const CHART_HEIGHT = 260;
const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
const Y_AXIS = { allowDecimals: false, width: 44 };
const X_AXIS = { minTickGap: 12 };

const AXIS_LABEL: Record<Bucket, Intl.DateTimeFormatOptions> = {
  [Bucket.enum.day]: { day: 'numeric', month: 'short' },
  [Bucket.enum.month]: { month: 'short' },
};

const ROW_LABEL: Record<Bucket, Intl.DateTimeFormatOptions> = {
  [Bucket.enum.day]: { weekday: 'short', day: 'numeric', month: 'short' },
  [Bucket.enum.month]: { month: 'long', year: 'numeric' },
};

const formatCount = (n: number) => numberFormat().format(n);

type Props = { days: VisitReport['days']; range: PeriodRange };

export const ViewsChart: FC<Props> = ({ days, range }) => {
  const { t } = useLingui();
  const [tableOpened, { toggle }] = useDisclosure(false);
  const tableId = useId();
  const { bucket } = range;

  const points = viewsOverTime(days, range).map(({ start, views }) => ({
    key: start.valueOf(),
    label: formatDate(start, AXIS_LABEL[bucket]),
    row: formatDate(start, ROW_LABEL[bucket]),
    views,
  }));
  const series = useMemo<AreaChartSeries[]>(
    () => [{ name: 'views', label: t`Views`, color: 'var(--visits-ink)' }],
    [t],
  );

  const common = {
    h: CHART_HEIGHT,
    data: points,
    dataKey: 'label',
    series,
    gridAxis: 'x',
    tickLine: 'none',
    strokeDasharray: '0',
    valueFormatter: formatCount,
    yAxisProps: Y_AXIS,
    xAxisProps: X_AXIS,
    className: classes.chart,
  } as const;

  return (
    <Stack gap="sm">
      {bucket === Bucket.enum.month ? (
        <BarChart {...common} maxBarWidth={24} barProps={{ radius: BAR_RADIUS }} />
      ) : (
        <AreaChart {...common} curveType="monotone" withGradient={false} fillOpacity={0.1} withDots={false} />
      )}
      <Button
        variant="subtle"
        size="compact-sm"
        className={classes.toggle}
        rightSection={<CaretDown className={classes.toggle__caret} data-opened={tableOpened || undefined} />}
        aria-expanded={tableOpened}
        aria-controls={tableId}
        onClick={toggle}
      >
        {tableOpened ? <Trans>Hide the numbers</Trans> : <Trans>Show the numbers</Trans>}
      </Button>
      <Collapse expanded={tableOpened} id={tableId}>
        <Table striped className="tabular">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                {bucket === Bucket.enum.month ? (
                  <Trans comment="Table column: calendar month">Month</Trans>
                ) : (
                  <Trans comment="Table column: calendar day">Day</Trans>
                )}
              </Table.Th>
              <Table.Th ta="end">
                <Trans>Views</Trans>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {points.map((p) => (
              <Table.Tr key={p.key}>
                <Table.Td>{p.row}</Table.Td>
                <Table.Td ta="end">{formatCount(p.views)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Collapse>
    </Stack>
  );
};
