/* ─── Reusable UI components ───
   Construction + wiring for pieces used across pages. app.js owns the
   single scroll listener (one rAF, one set of reads, one set of writes);
   components here expose plain functions that app.js calls into, rather
   than each registering its own listener — that's what keeps scrolling
   at 60fps with a dozen animated things on screen at once. */
window.Components = (function () {
  'use strict';

  const Utils = window.PortfolioUtils;

  /* ── Floating glass back-to-top button ── */
  function createBackToTop() {
    const el = document.createElement('button');
    el.className = 'back-top glass';
    el.setAttribute('aria-label', 'Наверх');
    el.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V4M4 7l4-4 4 4"/></svg>';
    document.body.appendChild(el);
    el.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: Utils.prefersReducedMotion() ? 'auto' : 'smooth' });
    });
    return el;
  }

  /* ── Adaptive nav glass — thickens once there's page content to
     separate it from, matching visionOS chrome responding to depth.
     Returns an updater the scroll handler calls with the current y. ── */
  function initGlassNav(nav) {
    if (!nav) return () => {};
    let thick = false;
    return function update(y) {
      const shouldBeThick = y > 8;
      if (shouldBeThick === thick) return;
      thick = shouldBeThick;
      nav.classList.toggle('glass-thick', thick);
    };
  }

  /* ── Pointer-driven card tilt — a few degrees of perspective rotation
     that follows the cursor, giving flat cards a sense of depth. Reads
     --tilt-x/--tilt-y, which the shared card-hover rule in style.css
     already wires into its transform (defaulting to 0deg when unset,
     so every other card is unaffected). Desktop, fine-pointer only;
     skipped entirely under prefers-reduced-motion. */
  function initCardTilt(selector, maxDeg) {
    if (!Utils.hasFinePointer() || Utils.prefersReducedMotion()) return;
    const deg = maxDeg || 4;
    document.querySelectorAll(selector).forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--tilt-x', (py * -deg).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (px * deg).toFixed(2) + 'deg');
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      }, { passive: true });
    });
  }

  return { createBackToTop, initGlassNav, initCardTilt };
})();
