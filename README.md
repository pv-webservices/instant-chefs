# Instant Chefs

A complete static service-business website built with Astro, TypeScript and CSS. No accounts, application backend, database or automated form sending.

## Local development

Requires Node.js compatible with the installed Astro release (tested with Node 24).

```sh
npm ci
npm run dev
```

Open http://localhost:4321. `npm run check` checks Astro and TypeScript; `npm run build` creates the static website in `dist`; `npm run preview` serves that build locally.

`npm run verify` checks all 17 generated pages, metadata uniqueness, all internal links and image references, schema JSON, the approved prices and exclusion of the original client source files. Browser QA scripts in `scripts/qa` run against `npm run preview -- --port 4322` through Playwright CLI:

```sh
npx --yes --package @playwright/cli playwright-cli -s=instant-chefs open http://localhost:4322/ --browser chrome
npx --yes --package @playwright/cli playwright-cli -s=instant-chefs --raw run-code --filename=scripts/qa/viewport-matrix.js
npx --yes --package @playwright/cli playwright-cli -s=instant-chefs --raw run-code --filename=scripts/qa/interactions.js
```

## Domain before publishing

The final domain has not been supplied. Local builds use `http://localhost:4321`, set `noindex, nofollow` and disallow indexing in robots.txt. Set `PUBLIC_SITE_URL` to the client-approved HTTPS origin before building for publication:

```powershell
$env:PUBLIC_SITE_URL = 'https://your-approved-domain.com'
npm run build
```

Or put the real value in an untracked `.env` file for Astro. The config reads `PUBLIC_SITE_URL` with `loadEnv` so the config and page metadata agree. Canonical, Open Graph, structured data, robots and sitemap URLs all use that origin. Do not deploy a default local build. Publish the static `dist` folder with a host that serves directory index pages and the generated `404.html`. No deployment has been performed.

## Pages

Home, About, Services, seven individual service pages (restaurant, café, cloud kitchen, bakery, long-term catering, full-time live-in home cook, domestic staff), Cuisines, How it works, Plans, FAQ, Contact, Privacy and Terms: 17 business pages, plus a 404 page, sitemap and robots endpoint.

## Source content and boundaries

- Primary source: the eight-page onboarding PDF originally supplied in `public`.
- Contact source: PDF phone +91 8448496343 and email instantchef2010@gmail.com; Instagram @instantchefs.
- Office: the supplied brief's WorkWorm address, consistent with the business card's Faridabad address.
- The other numbers on the photographed business card are not used: the supplied PDF and brief identify the primary business number.
- The brief describes a homepage reference image, but no separate reference image was present. Design follows its written orange / cream / charcoal direction.
- No testimonials, ratings, placement statistics, founding dates, certifications or other unsupported claims are published.
- Chef candidate interviews use the detailed PDF process (approximately 2–3). The final summary page says 2–5; the detailed process is followed consistently, while up to five chef trials remains clearly separate.
- Domestic staff fees, verification, trials and replacement conditions are not extrapolated from chef plans.
- All four prices and advance-payment/non-refundable-after-hire conditions match PDF pages 5–6.

Client source documents and the photographed business card are retained unchanged in `public`, but excluded from `dist` by a build hook. Only the optimized version of the supplied logo is displayed on the website. Source documents are available to a local dev server; do not expose the dev server as a public website.

## Enquiry functionality

The contact form validates required fields, prepares a visible message, and offers WhatsApp and email links. The visitor reviews and sends through the chosen service. It never reports that an enquiry has been submitted. There is no API request, database or browser storage. Changing any form value hides a stale prepared message. Without JavaScript, direct call and WhatsApp links remain available.

Plan, cuisine and service links preselect validated options; arbitrary query input is ignored. To add a real form integration later, replace the delivery step in `src/scripts/enquiry.ts` and update the privacy copy and user feedback.

## Assets

- `public/website logo.jpeg`: client logo, optimized to `public/images/brand.webp` without redesigning the mark.
- `public/images/*`: local responsive WebP photographs from Unsplash (480/800 px, hero chef 600/800/1000 px). Representative photographs illustrate service settings and cuisines; they do not represent actual Instant Chefs employees or placements. No video is used.
- Exact photograph delivery URLs and IDs are recorded in `ASSETS.md`.
- Fredoka variable display, Manrope variable body and Caveat accents are self-hosted through Fontsource. See installed packages for OFL license files.

## Design and interaction

Shared layout, header/mobile menu, footer, contact CTA, picture, icon, section heading, service cards, cuisine cards, process timeline, pricing cards, accessible native FAQ accordions, breadcrumbs and enquiry form. Native IntersectionObserver drives restrained one-time scroll reveals; CSS handles hover feedback and timeline entrance. Reduced-motion users receive static content and instant scrolling. Content remains visible without JavaScript.

## Before publication

Confirm the final domain, availability/service coverage beyond the Faridabad office, taxes if applicable, domestic staff service terms, and any refund circumstances before hiring. The PDF does not specify those details. Have the business review the privacy/terms copy and its actual handling of enquiries after messages reach WhatsApp/email. Replace representative photography with approved team photographs if available. Add testimonials only when supplied and approved by real customers.

Astro configuration reference: https://docs.astro.build/en/guides/configuring-astro/
