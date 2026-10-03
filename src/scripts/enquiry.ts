import { business, services, cuisines, plans } from '../data/business';

/** Prepare a user-reviewed message; no requests, storage or automated sending. */
export function initEnquiryForm() {
  const form = document.querySelector<HTMLFormElement>('#enquiry-form');
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  const plan = plans.find((p) => p.id === params.get('plan'));
  const service = services.find((s) => s.slug === params.get('service'));
  const cuisine = cuisines.find((c) => c.name === params.get('cuisine'));
  const planField = form.querySelector<HTMLSelectElement>('#selected-plan')!;
  const typeField = form.querySelector<HTMLSelectElement>('#business-type')!;
  const staffField =
    form.querySelector<HTMLSelectElement>('#staff-requirement')!;
  if (plan) {
    planField.value = plan.id;
    if (plan.id.startsWith('home')) {
      typeField.value = 'Homes';
      staffField.value = 'Full-time live-in home cook';
    } else staffField.value = 'Chef';
  }
  if (service) {
    typeField.value = service.name;
    staffField.value =
      service.slug === 'home-cook'
        ? 'Full-time live-in home cook'
        : service.slug === 'bakery-staff'
          ? 'Bakery staff'
          : service.slug === 'domestic-staff'
            ? ''
            : 'Chef';
  }
  if (cuisine)
    form.querySelector<HTMLSelectElement>('#cuisine')!.value = cuisine.name;
  if (params.get('consultation') === 'free')
    form.querySelector<HTMLTextAreaElement>('#message')!.value =
      'I would like a free consultation about my staffing requirement.';
  const mobile = form.querySelector<HTMLInputElement>('#mobile-number')!;
  const fullName = form.querySelector<HTMLInputElement>('#full-name')!;
  const location = form.querySelector<HTMLInputElement>('#location')!;
  function validate() {
    const number = mobile.value.replace(/[\s()+-]/g, '');
    mobile.setCustomValidity(
      /^\d{10,15}$/.test(number)
        ? ''
        : 'Enter a mobile number with 10–15 digits, including your country code if needed.',
    );
    fullName.setCustomValidity(
      fullName.value.trim().length >= 2 ? '' : 'Please enter your name.',
    );
    location.setCustomValidity(
      location.value.trim().length >= 2
        ? ''
        : 'Please enter your city and area.',
    );
  }
  form.addEventListener('input', validate);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    validate();
    if (!form.reportValidity()) return;
    const lines: string[] = [
      'Hi Instant Chefs! I would like to discuss a staffing requirement.',
      '',
    ];
    new FormData(form).forEach((raw, name) => {
      let value = String(raw).trim();
      if (name === 'Hiring plan' && value) {
        const chosen = plans.find((p) => p.id === value);
        value = chosen
          ? `${chosen.name}, ${chosen.months} months, ₹${chosen.fee.toLocaleString('en-IN')} one-time service fee`
          : '';
      }
      if (value) lines.push(`${name}: ${value}`);
    });
    const message = lines.join('\n');
    form.querySelector<HTMLElement>('#enquiry-message')!.textContent = message;
    form.querySelector<HTMLAnchorElement>('#send-whatsapp')!.href =
      `${business.whatsapp}?text=${encodeURIComponent(message)}`;
    form.querySelector<HTMLAnchorElement>('#send-email')!.href =
      `mailto:${business.email}?subject=${encodeURIComponent('Staffing enquiry — Instant Chefs')}&body=${encodeURIComponent(message)}`;
    const preview = form.querySelector<HTMLElement>('#enquiry-preview')!;
    preview.hidden = false;
    preview.focus();
    preview.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'center',
    });
  });
  // Clear the preview if the visitor changes a field, so stale details cannot be sent.
  form.addEventListener('input', () => {
    form.querySelector<HTMLElement>('#enquiry-preview')!.hidden = true;
  });
}
