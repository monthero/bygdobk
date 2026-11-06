import { buildTheme } from '@sanity/ui/theme';
import { defineConfig } from 'sanity';
import { structureTool, type StructureResolver } from 'sanity/structure';

import { CLUB } from '~/data/club';
import { ENV } from '~/env';
import { ADMIN_PATH } from '~/i18n/locales';

import { PRIVACY_PAGE_ID, SCHEMA_TYPES, SITE_SETTINGS_ID } from './schema';

const THEME = buildTheme({
  color: {
    base: { primary: { _hue: 'orange' } },
    selectable: { primary: { _hue: 'orange' } },
  },
});

const LISTS = ['event', 'newsPost', 'membershipPlan', 'discount', 'boardMember'];

const SINGLETONS = [
  { type: 'siteSettings', id: SITE_SETTINGS_ID, title: 'Site notice' },
  { type: 'privacyPage', id: PRIVACY_PAGE_ID, title: 'Privacy' },
];

const SINGLETON_TYPES = new Set(SINGLETONS.map(({ type }) => type));

const LOCKED_ACTIONS = new Set(['delete', 'duplicate', 'unpublish']);

const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      ...SINGLETONS.map(({ type, id, title }) =>
        S.listItem().title(title).id(id).child(S.document().schemaType(type).documentId(id)),
      ),
      S.divider(),
      ...LISTS.map((type) => S.documentTypeListItem(type)),
    ]);

export const STUDIO_CONFIG = defineConfig({
  name: 'bigdo',
  title: CLUB.name,
  projectId: ENV.VITE_SANITY_PROJECT_ID,
  dataset: ENV.VITE_SANITY_DATASET,
  basePath: ADMIN_PATH,
  theme: THEME,
  plugins: [structureTool({ structure })],
  schema: {
    types: SCHEMA_TYPES,
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? actions.filter(({ action }) => !action || !LOCKED_ACTIONS.has(action))
        : actions,
  },
});
