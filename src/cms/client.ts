import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

import { ENV } from '~/env';

const SANITY_API_VERSION = '2026-11-01';

export const sanity = createClient({
  projectId: ENV.VITE_SANITY_PROJECT_ID,
  dataset: ENV.VITE_SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
});

export const imageBuilder = createImageUrlBuilder(sanity);
