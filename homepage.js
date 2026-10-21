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
