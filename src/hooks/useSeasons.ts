import { useMemo } from 'react';

import { useSiteContent } from '~/cms/content';
import { currentSeason, seasonList } from '~/utils/training';

export const useSeasons = () => {
  const { events } = useSiteContent();
  return useMemo(() => {
    const seasons = seasonList(events);
    return { seasons, current: currentSeason(seasons) };
  }, [events]);
};
