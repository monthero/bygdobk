import { createImageUrlBuilder } from '@sanity/image-url';

import { ENV } from '~/env';

import { fetchSanityQuery, type QueryOptions } from './sanityApi';

const SANITY = { projectId: ENV.VITE_SANITY_PROJECT_ID, dataset: ENV.VITE_SANITY_DATASET };

export const sanityQuery = (query: string, options?: QueryOptions) => fetchSanityQuery(SANITY, query, options);

export const imageBuilder = createImageUrlBuilder(SANITY);
