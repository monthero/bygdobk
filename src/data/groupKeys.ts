import { z } from 'zod';

import { slugMap } from '../utils/slugs.ts';

export const Group = z.enum(['rekrutt', 'junior', 'senior', 'fritt']);
export type Group = z.infer<typeof Group>;

export const GROUP_SLUGS = slugMap<Group>({
  [Group.enum.rekrutt]: 'rekrutt',
  [Group.enum.junior]: 'junior',
  [Group.enum.senior]: 'senior',
  [Group.enum.fritt]: 'fritt-spill',
});
