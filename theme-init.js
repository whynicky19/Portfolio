

(function(){
  function readCookie(n){return(document.cookie.match('(?:^|;)\\s*'+n+'=([^;]*)')||[])[1]||null}
  var t;
  try{t=localStorage.getItem('theme')}catch(e){}
  if(!t)t=readCookie('theme');
  if(!t)t='light';
  document.documentElement.setAttribute('data-theme',t);
})();
