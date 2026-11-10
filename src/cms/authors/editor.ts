import { queryOptions, skipToken, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  useClient,
  useCurrentUser,
  type CurrentUser,
  type InitialValueResolverContext,
  type SanityClient,
} from 'sanity';
import { z } from 'zod';

import { normalizeEmail } from '~/utils/email';

import { queryClient } from '../queryClient';
import { SANITY_API_VERSION } from '../sanityApi';

export const Editor = z.object({ id: z.string(), name: z.string() });
export type Editor = z.infer<typeof Editor>;

export const StampField = z.enum(['createdBy', 'updatedBy']);

const BOARD_NAMES_QUERY = '*[_type == "boardMember" && lower(email) == $email].name';
const BoardNames = z.array(z.string());

const boardNameQuery = (client: SanityClient, user: CurrentUser | null) =>
  queryOptions({
    queryKey: ['studio', 'boardMemberName', user?.id] as const,
    queryFn: user
      ? async ({ signal }) => {
          const names = BoardNames.parse(
            await client
              .withConfig({ perspective: 'published' })
              .fetch(BOARD_NAMES_QUERY, { email: normalizeEmail(user.email) }, { signal }),
          );
          return names.length === 1 ? (names.at(0) ?? null) : null;
        }
      : skipToken,
    staleTime: Infinity,
  });

const editorFor = (user: CurrentUser, boardName: string | null | undefined): Editor => ({
  id: user.id,
  name: boardName ?? user.name,
});

type BoardNameKey = readonly ['studio', 'boardMemberName', string | undefined];
type BoardNameOptions = Omit<
  UseQueryOptions<string | null, Error, string | null, BoardNameKey>,
  'queryKey' | 'queryFn'
>;

export const useEditor = (options?: BoardNameOptions) => {
  const user = useCurrentUser();
  const client = useClient({ apiVersion: SANITY_API_VERSION });
  const { data, isPending } = useQuery({ ...boardNameQuery(client, user), ...options });
  return useMemo(() => (user && !isPending ? editorFor(user, data) : undefined), [user, data, isPending]);
};

export const resolveEditor = async ({ currentUser, getClient }: InitialValueResolverContext) => {
  if (!currentUser) throw new Error('Sign in to create documents');
  const query = boardNameQuery(getClient({ apiVersion: SANITY_API_VERSION }), currentUser);
  const boardName = await queryClient.fetchQuery(query).catch(() => null);
  return editorFor(currentUser, boardName);
};
