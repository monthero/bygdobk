import { Trans } from '@lingui/react/macro';
import { Alert } from '@mantine/core';
import { memo } from 'react';

import { eventDays, type CalendarEvent } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { CalendarBlank } from '~/components/ui';
import { formatDate, formatDateRange, LONG_DATE } from '~/utils/dates';
import { trainingResumes } from '~/utils/training';

const RESUME_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
const ICON = <CalendarBlank width={22} height={22} />;

export const ClosureNotice = memo<{ event: CalendarEvent }>(({ event }) => {
  const { events } = useSiteContent();
  const { first, last } = eventDays(event);
  const range = formatDateRange(first, last, LONG_DATE);
  const resumes = trainingResumes(event, events);
  const back = resumes ? formatDate(resumes, RESUME_DATE) : '';

  return (
    <Alert variant="light" radius="lg" icon={ICON} title={event.title}>
      <Trans>No training: {range}.</Trans>
      {resumes && (
        <>
          {' '}
          <Trans>Back on court {back}.</Trans>
        </>
      )}
    </Alert>
  );
});
