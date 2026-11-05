import { useMemo } from 'react';
import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeClosures, type TrainingClosure } from '~/utils/training';

import { mergeParsed, safeJSONStorage } from './persistence';

const STORAGE_KEY = 'bigdo-content';

const IsoDay = z.iso.date();

export const NoticeTone = z.enum(['info', 'warning']);
export type NoticeTone = z.infer<typeof NoticeTone>;

export const NOTICE_MAX_LENGTH = 280;

export const Notice = z.object({
  visible: z.boolean().catch(false),
  tone: NoticeTone.catch(NoticeTone.enum.info),
  text: z.string().max(NOTICE_MAX_LENGTH).catch(''),
});
export type Notice = z.infer<typeof Notice>;

export const NOTICE_DEFAULT: Notice = Notice.parse({});

export const EditedClosure = z.object({
  id: z.string().min(1),
  from: IsoDay,
  to: IsoDay,
  reason: z.string().min(1),
});
export type EditedClosure = z.infer<typeof EditedClosure>;

const ContentData = z.object({
  notice: Notice.catch(NOTICE_DEFAULT),
  closures: z.array(EditedClosure).catch([]),
});
type ContentData = z.infer<typeof ContentData>;

interface ContentState extends ContentData {
  setNotice: (patch: Partial<Notice>) => void;
  setClosures: (closures: EditedClosure[]) => void;
  resetContent: () => void;
}

const DEFAULTS: ContentData = ContentData.parse({});
const DEFAULTS_JSON = JSON.stringify(DEFAULTS);

const contentOf = ({ notice, closures }: ContentState): ContentData => ({ notice, closures });

export const useContent = create<ContentState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setNotice: (patch) => set(({ notice }) => ({ notice: { ...notice, ...patch } })),
      setClosures: (closures) => set({ closures }),
      resetContent: () => set(DEFAULTS),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<ContentData>(),
      partialize: contentOf,
      migrate: () => DEFAULTS,
      merge: mergeParsed(ContentData, () => DEFAULTS),
    },
  ),
);

export const useHasContentEdits = () => useContent((s) => JSON.stringify(contentOf(s)) !== DEFAULTS_JSON);

export const useClosures = (): TrainingClosure[] => {
  const edited = useContent((s) => s.closures);
  return useMemo(() => mergeClosures(edited), [edited]);
};
