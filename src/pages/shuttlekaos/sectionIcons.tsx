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
  Users,
} from '~/components/ui';

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
