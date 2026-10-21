/* Projects: independent load-time pixel entrance and one-time editorial reveals. */
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
  // Own wrappers and animation handles: scrolling cannot complete the Hero,
  // restart this sequence, or write transforms on any project photograph.
  const recent = document.querySelector('.recent-work');
  if (recent && !reduced.matches && !location.hash && 'IntersectionObserver' in window) {
    const curtain = document.createElement('div');
    curtain.className = 'recent-shutters';
    curtain.setAttribute('aria-hidden', 'true');
    const panels = Array.from({length:8}, (_, index) => {
      const panel = document.createElement('span');
      panel.className = 'recent-shutter';
      curtain.append(panel);
      return panel;
    });
    recent.append(curtain);
    const motions = [];
    let observer, fallback, inView = false;
    const onScroll = () => { if (inView && scrollY > 8) play(); };
    function settle() {
      observer?.disconnect();
      removeEventListener('scroll', onScroll);
      clearTimeout(fallback);
      recent.dataset.transition = 'complete';
      motions.forEach(motion => motion?.cancel());
      curtain.remove();
    }
    function play() {
      if (recent.dataset.transition !== 'armed') return;
      observer.disconnect();
      removeEventListener('scroll', onScroll);
      recent.dataset.transition = 'running';
      recent.dataset.transitionCount = '1';
      const options = {easing:'cubic-bezier(.22,.72,.18,1)'};
      panels.forEach((panel, index) => motions.push(animate(panel,
        [{transform:'translateY(102%)'}, {transform:'translateY(0)'}],
        {...options, duration:620, delay:Math.abs(index-3.5)*55})));
      recent.querySelectorAll('.recent-line > span').forEach((word, index) => {
        motions.push(animate(word,
          [{transform:`translate(${index ? 24 : -24}%, ${index ? -110 : 110}%)`}, {transform:'translate(0,0)'}],
          {...options, duration:560, delay:120+index*90}));
      });
      motions.push(animate(recent.querySelector('p'),
        [{clipPath:'inset(0 0 100% 0)', transform:'translateY(12px)'},
         {clipPath:'inset(0 0 0 0)', transform:'translateY(0)'}],
        {...options, duration:400, delay:370}));
      Promise.all(motions.map(motion => motion?.finished.catch(() => {}))).then(settle);
      fallback = setTimeout(settle, 1300);
    }
    // A restored deep scroll should show content immediately, not replay an intro.
    if (recent.getBoundingClientRect().bottom <= 0) settle();
    else {
      recent.dataset.transition = 'armed';
      observer = new IntersectionObserver(entries => {
        inView = entries.some(entry => entry.isIntersecting);
        onScroll();
      }, {rootMargin:`0px 0px -${Math.round(innerHeight * .18)}px 0px`, threshold:0});
      observer.observe(recent);
      addEventListener('scroll', onScroll, {passive:true});
    }
    reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
    addEventListener('pagehide', settle, {once:true});
    // Keyboard users never have to wait for decorative masks.
    document.addEventListener('focusin', settle, {once:true});
  }
  const stories = [...document.querySelectorAll('.project-story')];
  // Only the first scene gets a curtain reveal. Its pixels never pan or scale.
  const first = stories[0];
  if (first) {
    const desktop = matchMedia('(min-width:1280px)').matches;
    const target = desktop ? first : first.querySelector('.project-scene');
    once(target, () => animate(first.querySelector('.project-scene'),
      [{clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0 0)'}],
      {duration:500, easing:'cubic-bezier(.2,.65,.25,1)'}));
  }
  stories.forEach((story, index) => {
    const heading = story.querySelector('.project-heading');
    once(heading, () => {
      // A stepped mask reveals the pixel type without translating or scaling it.
      animate(heading.querySelector('h2'),
        [{clipPath:'inset(0 100% 0 0)'}, {clipPath:'inset(0 0 0 0)'}],
        {duration:400, delay:index === 0 ? 100 : 0, easing:'steps(8,end)'});
      animate(heading.querySelector('.project-intro'),
        [{opacity:.3}, {opacity:1}], {duration:300, delay:index === 0 ? 200 : 80});
    });
    const insight = story.querySelector('.project-insight');
    once(insight, () => animate(insight, [{opacity:.65}, {opacity:1}], {duration:280}));
    if (index === 0) {
      const actions = story.querySelector('.project-actions');
      once(actions, () => animate(actions, [{opacity:.3}, {opacity:1}], {duration:280, delay:280}));
    }
  });
})();
