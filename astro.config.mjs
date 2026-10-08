import { defineConfig, passthroughImageService } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(
  process.env.NODE_ENV || 'production',
  process.cwd(),
  'PUBLIC_',
);

// The final production domain. Canonicals, sitemap, robots.txt, Open Graph,
// JSON-LD and the FormSubmit redirect are all built from this origin.
const PRODUCTION_SITE = 'https://instantchefs.in';

// Site origin, in order of preference:
// 1. PUBLIC_SITE_URL (explicit override, e.g. for a local production audit)
// 2. PRODUCTION_SITE, for Netlify production deploys only
// Anything else (local builds, deploy previews) is built as non-indexable.
const explicitSite = process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL;
const productionSite =
  process.env.CONTEXT === 'production' ? PRODUCTION_SITE : undefined;
const site = explicitSite || productionSite;
if (site && (!/^https:\/\//.test(site) || new URL(site).pathname !== '/')) {
  throw new Error(
    'PUBLIC_SITE_URL must be an HTTPS origin, e.g. https://your-domain.com',
  );
}

export default defineConfig({
  site: site || 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // Images in src/assets are already resized and compressed WebP files.
  // Pass them through untouched (no re-encoding) but with hashed file names
  // so they can be cached immutably.
  image: { service: passthroughImageService() },
  vite: {
    define: {
      __SITE_INDEXABLE__: JSON.stringify(Boolean(site)),
    },
    server: {
      allowedHosts: true,
    },
    preview: {
      allowedHosts: true,
    },
  },
});
