import type { APIRoute } from 'astro';
import { routes } from '../data/business';
import { lastModified } from '../data/lastmod';

// Only indexable routes are listed; 404 and thank-you pages are excluded.
export const GET: APIRoute = ({ site }) => {
  const urls = routes
    .map(
      (path) =>
        `  <url>\n    <loc>${new URL(path, site).href}</loc>\n    <lastmod>${lastModified(path)}</lastmod>\n  </url>`,
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
