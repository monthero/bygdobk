import { NewsKind } from '~/data/news';

export const KIND_COLORS: Record<NewsKind, string> = {
  [NewsKind.enum.training]: 'blue',
  [NewsKind.enum.event]: 'orange',
  [NewsKind.enum.volunteer]: 'teal',
  [NewsKind.enum.club]: 'gray',
};
