import { defineConfig } from 'astro/config';
import { unlink } from 'node:fs/promises';
import { loadEnv } from 'vite';

const env = loadEnv(
  process.env.NODE_ENV || 'production',
  process.cwd(),
  'PUBLIC_',
);
const site = process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL;
if (site && (!/^https:\/\//.test(site) || new URL(site).pathname !== '/')) {
  throw new Error(
    'PUBLIC_SITE_URL must be an HTTPS origin, e.g. https://your-domain.com',
  );
}

export default defineConfig({
  site: site || 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    server: {
      allowedHosts: true,
    },
    preview: {
      allowedHosts: true,
    },
  },
  integrations: [
    {
      name: 'keep-client-reference-files-out-of-published-output',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          // Keep the supplied originals in public, but publish only website assets.
          for (const name of [
            'website logo.jpeg',
            'business card.jpeg',
            'Instant Chefs – Client Welcome & Onboarding Deck.pdf.pdf',
          ]) {
            await unlink(new URL(name, dir)).catch((error) => {
              if (error.code !== 'ENOENT') throw error;
            });
          }
        },
      },
    },
  ],
});
