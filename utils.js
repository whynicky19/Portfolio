/* ─── Small, dependency-free helpers shared by app.js / components.js ───
   No module system in play (plain <script> tags, no bundler) — exposed
   as one namespaced global so nothing collides with page-level scripts. */
window.PortfolioUtils = (function () {
  'use strict';

  function clamp(min, val, max) {
    return Math.max(min, Math.min(max, val));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasFinePointer() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /* Wraps fn so repeated calls collapse to at most one execution per
     animation frame — used to gate scroll/resize listeners. */
  function rafThrottle(fn) {
    let ticking = false;
    let lastArgs = null;
    return function throttled(...args) {
      lastArgs = args;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn.apply(null, lastArgs);
      });
    };
  }

  /* IntersectionObserver factory: observes every element matching
     `selector`, calls `onEnter(el)` once when it first crosses
     `options.threshold`, then stops observing that element. */
  function onIntersect(selector, onEnter, options) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return null;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        onEnter(entry.target, entry);
        io.unobserve(entry.target);
      });
    }, options || { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return io;
  }

  return { clamp, lerp, prefersReducedMotion, hasFinePointer, rafThrottle, onIntersect };
})();
