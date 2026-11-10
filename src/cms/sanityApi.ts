import { z } from 'zod';

export const SANITY_API_VERSION = '2026-11-01';

export type SanityProject = { projectId: string; dataset: string };

export const sanityQueryUrl = (
  { projectId, dataset }: SanityProject,
  query: string,
  params: Record<string, unknown> = {},
) => {
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(`$${name}`, JSON.stringify(value));
  url.searchParams.set('returnQuery', 'false');
  return url.href;
};

const QueryResponse = z.object({ result: z.unknown() });

export type QueryOptions = { params?: Record<string, unknown>; signal?: AbortSignal };

export const fetchSanityQuery = async (
  project: SanityProject,
  query: string,
  { params, signal }: QueryOptions = {},
) => {
  const response = await fetch(sanityQueryUrl(project, query, params), { signal });
  if (!response.ok) throw new Error(`Sanity query failed with ${response.status}`);
  return QueryResponse.parse(await response.json()).result;
};
