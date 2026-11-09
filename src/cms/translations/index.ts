import type { Tool } from 'sanity';

import { Translate } from '~/components/ui/icons';

import { TranslationsTool } from './TranslationsTool';

export const TRANSLATIONS_TOOL: Tool = {
  name: 'translations',
  title: 'Translations',
  icon: Translate,
  component: TranslationsTool,
};
