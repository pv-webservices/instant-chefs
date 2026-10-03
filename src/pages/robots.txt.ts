import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\n${site?.protocol === 'https:' ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${new URL('/sitemap.xml', site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
