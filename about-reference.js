(() => {
  // Existing links to the experience chapter also reveal the preserved content.
  function revealChapter() {
    if (location.hash !== '#experience' && location.hash !== '#experience-content') return;
    const chapter = document.querySelector('.ab-background');
    chapter.open = true;
    requestAnimationFrame(() => chapter.scrollIntoView({block:'start'}));
  }
  revealChapter();
  addEventListener('hashchange', revealChapter);
})();

(() => {
  'use strict';
  const hero = document.querySelector('.ab-hero');
  const title = hero?.querySelector('h1');
  if (!title || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  const pending = new Set();
  let observer;
  let openingFinished = false;
  const ease = 'cubic-bezier(.16,1,.3,1)';

  function animate(node, frames, options) {
    const animation = node.animate(frames, options);
    active.add(animation);
    animation.finished.catch(() => {}).finally(() => active.delete(animation));
    return animation;
  }
  function finishOpening() {
    openingFinished = true;
    title.classList.remove('ab-assembling');
    title.querySelector('.ab-title-slats')?.remove();
    hero.classList.remove('ab-scanning');
  }
  function assembleTitle() {
    if (reduced.matches || scrollY > 32 || location.hash || document.hidden) return;
    const text = title.textContent;
    const ink = document.createElement('span');
    ink.className = 'ab-title-ink';
    ink.textContent = text;
    const slats = document.createElement('span');
    slats.className = 'ab-title-slats';
    slats.setAttribute('aria-hidden', 'true');
    title.replaceChildren(ink, slats);
    title.classList.add('ab-assembling');
    hero.classList.add('ab-scanning');
    const animations = [];
    for (let index = 0; index < 8; index++) {
      const slat = document.createElement('span');
      slat.className = 'ab-title-slat';
      slat.textContent = text;
      slat.style.clipPath = `inset(${index * 12.5}% 0 ${87.5 - index * 12.5}% 0)`;
      slats.append(slat);
      const direction = index % 2 ? 1 : -1;
      animations.push(animate(slat, [
        {transform:`translate(${direction * (30 + index * 8)}%,${direction * 12}px)`, opacity:0},
        {transform:`translate(${direction * 4}%,0)`, opacity:1, offset:.55},
        {transform:'translate(0,0)', opacity:1}
      ], {duration:950, delay:index * 42, easing:ease, fill:'backwards'}));
    }
    Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(finishOpening);
  }

  function reveal(node) {
    observer?.unobserve(node);
    pending.delete(node);
    node.classList.remove('ab-scroll-pending');
    node.dataset.abMotion = 'complete';
    if (reduced.matches || node.getBoundingClientRect().bottom < 0) return;
    const frames = node.matches('.ab-curious h2,.ab-contact h2')
      ? [{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}]
      : node.matches('.ab-pixels i,.ab-cross,.ab-dot')
        ? [{opacity:0,transform:'scale(.25)'},{opacity:1,transform:'scale(1)'}]
        : [{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}];
    animate(node, frames, {
      duration:560, delay:Number(node.dataset.abDelay || 0), easing:ease, fill:'backwards'
    });
  }
  function observeSections() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
    }, {threshold:0, rootMargin:'0px 0px -40px 0px'});
    const selectors = '.ab-curious h2,.ab-pixels i,.ab-cross,.ab-interests > h2,.ab-interests > ol > li,.ab-background > summary,.ab-archive-heading,.ab-archive-index,.ab-archive-documents,.ab-intro .ab-dot,.ab-contact h2,.ab-contact-copy,.ab-footer-layout';
    document.querySelectorAll(selectors).forEach(node => {
      // Leave restored scroll positions and deep-link destinations immediately readable.
      if (location.hash || node.getBoundingClientRect().bottom < 0) return;
      if (node.matches('.ab-interests > ol > li')) node.dataset.abDelay = [...node.parentElement.children].indexOf(node) * 65;
      if (node.matches('.ab-pixels i')) node.dataset.abDelay = [...node.parentElement.children].indexOf(node) * 75;
      node.classList.add('ab-scroll-pending');
      node.dataset.abMotion = 'pending';
      pending.add(node);
      observer.observe(node);
    });
  }

  function introTransition() {
    const stage = document.querySelector('.ab-intro-stage');
    const heading = stage?.querySelector('h2');
    if (!stage || reduced.matches || location.hash || scrollY > hero.offsetHeight * .7 || !('IntersectionObserver' in window)) return;
    const groups = [[]];
    [...heading.childNodes].forEach(node => node.nodeName === 'BR' ? groups.push([]) : groups.at(-1).push(node));
    heading.replaceChildren(...groups.map(nodes => {
      const line = document.createElement('span'), word = document.createElement('span');
      line.className = 'ab-intro-line'; word.className = 'ab-intro-word';
      word.append(...nodes); line.append(word); return line;
    }));
    const curtain = document.createElement('div');
    curtain.className = 'ab-intro-shutters'; curtain.setAttribute('aria-hidden', 'true');
    const panels = Array.from({length:8}, () => {
      const panel = document.createElement('span'); panel.className = 'ab-intro-shutter'; curtain.append(panel); return panel;
    });
    stage.append(curtain); stage.dataset.transition = 'armed';
    let fallback;
    const motions = [];
    const watcher = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) playTransition();
    }, {rootMargin:'0px 0px -15% 0px', threshold:0});
    function settleTransition() {
      watcher.disconnect(); clearTimeout(fallback);
      stage.dataset.transition = 'complete';
      motions.forEach(animation => animation.cancel()); curtain.remove();
    }
    function playTransition() {
      if (stage.dataset.transition !== 'armed') return;
      watcher.disconnect(); stage.dataset.transition = 'running'; stage.dataset.transitionCount = '1';
      panels.forEach((panel, index) => motions.push(animate(panel,
        [{transform:'translateY(102%)'},{transform:'translateY(0)'}],
        {duration:680,delay:Math.abs(index - 3.5)*65,easing:ease,fill:'backwards'})));
      heading.querySelectorAll('.ab-intro-word').forEach((word, index) => motions.push(animate(word,
        [{transform:`translate(${index%2 ? 10 : -10}%,110%)`},{transform:'translate(0,0)'}],
        {duration:620,delay:160+index*75,easing:ease,fill:'backwards'})));
      motions.push(animate(stage.querySelector('.ab-intro > p'),
        [{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:500,delay:400,easing:ease,fill:'backwards'}));
      Promise.all(motions.map(animation => animation.finished.catch(() => {}))).then(settleTransition);
      fallback = setTimeout(settleTransition, 1600);
    }
    watcher.observe(stage);
    stage.addEventListener('focusin', settleTransition, {once:true});
    reduced.addEventListener('change', event => { if (event.matches) settleTransition(); });
    addEventListener('pagehide', settleTransition, {once:true});
  }

  function settle() {
    observer?.disconnect();
    pending.forEach(node => { node.classList.remove('ab-scroll-pending'); node.dataset.abMotion = 'complete'; });
    pending.clear();
    active.forEach(animation => animation.cancel());
    finishOpening();
  }
  reduced.addEventListener('change', event => { if (event.matches) settle(); });
  // Scrolling away interrupts the entrance; it never holds the page in place.
  addEventListener('scroll', () => {
    if (!openingFinished && scrollY > hero.offsetHeight * .35) {
      title.querySelectorAll('.ab-title-slat').forEach(node => node.getAnimations().forEach(animation => animation.cancel()));
      finishOpening();
    }
  }, {passive:true});
  addEventListener('pagehide', settle);
  introTransition();
  observeSections();
  assembleTitle();
})();

/* Certificate index is a keyboard-operable, progressively enhanced tab set. */
(() => {
  const archive = document.querySelector('.ab-archive');
  if (!archive) return;
  const tabs = [...archive.querySelectorAll('.ab-archive-tab')];
  const panels = [...archive.querySelectorAll('.ab-archive-panel')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tablist = archive.querySelector('.ab-archive-tabs');
  let previewMotion;
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-orientation', 'vertical');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    tab.addEventListener('click', event => {
      // Tabs own this anchor; skip the site's generic smooth-scroll handler.
      event.preventDefault();
      event.stopImmediatePropagation();
      if (tab.getAttribute('aria-selected') !== 'true') select(index, true);
    }, {capture:true});
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); tabs[next].focus({preventScroll:true}); select(next, true);
    });
  });
  function select(index, motion) {
    previewMotion?.cancel();
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    const sheet = panels[index].querySelector('.ab-document-sheet');
    if (motion && !reduced.matches && sheet.animate) previewMotion = sheet.animate(
      [{clipPath:'inset(0 0 100% 0)',opacity:.4},{clipPath:'inset(0 0 0 0)',opacity:1}],
      {duration:360,easing:'steps(8,end)'});
  }
  const initial = panels.findIndex(panel => '#'+panel.id === location.hash);
  select(initial < 0 ? 0 : initial, false);
  archive.classList.add('ab-archive-enhanced');
  reduced.addEventListener('change', event => { if (event.matches) previewMotion?.cancel(); });
})();

/* Each opening typesets the records again; offscreen rows wait for their turn. */
(() => {
  const chapter = document.querySelector('#experience');
  const content = chapter?.querySelector('.ab-background-content');
  if (!content || !Element.prototype.animate || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  let observer;
  const ease = 'cubic-bezier(.16,.8,.2,1)';
  const records = [...content.querySelectorAll('.ab-record-group-title,.ab-record')];

  records.forEach(record => {
    if (record.matches('.ab-record-group-title')) return;
    const rule = document.createElement('i');
    rule.className = 'ab-record-rule';
    rule.setAttribute('aria-hidden', 'true');
    record.append(rule);
  });
  chapter.classList.add('ab-record-motion');

  function settle() {
    observer?.disconnect();
    active.forEach(animation => animation.cancel());
    active.clear();
  }
  function move(node, frames, duration, delay = 0) {
    if (!node) return;
    const animation = node.animate(frames, {duration, delay, easing:ease, fill:'backwards'});
    active.add(animation);
    animation.finished.catch(() => {}).finally(() => active.delete(animation));
  }
  function reveal(record, delay = 0) {
    observer?.unobserve(record);
    move(record.querySelector('.ab-record-rule'), [
      {transform:'scaleX(0)',opacity:.2}, {transform:'scaleX(1)',opacity:1}
    ], 680, delay);
    if (record.matches('.ab-record-group-title')) {
      move(record.querySelector('strong'), [{opacity:.2,transform:'translateY(24px)',clipPath:'inset(0 0 80% 0)'},{opacity:1,transform:'none',clipPath:'inset(0 0 0% 0)'}], 720, delay);
      return;
    }
    move(record.querySelector('.ab-record-date'), [
      {opacity:.15,transform:'translateX(-12px)'},{opacity:1,transform:'none'}
    ], 500, delay + 35);
    move(record.querySelector('.ab-record-role'), [
      {opacity:.2,transform:'translateY(18px)',clipPath:'inset(0 0 70% 0)'},
      {opacity:1,transform:'none',clipPath:'inset(0 0 0% 0)'}
    ], 650, delay + 75);
    move(record.querySelector('.ab-record-description'), [
      {opacity:.1,transform:'translateY(14px)'},{opacity:1,transform:'none'}
    ], 650, delay + 135);
  }
  function open() {
    settle();
    if (!chapter.open || reduced.matches) return;
    content.querySelectorAll('#experience-title').forEach((line, index) => {
      move(line, [
        {opacity:.2,transform:`translateX(${index ? 20 : -20}px)`},
        {opacity:1,transform:'none'}
      ], 620, index * 70);
    });
    observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => reveal(entry.target, Math.min(index * 70, 210)));
    }, {threshold:0, rootMargin:'0px 0px -24px 0px'});
    let index = 0;
    records.forEach(record => {
      const bounds = record.getBoundingClientRect();
      if (bounds.bottom > 48 && bounds.top < innerHeight - 24) reveal(record, 90 + index++ * 70);
      else if (bounds.bottom > 48) observer.observe(record);
    });
  }
  chapter.addEventListener('toggle', () => chapter.open ? open() : settle());
  // Focused links must always be completely visible, even during their entrance.
  content.addEventListener('focusin', () => active.forEach(animation => animation.finish()));
  reduced.addEventListener('change', () => reduced.matches ? settle() : open());
  addEventListener('pagehide', settle);
  addEventListener('pageshow', event => { if (event.persisted) open(); });
  if (chapter.open) open();
})();
