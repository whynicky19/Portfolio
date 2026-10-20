/* Native scrolling. Independent transforms keep entrance, hover and depth from fighting. */
(() => {
  'use strict';
  const hero = document.querySelector('.p-hero');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...document.querySelectorAll('[data-card-depth]')];
  const notes = [...hero.querySelectorAll('.identity-note')];
  const noteTravel = [-40, -18, 22, -28];
  const pointerDepth = [1, -.65, .6, -1];
  const approach = document.querySelector('.h-capabilities');
  const toolkit = document.querySelector('.h-toolkit');
  const contact = document.querySelector('.h-contact');
  const clamp = n => Math.max(0, Math.min(1, n));
  let frame = 0, targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
  const px = n => `${n.toFixed(2)}px`;
  function paint() {
    frame = 0;
    // Read first. Scroll and pointer events share a single scheduled frame.
    const h = hero.getBoundingClientRect();
    const a = approach.getBoundingClientRect();
    const t = toolkit.getBoundingClientRect();
    const c = contact.getBoundingClientRect();
    const rects = cards.map(card => card.getBoundingClientRect());
    const strength = innerWidth <= 600 ? .55 : 1;
    const progress = reduced.matches ? 0 : clamp(-h.top / h.height);
    if (reduced.matches || !finePointer.matches || h.bottom <= 0) targetX = targetY = 0;
    pointerX += (targetX - pointerX) * .22;
    pointerY += (targetY - pointerY) * .22;
    if (reduced.matches) pointerX = pointerY = 0;
    hero.style.setProperty('--paper-y', px(progress * 50 * strength));
    hero.style.setProperty('--name-y', px(progress * 24 * strength));
    hero.style.setProperty('--frame-y', px(-progress * 12 * strength));
    hero.style.setProperty('--edge-x', px(progress * 48 * strength));
    notes.forEach((note,i) => {
      note.style.setProperty('--note-y', px(progress * noteTravel[i] * strength));
      note.style.setProperty('--pointer-x', px(pointerX * pointerDepth[i]));
      note.style.setProperty('--pointer-y', px(pointerY * pointerDepth[i]));
    });
    const line = reduced.matches ? 1 : .3 + .7 * clamp((innerHeight - a.top) / (innerHeight * .7));
    approach.style.setProperty('--line-scale', line.toFixed(3));
    const tech = reduced.matches ? .5 : clamp((innerHeight - t.top) / (innerHeight + t.height));
    toolkit.style.setProperty('--tech-light-y', px((tech - .5) * 100 * strength));
    toolkit.style.setProperty('--tech-rule', reduced.matches ? '1' : String(.4 + .6 * clamp((innerHeight - t.top) / innerHeight)));
    const close = reduced.matches ? .5 : clamp((innerHeight - c.top) / (innerHeight + c.height));
    contact.style.setProperty('--closing-y', px((close - .5) * 48 * strength));
    contact.style.setProperty('--closing-note-y', px((close - .5) * -32 * strength));
    cards.forEach((card,i) => {
      const r = rects[i];
      const offset = reduced.matches ? 0 : (clamp((innerHeight - r.top) / (innerHeight + r.height)) - .5) * -44 * strength;
      card.style.setProperty('--card-y', px(offset));
    });
    if (Math.abs(targetX-pointerX) + Math.abs(targetY-pointerY) > .02) schedule();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  hero.addEventListener('pointermove', e => {
    if (!finePointer.matches || reduced.matches || e.pointerType === 'touch') return;
    targetX = (e.clientX / innerWidth - .5) * 8;
    targetY = (e.clientY / innerHeight - .5) * 6;
    schedule();
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { targetX = targetY = 0; schedule(); });
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener('change',schedule);
  finePointer.addEventListener('change',schedule);
  paint();
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.querySelector('main'));
  // Content is visible by default, including if construction or observation fails.
  if ('IntersectionObserver' in window) {
    try {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, {threshold:.12});
      document.querySelectorAll('.h-reveal,.closing-action').forEach(e=>observer.observe(e));
    } catch (_) { /* No hidden pending state to recover. */ }
  }
})();
