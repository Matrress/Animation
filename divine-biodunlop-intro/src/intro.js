/*! Divine DunlopDreams BioDunlop intro 0.1.0-dev | namespace .ddb | plays once per session, then hands over to the live Hero 1.20.2 */
(function (w, d) {
  'use strict';
  var H = d.documentElement;
  // The inline gate in the section decides before the first paint (laptops, monitors and tablets only; not with reduced
  // motion, Data Saver or a slow connection; once per browser session). Nothing to do unless it said "pending".
  if (H.getAttribute('data-ddb') !== 'pending') return;
  var base = ((d.currentScript && d.currentScript.src) || '').replace(/[^\/]*$/, '');
  var LINE_IN = 0.5, LINE_OUT = 3.2;            // the story line shows over the origin (forest, tree, latex milk)
  var START_LIMIT = 4000;                         // no first frame after 4 s: the hero simply appears
  var root, stage, video, skip, line, done = false, startT = 0, ticks = 0;

  function mark() { try { w.sessionStorage.setItem('ddb-seen', '1'); } catch (e) {} }
  function boot() {
    root = d.querySelector('.ddh'); stage = root && root.querySelector('.ddb'); line = root && root.querySelector('.ddb-line');
    if (!stage) { H.removeAttribute('data-ddb'); return; }
    mark();                                       // returning from a product page never replays it
    var wide = stage.clientWidth * Math.min(w.devicePixelRatio || 1, 2) > 1100;
    var name = 'assets/ddb-intro-' + (wide ? '1280' : '960');
    video = d.createElement('video');
    video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = 'auto';
    ['muted', 'playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach(function (a) { video.setAttribute(a, ''); });
    video.setAttribute('aria-hidden', 'true'); video.setAttribute('tabindex', '-1');
    // H.264 first (Chrome, Safari, Edge, Firefox); VP9 WebM only for browsers without H.264. One file is downloaded.
    var last;
    [['.mp4', 'video/mp4; codecs="avc1.640028"'], ['.webm', 'video/webm; codecs="vp9"']].forEach(function (f) {
      last = d.createElement('source'); last.src = base + name + f[0]; last.type = f[1]; video.appendChild(last);
    });
    last.addEventListener('error', function () { finish(true); });   // no playable source at all: straight to the hero
    video.addEventListener('error', function () { finish(true); });
    video.addEventListener('playing', function () { video.setAttribute('data-on', ''); showSkip(); }, { once: true });
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', function () { finish(false); });
    stage.appendChild(video);
    // the stage swallows pointer events so the hero underneath does not react while the film runs
    ['pointermove', 'pointerdown', 'pointerup', 'click', 'touchstart'].forEach(function (t) {
      stage.addEventListener(t, function (ev) { ev.stopPropagation(); }, { passive: true });
    });
    skip = d.createElement('button'); skip.type = 'button'; skip.className = 'ddb-skip';
    skip.innerHTML = '<span>Skip intro</span><i aria-hidden="true"></i>';
    skip.setAttribute('aria-label', 'Skip the natural latex intro and show the page');
    skip.addEventListener('click', function () { finish(true); });
    // first in the hero's tab order, drawn on the always-visible Shop row (left), never over the buttons
    var h1 = root.querySelector('h1'); root.insertBefore(skip, h1 ? h1.nextSibling : root.firstChild);
    // it stays invisible (no layout shift counted) until the hero's web font and layout have settled: shown when the film starts, at the latest after 1.2 s
    skip.setAttribute('data-wait', ''); placeSkip(); w.addEventListener('resize', placeSkip); w.addEventListener('load', placeSkip);
    w.setTimeout(showSkip, 1200);
    d.addEventListener('keydown', onKey);
    H.setAttribute('data-ddb', 'play');
    startT = w.setTimeout(function () { if (!video.currentTime) finish(true); }, START_LIMIT);
    var p = video.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') finish(true); });   // autoplay refused: straight to the hero (a stalled load is left to START_LIMIT)
  }
  function showSkip() { if (skip && skip.hasAttribute('data-wait')) { placeSkip(); skip.removeAttribute('data-wait'); } }
  function placeSkip(ev) {
    if (!skip || !skip.parentNode || (ev && ev.type === 'load' && !skip.hasAttribute('data-wait'))) return;
    var shop = root.querySelector('.ddh__shop'), r = root.getBoundingClientRect();
    if (!shop) { skip.style.top = '16px'; return; }
    var b = shop.getBoundingClientRect(), ctas = shop.querySelector('.ddh__cta'), c = ctas ? ctas.getBoundingClientRect() : b;
    skip.style.top = Math.round(c.top - r.top + (c.height - skip.offsetHeight) / 2) + 'px';
  }
  function onTime() {
    var t = video.currentTime;
    if (line) { if (t >= LINE_IN && t < LINE_OUT) line.setAttribute('data-on', ''); else line.removeAttribute('data-on'); }
    if (++ticks === 1) w.clearTimeout(startT);
  }
  function onKey(ev) { if (ev.key === 'Escape' || ev.key === 'Esc') finish(true); }
  // fast: skipped, failed or refused (a quick fade); otherwise the film ended on the hero's own pose (the long dissolve)
  function finish(fast) {
    if (done) return; done = true;
    w.clearTimeout(startT); d.removeEventListener('keydown', onKey); w.removeEventListener('resize', placeSkip); w.removeEventListener('load', placeSkip);
    if (line) line.removeAttribute('data-on');
    if (video) { try { video.pause(); } catch (e) {} }
    var hadFocus = skip && d.activeElement === skip;   // the keyboard user lands on the first Shop button, not on <body>
    if (skip && skip.parentNode) skip.parentNode.removeChild(skip);
    if (hadFocus && root) { var a = root.querySelector('.ddh__cta'); if (a) a.focus({ preventScroll: true }); }
    H.setAttribute('data-ddb', 'out');
    var ms = fast ? 250 : 900; if (fast) stage.style.transitionDuration = '.25s';
    w.setTimeout(function () {
      if (stage) { if (video) { video.removeAttribute('src'); while (video.firstChild) video.removeChild(video.firstChild); try { video.load(); } catch (e) {} } stage.parentNode && stage.parentNode.removeChild(stage); }
      H.removeAttribute('data-ddb');
      H.setAttribute('data-ddb-lit', '');      // the hero's points light up one after another
      w.setTimeout(function () { H.removeAttribute('data-ddb-lit'); }, 1800);
    }, ms);
  }
  w.DDBIntro = { skip: function () { finish(true); }, version: '0.1.0-dev' };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(window, document);
