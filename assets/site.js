/* Siru Consulting — progressive enhancement only; the site works without it. */
(function () {
  var root = document.documentElement;
  if (!('IntersectionObserver' in window)) return;
  root.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  document.addEventListener('DOMContentLoaded', function () {
    /* Scroll reveal */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    /* Hero background video */
    var hero = document.querySelector('.hv');
    var video = hero && hero.querySelector('.hv-video');
    var toggle = hero && hero.querySelector('.hv-toggle');
    if (hero && video) {
      var finish = function () { hero.classList.add('is-ended'); if (toggle) toggle.hidden = true; };
      if (reduceMotion || saveData) {
        finish();                                   // static end state: white frame + logo
      } else {
        var small = window.matchMedia('(max-width: 760px)').matches;
        video.src = small ? video.getAttribute('data-src-mobile') : video.getAttribute('data-src');
        video.addEventListener('ended', finish);
        video.addEventListener('error', finish);
        video.addEventListener('playing', function () { if (toggle) toggle.hidden = false; });
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
        if (toggle) {
          toggle.addEventListener('click', function () {
            if (video.paused) {
              video.play();
              toggle.classList.remove('is-paused');
              toggle.setAttribute('aria-label', toggle.getAttribute('data-label-pause'));
            } else {
              video.pause();
              toggle.classList.add('is-paused');
              toggle.setAttribute('aria-label', toggle.getAttribute('data-label-play'));
            }
          });
        }
      }
    }

    /* Header: transparent over the hero, frosted glass after it */
    var header = document.querySelector('.site-header');
    var onScroll = function () {
      var limit = hero ? Math.max(8, hero.offsetHeight - header.offsetHeight) : 8;
      header.classList.toggle('is-scrolled', window.scrollY > limit);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* Language switch: 150ms fade out before navigating */
    if (!reduceMotion) {
      document.querySelectorAll('.lang-link').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          if (a.getAttribute('aria-current') === 'true' || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
          ev.preventDefault();
          document.body.classList.add('is-leaving');
          setTimeout(function () { window.location.href = a.href; }, 150);
        });
      });
    }
  });
})();
