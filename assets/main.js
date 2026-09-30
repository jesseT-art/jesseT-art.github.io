(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- 主题（默认深色） ---------- */
  try {
    var saved = localStorage.getItem('tj-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}
  if (!root.getAttribute('data-theme')) root.setAttribute('data-theme', 'dark');

  /* ---------- 性能兜底 ---------- */
  try {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    var lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
    if (reduced || lowCores || lowMem) root.classList.add('no-motion');
  } catch (e) {}
  var noMotion = root.classList.contains('no-motion');

  document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;

    /* ---------- 主题切换 ---------- */
    var toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('tj-theme', next); } catch (e) {}
      });
    }

    /* ---------- 加载动画 + 首屏入场 ---------- */
    var loader = document.querySelector('.loader');
    var seen = false;
    try {
      seen = !!sessionStorage.getItem('tj-loaded');
      sessionStorage.setItem('tj-loaded', '1');
    } catch (e) {}

    function heroIn() {
      var masks = document.querySelectorAll('.hero .mask');
      Array.prototype.forEach.call(masks, function (m, i) {
        setTimeout(function () { m.classList.add('in'); }, noMotion ? 0 : i * 140);
      });
      var rest = document.querySelectorAll('.hero .reveal');
      Array.prototype.forEach.call(rest, function (r, i) {
        setTimeout(function () { r.classList.add('in'); }, noMotion ? 0 : 320 + i * 120);
      });
    }

    function finish() {
      body.classList.add('ready');
      heroIn();
    }

    if (noMotion || seen) {
      if (loader) loader.style.display = 'none';
      finish();
    } else {
      window.setTimeout(function () {
        if (loader) loader.classList.add('done');
        finish();
        window.setTimeout(function () { if (loader) loader.style.display = 'none'; }, 1100);
      }, 1250);
    }

    /* ---------- 页面过渡 ---------- */
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
      if (a.host && a.host !== location.host) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      body.classList.add('leaving');
      window.setTimeout(function () { location.href = a.href; }, noMotion ? 0 : 330);
    });

    /* ---------- 滚动进度 ---------- */
    var bar = document.querySelector('.progress');
    function progress() {
      if (!bar) return;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY || document.documentElement.scrollTop;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      var nav = document.querySelector('.nav');
      if (nav) nav.classList.toggle('scrolled', y > 40);
    }

    /* ---------- 出场动画 ---------- */
    var anims = Array.prototype.slice.call(
      document.querySelectorAll('.reveal, .img-in, .mask')
    ).filter(function (el) { return !el.closest('.hero'); });
    function inView(el) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh * 0.92 && r.bottom > -vh * 0.08;
    }
    function show(el) { el.classList.add('in'); }
    if (!noMotion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -5% 0px' });
      anims.forEach(function (el) { io.observe(el); });
    } else {
      anims.forEach(show);
    }

    /* ---------- 视差 ---------- */
    var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var ticking = false;
    function parity() {
      ticking = false;
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) return;
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.07;
        var limit = parseFloat(el.getAttribute('data-limit')) || 30;
        var center = r.top + r.height / 2 - vh / 2;
        var shift = Math.max(-limit, Math.min(limit, -center * speed));
        el.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
      });
    }

    function onScroll() {
      progress();
      if (!noMotion && parallaxEls.length && !ticking) {
        ticking = true;
        window.requestAnimationFrame(parity);
      }
      if (!noMotion) {
        anims.forEach(function (el) { if (!el.classList.contains('in') && inView(el)) show(el); });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    window.addEventListener('load', onScroll);

    /* ---------- 灯箱 ---------- */
    var gallery = Array.prototype.slice.call(document.querySelectorAll('.shot img, .work-media img'));
    if (gallery.length) {
      var box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML =
        '<button class="lb-btn lb-close" aria-label="Close">×</button>' +
        '<button class="lb-btn lb-prev" aria-label="Prev">‹</button>' +
        '<img alt="">' +
        '<button class="lb-btn lb-next" aria-label="Next">›</button>';
      document.body.appendChild(box);
      var boxImg = box.querySelector('img');
      var cur = 0;
      function open(i) {
        cur = (i + gallery.length) % gallery.length;
        boxImg.src = gallery[cur].currentSrc || gallery[cur].src;
        boxImg.alt = gallery[cur].alt || '';
        box.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function close() {
        box.classList.remove('open');
        document.body.style.overflow = '';
      }
      gallery.forEach(function (img, i) {
        img.addEventListener('click', function () { open(i); });
      });
      box.querySelector('.lb-close').addEventListener('click', close);
      box.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); open(cur - 1); });
      box.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); open(cur + 1); });
      box.addEventListener('click', function (e) { if (e.target === box) close(); });
      document.addEventListener('keydown', function (e) {
        if (!box.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') open(cur - 1);
        else if (e.key === 'ArrowRight') open(cur + 1);
      });
    }
  });
})();
