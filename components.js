/* Shared layout components — injected via JS */

function renderNav(activePage) {
  const pages = [
    { href: 'index.html',        label: 'Home' },
    { href: 'about.html',        label: 'About' },
    { href: 'projects.html',     label: 'Projects' },
    { href: 'experience.html',   label: 'Experience' },
    { href: 'contact.html',      label: 'Contact' },
  ];
  const links = pages.map(p =>
    `<li><a href="${p.href}"${p.href === activePage ? ' class="active"' : ''}>${p.label}</a></li>`
  ).join('');
  const mobileLinks = pages.map(p =>
    `<a href="${p.href}">${p.label}</a>`
  ).join('');

  return `
<nav class="apple-nav">
  <div class="nav-inner">
    <a class="nav-logo" href="index.html">Whynicky</a>
    <ul class="nav-menu">${links}</ul>
    <a class="nav-cta" href="contact.html">
      Say hello
      <svg viewBox="0 0 13 13" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12L12 1M4 1h8v8"/>
      </svg>
    </a>
    <button class="nav-burger" id="navBurger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<nav class="nav-mobile" id="mobileMenu">${mobileLinks}</nav>
<div class="scroll-progress"><div class="scroll-bar"></div></div>`;
}

function renderFooter() {
  return `
<footer class="apple-footer">
  <div class="footer-links-row">
    <div class="footer-col">
      <div class="footer-col-title">Portfolio</div>
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="projects.html">Projects</a>
      <a href="experience.html">Experience</a>
      <a href="contact.html">Contact</a>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Projects</div>
      <a href="projects.html#chatra">Chatra Academy</a>
      <a href="projects.html#portfolio">Portfolio Site</a>
      <a href="projects.html#api">FastAPI Template</a>
      <a href="projects.html#hackathon">Hackathon MVP</a>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Connect</div>
      <a href="mailto:your@email.com">Email</a>
      <a href="https://github.com/whynicky" target="_blank">GitHub</a>
      <a href="https://linkedin.com/in/whynicky" target="_blank">LinkedIn</a>
      <a href="https://t.me/whynicky" target="_blank">Telegram</a>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Resources</div>
      <a href="#" target="_blank">Resume (PDF)</a>
      <a href="https://github.com/whynicky" target="_blank">Open Source</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">Copyright © 2025 Whynicky. All rights reserved.</span>
    <div class="footer-bottom-links">
      <a href="contact.html">Contact</a>
      <a href="#">Privacy</a>
    </div>
  </div>
</footer>`;
}
