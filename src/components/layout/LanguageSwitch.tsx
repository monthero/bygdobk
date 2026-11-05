import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, type FloatingPosition } from '@mantine/core';
import type { FC } from 'react';

import { LocaleFlag, ResponsivePanel } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { DEFAULT_LOCALE, isLocale, LOCALE_META, LOCALES_BY_ORDER, type Locale } from '~/i18n/locales';
import { switchLocale } from '~/i18n/switch';

import { PanelOptions, type PanelOption } from './PanelOptions';

import classes from './LanguageSwitch.module.css';

const LOCALE_CODES: Record<Locale, string> = { nb: 'NO', en: 'EN', sv: 'SV', fi: 'FI', zh: 'ZH' };

const OPTIONS: PanelOption<Locale>[] = LOCALES_BY_ORDER.map((locale) => ({
  value: locale,
  icon: <LocaleFlag locale={locale} />,
  label: LOCALE_META[locale].name,
  lang: LOCALE_META[locale].lang,
}));

export const LanguageSwitch: FC<{ position?: FloatingPosition }> = ({ position }) => {
  const { i18n, t } = useLingui();
  const isMobile = useIsMobile();
  const current = isLocale(i18n.locale) ? i18n.locale : DEFAULT_LOCALE;
  const code = LOCALE_CODES[current];

  return (
    <ResponsivePanel
      title={<Trans>Language</Trans>}
      closeLabel={t`Close language menu`}
      width={220}
      position={position}
      renderTarget={(props) =>
        isMobile ? (
          <ActionIcon
            variant="default"
            size="lg"
            radius="md"
            aria-label={t`Language: ${LOCALE_META[current].name}`}
            {...props}
          >
            <LocaleFlag locale={current} />
          </ActionIcon>
        ) : (
          <Button
            variant="default"
            radius="md"
            className={classes.target}
            leftSection={<LocaleFlag locale={current} />}
            aria-label={t`Language: ${code}`}
            {...props}
          >
            {code}
          </Button>
        )
      }
    >
      {({ variant, close }) => (
        <PanelOptions
          options={OPTIONS}
          current={current}
          variant={variant}
          onPick={(locale) => {
            close();
            if (locale !== current) void switchLocale(locale);
          }}
        />
      )}
    </ResponsivePanel>
  );
};
