import { createImageUrlBuilder } from '@sanity/image-url';
import { z } from 'zod';

import { ENV } from '~/env';

import { sanityQueryUrl } from './queryUrl';

const SANITY = { projectId: ENV.VITE_SANITY_PROJECT_ID, dataset: ENV.VITE_SANITY_DATASET };

const QueryResponse = z.object({ result: z.unknown() });

type QueryOptions = { params?: Record<string, unknown>; signal?: AbortSignal };

export const sanityQuery = async (query: string, { params, signal }: QueryOptions = {}) => {
  const response = await fetch(sanityQueryUrl(SANITY, query, params), { signal });
  if (!response.ok) throw new Error(`Sanity query failed with ${response.status}`);
  return QueryResponse.parse(await response.json()).result;
};

export const imageBuilder = createImageUrlBuilder(SANITY);
