const SANITY_API_VERSION = '2026-11-01';

type Project = { projectId: string; dataset: string };

export const sanityQueryUrl = (
  { projectId, dataset }: Project,
  query: string,
  params: Record<string, unknown> = {},
) => {
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(`$${name}`, JSON.stringify(value));
  url.searchParams.set('returnQuery', 'false');
  return url.href;
};
