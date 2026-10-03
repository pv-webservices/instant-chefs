import { readdir, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import assert from 'node:assert/strict';

const root = join(process.cwd(), 'dist');
const files = await readdir(root, { recursive: true });
const pages = files.filter(
  (name) => name.endsWith('.html') && name !== '404.html',
);
assert.equal(pages.length, 17, 'Expected all 17 requested business pages');
const titles = new Set();
const descriptions = new Set();
let checkedLinks = 0;
let checkedImages = 0;
let checkedSchemas = 0;

for (const file of pages) {
  const html = await readFile(join(root, file), 'utf8');
  const path =
    file === 'index.html'
      ? '/'
      : '/' + dirname(file).replaceAll('\\', '/') + '/';
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(
    /<meta name="description" content="([^"]+)"/s,
  )?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/s)?.[1];
  assert.ok(title && description && canonical, `Missing metadata: ${path}`);
  assert.equal(
    (html.match(/<h1(?:\s|>)/g) || []).length,
    1,
    `Expected one H1: ${path}`,
  );
  assert.equal(
    new URL(canonical).pathname,
    path,
    `Canonical path mismatch: ${path}`,
  );
  assert.ok(
    html.includes('property="og:title"') &&
      html.includes('name="twitter:card"'),
    `Missing social metadata: ${path}`,
  );
  titles.add(title);
  descriptions.add(description);
  for (const match of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  )) {
    const data = JSON.parse(match[1]);
    assert.ok(Array.isArray(data), `Invalid schema graph: ${path}`);
    assert.ok(!match[1].includes('AggregateRating'), 'No unsupported ratings');
    checkedSchemas += data.length;
  }
  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (href.startsWith('tel:')) assert.equal(href, 'tel:+918448496343');
    if (href.startsWith('mailto:'))
      assert.ok(href.startsWith('mailto:instantchef2010@gmail.com'));
    if (href.startsWith('https://wa.me'))
      assert.equal(new URL(href).pathname, '/918448496343');
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const url = new URL(href, canonical);
    const target = join(
      root,
      decodeURIComponent(url.pathname),
      url.pathname.endsWith('/') ? 'index.html' : '',
    );
    await access(target);
    if (url.hash) {
      const targetHtml = await readFile(target, 'utf8');
      assert.ok(
        targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
        `Missing anchor: ${path} -> ${href}`,
      );
    }
    checkedLinks++;
  }
  for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
    assert.ok(
      // An empty alt is valid for purely decorative images.
      /\balt(="[^"]*")?(\s|\/?$)/.test(match[1]),
      `Missing image alternative: ${path}`,
    );
    const src = match[1].match(/\bsrc="([^"]+)"/)?.[1];
    assert.ok(src?.startsWith('/images/'), `Expected local image: ${path}`);
    await access(join(root, src));
    for (const image of (match[1].match(/\bsrcset="([^"]+)"/)?.[1] || '').split(
      ',',
    )) {
      if (image.trim()) await access(join(root, image.trim().split(' ')[0]));
    }
    checkedImages++;
  }
}
assert.equal(titles.size, 17, 'Titles must be unique');
assert.equal(descriptions.size, 17, 'Descriptions must be unique');
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>/g) || []).length, 17);
for (const source of [
  'website logo.jpeg',
  'business card.jpeg',
  'Instant Chefs – Client Welcome & Onboarding Deck.pdf.pdf',
]) {
  assert.ok(
    !files.includes(source),
    `Reference source must stay out of published output: ${source}`,
  );
}
const pricing = await readFile(join(root, 'plans', 'index.html'), 'utf8');
for (const fee of ['₹7,000', '₹10,000', '₹15,000', '₹20,000'])
  assert.ok(pricing.includes(fee), `Missing approved price: ${fee}`);
const result = {
  pages: pages.length,
  uniqueTitles: titles.size,
  uniqueDescriptions: descriptions.size,
  checkedLinks,
  checkedImages,
  checkedSchemas,
  sitemapPages: 17,
  referenceFilesExcluded: true,
  approvedPrices: true,
};
console.log(JSON.stringify(result, null, 2));
