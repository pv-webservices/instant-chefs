/** Pure, DOM-free validation rules for the contact form (unit tested). */

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 120,
  phoneDigitsMin: 10,
  phoneDigitsMax: 15,
  phoneMax: 20,
  messageMin: 10,
  messageMax: 1500,
} as const;

export type FieldName = 'name' | 'email' | 'phone' | 'message' | 'consent';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const PHONE_ALLOWED = /^\+?[\d\s()-]+$/;

/** Digits only, e.g. "+91 84484-96343" -> "918448496343". */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateName(value: string): string {
  const name = value.trim();
  if (!name) return 'Please enter your name.';
  if (name.length < LIMITS.nameMin)
    return `Your name must be at least ${LIMITS.nameMin} characters.`;
  if (name.length > LIMITS.nameMax)
    return `Your name must be ${LIMITS.nameMax} characters or fewer.`;
  return '';
}

export function validateEmail(value: string): string {
  const email = value.trim();
  if (!email) return 'Please enter your email address.';
  if (email.length > LIMITS.emailMax)
    return `Your email must be ${LIMITS.emailMax} characters or fewer.`;
  if (!EMAIL_PATTERN.test(email))
    return 'Enter a valid email address, like name@example.com.';
  return '';
}

export function validatePhone(value: string): string {
  const phone = value.trim();
  if (!phone) return 'Please enter your phone number.';
  const digits = phoneDigits(phone);
  if (
    phone.length > LIMITS.phoneMax ||
    !PHONE_ALLOWED.test(phone) ||
    digits.length < LIMITS.phoneDigitsMin ||
    digits.length > LIMITS.phoneDigitsMax
  )
    return 'Enter a phone number with 10–15 digits, e.g. +91 84484 96343.';
  return '';
}

export function validateMessage(value: string): string {
  const message = value.trim();
  if (!message) return 'Please tell us about your requirement.';
  if (message.length < LIMITS.messageMin)
    return `Please add a little more detail (at least ${LIMITS.messageMin} characters).`;
  if (message.length > LIMITS.messageMax)
    return `Your message must be ${LIMITS.messageMax} characters or fewer.`;
  return '';
}

export function validateConsent(checked: boolean): string {
  return checked
    ? ''
    : 'Please confirm you agree to the privacy policy so we can reply.';
}

export function validateField(
  field: FieldName,
  value: string,
  checked = false,
): string {
  switch (field) {
    case 'name':
      return validateName(value);
    case 'email':
      return validateEmail(value);
    case 'phone':
      return validatePhone(value);
    case 'message':
      return validateMessage(value);
    case 'consent':
      return validateConsent(checked);
  }
}

/** Builds the pre-filled WhatsApp text from the visitor's form entries. */
export function buildWhatsAppMessage(entries: [string, string][]): string {
  const lines = [
    'Hi Instant Chefs! I would like to discuss a staffing requirement.',
    '',
  ];
  for (const [label, raw] of entries) {
    const value = raw.trim();
    if (value) lines.push(`${label}: ${value}`);
  }
  return lines.join('\n');
}
