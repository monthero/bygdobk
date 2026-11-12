import {
  Avatar,
  Card,
  Container,
  createTheme,
  Tabs,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  type MantineThemeOverride,
} from '@mantine/core';

import { Density, HeadingFont, Palette, Shape, Width } from '~/stores/settings';

import surfaces from '~/styles/surfaces.module.css';

const PALETTES: Record<Palette, MantineColorsTuple> = {
  [Palette.enum.fjord]: [
    '#eef5fc',
    '#dde9f7',
    '#c6daf1',
    '#a9c9ec',
    '#8db5e2',
    '#6f9dd3',
    '#5584bd',
    '#43699c',
    '#33517a',
    '#243a58',
  ],
  [Palette.enum.club]: [
    '#fff4e8',
    '#ffe7cf',
    '#fdcf9f',
    '#f8b46a',
    '#f39c3f',
    '#ea8a2b',
    '#d4761c',
    '#a95c16',
    '#7f4512',
    '#3a2a1a',
  ],
  [Palette.enum.glacier]: [
    '#ecf8f7',
    '#d8f1ef',
    '#bde7e4',
    '#9ed7d2',
    '#7fc6c0',
    '#5fb0aa',
    '#47958f',
    '#367873',
    '#285c58',
    '#1b413e',
  ],
  [Palette.enum.lavender]: [
    '#f4f1fc',
    '#e8e1f8',
    '#d8ccf2',
    '#c8baec',
    '#b29fe2',
    '#9a83d4',
    '#8169bd',
    '#67529c',
    '#4f3e7a',
    '#382c58',
  ],
};

type Neutrals = {
  body: string;
  text: string;
  dimmed: string;
  surface2: string;
  border: string;
  logo: string;
  wash: [string, string];
};

const LIGHT_NEUTRALS: Record<Palette, Neutrals> = {
  [Palette.enum.fjord]: {
    body: '#f4f8fb',
    text: '#1a2736',
    dimmed: '#586979',
    surface2: '#eaf1f8',
    border: '#d7e2ec',
    logo: '#243a58',
    wash: ['#dbe8f6', '#eef3e2'],
  },
  [Palette.enum.club]: {
    body: '#f5f6ec',
    text: '#1c1c17',
    dimmed: '#5f6153',
    surface2: '#ecefdc',
    border: '#dadfc4',
    logo: '#15150d',
    wash: ['#dfe4c8', '#f3efc2'],
  },
  [Palette.enum.glacier]: {
    body: '#f3f9f8',
    text: '#17302e',
    dimmed: '#56706d',
    surface2: '#e6f2f0',
    border: '#d3e5e2',
    logo: '#1b413e',
    wash: ['#d4ece8', '#e9f1df'],
  },
  [Palette.enum.lavender]: {
    body: '#f7f5fc',
    text: '#231d36',
    dimmed: '#635c78',
    surface2: '#eeeaf8',
    border: '#e0daf0',
    logo: '#382c58',
    wash: ['#e6def6', '#f4e9ef'],
  },
};

const DARK_NEUTRALS: Record<Palette, Omit<Neutrals, 'logo'> & { surface: string }> = {
  [Palette.enum.fjord]: {
    body: '#0e141b',
    surface: '#151e28',
    surface2: '#1b2733',
    border: '#273544',
    text: '#e2e9f1',
    dimmed: '#98a8b8',
    wash: ['#102a2a', '#14213a'],
  },
  [Palette.enum.club]: {
    body: '#12130e',
    surface: '#1a1b15',
    surface2: '#22241c',
    border: '#31342a',
    text: '#ecebe0',
    dimmed: '#a8a998',
    wash: ['#1c2a1a', '#2a2614'],
  },
  [Palette.enum.glacier]: {
    body: '#0d1515',
    surface: '#141f1f',
    surface2: '#1a2928',
    border: '#263736',
    text: '#e0eeec',
    dimmed: '#95aba8',
    wash: ['#0f2c2a', '#122436'],
  },
  [Palette.enum.lavender]: {
    body: '#110f19',
    surface: '#1a1724',
    surface2: '#221e2e',
    border: '#322c42',
    text: '#e9e5f4',
    dimmed: '#a59eb8',
    wash: ['#1f1a36', '#2a1a2c'],
  },
};

export const PALETTE_SWATCH: Record<Palette, string> = {
  [Palette.enum.fjord]: PALETTES.fjord[3],
  [Palette.enum.club]: PALETTES.club[5],
  [Palette.enum.glacier]: PALETTES.glacier[3],
  [Palette.enum.lavender]: PALETTES.lavender[3],
};

type FontSpec = { family: string; weight: string; label: string; stretch?: string };

const CJK = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC'";
const sans = (name: string) => `'${name}', 'Segoe UI', ${CJK}, system-ui, sans-serif`;

export const HEADING_FONTS: Record<HeadingFont, FontSpec> = {
  [HeadingFont.enum.saira]: { family: sans('Saira'), weight: '700', label: 'Saira' },
  [HeadingFont.enum.chakra]: { family: sans('Chakra Petch'), weight: '700', label: 'Chakra Petch' },
  [HeadingFont.enum.barlow]: { family: sans('Barlow Condensed'), weight: '700', label: 'Barlow Condensed' },
  [HeadingFont.enum.familjen]: { family: sans('Familjen Grotesk'), weight: '700', label: 'Familjen Grotesk' },
  [HeadingFont.enum.bigShoulders]: {
    family: sans('Big Shoulders Display'),
    weight: '800',
    label: 'Big Shoulders Display',
  },
  [HeadingFont.enum.archivo]: { family: sans('Archivo'), weight: '800', label: 'Archivo Expanded', stretch: '125%' },
  [HeadingFont.enum.unbounded]: { family: sans('Unbounded'), weight: '700', label: 'Unbounded' },
  [HeadingFont.enum.sora]: { family: sans('Sora'), weight: '700', label: 'Sora' },
  [HeadingFont.enum.instrumentSerif]: {
    family: `'Instrument Serif', Georgia, ${CJK}, serif`,
    weight: '400',
    label: 'Instrument Serif',
  },
};

const RADII: Record<Shape, MantineThemeOverride['radius']> = {
  [Shape.enum.sharp]: { xs: '0px', sm: '2px', md: '3px', lg: '4px', xl: '6px' },
  [Shape.enum.soft]: { xs: '4px', sm: '6px', md: '12px', lg: '20px', xl: '28px' },
  [Shape.enum.round]: { xs: '8px', sm: '14px', md: '22px', lg: '32px', xl: '999px' },
};

const SCALES: Record<Density, number> = {
  [Density.enum.compact]: 0.9,
  [Density.enum.regular]: 1,
  [Density.enum.large]: 1.12,
};

export type ThemeOptions = { palette: Palette; shape: Shape; density: Density; width: Width; font: HeadingFont };

export const buildTheme = ({ palette, shape, density, width, font }: ThemeOptions): MantineThemeOverride =>
  createTheme({
    colors: { brand: PALETTES[palette] },
    primaryColor: 'brand',
    primaryShade: { light: 3, dark: 3 },
    autoContrast: true,
    luminanceThreshold: 0.4,
    scale: SCALES[density],
    fontFamily: sans('Instrument Sans Variable'),
    headings: { fontFamily: HEADING_FONTS[font].family, fontWeight: HEADING_FONTS[font].weight },
    defaultRadius: 'md',
    radius: RADII[shape],
    cursorType: 'pointer',
    other: { palette, font },
    components: {
      Container: Container.extend({ defaultProps: { size: 'lg', fluid: width === Width.enum.full } }),
      Card: Card.extend({ classNames: { root: surfaces.card } }),
      Tabs: Tabs.extend({ classNames: { list: surfaces.tabsList } }),
      Avatar: Avatar.extend({ defaultProps: { allowedInitialsColors: INITIALS_COLORS } }),
    },
  });

const INITIALS_COLORS = ['blue', 'cyan', 'grape', 'green', 'indigo', 'orange', 'pink', 'red', 'teal', 'violet'];

const ME_COLORS: Record<Palette, string> = {
  [Palette.enum.fjord]: 'grape',
  [Palette.enum.club]: 'blue',
  [Palette.enum.glacier]: 'violet',
  [Palette.enum.lavender]: 'cyan',
};

const SOFT_DARK_COLORS = ['brand', 'teal', 'blue', 'orange', 'grape', 'green', 'red', 'yellow', 'gray'];

const softDarkLight = (colors: Record<string, MantineColorsTuple>) =>
  Object.fromEntries(
    SOFT_DARK_COLORS.flatMap((name) => {
      const c = colors[name];
      if (!c) return [];
      return [
        [`--mantine-color-${name}-light`, `color-mix(in srgb, ${c[4]} 18%, transparent)`],
        [`--mantine-color-${name}-light-hover`, `color-mix(in srgb, ${c[4]} 26%, transparent)`],
        [`--mantine-color-${name}-light-color`, c[2]],
      ];
    }),
  );

const pageWash = ([a, b]: [string, string]) =>
  `radial-gradient(90% 70% at 0% 0%, ${a}, transparent 70%), radial-gradient(80% 60% at 100% 15%, ${b}, transparent 70%)`;

const strongLightText = (colors: Record<string, MantineColorsTuple>) =>
  Object.fromEntries(
    SOFT_DARK_COLORS.flatMap((name) => {
      const c = colors[name];
      if (!c) return [];
      return [[`--mantine-color-${name}-light-color`, `color-mix(in srgb, ${c[9]} 68%, #000)`]];
    }),
  );

export const cssVariablesResolver: CSSVariablesResolver = (theme) => {
  const palette = Palette.catch(Palette.enum.fjord).parse(theme.other.palette);
  const font = HeadingFont.catch(HeadingFont.enum.chakra).parse(theme.other.font);
  const brand = theme.colors.brand ?? PALETTES.fjord;
  const light = LIGHT_NEUTRALS[palette];
  const dark = DARK_NEUTRALS[palette];
  const me = theme.colors[ME_COLORS[palette]] ?? theme.colors.blue;
  return {
    variables: {
      '--bk-font-display': HEADING_FONTS[font].family,
      '--bk-font-display-weight': HEADING_FONTS[font].weight,
      '--bk-font-display-stretch': HEADING_FONTS[font].stretch ?? '100%',
      '--bk-page-width': '1120px',
      '--bk-header-height': '64px',
    },
    light: {
      ...strongLightText(theme.colors),
      '--mantine-color-body': light.body,
      '--mantine-color-text': light.text,
      '--mantine-color-dimmed': light.dimmed,
      '--mantine-color-anchor': brand[7],
      '--bk-surface': '#ffffff',
      '--bk-surface-2': light.surface2,
      '--bk-border': light.border,
      '--bk-accent': brand[3],
      '--bk-accent-soft': brand[0],
      '--bk-accent-line': brand[2],
      '--bk-accent-strong': brand[7],
      '--bk-accent-ink': brand[9],
      '--bk-logo': light.logo,
      '--bk-photo-shade': 'rgb(0 0 0 / 0.2)',
      '--bk-page-wash': pageWash(light.wash),
      '--bk-logo-accent': brand[6],
      '--bk-ok': '#2f7d5b',
      '--bk-ok-soft': '#dcefe5',
      '--bk-warn': '#93600f',
      '--bk-warn-soft': '#f8ebd2',
      '--bk-danger': '#b03a2e',
      '--bk-danger-soft': '#f7dfdb',
      '--bk-me': me?.[6] ?? '',
      '--bk-shadow': '0 1px 2px rgb(26 39 54 / 0.05), 0 10px 30px rgb(26 39 54 / 0.06)',
    },
    dark: {
      ...softDarkLight(theme.colors),
      '--mantine-color-body': dark.body,
      '--mantine-color-text': dark.text,
      '--mantine-color-dimmed': dark.dimmed,
      '--mantine-color-anchor': brand[3],
      '--bk-surface': dark.surface,
      '--bk-surface-2': dark.surface2,
      '--bk-border': dark.border,
      '--bk-accent': brand[3],
      '--bk-accent-soft': `color-mix(in srgb, ${brand[3]} 14%, ${dark.surface})`,
      '--bk-accent-line': `color-mix(in srgb, ${brand[3]} 35%, ${dark.surface})`,
      '--bk-accent-strong': brand[3],
      '--bk-accent-ink': brand[9],
      '--bk-logo': dark.text,
      '--bk-photo-shade': 'rgb(0 0 0 / 0.38)',
      '--bk-page-wash': pageWash(dark.wash),
      '--bk-logo-accent': brand[4],
      '--bk-ok': '#7cc9a3',
      '--bk-ok-soft': '#173326',
      '--bk-warn': '#e7b866',
      '--bk-warn-soft': '#3a2c12',
      '--bk-danger': '#f0968b',
      '--bk-danger-soft': '#3d1c18',
      '--bk-me': me?.[4] ?? '',
      '--bk-shadow': '0 1px 2px rgb(0 0 0 / 0.3), 0 10px 30px rgb(0 0 0 / 0.25)',
    },
  };
};
