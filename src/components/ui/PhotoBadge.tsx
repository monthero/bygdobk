import { Badge, type MantineColor } from '@mantine/core';
import { memo, type ReactNode } from 'react';

import classes from './PhotoBadge.module.css';

type Props = { color: MantineColor; size?: 'md' | 'lg'; children: ReactNode };

export const PhotoBadge = memo<Props>(({ color, size = 'lg', children }) => (
  <Badge color={`${color}.8`} variant="filled" size={size} autoContrast={false} className={classes.badge}>
    {children}
  </Badge>
));
