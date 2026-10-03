/* Divine DunlopDreams · Atelier hero (concept 0.1.0) — scenes, firmness finder, header-aware top spacing. */
(function (w, d) {
  'use strict';
  var INTERVAL = 6500;
  // Firmness by body weight → collection page. Thresholds/links are placeholders: confirm against the product sheet.
  var SHOP = 'https://divinedunlop.com/products/latex-mattresses-collection';

  function boot() {
    [].forEach.call(d.querySelectorAll('.dda:not([data-dda-on])'), init);
  }

  function init(root) {
    root.setAttribute('data-dda-on', '');
    var html = d.documentElement;
    var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tabs = [].slice.call(root.querySelectorAll('.dda__tab'));
    var scenes = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
    var pauseBtn = root.querySelector('.dda__pause');
    var cur = 0, timer = 0, paused = reduce, hover = false, visible = true;

    function show(i, focus) {
      if (i === cur && scenes[i].classList.contains('is-on')) { restart(); return; }
      scenes[cur].classList.remove('is-on');
      var prev = scenes[cur];
      setTimeout(function () { if (!prev.classList.contains('is-on')) prev.hidden = true; }, 1200);
      tabs[cur].setAttribute('aria-selected', 'false'); tabs[cur].tabIndex = -1;
      cur = i;
      scenes[i].hidden = false;
      void scenes[i].offsetWidth;                       // let the un-hidden scene paint at opacity 0 first
      scenes[i].classList.add('is-on');
      tabs[i].setAttribute('aria-selected', 'true'); tabs[i].tabIndex = 0;
      if (focus) tabs[i].focus();
      restart();
    }
    function restart() {
      clearTimeout(timer);
      root.classList.add('is-anim'); void root.offsetWidth; root.classList.remove('is-anim');
      var run = !paused && !hover && visible;
      root.style.setProperty('--dda-dur', run ? INTERVAL + 'ms' : '0s');
      if (run) timer = setTimeout(function () { show((cur + 1) % tabs.length); }, INTERVAL);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, j = k === 'ArrowRight' ? (cur + 1) % n : k === 'ArrowLeft' ? (cur + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
        if (j > -1) { e.preventDefault(); show(j, true); }
      });
    });
    function setPaused(p) {
      paused = p;
      pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
      pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
      restart();
    }
    pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    var stage = root.querySelector('.dda__stage');
    stage.addEventListener('mouseenter', function () { hover = true; restart(); });
    stage.addEventListener('mouseleave', function () { hover = false; restart(); });
    stage.addEventListener('focusin', function () { hover = true; restart(); });
    stage.addEventListener('focusout', function (e) { if (!stage.contains(e.relatedTarget)) { hover = false; restart(); } });
    if ('IntersectionObserver' in w) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; restart(); }, { threshold: .25 }).observe(root);
    d.addEventListener('visibilitychange', function () { visible = !d.hidden; restart(); });
    setPaused(paused);

    // firmness finder
    var chips = [].slice.call(root.querySelectorAll('.dda__chip')), out = root.querySelector('.dda__f-r');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        var f = c.getAttribute('data-dda-w');
        out.innerHTML = '';
        var s = d.createElement('span'); s.textContent = 'Recommended core: '; var b = d.createElement('b'); b.textContent = f;
        var a = d.createElement('a'); a.href = SHOP; a.textContent = 'Shop ' + f + ' →';
        s.appendChild(b); out.appendChild(s); out.appendChild(a);
      });
    });

    // Instant Site lays its transparent header over the first section: measure how far it reaches into the hero.
    var raf = 0;
    function cover(el) { return el && el !== d.body && el !== html && !root.contains(el) && !el.contains(root); }
    function measure() {
      raf = 0;
      if ((w.pageYOffset || html.scrollTop) > 2) return;
      var r = root.getBoundingClientRect(), vw = html.clientWidth, safe = 0, lim = Math.min(w.innerHeight * .4, 360);
      root.style.setProperty('--top', Math.max(0, Math.round(r.top)) + 'px');
      [].forEach.call(d.querySelectorAll('.ins-tile--header, header, [role="banner"]'), function (h) {
        if (!cover(h)) return;
        var c = h.getBoundingClientRect();
        if (c.height > 4 && c.width > vw * .5 && c.bottom > r.top && c.top < r.top + lim) safe = Math.max(safe, Math.min(lim, c.bottom - r.top));
      });
      root.style.setProperty('--safe', Math.round(safe) + 'px');
    }
    function queue() { if (!raf) raf = w.requestAnimationFrame(measure); }
    queue(); w.addEventListener('resize', queue, { passive: true }); w.addEventListener('load', queue);
    setTimeout(queue, 800);
  }

  w.DDAtelier = { boot: boot };
  if (d.readyState !== 'loading') boot(); else d.addEventListener('DOMContentLoaded', boot);
})(window, document);
