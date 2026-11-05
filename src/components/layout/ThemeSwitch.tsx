import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, type FloatingPosition } from '@mantine/core';
import { useMemo, type FC } from 'react';

import { CircleHalf, Moon, ResponsivePanel, Sun } from '~/components/ui';
import { ColorScheme, useSettings } from '~/stores/settings';

import { PanelOptions, type PanelOption } from './PanelOptions';

const SCHEMES: Record<ColorScheme, { label: MessageDescriptor; Icon: typeof Sun }> = {
  [ColorScheme.enum.light]: { label: msg({ message: 'Light', comment: 'Theme option: light theme' }), Icon: Sun },
  [ColorScheme.enum.dark]: { label: msg({ message: 'Dark', comment: 'Theme option: dark theme' }), Icon: Moon },
  [ColorScheme.enum.auto]: {
    label: msg({ message: 'System', comment: 'Theme option: follow the device’s light or dark setting' }),
    Icon: CircleHalf,
  },
};

const pick = (value: ColorScheme) => useSettings.getState().set({ colorScheme: value });

export const ThemeSwitch: FC<{ position?: FloatingPosition }> = ({ position }) => {
  const { i18n, t } = useLingui();
  const colorScheme = useSettings((s) => s.colorScheme);
  const { Icon, label } = SCHEMES[colorScheme];
  const options = useMemo<PanelOption<ColorScheme>[]>(
    () =>
      ColorScheme.options.map((value) => {
        const { Icon: OptionIcon, label: optionLabel } = SCHEMES[value];
        return { value, icon: <OptionIcon />, label: i18n._(optionLabel) };
      }),
    [i18n],
  );

  return (
    <ResponsivePanel
      title={<Trans>Theme</Trans>}
      closeLabel={t`Close theme menu`}
      width={200}
      position={position}
      renderTarget={(props) => (
        <ActionIcon variant="default" size="lg" radius="md" aria-label={t`Theme: ${i18n._(label)}`} {...props}>
          <Icon />
        </ActionIcon>
      )}
    >
      {({ variant, close }) => (
        <PanelOptions
          options={options}
          current={colorScheme}
          variant={variant}
          onPick={(value) => {
            close();
            pick(value);
          }}
        />
      )}
    </ResponsivePanel>
  );
};
