/* Shared interaction layer: theme, navigation and small UI states. */
(function () {
  'use strict';

  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const nav = document.querySelector('.apple-nav');

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function setTheme(theme, persist) {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    root.style.colorScheme = next;
    if (persist) {
      storageSet('theme', next);
      document.cookie = 'theme=' + next + ';path=/;max-age=31536000;SameSite=Lax';
    }

    document.querySelectorAll('#themeToggle, #themeToggleMobile').forEach((button) => {
      const isDark = next === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Use light appearance' : 'Use dark appearance');
    });
  }

  document.querySelectorAll('#themeToggle, #themeToggleMobile').forEach((button) => {
    button.addEventListener('click', () => {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });
  setTheme(root.getAttribute('data-theme'), false);

  systemThemeQuery.addEventListener('change', (event) => {
    if (!storageGet('theme')) setTheme(event.matches ? 'dark' : 'light', false);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'theme' && (event.newValue === 'light' || event.newValue === 'dark')) {
      setTheme(event.newValue, false);
    }
  });

  /* Accessible mobile navigation. */
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const pageRegions = Array.from(document.querySelectorAll('main, #site-footer, body.chatra > section'));
  let menuReturnFocus = null;

  function menuFocusable() {
    return mobileMenu
      ? Array.from(mobileMenu.querySelectorAll('a[href], button:not([disabled])'))
      : [];
  }

  function setMenu(open, restoreFocus) {
    if (!burger || !mobileMenu) return;
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    pageRegions.forEach((region) => {
      if (open) region.setAttribute('inert', '');
      else region.removeAttribute('inert');
    });

    if (open) {
      menuReturnFocus = document.activeElement;
      if (nav) nav.style.transform = 'translateY(0)';
      requestAnimationFrame(() => menuFocusable()[0]?.focus());
    } else if (restoreFocus && menuReturnFocus instanceof HTMLElement) {
      menuReturnFocus.focus();
    }
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true', true));
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false, false));
    });
    mobileMenu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(false, true);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = menuFocusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setMenu(false, true);
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
      if (event.matches) setMenu(false, false);
    });
  }

  /* Counters are informational first; animation is a brief enhancement. */
  function animateCounter(element) {
    const target = Number.parseInt(element.dataset.target, 10);
    if (Number.isNaN(target)) return;
    const suffix = element.dataset.suffix || '';
    if (motionQuery.matches) {
      element.textContent = target + suffix;
      return;
    }
    const start = performance.now();
    const duration = 700;
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (window.PortfolioUtils) {
    window.PortfolioUtils.onIntersect('[data-target]', animateCounter, { threshold: 0.5 });
  }

  /* Keep navigation material responsive without hiding the way out. */
  const updateNavGlass = window.Components?.initGlassNav(nav) || function () {};
  const updateChrome = window.PortfolioUtils?.rafThrottle
    ? window.PortfolioUtils.rafThrottle(() => updateNavGlass(window.scrollY))
    : () => updateNavGlass(window.scrollY);
  window.addEventListener('scroll', updateChrome, { passive: true });
  updateChrome();

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight || 48) - 12;
      if (anchor.classList.contains('skip-link')) {
        window.scrollTo({ top, behavior: 'auto' });
        target.focus({ preventScroll: true });
        return;
      }
      window.scrollTo({ top, behavior: motionQuery.matches ? 'auto' : 'smooth' });
    });
  });

  document.querySelectorAll('img').forEach((image) => {
    if (!image.loading && image.getAttribute('fetchpriority') !== 'high') image.loading = 'lazy';
    if (!image.decoding) image.decoding = 'async';
  });

  /* Apple-style editorial rails: native momentum, one deliberate resting point. */
  document.querySelectorAll('[data-snap-gallery]').forEach((gallery) => {
    const track = gallery.querySelector('[data-snap-track]');
    const slides = Array.from(gallery.querySelectorAll('[data-snap-slide]'));
    const previous = gallery.querySelector('[data-snap-prev]');
    const next = gallery.querySelector('[data-snap-next]');
    const status = gallery.querySelector('[data-snap-status]');
    if (!track || !slides.length || !previous || !next) return;

    let activeIndex = 0;
    let scrollFrame = 0;
    let settleTimer = 0;

    function snapEdge() {
      const styles = getComputedStyle(track);
      return track.getBoundingClientRect().left + (Number.parseFloat(styles.scrollPaddingLeft) || 0);
    }

    function nearestIndex() {
      const edge = snapEdge();
      return slides.reduce((closest, slide, index) => {
        const distance = Math.abs(slide.getBoundingClientRect().left - edge);
        return distance < closest.distance ? { index, distance } : closest;
      }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
    }

    function updateGallery(index) {
      activeIndex = Math.max(0, Math.min(index, slides.length - 1));
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === slides.length - 1;
      slides.forEach((slide, slideIndex) => {
        slide.toggleAttribute('data-active', slideIndex === activeIndex);
      });
      if (status) status.textContent = (activeIndex + 1) + ' of ' + slides.length;
    }

    function targetLeft(slide) {
      const styles = getComputedStyle(track);
      const padding = Number.parseFloat(styles.scrollPaddingLeft) || 0;
      const trackLeft = track.getBoundingClientRect().left;
      return track.scrollLeft + slide.getBoundingClientRect().left - trackLeft - padding;
    }

    function goTo(index, behavior) {
      const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
      track.scrollTo({
        left: targetLeft(slides[safeIndex]),
        behavior: behavior || (motionQuery.matches ? 'auto' : 'smooth')
      });
      updateGallery(safeIndex);
    }

    function settle() {
      const index = nearestIndex();
      const distance = Math.abs(slides[index].getBoundingClientRect().left - snapEdge());
      updateGallery(index);
      if (distance > 2) goTo(index);
    }

    previous.addEventListener('click', () => goTo(nearestIndex() - 1));
    next.addEventListener('click', () => goTo(nearestIndex() + 1));

    track.addEventListener('keydown', (event) => {
      if (event.target !== track) return;
      let index;
      if (event.key === 'ArrowRight') index = nearestIndex() + 1;
      if (event.key === 'ArrowLeft') index = nearestIndex() - 1;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = slides.length - 1;
      if (index === undefined) return;
      event.preventDefault();
      goTo(index);
    });

    track.addEventListener('scroll', () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => updateGallery(nearestIndex()));
      if (!('onscrollend' in window)) {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settle, 140);
      }
    }, { passive: true });

    if ('onscrollend' in window) track.addEventListener('scrollend', settle);
    window.addEventListener('resize', () => updateGallery(nearestIndex()), { passive: true });
    updateGallery(0);
  });

  /* Keyboard-complete capability tabs retained with quieter presentation. */
  const skillExplorer = document.querySelector('[data-skill-explorer]');
  if (skillExplorer) {
    const skillData = {
      native:  { title: 'Native iOS', copy: 'Swift, SwiftUI, UIKit and the platform conventions that make an app feel at home on iPhone.', tools: ['Swift', 'SwiftUI', 'UIKit', 'Xcode'] },
      product: { title: 'Product design', copy: 'Clear flows, strong hierarchy and prototypes that turn an idea into something people can understand and use.', tools: ['Figma', 'HIG', 'Typography', 'Prototyping'] },
      backend: { title: 'Connected systems', copy: 'The services and interfaces behind a complete product, from a typed API to production data.', tools: ['Python', 'FastAPI', 'PostgreSQL', 'REST'] },
      ai:      { title: 'Applied AI', copy: 'Focused AI experiences designed around context, usefulness and clear human control.', tools: ['LLM', 'Prompting', 'RAG', 'Evaluation'] }
    };
    const stage = skillExplorer.querySelector('.skill-stage');
    const title = skillExplorer.querySelector('[data-skill-title]');
    const copy = skillExplorer.querySelector('[data-skill-copy]');
    const tools = skillExplorer.querySelector('[data-skill-tools]');
    const tabs = Array.from(skillExplorer.querySelectorAll('.skill-tab'));

    function activateSkill(tab, moveFocus) {
      const data = skillData[tab.dataset.skill];
      if (!data) return;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      if (moveFocus) tab.focus();
      stage.setAttribute('aria-labelledby', tab.id);
      skillExplorer.dataset.activeSkill = tab.dataset.skill;
      title.textContent = data.title;
      copy.textContent = data.copy;
      tools.replaceChildren(...data.tools.map((tool) => {
        const item = document.createElement('li');
        item.textContent = tool;
        return item;
      }));
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateSkill(tab, false));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        activateSkill(tabs[next], true);
      });
    });
  }

  /* ── Shared motion direction ──────────────────────────────────────────
     One observer handles narrative reveals across the static pages. The
     hidden state is attached here (never in the HTML), and a fallback timer
     always restores every item. This keeps the site readable without JS and
     safe when a page is restored from the back/forward cache. */
  function initMotionSystem() {
    const revealSelector = [
      '.fade-up', '.fade-in', '.slide-left', '.slide-right', '.scale-up',
      '.clip-reveal', '.word-reveal', '.stagger', '.depth-stagger',
      '.motion-auto', '.motion-stagger'
    ].join(',');
    const heroSelector = '.home-hero, .projects-hero, .page-hero, .scene-hero';

    document.querySelectorAll([
      '.editorial-gallery-head',
      '.editorial-card',
      '.projects-tier',
      '.project-details',
      '.about-copy',
      '.contact-fit-inner',
      '.case-facts'
    ].join(',')).forEach((element) => element.classList.add('motion-auto'));

    document.querySelectorAll('.project-facts, .proof-rail').forEach((element) => {
      element.classList.add('motion-stagger');
    });

    const targets = Array.from(document.querySelectorAll(revealSelector))
      .filter((element) => !element.closest(heroSelector) && !element.closest('.chatra'));

    function reveal(element) {
      element.classList.add('is-visible');
      window.setTimeout(() => {
        element.classList.remove('reveal-pending', 'is-visible');
      }, 1100);
    }

    targets.forEach((element) => {
      Array.from(element.children).forEach((child, index) => {
        child.style.setProperty('--stagger-index', String(Math.min(index, 8)));
      });

      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) return;
      element.classList.add('reveal-pending');
    });

    const pending = targets.filter((element) => element.classList.contains('reveal-pending'));
    let revealObserver = null;
    if ('IntersectionObserver' in window && pending.length && !motionQuery.matches) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
      pending.forEach((element) => revealObserver.observe(element));
    } else {
      pending.forEach(reveal);
    }

    /* Existing Chatra scenes already define their exact line-by-line timing.
       Arm those styles only after the observer is ready. */
    const chatra = document.body.classList.contains('chatra') ? document.body : null;
    const chatraTargets = chatra ? Array.from(document.querySelectorAll([
      '.scene-h', '.quote-body', '.meet-stage', '.subjects-phone', '.ai-stage',
      '.themes-card', '.tools-list', '.shipped-row'
    ].join(','))) : [];
    let chatraObserver = null;

    if (chatraTargets.length && 'IntersectionObserver' in window && !motionQuery.matches) {
      chatraObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          chatraObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

      chatraTargets.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) element.classList.add('in-view');
        chatraObserver.observe(element);
      });
      chatra.classList.add('chatra-motion');
    } else {
      chatraTargets.forEach((element) => element.classList.add('in-view'));
    }

    /* A restrained, scroll-linked depth pass for real product imagery. It is
       desktop-only, touches transform variables only, and tracks just the
       elements currently near the viewport. */
    const parallaxTargets = Array.from(document.querySelectorAll([
      '.work-media img',
      '.work-card-media img',
      '.editorial-card-media img',
      '.project-media > img',
      '.project-media > picture > img',
      '.chatra .iphone-frame'
    ].join(',')));
    const activeParallax = new Set();
    let parallaxFrame = 0;
    let parallaxObserver = null;

    function clearParallax() {
      parallaxTargets.forEach((element) => {
        element.classList.remove('motion-parallax');
        element.style.removeProperty('--motion-y');
        element.style.removeProperty('--motion-scale');
      });
    }

    function parallaxEnabled() {
      return !motionQuery.matches && window.innerWidth >= 900 &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }

    function updateParallax() {
      parallaxFrame = 0;
      if (!parallaxEnabled()) {
        clearParallax();
        return;
      }
      const viewport = window.innerHeight;
      activeParallax.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const range = viewport / 2 + rect.height / 2;
        const progress = Math.max(-1, Math.min(1, (center - viewport / 2) / range));
        const y = progress * -12;
        const scale = 1.014 + (1 - Math.abs(progress)) * 0.01;
        element.style.setProperty('--motion-y', y.toFixed(2) + 'px');
        element.style.setProperty('--motion-scale', scale.toFixed(4));
      });
    }

    function requestParallax() {
      if (parallaxFrame) return;
      parallaxFrame = requestAnimationFrame(updateParallax);
    }

    if (parallaxTargets.length && 'IntersectionObserver' in window) {
      parallaxObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('motion-parallax');
            activeParallax.add(entry.target);
          } else {
            activeParallax.delete(entry.target);
            entry.target.classList.remove('motion-parallax');
          }
        });
        requestParallax();
      }, { rootMargin: '35% 0px 35% 0px' });
      parallaxTargets.forEach((element) => parallaxObserver.observe(element));
      window.addEventListener('scroll', requestParallax, { passive: true });
      window.addEventListener('resize', requestParallax, { passive: true });
      requestParallax();
    }

    const revealFallback = window.setTimeout(() => {
      targets.forEach(reveal);
      chatraTargets.forEach((element) => element.classList.add('in-view'));
    }, 4500);

    function motionPreferenceChanged(event) {
      root.classList.toggle('motion-ok', !event.matches);
      if (!event.matches) {
        requestParallax();
        return;
      }
      targets.forEach(reveal);
      chatraTargets.forEach((element) => element.classList.add('in-view'));
      clearParallax();
    }
    motionQuery.addEventListener('change', motionPreferenceChanged);

    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) return;
      targets.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) reveal(element);
      });
      requestParallax();
    });

    window.addEventListener('pagehide', () => {
      window.clearTimeout(revealFallback);
      if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotionSystem, { once: true });
  } else {
    initMotionSystem();
  }
})();
