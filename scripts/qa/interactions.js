async function verifyInteractions(page) {
  const checks = {},
    failures = [];
  function check(name, result) {
    checks[name] = Boolean(result);
    if (!result) failures.push(name);
  }
  await page.goto('http://localhost:4322/contact/?plan=home-12');
  await page.setViewportSize({ width: 375, height: 850 });
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  check(
    'mobileMenuOpens',
    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .isVisible(),
  );
  await page.keyboard.press('Shift+Tab');
  check(
    'menuFocusWrap',
    await page.evaluate(
      () =>
        document.activeElement ===
        document.querySelector('#mobile-navigation a:last-of-type'),
    ),
  );
  await page.keyboard.press('Escape');
  check(
    'escapeClosesMenu',
    !(await page.locator('#mobile-navigation').isVisible()),
  );
  check(
    'escapeReturnsFocus',
    await page
      .locator('#menu-toggle')
      .evaluate((el) => el === document.activeElement),
  );
  check(
    'homePlanPrefills',
    (await page.locator('#selected-plan').inputValue()) === 'home-12' &&
      (await page.locator('#business-type').inputValue()) === 'Homes' &&
      (await page.locator('#staff-requirement').inputValue()) ===
        'Full-time live-in home cook',
  );
  await page.getByRole('button', { name: 'Prepare my enquiry' }).click();
  check(
    'emptyFormBlocked',
    !(await page.locator('#enquiry-preview').isVisible()),
  );
  await page.getByLabel('Full name (required)').fill('Website QA');
  await page.getByLabel('Mobile number (required)').fill('bad-number');
  await page
    .getByLabel('Kitchen / home location (required)')
    .fill('Faridabad test location');
  await page.getByRole('button', { name: 'Prepare my enquiry' }).click();
  check(
    'invalidPhoneBlocked',
    !(await page.locator('#enquiry-preview').isVisible()),
  );
  await page.getByLabel('Mobile number (required)').fill('9000000000');
  await page.getByLabel('Email (optional)').fill('qa@example.com');
  await page
    .getByLabel('Anything else we should know?')
    .fill('Synthetic browser QA. <script>window.qaInjected=true</script>');
  const outgoing = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://localhost:4322'))
      outgoing.push(request.url());
  });
  await page.getByRole('button', { name: 'Prepare my enquiry' }).click();
  check(
    'preparedMessageVisible',
    await page.locator('#enquiry-preview').isVisible(),
  );
  const message = await page.locator('#enquiry-message').textContent();
  const whatsapp = new URL(
    await page.locator('#send-whatsapp').getAttribute('href'),
  );
  check(
    'correctWhatsAppDraft',
    whatsapp.origin === 'https://wa.me' &&
      whatsapp.pathname === '/918448496343' &&
      whatsapp.searchParams.get('text') === message,
  );
  check(
    'correctEmailDraft',
    (await page.locator('#send-email').getAttribute('href')).startsWith(
      'mailto:instantchef2010@gmail.com?subject=',
    ),
  );
  check('noAutomatedSending', outgoing.length === 0);
  check(
    'noFalseSuccessText',
    (await page.locator('#enquiry-status').textContent()).includes(
      'Nothing has been sent yet',
    ),
  );
  check('messageIsPlainText', await page.evaluate(() => !window.qaInjected));
  check(
    'noBrowserStorage',
    await page.evaluate(
      () => localStorage.length === 0 && sessionStorage.length === 0,
    ),
  );
  await page.getByLabel('Full name (required)').fill('Updated QA');
  check(
    'staleDraftHidden',
    !(await page.locator('#enquiry-preview').isVisible()),
  );
  await page.goto(
    'http://localhost:4322/contact/?service=bakery-staff&cuisine=Bakery',
  );
  check(
    'serviceAndCuisinePrefill',
    (await page.locator('#business-type').inputValue()) === 'Bakeries' &&
      (await page.locator('#staff-requirement').inputValue()) ===
        'Bakery staff' &&
      (await page.locator('#cuisine').inputValue()) === 'Bakery',
  );
  await page.goto(
    'http://localhost:4322/contact/?plan=%3Cscript%3E&cuisine=Unknown',
  );
  check(
    'unknownQueryIgnored',
    (await page.locator('#selected-plan').inputValue()) === '' &&
      (await page.locator('#cuisine').inputValue()) === '',
  );
  await page.goto('http://localhost:4322/faq/');
  const first = page.locator('.faq-item').first();
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  check('keyboardFAQOpens', (await first.getAttribute('open')) !== null);
  await page.keyboard.press('Enter');
  check('keyboardFAQCloses', (await first.getAttribute('open')) === null);
  await page.goto('http://localhost:4322/');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await page
    .locator('.services-section .section-heading')
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  check(
    'scrollRevealWorks',
    await page
      .locator('.services-section .section-heading')
      .evaluate(
        (el) =>
          el.classList.contains('revealed') &&
          getComputedStyle(el).opacity === '1',
      ),
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  check(
    'reducedMotionStatic',
    await page
      .locator('[data-reveal]')
      .first()
      .evaluate(
        (el) =>
          getComputedStyle(el).opacity === '1' &&
          getComputedStyle(el).transitionDuration === '0s',
      ),
  );
  const context = await page
    .context()
    .browser()
    .newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 850 },
    });
  const nojs = await context.newPage();
  await nojs.goto('http://localhost:4322/contact/');
  check(
    'noJSContactFallback',
    (await nojs.locator('.form-noscript').isVisible()) &&
      !(await nojs.locator('#enquiry-form').isVisible()),
  );
  await nojs.goto('http://localhost:4322/');
  check(
    'noJSContentVisible',
    await nojs
      .locator('.services-section .section-heading')
      .evaluate((el) => getComputedStyle(el).opacity === '1'),
  );
  await context.close();
  return { checks, failures };
}
