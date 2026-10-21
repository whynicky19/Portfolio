/* Static sunset photography; short, one-time typography and divider entrances. */
(() => {
  const section = document.querySelector('.home-stack');
  if (!section || !window.PortfolioReveal) return;
  const {once, animate} = window.PortfolioReveal;
  once(section.querySelector('.stack-intro'), () => {
    section.querySelectorAll('.stack-word').forEach((word, index) => animate(word,
      [{clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0 0)'}],
      {duration:400, delay:index*70, easing:'steps(7,end)'}));
  });
  section.querySelectorAll('.stack-group').forEach(group => once(group, () => {
    animate(group.querySelector('.stack-rule'), [{scale:'0 1'}, {scale:'1 1'}], {duration:450});
    animate(group.querySelector('ul'), [{opacity:.4, translate:'0 8px'}, {opacity:1, translate:'0 0'}], {duration:360, delay:80});
  }));
})();
