/* Divine DunlopDreams Collection — optional enhancement for the category-description interface (.ddc).
   The description HTML works on its own: every model is a real link, and on wide screens CSS previews a row on hover or keyboard focus.
   This script only adds what HTML cannot keep: a locked selection, the "Back to the overview" control, the detail panel opening
   under the chosen row on narrow screens, and a stable stage height (no jumps).
   Ecwid renders category descriptions itself and recreates them on every in-store navigation, so the script runs from the
   site-wide custom code (see INSTALL.md), re-scans on Ecwid.OnPageLoaded and on DOM changes, and initialises each .ddc once.
   Vanilla JS, no globals except window.DDC, no listeners outside the component except one MutationObserver. */
(function () {
  'use strict';
  var VERSION = '1.0.0';
  if (window.DDC && window.DDC.version) { window.DDC.scan(); return; }

  var WIDE = 860;             // container width where the split layout starts (same number as ddc.css)
  var HOVER_IN = 110;         // ms a pointer must rest on a row before it previews (no flicker when crossing rows)
  var HOVER_OUT = 160;        // ms before the stage falls back after the pointer leaves the component
  var KEEP = 30 * 60 * 1000;  // a model chosen before opening its page is restored on return for 30 minutes
  var count = 0;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function modelOf(el) {
    var m = /(?:^|\s)ddc-m-([a-z0-9_]+)/.exec(el.className || '');
    return m ? m[1] : null;
  }
  function store(key, val) {
    try { if (val == null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage blocked: harmless */ }
  }
  function read(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }

  function init(root) {
    if (root.getAttribute('data-ddc')) return;
    var stage = root.querySelector('.ddc__stage');
    var body = root.querySelector('.ddc__body');
    var intro = root.querySelector('.ddc__pv--intro');
    if (!stage || !body || !intro) return;
    root.setAttribute('data-ddc', VERSION);
    var uid = 'ddc' + (++count);
    var kind = /ddc--(\w+)/.exec(root.className); kind = kind ? kind[1] : 'c';
    var memoryKey = 'ddc-last-' + kind;
    stage.id = uid + '-stage';
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-label', 'Model preview');
    var home = stage.parentNode, homeNext = stage.nextSibling;

    var live = document.createElement('p');
    live.className = 'ddc__sr';
    live.setAttribute('aria-live', 'polite');
    root.appendChild(live);

    var pvs = {}, rows = {}, order = [];
    var arts = stage.querySelectorAll('.ddc__pv');
    for (var i = 0; i < arts.length; i++) { var id = modelOf(arts[i]); if (id) pvs[id] = arts[i]; }

    // rows: the link becomes a selection button (the same link lives on in the preview as "View model")
    var lis = root.querySelectorAll('.ddc__row');
    for (var j = 0; j < lis.length; j++) {
      var li = lis[j], mid = modelOf(li), a = li.querySelector('.ddc__ra');
      if (!mid || !a || !pvs[mid]) continue;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ddc__rb';
      b.innerHTML = a.innerHTML;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-controls', stage.id);
      li.replaceChild(b, a);
      rows[mid] = { li: li, btn: b, fam: li.closest('.ddc__fam') };
      order.push(mid);
    }
    if (!order.length) return;

    // "Back to the overview" beside "View model" in every preview
    order.forEach(function (mid) {
      var acts = pvs[mid].querySelector('.ddc__acts');
      if (!acts || acts.querySelector('.ddc__back')) return;
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'ddc__back';
      back.textContent = 'Back to the overview';
      back.addEventListener('click', function () { unlock(true); });
      acts.appendChild(back);
      var cta = acts.querySelector('.ddc__cta');
      if (cta) cta.addEventListener('click', function () { store(memoryKey, { id: mid, t: Date.now() }); });
    });

    root.classList.add('ddc--js');
    var shown = 'intro', locked = null, inTimer = 0, outTimer = 0, minH = 0, slot = null;

    function wide() { return root.clientWidth >= WIDE; }

    function place() {
      // narrow: the stage sits right after the selected row; wide (or nothing selected): back in its own column
      if (!wide() && locked && rows[locked]) {
        if (!slot) { slot = document.createElement('li'); slot.className = 'ddc__slot'; }
        var li = rows[locked].li;
        if (li.nextSibling !== slot) li.parentNode.insertBefore(slot, li.nextSibling);
        if (stage.parentNode !== slot) slot.appendChild(stage);
      } else {
        if (stage.parentNode !== home) home.insertBefore(stage, homeNext);
        if (slot && slot.parentNode) slot.parentNode.removeChild(slot);
      }
    }

    function show(id, animate) {
      if (!pvs[id] && id !== 'intro') id = 'intro';
      if (id === shown && stage.parentNode) { place(); return; }
      var prev = shown === 'intro' ? intro : pvs[shown];
      var next = id === 'intro' ? intro : pvs[id];
      prev.hidden = true; prev.classList.remove('is-in');
      next.hidden = false;
      if (animate && !reduce) { next.classList.remove('is-in'); void next.offsetWidth; next.classList.add('is-in'); }
      shown = id;
      for (var k = 0; k < order.length; k++) {
        var r = rows[order[k]];
        r.li.classList.toggle('is-show', order[k] === id);
        if (r.fam) r.fam.classList.toggle('is-on', false);
      }
      if (rows[id] && rows[id].fam) rows[id].fam.classList.add('is-on');
      root.setAttribute('data-ddc-show', id);
      place();
      steady();
    }

    function steady() {
      // the stage never shrinks while the visitor explores on a wide screen, so nothing below it jumps
      if (!wide()) { stage.style.minHeight = ''; minH = 0; return; }
      var h = stage.offsetHeight;
      if (h > minH) { minH = h; stage.style.minHeight = h + 'px'; }
    }

    function lock(id, fromRestore) {
      // narrow: the open detail may close above the tapped row; keep that row where the finger left it
      var anchor = !wide() && !fromRestore ? rows[id].li.getBoundingClientRect().top : null;
      locked = id;
      for (var k = 0; k < order.length; k++) {
        var on = order[k] === id;
        rows[order[k]].li.classList.toggle('is-sel', on);
        rows[order[k]].btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      show(id, !fromRestore);
      live.textContent = pvs[id].querySelector('.ddc__pv-n').textContent + ': preview shown';
      if (anchor !== null) {
        var moved = rows[id].li.getBoundingClientRect().top - anchor;
        if (Math.abs(moved) > 1) window.scrollBy(0, moved);
        var top = rows[id].li.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.6) rows[id].li.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }
    }

    function unlock(focusRow) {
      var was = locked;
      locked = null;
      store(memoryKey, null);
      for (var k = 0; k < order.length; k++) { rows[order[k]].li.classList.remove('is-sel'); rows[order[k]].btn.setAttribute('aria-pressed', 'false'); }
      show('intro', true);
      live.textContent = 'Collection overview shown';
      if (focusRow && was && rows[was]) {
        rows[was].btn.focus({ preventScroll: !wide() ? false : true });
        if (!wide()) rows[was].li.scrollIntoView({ block: 'nearest' });
      }
    }

    function settle() { show(locked || 'intro', true); }

    order.forEach(function (mid, idx) {
      var btn = rows[mid].btn;
      btn.addEventListener('click', function () {
        if (!wide() && locked === mid) { unlock(false); return; }   // narrow: a second tap on the open row closes it
        lock(mid);
      });
      btn.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !wide()) return;
        clearTimeout(outTimer); clearTimeout(inTimer);
        var img = pvs[mid].querySelector('img');
        if (img && img.loading === 'lazy') img.loading = 'eager';   // start the picture while the pointer rests
        inTimer = setTimeout(function () { show(mid, true); }, HOVER_IN);
      });
      btn.addEventListener('pointerleave', function () { clearTimeout(inTimer); });
      btn.addEventListener('focus', function () { if (wide() && btn.matches(':focus-visible')) show(mid, true); });
      btn.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowDown') to = order[Math.min(order.length - 1, idx + 1)];
        else if (e.key === 'ArrowUp') to = order[Math.max(0, idx - 1)];
        else if (e.key === 'Home') to = order[0];
        else if (e.key === 'End') to = order[order.length - 1];
        if (to) { e.preventDefault(); rows[to].btn.focus(); }
      });
    });

    body.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') clearTimeout(outTimer); });
    body.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !wide()) return;
      clearTimeout(inTimer); clearTimeout(outTimer);
      outTimer = setTimeout(function () { if (!root.contains(document.activeElement) || locked) settle(); }, HOVER_OUT);
    });
    root.addEventListener('focusout', function (e) {
      if (e.relatedTarget && root.contains(e.relatedTarget)) return;
      setTimeout(function () { if (!root.contains(document.activeElement) && !root.matches(':hover')) settle(); }, 0);
    });

    if (window.ResizeObserver) {
      var lastWide = wide();
      new ResizeObserver(function () {
        var w = wide();
        if (w !== lastWide) { lastWide = w; minH = 0; stage.style.minHeight = ''; if (!locked && shown !== 'intro') show('intro'); place(); }
        steady();
      }).observe(root);
    }

    // returning from a model page (browser Back) within the visit: show the model the visitor had chosen
    var last = read(memoryKey);
    if (last && pvs[last.id] && Date.now() - last.t < KEEP) lock(last.id, true);
    else steady();
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
