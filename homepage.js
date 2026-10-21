/* One-time content entrances. Native scrolling never writes visual state. */
(() => {
  'use strict';
  const hero = document.querySelector('.notebook-hero');
  if (!hero || !window.PortfolioReveal) return;
  const { once, animate, reduced } = window.PortfolioReveal;
  document.querySelectorAll('.h-reveal').forEach(element => once(element, () => {
    animate(element, [{opacity:.35, translate:'0 12px'}, {opacity:1, translate:'0 0'}], {duration:480});
  }));
  const note = document.querySelector('.closing-note');
  if (note) once(note, () => animate(note, [{opacity:0, translate:'0 8px'}, {opacity:1, translate:'0 0'}], {duration:360}));
  // Fill the gaps in the existing motion system, without targeting the Hero,
  // project media, stack words, or the separate LET’S TALK pixel assembly.
  const extra = (element, effect) => {
    if (!element) return;
    element.dataset.homeExtra = 'ready';
    once(element, () => {
      element.dataset.homeExtra = 'running';
      const animations = effect().filter(Boolean);
      Promise.all(animations.map(a => a.finished.catch(() => {}))).then(() => {
        element.dataset.homeExtra = 'complete';
      });
    });
  };
  const ink = (element, delay=0) => animate(element,
    [{clipPath:'inset(0 100% 0 0)'}, {clipPath:'inset(0 0 0 0)'}],
    {duration:420, delay, easing:'cubic-bezier(.22,.72,.18,1)'});
  document.querySelectorAll('.principle').forEach((principle, index) => {
    const rule = document.createElement('span');
    rule.className = 'home-drawn-rule';
    rule.setAttribute('aria-hidden','true');
    principle.append(rule);
    principle.classList.add('has-drawn-rule');
    extra(principle, () => [
      animate(rule, [{scale:'0 1'}, {scale:'1 1'}], {duration:460, delay:index%2*50}),
      ink(principle.querySelector('h3'), 70),
      animate(principle.querySelector('p'), [{opacity:.35, translate:'0 6px'}, {opacity:1, translate:'0 0'}], {duration:360, delay:130})
    ]);
  });
  extra(document.querySelector('.approach-signoff'), () => [ink(document.querySelector('.approach-signoff'), 100)]);
  extra(document.querySelector('.stack-intro p'), () => [animate(document.querySelector('.stack-intro p'),
    [{clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0 0)'}], {duration:440, delay:100})]);
  document.querySelectorAll('.stack-group h3').forEach(heading => extra(heading, () => [ink(heading)]));
  // The word itself is owned by pixel-assembly.js. Only its supporting UI moves.
  const contactArrow = document.querySelector('.contact-arrow');
  extra(contactArrow, () => [animate(contactArrow,
    [{opacity:.25, translate:'-8px 8px'}, {opacity:1, translate:'0 0'}], {duration:400, delay:120})]);
  const actionLabel = document.querySelector('.contact-action-label');
  extra(actionLabel, () => [ink(actionLabel, 180)]);
  document.querySelectorAll('.closing-links a').forEach((link,index) => extra(link, () => [
    animate(link, [{opacity:.25, translate:'0 8px'}, {opacity:1, translate:'0 0'}], {duration:380, delay:index*65})
  ]));
  document.querySelectorAll('.apple-footer .footer-col,.apple-footer .footer-bottom').forEach(column => extra(column, () =>
    [...column.children].map((item,index) => animate(item,
      [{opacity:.2, translate:'0 8px'}, {opacity:1, translate:'0 0'}], {duration:360, delay:Math.min(index,4)*55}))
  ));
  // Pointer feedback is independent of both scroll and the assembly timeline.
  const pointer = matchMedia('(hover:hover) and (pointer:fine)');
  const notes = [...hero.querySelectorAll('.identity-note')];
  const depth = [1, -.65, .6, -1];
  const reset = () => notes.forEach(note => {
    note.style.removeProperty('--pointer-x');
    note.style.removeProperty('--pointer-y');
  });
  hero.addEventListener('pointermove', event => {
    if (reduced.matches || !pointer.matches || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    notes.forEach((note, i) => {
      note.style.setProperty('--pointer-x', (((event.clientX-rect.left)/rect.width-.5)*6*depth[i])+'px');
      note.style.setProperty('--pointer-y', (((event.clientY-rect.top)/rect.height-.5)*4*depth[i])+'px');
    });
  }, {passive:true});
  hero.addEventListener('pointerleave', reset);
  reduced.addEventListener('change', reset);
  pointer.addEventListener('change', reset);
})();
