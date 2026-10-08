import type { APIRoute } from 'astro';

// Production allows crawling; noindex on utility pages is set with meta robots,
// not here, so crawlers can still read it. Non-production builds block crawling.
export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      __SITE_INDEXABLE__ ? 'Allow: /' : 'Disallow: /',
      '',
      `Sitemap: ${new URL('/sitemap.xml', site).href}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
