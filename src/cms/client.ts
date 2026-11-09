import { createImageUrlBuilder } from '@sanity/image-url';

import { ENV } from '~/env';

import { IS_PREVIEW } from './preview/mode';
import { fetchSanityQuery, type QueryOptions } from './sanityApi';

const SANITY = { projectId: ENV.VITE_SANITY_PROJECT_ID, dataset: ENV.VITE_SANITY_DATASET };

const previewQuery = async (query: string, options?: QueryOptions) =>
  (await import('./preview/store')).fetchPreview(query, options);

export const sanityQuery = (query: string, options?: QueryOptions) =>
  IS_PREVIEW ? previewQuery(query, options) : fetchSanityQuery(SANITY, query, options);

export const imageBuilder = createImageUrlBuilder(SANITY);
