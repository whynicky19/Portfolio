/* Shared progressive-enhancement layer: navigation, reveal motion,
   filters and the Chatra case-study story. */
(function () {
  'use strict';

  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('.apple-nav');

  root.setAttribute('data-theme', 'light');
  root.style.colorScheme = 'light';

  /* Mobile navigation is a real focus-contained modal surface. */
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const pageRegions = Array.from(document.querySelectorAll('main, #site-footer'));
  let returnFocus = null;

  function menuItems() { return mobileMenu ? Array.from(mobileMenu.querySelectorAll('a[href],button:not([disabled])')) : []; }
  function setMenu(open, restore) {
    if (!burger || !mobileMenu) return;
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    pageRegions.forEach((region) => open ? region.setAttribute('inert', '') : region.removeAttribute('inert'));
    if (open) {
      returnFocus = document.activeElement;
      requestAnimationFrame(() => menuItems()[0]?.focus());
    } else if (restore && returnFocus instanceof HTMLElement) returnFocus.focus();
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true', true));
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false, false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setMenu(false, true);
      }
    });
    mobileMenu.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const items = menuItems();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => { if (event.matches) setMenu(false, false); });
  }

  /* A single animation-frame scroll writer keeps navigation material cheap. */
  let navFrame = 0;
  function updateNav() {
    navFrame = 0;
    nav?.classList.toggle('glass-thick', window.scrollY > 20);
  }
  // The same fixed material applies to every page.
  window.addEventListener('scroll', () => {
    if (!navFrame) navFrame = requestAnimationFrame(updateNav);
  }, { passive: true });
  updateNav();

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight || 48) - 12;
      window.scrollTo({ top, behavior: motionQuery.matches ? 'auto' : 'smooth' });
      if (anchor.classList.contains('skip-link')) target.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('img').forEach((image) => {
    if (!image.loading && image.getAttribute('fetchpriority') !== 'high') image.loading = 'lazy';
    if (!image.decoding) image.decoding = 'async';
  });

  /* Content is hidden only after a working observer exists; a hard fallback
     makes the blank-section failure mode impossible. */
  function initReveals() {
    const targets = Array.from(document.querySelectorAll('.fade-up,.word-reveal,.scale-up,.clip-reveal,.slide-left,.slide-right,.fade-in,.stagger,.depth-stagger,.motion-stagger'));
    if (!targets.length || motionQuery.matches || !('IntersectionObserver' in window)) return;
    root.classList.add('motion-ok');
    targets.forEach((target) => {
      target.classList.add('reveal-pending');
      Array.from(target.children).forEach((child, index) => child.style.setProperty('--stagger-index', index));
    });
    const reveal = (target) => {
      target.classList.add('is-visible');
      target.classList.remove('reveal-pending');
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); } });
    }, { rootMargin: '0px 0px -7% 0px', threshold: .06 });
    targets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.04) reveal(target);
      else observer.observe(target);
    });
    window.setTimeout(() => targets.forEach(reveal), 3500);
  }

  function initFilters() {
    const rootFilters = document.querySelector('[data-project-filters]');
    const cards = Array.from(document.querySelectorAll('[data-project-grid] .collection-card'));
    if (!rootFilters || !cards.length) return;
    const buttons = Array.from(rootFilters.querySelectorAll('[data-filter]'));
    const count = rootFilters.querySelector('[data-filter-count]');
    const empty = document.querySelector('[data-filter-empty]');

    function applyFilter(filter) {
      let visible = 0;
      cards.forEach((card) => {
        const match = filter === 'all' || (card.dataset.category || '').split(/\s+/).includes(filter);
        card.hidden = !match;
        if (match) visible += 1;
      });
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
      if (count) count.textContent = visible + (visible === 1 ? ' project' : ' projects');
      empty?.classList.toggle('is-visible', visible === 0);
      history.replaceState(null, '', window.location.pathname + window.location.search + (filter === 'all' ? '' : '#filter=' + filter));
    }

    buttons.forEach((button) => button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      /* Update control semantics immediately; the visual reorder may use the
         browser's native transition when available. */
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      const run = () => applyFilter(filter);
      if (document.startViewTransition && !motionQuery.matches) document.startViewTransition(run);
      else run();
    }));
    const hash = window.location.hash.match(/^#filter=([a-z-]+)$/)?.[1];
    if (hash && buttons.some((button) => button.dataset.filter === hash)) applyFilter(hash);
  }

  function initStickyStory() {
    const story = document.querySelector('[data-sticky-story]');
    if (!story) return;
    const steps = Array.from(story.querySelectorAll('[data-story-step]'));
    const screens = Array.from(story.querySelectorAll('[data-story-screen]'));
    const activate = (index) => screens.forEach((screen) => {
      const active = screen.dataset.storyScreen === String(index);
      screen.classList.toggle('is-active', active);
      screen.setAttribute('aria-hidden', String(!active));
    });
    activate(0);
    if (!('IntersectionObserver' in window) || motionQuery.matches || window.innerWidth <= 800) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) activate(entry.target.dataset.storyStep); }), { rootMargin: '-38% 0px -38% 0px' });
    steps.forEach((step) => observer.observe(step));
  }

  function init() { initReveals(); initFilters(); initStickyStory(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
