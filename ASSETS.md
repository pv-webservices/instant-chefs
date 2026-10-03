# Photography sources

Images are delivered locally as optimized WebP in responsive sizes (two per photograph, three for the hero chef). These are representative stock photographs, not staff portraits or customer evidence. The supplied logo is the actual client brand asset. Unsplash license reference: https://unsplash.com/license

| Asset        | Original delivery source                                     |
| ------------ | ------------------------------------------------------------ |
| chef         | https://images.unsplash.com/photo-1577219491135-ce391730fb2c |
| restaurant   | https://images.unsplash.com/photo-1552566626-52f8b828add9    |
| cafe         | https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb |
| kitchen      | https://images.unsplash.com/photo-1551218808-94e220e084d2    |
| chef-action  | https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf |
| bakery       | https://images.unsplash.com/photo-1509440159596-0249088772ff |
| catering     | https://images.unsplash.com/photo-1555244162-803834f70033    |
| home         | https://images.unsplash.com/photo-1556911220-bff31c812dba    |
| indian       | https://images.unsplash.com/photo-1565557623262-b51c2513a641 |
| chinese      | https://images.unsplash.com/photo-1512058564366-18510be2db19 |
| tandoor      | https://images.unsplash.com/photo-1599487488170-d11ec9c172f0 |
| south-indian | https://images.unsplash.com/photo-1630383249896-424e482df921 |
| continental  | https://images.unsplash.com/photo-1547592180-85f173990554    |

Optimization query: `?auto=format&fit=crop&w=WIDTH&q=80&fm=webp`.

Photographs are then locally recompressed with Sharp to WebP quality 68. The client logo retains quality 90.

# AI-generated photography (2026 redesign)

Ten images were generated with Google Gemini `gemini-3.1-flash-lite-image` (Nano Banana 2 Lite) at 1K resolution, then converted with Sharp to WebP quality 72 at 480 px and 1000 px widths. They are illustrative, not photographs of real Instant Chefs staff or clients. Prompts are in `.work/generate-images.mjs` (run with `node --env-file=.env .work/generate-images.mjs [name]`).

| Asset         | Used for                                          |
| ------------- | ------------------------------------------------- |
| hero-chef     | Homepage hero (cut-out `hero-chef-cut-*.webp` made by `.work/cutout.mjs`) |
| chef-portrait | Homepage "Why choose us" sticky photo, Plans hero |
| chef-cta      | Contact CTA banner, Contact hero                  |
| hero-kitchen  | Homepage hero backdrop, gallery, Services hero    |
| domestic      | Domestic staff service                            |
| home-cook     | Home cook service, gallery                        |
| team          | About hero, gallery                               |
| trial         | Gallery, homepage FAQ, How it works and FAQ heroes |
| more-cuisines | "& More" cuisine slide, Cuisines hero             |
| spices        | Decorative homepage impact section                |

Logo derivatives from `public/website logo.jpeg`: `logo-mark-128/256.webp` (square crop for header, footer, favicon) and `logo-hero-480/720.webp` (homepage hero).
