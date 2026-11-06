import { boardMember, discount, event, membershipPlan, newsPost, privacyPage, siteSettings } from './documents';
import { articleBody, callout, localeBody, localeString, localeText, quote, table } from './localized';

export const SCHEMA_TYPES = [
  localeString,
  localeText,
  callout,
  quote,
  table,
  articleBody,
  localeBody,
  siteSettings,
  privacyPage,
  newsPost,
  event,
  membershipPlan,
  discount,
  boardMember,
];

export const SITE_SETTINGS_ID = 'siteSettings';
export const PRIVACY_PAGE_ID = 'privacyPage';
