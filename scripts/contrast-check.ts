import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

import { chromium, type Browser } from 'playwright';

const PALETTES = ['fjord', 'club', 'glacier', 'lavender'];
const SCHEMES = ['light', 'dark'];
const STYLES = ['classic', 'court', 'flight'];
const PAGES = [
  '/',
  '/trening',
  '/trening/2025-26',
  '/medlemskap',
  '/medlemskap/bli-medlem',
  '/medlemskap/mine',
  '/arrangementer',
  '/arrangementer/hosttreff-2026',
  '/nyheter',
  '/klubben',
  '/kontakt',
  '/studie/404',
  '/zh',
  '/zh/medlemskap',
];
const SETTLE_MS = 1200;
const DESKTOP = { viewport: { width: 1366, height: 900 } };
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const SETTINGS_VERSION = 2;

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://localhost:5173' },
    palette: { type: 'string', multiple: true },
    scheme: { type: 'string', multiple: true },
    style: { type: 'string', multiple: true },
    page: { type: 'string', multiple: true },
    concurrency: { type: 'string', default: '6' },
    mobile: { type: 'boolean', default: false },
  },
});

const pick = (all: string[], chosen: string[] | undefined) => (chosen?.length ? chosen : all);

type Job = { palette: string; scheme: string; style: string; path: string };
type Violation = Job & { ratio: string; html: string; target: string };

const AXE_SOURCE = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

const reachable = async (url: string) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

const startDevServer = async (url: string): Promise<ChildProcess | null> => {
  if (await reachable(url)) return null;
  const port = new URL(url).port || '5173';
  const server = spawn('pnpm', ['exec', 'vp', 'dev', '--port', port, '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    if (await reachable(url)) return server;
    await new Promise((r) => setTimeout(r, 500));
  }
  server.kill();
  throw new Error(`Dev server did not start at ${url}`);
};

const check = async (browser: Browser, job: Job): Promise<Violation[]> => {
  const context = await browser.newContext(values.mobile ? MOBILE : DESKTOP);
  const state = {
    colorScheme: job.scheme,
    palette: job.palette,
    style: job.style,
    shape: 'soft',
    density: 'regular',
    navLayout: 'top',
    width: 'contained',
    font: 'chakra',
  };
  await context.addInitScript(
    ([s, v]) => localStorage.setItem('bigdo-settings', JSON.stringify({ state: s, version: v })),
    [state, SETTINGS_VERSION] as const,
  );
  const page = await context.newPage();
  await page.goto(values.url + job.path);
  await page.waitForTimeout(SETTLE_MS);
  await page.addScriptTag({ path: AXE_SOURCE });
  const nodes = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (...a: unknown[]) => Promise<AxeResult> } }).axe;
    type AxeResult = {
      violations: { nodes: { html: string; target: string[]; any: { data?: { contrastRatio?: number } }[] }[] }[];
    };
    const result = await axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['violations'] });
    return result.violations.flatMap((v) =>
      v.nodes.map((n) => ({
        html: n.html.slice(0, 100),
        target: n.target.join(' '),
        ratio: String(n.any.at(0)?.data?.contrastRatio ?? '?'),
      })),
    );
  });
  await context.close();
  return nodes.map((n) => ({ ...job, ...n }));
};

const run = async () => {
  const jobs: Job[] = [];
  for (const palette of pick(PALETTES, values.palette))
    for (const scheme of pick(SCHEMES, values.scheme))
      for (const style of pick(STYLES, values.style))
        for (const path of pick(PAGES, values.page)) jobs.push({ palette, scheme, style, path });

  const server = await startDevServer(values.url);
  const browser = await chromium.launch();
  const violations: Violation[] = [];
  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) violations.push(...(await check(browser, job)));
  };
  await Promise.all(Array.from({ length: Number(values.concurrency) }, worker));
  await browser.close();
  server?.kill();

  const grouped = Map.groupBy(violations, (v) => `${v.ratio}:1  ${v.html}`);
  for (const [key, list] of grouped) {
    const where = new Set(list.map((v) => `${v.palette}/${v.scheme}/${v.style}${v.path}`));
    console.log(
      `\n✗ ${key}\n  ${Array.from(where).slice(0, 6).join('  ')}${where.size > 6 ? `  (+${where.size - 6})` : ''}`,
    );
  }
  console.log(
    `\nChecked ${jobs.length} page views: ${violations.length} contrast issues in ${grouped.size} distinct elements.`,
  );
  process.exitCode = violations.length ? 1 : 0;
};

await run();
