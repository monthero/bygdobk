import type { FC } from 'react';
import FlagEn from '~icons/bk/flag-en';
import FlagFi from '~icons/bk/flag-fi';
import FlagNb from '~icons/bk/flag-nb';
import FlagSv from '~icons/bk/flag-sv';

import type { Locale } from '~/i18n/locales';

import classes from './LocaleFlag.module.css';

const FLAGS: Record<Locale, typeof FlagEn> = { en: FlagEn, fi: FlagFi, nb: FlagNb, sv: FlagSv };

export const LocaleFlag: FC<{ locale: Locale }> = ({ locale }) => {
  const Flag = FLAGS[locale];
  return <Flag className={classes.flag} aria-hidden />;
};
