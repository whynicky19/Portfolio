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
    ['index.html',   'Work'],
    ['projects.html', 'Projects'],
    ['about.html',   'About'],
    ['contact.html', 'Contact']
  ];

  function isActive(href) { return href === page; }

  function themeIcons(size) {
    return (
      '<svg class="icon-sun" aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' +
      '<svg class="icon-moon" aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    );
  }

  function buildNav() {
    var menuItems = LINKS.map(function (l) {
      return '<li><a href="' + l[0] + '"' + (isActive(l[0]) ? ' class="active"' : '') + '>' + l[1] + '</a></li>';
    }).join('');

    var mobileItems = LINKS.map(function (l) {
      return '<a href="' + l[0] + '"' + (isActive(l[0]) ? ' class="active"' : '') + '>' + l[1] + '</a>';
    }).join('');

    return (
      '<nav class="apple-nav">' +
        '<div class="nav-inner">' +
          '<a class="nav-logo" href="index.html">Whynicky</a>' +
          '<ul class="nav-menu">' + menuItems + '</ul>' +
          '<div class="nav-actions">' +
            '<button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">' + themeIcons(15) + '</button>' +
          '</div>' +
          '<button class="nav-burger" id="navBurger" aria-label="Menu"><span></span><span></span><span></span></button>' +
        '</div>' +
      '</nav>' +
      '<nav class="nav-mobile" id="mobileMenu">' +
        mobileItems +
        '<button class="theme-toggle-mobile" id="themeToggleMobile" aria-label="Toggle dark mode">' + themeIcons(20) + 'Appearance</button>' +
      '</nav>'
    );
  }

  function buildFooter() {
    var portfolioLinks = LINKS.map(function (l) {
      return '<a href="' + l[0] + '">' + l[1] + '</a>';
    }).join('');

    return (
      '<footer class="apple-footer">' +
        '<div class="footer-links-row">' +
          '<div class="footer-col"><div class="footer-col-title">Portfolio</div>' + portfolioLinks + '</div>' +
          '<div class="footer-col"><div class="footer-col-title">Connect</div>' +
            '<a href="mailto:alimzhanart@icloud.com">Email</a>' +
            '<a href="https://github.com/whynicky19" target="_blank">GitHub</a>' +
            '<a href="https://t.me/whynicky" target="_blank">Telegram</a>' +
          '</div>' +
          '<div class="footer-col"><div class="footer-col-title">Resources</div>' +
            '<a href="https://github.com/whynicky19" target="_blank">Open Source</a>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span class="footer-copy">Copyright © 2026 Whynicky. All rights reserved.</span>' +
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
