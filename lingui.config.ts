import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'nb', 'sv', 'da', 'fi', 'is', 'zh'],
  fallbackLocales: { default: 'en' },
  format: formatter({ lineNumbers: false, customHeaderAttributes: { 'POT-Creation-Date': '' } }),
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['src'],
      exclude: ['**/node_modules/**'],
    },
  ],
});
