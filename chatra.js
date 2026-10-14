/* ═══════════════════════════════════════════════════════════════
   CHATRA — page logic
   - Builds real iPhone mockups from the .iphone containers
   - Autoplay feature videos when they enter the viewport
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  /* Each Chatra screen has its own real widths on disk. */
  const SCREENS = {
    'chatra-light': {
      jpg:   'img/chatra light.jpg',
      avif:  ['img/chatra-light-600w.avif 600w',  'img/chatra-light-1179w.avif 1179w'],
      webp:  ['img/chatra-light-600w.webp 600w',  'img/chatra-light-1179w.webp 1179w']
    },
    'chatra-dark': {
      jpg:   'img/chatra dark.jpg',
      avif:  ['img/chatra-dark-600w.avif 600w',   'img/chatra-dark-1179w.avif 1179w'],
      webp:  ['img/chatra-dark-600w.webp 600w',   'img/chatra-dark-1179w.webp 1179w']
    }
  };

  /* ─────────────────────────────────────────────
     1. iPhone factory
     ───────────────────────────────────────────── */
  function buildiPhone(el) {
    if (el.dataset.built === '1') return;
    el.dataset.built = '1';

    const screenName = el.dataset.screen;

    const frame = document.createElement('div');
    frame.className = 'iphone-frame';

    const island = document.createElement('div');
    island.className = 'iphone-island';
    frame.appendChild(island);

    const screenEl = document.createElement('div');
    screenEl.className = 'iphone-screen';

    /* a video inside takes precedence — the mockup wraps the existing
       <video class="iphone-video"> child instead of replacing it */
    const existingVideo = el.querySelector('.iphone-video');
    if (existingVideo) {
      screenEl.appendChild(existingVideo);
    } else if (SCREENS[screenName]) {
      screenEl.appendChild(buildScreenMedia(SCREENS[screenName]));
    } else {
      screenEl.style.background = '#1d1d1f';
    }

    frame.appendChild(screenEl);
    el.appendChild(frame);
    if (existingVideo) addVideoControl(el, existingVideo);
  }

  function addVideoControl(container, video) {
    const button = document.createElement('button');
    button.className = 'video-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Play product video');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML =
      '<svg class="icon-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.8a1 1 0 0 1 1.5-.86l7.2 4.2a1 1 0 0 1 0 1.72l-7.2 4.2A1 1 0 0 1 4 11.2z"/></svg>' +
      '<svg class="icon-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z"/></svg>';

    const update = () => {
      const playing = !video.paused && !video.ended;
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? 'Pause product video' : 'Play product video');
    };

    button.addEventListener('click', () => {
      if (video.paused) {
        video.preload = 'metadata';
        video.play().catch(update);
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', update);
    video.addEventListener('pause', update);
    container.appendChild(button);
    update();
  }

  function buildScreenMedia(cfg) {
    const sizesAttr = '(max-width: 400px) 78vw, (max-width: 760px) 56vw, 360px';
    const avifSrcset = cfg.avif.join(', ');
    const webpSrcset = cfg.webp.join(', ');

    const pic = document.createElement('picture');
    pic.innerHTML =
      '<source type="image/avif" srcset="' + avifSrcset + '" sizes="' + sizesAttr + '">' +
      '<source type="image/webp" srcset="' + webpSrcset + '" sizes="' + sizesAttr + '">' +
      '<img src="' + cfg.jpg + '" alt="" decoding="async" loading="lazy">';
    return pic;
  }

  document.querySelectorAll('.iphone').forEach(buildiPhone);

  /* ─────────────────────────────────────────────
     2. Autoplay feature videos when in view
     ───────────────────────────────────────────── */
  const videos = document.querySelectorAll('[data-autoplay]');
  if (videos.length && 'IntersectionObserver' in window) {
    const vObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !motionQuery.matches) {
          e.target.preload = 'metadata';
          e.target.play().catch(() => {});
        } else {
          e.target.pause();
        }
      });
    }, { threshold: 0.35 });
    videos.forEach((v) => vObs.observe(v));
  }

  motionQuery.addEventListener('change', (event) => {
    if (event.matches) videos.forEach((video) => video.pause());
  });
})();
