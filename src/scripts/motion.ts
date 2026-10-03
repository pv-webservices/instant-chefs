// Progressive-enhancement motion: scroll reveals, parallax, counters,
// the pinned horizontal gallery and the client slider. Content stays fully
// visible and usable without JavaScript or with reduced motion.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersStatic = reducedMotion.matches;

// Makes :active styles fire on iOS so cards respond to touch.
document.addEventListener('touchstart', () => {}, { passive: true });

function initReveals(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (prefersStatic || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  targets.forEach((element) => {
    element.classList.add('reveal-ready');
    observer.observe(element);
  });
}

const COUNT_DURATION_MS = 1400;
const MIN_COUNT_TARGET = 10;

function animateCount(element: HTMLElement): void {
  const target = Number(element.dataset.count);
  // Counting up to a single digit only flashes a misleading "0".
  if (!Number.isFinite(target) || target < MIN_COUNT_TARGET) return;
  const start = performance.now();
  const tick = (now: number) => {
    const progress = Math.min((now - start) / COUNT_DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initCounters(): void {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  if (prefersStatic || !counters.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateCount(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );
  counters.forEach((counter) => observer.observe(counter));
}

interface ScrollEffect {
  update: () => void;
}

function createParallax(): ScrollEffect[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-parallax]'),
  ).map((element) => ({
    update() {
      const speed = Number(element.dataset.parallax) || 0;
      const rect = element.getBoundingClientRect();
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      element.style.setProperty(
        '--parallax',
        `${(-offset * speed).toFixed(1)}px`,
      );
    },
  }));
}

const GALLERY_MIN_WIDTH = 900;

function createGallery(): ScrollEffect | null {
  const section = document.querySelector<HTMLElement>('.h-gallery');
  const track = section?.querySelector<HTMLElement>('.h-gallery-track');
  if (!section || !track) return null;
  const desktop = window.matchMedia(`(min-width: ${GALLERY_MIN_WIDTH}px)`);

  const layout = () => {
    if (!desktop.matches) {
      section.style.removeProperty('height');
      track.style.removeProperty('transform');
      section.classList.remove('is-pinned');
      return;
    }
    // The viewport's side padding aligns the first card with the container;
    // mirror it on the right so the last card ends at the same gutter.
    const gutter =
      parseFloat(getComputedStyle(track.parentElement!).paddingLeft) || 0;
    const distance = Math.max(
      track.scrollWidth - window.innerWidth + gutter * 2,
      0,
    );
    section.style.height = `${window.innerHeight + distance}px`;
    section.dataset.distance = String(distance);
    section.classList.add('is-pinned');
  };
  layout();
  window.addEventListener('resize', layout);
  desktop.addEventListener('change', layout);

  return {
    update() {
      if (!desktop.matches) return;
      const distance = Number(section.dataset.distance) || 0;
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress =
        scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
      track.style.transform = `translate3d(${(-distance * progress).toFixed(1)}px,0,0)`;
      section.style.setProperty('--progress', progress.toFixed(3));
    },
  };
}

function initScrollEffects(): void {
  if (prefersStatic) return;
  const effects: ScrollEffect[] = [...createParallax()];
  const gallery = createGallery();
  if (gallery) effects.push(gallery);
  if (!effects.length) return;
  let queued = false;
  const run = () => {
    queued = false;
    effects.forEach((effect) => effect.update());
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  run();
}

const SLIDER_INTERVAL_MS = 5500;

function initSlider(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-slider-track]');
  const dotsHost = root.querySelector<HTMLElement>('[data-slider-dots]');
  if (!track) return;
  const slides = Array.from(track.children) as HTMLElement[];
  if (!slides.length) return;

  const step = () =>
    slides[0].getBoundingClientRect().width +
    parseFloat(getComputedStyle(track).columnGap || '0');
  const currentIndex = () => Math.round(track.scrollLeft / Math.max(step(), 1));
  const maxIndex = () =>
    Math.max(
      Math.round((track.scrollWidth - track.clientWidth) / Math.max(step(), 1)),
      0,
    );
  const goTo = (index: number) => {
    const last = maxIndex();
    const next = index > last ? 0 : index < 0 ? last : index;
    track.scrollTo({
      left: next * step(),
      behavior: prefersStatic ? 'auto' : 'smooth',
    });
  };

  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show card ${index + 1}`);
    dot.addEventListener('click', () => goTo(index));
    dotsHost?.append(dot);
    return dot;
  });
  const syncDots = () => {
    const active = currentIndex();
    dots.forEach((dot, index) =>
      dot.toggleAttribute('aria-current', index === active),
    );
  };
  track.addEventListener('scroll', () => requestAnimationFrame(syncDots), {
    passive: true,
  });
  syncDots();

  root
    .querySelector('[data-slider-prev]')
    ?.addEventListener('click', () => goTo(currentIndex() - 1));
  root
    .querySelector('[data-slider-next]')
    ?.addEventListener('click', () => goTo(currentIndex() + 1));

  if (prefersStatic) return;
  let paused = false;
  const pause = () => (paused = true);
  const resume = () => (paused = false);
  root.addEventListener('pointerenter', pause);
  root.addEventListener('pointerleave', resume);
  root.addEventListener('focusin', pause);
  root.addEventListener('focusout', resume);
  window.setInterval(() => {
    if (!paused && !document.hidden) goTo(currentIndex() + 1);
  }, SLIDER_INTERVAL_MS);
}

initReveals();
initCounters();
initScrollEffects();
document.querySelectorAll<HTMLElement>('[data-slider]').forEach(initSlider);
