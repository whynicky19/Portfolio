/* The SVG entrance starts in CSS at first paint, without waiting for fonts. */
(() => {
  const hero = document.querySelector('.home-hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Settle before caching, then replay when Back/Forward restores this document.
  window.addEventListener('pagehide', () => hero?.classList.remove('hero-play'));
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !hero || reduced.matches) return;
    hero.classList.remove('hero-play');
    // Flush the settled state so restoring from bfcache creates a new timeline.
    void hero.offsetWidth;
    hero.classList.add('hero-play');
  });

  if (window.PortfolioReveal) {
    const {once, animate} = window.PortfolioReveal;
    document.querySelectorAll('.home-reveal:not(.craft-intro):not(#feel-title):not(#contact-title)').forEach(element => once(element, () => {
      animate(element, [{opacity:.4,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}], {duration:620});
    }));
    const craft = document.querySelector('.craft-intro');
    once(craft, () => craft.querySelectorAll('.craft-line').forEach((line, index) => {
      animate(line, [
        {opacity:.2,transform:'translateY(28px)',clipPath:'inset(0 0 85% 0)'},
        {opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0% 0)'}
      ], {duration:680,delay:index * 100});
    }));
    const technologies = document.querySelector('.technology-list');
    once(technologies, () => technologies.querySelectorAll('li').forEach((item, index) => {
      animate(item, [{opacity:.25,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}], {
        duration:480,delay:(index % 7) * 45 + Math.floor(index / 7) * 70
      });
    }));
    const feel = document.querySelector('#feel-title');
    once(feel, () => feel.querySelectorAll('.feel-line').forEach((line, index) => {
      animate(line, [
        {opacity:.2,transform:'translateX(-24px)',clipPath:'inset(0 80% 0 0)'},
        {opacity:1,transform:'translateX(0)',clipPath:'inset(0 0% 0 0)'}
      ], {duration:700,delay:index * 100});
    }));
    const contact = document.querySelector('#contact-title');
    once(contact, () => animate(contact, [
      {opacity:.3,transform:'translateY(24px) rotate(-1.5deg)'},
      {opacity:1,transform:'translateY(0) rotate(0deg)'}
    ], {duration:650}));
    document.querySelectorAll('.sky-ribbon .home-shell,.footer-layout').forEach(element => once(element, () => {
      animate(element, [{opacity:.3,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}], {duration:600});
    }));
  }
})();
