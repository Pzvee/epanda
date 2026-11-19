// E-panda Racing Team — Shared JavaScript v5
// Performance-optimized: passive listeners, requestIdleCallback, transforms only

document.addEventListener('DOMContentLoaded', () => {
  // Mark JS as ready (reveal fallback watchdog in each page <head>)
  window.__epandaReady = true;
  if (!window.__epandaFallback) document.documentElement.classList.add('js');

  // ── Mobile nav toggle ──
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.classList.toggle('active');
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav')) {
        links.classList.remove('open');
        toggle.classList.remove('active');
      }
    });
    // Close on nav link click (for mobile)
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  }

  // ── Navbar scroll shadow ──
  const nav = document.querySelector('.nav');
  if (nav) {
    const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  // ── Back to top button ──
  const backBtn = document.querySelector('.back-top');
  if (backBtn) {
    window.addEventListener('scroll', () => {
      backBtn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Active nav link (based on current page) ──
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
    else a.classList.remove('active');
  });

  // ── Page enter animation ──
  const main = document.querySelector('main');
  if (main) main.classList.add('page-enter');

  // ── Scroll-reveal with IntersectionObserver ──
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // ── Lazy image loaded class ──
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
    }
  });

  // ── Spotlight cursor effect on premium surfaces ──
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card, .sponsor-card, .contact-card').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // ── Service worker: keep pages available on weak mobile networks ──
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }, { once: true });
  }
});

// ── Lightbox (module pattern) ──
const lightbox = {
  images: [],
  index: 0,
  lastFocus: null,

  open(srcs, idx) {
    if (!srcs || !srcs.length) return;
    this.images = srcs;
    this.index = Math.min(Math.max(idx || 0, 0), srcs.length - 1);
    this.update();
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    this.lastFocus = document.activeElement;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
    const closeBtn = lb.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  },

  close() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.classList.remove('active');
    document.body.style.overflow = '';
    if (this.lastFocus && typeof this.lastFocus.focus === 'function') {
      this.lastFocus.focus();
    }
  },

  prev() {
    if (this.index > 0) {
      this.index--;
      this.update();
    }
  },

  next() {
    if (this.index < this.images.length - 1) {
      this.index++;
      this.update();
    }
  },

  update() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    const img = lb.querySelector('#lb-img');
    const nav = lb.querySelector('#lb-nav');
    const count = lb.querySelector('.lightbox-count');
    const prevBtn = lb.querySelector('.lightbox-prev');
    const nextBtn = lb.querySelector('.lightbox-next');
    const n = this.images.length;
    const caption = `照片 ${this.index + 1} / ${n}`;
    if (img) {
      img.src = this.images[this.index];
      img.alt = caption;
    }
    if (nav) nav.textContent = caption;
    if (count && !count.textContent.trim()) count.textContent = '点击空白处关闭';
    if (prevBtn) prevBtn.disabled = this.index <= 0;
    if (nextBtn) nextBtn.disabled = this.index >= n - 1;
  }
};

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('active')) return;
  switch (e.key) {
    case 'Escape':    lightbox.close(); break;
    case 'ArrowLeft': lightbox.prev(); e.preventDefault(); break;
    case 'ArrowRight':lightbox.next(); e.preventDefault(); break;
  }
});

// Bind lightbox button controls
document.querySelector('.lightbox-prev')?.addEventListener('click', (e) => {
  e.stopPropagation();
  lightbox.prev();
});
document.querySelector('.lightbox-next')?.addEventListener('click', (e) => {
  e.stopPropagation();
  lightbox.next();
});

// Click backdrop or close button to close
document.getElementById('lightbox')?.addEventListener('click', function(e) {
  if (e.target === this || e.target.classList.contains('lightbox-close')) {
    lightbox.close();
  }
});

// Touch swipe support for lightbox on mobile
(function() {
  let touchStartX = 0;
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  lb.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lb.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      diff > 0 ? lightbox.next() : lightbox.prev();
    }
  });
})();
