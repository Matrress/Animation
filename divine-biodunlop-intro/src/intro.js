/*! Divine DunlopDreams BioDunlop intro 0.4.0-dev | namespace .ddb | the hotspots come out of the still model, the natural-sourcing video | attaches to Hero 1.20.2 (no body movement) */
(function (w, d) {
  'use strict';
  var H = d.documentElement, base = ((d.currentScript && d.currentScript.src) || '').replace(/[^\/]*$/, '');
  var root, plane, win, fig, winV, figV, litT = 0, pts, mo, booted = false, waits = 0, prevState = '', lx = '';
  var ctl = { phase: 'off' };                                      // 'off' (nothing allowed), 'reveal' (the model is shown, the hotspots wait), 'idle'
  var REVEAL = 450, REVEAL_MAX = 2500;
  var LXR = { l: .033, t: .356, w: .394, h: .342 };               // the natural-sourcing window in the hero picture (fractions)
  var calmQ = w.matchMedia ? w.matchMedia('(prefers-reduced-motion:reduce)') : { matches: false };
  function anim() { return H.hasAttribute('data-ddb-anim') && !calmQ.matches; }
  function mk(name) {
    // muted, inline, silent; H.264 first (Chrome, Safari, Edge, Firefox), VP9 WebM only for browsers without H.264. One file is downloaded.
    var v = d.createElement('video'); v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
    ['muted', 'playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach(function (a) { v.setAttribute(a, ''); });
    v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
    [['.mp4', 'video/mp4; codecs="avc1.640028"'], ['.webm', 'video/webm; codecs="vp9"']].forEach(function (f) { var s = d.createElement('source'); s.src = base + name + f[0]; s.type = f[1]; v.appendChild(s); });
    return v;
  }

  // ------------------------------------------------------------------------------------------------ boot
  // Safe to call more than once and at any time: it does nothing until the section's markup is in the page. The section ends with an inline
  // DDBIntro.boot() (like the hero's own DDHero.boot()) so a builder that inserts scripts before the markup still starts it.
  function boot() {
    if (booted || !H.hasAttribute('data-ddb-ok')) return;
    root = d.querySelector('.ddh'); plane = root && root.querySelector('.ddh__plane'); win = root && root.querySelector('.ddb-lx');
    if (!root || !plane || !win) return;
    // the stylesheet is a separate file: nothing starts until it is applied (the window is absolutely positioned only by it)
    if (w.getComputedStyle(win).position !== 'absolute') {
      if (++waits < 6) { w.setTimeout(boot, 300); return; }
      H.removeAttribute('data-ddb'); H.removeAttribute('data-ddb-ok'); H.removeAttribute('data-ddb-anim'); return;
    }
    booted = true; pts = root.querySelector('.ddh__points');
    watch(); inject();
    d.addEventListener('visibilitychange', function () { if (d.hidden) { pauseLx(); } else if (lx) { playLx(); } });
    if (H.getAttribute('data-ddb') === 'pending' && anim()) reveal(); else ctl.phase = anim() ? 'idle' : 'off';
  }

  // ------------------------------------------------------------------------------------------------ the model is shown still; then the hotspots come out of it one after another and pulse
  function reveal() {
    ctl.phase = 'reveal'; try { w.sessionStorage.setItem('ddb-seen', '1'); } catch (e) {}
    var img = plane.querySelector('.ddh__img'), done = false;
    function go() {
      if (done) return; done = true; w.clearTimeout(cap);
      w.setTimeout(function () { ctl.phase = 'idle'; H.removeAttribute('data-ddb'); lit(); }, REVEAL);     // a beat after the picture is there, so the model is seen first
    }
    var cap = w.setTimeout(go, REVEAL_MAX);
    if (!img || img.complete) go(); else { img.addEventListener('load', go, { once: true }); img.addEventListener('error', go, { once: true }); }
  }
  function lit() { H.setAttribute('data-ddb-lit', ''); w.clearTimeout(litT); litT = w.setTimeout(function () { H.removeAttribute('data-ddb-lit'); }, 3200); }

  // ------------------------------------------------------------------------------------------------ what the hero is doing (read from its own state attribute)
  function watch() {
    mo = new w.MutationObserver(function (list) {
      list.forEach(function (m) { if (m.type === 'childList') inject(); });
      var s = root.getAttribute('data-ddh-state') || '';
      prevState = s;
      lxSync(s);                                   // also when the cards arrive after the state was set (the first hover loads them)
    });
    mo.observe(root, { attributes: true, attributeFilter: ['data-ddh-state', 'data-ddh-cards'], childList: true });
  }

  // ------------------------------------------------------------------------------------------------ Original Dunlop Technology: the line in the blue band and the natural-sourcing video
  var HDR = { en: 'Naturally Sourced · Custom-Made Sleep Systems', de: 'Natürlich gewonnen · Maßgefertigte Schlafsysteme', sv: 'Naturligt framställt · Skräddarsydda sovsystem', fr: 'Issu de sources naturelles · Systèmes de sommeil sur mesure', es: 'De origen natural · Sistemas de descanso a medida', pt: 'De origem natural · Sistemas de descanso por medida', el: 'Φυσικής προέλευσης · Συστήματα ύπνου κατά παραγγελία', fi: 'Luonnollisesti hankittu · Räätälöidyt unijärjestelmät', it: 'Di origine naturale · Sistemi del sonno su misura' };
  function lang() { var l = ((root && root.closest('[lang]') || H).getAttribute('lang') || 'en').toLowerCase().slice(0, 2); return HDR[l] ? l : 'en'; }
  function inject() {   // exists before the card is ever opened, so the card is measured with it
    var card = root && root.querySelector('[data-ddh-card="zones"]'), hd = card && card.querySelector('.ddh__hc-hd');
    if (!hd || hd.querySelector('.ddb-hc-n')) return;
    var p = d.createElement('p'); p.className = 'ddb-hc-n'; p.textContent = HDR[lang()];
    var sub = hd.querySelector('.ddh__hc-s'); hd.insertBefore(p, sub || null);   // the secondary line; the old subtitle (it says the same, shorter) stays in the page but is not drawn
    fig = d.createElement('figure'); fig.className = 'ddb-lx-card'; fig.setAttribute('aria-hidden', 'true');    // where the window has no room: the video sits in the card, under the blue band
    hd.parentNode.insertBefore(fig, hd.nextSibling);
  }
  // where the video goes is decided when the card opens, from the card's real position: beside the card in the marked area, or (no room) inside the card under the blue band
  function pick() {
    var card = root.querySelector('[data-ddh-card="zones"]'); if (!card) return 'side';
    var pr = plane.getBoundingClientRect(), rr = root.getBoundingClientRect();
    return w.innerWidth >= 900 && rr.left + card.offsetLeft >= pr.left + (LXR.l + LXR.w) * pr.width + 8 ? 'side' : 'card';
  }
  function modeSync() { H.setAttribute('data-ddb-lxm', lx || 'side'); }
  function pauseLx() { [winV, figV].forEach(function (v) { if (v) { try { v.pause(); } catch (e) {} } }); }
  function playLx() { var v = lx === 'side' ? winV : figV; if (v && anim()) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
  function lxSync(s) {
    var on = s === 'zones' && root.hasAttribute('data-ddh-cards') && w.innerWidth > 700 && w.innerHeight > 500 && !H.hasAttribute('data-ddb');
    var mode = on ? pick() : '';
    if (on && lx === mode) return;                                                              // already showing
    if (!on) {   // closed or another hotspot chosen: stop, rewind, never keep playing unseen
      if (!lx) return; lx = ''; H.removeAttribute('data-ddb-lx'); [winV, figV].forEach(function (v) { if (v) { try { v.pause(); v.currentTime = 0; } catch (e) {} } }); return;
    }
    [winV, figV].forEach(function (v) { if (v) { try { v.pause(); v.currentTime = 0; } catch (e) {} } });
    var side = mode === 'side', el = side ? win : fig; if (!el) return;
    H.setAttribute('data-ddb-lxm', mode);
    if (!el.getAttribute('data-ready')) { el.setAttribute('data-ready', ''); el.style.backgroundImage = 'url(' + base + 'assets/ddb-latex-poster.webp)'; }
    if (side) {
      var pt = root.querySelector('[data-ddh-point="zones"]'), pr2 = plane.getBoundingClientRect();
      if (pt) { var a = pt.getBoundingClientRect(); win.style.setProperty('--ddb-ox', Math.round(a.left + a.width / 2 - (pr2.left + LXR.l * pr2.width)) + 'px'); win.style.setProperty('--ddb-oy', Math.round(a.top + a.height / 2 - (pr2.top + LXR.t * pr2.height)) + 'px'); }
    }
    lx = mode; H.setAttribute('data-ddb-lx', lx);
    if (anim() && !(w.navigator.connection && w.navigator.connection.saveData)) {
      var v = side ? winV : figV;
      if (!v) { v = mk('assets/ddb-latex'); v.loop = true; v.setAttribute('loop', ''); v.preload = 'metadata'; el.appendChild(v); if (side) winV = v; else figV = v; }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
  }
  w.DDBIntro = { boot: boot, version: '0.4.0-dev', get phase() { return ctl.phase; } };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(window, document);
