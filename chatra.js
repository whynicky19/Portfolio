/* ═══════════════════════════════════════════════════════════════
   CHATRA — page logic
   - Builds real iPhone mockups from the .iphone containers
   - Scroll-driven reveals
   - Soft parallax on the hero product
   - Autoplay feature videos when they enter the viewport
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const REDUCE_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
     2. Scroll reveals
     ───────────────────────────────────────────── */
  const REVEAL_SELECTOR =
    '.scene-h, .meet-stage, .arch-stack, .arch-layer, .shipped-row, .shipped-cell, ' +
    '.subjects-phone, .themes-card, .quote-body, .tools-list, .ai-stage';

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => el.classList.add('in-view'));
  }

  /* ─────────────────────────────────────────────
     3. Parallax — hero product only (subtle, single element)
     ───────────────────────────────────────────── */
  if (!REDUCE_MOTION) {
    const heroProduct = document.querySelector('.hero-product');
    if (heroProduct) {
      let raf = 0;
      const depth = parseFloat(heroProduct.dataset.parallax || '0.05');
      let targetY = 0, currentY = 0;

      const onScroll = () => {
        const rect = heroProduct.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        targetY = -center * depth;
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const tick = () => {
        currentY += (targetY - currentY) * 0.12;
        heroProduct.style.transform = 'translateY(' + currentY.toFixed(2) + 'px)';
        if (Math.abs(targetY - currentY) > 0.1) {
          raf = requestAnimationFrame(tick);
        } else {
          heroProduct.style.transform = 'translateY(' + targetY.toFixed(2) + 'px)';
          raf = 0;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  /* ─────────────────────────────────────────────
     4. Autoplay feature videos when in view
     ───────────────────────────────────────────── */
  const videos = document.querySelectorAll('[data-autoplay]');
  if (videos.length && 'IntersectionObserver' in window) {
    const vObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.play().catch(() => {});
        } else {
          e.target.pause();
          try { e.target.currentTime = 0; } catch (_) {}
        }
      });
    }, { threshold: 0.35 });
    videos.forEach((v) => vObs.observe(v));
  }
})();