import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { lingui } from '@lingui/vite-plugin';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import Icons from 'unplugin-icons/vite';
import { imagetools } from 'vite-imagetools';
import { defineConfig, type Plugin } from 'vite-plus';

import { CONTENT_GROQ } from './src/cms/queries.ts';
import { sanityQueryUrl } from './src/cms/sanityApi.ts';
import { PAGE_META, SITE_NAME, SITE_URL, type PageMeta } from './src/components/seo/pageMeta.ts';
import {
  ADMIN_PATH,
  CONTENT_FALLBACK,
  DEFAULT_LOCALE,
  LOCALE_META,
  LOCALES,
  withLocale,
  type Locale,
} from './src/i18n/locales.ts';

const RESPONSIVE_PHOTO = new URLSearchParams({
  w: '640;960;1200;1400;2048',
  format: 'webp',
  // Close to the source photos, so the full-width copy is no bigger than the original.
  quality: '75',
  as: 'img',
});
const NO_DIRECTIVES = new URLSearchParams();

const responsivePhotos = () =>
  imagetools({ defaultDirectives: (url) => (url.searchParams.has('responsive') ? RESPONSIVE_PHOTO : NO_DIRECTIVES) });

const contentPreload = (): Plugin => {
  let script = '';
  return {
    name: 'bk-content-preload',
    configResolved: ({ env }) => {
      const project = { projectId: env.VITE_SANITY_PROJECT_ID, dataset: env.VITE_SANITY_DATASET };
      const template = sanityQueryUrl(project, CONTENT_GROQ, { locale: '__LOCALE__', fallback: '__FALLBACK__' });
      script = `(() => {
  if (\`\${location.pathname}/\`.startsWith('${ADMIN_PATH}/') || window.self !== window.top) return;
  const lang = document.documentElement.lang;
  const locale = lang.startsWith('zh') ? 'zh' : lang;
  const fallback = ${JSON.stringify(CONTENT_FALLBACK)}[locale];
  if (!fallback) return;
  const link = Object.assign(document.createElement('link'), { rel: 'preload', as: 'fetch', crossOrigin: 'anonymous' });
  link.href = ${JSON.stringify(template)}.replace('__LOCALE__', locale).replace('__FALLBACK__', fallback);
  document.head.append(link);
})();`;
    },
    transformIndexHtml: { order: 'pre', handler: () => [{ tag: 'script', children: script, injectTo: 'head' }] },
  };
};

const SEO_MARKER = '<!--seo-->';
const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = (text: string) => text.replaceAll(/[&<>"]/g, (ch) => HTML_ESCAPES[ch] ?? ch);

const seoHead = (locale: Locale, { title, description }: PageMeta, url: string) =>
  [
    `<title>${escapeHtml(title)}</title>`,
    `<link rel="canonical" href="${url}" />`,
    ...[
      ['name', 'description', description],
      ['property', 'og:site_name', SITE_NAME],
      ['property', 'og:type', 'website'],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', url],
      ['property', 'og:locale', LOCALE_META[locale].intl.replace('-', '_')],
      ['property', 'og:image', `${SITE_URL}/og-image.jpg`],
      ['property', 'og:image:width', '1200'],
      ['property', 'og:image:height', '630'],
      ['name', 'twitter:card', 'summary_large_image'],
    ].map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeHtml(value ?? '')}" />`),
  ].join('\n    ');

const pageHtml = (template: string, locale: Locale, head: string) =>
  template.replace('<html lang="nb"', `<html lang="${LOCALE_META[locale].lang}"`).replace(SEO_MARKER, head);

const seoPages = (): Plugin => {
  let isBuild = false;
  let outDir = '';
  const write = async (file: string, html: string) => {
    await mkdir(dirname(`${outDir}/${file}`), { recursive: true });
    await writeFile(`${outDir}/${file}`, html);
  };
  return {
    name: 'bk-seo-pages',
    configResolved: ({ command, root, build }) => {
      isBuild = command === 'build';
      outDir = resolve(root, build.outDir);
    },
    transformIndexHtml: (html) =>
      isBuild ? html : html.replace(SEO_MARKER, `<title>${escapeHtml(PAGE_META['/'][DEFAULT_LOCALE].title)}</title>`),
    closeBundle: async () => {
      if (!isBuild) return;
      const template = await readFile(`${outDir}/index.html`, 'utf8');
      const pages = LOCALES.flatMap((locale) =>
        Object.entries(PAGE_META).map(([path, meta]) => {
          const localized = withLocale(path, locale);
          const file = localized === '/' ? 'index.html' : `${localized.slice(1)}/index.html`;
          return write(file, pageHtml(template, locale, seoHead(locale, meta[locale], `${SITE_URL}${localized}`)));
        }),
      );
      await Promise.all([write('shell.html', template.replace(SEO_MARKER, `<title>${SITE_NAME}</title>`)), ...pages]);
    },
  };
};

export default defineConfig({
  fmt: {
    printWidth: 120,
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    sortImports: {},
    ignorePatterns: ['src/routeTree.gen.ts', 'pnpm-lock.yaml'],
  },
  lint: {
    plugins: ['react', 'typescript', 'unicorn', 'oxc', 'import', 'jsx-a11y'],
    categories: { correctness: 'error', suspicious: 'warn' },
    options: { typeAware: true, typeCheck: true },
    rules: {
      'react/rules-of-hooks': 'error',
      'react/exhaustive-deps': 'warn',
      'react/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'import/no-unassigned-import': ['warn', { allow: ['**/*.css', '@fontsource-variable/*'] }],
      'typescript/require-array-sort-compare': ['error', { ignoreStringArrays: false }],
      'unicorn/prefer-at': 'error',
      'eslint/no-nested-ternary': 'error',
      'eslint/no-underscore-dangle': ['warn', { allow: ['_key', '_type', '_ref', '_id', '_createdAt', '_updatedAt'] }],
      'unicorn/prefer-number-properties': 'error',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-array-reverse': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/require-post-message-target-origin': 'off',
      'typescript/no-unsafe-type-assertion': 'off',
      'typescript/no-unnecessary-type-assertion': 'off',
      'typescript/consistent-return': 'off',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    overrides: [{ files: ['src/routes/**'], rules: { 'react/only-export-components': 'off' } }],
    ignorePatterns: ['dist/**', 'src/routeTree.gen.ts', 'supabase/functions/**'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
  },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    lingui({ macroTransform: true }),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      scale: 1,
      customCollections: { bk: FileSystemIconLoader(`${import.meta.dirname}/src/assets/icons`) },
    }),
    responsivePhotos(),
    contentPreload(),
    seoPages(),
  ],
  resolve: { tsconfigPaths: true },
});
