// Task 1: Synchronous theme init — runs in <head>, prevents FOUC.
// Reads localStorage first, falls back to cookie, then prefers-color-scheme.
// No writes here — only the user's toggle (in app.js) writes the preference.
(function(){
  function readCookie(n){return(document.cookie.match('(?:^|;)\\s*'+n+'=([^;]*)')||[])[1]||null}
  var t;
  try{t=localStorage.getItem('theme')}catch(e){}
  if(!t)t=readCookie('theme');
  if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.setAttribute('data-theme',t);
})();
