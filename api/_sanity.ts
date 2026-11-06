import { createImageUrlBuilder } from '@sanity/image-url';
import type { z } from 'zod';

import { fetchSanityQuery } from '../src/cms/sanityApi.js';

const SANITY = { projectId: process.env.VITE_SANITY_PROJECT_ID ?? '', dataset: process.env.VITE_SANITY_DATASET ?? '' };

export const sanityQuery = async <T extends z.ZodType>(schema: T, query: string, params?: Record<string, unknown>) =>
  schema.parse(await fetchSanityQuery(SANITY, query, { params }));

export const imageBuilder = createImageUrlBuilder(SANITY);
