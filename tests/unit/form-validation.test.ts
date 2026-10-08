import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppMessage,
  phoneDigits,
  validateConsent,
  validateEmail,
  validateField,
  validateMessage,
  validateName,
  validatePhone,
} from '../../src/scripts/form-validation.ts';

test('name is required and length-limited', () => {
  assert.match(validateName(''), /enter your name/);
  assert.match(validateName('   '), /enter your name/);
  assert.match(validateName('A'), /at least 2/);
  assert.match(validateName('x'.repeat(81)), /80 characters/);
  assert.equal(validateName('Priya Sharma'), '');
});

test('email must be present and well formed', () => {
  assert.match(validateEmail(''), /enter your email/);
  for (const bad of ['name', 'name@', 'name@site', 'a b@site.com', '@site.com'])
    assert.match(validateEmail(bad), /valid email/, bad);
  assert.match(validateEmail(`${'a'.repeat(115)}@x.com`), /120 characters/);
  assert.equal(validateEmail('owner@restaurant.co.in'), '');
});

test('phone accepts 10–15 digits with common separators', () => {
  assert.equal(phoneDigits('+91 84484-96343'), '918448496343');
  assert.equal(validatePhone('8448496343'), '');
  assert.equal(validatePhone('+91 84484 96343'), '');
  assert.equal(validatePhone('(011) 2345-6789'), '');
  assert.match(validatePhone(''), /enter your phone/);
  assert.match(validatePhone('12345'), /10–15 digits/);
  assert.match(validatePhone('1234567890123456'), /10–15 digits/);
  assert.match(validatePhone('98765abc43210'), /10–15 digits/);
});

test('message needs a useful amount of detail', () => {
  assert.match(validateMessage(''), /tell us/);
  assert.match(validateMessage('Hi'), /at least 10/);
  assert.match(validateMessage('x'.repeat(1501)), /1500 characters/);
  assert.equal(validateMessage('Need a tandoor chef for my restaurant.'), '');
});

test('consent must be given', () => {
  assert.match(validateConsent(false), /privacy policy/);
  assert.equal(validateConsent(true), '');
  assert.equal(validateField('consent', 'on', true), '');
});

test('WhatsApp message lists only filled fields', () => {
  const text = buildWhatsAppMessage([
    ['Name', 'Priya'],
    ['Email', '  '],
    ['Message', ' Need a chef '],
  ]);
  assert.equal(
    text,
    'Hi Instant Chefs! I would like to discuss a staffing requirement.\n\nName: Priya\nMessage: Need a chef',
  );
});
