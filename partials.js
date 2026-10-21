/* ─── Single source of truth: nav + footer ───
   Six static HTML files with no build step previously hand-copied this
   markup — that's exactly how the Chatra link silently vanished from five
   of six footers. One template, injected at parse time, makes that class
   of drift structurally impossible. Runs synchronously (no defer/async) so
   it completes before app.js queries .apple-nav / #navBurger / #mobileMenu. */
(function () {
  'use strict';

  var page = (window.location.pathname.split('/').pop() || 'index.html');
  if (page === '') page = 'index.html';

  var LINKS = [
    ['index.html',   'Home'],
    ['projects.html', 'Projects'],
    ['about.html',   'About'],
    ['about.html#experience', 'Experience'],
    ['contact.html', 'Contact']
  ];
  var CV_HREF = 'Alimzhan_Galymzhan_Frontend_CV.pdf';

  function isActive(href) {
    return href === page;
  }

  function buildNav() {
    var navLinks = LINKS.filter(function (l) { return l[0] !== 'about.html#experience'; });
    var menuItems = navLinks.filter(function (l) { return l[0] !== 'contact.html'; }).map(function (l) {
      return '<li><a href="' + l[0] + '"' + (isActive(l[0]) ? ' class="active" aria-current="page"' : '') + '>' + l[1] + '</a></li>';
    }).join('');

    var mobileItems = navLinks.map(function (l) {
      return '<a href="' + l[0] + '"' + (isActive(l[0]) ? ' class="active" aria-current="page"' : '') + '>' + l[1] + '</a>';
    }).join('') + '<a href="' + CV_HREF + '" target="_blank" rel="noopener">CV</a>';

    return (
      '<a class="skip-link" href="#main-content">Skip to content</a>' +
      '<nav class="apple-nav" id="primary-nav" aria-label="Main navigation">' +
        '<div class="nav-inner">' +
        '<a class="nav-logo" href="index.html" aria-label="Alimzhan — home">Alimzhan</a>' +
        '<ul class="nav-menu">' + menuItems + '</ul>' +
        '<div class="nav-actions">' +
          '<a class="nav-cta" href="' + CV_HREF + '" target="_blank" rel="noopener">Résumé</a>' +
          '<a class="nav-cta nav-talk' + (isActive('contact.html') ? ' active' : '') + '" href="contact.html"' + (isActive('contact.html') ? ' aria-current="page"' : '') + '>Let’s talk <span aria-hidden="true"><svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="img/icons/ui.svg#arrow-up-right"></use></svg></span></a>' +
          '</div>' +
          '<button class="nav-burger" id="navBurger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>' +
        '</div>' +
      '</nav>' +
      '<nav class="nav-mobile" id="mobileMenu" aria-label="Mobile navigation" aria-hidden="true">' +
        mobileItems +
      '</nav>'
    );
  }

  function buildFooter() {
    var portfolioLinks = LINKS.map(function (l) {
      return '<a href="' + l[0] + '">' + l[1] + '</a>';
    }).join('');

    return (
      '<footer class="apple-footer" id="site-footer">' +
        '<div class="footer-links-row">' +
          '<div class="footer-col footer-col-intro"><div class="footer-col-title">Alimzhan</div><p class="footer-role">Frontend Developer · UI-Focused Engineer</p><p class="footer-note">Responsive product interfaces, interaction systems, and connected web experiences.</p></div>' +
          '<div class="footer-col"><div class="footer-col-title">Connect</div>' +
            '<a href="mailto:alimzhanart@icloud.com">Email</a>' +
            '<a href="' + CV_HREF + '" target="_blank" rel="noopener">CV</a>' +
            '<a href="https://github.com/whynicky19" target="_blank" rel="noopener noreferrer">GitHub</a>' +
            '<a href="https://t.me/whynickyy" target="_blank" rel="noopener noreferrer">Telegram</a>' +
          '</div>' +
          '<div class="footer-col"><div class="footer-col-title">Explore</div>' + portfolioLinks +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span class="footer-copy">Designed and built by Alimzhan · © 2026</span>' +
          '<div class="footer-bottom-links"><a href="contact.html">Contact</a></div>' +
        '</div>' +
      '</footer>'
    );
  }

  var navMount = document.getElementById('site-nav');
  if (navMount) navMount.outerHTML = buildNav();

  var footerMount = document.getElementById('site-footer');
  if (footerMount) footerMount.outerHTML = buildFooter();
})();
