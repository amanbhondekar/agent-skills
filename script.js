(function () {
  'use strict';

  // ============================================================
  // Year in footer
  // ============================================================
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ============================================================
  // Sticky header shadow on scroll
  // ============================================================
  var header = document.getElementById('site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ============================================================
  // Mobile drawer
  // ============================================================
  var hamburger = document.getElementById('hamburger');
  var drawer = document.getElementById('mobile-drawer');
  var scrim = document.getElementById('drawer-scrim');
  var closeBtn = document.getElementById('drawer-close');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.classList.add('is-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('is-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (scrim) scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });
  if (drawer) {
    drawer.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  // ============================================================
  // Stat counter — Intersection Observer, animate 0 → target
  // ============================================================
  var statNumbers = document.querySelectorAll('.stat-number');

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-target') || '0', 10);
    if (!target || isNaN(target)) { el.textContent = '0'; return; }
    var duration = 1600;
    var start = performance.now();

    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      var value = Math.floor(eased * target);
      el.textContent = value.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('en-IN');
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && statNumbers.length) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNumbers.forEach(function (el) { statObserver.observe(el); });
  } else {
    statNumbers.forEach(function (el) {
      el.textContent = el.getAttribute('data-target') || '0';
    });
  }

  // ============================================================
  // Testimonial carousel (mobile only — desktop shows 3-up grid)
  // ============================================================
  var track = document.getElementById('tst-track');
  var dotsWrap = document.getElementById('tst-dots');

  if (track && dotsWrap) {
    var cards = track.querySelectorAll('.tst-card');
    var current = 0;

    cards.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(b);
    });

    function goTo(i) {
      current = (i + cards.length) % cards.length;
      track.style.transform = 'translateX(' + (-current * 100) + '%)';
      dotsWrap.querySelectorAll('button').forEach(function (b, idx) {
        b.classList.toggle('is-active', idx === current);
      });
    }

    var mq = window.matchMedia('(max-width: 1199px)');
    var timer = null;
    function startAuto() {
      stopAuto();
      if (!mq.matches) return;
      timer = setInterval(function () { goTo(current + 1); }, 5500);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    var startX = 0, deltaX = 0, isDown = false;
    track.addEventListener('touchstart', function (e) {
      isDown = true; startX = e.touches[0].clientX; deltaX = 0; stopAuto();
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      if (!isDown) return; deltaX = e.touches[0].clientX - startX;
    }, { passive: true });
    track.addEventListener('touchend', function () {
      isDown = false;
      if (Math.abs(deltaX) > 40) goTo(deltaX < 0 ? current + 1 : current - 1);
      startAuto();
    });

    mq.addEventListener ? mq.addEventListener('change', startAuto) : mq.addListener(startAuto);
    startAuto();
  }

  // ============================================================
  // Dropdown accessibility — toggle on click for keyboard users
  // ============================================================
  document.querySelectorAll('.nav-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
    });
  });
})();
