import { execFileSync } from 'node:child_process';

const SHARED_SOURCES = ['src/data/business.ts', 'src/layouts/Base.astro'];

/** Source files whose content defines each indexable route. */
function sourcesFor(route: string): string[] {
  if (route === '/') return ['src/pages/index.astro'];
  if (route.startsWith('/services/') && route !== '/services/')
    return ['src/pages/services/[slug].astro'];
  const name = route.replaceAll('/', '');
  return name === 'services'
    ? ['src/pages/services/index.astro']
    : [`src/pages/${name}.astro`];
}

function gitDate(files: string[]): string | undefined {
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', ...files],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Last-modified date (YYYY-MM-DD) for a route: the latest commit touching its
 * page or shared content. Falls back to the build date when git is unavailable
 * or the files have uncommitted changes only.
 */
export function lastModified(route: string): string {
  return (
    gitDate([...sourcesFor(route), ...SHARED_SOURCES]) ??
    new Date().toISOString().slice(0, 10)
  );
}
