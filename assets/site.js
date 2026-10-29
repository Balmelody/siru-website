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
      var done = false, started = false, stallTimer = null;
      var setToggle = function (paused) {
        if (!toggle) return;
        toggle.hidden = false;
        toggle.classList.toggle('is-paused', paused);
        toggle.setAttribute('aria-label', toggle.getAttribute(paused ? 'data-label-play' : 'data-label-pause'));
      };
      var finish = function () {
        if (done) return;
        done = true;
        clearTimeout(stallTimer);
        if (!video.ended) video.pause();
        hero.classList.add('is-ended');
        if (toggle) toggle.hidden = true;
      };
      if (reduceMotion || saveData) {
        finish();                                   // static end state: white frame + logo
      } else {
        var small = window.matchMedia('(max-width: 760px)').matches;
        video.src = small ? video.getAttribute('data-src-mobile') : video.getAttribute('data-src');
        video.addEventListener('ended', finish);
        /* Only a real media error ends the video; WeChat on iOS fires an empty 'error' while still loading */
        video.addEventListener('error', function () { if (video.error) finish(); });
        video.addEventListener('playing', function () {
          started = true;
          clearTimeout(stallTimer);
          if (done) { video.pause(); return; }
          setToggle(false);
        });
        /* Stuck buffering mid-play (weak signal): go to the end frame instead of a frozen picture */
        video.addEventListener('waiting', function () {
          if (!started) return;
          clearTimeout(stallTimer);
          stallTimer = setTimeout(finish, 8000);
        });
        var tryPlay = function () {
          if (done) return;
          var p = video.play();
          if (p && p.catch) p.catch(function () { /* autoplay blocked: poster + play button, see below */ });
        };
        tryPlay();
        /* WeChat's in-app browser may allow autoplay once its JS bridge is ready */
        if (/MicroMessenger/i.test(navigator.userAgent)) {
          var wxPlay = function () { window.WeixinJSBridge.invoke('getNetworkType', {}, tryPlay); };
          if (window.WeixinJSBridge) wxPlay();
          else document.addEventListener('WeixinJSBridgeReady', wxPlay, false);
        }
        /* Autoplay blocked (WeChat, low power mode): keep the poster, show the play button,
           and start on the visitor's first tap anywhere on the page */
        var onFirstTap = function (e) {
          if (toggle && toggle.contains(e.target)) return;   // the button handles its own tap
          document.removeEventListener('touchend', onFirstTap);
          document.removeEventListener('click', onFirstTap);
          if (!started) tryPlay();
        };
        document.addEventListener('touchend', onFirstTap, { passive: true });
        document.addEventListener('click', onFirstTap);
        setTimeout(function () { if (!started && !done) setToggle(true); }, 1500);
        if (toggle) {
          toggle.addEventListener('click', function () {
            if (video.paused) { tryPlay(); setToggle(false); }
            else { video.pause(); setToggle(true); }
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

/* Contact form: send in place via Web3Forms and show the result without leaving the page.
   Without JS the form still posts to Web3Forms directly. */
(function () {
  if (!window.fetch || !window.FormData) return;
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('inquiry');
    if (!form) return;
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var show = function (text, kind) {
      status.textContent = text;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = Object.fromEntries(new FormData(form));
      if (data.botcheck) return;                    // honeypot ticked: drop silently
      if (form.querySelector('.h-captcha') && !data['h-captcha-response']) {
        show(form.getAttribute('data-msg-captcha'), 'error');
        return;
      }
      delete data['g-recaptcha-response'];
      var name = (data.name || '').trim();
      data.subject = form.getAttribute('data-subject') + (name ? ' – ' + name : '');
      button.disabled = true;
      show(form.getAttribute('data-msg-sending'));
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().then(function (j) { return r.ok && j.success; }, function () { return false; });
      }).catch(function () { return false; }).then(function (ok) {
        button.disabled = false;
        if (window.hcaptcha) window.hcaptcha.reset();  // a token works once
        if (ok) { form.reset(); show(form.getAttribute('data-msg-ok'), 'ok'); }
        else show(form.getAttribute('data-msg-error'), 'error');
      });
    });
  });
})();
