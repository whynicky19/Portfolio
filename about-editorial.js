(() => {
  const dialog = document.querySelector('#certificate-dialog');
  const preview = document.querySelector('#certificate-preview');
  let opener;
  document.querySelectorAll('.certificate-open').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      preview.src = button.dataset.source;
      preview.alt = button.dataset.title + ' — original certificate';
      document.querySelector('#certificate-title').textContent = button.dataset.title;
      document.querySelector('#certificate-original').href = button.dataset.source;
      dialog.showModal();
      dialog.querySelector('button').focus();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button,a[href]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('close', () => opener?.focus({preventScroll:true}));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  function play(element, frames, options) {
    if (motion.matches || !element.animate) return;
    const animation = element.animate(frames, options);
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  }
  document.querySelectorAll('.certificate-open').forEach(button => {
    button.addEventListener('click', () => play(dialog,
      [{opacity:0, transform:'translateY(14px) scale(.98)'}, {opacity:1, transform:'none'}],
      {duration:260, easing:'cubic-bezier(.2,.8,.2,1)'}));
  });

  // Observe each item before it enters the viewport. Never dim content
  // that has already been painted, including when scrolling quickly.
  if ('IntersectionObserver' in window) {
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || seen.has(entry.target)) return;
      const element = entry.target;
      seen.add(element);
      observer.unobserve(element);
      play(element,
        [{transform:'translateY(18px)'}, {transform:'translateY(0)'}],
        {duration:650, easing:'cubic-bezier(.16,1,.3,1)', fill:'backwards'});
    }), {threshold:0, rootMargin:'0px 0px 100px 0px'});
    document.querySelectorAll('.intro-copy,.section-heading,.road article,.about-contact h2,.skills-grid>.photo-card,.process .four-grid>.photo-card,.certificate-card,.principle-grid>article,.beyond .four-grid>.photo-card')
      .forEach(element => observer.observe(element));
  }

  motion.addEventListener('change', () => {
    if (motion.matches) running.forEach(animation => animation.cancel());
  });
})();
