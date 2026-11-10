import { withEditorStamps } from '../authors/schema';
import {
  boardMember,
  discount,
  event,
  membershipPlan,
  newsPost,
  privacyPage,
  sponsor,
  trainingGroup,
  volunteerTeam,
} from './documents';
import { articleBody, callout, localeBody, localeString, localeText, quote, table } from './localized';
import { sitePhotos } from './photos';
import { SETTINGS_TYPES } from './settings';

const DOCUMENT_TYPES = [
  ...SETTINGS_TYPES,
  sitePhotos,
  privacyPage,
  newsPost,
  event,
  membershipPlan,
  discount,
  boardMember,
  sponsor,
  trainingGroup,
  volunteerTeam,
].map(withEditorStamps);

export const SCHEMA_TYPES = [
  localeString,
  localeText,
  callout,
  quote,
  table,
  articleBody,
  localeBody,
  ...DOCUMENT_TYPES,
];

export const SITE_PHOTOS_ID = 'sitePhotos';
export const PRIVACY_PAGE_ID = 'privacyPage';

export const fixedDocId = (type: string, key: string) => `${type}-${key}`;
