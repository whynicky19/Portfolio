/* Progressive enhancement: no hidden CSS state, scroll timeline or persistent
   animation fill. Each observed element is consumed BEFORE animation starts. */
(() => {
  'use strict';
  if (window.PortfolioReveal) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const callbacks = new WeakMap(), consumed = new WeakSet(), active = new Set();
  const animate = (element, frames, options = {}) => {
    if (!element || reduced.matches || !element.animate) return;
    const animation = element.animate(frames, {
      duration:440, easing:'cubic-bezier(.2,.7,.2,1)', fill:'backwards', ...options
    });
    active.add(animation);
    animation.finished.catch(() => {}).finally(() => active.delete(animation));
    return animation;
  };
  const enter = element => {
    if (consumed.has(element)) return;
    consumed.add(element);
    observer?.unobserve(element);
    element.dataset.revealCount = '1';
    const callback = callbacks.get(element);
    callbacks.delete(element);
    if (!reduced.matches) callback?.();
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) enter(entry.target); });
  }, {threshold:0, rootMargin:'0px 0px -24px 0px'}) : null;
  const once = (element, callback) => {
    if (!element || consumed.has(element) || callbacks.has(element)) return;
    callbacks.set(element, callback);
    if (observer && !reduced.matches) observer.observe(element);
    else enter(element);
  };
  // Keyboard focus must never wait for an entrance mask.
  document.addEventListener('focusin', () => active.forEach(animation => animation.cancel()));
  reduced.addEventListener('change', () => {
    if (reduced.matches) active.forEach(animation => animation.cancel());
  });
  window.PortfolioReveal = {once, animate, reduced};
})();
