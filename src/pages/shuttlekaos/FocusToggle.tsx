import { useLingui } from '@lingui/react/macro';
import { ActionIcon, Tooltip } from '@mantine/core';
import type { FC } from 'react';

import { ArrowsIn, ArrowsOut } from '~/components/ui';
import { useUi } from '~/stores/ui';

const selectFocus = (s: ReturnType<typeof useUi.getState>) => s.focusMode;
const selectSetFocus = (s: ReturnType<typeof useUi.getState>) => s.setFocusMode;

export const FocusToggle: FC = () => {
  const { t } = useLingui();
  const focus = useUi(selectFocus);
  const setFocus = useUi(selectSetFocus);
  const label = focus ? t`Exit focus mode` : t`Focus mode`;
  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="default"
        radius="xl"
        size={44}
        aria-label={label}
        aria-pressed={focus}
        onClick={() => setFocus(!focus)}
      >
        {focus ? <ArrowsIn /> : <ArrowsOut />}
      </ActionIcon>
    </Tooltip>
  );
};
