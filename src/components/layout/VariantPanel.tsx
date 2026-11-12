import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { CheckIcon, ColorSwatch, Group, SegmentedControl, Select, Stack, Text, Tooltip } from '@mantine/core';
import type { FC, ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  Density,
  FooterMark,
  HeadingFont,
  NavLayout,
  Palette,
  Shape,
  Style,
  useSettings,
  Width,
} from '~/stores/settings';
import { HEADING_FONTS, PALETTE_SWATCH } from '~/theme';

const PALETTE_NAMES: Record<Palette, MessageDescriptor> = {
  [Palette.enum.fjord]: msg({ message: 'Fjord blue', comment: 'Color palette name' }),
  [Palette.enum.club]: msg({
    message: 'Club colors',
    comment: 'Color palette name: the orange and black of the club logo',
  }),
  [Palette.enum.glacier]: msg({ message: 'Glacier', comment: 'Color palette name, a soft blue-green' }),
  [Palette.enum.lavender]: msg({ message: 'Lavender', comment: 'Color palette name' }),
};

const SHAPE_LABELS: Record<Shape, MessageDescriptor> = {
  [Shape.enum.sharp]: msg({ message: 'Sharp', comment: 'Corner style' }),
  [Shape.enum.soft]: msg({ message: 'Soft', comment: 'Corner style' }),
  [Shape.enum.round]: msg({ message: 'Round', comment: 'Corner style' }),
};

const DENSITY_LABELS: Record<Density, MessageDescriptor> = {
  [Density.enum.compact]: msg({ message: 'Compact', comment: 'Size of text and controls' }),
  [Density.enum.regular]: msg({ message: 'Regular', comment: 'Size of text and controls' }),
  [Density.enum.large]: msg({ message: 'Large', comment: 'Size of text and controls' }),
};

const STYLE_LABELS: Record<Style, MessageDescriptor> = {
  [Style.enum.classic]: msg({ message: 'Classic', comment: 'Design style name' }),
  [Style.enum.court]: msg({ message: 'Court lines', comment: 'Design style based on badminton court lines' }),
  [Style.enum.flight]: msg({ message: 'Shuttle in flight', comment: 'Design style with a flying shuttlecock' }),
};

const FONT_OPTIONS = HeadingFont.options.map((value) => ({ value, label: HEADING_FONTS[value].label }));

const NAV_LABELS: Record<NavLayout, MessageDescriptor> = {
  [NavLayout.enum.top]: msg({ message: 'Top bar', comment: 'Where the main menu sits' }),
  [NavLayout.enum.side]: msg({ message: 'Sidebar', comment: 'Where the main menu sits' }),
};

const WIDTH_LABELS: Record<Width, MessageDescriptor> = {
  [Width.enum.contained]: msg({ message: 'Contained', comment: 'Page width: centered column' }),
  [Width.enum.full]: msg({ message: 'Full width', comment: 'Page width: edge to edge' }),
};

const FOOTER_MARK_LABELS: Record<FooterMark, MessageDescriptor> = {
  [FooterMark.enum.crop]: msg({
    message: 'Cropped stamp',
    comment: 'Footer decoration: a large faded club logo cut off at the edge',
  }),
  [FooterMark.enum.gradient]: msg({ message: 'Gradient', comment: 'Footer decoration: club logo that fades out' }),
  [FooterMark.enum.dots]: msg({ message: 'Dot pattern', comment: 'Footer decoration: club logo made of small dots' }),
  [FooterMark.enum.wordmark]: msg({
    message: 'Big name',
    comment: 'Footer decoration: the club name in huge faded letters',
  }),
  [FooterMark.enum.outline]: msg({ message: 'Outline', comment: 'Footer decoration: club logo drawn as thin lines' }),
  [FooterMark.enum.none]: msg({ message: 'None', comment: 'Footer decoration: nothing' }),
};

const Field: FC<{ label: ReactNode; children: ReactNode }> = ({ label, children }) => (
  <Stack gap={6}>
    <Text size="xs" fw={600} c="dimmed" tt="uppercase">
      {label}
    </Text>
    {children}
  </Stack>
);

const VariantPanel: FC = () => {
  const { i18n } = useLingui();
  const { palette, shape, density, navLayout, width, font, style, footerMark, set } = useSettings(
    useShallow((s) => ({
      palette: s.palette,
      shape: s.shape,
      density: s.density,
      navLayout: s.navLayout,
      width: s.width,
      font: s.font,
      style: s.style,
      footerMark: s.footerMark,
      set: s.set,
    })),
  );

  const options = <T extends string>(labels: Record<T, MessageDescriptor>, values: readonly T[]) =>
    values.map((value) => ({ value, label: i18n._(labels[value]) }));

  return (
    <Stack gap="md">
      <Field label={<Trans>Style</Trans>}>
        <Select
          size="xs"
          data={options(STYLE_LABELS, Style.options)}
          value={style}
          onChange={(value) => value && set({ style: Style.parse(value) })}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
        />
      </Field>
      <Field label={<Trans>Color</Trans>}>
        <Group gap="sm">
          {Palette.options.map((value) => (
            <Tooltip key={value} label={i18n._(PALETTE_NAMES[value])} withArrow>
              <ColorSwatch
                component="button"
                type="button"
                color={PALETTE_SWATCH[value]}
                size={30}
                aria-label={i18n._(PALETTE_NAMES[value])}
                aria-pressed={palette === value}
                onClick={() => set({ palette: value })}
                style={{ color: 'var(--bk-accent-ink)', cursor: 'pointer' }}
              >
                {palette === value && <CheckIcon size={12} />}
              </ColorSwatch>
            </Tooltip>
          ))}
        </Group>
      </Field>
      <Field label={<Trans>Heading font</Trans>}>
        <Select
          size="xs"
          data={FONT_OPTIONS}
          value={font}
          onChange={(value) => value && set({ font: HeadingFont.parse(value) })}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
          renderOption={({ option }) => (
            <span style={{ fontFamily: HEADING_FONTS[HeadingFont.parse(option.value)].family }}>{option.label}</span>
          )}
        />
      </Field>
      <Field label={<Trans>Shape</Trans>}>
        <SegmentedControl
          fullWidth
          size="xs"
          data={options(SHAPE_LABELS, Shape.options)}
          value={shape}
          onChange={(value) => set({ shape: Shape.parse(value) })}
        />
      </Field>
      <Field label={<Trans>Size</Trans>}>
        <SegmentedControl
          fullWidth
          size="xs"
          data={options(DENSITY_LABELS, Density.options)}
          value={density}
          onChange={(value) => set({ density: Density.parse(value) })}
        />
      </Field>
      <Field label={<Trans>Menu</Trans>}>
        <SegmentedControl
          fullWidth
          size="xs"
          data={options(NAV_LABELS, NavLayout.options)}
          value={navLayout}
          onChange={(value) => set({ navLayout: NavLayout.parse(value) })}
        />
      </Field>
      <Field label={<Trans>Width</Trans>}>
        <SegmentedControl
          fullWidth
          size="xs"
          data={options(WIDTH_LABELS, Width.options)}
          value={width}
          onChange={(value) => set({ width: Width.parse(value) })}
        />
      </Field>
      <Field label={<Trans comment="Variant menu: the decoration in the corner of the page footer">Footer mark</Trans>}>
        <Select
          size="xs"
          data={options(FOOTER_MARK_LABELS, FooterMark.options)}
          value={footerMark}
          onChange={(value) => value && set({ footerMark: FooterMark.parse(value) })}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
        />
      </Field>
    </Stack>
  );
};

export default VariantPanel;
