/* Mobile nav toggle */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

function setNav(open) {
  const expanded = Boolean(open);
  navToggle?.setAttribute('aria-expanded', expanded);
  nav?.setAttribute('aria-hidden', (!expanded).toString());
}

setNav(false);

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setNav(!isOpen);
});

// Close menu on link click (mobile)
nav?.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  if (window.matchMedia('(max-width: 899px)').matches) setNav(false);
});

/* Active link highlight on scroll */
const links = [...document.querySelectorAll('.nav__link')];
const sections = links
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const makeActive = (id) => {
  links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
};

// Use IntersectionObserver for accuracy & performance
const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) makeActive(entry.target.id);
    });
  },
  { rootMargin: '-35% 0px -60% 0px', threshold: 0.01 }
);
sections.forEach((sec) => obs.observe(sec));

/* Reveal on scroll (subtle) */
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
);
reveals.forEach((el) => revealObs.observe(el));

/* Current year in footer */
document.getElementById('year').textContent = new Date().getFullYear();

/* Smooth scroll focus management for a11y */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;

  // Let CSS smooth-scroll; then focus the target for keyboard users
  setTimeout(() => {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }, 350);
});
