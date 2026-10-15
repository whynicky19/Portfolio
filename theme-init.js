

(function () {
  var root = document.documentElement;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Added before the body is parsed so entrance motion can start without a
     flash of already-rendered content. Content never depends on this class:
     scroll reveals are armed later, element by element, by app.js. */
  root.classList.add('js');
  if (!motionQuery.matches) root.classList.add('motion-ok');

  function readCookie(name) {
    return (document.cookie.match('(?:^|;)\\s*' + name + '=([^;]*)') || [])[1] || null;
  }

  var saved;
  try { saved = localStorage.getItem('theme'); } catch (_) {}
  if (!saved) saved = readCookie('theme');

  var theme = saved === 'light' || saved === 'dark'
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
})();
