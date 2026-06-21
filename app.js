

(function () {
  const root = document.documentElement;
  const btn  = document.getElementById('themeToggle');

  function lsGet()    { try { return localStorage.getItem('theme'); } catch(e) { return null; } }
  function lsSet(v)   { try { localStorage.setItem('theme', v); } catch(e) {} }
  function ckSet(v)   { document.cookie = 'theme=' + v + ';path=/;max-age=31536000;SameSite=Lax'; }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    lsSet(theme);
    ckSet(theme);
  }

  
  document.querySelectorAll('#themeToggle, #themeToggleMobile').forEach(function(b) {
    b.addEventListener('click', function() {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  });

  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!lsGet()) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });

  
  window.addEventListener('storage', e => {
    if (e.key === 'theme' && e.newValue) root.setAttribute('data-theme', e.newValue);
  });
})();

(function () {
  'use strict';

  
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);

  
  window.addEventListener('load', () => {
    overlay.style.opacity = '0';
  });

  
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http') || a.target === '_blank') return;
    e.preventDefault();
    overlay.style.opacity = '1';
    setTimeout(() => { window.location.href = href; }, 300);
  });

  
  const bar = document.querySelector('.scroll-bar');
  if (bar) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      if (open) mobileMenu.classList.add('open');
      else mobileMenu.classList.remove('open');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === 'index.html' && href === './') || href.includes(page)) {
      a.classList.add('active');
    }
  });

  
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.fade-up, .fade-in, .stagger, .slide-left, .slide-right, .scale-up, .clip-reveal').forEach(el => io.observe(el));

  
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    const suffix = el.dataset.suffix || '';
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => counterIO.observe(el));

  
  document.querySelectorAll('.rail-wrap').forEach(wrap => {
    let isDown = false, startX, scrollLeft;
    wrap.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.pageX - wrap.offsetLeft;
      scrollLeft = wrap.scrollLeft;
    });
    wrap.addEventListener('mouseleave', () => isDown = false);
    wrap.addEventListener('mouseup', () => isDown = false);
    wrap.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      wrap.scrollLeft = scrollLeft - (e.pageX - wrap.offsetLeft - startX) * 1.3;
    });
  });

  
  const sfItems = document.querySelectorAll('.sf-item[data-sf]');
  const sfVisuals = document.querySelectorAll('.sf-visual-item[data-sf]');
  if (sfItems.length && sfVisuals.length) {
    const sfIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = entry.target.dataset.sf;
          sfVisuals.forEach(v => v.classList.remove('active'));
          const vis = document.querySelector(`.sf-visual-item[data-sf="${idx}"]`);
          if (vis) vis.classList.add('active');
        }
      });
    }, { threshold: 0.5, rootMargin: '-10% 0px -10% 0px' });
    sfItems.forEach(el => sfIO.observe(el));
  }

  const heroText = document.querySelector('.hero-parallax');
  if (heroText && !window.matchMedia('(max-width: 768px)').matches) {
    window.addEventListener('scroll', () => {
      heroText.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    }, { passive: true });
  }

  
  const rippleCSS = document.createElement('style');
  rippleCSS.textContent = `
    @keyframes _ripple { to { transform:scale(1); opacity:0; } }
    .btn-primary { position:relative; overflow:hidden; }
    ._ripple-el {
      position:absolute; border-radius:50%; pointer-events:none;
      background:rgba(0,0,0,0.1);
      transform:scale(0); animation:_ripple .55s ease-out forwards;
    }
  `;
  document.head.appendChild(rippleCSS);

  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const el = document.createElement('span');
      el.className = '_ripple-el';
      el.style.width  = size + 'px';
      el.style.height = size + 'px';
      el.style.left   = (e.clientX - rect.left - size / 2) + 'px';
      el.style.top    = (e.clientY - rect.top  - size / 2) + 'px';
      this.appendChild(el);
      setTimeout(() => el.remove(), 600);
    });
  });

  
  const nav = document.querySelector('.apple-nav');
  const progressBar = document.querySelector('.scroll-progress');
  if (nav) {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y <= 80) {
        nav.style.transform = 'translateY(0)';
        nav.style.transition = 'transform .3s ease';
        if (progressBar) progressBar.classList.remove('nav-hidden');
      } else if (delta > 6) {
        nav.style.transform = 'translateY(-100%)';
        nav.style.transition = 'transform .3s ease';
        if (progressBar) progressBar.classList.add('nav-hidden');
        lastY = y;
      } else if (delta < -6) {
        nav.style.transform = 'translateY(0)';
        if (progressBar) progressBar.classList.remove('nav-hidden');
        lastY = y;
      }
      if (Math.abs(delta) > 6) lastY = y;
    }, { passive: true });
  }

  
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = document.querySelector('.apple-nav')?.offsetHeight || 48;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH - 12,
        behavior: 'smooth'
      });
    });
  });

  
  document.querySelectorAll('img').forEach(img => {
    if (!img.loading) img.loading = 'lazy';
  });

})();

(function () {
  const btn = document.createElement('button');
  btn.className = 'back-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V4M4 7l4-4 4 4"/></svg>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

(function () {
  'use strict';

  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;

  // Split .word-reveal elements into per-word <span class="wr-word"> spans,
  // preserving <br> and other inline elements.
  function splitWords(el) {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach(part => {
          if (/\S/.test(part)) {
            const s = document.createElement('span');
            s.className = 'wr-word';
            s.textContent = part;
            el.appendChild(s);
          } else if (part) {
            el.appendChild(document.createTextNode(part));
          }
        });
      } else {
        el.appendChild(node.cloneNode(true));
      }
    });
  }

  const wrEls = document.querySelectorAll('.word-reveal');
  const ssEls = isDesktop ? document.querySelectorAll('[data-scroll-scale]') : [];

  if (reduced) {
    wrEls.forEach(el => { splitWords(el); el.querySelectorAll('.wr-word').forEach(w => { w.style.opacity = '1'; }); });
    return;
  }

  wrEls.forEach(splitWords);

  function update() {
    const vh = window.innerHeight;

    wrEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      // progress 0→1 as element top moves from 82%vh to 24%vh
      const progress = Math.max(0, Math.min(1, (vh * 0.82 - rect.top) / (vh * 0.58)));
      const words = el.querySelectorAll('.wr-word');
      const n = words.length;
      words.forEach((w, i) => {
        const onset = n > 1 ? (i / (n - 1)) * 0.6 : 0;
        const wp    = Math.max(0, Math.min(1, (progress - onset) / 0.4));
        w.style.opacity = (0.15 + wp * 0.85).toFixed(3);
      });
    });

    ssEls.forEach(el => {
      const rect     = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (vh * 0.96 - rect.top) / (vh * 0.72)));
      el.style.transform = `scale(${(0.93 + progress * 0.07).toFixed(4)})`;
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  update();
})();
