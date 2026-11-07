import {
  boardMember,
  discount,
  event,
  membershipPlan,
  newsPost,
  privacyPage,
  siteSettings,
  sponsor,
  trainingGroup,
  volunteerTeam,
} from './documents';
import { articleBody, callout, localeBody, localeString, localeText, quote, table } from './localized';
import { sitePhotos } from './photos';

export const SCHEMA_TYPES = [
  localeString,
  localeText,
  callout,
  quote,
  table,
  articleBody,
  localeBody,
  siteSettings,
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
];

export const SITE_SETTINGS_ID = 'siteSettings';
export const SITE_PHOTOS_ID = 'sitePhotos';
export const PRIVACY_PAGE_ID = 'privacyPage';

export const fixedDocId = (type: string, key: string) => `${type}-${key}`;
