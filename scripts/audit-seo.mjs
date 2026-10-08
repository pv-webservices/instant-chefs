// Technical SEO and integrity audit for the built site in dist/.
// Usage: npm run build && npm run audit:seo
//
// Production builds (PUBLIC_SITE_URL or Netlify production) are checked as
// indexable; any other build is expected to be fully non-indexable.
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const TITLE_MAX = 65;
const DESCRIPTION_MIN = 70;
const DESCRIPTION_MAX = 170;
const UTILITY_PAGES = new Set(['/404/', '/thank-you/']);
const ROBOTS_INDEX = 'index, follow, max-image-preview:large';
const ROBOTS_UTILITY = 'noindex, follow';
const ROBOTS_PREVIEW = 'noindex, nofollow';
const FORM_ACTION = 'https://formsubmit.co/instantchef2010@gmail.com';
const PRICES = ['₹7,000', '₹10,000', '₹15,000', '₹20,000'];
const REQUIRED_PUBLIC_FILES = [
  'favicon.ico',
  'favicon.svg',
  'favicon-48x48.png',
  'favicon-96x96.png',
  'apple-touch-icon.png',
  'icon-192x192.png',
  'icon-512x512.png',
  'site.webmanifest',
  'images/og-image.jpg',
  'robots.txt',
  'sitemap.xml',
  '404.html',
];

const errors = [];
const fail = (page, message) => errors.push(`${page}: ${message}`);
const decode = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
const meta = (html, attr, key) =>
  html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];
const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

function routeFor(file) {
  const path = file.replaceAll('\\', '/');
  if (path === 'index.html') return '/';
  if (path === '404.html') return '/404/';
  return '/' + path.replace(/index\.html$/, '');
}

/** Resolves an internal URL to a file in dist/, or null. */
async function resolveInternal(pathname) {
  const clean = decodeURIComponent(pathname);
  const candidates = clean.endsWith('/')
    ? [join(DIST, clean, 'index.html')]
    : [join(DIST, clean), join(DIST, clean, 'index.html')];
  for (const candidate of candidates)
    if (await exists(candidate)) return candidate;
  return null;
}

const files = (await readdir(DIST, { recursive: true })).filter((f) =>
  f.endsWith('.html'),
);
const pages = [];
for (const file of files) {
  const html = await readFile(join(DIST, file), 'utf8');
  pages.push({ route: routeFor(file), html });
}

const isProduction = pages.some(
  (p) => meta(p.html, 'name', 'robots') === ROBOTS_INDEX,
);
const homepage = pages.find((p) => p.route === '/');
const siteOrigin = isProduction
  ? new URL(homepage.html.match(/<link rel="canonical" href="([^"]+)"/)[1])
      .origin
  : null;

const titles = new Map();
const descriptions = new Map();
const indexable = new Set();
let linkCount = 0;
let imageCount = 0;
let schemaCount = 0;

for (const { route, html } of pages) {
  const isUtility = UTILITY_PAGES.has(route);
  const robots = meta(html, 'name', 'robots');
  const expectedRobots = isUtility
    ? ROBOTS_UTILITY
    : isProduction
      ? ROBOTS_INDEX
      : ROBOTS_PREVIEW;
  if (robots !== expectedRobots)
    fail(route, `robots is "${robots}", expected "${expectedRobots}"`);
  if (!isUtility && isProduction) indexable.add(route);

  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  if (!title) fail(route, 'missing <title>');
  else if (title.length > TITLE_MAX)
    fail(route, `title is ${title.length} chars (max ${TITLE_MAX}): ${title}`);
  titles.set(title, [...(titles.get(title) ?? []), route]);

  const description = decode(meta(html, 'name', 'description') ?? '');
  if (
    description.length < DESCRIPTION_MIN ||
    description.length > DESCRIPTION_MAX
  )
    fail(
      route,
      `description is ${description.length} chars (want ${DESCRIPTION_MIN}–${DESCRIPTION_MAX})`,
    );
  descriptions.set(description, [
    ...(descriptions.get(description) ?? []),
    route,
  ]);

  const headings = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) =>
    Number(m[1]),
  );
  const h1Count = headings.filter((level) => level === 1).length;
  if (h1Count !== 1) fail(route, `has ${h1Count} <h1> elements`);
  if (headings[0] !== 1)
    fail(route, `first heading is <h${headings[0]}>, expected <h1>`);
  headings.forEach((level, i) => {
    if (i && level > headings[i - 1] + 1)
      fail(route, `heading level skips from h${headings[i - 1]} to h${level}`);
  });

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (isUtility) {
    if (canonical)
      fail(route, 'noindex utility page must not have a canonical');
  } else if (!canonical) fail(route, 'missing canonical');
  else {
    const url = new URL(canonical);
    if (url.pathname !== route)
      fail(route, `canonical points to ${url.pathname}`);
    if (isProduction && url.origin !== siteOrigin)
      fail(route, `canonical origin ${url.origin} differs from ${siteOrigin}`);
    if (isProduction && url.protocol !== 'https:')
      fail(route, 'canonical is not HTTPS');
  }

  for (const [attr, key] of [
    ['property', 'og:site_name'],
    ['property', 'og:locale'],
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['property', 'og:type'],
    ['property', 'og:image'],
    ['property', 'og:image:width'],
    ['property', 'og:image:height'],
    ['property', 'og:image:alt'],
    ['name', 'twitter:card'],
    ['name', 'twitter:image'],
  ])
    if (!meta(html, attr, key)) fail(route, `missing ${key}`);
  if (!isUtility && meta(html, 'property', 'og:url') !== canonical)
    fail(route, 'og:url must match the canonical URL');

  for (const match of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  )) {
    try {
      const data = JSON.parse(match[1]);
      schemaCount += Array.isArray(data) ? data.length : 1;
      if (match[1].includes('AggregateRating') || match[1].includes('Review'))
        fail(route, 'unsupported rating/review schema');
    } catch {
      fail(route, 'invalid JSON-LD');
    }
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
    imageCount++;
    const attrs = match[1];
    // Astro renders an empty alt as a bare `alt` attribute, which is valid.
    if (!/\balt(="[^"]*")?(\s|$)/.test(attrs))
      fail(route, `image without alt: ${attrs.slice(0, 80)}`);
    const alt = attrs.match(/\balt="([^"]*)"/)?.[1] ?? '';
    if (/\.(webp|jpe?g|png|svg)$/i.test(alt))
      fail(route, `alt looks like a file name: ${alt}`);
    if (!/\bwidth="\d+"/.test(attrs) || !/\bheight="\d+"/.test(attrs))
      fail(route, `image without width/height: ${attrs.slice(0, 80)}`);
    const sources = [attrs.match(/\bsrc="([^"]+)"/)?.[1]];
    for (const candidate of (
      attrs.match(/\bsrcset="([^"]+)"/)?.[1] ?? ''
    ).split(','))
      sources.push(candidate.trim().split(/\s+/)[0]);
    for (const src of sources.filter(Boolean))
      if (src.startsWith('/') && !(await resolveInternal(src)))
        fail(route, `missing image ${src}`);
  }

  for (const match of html.matchAll(/<(a|link)\b[^>]*\bhref="([^"]+)"/g)) {
    const isAnchor = match[1] === 'a';
    const href = decode(match[2]);
    if (href.startsWith('tel:') && href !== 'tel:+918448496343')
      fail(route, `unexpected phone link ${href}`);
    if (
      href.startsWith('mailto:') &&
      !href.startsWith('mailto:instantchef2010@gmail.com')
    )
      fail(route, `unexpected email link ${href}`);
    if (/^https?:\/\//.test(href)) {
      try {
        const url = new URL(href);
        if (url.hostname === 'wa.me' && url.pathname !== '/918448496343')
          fail(route, `unexpected WhatsApp number ${href}`);
        if (
          siteOrigin &&
          url.origin === siteOrigin &&
          !(await resolveInternal(url.pathname))
        )
          fail(route, `broken absolute internal URL ${href}`);
      } catch {
        fail(route, `malformed URL ${href}`);
      }
      continue;
    }
    if (href.startsWith('#')) {
      linkCount++;
      if (!html.includes(`id="${decodeURIComponent(href.slice(1))}"`))
        fail(route, `missing same-page anchor ${href}`);
      continue;
    }
    if (!href.startsWith('/')) continue;
    linkCount++;
    const url = new URL(href, `http://site${route}`);
    const isPageLink = isAnchor && !/\.[a-z0-9]+$/i.test(url.pathname);
    if (isPageLink && url.pathname !== url.pathname.toLowerCase())
      fail(route, `non-lowercase URL ${href}`);
    if (isPageLink && !url.pathname.endsWith('/'))
      fail(route, `internal page link without trailing slash: ${href}`);
    const target = await resolveInternal(url.pathname);
    if (!target) {
      fail(route, `broken internal link ${href}`);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      const targetHtml = await readFile(target, 'utf8');
      if (!targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`))
        fail(route, `missing anchor target ${href}`);
    }
  }
}

for (const [title, routes] of titles)
  if (routes.length > 1) fail(routes.join(', '), `duplicate title "${title}"`);
for (const [description, routes] of descriptions)
  if (routes.length > 1)
    fail(
      routes.join(', '),
      `duplicate description "${description.slice(0, 60)}…"`,
    );

// Sitemap must list exactly the indexable pages.
const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
const sitemapRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (m) => new URL(m[1]),
);
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
  (m) => m[1],
);
if (
  lastmods.length !== sitemapRoutes.length ||
  lastmods.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))
)
  fail('sitemap.xml', 'every URL needs a YYYY-MM-DD lastmod');
for (const url of sitemapRoutes) {
  if (UTILITY_PAGES.has(url.pathname))
    fail('sitemap.xml', `lists noindex page ${url.pathname}`);
  if (isProduction && url.origin !== siteOrigin)
    fail('sitemap.xml', `wrong origin ${url.href}`);
  if (!(await resolveInternal(url.pathname)))
    fail('sitemap.xml', `lists missing page ${url.pathname}`);
}
if (isProduction) {
  const listed = new Set(sitemapRoutes.map((u) => u.pathname));
  for (const route of indexable)
    if (!listed.has(route))
      fail('sitemap.xml', `missing indexable page ${route}`);
  for (const route of listed)
    if (!indexable.has(route))
      fail('sitemap.xml', `lists non-indexable page ${route}`);
}

const robotsTxt = await readFile(join(DIST, 'robots.txt'), 'utf8');
if (!/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(robotsTxt))
  fail('robots.txt', 'missing Sitemap line');
if (isProduction && !/^Allow: \/$/m.test(robotsTxt))
  fail('robots.txt', 'production must allow crawling');
if (
  isProduction &&
  /^Disallow: \/(_astro|images|.*\.(css|js))/m.test(robotsTxt)
)
  fail('robots.txt', 'must not block CSS, JS or images');
if (!isProduction && !/^Disallow: \/$/m.test(robotsTxt))
  fail('robots.txt', 'non-production build must disallow crawling');

for (const file of REQUIRED_PUBLIC_FILES)
  if (!(await exists(join(DIST, file)))) fail('dist', `missing ${file}`);
try {
  const manifest = JSON.parse(
    await readFile(join(DIST, 'site.webmanifest'), 'utf8'),
  );
  for (const key of [
    'name',
    'short_name',
    'icons',
    'theme_color',
    'background_color',
  ])
    if (!manifest[key]) fail('site.webmanifest', `missing ${key}`);
  for (const icon of manifest.icons ?? [])
    if (!(await exists(join(DIST, icon.src))))
      fail('site.webmanifest', `missing icon ${icon.src}`);
} catch {
  fail('site.webmanifest', 'invalid JSON');
}

// Contact form: FormSubmit target, POST, field names, honeypot and redirect.
const contact = pages.find((p) => p.route === '/contact/').html;
const form = contact.match(
  /<form\b[^>]*id="enquiry-form"[^>]*>([\s\S]*?)<\/form>/,
);
if (!form) fail('/contact/', 'enquiry form not found');
else {
  const tag = form[0].slice(0, form[0].indexOf('>') + 1);
  if (!tag.includes(`action="${FORM_ACTION}"`))
    fail('/contact/', 'form action is not the FormSubmit endpoint');
  if (!/method="POST"/i.test(tag))
    fail('/contact/', 'form method must be POST');
  for (const name of ['name', 'email', 'phone', 'message', 'consent']) {
    const field = form[1].match(
      new RegExp(`<(?:input|textarea)\\b[^>]*name="${name}"[^>]*>`),
    )?.[0];
    if (!field) fail('/contact/', `missing field "${name}"`);
    else if (!/\brequired\b/.test(field))
      fail('/contact/', `field "${name}" must be required`);
  }
  if (!/name="_honey"/.test(form[1]))
    fail('/contact/', 'missing _honey honeypot');
  if (
    !/name="_subject" value="New Website Enquiry - Instant Chefs"/.test(form[1])
  )
    fail('/contact/', 'missing _subject');
  const next = form[1].match(/name="_next" value="([^"]+)"/)?.[1];
  if (isProduction && next !== `${siteOrigin}/thank-you/`)
    fail('/contact/', `_next should be ${siteOrigin}/thank-you/, got ${next}`);
  if (!isProduction && next)
    fail('/contact/', '_next must not point at a non-production origin');
}

const plansPage = pages.find((p) => p.route === '/plans/').html;
for (const price of PRICES)
  if (!plansPage.includes(price))
    fail('/plans/', `missing approved price ${price}`);

const summary = {
  mode: isProduction
    ? `production (${siteOrigin})`
    : 'non-production (noindex build)',
  htmlPages: pages.length,
  indexablePages: isProduction ? indexable.size : 0,
  sitemapUrls: sitemapRoutes.length,
  internalLinksChecked: linkCount,
  imagesChecked: imageCount,
  schemaObjects: schemaCount,
  errors: errors.length,
};
console.log(JSON.stringify(summary, null, 2));
if (errors.length) {
  console.error('\nSEO audit failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('SEO audit passed.');
