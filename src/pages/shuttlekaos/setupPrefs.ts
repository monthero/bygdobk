import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { EVERYONE_ONCE, Format, Partners, PlayStyle, ScoreMode, Settings } from '~/shuttlekaos/model';
import { mergeParsed, safeJSONStorage } from '~/stores/persistence';

const STORAGE_KEY = 'bygdo-shuttlekaos-setup';

const DEFAULT_SETTINGS: Settings = {
  format: Format.enum.americano,
  style: PlayStyle.enum.doubles,
  partners: Partners.enum.rotating,
  courts: 2,
  scoreMode: ScoreMode.enum.race,
  points: 15,
  sets: 1,
  rounds: EVERYONE_ONCE,
  levels: [],
};

const PrefsData = z.object({ settings: Settings.catch(DEFAULT_SETTINGS), isPublic: z.boolean().catch(true) });
type PrefsData = z.infer<typeof PrefsData>;

export interface PrefsState extends PrefsData {
  remember: (prefs: PrefsData) => void;
}

const DEFAULTS: PrefsData = { settings: DEFAULT_SETTINGS, isPublic: true };

export const useSetupPrefs = create<PrefsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      remember: (prefs) => set(prefs),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: safeJSONStorage<PrefsData>(),
      partialize: ({ settings, isPublic }): PrefsData => ({ settings, isPublic }),
      migrate: () => DEFAULTS,
      merge: mergeParsed(PrefsData, () => DEFAULTS),
    },
  ),
);
