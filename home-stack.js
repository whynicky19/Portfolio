/* Isolated from Home entrance and Projects timelines. Content never parallaxes. */
(() => {
  const section = document.querySelector('.home-stack');
  if (!section) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let frame = 0;
  let visible = false;
  let entered = false;
  const animate = (element, keyframes, options) => {
    const animation = element.animate(keyframes, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
  };
  const reveal = () => {
    if (entered) return;
    entered = true;
    if (reduced.matches) return;
    // A stepped mask reveals whole pixel rows; glyphs never scale or blur.
    section.querySelectorAll('.stack-word').forEach((word, index) => animate(word,
      [{ clipPath:'inset(0 0 100% 0)' }, { clipPath:'inset(0 0 0% 0)' }],
      { duration:400, delay:index * 70, easing:'steps(7,end)', fill:'backwards' }));
  };
  const render = () => {
    frame = 0;
    if (reduced.matches) { section.style.removeProperty('--stack-sky-y'); return; }
    if (!visible) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight + rect.height)));
    // From section top at viewport bottom to section bottom at viewport top:
    // -90 → +90px desktop, -60 → +60px mobile. Overscan is 100px per edge.
    const travel = innerWidth <= 600 ? 120 : 180;
    section.style.setProperty('--stack-sky-y', `${((progress - .5) * travel).toFixed(2)}px`);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) schedule();
  }, { rootMargin:'0px', threshold:0 });
  observer.observe(section);
  const entrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entrance.unobserve(entry.target);
      if (entry.target.classList.contains('stack-intro')) { reveal(); return; }
      if (reduced.matches) return;
      const index = [...section.querySelectorAll('.stack-group')].indexOf(entry.target);
      animate(entry.target.querySelector('.stack-rule'),
        [{ transform:'scaleX(0)' }, { transform:'scaleX(1)' }],
        { duration:450, delay:index * 50, easing:'cubic-bezier(.2,.7,.3,1)', fill:'backwards' });
      animate(entry.target.querySelector('ul'),
        [{ opacity:0, transform:'translateY(10px)' }, { opacity:1, transform:'translateY(0px)' }],
        { duration:360, delay:80 + index * 50, easing:'ease-out', fill:'backwards' });
    });
  }, { threshold:.2 });
  section.querySelectorAll('.stack-intro,.stack-group').forEach(el => entrance.observe(el));
  addEventListener('scroll', schedule, { passive:true });
  addEventListener('resize', schedule, { passive:true });
  reduced.addEventListener('change', () => {
    if (reduced.matches) animations.forEach(animation => animation.cancel());
    schedule();
  });
})();
