import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from '@mantine/core';
import { memo, type ReactNode } from 'react';

import { Trash } from '~/components/ui';
import { useContent } from '~/stores/content';
import { date, formatDateRange, SHORT_DATE } from '~/utils/dates';
import { closureReason, ClosureSource, type TrainingClosure } from '~/utils/training';

const removeClosure = (id: string) => {
  const { closures, setClosures } = useContent.getState();
  setClosures(closures.filter((c) => c.id !== id));
};

type Props = { closures: TrainingClosure[]; editable: boolean; empty: ReactNode };

export const ClosureList = memo<Props>(({ closures, editable, empty }) => {
  const { i18n, t } = useLingui();

  if (!closures.length) return <Text c="dimmed">{empty}</Text>;

  return (
    <Stack gap={8}>
      {closures.map((c) => {
        const reason = closureReason(i18n, c);
        return (
          <Group key={c.id} gap="md">
            <Badge variant="light" color="gray" size="lg" className="tabular">
              {formatDateRange(date(c.from), date(c.to), SHORT_DATE)}
            </Badge>
            <Text>{reason}</Text>
            {editable && c.source === ClosureSource.enum.site && (
              <Badge variant="light" color="gray" size="sm">
                <Trans>From site</Trans>
              </Badge>
            )}
            {editable && c.source === ClosureSource.enum.edited && (
              <Tooltip label={t`Delete break`} withArrow>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={t`Delete break: ${reason}`}
                  onClick={() => removeClosure(c.id)}
                >
                  <Trash />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        );
      })}
    </Stack>
  );
});
