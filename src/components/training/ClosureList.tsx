import { Badge, Group, Stack, Text } from '@mantine/core';
import { memo, type ReactNode } from 'react';

import { eventDays, type CalendarEvent } from '~/cms/calendar';
import { formatDateRange, SHORT_DATE } from '~/utils/dates';

type Props = { breaks: CalendarEvent[]; empty: ReactNode };

export const ClosureList = memo<Props>(({ breaks, empty }) => {
  if (!breaks.length) return <Text c="dimmed">{empty}</Text>;

  return (
    <Stack gap={8}>
      {breaks.map((event) => {
        const { first, last } = eventDays(event);
        return (
          <Group key={event.id} gap="md">
            <Badge variant="light" color="gray" size="lg" className="tabular">
              {formatDateRange(first, last, SHORT_DATE)}
            </Badge>
            <Text>{event.title}</Text>
          </Group>
        );
      })}
    </Stack>
  );
});
