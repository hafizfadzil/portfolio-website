// ---------- Runtime config loader (works on Firebase Hosting or Nginx) ----------
(async function loadConfig() {
  try {
    const res = await fetch('/config/app-config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No config found');
    window.APP_CONFIG = await res.json();
  } catch (err) {
    console.warn('Config not found; using defaults. Create /config/app-config.json');
    window.APP_CONFIG = { provider: { firebase: { enabled: false } } };
  }
})();

// ---------- Mobile nav toggle (accessible) ----------
(function navToggle() {
  const btn = document.querySelector('.nav-toggle');
  const menu = document.querySelector('[data-nav]'); // matches our index.html
  if (!btn || !menu) return;

  const setState = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('data-open', String(open));
    document.body.classList.toggle('nav-open', open);
  };

  btn.addEventListener('click', () => {
    const open = menu.getAttribute('data-open') === 'true';
    setState(!open);
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setState(false);
  });

  // Close when clicking a nav link (mobile)
  menu.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => setState(false));
  });
})();

// ---------- Current year ----------
(function setYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();

// ---------- Reveal-on-scroll (matches CSS: add .in-view) ----------
(function revealOnScroll() {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

// ---------- Typewriter headline (optional) ----------
(function typewriter() {
  const el = document.querySelector('.typewriter');
  if (!el) return;

  // Read phrases from data-rotate='["Phrase A","Phrase B"]'
  const list = (() => {
    try { return JSON.parse(el.getAttribute('data-rotate') || '[]'); }
    catch { return []; }
  })();

  // If no rotate list provided, do nothing
  if (!Array.isArray(list) || list.length === 0) return;

  let i = 0;
  let j = 0;
  let direction = 1; // 1 typing, -1 deleting
  const typeSpeed = 40;
  const eraseSpeed = 18;
  const hold = 1200;

  const tick = () => {
    const full = list[i % list.length];
    if (direction === 1) {
      // typing
      el.textContent = full.slice(0, j++);
      if (j <= full.length) return setTimeout(tick, typeSpeed);
      direction = -1;
      return setTimeout(tick, hold);
    } else {
      // deleting
      el.textContent = full.slice(0, j--);
      if (j >= 0) return setTimeout(tick, eraseSpeed);
      direction = 1; i++;
      return setTimeout(tick, 300);
    }
  };

  // Respect reduced motion
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    el.textContent = list[0];
    return;
  }

  tick();
})();

// ---------- Contact form (mailto fallback or Firestore) ----------
(function contactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  // Provide polite ARIA live updates
  if (status) status.setAttribute('aria-live', 'polite');

  let busy = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    if (status) status.textContent = 'Sending…';

    // Basic validation
    const name = form.name?.value?.trim() || '';
    const email = form.email?.value?.trim() || '';
    const message = form.message?.value?.trim() || '';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !message) {
      if (status) status.textContent = 'Please fill in your name, a valid email, and a message.';
      busy = false;
      return;
    }

    const cfg = window.APP_CONFIG?.provider?.firebase;

    // Fallback: open mail client if Firebase disabled
    if (!cfg?.enabled) {
      const subject = encodeURIComponent('Consultation request from ' + name);
      const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
      window.location.href = `mailto:hello@hafizfadzil.com?subject=${subject}&body=${body}`;
      if (status) status.textContent = 'Opened your email app. If not, please email hello@hafizfadzil.com';
      busy = false;
      return;
    }

    // If Firebase is enabled in config, dynamically import and send to Firestore
    try {
      const [{ initializeApp }, firestore] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
      ]);

      const app = initializeApp(cfg.clientConfig);
      const db = firestore.getFirestore(app);
      const doc = {
        name, email, message,
        createdAt: new Date().toISOString(),
        ua: navigator.userAgent || ''
      };

      await firestore.addDoc(firestore.collection(db, 'contactMessages'), doc);
      form.reset();
      if (status) status.textContent = 'Thanks! Your message has been sent.';
    } catch (err) {
      console.error(err);
      if (status) status.textContent = 'Error sending. Please email hello@hafizfadzil.com instead.';
    } finally {
      busy = false;
    }
  });
})();
