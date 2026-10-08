import { expect, test, type Page } from '@playwright/test';

// Real FormSubmit / WhatsApp traffic is never sent: every request to those
// hosts is intercepted and answered locally.
const FORMSUBMIT = 'https://formsubmit.co/instantchef2010@gmail.com';

interface CapturedRequest {
  url: string;
  method: string;
  body: string;
}

async function blockExternal(page: Page): Promise<CapturedRequest[]> {
  const captured: CapturedRequest[] = [];
  await page
    .context()
    .route(/formsubmit\.co|wa\.me|whatsapp\.com/, async (route) => {
      const request = route.request();
      captured.push({
        url: request.url(),
        method: request.method(),
        body: request.postData() ?? '',
      });
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<h1>Intercepted</h1>',
      });
    });
  return captured;
}

async function fillValid(page: Page): Promise<void> {
  await page.locator('#full-name').fill('Test Person');
  await page.locator('#email-address').fill('test@example.com');
  await page.locator('#mobile-number').fill('+91 98765 43210');
  await page
    .locator('#message')
    .fill('Automated test: looking for a tandoor chef.');
  await page.getByLabel(/I agree to the/).check();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/contact/');
});

test('form posts to FormSubmit with the required fields and hidden config', async ({
  page,
}) => {
  const form = page.locator('#enquiry-form');
  await expect(form).toHaveAttribute('action', FORMSUBMIT);
  await expect(form).toHaveAttribute('method', 'POST');
  for (const name of ['name', 'email', 'phone', 'message', 'consent'])
    await expect(form.locator(`[name="${name}"]`)).toHaveAttribute(
      'required',
      '',
    );
  await expect(form.locator('input[name="_honey"]')).toBeHidden();
  await expect(form.locator('input[name="_subject"]')).toHaveValue(
    'New Website Enquiry - Instant Chefs',
  );
  await expect(form.locator('input[name="_template"]')).toHaveValue('table');
  await expect(
    form.getByRole('link', { name: 'privacy policy' }),
  ).toHaveAttribute('href', '/privacy-policy/');
});

test('empty submit shows accessible inline errors and focuses the first field', async ({
  page,
}) => {
  const captured = await blockExternal(page);
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.locator('#form-summary')).toHaveText(
    /fix the 5 highlighted fields/,
  );
  await expect(page.locator('#full-name')).toBeFocused();
  const expectations: [string, RegExp][] = [
    ['full-name', /enter your name/],
    ['email-address', /enter your email/],
    ['mobile-number', /enter your phone/],
    ['message', /tell us about your requirement/],
    ['consent', /privacy policy/],
  ];
  for (const [id, error] of expectations) {
    const field = page.locator(`#${id}`);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAttribute(
      'aria-describedby',
      new RegExp(`${id}-error`),
    );
    await expect(page.locator(`#${id}-error`)).toHaveText(error);
  }
  expect(captured).toEqual([]);
});

test('invalid email and phone are rejected while entered data is preserved', async ({
  page,
}) => {
  const captured = await blockExternal(page);
  await fillValid(page);
  await page.locator('#email-address').fill('not-an-email');
  await page.locator('#mobile-number').fill('12345');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.locator('#email-address-error')).toHaveText(/valid email/);
  await expect(page.locator('#mobile-number-error')).toHaveText(/10–15 digits/);
  await expect(page.locator('#email-address')).toBeFocused();
  await expect(page.locator('#full-name')).toHaveValue('Test Person');
  await expect(page.locator('#message')).toHaveValue(/tandoor chef/);
  // Fixing a field clears its error live.
  await page.locator('#email-address').fill('test@example.com');
  await expect(page.locator('#email-address-error')).toBeHidden();
  await expect(page.locator('#email-address')).not.toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(captured).toEqual([]);
});

test('valid submission POSTs once to FormSubmit (intercepted)', async ({
  page,
}) => {
  const captured = await blockExternal(page);
  await fillValid(page);
  await page.getByLabel('Hiring plan').selectOption({ index: 2 });
  await Promise.all([
    page.waitForURL(/formsubmit\.co/),
    page.locator('#enquiry-submit').click(),
  ]);
  expect(captured).toHaveLength(1);
  expect(captured[0].method).toBe('POST');
  expect(captured[0].url).toBe(FORMSUBMIT);
  const body = new URLSearchParams(captured[0].body);
  expect(body.get('name')).toBe('Test Person');
  expect(body.get('email')).toBe('test@example.com');
  expect(body.get('phone')).toBe('+91 98765 43210');
  expect(body.get('consent')).toBe('Agreed to the privacy policy');
  expect(body.get('_honey')).toBe('');
  expect(body.get('_subject')).toBe('New Website Enquiry - Instant Chefs');
  expect(body.get('plan')).toMatch(/months · ₹/);
});

test('submit button is disabled during submission and restored on pageshow', async ({
  page,
}) => {
  const captured = await blockExternal(page);
  await fillValid(page);
  // Cancel the navigation after the site's own submit handler has run, so the
  // in-flight state can be observed without leaving the page.
  await page.evaluate(() =>
    document
      .querySelector('#enquiry-form')!
      .addEventListener('submit', (event) => event.preventDefault()),
  );
  const button = page.locator('#enquiry-submit');
  await button.click();
  expect(captured).toEqual([]);
  await expect(button).toBeDisabled();
  await expect(button).toHaveText(/Sending/);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true }),
    ),
  );
  await expect(button).toBeEnabled();
  await expect(button).toHaveText(/Send enquiry/);
});

test('WhatsApp button pre-fills a message without sending the form', async ({
  page,
}) => {
  const captured = await blockExternal(page);
  await fillValid(page);
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Send via WhatsApp' }).click(),
  ]);
  await popup.waitForURL(/wa\.me/, { waitUntil: 'commit' });
  const url = new URL(popup.url());
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/918448496343');
  expect(url.searchParams.get('text')).toMatch(
    /Name: Test Person[\s\S]*Message: Automated test/,
  );
  expect(captured.every((c) => !c.url.includes('formsubmit'))).toBe(true);
});

test('query parameters preselect validated options only', async ({ page }) => {
  await page.goto('/contact/?plan=home-12&cuisine=Tandoor');
  await expect(page.getByLabel('Hiring plan')).toHaveValue(
    /Home cook hiring · 12 months/,
  );
  await expect(page.getByLabel('Staff requirement')).toHaveValue(
    'Full-time live-in home cook',
  );
  await expect(page.getByLabel('Cuisine requirement')).toHaveValue('Tandoor');
  await page.goto('/contact/?plan=%3Cscript%3E&cuisine=Unknown');
  await expect(page.getByLabel('Hiring plan')).toHaveValue('');
  await expect(page.getByLabel('Cuisine requirement')).toHaveValue('');
});
