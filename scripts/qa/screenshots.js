async function captureScreenshots(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:4322/');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: 'output/playwright/home-full-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 850 });
  await page.screenshot({
    path: 'output/playwright/home-full-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 850 });
  await page.screenshot({ path: 'output/playwright/home-320.png' });
  await page.goto('http://localhost:4322/contact/?plan=home-12');
  await page.setViewportSize({ width: 375, height: 850 });
  await page.screenshot({
    path: 'output/playwright/contact-mobile.png',
    fullPage: true,
  });
  await page.goto('http://localhost:4322/plans/');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: 'output/playwright/plans-desktop.png',
    fullPage: true,
  });
  await page.goto('http://localhost:4322/services/restaurant-chef-hiring/');
  await page.screenshot({
    path: 'output/playwright/service-desktop.png',
    fullPage: true,
  });
  console.log('Screenshots saved in output/playwright');
}
