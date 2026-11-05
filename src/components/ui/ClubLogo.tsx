import type { FC } from 'react';
import Logo from '~icons/bk/logo';
import LogoMark from '~icons/bk/logo-mark';

const RATIO = { mark: 850 / 1122, full: 904 / 1472 };

type Props = { mark?: boolean; height: number; className?: string };

export const ClubLogo: FC<Props> = ({ mark = false, height, className }) => {
  const Svg = mark ? LogoMark : Logo;
  const width = Math.round(height * (mark ? RATIO.mark : RATIO.full));
  return <Svg height={height} width={width} className={className} aria-hidden />;
};
