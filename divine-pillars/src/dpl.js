/* Divine DunlopDreams · Four Laws of Good Sleep · dpl.js
   The static tile is complete without this file. This file draws the data rings around the four circles, opens one
   law at a time in the panel under them (as large as it needs), and turns "Compare All Materials" into a window.
   Data is injected at build time from src/content.mjs. Nothing moves by itself except the slow ticks around the disc and the pulse of its centre. */
(function () {
  'use strict';
  var D = __DPL_DATA__;
  // the photos live next to this file: the base is read from this script's own address, so dpl.js is identical in every build
  var cs = document.currentScript, BASE = cs && cs.src ? cs.src.replace(/[^/]*$/, '') : '';
  var NS = 'http://www.w3.org/2000/svg';
  var COL = { pu: '#5E7A85', hr: '#7E98A2', mem: '#9AAFB7', tempur: '#CDB892', dun: '#4FD3CB', bio: '#A4D4DC' };
  var A0 = -90, SWEEP = 300;   // every ring starts at the top and can run 300 degrees
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function mat(id) { for (var i = 0; i < D.materials.length; i++) if (D.materials[i].id === id) return D.materials[i]; return { name: id }; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function pt(r, a) { var t = a * Math.PI / 180; return (120 + r * Math.cos(t)).toFixed(2) + ' ' + (120 + r * Math.sin(t)).toFixed(2); }
  function arc(r, a0, a1) { if (a1 - a0 < 1) a1 = a0 + 1; return 'M' + pt(r, a0) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + pt(r, a1); }
  function ang(v, max) { return A0 + SWEEP * Math.min(v, max) / max; }

  // one chart: rings for a scale (one per material), or four forms (petals) for the facts of natural origin.
  // big = the panel chart (wide rings around a small photo); closed = the circle on the card (thin rings hugging the rim, photo fills 70%)
  function chart(p, big) {
    var c = p.chart, svg = sv('svg', { viewBox: '0 0 240 240', 'class': 'dpl__ring', 'aria-hidden': 'true', focusable: 'false' });
    if (!big) svg.appendChild(sv('path', { 'class': 'dec', d: arc(119, 52, 128) }));   // the arc the tab sits on
    if (c.kind === 'petals') {
      c.petals.forEach(function (name, i) {
        var a = -90 + i * 90 + 7, r = big ? 100 : 110, g = sv('g', { 'data-m': 'p' + i, style: '--c:' + (i % 2 ? COL.bio : COL.dun) + ';--w:' + (big ? 12 : 7) });
        g.appendChild(sv('path', { 'class': 'trk', d: arc(r, a, a + 76) }));
        g.appendChild(sv('path', { 'class': 'val', d: arc(r, a, a + 76), pathLength: 1, style: '--d:' + (i * 0.12) + 's' }));
        svg.appendChild(g);
      });
      return svg;
    }
    var rings = big ? c.rings : c.rings.filter(function (r) { return c.card.indexOf(r.m) >= 0; });
    rings.forEach(function (rg, i) {
      var r = big ? 78 + i * 9 : 101 + i * 5.2;
      var g = sv('g', { 'data-m': rg.m, style: '--c:' + COL[rg.m] + ';--w:' + (big ? 6 : 3.2) });
      g.appendChild(sv('path', { 'class': 'trk' + (rg.none ? ' is-none' : ''), d: arc(r, A0, A0 + SWEEP), pathLength: 1 }));
      if (!rg.none) {
        var a1 = ang(rg.lo, c.max);
        g.appendChild(sv('path', { 'class': 'val', d: arc(r, A0, a1), pathLength: 1, style: '--d:' + (i * 0.12) + 's' }));
        if (rg.hi) g.appendChild(sv('path', { 'class': 'val lo', d: arc(r, a1, ang(rg.hi, c.max)), pathLength: 1, style: '--d:' + (0.5 + i * 0.12) + 's' }));
      }
      svg.appendChild(g);
    });
    return svg;
  }

  function legend(p) {
    var c = p.chart;
    if (c.kind === 'petals') return c.petals.map(function (n, i) { return '<li><button type="button" class="is-ours" data-m="p' + i + '" data-v="' + esc(n) + '" data-n="' + esc(p.title) + '"><i style="--c:' + (i % 2 ? COL.bio : COL.dun) + '"></i><span>' + esc(n) + '</span><b>&#10003;</b></button></li>'; }).join('');
    return c.rings.map(function (rg) {
      var m = mat(rg.m), n = rg.name || m.name;
      return '<li><button type="button" class="' + (m.ours ? 'is-ours' : '') + (rg.v.length > 16 ? ' is-long' : '') + '" data-m="' + rg.m + '" data-v="' + esc(rg.rv || rg.v) + '" data-n="' + esc(n) + '"><i style="--c:' + COL[rg.m] + '"></i><span>' + esc(n) + '</span><b>' + esc(rg.v) + '</b></button></li>';
    }).join('');
  }

  function panelHtml(p, i) {
    var P = D.pillars, prev = P[(i + P.length - 1) % P.length], next = P[(i + 1) % P.length], c = p.chart;
    return '<div class="dpl__pin">' +
      '<button type="button" class="dpl__x" data-close aria-label="Close ' + esc(p.title) + '">&times;</button><div class="dpl__viz"><div class="dpl__big"><img src="' + BASE + p.img + '.webp" width="480" height="480" alt="' + esc(p.alt) + '"><div class="dpl__read" aria-hidden="true"><b></b><span></span></div></div>' +
      '<p class="dpl__cl">' + esc(c.label) + (c.kind === 'radial' && c.unit !== 'airflow scales' && c.unit !== 'SAG factor' ? ' · ' + esc(c.unit) : '') + '</p>' +
      '<ul class="dpl__lg" aria-label="' + esc(c.label) + ' by material">' + legend(p) + '</ul></div>' +
      '<div class="dpl__tx"><p class="dpl__pe">' + p.n + ' · ' + esc(p.verb) + '</p><h3 class="dpl__ph" id="dpl-ph" tabindex="-1">' + esc(p.head) + '</h3>' +
      p.body.map(function (t) { return '<p class="dpl__bd">' + esc(t) + '</p>'; }).join('') +
      (p.quote ? '<p class="dpl__q">' + esc(p.quote) + '</p>' : '') +
      '<ul class="dpl__st">' + p.stats.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></li>'; }).join('') + '</ul>' +
      (p.vs ? '<details class="dpl__vs"><summary>' + esc(p.vs.q) + '</summary><p>' + esc(p.vs.a) + '</p></details>' : '') +
      '<div class="dpl__act"><button type="button" class="dpl__btn is-pri" data-cmp>' + esc(D.compare) + '</button>' +
      '<button type="button" class="dpl__btn" data-go="' + prev.id + '"><u aria-hidden="true">&larr;</u> ' + esc(prev.label) + '</button>' +
      '<button type="button" class="dpl__btn" data-go="' + next.id + '">' + esc(next.label) + ' <u aria-hidden="true">&rarr;</u></button></div></div></div>';
  }

  function init(root) {
    if (root.getAttribute('data-dpl') === 'on') return;
    root.setAttribute('data-dpl', 'on');
    root.classList.add('is-js');
    var sun = root.querySelector('.dpl__sun'), panel = root.querySelector('.dpl__panel'), slot = panel && panel.firstElementChild;
    var items = [].slice.call(root.querySelectorAll('.dpl__p')), rows = [].slice.call(root.querySelectorAll('.dpl__row')), cur = -1, opener = null;
    if (!sun || !panel || !slot) return;

    items.forEach(function (li, i) {
      var p = D.pillars[i], orb = li.querySelector('.dpl__orb');
      if (!p || !orb) return;
      orb.insertBefore(chart(p, false), orb.firstChild);
      orb.addEventListener('click', function () { opener = orb; toggle(i); });
      orb.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && rows[i]) rows[i].classList.add('is-peek'); });
      orb.addEventListener('pointerleave', function () { if (rows[i]) rows[i].classList.remove('is-peek'); });
    });
    // a row is the same law as its circle: pointing at it lights the circle, a click opens it (the circle's button stays the keyboard path)
    rows.forEach(function (r, i) {
      r.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && items[i]) items[i].classList.add('is-peek'); });
      r.addEventListener('pointerleave', function () { if (items[i]) items[i].classList.remove('is-peek'); });
      r.addEventListener('click', function () { var o = items[i] && items[i].querySelector('.dpl__orb'); if (o) { opener = o; toggle(i); } });
    });

    function setExpanded() {
      items.forEach(function (li, i) {
        li.classList.toggle('is-on', i === cur);
        if (rows[i]) rows[i].classList.toggle('is-on', i === cur);
        [].forEach.call(li.querySelectorAll('[aria-controls]'), function (b) { b.setAttribute('aria-expanded', i === cur ? 'true' : 'false'); });
      });
      sun.classList.toggle('has-on', cur >= 0);
    }
    function toggle(i) { if (i === cur) close(); else open(i, true); }
    function open(i, focus) {
      cur = i; var p = D.pillars[i];
      slot.innerHTML = panelHtml(p, i);
      var big = slot.querySelector('.dpl__big'), svg = chart(p, true);
      big.insertBefore(svg, big.firstChild);
      wire(slot, svg);
      panel.hidden = false; panel.setAttribute('aria-label', p.title);
      requestAnimationFrame(function () { panel.classList.add('is-open'); });
      setExpanded();
      root.dispatchEvent(new CustomEvent('dpl:open', { bubbles: true, detail: { id: p.id } }));
      if (focus) {
        var h = slot.querySelector('#dpl-ph');
        setTimeout(function () {
          if (h) h.focus({ preventScroll: true });
          var r = panel.getBoundingClientRect();
          if (r.top > window.innerHeight * 0.7 || r.top < 0) panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }, reduce ? 0 : 120);
      }
    }
    function close() {
      var was = cur; cur = -1; panel.classList.remove('is-open'); setExpanded();
      setTimeout(function () { if (cur < 0) { slot.innerHTML = ''; panel.hidden = true; } }, reduce ? 0 : 560);
      var back = (opener && document.contains(opener)) ? opener : items[was] && items[was].querySelector('.dpl__orb');
      if (back) back.focus({ preventScroll: true });
    }

    // hover / focus / tap on a ring or a legend row: the value and the material appear in the centre
    function wire(box, svg) {
      var read = box.querySelector('.dpl__read'), rb = read.querySelector('b'), rs = read.querySelector('span'), sticky = null;
      function hl(m) {
        var btn = m && box.querySelector('.dpl__lg [data-m="' + m + '"]');
        [].forEach.call(svg.querySelectorAll('g[data-m]'), function (g) { g.classList.toggle('is-hl', g.getAttribute('data-m') === m); });
        [].forEach.call(box.querySelectorAll('.dpl__lg button'), function (b) { b.classList.toggle('is-on', b === btn); });
        svg.classList.toggle('has-hl', !!m);
        if (btn) { rb.textContent = btn.getAttribute('data-v'); rs.textContent = btn.getAttribute('data-n'); }
        read.classList.toggle('is-on', !!btn);
      }
      [].forEach.call(svg.querySelectorAll('g[data-m]'), function (g) {
        g.addEventListener('pointerenter', function () { hl(g.getAttribute('data-m')); });
        g.addEventListener('pointerleave', function () { hl(sticky); });
        g.addEventListener('click', function () { sticky = sticky === g.getAttribute('data-m') ? null : g.getAttribute('data-m'); hl(sticky); });
      });
      [].forEach.call(box.querySelectorAll('.dpl__lg button'), function (b) {
        var m = b.getAttribute('data-m');
        b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hl(m); });
        b.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hl(sticky); });
        b.addEventListener('focus', function () { hl(m); });
        b.addEventListener('blur', function () { hl(sticky); });
        b.addEventListener('click', function () { sticky = sticky === m ? null : m; hl(sticky || m); });
      });
      box.querySelector('[data-close]').addEventListener('click', close);
      [].forEach.call(box.querySelectorAll('[data-go]'), function (b) {
        b.addEventListener('click', function () { for (var k = 0; k < D.pillars.length; k++) if (D.pillars[k].id === b.getAttribute('data-go')) { opener = null; open(k, true); } });
      });
      box.querySelector('[data-cmp]').addEventListener('click', function (e) { showCompare(e.currentTarget); });
    }

    // the comparison: inline details without JS, a modal window with JS
    var cmp = root.querySelector('.dpl__cmp'), dlg = null;
    function showCompare(from) {
      if (!cmp) return;
      if (!dlg) {
        if (typeof HTMLDialogElement !== 'function') { cmp.open = true; cmp.scrollIntoView({ block: 'start' }); return; }
        dlg = document.createElement('dialog'); dlg.className = 'dpl__dlg'; dlg.setAttribute('aria-labelledby', 'dpl-dh');
        dlg.innerHTML = '<div class="dpl__dlgin"><div class="dpl__dlghd"><h3 id="dpl-dh">' + esc(D.compare) + '</h3><button type="button" class="dpl__x" aria-label="Close the comparison">&times;</button></div></div>';
        dlg.firstChild.appendChild(cmp.querySelector('.dpl__tbw'));
        root.appendChild(dlg);
        dlg.querySelector('.dpl__x').addEventListener('click', function () { dlg.close(); });
        dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
        dlg.addEventListener('close', function () { document.documentElement.classList.remove('dpl-lock'); if (dlg._from && document.contains(dlg._from)) dlg._from.focus({ preventScroll: true }); });
      }
      dlg._from = from; document.documentElement.classList.add('dpl-lock'); dlg.showModal();
      var x = dlg.querySelector('.dpl__x'); if (x) x.focus();
    }
    if (cmp) {
      var sum = cmp.querySelector('summary');
      sum.addEventListener('click', function (e) { if (typeof HTMLDialogElement === 'function') { e.preventDefault(); showCompare(sum); } });
    }

    // links to other parts of the page (the navigator, the Firmness block, the System tile) show only when their target is there
    [].forEach.call(root.querySelectorAll('[data-need]'), function (el) { if (document.querySelector(el.getAttribute('data-need'))) el.hidden = false; });

    // draw the rings when the band comes into view (immediately under reduced motion or without IntersectionObserver)
    if (reduce || !('IntersectionObserver' in window)) root.classList.add('is-in');
    else { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { root.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.15 }); io.observe(root); }

    // deep links: #dpl-support, #dpl-adapt, #dpl-breathe, #dpl-natural open that law; #dpl-compare opens the comparison
    function fromHash() {
      var h = (location.hash || '').replace('#', '');
      if (h === 'dpl-compare') { showCompare(null); return; }
      for (var k = 0; k < D.pillars.length; k++) if (h === 'dpl-' + D.pillars[k].id) { open(k, false); setTimeout(function () { root.scrollIntoView({ block: 'start' }); }, 50); }
    }
    fromHash(); window.addEventListener('hashchange', fromHash);
  }

  function scan() { [].forEach.call(document.querySelectorAll('section.dpl'), init); }
  window.DPL = { scan: scan, version: D.version };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  // Ecwid can re-render the page: a fresh copy of the tile gets wired again, an already wired one is left alone
  var q = 0;
  new MutationObserver(function () { if (!q) q = requestAnimationFrame(function () { q = 0; scan(); }); }).observe(document.documentElement, { childList: true, subtree: true });
})();
