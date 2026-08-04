
/* ─── Theme bootstrap ─── */
(function () {
  const root = document.documentElement;

  function lsGet() { try { return localStorage.getItem('theme'); } catch(e) { return null; } }
  function lsSet(v) { try { localStorage.setItem('theme', v); } catch(e) {} }
  function ckSet(v) { document.cookie = 'theme=' + v + ';path=/;max-age=31536000;SameSite=Lax'; }

  function setTheme(t) { root.setAttribute('data-theme', t); lsSet(t); ckSet(t); }

  document.querySelectorAll('#themeToggle, #themeToggleMobile').forEach(b => {
    b.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!lsGet()) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });

  window.addEventListener('storage', e => {
    if (e.key === 'theme' && e.newValue) root.setAttribute('data-theme', e.newValue);
  });
})();

/* ─── Main application ─── */
(function () {
  'use strict';

  const reduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;

  /* ── DOM caches ── */
  const nav      = document.querySelector('.apple-nav');
  const heroText = isDesktop ? document.querySelector('.hero-parallax') : null;

  /* ── Floating glass back-to-top + adaptive nav glass ── */
  const backTop      = window.Components.createBackToTop();
  const updateNavGlass = window.Components.initGlassNav(nav);

  /* ── Mobile menu ── */
  const burger     = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* Active nav links are set by partials.js at injection time — single source of truth. */

  /* ── Scroll-triggered animations ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
      // Release GPU compositor layer once animation finishes
      if (!reduced) {
        entry.target.addEventListener('transitionend', () => {
          entry.target.style.willChange = 'auto';
        }, { once: true });
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.fade-up, .fade-in, .stagger, .depth-stagger, .slide-left, .slide-right, .scale-up, .clip-reveal')
    .forEach(el => io.observe(el));

  /* ── Animated counters ── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const duration = Math.min(1400, Math.max(500, target * 150)), start = performance.now(), suffix = el.dataset.suffix || '';
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  window.PortfolioUtils.onIntersect('[data-target]', animateCounter, { threshold: 0.5 });

  /* ── Rail drag-to-scroll ── */
  document.querySelectorAll('.rail-wrap').forEach(wrap => {
    let isDown = false, startX, scrollLeft;
    wrap.addEventListener('mousedown', e => { isDown = true; startX = e.pageX - wrap.offsetLeft; scrollLeft = wrap.scrollLeft; });
    wrap.addEventListener('mouseleave', () => { isDown = false; });
    wrap.addEventListener('mouseup',    () => { isDown = false; });
    wrap.addEventListener('mousemove',  e => {
      if (!isDown) return;
      e.preventDefault();
      wrap.scrollLeft = scrollLeft - (e.pageX - wrap.offsetLeft - startX) * 1.3;
    });
  });

  /* ── Sticky "How I work" features ── */
  const sfItems   = document.querySelectorAll('.sf-item[data-sf]');
  const sfVisuals = document.querySelectorAll('.sf-visual-item[data-sf]');
  if (sfItems.length && sfVisuals.length) {
    const sfIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx = entry.target.dataset.sf;
        sfVisuals.forEach(v => v.classList.remove('active'));
        document.querySelector(`.sf-visual-item[data-sf="${idx}"]`)?.classList.add('active');
      });
    }, { threshold: 0.5, rootMargin: '-10% 0px -10% 0px' });
    sfItems.forEach(el => sfIO.observe(el));
  }

  /* ── Ripple on primary buttons ── */
  const rippleCSS = document.createElement('style');
  rippleCSS.textContent = `@keyframes _ripple{to{transform:scale(1);opacity:0}}.btn-primary{position:relative;overflow:hidden}._ripple-el{position:absolute;border-radius:50%;pointer-events:none;background:rgba(0,0,0,.1);transform:scale(0);animation:_ripple .55s ease-out forwards}`;
  document.head.appendChild(rippleCSS);
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const el   = document.createElement('span');
      el.className = '_ripple-el';
      Object.assign(el.style, { width: size+'px', height: size+'px', left: (e.clientX-rect.left-size/2)+'px', top: (e.clientY-rect.top-size/2)+'px' });
      this.appendChild(el);
      setTimeout(() => el.remove(), 600);
    });
  });

  /* ── Smooth anchor scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight || 48) - 12, behavior: 'smooth' });
    });
  });

  /* ── Lazy load images — never override an explicit high-priority hint ── */
  document.querySelectorAll('img').forEach(img => {
    if (!img.loading && img.getAttribute('fetchpriority') !== 'high') img.loading = 'lazy';
  });

  /* ── Word-reveal: split headings into per-word spans ── */
  function splitWords(el) {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach(part => {
          if (/\S/.test(part)) {
            const s = document.createElement('span');
            s.className = 'wr-word';
            s.textContent = part;
            el.appendChild(s);
          } else if (part) {
            el.appendChild(document.createTextNode(part));
          }
        });
      } else {
        el.appendChild(node.cloneNode(true));
      }
    });
  }

  // wrItems: cached list of { el, words[] } for zero-allocation scroll updates
  const wrItems = [];
  document.querySelectorAll('.word-reveal').forEach(el => {
    splitWords(el);
    if (reduced) {
      el.querySelectorAll('.wr-word').forEach(w => { w.style.opacity = '1'; });
    } else {
      wrItems.push({ el, words: Array.from(el.querySelectorAll('.wr-word')) });
    }
  });

  /* ── Scroll-scale elements ── */
  const ssEls = (isDesktop && !reduced) ? Array.from(document.querySelectorAll('[data-scroll-scale]')) : [];

  /* ── Layered parallax — rect-relative, not raw scrollY, so any element
     anywhere on the page (not just ones pinned to the top) drifts toward
     the viewer as it approaches viewport center and recedes as it leaves.
     Depth per element via --parallax-depth (set inline in the markup). ── */
  const pxEls = (isDesktop && !reduced) ? Array.from(document.querySelectorAll('[data-parallax]')) : [];

  /* ── Scroll-linked reveal — continuous, reversible progress for
     hero-moment content (stat counters, metric cards, timeline entries)
     instead of a boolean IntersectionObserver fade-up ── */
  const rpEls = [];
  document.querySelectorAll('[data-reveal-progress]').forEach(el => {
    if (reduced) {
      el.style.opacity = '1';
    } else {
      rpEls.push(el);
    }
  });

  /* ── Timeline self-drawing progress line (About page) ── */
  const tlFill      = document.querySelector('.timeline-line-fill');
  const tlContainer = tlFill ? tlFill.closest('.timeline') : null;
  if (tlFill && reduced) tlFill.style.height = '100%';

  /* ───────────────────────────────────────────────────────
     SINGLE rAF-GATED SCROLL HANDLER
     One listener → one rAF → all reads → all writes.
     Eliminates multiple forced reflows per frame.
  ─────────────────────────────────────────────────────── */
  let navLastY = window.scrollY;

  function processScroll() {
    const y  = window.scrollY;
    const vh = window.innerHeight;

    /* Phase 1 — batch all layout reads */
    const wrRects = wrItems.map(({ el }) => el.getBoundingClientRect());
    const ssRects = ssEls.map(el => el.getBoundingClientRect());
    const rpRects = rpEls.map(el => el.getBoundingClientRect());
    const pxRects = pxEls.map(el => el.getBoundingClientRect());
    const tlRect  = tlContainer ? tlContainer.getBoundingClientRect() : null;

    /* Phase 2 — all DOM writes (no reads after this point) */

    // Back-to-top visibility + adaptive nav glass thickness
    backTop.classList.toggle('visible', y > 400);
    updateNavGlass(y);

    // Nav hide / show — transition lives in CSS, only set transform here
    if (nav) {
      const delta = y - navLastY;
      if (y <= 80) {
        nav.style.transform = 'translateY(0)';
        navLastY = y;
      } else if (delta > 6) {
        nav.style.transform = 'translateY(-100%)';
        navLastY = y;
      } else if (delta < -6) {
        nav.style.transform = 'translateY(0)';
        navLastY = y;
      }
    }

    // Parallax (desktop only)
    if (heroText) heroText.style.transform = `translateY(${(y * 0.25).toFixed(1)}px)`;

    // Word-reveal — pre-cached word arrays, no DOM queries per frame
    wrItems.forEach(({ words }, i) => {
      const rect     = wrRects[i];
      const progress = Math.max(0, Math.min(1, (vh * 0.82 - rect.top) / (vh * 0.58)));
      const n        = words.length;
      words.forEach((w, j) => {
        const onset = n > 1 ? (j / (n - 1)) * 0.6 : 0;
        const wp    = Math.max(0, Math.min(1, (progress - onset) / 0.4));
        w.style.opacity = (0.15 + wp * 0.85).toFixed(3);
      });
    });

    // Scroll-scale (desktop only)
    ssEls.forEach((el, i) => {
      const rect     = ssRects[i];
      const progress = Math.max(0, Math.min(1, (vh * 0.96 - rect.top) / (vh * 0.72)));
      el.style.transform = `scale(${(0.93 + progress * 0.07).toFixed(4)})`;
    });

    // Scroll-linked reveal — opacity/lift tied continuously to scroll position
    rpEls.forEach((el, i) => {
      const rect     = rpRects[i];
      const progress = Math.max(0, Math.min(1, (vh * 0.92 - rect.top) / (vh * 0.5)));
      el.style.opacity   = progress.toFixed(3);
      el.style.transform = `translateY(${((1 - progress) * 22).toFixed(1)}px)`;
    });

    // Timeline line draws itself as the section scrolls through view
    if (tlFill && tlRect) {
      const progress = Math.max(0, Math.min(1, (vh * 0.75 - tlRect.top) / (tlRect.height + vh * 0.35)));
      tlFill.style.height = (progress * 100).toFixed(1) + '%';
    }

    // Layered parallax — offset grows as the element's center diverges
    // from the viewport's center; zero when perfectly centered.
    pxEls.forEach((el, i) => {
      const rect   = pxRects[i];
      const center = rect.top + rect.height / 2;
      const delta  = (vh / 2 - center);
      el.style.setProperty('--parallax-y', delta.toFixed(1) + 'px');
    });
  }

  window.addEventListener('scroll', window.PortfolioUtils.rafThrottle(processScroll), { passive: true });

  processScroll(); // initial render

  /* ── Pointer-driven depth tilt — opt-in per component, desktop only ── */
  window.Components.initCardTilt('.proj-mini', 5);
  window.Components.initCardTilt('.cs-stack-card', 3);

})();
