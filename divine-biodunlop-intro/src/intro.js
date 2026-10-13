/*! Divine DunlopDreams BioDunlop intro 0.3.6-dev | namespace .ddb | opening turn, the turn again on demand, the natural-sourcing video | attaches to Hero 1.20.2 */
(function (w, d) {
  'use strict';
  var H = d.documentElement, base = ((d.currentScript && d.currentScript.src) || '').replace(/[^\/]*$/, '');
  var root, plane, stage, win, fig, winV, figV, film, again, litT = 0, tendT = 0, pts, mo, booted = false, waits = 0, startT = 0, prevState = '', lx = '', dwellT = 0, inLogo = false;
  // ---- the ONE state controller: phase is 'off' (nothing allowed), 'opening' (the first turn), 'idle', or 'turn' (the turn again). Every trigger asks here first.
  var ctl = { phase: 'off', last: 0, hold: false };
  var COOL = 600, LOGO_COOL = 8000, DWELL = 800, STARTS = 4000, WAIT = 900;
  var LOGO = { l: .35, t: .26, w: .30, h: .10 };                 // the wordmark in the hero picture (fractions of the picture); never covered by an element
  var LXR = { l: .033, t: .356, w: .394, h: .342 };               // the natural-sourcing window in the hero picture (fractions)
  var calmQ = w.matchMedia ? w.matchMedia('(prefers-reduced-motion:reduce)') : { matches: false };
  function anim() { return H.hasAttribute('data-ddb-anim') && !calmQ.matches; }
  function busy() { return ctl.phase === 'opening' || ctl.phase === 'turn'; }
  function now() { return w.Date.now(); }
  function mark() { try { w.sessionStorage.setItem('ddb-seen', '1'); } catch (e) {} }
  function mk(name) {
    // muted, inline, silent; H.264 first (Chrome, Safari, Edge, Firefox), VP9 WebM only for browsers without H.264. One file is downloaded.
    var v = d.createElement('video'); v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
    ['muted', 'playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach(function (a) { v.setAttribute(a, ''); });
    v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
    [['.mp4', 'video/mp4; codecs="avc1.640028"'], ['.webm', 'video/webm; codecs="vp9"']].forEach(function (f) { var s = d.createElement('source'); s.src = base + name + f[0]; s.type = f[1]; v.appendChild(s); });
    return v;
  }
  function size() { var px = plane.clientWidth * Math.min(w.devicePixelRatio || 1, 2); return px > 1700 ? '1640' : px > 1100 ? '1280' : '960'; }   // the film is as sharp as the screen needs: iPads and large screens get 1640 (the hero picture's own width)
  function inertPoints(on) {   // hotspots are suspended (pointer and keyboard) while a body movement runs
    if (!pts) return; var had = pts.contains(d.activeElement) && d.activeElement;
    if (on) { pts.setAttribute('inert', ''); } else { pts.removeAttribute('inert'); if (had && had.focus) had.focus({ preventScroll: true }); }
  }

  // ------------------------------------------------------------------------------------------------ boot
  // Safe to call more than once and at any time: it does nothing until the section's markup is in the page. The section ends with an inline
  // DDBIntro.boot() (like the hero's own DDHero.boot()) so a builder that inserts scripts before the markup still starts it.
  function boot() {
    if (booted || !H.hasAttribute('data-ddb-ok')) return;
    root = d.querySelector('.ddh'); plane = root && root.querySelector('.ddh__plane'); stage = root && root.querySelector('.ddb'); win = root && root.querySelector('.ddb-lx');
    if (!root || !plane || !stage || !win) return;
    // the stylesheet is a separate file: nothing starts until it is applied (the window is absolutely positioned only by it)
    if (w.getComputedStyle(win).position !== 'absolute') {
      if (++waits < 6) { w.setTimeout(boot, 300); return; }
      H.removeAttribute('data-ddb'); H.removeAttribute('data-ddb-ok'); H.removeAttribute('data-ddb-anim'); return;
    }
    booted = true; pts = root.querySelector('.ddh__points');
    // while the stage is shown (the opening turn, the turn again) the picture area is inert: the hero underneath does not react. Shop buttons and the page are outside it.
    ['pointermove', 'pointerdown', 'pointerup', 'click', 'touchstart'].forEach(function (t) { stage.addEventListener(t, function (ev) { ev.stopPropagation(); }, { passive: true }); });
    watch(); wireLogo(); inject();
    d.addEventListener('visibilitychange', function () { if (d.hidden) { pauseLx(); } else if (lx) { playLx(); } });
    if (H.getAttribute('data-ddb') === 'pending' && anim()) opening(); else if (anim()) idle();
  }

  // ------------------------------------------------------------------------------------------------ the opening turn (page load): hotspots wait until the body has settled
  function opening() {
    ctl.phase = 'opening'; mark();
    var v = mk('assets/ddb-turn-' + size()); film = v;
    v.lastChild.addEventListener('error', function () { endOpening(true); }); v.addEventListener('error', function () { endOpening(true); });
    v.addEventListener('playing', function () { v.setAttribute('data-on', ''); prime(); }, { once: true });   // the turn again is fetched while the first turn plays, so the Spinal Alignment point answers at once
    v.addEventListener('ended', function () { endOpening(false); });
    stage.appendChild(v); inertPoints(true);
    d.addEventListener('keydown', onKey);
    H.setAttribute('data-ddb', 'play');
    startT = w.setTimeout(function () { if (!v.currentTime) endOpening(true); }, STARTS);
    var p = v.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') endOpening(true); });   // autoplay refused: straight to the hero
  }
  function lit() { H.setAttribute('data-ddb-lit', ''); w.clearTimeout(litT); litT = w.setTimeout(function () { H.removeAttribute('data-ddb-lit'); }, 3200); }
  function onKey(ev) { if (ev.key === 'Escape' || ev.key === 'Esc') endOpening(true); }
  // fast: skipped, failed or refused (a quick fade); otherwise the film ended on the hero itself (a short dissolve into the live hero)
  function endOpening(fast) {
    if (ctl.phase !== 'opening') return;
    w.clearTimeout(startT); d.removeEventListener('keydown', onKey);
    var v = film; if (v) { try { v.pause(); } catch (e) {} }
    // the last frame of the film is the hero picture: the stage dissolves slowly into the live hero (colour and light flow over, no snap) while the hotspots come out
    H.setAttribute('data-ddb', 'out');
    var ms = fast ? 300 : 1400; stage.style.transitionDuration = fast ? '.3s' : '';
    w.setTimeout(function () { if (ctl.phase === 'opening') { inertPoints(false); lit(); } }, fast ? 0 : 450);
    w.setTimeout(function () {
      if (v) { v.removeAttribute('src'); while (v.firstChild) v.removeChild(v.firstChild); try { v.load(); } catch (e) {} if (v.parentNode) v.parentNode.removeChild(v); }
      film = null; H.removeAttribute('data-ddb'); stage.style.transitionDuration = '';
      ctl.phase = 'idle'; ctl.last = 0; idle();
    }, ms);
  }

  // ------------------------------------------------------------------------------------------------ the turn again (Spinal Alignment point, the wordmark)
  function idle() { if (!anim() || busy()) return; if (ctl.phase === 'off') ctl.phase = 'idle'; prime(); }
  function prime() {   // the turn again film: requested once, as early as it can be (it is small), never twice
    if (again || !stage || !anim()) return;
    again = mk('assets/ddb-again-' + size()); again.setAttribute('data-role', 'again'); stage.appendChild(again);
  }
  function ready() { return !!again && again.readyState >= 3; }
  // kind: 'back' (the Spinal Alignment point: the screen waits for the body) or 'logo' (the hidden wordmark). The body starts to move at the moment of the touch.
  function turn(kind) {
    if (!anim() || ctl.phase !== 'idle' || now() - ctl.last < (kind === 'logo' ? LOGO_COOL : COOL)) return false;
    if (kind === 'logo' && (root.getAttribute('data-ddh-state') || lx)) return false;      // never interrupts an open card
    prime(); if (!again) return false;
    w.clearTimeout(tendT); H.removeAttribute('data-ddb-tend');
    ctl.phase = 'turn'; ctl.hold = kind === 'back';
    if (ctl.hold) H.setAttribute('data-ddb-hold', '');
    inertPoints(true); ctl.t = w.setTimeout(endTurn, 14000);
    if (ready()) go(); else { again.addEventListener('canplay', go, { once: true }); ctl.w = w.setTimeout(function () { if (ctl.phase === 'turn' && !ctl.on) endTurn(); }, WAIT); }   // pressed before the film arrived: a moment's grace, then the hero simply works
    return true;
  }
  function go() {
    if (ctl.phase !== 'turn' || ctl.on) return; ctl.on = true; w.clearTimeout(ctl.w);
    try { again.currentTime = 0; } catch (e) {}
    again.setAttribute('data-on', ''); H.setAttribute('data-ddb-turn', '');
    again.addEventListener('ended', endTurn, { once: true });
    var p = again.play(); if (p && p.catch) p.catch(endTurn);
  }
  function endTurn() {
    if (ctl.phase !== 'turn') return; w.clearTimeout(ctl.t); w.clearTimeout(ctl.w);
    ctl.phase = 'idle'; ctl.last = now() + 1000; ctl.hold = false; ctl.on = false;       // (the guard runs on through the dissolve)
    H.removeAttribute('data-ddb-turn'); H.removeAttribute('data-ddb-hold');                // the held screen starts now (vertebrae, then the words)
    H.setAttribute('data-ddb-tend', '');                                                    // the last frame is the hero: it dissolves slowly into the live hero, no snap
    w.setTimeout(function () { if (ctl.phase === 'idle') { inertPoints(false); lit(); } }, 450);   // the hotspots and the notes come out again, smoothly, one after another
    w.clearTimeout(tendT); tendT = w.setTimeout(function () {
      H.removeAttribute('data-ddb-tend'); var v = again; if (v) { try { v.pause(); v.currentTime = 0; } catch (e) {} v.removeAttribute('data-on'); }
    }, 1500);
  }
  // the wordmark: a mouse resting on it for about 0.8 s (a crossing does nothing); no element lies over it, so its own clicks and the page are untouched; not on touch
  function wireLogo() {
    plane.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      var r = plane.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      var inside = x >= LOGO.l && x <= LOGO.l + LOGO.w && y >= LOGO.t && y <= LOGO.t + LOGO.h;
      if (inside && !inLogo) { inLogo = true; w.clearTimeout(dwellT); dwellT = w.setTimeout(function () { if (inLogo) turn('logo'); }, DWELL); }
      else if (!inside && inLogo) { inLogo = false; w.clearTimeout(dwellT); }
    }, { passive: true });
    plane.addEventListener('pointerleave', function () { inLogo = false; w.clearTimeout(dwellT); }, { passive: true });
  }

  // ------------------------------------------------------------------------------------------------ what the hero is doing (read from its own state attribute)
  function watch() {
    mo = new w.MutationObserver(function (list) {
      list.forEach(function (m) { if (m.type === 'childList') inject(); });
      var s = root.getAttribute('data-ddh-state') || '';
      if (s !== prevState) { var was = prevState; prevState = s; if (s === 'back' && was !== 'back') turn('back'); }
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
    var on = s === 'zones' && root.hasAttribute('data-ddh-cards') && w.innerWidth > 700 && w.innerHeight > 500 && !H.hasAttribute('data-ddb') && ctl.phase !== 'opening';
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
  w.DDBIntro = { boot: boot, version: '0.3.6-dev', get phase() { return ctl.phase; }, turn: function () { return turn('back'); }, skip: function () { endOpening(true); } };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(window, document);
