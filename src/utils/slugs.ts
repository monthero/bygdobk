import { z } from 'zod';

export const slugMap = <K extends string>(map: Record<K, string>) => {
  const reverse = new Map(Object.entries<string>(map).map(([key, slug]) => [slug, key as K]));
  return {
    toSlug: (key: K) => map[key],
    fromSlug: (slug: string | undefined): K | undefined => (slug ? reverse.get(slug) : undefined),
    schema: z
      .string()
      .refine((slug) => reverse.has(slug))
      .optional()
      .catch(undefined),
  };
};
