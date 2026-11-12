import { Trans } from '@lingui/react/macro';
import { Button, Center, Loader, Popover } from '@mantine/core';
import { lazy, Suspense, type FC } from 'react';

import { CaretDown, SlidersHorizontal } from '~/components/ui';
import { loadVariantFonts } from '~/utils/variantFonts';

const loadPanel = () => import('./VariantPanel');
const VariantPanel = lazy(loadPanel);

const preloadPanel = () => void loadPanel();

const PANEL_LOADING = (
  <Center h={120}>
    <Loader size="sm" />
  </Center>
);

export const VariantMenu: FC = () => (
  <Popover position="top-start" width={320} shadow="md" withArrow onOpen={loadVariantFonts}>
    <Popover.Target>
      <Button
        variant="default"
        leftSection={<SlidersHorizontal />}
        rightSection={<CaretDown />}
        onPointerEnter={preloadPanel}
        onFocus={preloadPanel}
      >
        <Trans>Variants</Trans>
      </Button>
    </Popover.Target>
    <Popover.Dropdown>
      <Suspense fallback={PANEL_LOADING}>
        <VariantPanel />
      </Suspense>
    </Popover.Dropdown>
  </Popover>
);
