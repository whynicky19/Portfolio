

(function(){
  function readCookie(n){return(document.cookie.match('(?:^|;)\\s*'+n+'=([^;]*)')||[])[1]||null}
  var t;
  try{t=localStorage.getItem('theme')}catch(e){}
  if(!t)t=readCookie('theme');
  if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.setAttribute('data-theme',t);
})();
