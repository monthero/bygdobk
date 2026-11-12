import {
  ArrowsClockwise,
  ChartLineUp,
  ClipboardText,
  Handshake,
  Lightning,
  Shuffle,
  SquaresFour,
  Tag,
  Target,
  User,
  Users,
} from '~/components/ui';
import { Format, Partners, PlayStyle } from '~/shuttlekaos/model';

export const SECTION_ICONS = {
  game: <Shuffle />,
  scoring: <Target />,
  rounds: <ArrowsClockwise />,
  level: <ChartLineUp />,
  players: <Users />,
  pairs: <Handshake />,
  courts: <SquaresFour />,
  quick: <Lightning />,
  summary: <ClipboardText />,
  details: <Tag />,
};

export const STYLE_ICONS = {
  [PlayStyle.enum.singles]: <User />,
  [PlayStyle.enum.doubles]: <Users />,
};

export const FORMAT_ICONS = {
  [Format.enum.americano]: <Shuffle />,
  [Format.enum.mexicano]: <ChartLineUp />,
};

export const PARTNER_ICONS = {
  [Partners.enum.rotating]: <ArrowsClockwise />,
  [Partners.enum.fixed]: <Handshake />,
};
