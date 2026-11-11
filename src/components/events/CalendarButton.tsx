import { Trans } from '@lingui/react/macro';
import { Button, type ButtonProps } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { useState, type FC } from 'react';

import { calendarFile, type IcsEvent } from '~/cms/ics';
import { CalendarPlus, Check } from '~/components/ui';
import { downloadFile } from '~/utils/download';

const DONE_MS = 2500;
const ICS_TYPE = 'text/calendar;charset=utf-8';

type Props = Pick<ButtonProps, 'size' | 'variant'> & { fileName: string; events: () => IcsEvent[] };

export const CalendarButton: FC<Props> = ({ fileName, events, size, variant = 'default' }) => {
  const [done, setDone] = useState(false);
  const { start } = useTimeout(() => setDone(false), DONE_MS);
  const add = () => {
    downloadFile(calendarFile(events()), fileName, ICS_TYPE);
    setDone(true);
    start();
  };
  return (
    <Button
      size={size}
      variant={done ? 'light' : variant}
      color={done ? 'teal' : undefined}
      leftSection={done ? <Check /> : <CalendarPlus />}
      onClick={add}
      aria-live="polite"
    >
      {done ? (
        <Trans comment="Shown briefly after the calendar file was downloaded">Downloaded</Trans>
      ) : (
        <Trans>Add to calendar</Trans>
      )}
    </Button>
  );
};
