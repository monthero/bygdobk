import { Trans, useLingui } from '@lingui/react/macro';
import { Alert } from '@mantine/core';
import { memo } from 'react';

import { CalendarBlank } from '~/components/ui';
import type { ClosureId } from '~/data/club';
import { useClosures } from '~/stores/content';
import { date, formatDate, formatDateRange, LONG_DATE } from '~/utils/dates';
import { closureReason, trainingResumes } from '~/utils/training';

const RESUME_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
const ICON = <CalendarBlank width={22} height={22} />;

export const ClosureNotice = memo<{ id: ClosureId }>(({ id }) => {
  const { i18n } = useLingui();
  const closures = useClosures();
  const closure = closures.find((c) => c.id === id);
  if (!closure) return null;

  const range = formatDateRange(date(closure.from), date(closure.to), LONG_DATE);
  const resumes = trainingResumes(closure, closures);
  const back = resumes ? formatDate(resumes, RESUME_DATE) : '';

  return (
    <Alert variant="light" radius="lg" icon={ICON} title={closureReason(i18n, closure)}>
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
