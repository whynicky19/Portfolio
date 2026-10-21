/* Projects: a load-time pixel entrance and one-time copy reveals. No parallax. */
(() => {
  'use strict';
  const hero = document.querySelector('.projects-hero');
  if (!hero || hero.dataset.initialized) return;
  hero.dataset.initialized = 'true';
  const title = hero.querySelector('h1');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const clamp = n => Math.min(1, Math.max(0, n));
  let frame = 0, safety = 0, stopped = false;
  function finish() {
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(safety);
    title.style.removeProperty('clip-path');
    title.style.removeProperty('translate');
    hero.dataset.reveal = 'complete';
  }
  async function reveal() {
    if (reduced.matches || location.hash) { finish(); return; }
    title.style.clipPath = 'inset(100% 0 0)';
    safety = setTimeout(finish, 2300);
    try {
      await Promise.race([document.fonts.load('700 100px Silkscreen'), new Promise(resolve => setTimeout(resolve, 450))]);
      if (stopped) return;
      const start = performance.now();
      hero.dataset.entranceStart = String(start);
      hero.dataset.reveal = 'running';
      hero.dataset.entranceCount = '1';
      function tick(now) {
        if (stopped) return;
        const t = (now-start)/1500;
        if (t >= 1) { finish(); return; }
        const points = [];
        for (let x = 0; x < 8; x++) {
          const p = clamp((t-x/7*.2)/.68), row = 1-Math.floor(p*8)/8;
          points.push((x/8*100)+'% '+(row*100)+'%', ((x+1)/8*100)+'% '+(row*100)+'%');
        }
        title.style.clipPath = 'polygon('+points.join(',')+',100% 100%,0% 100%)';
        title.style.translate = '0 '+((1-clamp(t/.85))*8)+'px';
        frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    } catch (_) { finish(); }
  }
  reveal();
  // Percentage masks adapt to resize themselves. A mobile browser toolbar
  // changing the viewport height must never force-complete this entrance.
  reduced.addEventListener('change', () => { if (reduced.matches) finish(); });
  addEventListener('pagehide', finish, {once:true});
  if (!window.PortfolioReveal) return;
  const {once, animate} = window.PortfolioReveal;
  once(document.querySelector('.recent-work'), () => {
    document.querySelectorAll('.recent-line > span').forEach((line, index) => animate(line,
      [{translate:(index ? 12 : -12)+'px 110%'}, {translate:'0 0'}],
      {duration:540, delay:index*75}));
  });
  document.querySelectorAll('.project-heading,.project-details').forEach(block => once(block, () => {
    const heading = block.querySelector('h2');
    if (heading) animate(heading, [{clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0 0)'}], {duration:400, easing:'steps(7,end)'});
    else animate(block, [{opacity:.4, translate:'0 8px'}, {opacity:1, translate:'0 0'}], {duration:400});
  }));
})();
