(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  function play(element, frames, options) {
    if (motion.matches || !element.animate) return;
    const animation = element.animate(frames, options);
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  }

  const dialog = document.querySelector('#certificate-dialog');
  const preview = document.querySelector('#certificate-preview');
  const certificates = [...document.querySelectorAll('.certificate-open')];
  let opener;
  let current = 0;
  function displayCertificate(index) {
    current = (index + certificates.length) % certificates.length;
    const source = certificates[current];
    preview.src = source.dataset.source;
    preview.alt = source.dataset.title + ', original certificate';
    document.querySelector('#certificate-title').textContent = source.dataset.title;
    document.querySelector('#certificate-original').href = source.dataset.source;
    document.querySelector('.certificate-counter').textContent = `${current + 1} / ${certificates.length}`;
  }
  certificates.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      displayCertificate(index);
      dialog.showModal();
      dialog.querySelector('.dialog-close').focus();
      play(dialog,
        [{opacity:0, transform:'translateY(10px) scale(.985)'}, {opacity:1, transform:'none'}],
        {duration:240, easing:'cubic-bezier(.2,.8,.2,1)'});
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.certificate-prev').addEventListener('click', () => displayCertificate(current - 1));
  dialog.querySelector('.certificate-next').addEventListener('click', () => displayCertificate(current + 1));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      displayCertificate(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button,a[href]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('close', () => opener?.focus({preventScroll:true}));

  // Section entrances live in about-motion.js; the notebook Hero is independent.
  motion.addEventListener('change', () => {
    if (motion.matches) running.forEach(animation => animation.cancel());
  });
})();
