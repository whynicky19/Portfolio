

(function () {
  function readCookie(name) {
    return (document.cookie.match('(?:^|;)\\s*' + name + '=([^;]*)') || [])[1] || null;
  }

  var saved;
  try { saved = localStorage.getItem('theme'); } catch (_) {}
  if (!saved) saved = readCookie('theme');

  var theme = saved === 'light' || saved === 'dark'
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
})();
