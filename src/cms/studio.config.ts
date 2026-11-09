import { buildTheme } from '@sanity/ui/theme';
import { defineConfig, type Template } from 'sanity';
import { presentationTool } from 'sanity/presentation';
import { structureTool } from 'sanity/structure';

import { Eye } from '~/components/ui/icons';
import { CLUB } from '~/data/club';
import { EventKind } from '~/data/events';
import { ENV } from '~/env';
import { ADMIN_PATH } from '~/i18n/locales';

import { HELP_TOOL } from './help';
import { LOCATIONS, MAIN_DOCUMENTS } from './presentation';
import { SCHEMA_TYPES } from './schema';
import { EVENT_KIND_TITLES } from './schema/labels';
import { START_TOOL } from './start';
import { eventTemplateId, FIXED_SETS, SINGLETONS, structure } from './structure';
import { TRANSLATIONS_TOOL } from './translations';

const THEME = buildTheme({
  color: {
    base: { primary: { _hue: 'orange' } },
    selectable: { primary: { _hue: 'orange' } },
  },
});

const LOCKED_TYPES = new Set<string>([
  ...Object.values(SINGLETONS).map(({ type }) => type),
  ...FIXED_SETS.map(({ type }) => type),
]);

const LOCKED_ACTIONS = new Set(['delete', 'duplicate', 'unpublish']);

const EVENT_TEMPLATES: Template[] = EventKind.options.map((kind) => ({
  id: eventTemplateId(kind),
  title: EVENT_KIND_TITLES[kind],
  schemaType: 'event',
  value: { kind },
}));

export const STUDIO_CONFIG = defineConfig({
  name: 'bygdo',
  title: CLUB.name,
  projectId: ENV.VITE_SANITY_PROJECT_ID,
  dataset: ENV.VITE_SANITY_DATASET,
  basePath: ADMIN_PATH,
  theme: THEME,
  plugins: [
    structureTool({ title: 'Content', structure }),
    presentationTool({
      title: 'Preview',
      icon: Eye,
      previewUrl: { initial: '/' },
      resolve: { locations: LOCATIONS, mainDocuments: MAIN_DOCUMENTS },
    }),
  ],
  tools: (tools) => [START_TOOL, ...tools, TRANSLATIONS_TOOL, HELP_TOOL],
  releases: { enabled: false },
  tasks: { enabled: false },
  scheduledDrafts: { enabled: false },
  scheduledPublishing: { enabled: false },
  schema: {
    types: SCHEMA_TYPES,
    templates: (templates) => [
      ...templates.filter(({ schemaType }) => !LOCKED_TYPES.has(schemaType) && schemaType !== 'event'),
      ...EVENT_TEMPLATES,
    ],
  },
  document: {
    actions: (actions, { schemaType }) =>
      LOCKED_TYPES.has(schemaType) ? actions.filter(({ action }) => !action || !LOCKED_ACTIONS.has(action)) : actions,
  },
});
