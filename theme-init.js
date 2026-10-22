

(function () {
  var root = document.documentElement;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Added before the body is parsed so entrance motion can start without a
     flash of already-rendered content. Content never depends on this class:
     scroll reveals are armed later, element by element, by app.js. */
  root.classList.add('js');
  if (!motionQuery.matches) root.classList.add('motion-ok');

  // The portfolio always uses light appearance, independent of OS or storage.
  root.setAttribute('data-theme', 'light');
  root.style.colorScheme = 'light';
})();
