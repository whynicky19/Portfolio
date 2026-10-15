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
    /* Scroll scenes are driven by measured document ranges, not viewport
       entry events. One rAF writer updates compositor-friendly CSS variables;
       reversing the scroll reverses every scene without a second timeline. */
    function initScrollScenes() {
      const sceneElements = Array.from(document.querySelectorAll('[data-scroll-scene]'));
      if (!sceneElements.length) {
        return { request() {}, setReduced() {}, destroy() {} };
      }

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
      const clamp01 = (value) => clamp(value, 0, 1);
      const phase = (value, start, end) => clamp01((value - start) / (end - start));
      const smooth = (value) => value * value * (3 - (2 * value));
      const mix = (from, to, value) => from + ((to - from) * value);
      const setVar = (element, name, value, unit) => {
        element.style.setProperty(name, Number(value).toFixed(4) + (unit || ''));
      };

      const scenes = sceneElements.map((element) => {
        const type = element.dataset.scrollScene;
        return {
          element,
          type,
          driver: type.startsWith('project-')
            ? element.querySelector('.project-media-scroll') || element
            : element,
          copy: type === 'home-feature' ? element.querySelector('.work-copy') : null,
          words: type === 'chatra-quote'
            ? Array.from(element.querySelectorAll('.quote-word'))
            : [],
          bullets: type === 'chatra-classes'
            ? Array.from(element.querySelectorAll('.sticky-bullets li'))
            : [],
          top: 0,
          height: 1,
          lastProgress: -1
        };
      });

      let frame = 0;
      let measureFrame = 0;
      let viewportHeight = Math.max(window.innerHeight, 1);
      let viewportWidth = window.innerWidth;
      let resizeObserver = null;

      function renderHome(scene, progress, compact) {
        const element = scene.element;
        if (compact) {
          const visual = smooth(phase(progress, .02, .92));
          const copyIn = smooth(phase(progress, 0, .32));
          setVar(element, '--home-mobile-image-scale', mix(.96, 1, visual));
          setVar(element, '--home-mobile-image-y', mix(14, 0, visual), 'px');
          setVar(element, '--home-mobile-copy-opacity', mix(.84, 1, copyIn));
          setVar(element, '--home-mobile-copy-y', mix(10, 0, copyIn), 'px');
          scene.copy?.removeAttribute('inert');
          return;
        }

        const expansion = smooth(phase(progress, .02, .88));
        const copyOut = smooth(phase(progress, .2, .72));
        setVar(element, '--home-media-scale', mix(.64, 1, expansion));
        setVar(element, '--home-media-y', mix(14, 0, expansion), 'px');
        setVar(element, '--home-image-scale', mix(.94, 1, expansion));
        setVar(element, '--home-copy-opacity', 1 - copyOut);
        setVar(element, '--home-copy-x', mix(0, -30, copyOut), 'px');
        scene.copy?.toggleAttribute('inert', copyOut > .96);
      }

      function renderProject(scene, progress, compact) {
        const element = scene.element;
        const expansion = smooth(phase(progress, compact ? .02 : .03, compact ? .92 : .86));
        const isUrpaq = scene.type === 'project-urpaq';
        const outerScale = mix(compact ? .97 : (isUrpaq ? .975 : .94), 1, expansion);

        setVar(element, '--story-media-scale', outerScale);
        setVar(element, '--story-media-y', mix(compact ? 14 : (isUrpaq ? 18 : 30), 0, expansion), 'px');

        if (compact) {
          setVar(element, '--story-head-opacity', 1);
          setVar(element, '--story-head-y', 0, 'px');
          setVar(element, '--story-details-opacity', 1);
          setVar(element, '--story-details-y', 0, 'px');
        } else if (isUrpaq) {
          const headDrift = smooth(phase(progress, .5, .94));
          const detailsIn = smooth(phase(progress, .14, .5));
          setVar(element, '--story-head-opacity', 1 - (.14 * headDrift));
          setVar(element, '--story-head-y', mix(0, -10, headDrift), 'px');
          setVar(element, '--story-details-opacity', detailsIn);
          setVar(element, '--story-details-y', mix(22, 0, detailsIn), 'px');
        } else {
          const headOut = smooth(phase(progress, .12, .66));
          const detailsIn = smooth(phase(progress, .64, .96));
          setVar(element, '--story-head-opacity', 1 - (.38 * headOut));
          setVar(element, '--story-head-y', mix(0, -24, headOut), 'px');
          setVar(element, '--story-details-opacity', detailsIn);
          setVar(element, '--story-details-y', mix(26, 0, detailsIn), 'px');
        }

        if (scene.type === 'project-chatra') {
          setVar(element, '--chatra-card-phone-x', mix(-6, 0, expansion), '%');
          setVar(element, '--chatra-card-phone-y', mix(6, 0, expansion), '%');
          setVar(element, '--chatra-card-phone-rotate', mix(-2.2, 0, expansion), 'deg');
          setVar(element, '--chatra-card-phone-scale', mix(.88, 1, expansion));
          setVar(element, '--chatra-card-web-x', mix(6, 0, expansion), '%');
          setVar(element, '--chatra-card-web-y', mix(-4, 0, expansion), '%');
          setVar(element, '--chatra-card-web-rotate', mix(2, 0, expansion), 'deg');
          setVar(element, '--chatra-card-web-scale', mix(.91, 1, expansion));
        } else if (scene.type === 'project-soyle') {
          setVar(element, '--soyle-back-x', mix(6, 0, expansion), '%');
          setVar(element, '--soyle-back-y', mix(7, 0, expansion), '%');
          setVar(element, '--soyle-back-rotate', mix(4.5, 2.6, expansion), 'deg');
          setVar(element, '--soyle-back-scale', mix(.9, 1, expansion));
          setVar(element, '--soyle-front-x', mix(-6, 0, expansion), '%');
          setVar(element, '--soyle-front-y', mix(9, 0, expansion), '%');
          setVar(element, '--soyle-front-rotate', mix(-3.5, -1.2, expansion), 'deg');
          setVar(element, '--soyle-front-scale', mix(.92, 1, expansion));
        } else if (scene.type === 'project-urpaq') {
          const reveal = smooth(phase(progress, compact ? .02 : .08, compact ? .92 : .82));
          setVar(element, '--urpaq-image-scale', mix(compact ? .98 : .94, 1, reveal));
          setVar(element, '--urpaq-image-y', mix(compact ? 10 : 24, 0, reveal), 'px');
          setVar(element, '--urpaq-image-opacity', mix(.78, 1, reveal));
          setVar(element, '--urpaq-glow-scale', mix(.78, 1.08, reveal));
          setVar(element, '--urpaq-glow-opacity', mix(.26, .72, reveal));
        }
      }

      function renderQuote(scene, progress) {
        const count = Math.max(scene.words.length - 1, 1);
        scene.words.forEach((word, index) => {
          const start = .02 + ((index / count) * .68);
          const wordProgress = smooth(phase(progress, start, start + .2));
          setVar(word, '--quote-word-opacity', mix(.22, 1, wordProgress));
          setVar(word, '--quote-word-y', mix(14, 0, wordProgress), 'px');
        });
        const footProgress = smooth(phase(progress, .7, .96));
        setVar(scene.element, '--quote-foot-opacity', footProgress);
        setVar(scene.element, '--quote-foot-y', mix(16, 0, footProgress), 'px');
      }

      function renderClasses(scene, progress, compact) {
        const element = scene.element;
        const expansion = smooth(phase(progress, .03, compact ? .92 : .78));
        const copyIn = smooth(phase(progress, .04, compact ? .38 : .35));
        const copyOut = compact ? 0 : smooth(phase(progress, .74, 1));
        const phoneScale = mix(compact ? .92 : .78, 1, expansion);

        setVar(element, '--classes-phone-scale', phoneScale);
        setVar(element, '--classes-phone-y', mix(compact ? 18 : 52, 0, expansion), 'px');
        setVar(element, '--classes-phone-opacity', mix(.58, 1, smooth(phase(progress, .01, .22))));
        setVar(element, '--classes-copy-opacity', compact ? 1 : (mix(.42, 1, copyIn) * mix(1, .62, copyOut)));
        setVar(element, '--classes-copy-x', compact ? 0 : (mix(-30, 0, copyIn) - (14 * copyOut)), 'px');

        scene.bullets.forEach((bullet, index) => {
          const bulletProgress = compact
            ? 1
            : smooth(phase(progress, .18 + (index * .075), .43 + (index * .075)));
          setVar(bullet, '--classes-bullet-opacity', bulletProgress);
          setVar(bullet, '--classes-bullet-y', mix(12, 0, bulletProgress), 'px');
        });
      }

      function sceneProgress(scene, scrollTop) {
        const compact = viewportWidth <= (scene.type === 'chatra-classes' ? 1024 : 900);
        let start;
        let end;

        if (compact && scene.type !== 'chatra-quote') {
          start = scene.top - (viewportHeight * .86);
          end = scene.top + scene.height - (viewportHeight * .14);
        } else {
          const stickyOffset = scene.type.startsWith('project-') ? 20 : 0;
          start = scene.top - stickyOffset;
          end = scene.top + scene.height - viewportHeight + stickyOffset;
        }

        if (end <= start) end = start + Math.max(scene.height, viewportHeight * .65);
        return { compact, value: clamp01((scrollTop - start) / (end - start)) };
      }

      function update(force) {
        frame = 0;
        if (motionQuery.matches) return;
        const scrollTop = window.scrollY || window.pageYOffset;

        scenes.forEach((scene) => {
          const progressState = sceneProgress(scene, scrollTop);
          const progress = progressState.value;
          if (!force && Math.abs(progress - scene.lastProgress) < .001) return;
          scene.lastProgress = progress;
          setVar(scene.element, '--scroll-progress', progress);

          if (scene.type === 'home-feature') renderHome(scene, progress, progressState.compact);
          else if (scene.type.startsWith('project-')) renderProject(scene, progress, progressState.compact);
          else if (scene.type === 'chatra-quote') renderQuote(scene, progress);
          else if (scene.type === 'chatra-classes') renderClasses(scene, progress, progressState.compact);
        });
      }

      function requestUpdate(force) {
        if (frame) return;
        frame = requestAnimationFrame(() => update(Boolean(force)));
      }

      function measure() {
        measureFrame = 0;
        viewportHeight = Math.max(window.innerHeight, 1);
        viewportWidth = window.innerWidth;
        scenes.forEach((scene) => {
          const rect = scene.driver.getBoundingClientRect();
          scene.top = rect.top + (window.scrollY || window.pageYOffset);
          scene.height = Math.max(rect.height, 1);
          scene.lastProgress = -1;
        });
        update(true);
      }

      function requestMeasure() {
        if (measureFrame) return;
        measureFrame = requestAnimationFrame(measure);
      }

      function setReduced(reduced) {
        root.classList.toggle('scroll-scenes-ready', !reduced);
        scenes.forEach((scene) => scene.copy?.removeAttribute('inert'));
        if (!reduced) requestMeasure();
      }

      root.classList.toggle('scroll-scenes-ready', !motionQuery.matches);
      measure();
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestMeasure, { passive: true });
      window.addEventListener('orientationchange', requestMeasure, { passive: true });
      window.addEventListener('load', requestMeasure, { once: true });
      document.fonts?.ready.then(requestMeasure).catch(() => {});

      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(requestMeasure);
        scenes.forEach((scene) => resizeObserver.observe(scene.driver));
      }

      return {
        request: requestMeasure,
        setReduced,
        destroy() {
          if (frame) cancelAnimationFrame(frame);
          if (measureFrame) cancelAnimationFrame(measureFrame);
          resizeObserver?.disconnect();
          scenes.forEach((scene) => scene.copy?.removeAttribute('inert'));
        }
      };
    }

    const scrollScenes = initScrollScenes();
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
      .filter((element) => !element.closest(heroSelector) &&
        !element.closest('.chatra') && !element.closest('[data-scroll-scene]'));

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
    ].join(','))).filter((element) => !element.closest('[data-scroll-scene]')) : [];
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
    ].join(','))).filter((element) => !element.closest('[data-scroll-scene]'));
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
      scrollScenes.setReduced(event.matches);
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
      scrollScenes.request();
    });

    window.addEventListener('pagehide', () => {
      window.clearTimeout(revealFallback);
      if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
      scrollScenes.destroy();
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotionSystem, { once: true });
  } else {
    initMotionSystem();
  }
})();
