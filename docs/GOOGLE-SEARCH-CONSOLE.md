# Google Search Console guide — Instant Chefs

Production site: **https://instantchefs.in/** (Netlify, deployed automatically from GitHub `main`).

- Preferred hostname: `https://instantchefs.in` (no `www`). `http://`, `www.` and `instant-chefs.netlify.app` all 301-redirect to it.
- Sitemap: **https://instantchefs.in/sitemap.xml**
- robots.txt: **https://instantchefs.in/robots.txt**

This project makes no domain, DNS or nameserver changes. Any DNS step below is for you or the domain owner to perform.

---

## 1. Launch checks (after each production deploy)

Open each URL in a normal browser window once Netlify shows the deploy as **Published**.

| Check | URL | Expected |
| --- | --- | --- |
| Site loads over HTTPS | https://instantchefs.in/ | Home page, padlock, no certificate warning |
| HTTP → HTTPS | http://instantchefs.in/ | Redirects to `https://instantchefs.in/` |
| www → apex | https://www.instantchefs.in/ | Redirects to `https://instantchefs.in/` |
| Netlify subdomain | https://instant-chefs.netlify.app/ | Redirects to `https://instantchefs.in/` |
| robots.txt | https://instantchefs.in/robots.txt | `Allow: /` and `Sitemap: https://instantchefs.in/sitemap.xml`. If it says `Disallow: /`, the deploy was not a production build — see §9 |
| Sitemap | https://instantchefs.in/sitemap.xml | 17 `<url>` entries, all `https://instantchefs.in/…` |
| Genuine 404 | https://instantchefs.in/this-does-not-exist/ | Branded "Let's get you back" page; DevTools → Network shows status **404** |
| Thank You page | https://instantchefs.in/thank-you/ | Loads (status 200); view source shows `noindex, follow` and **no** canonical |
| Favicon | https://instantchefs.in/favicon.ico | Instant Chefs icon |
| Indexable pages | View source (Ctrl+U) of any page | `<meta name="robots" content="index, follow, max-image-preview:large">` and `<link rel="canonical" href="https://instantchefs.in/…/">` matching the address bar |

Optional: [Rich Results Test](https://search.google.com/test/rich-results) on the home page and `/faq/`, and [PageSpeed Insights](https://pagespeed.web.dev/) on the home page (Mobile).

## 2. Add the Search Console property

1. Go to https://search.google.com/search-console and sign in with the Google account that should own the property (ideally the business account, instantchef2010@gmail.com, so the client keeps ownership).
2. Click **Add property**. Choose one:

**Option A — Domain property `instantchefs.in` (recommended)**

Covers `https://`, `http://`, `www` and any subdomain in one property.

1. Enter `instantchefs.in` (no `https://`, no `www`) under **Domain** and continue.
2. Google shows a **TXT record** such as `google-site-verification=AbC123…`. Copy it.
3. At the DNS provider for `instantchefs.in` (wherever the domain's nameservers point — check in Netlify under **Domain management** if Netlify DNS is used, otherwise the registrar's DNS panel), add a record:
   - Type: `TXT`
   - Name/Host: `@` (the root domain)
   - Value: the full `google-site-verification=…` string
   - TTL: default
4. Back in Search Console click **Verify**. DNS changes can take from minutes up to 24–48 hours; if verification fails, wait and try again. Leave the TXT record in place permanently.

This is a DNS change: it is not done by this project and needs your (or the domain owner's) action.

**Option B — URL-prefix property `https://instantchefs.in/` (no DNS change)**

1. Enter exactly `https://instantchefs.in/` under **URL prefix**.
2. Verify with the **HTML tag** method:
   1. Copy only the `content` value from `<meta name="google-site-verification" content="AbC123…">`.
   2. In Netlify: **Site configuration → Environment variables → Add a variable**: key `PUBLIC_GOOGLE_SITE_VERIFICATION`, value = the copied code.
   3. **Deploys → Trigger deploy → Deploy site.** When published, view the home page source and confirm the `google-site-verification` meta tag is present.
   4. Click **Verify** in Search Console. Keep the variable permanently; removing it un-verifies the property.
3. Alternative: **HTML file** — put the downloaded `googleXXXXXXXX.html` in the repository's `public/` folder, commit and push, confirm it opens at `https://instantchefs.in/googleXXXXXXXX.html`, then click **Verify**. Do not delete the file afterwards.

If a property for `https://instant-chefs.netlify.app/` was created earlier, it can be left alone or removed; that address now redirects to `https://instantchefs.in/`.

## 3. Submit the sitemap

Sitemap URL: **https://instantchefs.in/sitemap.xml**

1. Open Google Search Console.
2. Select the **instantchefs.in** property (top-left property picker).
3. In the left menu open **Indexing → Sitemaps**.
4. Under "Add a new sitemap" enter the sitemap. For a URL-prefix property type `sitemap.xml` (the field is prefixed with `https://instantchefs.in/`); for a Domain property paste the full `https://instantchefs.in/sitemap.xml`.
5. Click **Submit**.
6. Monitor the "Submitted sitemaps" table: status should become **Success** with **17 discovered pages**.

Notes:

- Processing can take from a few hours to several days.
- **"Couldn't fetch"** sometimes appears temporarily on a new property. Open the sitemap URL in a browser; if it loads, wait 24–48 hours and resubmit once.
- Opening the sitemap in a browser may show "This XML file does not appear to have any style information associated with it." That is normal for sitemaps and is not an error.

## 4. URL Inspection and indexing requests

Paste a full URL into the **URL Inspection** bar at the top of Search Console.

- **Test live URL** fetches the current page and confirms it is indexable.
- **Request indexing** queues the URL for crawling. There is a daily quota (roughly 10–12 requests per property), so use it for priority pages only; repeating a request does not speed it up.
- Google decides what and when to index. A new domain typically takes days to weeks.

### Highest priority (request on day 1, in this order)

1. https://instantchefs.in/
2. https://instantchefs.in/services/
3. https://instantchefs.in/plans/
4. https://instantchefs.in/services/restaurant-chef-hiring/
5. https://instantchefs.in/services/home-cook/
6. https://instantchefs.in/services/cloud-kitchen-chefs/
7. https://instantchefs.in/services/cafe-staffing/
8. https://instantchefs.in/services/bakery-staff/
9. https://instantchefs.in/services/catering-staff/
10. https://instantchefs.in/services/domestic-staff/

### Medium priority (day 2)

- https://instantchefs.in/contact/
- https://instantchefs.in/about/
- https://instantchefs.in/how-it-works/
- https://instantchefs.in/cuisines/
- https://instantchefs.in/faq/

### Content priority

The site has no blog or article pages. Nothing further to request.

### Indexable, no manual request needed (sitemap covers them)

- https://instantchefs.in/privacy-policy/
- https://instantchefs.in/terms/

### Do not index / do not request indexing

- `https://instantchefs.in/thank-you/` — `noindex, follow`; shown only after the contact form is sent
- Any 404 URL (e.g. a mistyped address) — `noindex, follow`, HTTP 404
- Deploy-preview / branch-deploy URLs (`…--instant-chefs.netlify.app`) — built as `noindex, nofollow`

## 5. Monitoring (weeks 1–4)

- **Indexing → Pages**: indexed count should trend towards 17. Expected under "Why pages aren't indexed": `/thank-you/` ("Excluded by 'noindex' tag") and "Page with redirect" for `http://`/`www` variants. Investigate "Server error", "Redirect error" or "Not found (404)" for any URL that should exist.
- **Enhancements / Shopping & structured data** (appear once pages are processed): check **Breadcrumbs** and **FAQ** for errors. Google shows FAQ rich results only for a limited set of sites, so valid FAQ markup may not be displayed — that is expected.
- **Core Web Vitals**: "Not enough usage data" is normal for a new site.
- **Performance**: first queries and impressions usually appear after a couple of weeks.
- **Favicon in results**: Google refreshes favicons on its own schedule; it can take days to weeks.

## 6. Google Business Profile (manual recommendation)

The business has a public office address (WorkWorm co-working space, Sector 32, Faridabad) and phone number, so it can qualify for a Google Business Profile. This project has not created or verified one.

If you create or claim it at https://business.google.com/, use exactly the details shown on the website:

- Name: **Instant Chefs**
- Phone: **+91 8448496343**
- Address: **WorkWorm co-working space, Metro Station Pillar No. 539, 13B, near NHPC Chowk, Block A, DLF Industrial Area, Sector 32, Faridabad, Haryana 121003**
- Website: **https://instantchefs.in/**

Google verifies the profile with the business owner (video, phone, postcard, etc.). Note that Google's guidelines for co-working addresses require staffed presence during business hours; confirm this applies before listing the address, or set it up as a service-area business that hides the address.

## 7. Bing Webmaster Tools (optional)

1. Go to https://www.bing.com/webmasters and sign in.
2. Fastest: **Import from Google Search Console** once the Google property is verified; it copies the site and sitemap.
3. Or **Add a site** manually: enter `https://instantchefs.in/`, verify (Bing offers a DNS CNAME, an XML file in `public/`, or a meta tag), then open **Sitemaps → Submit sitemap** and enter `https://instantchefs.in/sitemap.xml`.

This project has not created or changed any Bing account.

## 8. Contact form check (FormSubmit)

Before relying on the form, FormSubmit activation must be completed once by the inbox owner — see the README section "Contact form (FormSubmit)".

## 9. Troubleshooting

- **robots.txt says `Disallow: /` or pages say `noindex, nofollow` on production:** the build did not run as a Netlify *production* deploy (`CONTEXT=production`). Check in Netlify that the latest deploy of `main` is a production deploy. The production origin `https://instantchefs.in` is set in `astro.config.mjs`.
- **Canonical or sitemap shows another domain:** check `PRODUCTION_SITE` in `astro.config.mjs` and that no `PUBLIC_SITE_URL` override is set in Netlify environment variables.
- **Sitemap "Couldn't fetch":** open the sitemap URL directly; if it loads, wait 24–48 hours and resubmit once.
