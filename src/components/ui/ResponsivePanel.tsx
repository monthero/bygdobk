import { CloseButton, Popover, type FloatingPosition } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { FC, ReactElement, ReactNode } from 'react';

import { useIsMobile } from '~/hooks/useIsMobile';

import { BottomSheet } from './BottomSheet';

import classes from './ResponsivePanel.module.css';

export type PanelVariant = 'popover' | 'sheet';

type TargetProps = { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'dialog' };

type Props = {
  title: ReactNode;
  closeLabel: string;
  width?: number;
  position?: FloatingPosition;
  renderTarget: (props: TargetProps) => ReactElement;
  children: (props: { variant: PanelVariant; close: () => void }) => ReactNode;
};

const DROPDOWN_TRANSITION = { transition: 'pop-top-right', duration: 160 } as const;

export const ResponsivePanel: FC<Props> = ({
  title,
  closeLabel,
  width = 300,
  position = 'bottom-end',
  renderTarget,
  children,
}) => {
  const [opened, { toggle, close, open }] = useDisclosure(false);
  const isMobile = useIsMobile();
  const target = renderTarget({ onClick: toggle, 'aria-expanded': opened, 'aria-haspopup': 'dialog' });

  if (isMobile) {
    return (
      <>
        {target}
        <BottomSheet opened={opened} onClose={close} handle>
          <div className={classes.panel} data-variant="sheet">
            <div className={classes.head}>
              <span className={classes.title}>{title}</span>
              <CloseButton aria-label={closeLabel} onClick={close} />
            </div>
            {children({ variant: 'sheet', close })}
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover
      opened={opened}
      onChange={(next) => (next ? open() : close())}
      position={position}
      width={width}
      shadow="md"
      radius="md"
      trapFocus
      transitionProps={DROPDOWN_TRANSITION}
    >
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown className={classes.dropdown}>
        <div className={classes.panel} data-variant="popover">
          <div className={classes.head}>
            <span className={classes.title}>{title}</span>
          </div>
          {children({ variant: 'popover', close })}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};
