import { business, services, cuisines, plans } from '../data/business';
import {
  buildWhatsAppMessage,
  validateField,
  type FieldName,
} from './form-validation';

type ValidatedControl = HTMLInputElement | HTMLTextAreaElement;

/** Preselects options from validated query parameters (plan, service, cuisine). */
function applyPrefill(form: HTMLFormElement): void {
  const params = new URLSearchParams(window.location.search);
  const select = (id: string) => form.querySelector<HTMLSelectElement>(id)!;
  const plan = plans.find((p) => p.id === params.get('plan'));
  const service = services.find((s) => s.slug === params.get('service'));
  const cuisine = cuisines.find((c) => c.name === params.get('cuisine'));
  if (plan) {
    const option = select('#selected-plan').querySelector<HTMLOptionElement>(
      `option[data-plan="${plan.id}"]`,
    );
    if (option) option.selected = true;
    const home = plan.id.startsWith('home');
    if (home) select('#business-type').value = 'Homes';
    select('#staff-requirement').value = home
      ? 'Full-time live-in home cook'
      : 'Chef';
  }
  if (service) {
    select('#business-type').value = service.name;
    const staff: Record<string, string> = {
      'home-cook': 'Full-time live-in home cook',
      'bakery-staff': 'Bakery staff',
      'domestic-staff': '',
    };
    select('#staff-requirement').value = staff[service.slug] ?? 'Chef';
  }
  if (cuisine) select('#cuisine').value = cuisine.name;
  const message = form.querySelector<HTMLTextAreaElement>('#message')!;
  if (params.get('consultation') === 'free' && !message.value)
    message.value =
      'I would like a free consultation about my staffing requirement.';
}

function errorElement(control: ValidatedControl): HTMLElement {
  return document.getElementById(`${control.id}-error`)!;
}

/** Validates one control and shows or clears its inline error. */
function checkControl(control: ValidatedControl): boolean {
  const field = control.dataset.validate as FieldName;
  const checked = control instanceof HTMLInputElement && control.checked;
  const message = validateField(field, control.value, checked);
  const error = errorElement(control);
  error.textContent = message;
  error.hidden = !message;
  if (message) control.setAttribute('aria-invalid', 'true');
  else control.removeAttribute('aria-invalid');
  return !message;
}

function setSubmitting(button: HTMLButtonElement, submitting: boolean): void {
  button.disabled = submitting;
  button.toggleAttribute('aria-busy', submitting);
  const label = button.querySelector<HTMLElement>('[data-label]');
  if (label) label.textContent = submitting ? 'Sending…' : 'Send enquiry';
}

export function initEnquiryForm(): void {
  const form = document.querySelector<HTMLFormElement>('#enquiry-form');
  if (!form) return;
  // JavaScript takes over validation; without it, native HTML validation applies.
  form.noValidate = true;
  applyPrefill(form);

  const controls = Array.from(
    form.querySelectorAll<ValidatedControl>('[data-validate]'),
  );
  const submit = form.querySelector<HTMLButtonElement>('#enquiry-submit')!;
  const summary = form.querySelector<HTMLElement>('#form-summary')!;

  for (const control of controls) {
    // Validate once the visitor leaves a field, then live while they fix it.
    // Skip when focus moves to a form button: an error appearing mid-click
    // shifts the layout and the click is lost. Submit validates anyway.
    control.addEventListener('blur', (event) => {
      const next = (event as FocusEvent).relatedTarget;
      if (next instanceof HTMLButtonElement && form.contains(next)) return;
      if (control.value || control.hasAttribute('aria-invalid'))
        checkControl(control);
    });
    const live = () => {
      if (control.hasAttribute('aria-invalid')) checkControl(control);
    };
    control.addEventListener('input', live);
    control.addEventListener('change', live);
  }

  form.addEventListener('submit', (event) => {
    const invalid = controls.filter((control) => !checkControl(control));
    if (invalid.length) {
      event.preventDefault();
      summary.textContent =
        invalid.length === 1
          ? 'Please fix the highlighted field before sending.'
          : `Please fix the ${invalid.length} highlighted fields before sending.`;
      summary.hidden = false;
      invalid[0].focus();
      return;
    }
    summary.hidden = true;
    // Prevent duplicate submissions while FormSubmit processes the request.
    setSubmitting(submit, true);
  });

  // Restore the button when the page is shown again from the back/forward cache.
  window.addEventListener('pageshow', () => setSubmitting(submit, false));

  const whatsapp = form.querySelector<HTMLButtonElement>('#send-whatsapp');
  if (whatsapp) {
    whatsapp.hidden = false;
    whatsapp.addEventListener('click', () => {
      const required = controls.filter((control) =>
        ['name', 'phone', 'message'].includes(control.dataset.validate!),
      );
      const invalid = required.filter((control) => !checkControl(control));
      if (invalid.length) {
        summary.textContent =
          'Please add your name, phone and message to send via WhatsApp.';
        summary.hidden = false;
        invalid[0].focus();
        return;
      }
      summary.hidden = true;
      const data = new FormData(form);
      const text = buildWhatsAppMessage(
        (
          [
            ['Name', 'name'],
            ['Phone', 'phone'],
            ['Email', 'email'],
            ['Location', 'location'],
            ['Business / household', 'business_type'],
            ['Staff requirement', 'staff_requirement'],
            ['Cuisine', 'cuisine'],
            ['Hiring plan', 'plan'],
            ['Experience', 'experience'],
            ['Salary range', 'salary_range'],
            ['Message', 'message'],
          ] as const
        ).map(([label, key]): [string, string] => [
          label,
          String(data.get(key) ?? ''),
        ]),
      );
      window.open(
        `${business.whatsapp}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener',
      );
    });
  }
}
