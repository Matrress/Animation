/* Divine DunlopDreams Collection 2.0.0 — optional enhancement for the one-screen collection map (.ddc).
   The description HTML works on its own: every tile is a real link to its model page. This script only adds the floating card:
   - mouse: resting on a tile for a moment opens its card beside it; leaving closes it; a click on the tile goes straight to the model page
   - keyboard: focusing a tile opens its card, Tab reaches "View model", Escape closes
   - touch: the first tap opens the card (no navigation), a second tap on the same tile or "View model" opens the model page, a tap elsewhere closes
   Ecwid renders category descriptions itself and recreates them on every in-store navigation, so the script runs from the site-wide custom code
   (see INSTALL.md), re-scans on Ecwid.OnPageLoaded and on DOM changes, and initialises each .ddc once.
   Vanilla JS, no globals except window.DDC. */
(function () {
  'use strict';
  var VERSION = '3.5.0';
  if (window.DDC && window.DDC.version) { window.DDC.scan(); return; }

  var HOVER_IN = 120;    // ms a pointer must rest on a tile before its card opens (no flicker when crossing tiles)
  var HOVER_SWITCH = 50; // ms when a card is already open and the pointer moves to another tile
  var HOVER_OUT = 240;   // ms before the card closes after the pointer left tile and card
  var CARD_W = 900;
  var count = 0;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    if (root.getAttribute('data-ddc')) return;
    var tiles = root.querySelector('.ddc__tiles');
    if (!tiles) return;
    var items = root.querySelectorAll('.ddc__row');
    if (!items.length) return;
    root.setAttribute('data-ddc', VERSION);
    var uid = 'ddc' + (++count);
    var open = null, inT = 0, outT = 0, lastType = 'mouse', quiet = false, rows = [];

    for (var i = 0; i < items.length; i++) {
      var li = items[i], a = li.querySelector('.ddc__ra'), pop = li.querySelector('.ddc__pop'), cube = li.querySelector('.ddc__cube');
      if (!a || !pop || !cube) continue;
      pop.id = uid + '-p' + i;
      var what = pop.querySelector('.ddc__what');
      if (what) { what.id = pop.id + '-d'; a.setAttribute('aria-describedby', what.id); }
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'ddc__pop-x'; x.setAttribute('aria-label', 'Close preview');
      pop.insertBefore(x, pop.firstChild);
      rows.push({ li: li, a: a, pop: pop, x: x, cube: cube });
    }
    if (!rows.length) return;
    root.classList.add('ddc--js');

    var inset = 0;   // height of a fixed / sticky site header at the top of the window: the card must not slide under it
    function headerInset() {
      var m = 0;
      [0.25, 0.5, 0.75].forEach(function (f) {
        var e = document.elementFromPoint(window.innerWidth * f, 2);
        while (e && e !== document.documentElement) {
          var pos = getComputedStyle(e).position;
          if (pos === 'fixed' || pos === 'sticky') { var b = e.getBoundingClientRect().bottom; if (b < 220) m = Math.max(m, b); break; }
          e = e.parentElement;
        }
      });
      return Math.ceil(m);
    }
    function place(r) {
      // the card sits under the tile, or above it when there is no room; sideways it is clamped inside the component
      var pop = r.pop, C = tiles.getBoundingClientRect(), T = r.cube.getBoundingClientRect(), W = C.width;
      var pw = Math.min(CARD_W, W - 16);
      var sheet = W < 640;   // phones: the card is a sheet at the bottom of the screen (it would otherwise cover the whole map)
      pop.classList.toggle('is-sheet', sheet);
      if (sheet) { pop.classList.remove('is-wide'); ['width', 'max-height', 'left', 'top'].forEach(function (k) { pop.style.removeProperty(k); }); return; }
      var st = function (k, v) { pop.style.setProperty(k, v, 'important'); };   // the stylesheet is !important: inline values must be too
      pop.classList.toggle('is-wide', pw >= 640);
      st('width', pw + 'px'); st('max-height', 'none'); st('left', '0px'); st('top', '0px');
      var ph = pop.offsetHeight, vh = window.innerHeight, top, mh = '', g = Math.max(8, inset + 8);
      // under the tile when it fits on screen, else above it, else as low or as high as the window allows (it may cover part of its own tile)
      var vtop = T.bottom - 6;
      if (vtop + ph > vh - 8) vtop = T.top - ph + 6;
      if (vtop < g || vtop + ph > vh - 8) vtop = Math.max(g, Math.min(T.bottom - 6, vh - ph - 8));
      if (ph > vh - g - 8) { mh = vh - g - 8; vtop = g; }
      top = vtop - C.top;
      var left = Math.max(8, Math.min(T.left - C.left + T.width / 2 - pw / 2, W - pw - 8));
      st('left', Math.round(left) + 'px');
      st('top', Math.round(top) + 'px');
      st('max-height', mh ? Math.round(mh) + 'px' : 'none');
    }

    function show(r) {
      if (open === r) return;
      if (open) hide(false);
      inset = headerInset();
      r.li.classList.add('is-open');
      r.pop.classList.remove('is-in');
      place(r);
      if (!reduce) { void r.pop.offsetWidth; r.pop.classList.add('is-in'); }
      open = r;
    }
    function hide(returnFocus) {
      if (!open) return;
      var r = open; open = null;
      r.li.classList.remove('is-open'); r.pop.classList.remove('is-in');
      if (returnFocus && r.li.contains(document.activeElement)) { quiet = true; r.a.focus(); quiet = false; }
    }
    function later(fn, ms) { return setTimeout(fn, ms); }

    rows.forEach(function (r) {
      r.li.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(outT); clearTimeout(inT);
        if (open === r) return;
        inT = later(function () { show(r); }, open ? HOVER_SWITCH : HOVER_IN);
      });
      r.li.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(inT); clearTimeout(outT);
        outT = later(function () { if (open && !open.li.matches(':hover')) hide(false); }, HOVER_OUT);
      });
      r.a.addEventListener('focus', function () { if (!quiet && r.a.matches(':focus-visible')) { clearTimeout(outT); show(r); } });
      r.li.addEventListener('focusout', function (e) {
        if (e.relatedTarget && r.li.contains(e.relatedTarget)) return;
        later(function () { if (open === r && !r.li.contains(document.activeElement) && !r.li.matches(':hover')) hide(false); }, 0);
      });
      // touch and pen: the first tap on the name band previews, the second tap (or "Buy now", or a tap on the picture) opens the model page; mouse and keyboard go straight through.
      // Capture phase + stopPropagation: the storefront's own link router (a delegated listener) must not follow the link on the first tap.
      r.a.addEventListener('click', function (e) {
        // the small picture is a direct way into the model page, also on touch
        if (e.target && e.target.closest && e.target.closest('.ddc__th')) return;
        if ((lastType === 'touch' || lastType === 'pen') && open !== r) { e.preventDefault(); e.stopPropagation(); show(r); }
      }, true);
      r.x.addEventListener('click', function () { hide(true); });
      // with the mouse a click anywhere on the card (not on a link or button) also goes to the model page: the card may cover its own tile on a short window
      r.pop.addEventListener('click', function (e) {
        if ((e.target.closest && e.target.closest('a,button')) || String(window.getSelection && window.getSelection()).length) return;
        if (lastType !== 'mouse') { var t = r.a.getBoundingClientRect(), c = r.pop.getBoundingClientRect(); if (t.right <= c.left || t.left >= c.right || t.bottom <= c.top || t.top >= c.bottom) return; }
        r.a.click();
      });
    });

    root.addEventListener('pointerdown', function (e) { lastType = e.pointerType || 'mouse'; }, true);
    root.addEventListener('keydown', function () { lastType = 'key'; }, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { e.preventDefault(); hide(true); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (open && !open.li.contains(e.target)) hide(false);
    }, true);
    window.addEventListener('resize', function () { if (open) hide(false); });
    window.addEventListener('pagehide', function () { hide(false); });
  }

  function scan() {
    var list = document.querySelectorAll('.ddc:not([data-ddc])');
    for (var i = 0; i < list.length; i++) init(list[i]);
  }

  var queued = false;
  function soon() { if (queued) return; queued = true; (window.requestAnimationFrame || setTimeout)(function () { queued = false; scan(); }); }

  window.DDC = { version: VERSION, scan: scan };
  if (window.MutationObserver) new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  function hook() {
    if (window.Ecwid && window.Ecwid.OnPageLoaded && window.Ecwid.OnPageLoaded.add) { window.Ecwid.OnPageLoaded.add(function () { soon(); }); return true; }
    return false;
  }
  if (!hook()) { var tries = 0, t = setInterval(function () { if (hook() || ++tries > 60) clearInterval(t); }, 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
