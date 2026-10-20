/* Native scrolling. Independent transforms keep entrance, hover and depth from fighting. */
(() => {
  'use strict';
  const hero = document.querySelector('.p-hero');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...document.querySelectorAll('[data-card-depth]')];
  const notes = [...hero.querySelectorAll('.identity-note')];
  const noteTravel = [-28, -16, 16, -20];
  const pointerDepth = [1, -.65, .6, -1];
  const approach = document.querySelector('.h-capabilities');
  const toolkit = document.querySelector('.h-toolkit');
  const contact = document.querySelector('.h-contact');
  const clamp = n => Math.max(0, Math.min(1, n));
  let frame = 0, targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
  const px = n => `${n.toFixed(2)}px`;
  const tracked = [hero, approach, toolkit, contact, ...cards];
  const geometry = new Map();
  const lastValues = new WeakMap();
  let needsMeasure = true;
  function set(el, key, value) {
    let values = lastValues.get(el);
    if (!values) lastValues.set(el, values = new Map());
    if (values.get(key) === value) return;
    el.style.setProperty(key, value);
    values.set(key, value);
  }
  function rect(el) {
    const r = geometry.get(el);
    return {top:r.top-scrollY, bottom:r.top+r.height-scrollY, height:r.height};
  }
  const visible = r => r.bottom >= -80 && r.top <= innerHeight + 80;
  function paint() {
    frame = 0;
    // Cache layout only on resize/content changes. offsetTop ignores entrance/hover transforms.
    if (needsMeasure) {
      tracked.forEach(el => {
        let top = 0;
        for (let parent = el; parent; parent = parent.offsetParent) top += parent.offsetTop;
        geometry.set(el, {top, height:el.offsetHeight});
      });
      needsMeasure = false;
    }
    const h = rect(hero), a = rect(approach), t = rect(toolkit), c = rect(contact);
    const strength = innerWidth <= 600 ? .55 : 1;
    const progress = reduced.matches ? 0 : clamp(-h.top / h.height);
    if (reduced.matches || !finePointer.matches || h.bottom <= 0) targetX = targetY = 0;
    pointerX += (targetX - pointerX) * .22;
    pointerY += (targetY - pointerY) * .22;
    if (reduced.matches) pointerX = pointerY = 0;
    set(hero, '--paper-y', px(progress * 40 * strength));
    set(hero, '--name-y', px(progress * 16 * strength));
    set(hero, '--frame-y', px(-progress * 4 * strength));
    notes.forEach((note,i) => {
      set(note, '--note-y', px(progress * noteTravel[i] * strength));
      set(note, '--pointer-x', px(pointerX * pointerDepth[i]));
      set(note, '--pointer-y', px(pointerY * pointerDepth[i]));
    });
    const line = reduced.matches ? 1 : .3 + .7 * clamp((innerHeight - a.top) / (innerHeight * .7));
    if (visible(a) || reduced.matches) set(approach, '--line-scale', line.toFixed(3));
    const tech = reduced.matches ? .5 : clamp((innerHeight - t.top) / (innerHeight + t.height));
    if (visible(t) || reduced.matches) {
      set(toolkit, '--tech-light-y', px((tech - .5) * 100 * strength));
    }
    const close = reduced.matches ? .5 : clamp((innerHeight - c.top) / (innerHeight + c.height));
    if (visible(c) || reduced.matches) {
      set(contact, '--closing-y', px((close - .5) * 48 * strength));
      set(contact, '--closing-note-y', px((close - .5) * -24 * strength));
      set(contact, '--closing-word-y', px((close - .5) * 16 * strength));
    }
    cards.forEach(card => {
      const r = rect(card);
      if (!visible(r) && !reduced.matches) return;
      const offset = reduced.matches ? 0 : (clamp((innerHeight - r.top) / (innerHeight + r.height)) - .5) * -40 * strength;
      set(card, '--card-y', px(offset));
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
  function measure() { needsMeasure = true; schedule(); }
  addEventListener('resize',measure,{passive:true});
  reduced.addEventListener('change',schedule);
  finePointer.addEventListener('change',schedule);
  paint();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  document.fonts?.ready.then(measure);
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
