import { buildTheme } from '@sanity/ui/theme';
import { defineConfig } from 'sanity';
import { structureTool, type StructureResolver } from 'sanity/structure';

import { CLUB, Group } from '~/data/club';
import { Team } from '~/data/events';
import { ENV } from '~/env';
import { ADMIN_PATH } from '~/i18n/locales';

import { HELP_TOOL } from './help';
import { fixedDocId, PRIVACY_PAGE_ID, SCHEMA_TYPES, SITE_PHOTOS_ID, SITE_SETTINGS_ID } from './schema';

const THEME = buildTheme({
  color: {
    base: { primary: { _hue: 'orange' } },
    selectable: { primary: { _hue: 'orange' } },
  },
});

const LISTS = ['event', 'newsPost', 'membershipPlan', 'discount', 'boardMember', 'sponsor'];

const SINGLETONS = [
  { type: 'siteSettings', id: SITE_SETTINGS_ID, title: 'Site settings' },
  { type: 'sitePhotos', id: SITE_PHOTOS_ID, title: 'Photos' },
  { type: 'privacyPage', id: PRIVACY_PAGE_ID, title: 'Privacy' },
];

const FIXED_SETS = [
  { type: 'trainingGroup', title: 'Training groups', keys: Group.options },
  { type: 'volunteerTeam', title: 'Volunteer teams', keys: Team.options },
];

const LOCKED_TYPES = new Set([...SINGLETONS, ...FIXED_SETS].map(({ type }) => type));

const LOCKED_ACTIONS = new Set(['delete', 'duplicate', 'unpublish']);

const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      ...SINGLETONS.map(({ type, id, title }) =>
        S.listItem().title(title).id(id).child(S.document().schemaType(type).documentId(id)),
      ),
      ...FIXED_SETS.map(({ type, title, keys }) =>
        S.listItem()
          .title(title)
          .id(type)
          .child(
            S.list()
              .title(title)
              .items(keys.map((key) => S.documentListItem().schemaType(type).id(fixedDocId(type, key)))),
          ),
      ),
      S.divider(),
      ...LISTS.map((type) => S.documentTypeListItem(type)),
    ]);

export const STUDIO_CONFIG = defineConfig({
  name: 'bygdo',
  title: CLUB.name,
  projectId: ENV.VITE_SANITY_PROJECT_ID,
  dataset: ENV.VITE_SANITY_DATASET,
  basePath: ADMIN_PATH,
  theme: THEME,
  plugins: [structureTool({ structure })],
  tools: (tools) => [...tools, HELP_TOOL],
  schema: {
    types: SCHEMA_TYPES,
    templates: (templates) => templates.filter(({ schemaType }) => !LOCKED_TYPES.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      LOCKED_TYPES.has(schemaType) ? actions.filter(({ action }) => !action || !LOCKED_ACTIONS.has(action)) : actions,
  },
});
