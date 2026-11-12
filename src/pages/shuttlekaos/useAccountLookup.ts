import { useDebouncedValue } from '@mantine/hooks';

import type { AccountMatch } from '~/shuttlekaos/model';
import { useAccountSearch } from '~/shuttlekaos/queries';

const MIN_SEARCH = 2;
const SEARCH_DEBOUNCE_MS = 250;
const EMPTY_MATCHES: AccountMatch[] = [];

export const useAccountLookup = (text: string, enabled: boolean, exclude: ReadonlySet<string>) => {
  const trimmed = text.trim();
  const [debounced] = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const query = enabled && debounced.length >= MIN_SEARCH ? debounced : '';
  const search = useAccountSearch(query);
  const matches = query ? (search.data ?? EMPTY_MATCHES).filter((a) => !exclude.has(a.profileId)) : EMPTY_MATCHES;
  const searching = enabled && trimmed.length >= MIN_SEARCH && (trimmed !== query || search.isFetching);
  return { query, matches, searching, failed: search.isError };
};
