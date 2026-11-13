import { Trans } from '@lingui/react/macro';
import { Paper, Table } from '@mantine/core';
import { Link, useNavigate } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import { BRAND, stop } from './labels';

import tables from './SessionTables.module.css';

export const SessionTable: FC<{ head: ReactNode; children: ReactNode }> = ({ head, children }) => (
  <Paper withBorder radius="lg" className={tables.panel}>
    <Table className={tables.table} verticalSpacing="sm" horizontalSpacing="md">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <Trans context="table heading" comment="Table heading: when the session started, in Oslo time">
              Start
            </Trans>
          </Table.Th>
          <Table.Th>
            <Trans comment="Table heading">Session</Trans>
          </Table.Th>
          <Table.Th className={tables.location}>
            <Trans comment="Table heading: where the session is played">Location</Trans>
          </Table.Th>
          <Table.Th>
            <Trans comment="Table heading">Format</Trans>
          </Table.Th>
          {head}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{children}</Table.Tbody>
    </Table>
  </Paper>
);

export const SessionRow: FC<{ code: string; children: ReactNode }> = ({ code, children }) => {
  const navigate = useNavigate();
  return (
    <Table.Tr className={tables.row} onClick={() => void navigate({ to: '/shuttlekaos/$code', params: { code } })}>
      {children}
    </Table.Tr>
  );
};

export const SessionLink: FC<{ code: string; title: string }> = ({ code, title }) => (
  <Link to="/shuttlekaos/$code" params={{ code }} className={tables.title} onClick={stop}>
    {title || BRAND}
  </Link>
);
