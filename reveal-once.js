/* Progressive enhancement: no hidden CSS state, scroll timeline or persistent
   animation fill. Each observed element is consumed BEFORE animation starts. */
(() => {
  'use strict';
  if (window.PortfolioReveal) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const mobile = matchMedia('(max-width:800px), (pointer:coarse)');
  const mobileHome = () => document.body.classList.contains('home-premium') && mobile.matches;
  const callbacks = new WeakMap(), consumed = new WeakSet(), active = new Set();
  const animate = (element, frames, options = {}) => {
    if (!element || reduced.matches || !element.animate) return;
    // Content is visible before IntersectionObserver fires. Never hide it again
    // on touch screens: that visible → masked/faded → visible cycle flashes
    // during a swipe, especially when a parent and its children both reveal.
    // Leave photographic containers stationary; retain small supporting motion
    // and drawn rules. The Hero assembly owns its own, independent timeline.
    if (mobileHome()) {
      if (element.matches('.h-reveal')) return;
      frames = frames.map(({opacity, clipPath, filter, ...stable}) => stable);
      if (!frames.some(frame => Object.keys(frame).some(key =>
        !['offset', 'easing', 'composite'].includes(key)))) return;
    }
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
  mobile.addEventListener('change', () => {
    if (mobileHome()) active.forEach(animation => animation.cancel());
  });
  window.PortfolioReveal = {once, animate, reduced};
})();
