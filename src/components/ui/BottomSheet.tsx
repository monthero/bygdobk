import { Drawer } from '@mantine/core';
import { useMemo, type CSSProperties, type FC, type ReactNode } from 'react';

import classes from './BottomSheet.module.css';

export const BottomSheet: FC<{
  opened: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
  handle?: boolean;
  bodyClassName?: string;
  onExited?: () => void;
}> = ({ opened, onClose, children, maxHeight = '88dvh', handle, bodyClassName, onExited }) => {
  const classNames = useMemo(() => ({ content: classes.sheet, body: bodyClassName ?? classes.body }), [bodyClassName]);
  const style = useMemo(() => ({ '--sheet-max-h': maxHeight }) as CSSProperties, [maxHeight]);
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      onExitTransitionEnd={onExited}
      position="bottom"
      withCloseButton={false}
      padding={0}
      classNames={classNames}
      style={style}
    >
      {handle && <span className={classes.handle} />}
      {children}
    </Drawer>
  );
};
