# Instant Chefs delivery

The requested 17-page service-business website is implemented with Astro, TypeScript and reusable components. The static build generates 18 HTML pages including the custom 404, plus sitemap and robots files. Local built-site preview: http://localhost:4322/.

## What is included

- Home, About, Services, restaurant chef hiring, café staffing, cloud kitchen chefs, bakery staff, long-term catering staff, full-time live-in home cook, domestic staff, Cuisines, How it works, Plans, FAQ, Contact, Privacy and Terms.
- Shared header/mobile navigation, footer, contact CTA, breadcrumbs, page heroes, responsive pictures, icons, section headings, service/cuisine cards, process timeline, pricing cards, FAQ accordions and enquiry form.
- Cream, warm orange and charcoal design; Fredoka headings, Manrope body text and Caveat handwritten accents. Client logo and representative local WebP photography, with sources in ASSETS.md.
- Native one-time scroll reveals, timeline entrance, restrained card/image/button hover effects, mobile navigation transitions and reduced-motion support.
- Intentional mobile layouts, vertical process timeline, stacked pricing, single-column mobile forms and a bottom contact bar with page-end clearance.
- Unique titles, descriptions, canonical/social metadata; ProfessionalService, BreadcrumbList and visible-question FAQ schema; 17-page sitemap and robots file.
- Semantic landmarks, heading hierarchy, image alternatives, visible keyboard focus, menu focus cycling/Escape, native accessible FAQ controls, labelled inputs and input validation.
- Self-hosted fonts, preloaded primary fonts, responsive/lazy images, reserved image frames and small native JavaScript. Photo recompression reduced the original downloaded photo payload by 60%; the intermediate hero size helps avoid oversized mobile downloads.

## Verification

- `npm run check`: 32 checked files, zero errors, warnings or hints. One concurrent attempt hit host memory exhaustion; the sequential rerun passed.
- `npm run build`: all 18 HTML pages built successfully.
- `npm run verify`: 17 pages, 17 unique titles, 17 unique descriptions, 785 internal links, 89 image references, 43 schema objects, 17 sitemap entries, all four approved prices and source-file exclusions checked.
- Chromium responsive matrix: 17 pages × eight widths (320, 375, 430, 768, 1024, 1280, 1440, 1920), with no document overflow, dead routes or console errors.
- Interaction checks cover navigation, menu focus/Escape, keyboard FAQ, required-field/phone validation, plan/service/cuisine prefill, encoded message links, no automated sending, no false success text, plain-text preview, no browser storage, stale-preview hiding, scroll reveals, reduced motion and JavaScript-disabled contact fallback.
- Unknown route returns HTTP 404 and the custom page.
- Browser screenshots and raw QA evidence are retained under `output/playwright`; reproducible route/viewport and interaction scripts are in `scripts/qa`.
- Full-page accessibility audit: all 17 pages, zero detected violations and zero broken images. Reduced motion keeps all content visible during the audit. Evidence: `output/playwright/accessibility-final.json`.

## Performance and dependency limits

Lighthouse produced reports under `output/lighthouse`. The latest run recorded accessibility 100, best practices 100, performance 69 and SEO 69. Its observed metrics include LCP 2.5 seconds, CLS 0.004 and TBT 1.8 seconds. An earlier performance score was 82. The machine had approximately 0.5 GB free physical memory, and Lighthouse exited with a Windows temporary-directory cleanup EPERM after saving the reports. A dependable performance score or a 90+ result is not established; repeat on a less-loaded machine or the final static host. Real-user Core Web Vitals have not been measured.

SEO indexing is intentionally disabled until the final HTTPS domain is set. All other automated Lighthouse SEO checks passed. See README.md for `PUBLIC_SITE_URL` setup before publication.

`npm audit` reports two high-severity entries: `http-cache-semantics` and its parent Astro dependency, associated with GHSA-ch52-4w7c-c8xp. Astro was updated to 7.3.5, removing the earlier critical/other advisories. The latest available `http-cache-semantics` version in the registry was 4.2.0, still affected; no patched release was available during this run. No forced downgrade or unreviewed dependency patch was applied. This website publishes static files and has no runtime server/application cache; the warning remains in the build-tool dependency tree and should be reviewed before publication.

## Contact functionality

Call, WhatsApp, email, Instagram and maps links use the supplied business details. The validated form prepares a visible draft and offers WhatsApp/email links. Visitors review and send through their chosen service. It does not submit to a backend, store enquiries or claim successful delivery. No external message was sent during testing.

## Client confirmations before publication

The final domain; coverage/availability beyond the Faridabad office; any applicable taxes; domestic staff fees/assessment/replacement terms; refund circumstances before a hire; and business approval of policy copy and actual handling of received messages.

No separate homepage reference image or real testimonials were supplied. The design follows the written brief; no customer statistics, ratings or testimonials were invented. Photographs are representative stock, not claims about actual staff. Original PDF/card/logo files are preserved locally and excluded from published output; only the optimized client logo is displayed.

The PDF’s detailed process says approximately 2–3 interview candidates, while its final summary says 2–5. The website follows the detailed process consistently and distinguishes it from the separate allowance of up to five chef trials.

No deployment was performed.
