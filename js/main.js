'use strict';

/* ============================================================
   Helpers
   ============================================================ */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. Canvas Particle Network — Hero Background
   ============================================================ */
(function initCanvas() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  if (prefersReducedMotion()) return;

  const ctx = canvas.getContext('2d');

  const CONFIG = {
    count:   70,
    speed:   0.38,
    radius:  1.4,
    maxDist: 130,
    rgb:     '59, 130, 246',   // matches --clr-accent
  };

  let particles = [];
  let raf;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function makeParticle() {
    return {
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: CONFIG.count }, makeParticle);
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      // dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, CONFIG.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.rgb}, 0.45)`;
      ctx.fill();

      // connections
      for (let j = i + 1; j < particles.length; j++) {
        const q  = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d  = Math.sqrt(dx * dx + dy * dy);

        if (d < CONFIG.maxDist) {
          const alpha = (1 - d / CONFIG.maxDist) * 0.28;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${CONFIG.rgb}, ${alpha})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(tick);
  }

  const onResize = () => {
    cancelAnimationFrame(raf);
    init();
    tick();
  };

  window.addEventListener('resize', onResize, { passive: true });
  init();
  tick();
})();


/* ============================================================
   2. Typewriter Effect
   ============================================================ */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'Frontend Developer Student',
    'React Enthusiast',
    'UX-Focused Builder',
    'Always Learning',
  ];

  if (prefersReducedMotion()) {
    el.textContent = phrases[0];
    return;
  }

  let phraseIdx = 0;
  let charIdx   = 0;
  let deleting  = false;
  let paused    = false;
  let timer;

  function tick() {
    const phrase = phrases[phraseIdx];

    if (deleting) {
      charIdx--;
    } else {
      charIdx++;
    }

    el.textContent = phrase.slice(0, charIdx);

    if (!deleting && charIdx === phrase.length) {
      if (!paused) {
        paused = true;
        timer = setTimeout(() => {
          paused   = false;
          deleting = true;
          tick();
        }, 2000);
        return;
      }
    }

    if (deleting && charIdx === 0) {
      deleting  = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      timer     = setTimeout(tick, 420);
      return;
    }

    timer = setTimeout(tick, deleting ? 48 : 88);
  }

  // Start after initial hero animations settle
  timer = setTimeout(tick, 900);
})();


/* ============================================================
   3. Navigation
      - Scroll → apply .is-scrolled to header
      - Toggle → hamburger open/close
      - Active link → highlight current section
   ============================================================ */
(function initNav() {
  const header  = document.querySelector('.site-header');
  const toggle  = document.querySelector('.nav__toggle');
  const menu    = document.querySelector('.nav__menu');
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));

  /* Scrolled state */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* Hamburger */
  if (toggle && menu) {
    function openMenu() {
      menu.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
    }

    function closeMenu() {
      menu.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
    }

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });

    // Close when a link is clicked (smooth scroll in progress)
    navLinks.forEach(link => link.addEventListener('click', closeMenu));

    // Close on outside click
    document.addEventListener('click', e => {
      if (!header.contains(e.target)) closeMenu();
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* Active section highlighting */
  const sections = Array.from(document.querySelectorAll('section[id]'));

  const sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle(
            'is-active',
            link.getAttribute('href') === `#${id}`
          );
        });
      });
    },
    {
      rootMargin: `-${Math.round(window.innerHeight * 0.3)}px 0px -${Math.round(window.innerHeight * 0.4)}px 0px`,
      threshold: 0,
    }
  );

  sections.forEach(s => sectionObserver.observe(s));
})();


/* ============================================================
   4. Scroll Reveal — Intersection Observer
   ============================================================ */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');

  if (prefersReducedMotion()) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        // Stagger sibling .reveal elements within the same parent
        const siblings = Array.from(
          entry.target.parentElement.querySelectorAll(':scope > .reveal')
        );
        const sibIdx = siblings.indexOf(entry.target);
        const delay  = sibIdx > 0 ? sibIdx * 80 : 0;

        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ============================================================
   5. Skill Tags — Staggered Reveal
   ============================================================ */
(function initSkillTags() {
  const groups = document.querySelectorAll('.skill-tags');

  if (prefersReducedMotion()) {
    groups.forEach(group =>
      group.querySelectorAll('.skill-tag').forEach(tag =>
        tag.classList.add('is-visible')
      )
    );
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const tags = entry.target.querySelectorAll('.skill-tag');
        tags.forEach((tag, i) => {
          setTimeout(() => tag.classList.add('is-visible'), i * 65);
        });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  groups.forEach(group => observer.observe(group));
})();
