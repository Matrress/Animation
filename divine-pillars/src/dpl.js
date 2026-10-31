/* Divine DunlopDreams · Four Laws of Good Sleep · dpl.js
   The static tile is complete without this file. This file draws the data rings around the four circles, opens one
   law at a time in the panel under them (as large as it needs), and turns "Compare All Materials" into a window.
   Data is injected at build time from src/content.mjs. Around each circle sit the phases of the moon, lit in turn.
   A line with a travelling light joins the four circles (desktop). A tropical night frames the band: the Earth turns in the
   top-right corner (the Hero's own way of drawing it, scaled down), Orion glows in the top-left, a still moon sits beside the
   creed. Under reduced motion nothing moves. */
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
  // one phase of the moon as a path: f 0 = new, .5 = full, 1 = new again (the same drawing as in build.mjs)
  function fx(n) { return +n.toFixed(2); }
  function moonD(cx, cy, r, f) {
    f = ((f % 1) + 1) % 1;
    var q, wax, t, top, bot;
    if (f < 0.04 || f > 0.96) { q = r * 0.42; return 'M' + fx(cx - q) + ' ' + fx(cy) + 'a' + fx(q) + ' ' + fx(q) + ' 0 1 0 ' + fx(2 * q) + ' 0a' + fx(q) + ' ' + fx(q) + ' 0 1 0 ' + fx(-2 * q) + ' 0Z'; }
    if (Math.abs(f - 0.5) < 0.02) return 'M' + fx(cx - r) + ' ' + fx(cy) + 'a' + fx(r) + ' ' + fx(r) + ' 0 1 0 ' + fx(2 * r) + ' 0a' + fx(r) + ' ' + fx(r) + ' 0 1 0 ' + fx(-2 * r) + ' 0Z';
    wax = f < 0.5; t = wax ? 1 - 4 * f : 4 * f - 3; top = fx(cx) + ' ' + fx(cy - r); bot = fx(cx) + ' ' + fx(cy + r);
    return 'M' + top + 'A' + fx(r) + ' ' + fx(r) + ' 0 0 ' + (wax ? 1 : 0) + ' ' + bot + 'A' + fx(Math.abs(t) * r) + ' ' + fx(r) + ' 0 0 ' + (wax ? (t > 0 ? 0 : 1) : (t > 0 ? 1 : 0)) + ' ' + top + 'Z';
  }

  // one chart: rings for a scale (one per material), or four forms (petals) for the facts of natural origin
  function chart(p, big) {
    var c = p.chart, svg = sv('svg', { viewBox: '0 0 240 240', 'class': 'dpl__ring', 'aria-hidden': 'true', focusable: 'false' });
    if (!big) {   // twelve phases of the moon around each circle, the full moon on top; they light up in turn, one lunar cycle
      var f = sv('g', { 'class': 'lun' });
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; f.appendChild(sv('path', { 'class': 'ln', style: '--i:' + i, d: moonD(120 + 124 * Math.sin(a), 120 - 124 * Math.cos(a), 4.4, 0.5 + i / 12) })); }
      svg.appendChild(f);
    }
    if (c.kind === 'petals') {
      c.petals.forEach(function (name, i) {
        var a = -90 + i * 90 + 7, g = sv('g', { 'data-m': 'p' + i, style: '--c:' + (i % 2 ? COL.bio : COL.dun) + ';--w:' + (big ? 12 : 9) });
        g.appendChild(sv('path', { 'class': 'trk', d: arc(big ? 100 : 98, a, a + 76) }));
        g.appendChild(sv('path', { 'class': 'val', d: arc(big ? 100 : 98, a, a + 76), pathLength: 1, style: '--d:' + (i * 0.12) + 's' }));
        svg.appendChild(g);
      });
      return svg;
    }
    var rings = big ? c.rings : c.rings.filter(function (r) { return c.card.indexOf(r.m) >= 0; });
    rings.forEach(function (rg, i) {
      var r = big ? 78 + i * 9 : 80 + i * 10;
      var g = sv('g', { 'data-m': rg.m, style: '--c:' + COL[rg.m] + ';--w:' + (big ? 6 : 6) });
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
      return '<li><button type="button" class="' + (m.ours ? 'is-ours' : '') + (rg.v.length > 16 ? ' is-long' : '') + '" data-m="' + rg.m + '" data-v="' + esc(rg.rv || rg.v) + '" data-n="' + esc(rg.rn || n) + '"><i style="--c:' + COL[rg.m] + '"></i><span>' + esc(n) + '</span><b>' + esc(rg.v) + '</b></button></li>';
    }).join('');
  }

  // a chain of cause and effect: three steps joined by arrows
  function chainHtml(c) { return '<ol class="dpl__chain">' + c.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></li>'; }).join('') + '</ol>'; }
  // the seven zones under the body, each with its own support, and the stretching effect along them
  function zonesHtml(z) {
    return '<div class="dpl__zn"><div class="dpl__zs" aria-hidden="true" style="grid-template-columns:' + z.map(function (x) { return x[1] + 'fr'; }).join(' ') + '">' +
      z.map(function (x, k) { return '<span style="--k:' + k + '">' + (k + 1) + '</span>'; }).join('') + '</div>' +
      '<p class="dpl__zx" aria-hidden="true"><i></i><span>Stretching Effect</span><i></i></p>' +
      '<ol class="dpl__zl">' + z.map(function (x, k) { return '<li><b>' + (k + 1) + '</b>' + esc(x[0]) + '</li>'; }).join('') + '</ol></div>';
  }
  function subHtml(s) {
    return '<details class="dpl__sub"><summary>' + esc(s.t) + '</summary><div class="dpl__sbd">' +
      (s.fig === 'zones' ? zonesHtml(s.zones) : '') + (s.chain ? chainHtml(s.chain) : '') +
      (s.body || []).map(function (t) { return '<p class="dpl__bd">' + esc(t) + '</p>'; }).join('') +
      (s.list ? '<dl class="dpl__lv">' + s.list.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
      '</div></details>';
  }

  function panelHtml(p, i) {
    var P = D.pillars, prev = P[(i + P.length - 1) % P.length], next = P[(i + 1) % P.length], c = p.chart;
    return '<div class="dpl__pin" data-p="' + p.id + '">' +
      '<button type="button" class="dpl__x" data-close aria-label="Close ' + esc(p.title) + '">&times;</button><div class="dpl__viz"><div class="dpl__big"><img src="' + BASE + p.img + '.webp" width="480" height="480" alt="' + esc(p.alt) + '"><div class="dpl__read" aria-hidden="true"><b></b><span></span></div></div>' +
      '<p class="dpl__cl">' + esc(c.label) + (c.unit === 'kg/m³' ? ' · ' + esc(c.unit) : '') + '</p>' +
      '<ul class="dpl__lg" aria-label="' + esc(c.label) + ' by material">' + legend(p) + '</ul></div>' +
      '<div class="dpl__tx"><p class="dpl__pe">' + p.n + ' · ' + esc(p.verb) + '</p><h3 class="dpl__ph" id="dpl-ph" tabindex="-1">' + esc(p.head) + '</h3>' +
      (p.chain ? chainHtml(p.chain) : '') +
      p.body.map(function (t) { return '<p class="dpl__bd">' + esc(t) + '</p>'; }).join('') +
      (p.quote ? '<p class="dpl__q">' + esc(p.quote) + '</p>' : '') +
      (p.sub ? '<div class="dpl__subs">' + p.sub.map(subHtml).join('') + '</div>' : '') +
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
    var items = [].slice.call(root.querySelectorAll('.dpl__p')), cur = -1, opener = null;
    if (!sun || !panel || !slot) return;

    items.forEach(function (li, i) {
      var p = D.pillars[i], orb = li.querySelector('.dpl__orb'), more = li.querySelector('.dpl__more');
      if (!p || !orb) return;
      orb.insertBefore(chart(p, false), orb.firstChild);
      [orb, more].forEach(function (b) { if (b) b.addEventListener('click', function () { opener = b; toggle(i); }); });
    });

    function setExpanded() {
      items.forEach(function (li, i) {
        li.classList.toggle('is-on', i === cur);
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

    bioMark(root);
    crit(root);
    planet(root);
    night(root);

    // draw the rings when the row of circles comes into view (the whole band is far taller than a phone screen) (immediately under reduced motion or without IntersectionObserver)
    if (reduce || !('IntersectionObserver' in window)) root.classList.add('is-in');
    else { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { root.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.15 }); io.observe(sun); }

    // deep links: #dpl-support, #dpl-adapt, #dpl-breathe, #dpl-natural open that law; #dpl-compare opens the comparison
    function fromHash() {
      var h = (location.hash || '').replace('#', '');
      if (h === 'dpl-compare') { showCompare(null); return; }
      for (var k = 0; k < D.pillars.length; k++) if (h === 'dpl-' + D.pillars[k].id) { open(k, false); setTimeout(function () { root.scrollIntoView({ block: 'start' }); }, 50); }
    }
    fromHash(); window.addEventListener('hashchange', fromHash);
  }

  // ---- the tropical night ----
  // Orion, and only Orion: the seven stars that outline it, in the empty space top-left (x, y, radius, colour). Betelgeuse is warm, Rigel blue-white.
  // They brighten one after another, very slowly (one pass in 16 s); a barely visible line joins them so the figure reads as a constellation.
  // positions from the real sky (right ascension and declination, 15 px per degree), so the figure has the true shape of Orion
  var ORION = [[30,14,3.4,'#FFCFA6'],[143,30,2.9,'#E6F0FF'],[84,154,2.5,'#F2F7FF'],[102,143,2.7,'#F2F7FF'],[118,130,2.5,'#F2F7FF'],[57,270,2.7,'#E6F0FF'],[183,248,3.8,'#D3E7FF']];
  var ORION_LINES = 'M30 14L143 30M30 14L84 154M143 30L118 130M84 154L118 130M84 154L57 270M118 130L183 248';
  function night(root) {
    var in_ = root.querySelector('.dpl__in');
    if (!in_ || in_.querySelector('.dpl__stars')) return;
    var svg = sv('svg', { 'class': 'dpl__stars', viewBox: '0 0 220 290', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(sv('path', { 'class': 'ol', d: ORION_LINES }));
    ORION.forEach(function (a, i) { svg.appendChild(sv('circle', { cx: a[0], cy: a[1], r: a[2], fill: a[3], 'class': 't', style: '--i:' + i })); });
    in_.insertBefore(svg, in_.firstChild);
  }

  // the Earth, drawn the way the Hero draws it: every pixel of a disc is looked up in the same Earth and cloud maps, lit from the
  // upper left, with a thin blue rim of atmosphere. One turn in 40 s. Runs only while it is seen; one still frame under reduced motion.
  function planet(root) {
    var host = root.querySelector('.dpl__planet'), cv = host && host.querySelector('canvas');
    if (!cv || !cv.getContext || !D.earth) return;
    var ctx = cv.getContext('2d'), E = null, C = null, G = null, EW = 1600, EH = 800, CW = 1600, CH = 800, TAU = Math.PI * 2, TR = 0.2;
    var seen = false, ready = false, raf = 0, last = 0, t0 = 0, now0 = 0;
    function load(src, done) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { done(i); }; i.onerror = function () { done(null); }; i.src = src; }
    function px(img, w, h, mono) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
      var d = x.getImageData(0, 0, w, h).data; if (!mono) return d;
      var m = new Uint8Array(w * h); for (var i = 0; i < m.length; i++) m[i] = d[i * 4]; return m;
    }
    function rowOf(lat, h) { return Math.min(h - 1, Math.max(0, Math.round((0.5 - lat / Math.PI) * (h - 1)))); }
    function geo() {
      var S = Math.round(cv.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5));
      if (!S) return false;
      if (G && G.S === S) return true;
      cv.width = cv.height = S;
      var n = S * S, h = S / 2, k = 0, tilt = 0.36, ct = Math.cos(tilt), st = Math.sin(tilt), L = [-0.5, 0.42, 0.76], ll = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]);
      L = [L[0] / ll, L[1] / ll, L[2] / ll];
      var g = { S: S, n: 0, idx: new Int32Array(n), lon: new Float32Array(n), row: new Uint16Array(n), crow: new Uint16Array(n), sh: new Float32Array(n), rim: new Float32Array(n), limb: new Float32Array(n), img: ctx.createImageData(S, S) };
      for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
        var T = (x + 0.5 - h) / h, U = -(y + 0.5 - h) / h, F = T * T + U * U;
        if (F >= 1) continue;
        var R = Math.sqrt(1 - F), X = U * ct + R * st, Z = -U * st + R * ct, lat = Math.asin(X), q = y * S + x;
        g.idx[k] = q * 4; g.lon[k] = Math.atan2(T, Z); g.row[k] = rowOf(lat, EH); g.crow[k] = rowOf(lat, CH);
        var j = Math.max(0, Math.min(1, (T * L[0] + U * L[1] + R * L[2]) * 1.1 + 0.1));
        g.sh[k] = 0.12 + 0.96 * Math.pow(j, 0.85); g.rim[k] = Math.pow(1 - R, 2.6) * (0.3 + 0.7 * j); g.limb[k] = Math.pow(1 - R, 9) * (0.35 + 0.65 * j);
        g.img.data[q * 4 + 3] = Math.round(Math.min(1, (1 - Math.sqrt(F)) * h / 1.4) * 255);
        k++;
      }
      g.n = k; G = g; return true;
    }
    function draw(t) {
      if (!G || !E) return;
      var d = G.img.data, X = reduce ? 0 : t * TAU / 40, Z = TR - X, V = TR - X * 1.05 + 0.8, M = 1 / TAU;
      for (var q = 0; q < G.n; q++) {
        var u = (G.lon[q] + Z) * M + 0.5; u -= Math.floor(u);
        var p = (G.row[q] * EW + ((u * EW) | 0)) * 4, r = E[p], g = E[p + 1], b = E[p + 2], c = 0;
        if (C) { var w = (G.lon[q] + V) * M + 0.5; w -= Math.floor(w); c = C[G.crow[q] * CW + ((w * CW) | 0)] * 0.0033; }
        r += (248 - r) * c; g += (251 - g) * c; b += (255 - b) * c;
        var sh = G.sh[q], rm = G.rim[q], lb = G.limb[q], o = G.idx[q];
        d[o] = r * sh + rm * 120 + lb * 175; d[o + 1] = g * sh + rm * 185 + lb * 215; d[o + 2] = b * sh + rm * 255 + lb * 255;
      }
      ctx.putImageData(G.img, 0, 0);
    }
    function tick(now) {
      raf = 0; if (!seen || document.hidden || !ready) return;
      if (!now0) now0 = now;
      if (now - last >= 33) { last = now; draw((now - now0) / 1000); }
      raf = requestAnimationFrame(tick);
    }
    function go() { if (!raf && ready && seen && !reduce) raf = requestAnimationFrame(tick); }
    function start() {
      load(D.earth, function (i) {
        if (!i) return;
        try { E = px(i, EW, EH, false); } catch (e) { return; }
        load(D.clouds, function (c) {
          try { C = c ? px(c, CW, CH, true) : null; } catch (e) { C = null; }
          ready = true;
          if (geo()) { draw(0); host.setAttribute('data-ready', ''); }
          go();
        });
      });
    }
    (window.requestIdleCallback || function (f) { setTimeout(f, 900); })(start, { timeout: 2500 });
    if (window.ResizeObserver) new ResizeObserver(function () { if (ready && geo()) draw(0); }).observe(host);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es.some(function (e) { return e.isIntersecting; }); go(); }).observe(host);
    else { seen = true; go(); }
    document.addEventListener('visibilitychange', go);
  }

  // the Bio Dunlop window: a mouse hovering opens it, leaving closes it; a tap, Enter or Space opens it for good (native <details>)
  function bioMark(root) {
    var b = root.querySelector('.dpl__bio'), t = 0;
    if (!b) return;
    var shut = function () { b.open = false; b.removeAttribute('data-hover'); };
    b.addEventListener('pointerover', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(t); if (!b.open) { b.open = true; b.setAttribute('data-hover', ''); } });
    b.addEventListener('pointerout', function (e) {
      if (e.pointerType !== 'mouse' || !b.hasAttribute('data-hover') || (e.relatedTarget && b.contains(e.relatedTarget))) return;
      t = setTimeout(function () { if (b.hasAttribute('data-hover')) shut(); }, 220);
    });
    b.querySelector('summary').addEventListener('click', function (e) { if (b.hasAttribute('data-hover')) { e.preventDefault(); b.removeAttribute('data-hover'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && b.open) shut(); });
    document.addEventListener('pointerdown', function (e) { if (b.open && !b.contains(e.target)) shut(); });
  }

  // the four criteria: the word "Criteria" in the title opens them. Mouse: hover opens, leaving closes, a click keeps it open.
  // Touch and keyboard: tap or Enter toggles. Escape, a press outside, or Tab away closes. The panel holds no controls.
  function crit(root) {
    var ht = root.querySelector('.dpl__ht'), b = ht && ht.querySelector('.dpl__crit-b'), p = ht && ht.querySelector('.dpl__crit'), t = 0, hover = false, key = false;
    if (!b || !p) return;
    var isOpen = function () { return p.classList.contains('is-open'); };
    var show = function (byHover) { clearTimeout(t); hover = !!byHover; p.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); };
    var shut = function () { clearTimeout(t); hover = false; p.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); };
    var inside = function (n) { return n && (b.contains(n) || p.contains(n)); };
    [b, p].forEach(function (el) {
      el.addEventListener('pointerover', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(t); if (!isOpen()) show(true); });
      el.addEventListener('pointerout', function (e) {
        if (e.pointerType !== 'mouse' || !hover || inside(e.relatedTarget)) return;
        t = setTimeout(function () { if (hover) shut(); }, 260);
      });
    });
    b.addEventListener('click', function () { if (hover) { hover = false; return; } if (isOpen()) shut(); else show(false); });   // a click on a hover-opened panel keeps it open
    b.addEventListener('blur', function () { if (key && !hover && isOpen()) shut(); });
    document.addEventListener('keydown', function (e) { key = true; if (e.key === 'Escape' && isOpen()) { var was = document.activeElement; shut(); if (inside(was)) b.focus(); } });
    document.addEventListener('pointerdown', function (e) { key = false; if (isOpen() && !inside(e.target)) shut(); });
  }

  function scan() { [].forEach.call(document.querySelectorAll('section.dpl'), init); }
  window.DPL = { scan: scan, version: D.version };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  // Ecwid can re-render the page: a fresh copy of the tile gets wired again, an already wired one is left alone
  var q = 0;
  new MutationObserver(function () { if (!q) q = requestAnimationFrame(function () { q = 0; scan(); }); }).observe(document.documentElement, { childList: true, subtree: true });
})();
