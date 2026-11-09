import { useLingui } from '@lingui/react/macro';
import { Drawer, Modal, Stack } from '@mantine/core';
import { useMemo, type FC, type ReactNode } from 'react';

import { useIsMobile } from '~/hooks/useIsMobile';

import { BottomSheet } from './BottomSheet';

type Props = { opened: boolean; onClose: () => void; title: ReactNode; children: ReactNode };

export const ResponsiveModal: FC<Props> = ({ opened, onClose, title, children }) => {
  const { t } = useLingui();
  const mobile = useIsMobile();
  const closeButtonProps = useMemo(() => ({ 'aria-label': t`Close` }), [t]);

  if (mobile) {
    return (
      <BottomSheet opened={opened} onClose={onClose} handle>
        <Stack gap="md" p="lg" pt="sm" pb="calc(20px + env(safe-area-inset-bottom))">
          <Drawer.Title fw={600} fz="lg">
            {title}
          </Drawer.Title>
          {children}
        </Stack>
      </BottomSheet>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered closeButtonProps={closeButtonProps}>
      {children}
    </Modal>
  );
};
