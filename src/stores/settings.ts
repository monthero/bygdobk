import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeParsed, safeJSONStorage } from './persistence';

const STORAGE_KEY = 'bygdo-settings';

export const ColorScheme = z.enum(['light', 'dark', 'auto']);
export type ColorScheme = z.infer<typeof ColorScheme>;

export const Palette = z.enum(['fjord', 'club', 'glacier', 'lavender']);
export type Palette = z.infer<typeof Palette>;

export const Shape = z.enum(['sharp', 'soft', 'round']);
export type Shape = z.infer<typeof Shape>;

export const Density = z.enum(['compact', 'regular', 'large']);
export type Density = z.infer<typeof Density>;

export const NavLayout = z.enum(['top', 'side']);
export type NavLayout = z.infer<typeof NavLayout>;

export const Width = z.enum(['contained', 'full']);
export type Width = z.infer<typeof Width>;

export const Style = z.enum(['classic', 'court', 'flight']);
export type Style = z.infer<typeof Style>;

export const FooterMark = z.enum(['crop', 'gradient', 'dots', 'wordmark', 'outline', 'none']);
export type FooterMark = z.infer<typeof FooterMark>;

export const HeadingFont = z.enum([
  'saira',
  'chakra',
  'barlow',
  'familjen',
  'bigShoulders',
  'archivo',
  'unbounded',
  'sora',
  'instrumentSerif',
]);
export type HeadingFont = z.infer<typeof HeadingFont>;

const SettingsData = z.object({
  colorScheme: ColorScheme.catch(ColorScheme.enum.auto),
  palette: Palette.catch(Palette.enum.club),
  shape: Shape.catch(Shape.enum.soft),
  density: Density.catch(Density.enum.regular),
  navLayout: NavLayout.catch(NavLayout.enum.top),
  width: Width.catch(Width.enum.contained),
  font: HeadingFont.catch(HeadingFont.enum.chakra),
  style: Style.catch(Style.enum.classic),
  footerMark: FooterMark.catch(FooterMark.enum.gradient),
});
type SettingsData = z.infer<typeof SettingsData>;

interface SettingsState extends SettingsData {
  set: (patch: Partial<SettingsData>) => void;
}

const DEFAULTS: SettingsData = SettingsData.parse({});

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (patch) => set(patch),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: safeJSONStorage<SettingsData>(),
      partialize: ({
        colorScheme,
        palette,
        shape,
        density,
        navLayout,
        width,
        font,
        style,
        footerMark,
      }): SettingsData => ({
        footerMark,
        style,
        font,
        colorScheme,
        palette,
        shape,
        density,
        navLayout,
        width,
      }),
      migrate: (persisted, version) => {
        const parsed = SettingsData.safeParse(persisted);
        const data = parsed.success ? parsed.data : DEFAULTS;
        return version < 2 ? { ...data, font: HeadingFont.enum.chakra } : data;
      },
      merge: mergeParsed(SettingsData, () => DEFAULTS),
    },
  ),
);
