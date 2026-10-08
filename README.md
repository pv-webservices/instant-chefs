# Instant Chefs

Static marketing website for Instant Chefs (chef and domestic staff hiring, Faridabad), built with Astro 7, TypeScript and plain CSS. Hosted on Netlify with GitHub auto-deploy. Contact-form enquiries are delivered by [FormSubmit](https://formsubmit.co/) to `instantchef2010@gmail.com`; there is no backend, database or SMTP.

- Production: https://instantchefs.in/ (preferred hostname; `http://`, `www.` and `instant-chefs.netlify.app` 301-redirect here)
- Sitemap: https://instantchefs.in/sitemap.xml · robots: https://instantchefs.in/robots.txt
- Framework: Astro 7 (static output), TypeScript, plain CSS
- Repository: https://github.com/pv-webservices/instant-chefs

## Commands

Requires Node.js 22.18+ (Netlify builds with Node 24, set in `netlify.toml`).

| Command                | What it does                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `npm ci`               | Install exact dependencies                                                                         |
| `npm run dev`          | Development server at http://localhost:4321                                                        |
| `npm run build`        | Static build into `dist/`                                                                          |
| `npm run preview`      | Serve the built `dist/` locally                                                                    |
| `npm run check`        | Astro + TypeScript type check                                                                      |
| `npm run lint`         | Prettier formatting check                                                                          |
| `npm test`             | Unit tests (form validation), Node's built-in test runner                                          |
| `npm run audit:seo`    | Audits `dist/`: titles, descriptions, H1/heading order, canonicals, robots, alt text, links, sitemap, form target |
| `npm run test:e2e`     | Playwright browser tests: routes, console errors, images, 404, form (FormSubmit intercepted), responsive widths, axe WCAG 2.1 AA |
| `npm run qa`           | All of the above in order                                                                          |
| `npm run assets:brand` | Regenerates favicons, app icons and the social image from `source-files/website-logo.jpeg`         |

Browser tests use the locally installed Google Chrome (`channel: 'chrome'`). They never send a real enquiry: requests to FormSubmit and WhatsApp are intercepted.

### Production vs. non-production builds

The site origin is resolved in `astro.config.mjs`:

1. `PUBLIC_SITE_URL` if set (an HTTPS origin; an override for local audits), otherwise
2. `PRODUCTION_SITE` (`https://instantchefs.in`) when Netlify builds a production deploy (`CONTEXT=production`).

Only those builds are indexable (`index, follow`, `Allow: /`, FormSubmit redirect to `/thank-you/`). Local builds and Netlify deploy previews are `noindex, nofollow` with `Disallow: /`. To audit a production-equivalent build locally:

```bash
CONTEXT=production npm run build
npm run audit:seo
```

## Deployment

Pushing to `main` on GitHub triggers a Netlify build (`npm run build`, publish `dist/`). `netlify.toml` also configures:

- security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`)
- immutable caching for content-hashed files in `/_astro/`; one-week caching for icons and the social image
- 301 redirects from `/index.html` (and nested `index.html`) to the trailing-slash URL
- a 301 redirect from `instant-chefs.netlify.app` to `https://instantchefs.in` (no duplicate host)

The custom domain, HTTPS certificate and `www` → apex redirect are managed in Netlify's domain settings, not in this repository. Netlify serves `dist/404.html` with a genuine HTTP 404 for unknown routes and redirects `/page` to `/page/`.

## Contact form (FormSubmit)

`src/components/ContactForm.astro` posts to `https://formsubmit.co/instantchef2010@gmail.com` with hidden fields `_subject` ("New Website Enquiry - Instant Chefs"), `_template=table`, the `_honey` honeypot and, on production builds, `_next` → `/thank-you/`. Required fields: name, email, phone, message and privacy consent; other fields are optional. Validation lives in `src/scripts/form-validation.ts` (unit tested) and `src/scripts/enquiry.ts` (inline errors, `aria-invalid`/`aria-describedby`, focus management, duplicate-submit protection, optional "Send via WhatsApp").

FormSubmit keeps its own spam check (reCAPTCHA page) enabled alongside the honeypot, so `_captcha` is deliberately not disabled.

**Activation (one-time, required):** FormSubmit sends an activation email to `instantchef2010@gmail.com` on the first submission from `https://instantchefs.in`. Enquiries are only delivered after the inbox owner clicks **Activate Form** in that email (check Spam/Promotions too). Then send one genuine test enquiry and confirm it arrives and the browser lands on `https://instantchefs.in/thank-you/`. No SMTP, mail server, credentials or environment variables are involved.

## Project structure

```
netlify.toml              Netlify build, redirects, headers, caching
astro.config.mjs          Site origin / indexability, passthrough image service
public/                   Files served at stable URLs
  favicon.*, icon-*.png, apple-touch-icon.png, site.webmanifest
  images/og-image.jpg     1200×630 social sharing image
src/
  assets/images/
    brand/                Logo marks used in the header, footer and hero
    people/               Director portrait (480/800 px)
    editorial/            Pre-sized WebP photographs, <name>-<width>.webp
  components/             Header, Footer, ContactForm, Picture, PageHero, …
  data/business.ts        Business details, services, plans, FAQs, routes
  data/images.ts          Responsive image lookup (hashed URLs + real sizes)
  data/lastmod.ts         Sitemap lastmod dates from git history
  layouts/Base.astro      <head>: metadata, robots, canonical, OG, JSON-LD
  pages/                  17 indexable pages + 404 + thank-you, robots.txt, sitemap.xml
  scripts/                Client scripts (motion, form) and validation rules
  styles/                 global.css, theme.css, home.css, fonts.css
scripts/
  audit-seo.mjs           npm run audit:seo
  generate-brand-assets.mjs
tests/
  unit/                   node:test unit tests
  e2e/                    Playwright + axe browser tests
source-files/             Client originals (logo, business card, onboarding deck) — not deployed
docs/
  GOOGLE-SEARCH-CONSOLE.md  Search Console, sitemap, indexing priority, Bing and Business Profile guide
  ASSETS.md               Photography sources and licences
  DELIVERY.md             Original delivery notes (historical)
```

Images under `src/assets/images` are imported, so Astro emits them with hashed file names (immutable caching) but does not re-encode them (`passthroughImageService`). Add a new photograph as `<name>-480.webp` and `<name>-1000.webp` in `editorial/` and use `<Picture name="<name>" alt="…" />`.

## Content boundaries

No testimonials, ratings, customer numbers, founding dates or certifications are published. Business facts come from the client's onboarding deck (`source-files/client-onboarding-deck.pdf`): phone +91 8448496343, email instantchef2010@gmail.com, Instagram @instantchefs, the WorkWorm Faridabad office, the four published plan prices and the advance-payment / non-refundable-after-hire terms. Photographs are representative stock or AI-generated illustrations (see `docs/ASSETS.md`), not actual staff.
