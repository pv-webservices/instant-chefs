async function verifyViewportMatrix(page) {
  const pages = [
    '/',
    '/about/',
    '/services/',
    '/services/restaurant-chef-hiring/',
    '/services/cafe-staffing/',
    '/services/cloud-kitchen-chefs/',
    '/services/bakery-staff/',
    '/services/catering-staff/',
    '/services/home-cook/',
    '/services/domestic-staff/',
    '/cuisines/',
    '/how-it-works/',
    '/plans/',
    '/faq/',
    '/contact/',
    '/privacy-policy/',
    '/terms/',
  ];
  const widths = [320, 375, 430, 768, 1024, 1280, 1440, 1920];
  const failures = [],
    consoleErrors = [],
    titles = [],
    internalLinks = new Set();
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of pages) {
    const response = await page.goto('http://localhost:4322' + path);
    if (response.status() !== 200)
      failures.push({ path, status: response.status() });
    titles.push(await page.title());
    const content = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      meta: document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
      canonical: document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
      links: Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href'))
        .filter((h) => h.startsWith('/') && !h.startsWith('//')),
      images: Array.from(document.images)
        .filter((img) => !img.hasAttribute('alt'))
        .map((img) => img.src),
      schemas: Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      ).map((s) => JSON.parse(s.textContent)),
    }));
    if (
      content.h1 !== 1 ||
      !content.meta ||
      !content.canonical ||
      content.images.length
    )
      failures.push({ path, content });
    content.links.forEach((link) =>
      internalLinks.add(link.split('?')[0].split('#')[0]),
    );
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(35);
      const overflow = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        body: document.body.scrollWidth,
        html: document.documentElement.scrollWidth,
      }));
      if (Math.max(overflow.body, overflow.html) > overflow.viewport + 1)
        failures.push({ path, width, overflow });
    }
  }
  for (const path of internalLinks) {
    const response = await page.request.get('http://localhost:4322' + path);
    if (response.status() !== 200)
      failures.push({ link: path, status: response.status() });
  }
  return {
    pages: pages.length,
    widths,
    viewportChecks: pages.length * widths.length,
    uniqueTitles: new Set(titles).size,
    internalLinks: internalLinks.size,
    consoleErrors,
    failures,
  };
}
