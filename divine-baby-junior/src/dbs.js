/* Divine DunlopDreams · mattress selector and presentation (dbs) 0.9.0
 *
 * Turns a static, readable block (marked with data-dbs) into two equal cubes side by side: the selection on the
 * left (buttons for type, size and height, a summary) and the presentation on the right (tabs and panels; pressing
 * a selection button opens the matching panel, e.g. a size opens the dimensioned drawing). Everything is in
 * centimetres and inches. The choice is copied into Ecwid's own option dropdowns, so Ecwid keeps the price,
 * the cart and the checkout.
 *
 * Safe by design:
 *  - acts only on elements marked [data-dbs]; every element it creates lives inside them;
 *  - changes Ecwid's dropdowns only when the customer picks something (never on load);
 *  - without this script the static block stays a complete, readable list;
 *  - no MutationObserver; a short, bounded poll waits for Ecwid to render the page.
 *
 * Markup contract (see description.html):
 *   [data-dbs data-ecwid-size="size" data-ecwid-height="height"]
 *     .dbs-group[data-group="range"]  li[data-set="cot"]
 *     .dbs-group[data-group="size"]   ul[data-sizes="cot"]  li[data-range="cot" data-w="60" data-l="120"]  (cm)
 *     .dbs-group[data-group="height"] li[data-h="12"]                                                       (cm)
 *     [data-panel="size|height|detail|..." data-title="Size"]  articles shown in the presentation cube, as tabs
 * Each li holds <span class="dbs-cm"> and <span class="dbs-in"> text. Any model with width x length x height works.
 */
(function () {
  'use strict';
  if (window.__dbsLoaded) { return; }
  window.__dbsLoaded = 1;

  var NS = 'http://www.w3.org/2000/svg';
  var COS = 0.8660254, SIN = 0.5;
  var VBW = 640, VBH = 380;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text != null) { e.textContent = text; } return e; }
  function svg(tag, cls) { var e = document.createElementNS(NS, tag); if (cls) { e.setAttribute('class', cls); } return e; }
  function inch(cm) { return (Math.round(cm / 2.54 * 10) / 10).toFixed(1); }
  function fire(node, type) {
    var e;
    try { e = new Event(type, { bubbles: true }); } catch (x) { e = document.createEvent('Event'); e.initEvent(type, true, true); }
    node.dispatchEvent(e);
  }

  /* ---------- Ecwid's own option controls ---------- */
  function findSelect(name) {
    var want = String(name || '').toLowerCase();
    var blocks = $$('.details-product-option');
    for (var i = 0; i < blocks.length; i++) {
      var t = $('.details-product-option__title', blocks[i]);
      var txt = t ? t.textContent.replace(/[*\s]+$/, '').replace(/^\s+/, '').toLowerCase() : '';
      if (txt === want) { var s = $('select', blocks[i]); if (s) { return s; } }
    }
    return null;
  }
  function optText(o) { return (o.text || o.label || '').replace(/\s+/g, ' '); }
  function parseSize(txt) {
    var m = /(\d{2,3})\s*[x×]\s*(\d{2,3})/i.exec(txt);
    return m ? { a: +m[1], b: +m[2] } : null;
  }
  function parseHeight(txt) {
    var m = /(\d{1,2}(?:\.\d)?)\s*cm/i.exec(txt);
    return m ? +m[1] : null;
  }
  function selectedText(sel) { return sel && sel.selectedIndex > -1 ? optText(sel.options[sel.selectedIndex]) : ''; }
  function setSelect(sel, test) {
    for (var i = 0; i < sel.options.length; i++) {
      if (test(optText(sel.options[i]))) {
        if (sel.selectedIndex !== i) { sel.selectedIndex = i; fire(sel, 'input'); fire(sel, 'change'); }
        return true;
      }
    }
    return false;
  }
  function readPrice() {
    var e = $('.details-product-price__value');
    var t = e ? e.textContent.replace(/\s+/g, ' ').replace(/^\s|\s$/g, '') : '';
    return /\d/.test(t) && !/^[^\d]*0(?:[.,]0+)?$/.test(t) ? t : '';
  }
  function nativeAddToBag(root) {
    var all = $$('button');
    for (var i = 0; i < all.length; i++) {
      if (root.contains(all[i])) { continue; }
      if (/add to (bag|cart)/i.test(all[i].textContent) && !/more/i.test(all[i].textContent)) { return all[i]; }
    }
    return null;
  }

  /* ---------- one selector ---------- */
  function init(root) {
    if (root.__dbs) { return; }
    root.__dbs = 1;

    var sizes = $$('[data-w]', root).map(function (li) {
      return { li: li, w: +li.getAttribute('data-w'), l: +li.getAttribute('data-l'), range: li.getAttribute('data-range') };
    });
    var heights = $$('[data-h]', root).map(function (li) { return { li: li, h: +li.getAttribute('data-h') }; });
    var ranges = $$('[data-set]', root).map(function (li) { return { li: li, key: li.getAttribute('data-set') }; });
    if (!sizes.length || !heights.length) { return; }

    var nameSize = root.getAttribute('data-ecwid-size') || 'size';
    var nameHeight = root.getAttribute('data-ecwid-height') || 'height';
    var maxL = 0, maxW = 0, maxH = 0, big = sizes[0];
    sizes.forEach(function (s) { if (s.w * s.l > big.w * big.l) { big = s; } if (s.l > maxL) { maxL = s.l; } if (s.w > maxW) { maxW = s.w; } });
    heights.forEach(function (h) { if (h.h > maxH) { maxH = h.h; } });
    var S = Math.min((VBW - 100) / ((maxL + maxW) * COS), (VBH - 80) / ((maxL + maxW) * SIN + maxH));

    var state = { range: null, size: null, h: null, unit: 'cm', synced: 'none' };
    try { var u = window.localStorage.getItem('dbs-unit'); if (u === 'in' || u === 'cm') { state.unit = u; } } catch (e1) { /* storage may be blocked */ }
    var busy = false;

    /* upgrade the static lists into radio buttons */
    function upgrade(group, items, labelledBy) {
      var ul = items[0].li.parentNode;
      $$('ul', group).forEach(function (u2) { u2.setAttribute('role', 'radiogroup'); u2.setAttribute('aria-labelledby', labelledBy); });
      items.forEach(function (it) {
        var b = el('button', 'dbs-btn'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.tabIndex = -1;
        if (it.h) { var g = el('span', 'dbs-glyph'); g.setAttribute('aria-hidden', 'true'); g.style.height = (it.h * 2.4) + 'px'; b.appendChild(g); }
        while (it.li.firstChild) { b.appendChild(it.li.firstChild); }
        it.li.appendChild(b); it.btn = b;
      });
      return ul;
    }
    var groups = {};
    $$('.dbs-group', root).forEach(function (g, i) {
      var lab = $('.dbs-gl', g); if (lab) { lab.id = lab.id || ('dbs-gl-' + i + '-' + Math.round(Math.random() * 1e6)); }
      groups[g.getAttribute('data-group')] = { el: g, label: lab ? lab.id : '' };
    });
    if (ranges.length) { upgrade(groups.range.el, ranges, groups.range.label); }
    upgrade(groups.size.el, sizes, groups.size.label);
    upgrade(groups.height.el, heights, groups.height.label);

    /* head: units switch */
    var head = el('div', 'dbs-head');
    head.appendChild(el('p', 'dbs-ht', 'Show first'));
    var units = el('div', 'dbs-units'); units.setAttribute('role', 'radiogroup'); units.setAttribute('aria-label', 'Units shown first');
    ['cm', 'in'].forEach(function (k) {
      var b = el('button', 'dbs-u', k === 'cm' ? 'cm' : 'inches'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('data-unit', k);
      b.addEventListener('click', function () { state.unit = k; try { window.localStorage.setItem('dbs-unit', k); } catch (e2) { /* ignore */ } render(); });
      units.appendChild(b);
    });
    head.appendChild(units);
    var left = $('.dbs-controls', root) || root;
    left.className += ' dbs-cube dbs-sel';
    left.insertBefore(head, left.firstChild);

    /* the drawing */
    var stageWrap = el('div', 'dbs-stage-wrap');
    var stage = el('div', 'dbs-stage');
    var s = svg('svg', 'dbs-svg'); s.setAttribute('viewBox', '0 0 ' + VBW + ' ' + VBH); s.setAttribute('role', 'img'); s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var ghost = svg('polygon', 'dbs-ghost'), dims = svg('path', 'dbs-dim');
    var fR = svg('polygon', 'dbs-fr'), fL = svg('polygon', 'dbs-fl'), fT = svg('polygon', 'dbs-ft'), quilt = svg('path', 'dbs-quilt');
    [ghost, fR, fL, fT, quilt, dims].forEach(function (n) { s.appendChild(n); });
    stage.appendChild(s);
    function label(cls) { var l = el('div', 'dbs-lab ' + cls); l.appendChild(el('span', 'dbs-cm')); l.appendChild(el('span', 'dbs-in')); stage.appendChild(l); return l; }
    var labL = label('dbs-lab--l'), labW = label('dbs-lab--w'), labH = label('dbs-lab--h');
    stageWrap.appendChild(stage);
    var legend = el('p', 'dbs-leg', 'Dashed outline: the largest size, ' + big.w + ' × ' + big.l + ' cm (' + inch(big.w) + ' × ' + inch(big.l) + ' in). Drawn to scale.');
    stageWrap.appendChild(legend);

    /* summary */
    var sum = el('div', 'dbs-sum'); sum.setAttribute('aria-live', 'polite');
    var sumK = el('p', 'dbs-sk', 'Your choice'), sumV = el('p', 'dbs-sv'), sumV2 = el('p', 'dbs-sv2'), sumSt = el('p', 'dbs-st');
    var sumRow = el('div', 'dbs-row'), sumPrice = el('p', 'dbs-price'), cta = el('button', 'dbs-cta', 'Add to bag'); cta.type = 'button';
    var see = el('button', 'dbs-see'); see.type = 'button'; see.hidden = true;
    [sumK, sumV, sumV2, sumSt].forEach(function (n) { sum.appendChild(n); });
    sumRow.appendChild(sumPrice); sumRow.appendChild(cta); sum.appendChild(sumRow);
    left.appendChild(sum);
    cta.addEventListener('click', function () { var b = nativeAddToBag(root); if (b) { b.click(); } });

    /* the presentation cube: tabs and panels */
    var panels = $$('[data-panel]', root).map(function (p, i) { return { el: p, key: p.getAttribute('data-panel'), title: p.getAttribute('data-title') || p.getAttribute('data-panel'), i: i }; });
    var pres = el('div', 'dbs-pres dbs-cube'), tabs = el('div', 'dbs-tabs'), pbody = el('div', 'dbs-pbody');
    tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Presentation');
    var uid = 'dbs' + Math.round(Math.random() * 1e6);
    panels.forEach(function (pn) {
      var t = el('button', 'dbs-tab', pn.title); t.type = 'button'; t.setAttribute('role', 'tab'); t.id = uid + '-t' + pn.i; t.setAttribute('aria-controls', uid + '-p' + pn.i);
      pn.el.id = uid + '-p' + pn.i; pn.el.setAttribute('role', 'tabpanel'); pn.el.setAttribute('aria-labelledby', t.id);
      t.addEventListener('click', function () { openPanel(pn.key); });
      t.addEventListener('keydown', function (e) {
        var k = e.key || e.keyCode, d = 0;
        if (k === 'ArrowRight' || k === 39) { d = 1; } else if (k === 'ArrowLeft' || k === 37) { d = -1; } else if (k === 'Home') { d = -99; } else if (k === 'End') { d = 99; } else { return; }
        var n = d === -99 ? 0 : d === 99 ? panels.length - 1 : (pn.i + d + panels.length) % panels.length;
        e.preventDefault(); panels[n].tab.focus(); openPanel(panels[n].key);
      });
      pn.tab = t; tabs.appendChild(t); pbody.appendChild(pn.el);
    });
    pres.appendChild(tabs); pres.appendChild(pbody);
    if (panels.length) { root.appendChild(pres); root.insertBefore(see, pres); }   /* phones: the button sits between the two cubes */
    see.addEventListener('click', function () { try { pres.scrollIntoView(reduce ? undefined : { behavior: 'smooth', block: 'start' }); } catch (e3) { pres.scrollIntoView(); } });
    function panelByKey(k) { for (var i = 0; i < panels.length; i++) { if (panels[i].key === k) { return panels[i]; } } return null; }
    function openPanel(key) {
      var found = panelByKey(key); if (!found) { return; }
      see.hidden = false; see.textContent = 'See the ' + found.title.toLowerCase() + ' view';
      panels.forEach(function (pn) { var on = pn === found; pn.el.hidden = !on; pn.tab.setAttribute('aria-selected', on ? 'true' : 'false'); pn.tab.tabIndex = on ? 0 : -1; });
    }
    var sizePanel = panelByKey('size');
    if (sizePanel) { var after = $('.dbj-tt', sizePanel.el); sizePanel.el.insertBefore(stageWrap, after ? after.nextSibling : sizePanel.el.firstChild); }
    else { (panels.length ? pres : left).appendChild(stageWrap); }

    /* geometry */
    var cur = { L: 0, W: 0, H: 0 };
    function pt(x, y, z, cx, cy) { return [VBW / 2 + ((x - cx) - (y - cy)) * COS * S, VBH / 2 + 12 + ((x - cx) + (y - cy)) * SIN * S - z * S]; }
    function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
    function put(node, p, ox, oy) { node.style.left = ((p[0] + ox) / VBW * 100).toFixed(2) + '%'; node.style.top = ((p[1] + oy) / VBH * 100).toFixed(2) + '%'; }
    function draw(L, W, H) {
      cur.L = L; cur.W = W; cur.H = H;
      var cx = L / 2, cy = W / 2;
      var A = pt(0, 0, 0, cx, cy), B = pt(L, 0, 0, cx, cy), C = pt(L, W, 0, cx, cy), D = pt(0, W, 0, cx, cy);
      var A2 = pt(0, 0, H, cx, cy), B2 = pt(L, 0, H, cx, cy), C2 = pt(L, W, H, cx, cy), D2 = pt(0, W, H, cx, cy);
      fT.setAttribute('points', pts([A2, B2, C2, D2]));
      fR.setAttribute('points', pts([B, C, C2, B2]));
      fL.setAttribute('points', pts([C, D, D2, C2]));
      var qd = '', qn = Math.max(4, Math.round(L / 16));       /* wide transverse quilting lines on the top face */
      for (var qi = 1; qi < qn; qi++) { var qa = pt(L * qi / qn, 0, H, cx, cy), qb = pt(L * qi / qn, W, H, cx, cy); qd += 'M' + qa[0].toFixed(1) + ' ' + qa[1].toFixed(1) + 'L' + qb[0].toFixed(1) + ' ' + qb[1].toFixed(1); }
      quilt.setAttribute('d', qd);
      var g = []; [[0, 0], [maxL, 0], [maxL, maxW], [0, maxW]].forEach(function (q) { g.push(pt(q[0], q[1], 0, maxL / 2, maxW / 2)); });
      ghost.setAttribute('points', pts(g));
      var o = 18;                                    /* dimension lines, offset from the edges */
      var nL = [-SIN, COS], nW = [SIN, COS];
      function off(p, n) { return [p[0] + n[0] * o, p[1] + n[1] * o]; }
      var dL1 = off(D, nL), dL2 = off(C, nL), dW1 = off(C, nW), dW2 = off(B, nW), dH1 = [D[0] - o, D[1]], dH2 = [D2[0] - o, D2[1]];
      function line(a, b) { return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
      dims.setAttribute('d', line(dL1, dL2) + line(dW1, dW2) + line(dH1, dH2) + line(D, dL1) + line(C, dL2) + line(C, dW1) + line(B, dW2) + line(D, dH1) + line(D2, dH2));
      put(labL, [(D[0] + C[0]) / 2, (D[1] + C[1]) / 2], nL[0] * 52, nL[1] * 40);
      put(labW, [(C[0] + B[0]) / 2, (C[1] + B[1]) / 2], nW[0] * 52, nW[1] * 40);
      put(labH, [(D[0] + D2[0]) / 2, (D[1] + D2[1]) / 2], -58, 0);
    }
    var raf = 0;
    function go(L, W, H) {
      if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
      if (reduce || !window.requestAnimationFrame) { draw(L, W, H); return; }
      var f = { L: cur.L, W: cur.W, H: cur.H }, t0 = null, dur = 440;
      function step(t) {
        if (t0 === null) { t0 = t; }
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        draw(f.L + (L - f.L) * e, f.W + (W - f.W) * e, f.H + (H - f.H) * e);
        raf = k < 1 ? window.requestAnimationFrame(step) : 0;
      }
      raf = window.requestAnimationFrame(step);
    }

    /* state helpers */
    function sizeObj() { for (var i = 0; i < sizes.length; i++) { if (sizes[i].li === state.size) { return sizes[i]; } } return null; }
    function heightObj() { for (var i = 0; i < heights.length; i++) { if (heights[i].li === state.h) { return heights[i]; } } return null; }
    function firstOfRange(r) { for (var i = 0; i < sizes.length; i++) { if (sizes[i].range === r) { return sizes[i]; } } return sizes[0]; }
    function rangeName() { for (var i = 0; i < ranges.length; i++) { if (ranges[i].key === state.range) { var nm = $('.dbs-cm', ranges[i].li); return (nm ? nm.textContent : '').replace(/^\s|\s$/g, ''); } } return ''; }

    function setLab(l, cm, inn) {
      $('.dbs-cm', l).textContent = cm; $('.dbs-in', l).textContent = inn;
    }
    function render() {
      root.setAttribute('data-unit', state.unit);
      $$('.dbs-u', root).forEach(function (b) { var on = b.getAttribute('data-unit') === state.unit; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      ranges.forEach(function (r) { var on = r.key === state.range; r.btn.setAttribute('aria-checked', on ? 'true' : 'false'); r.btn.tabIndex = on || (!state.range && r === ranges[0]) ? 0 : -1; });
      var shown = state.range || (ranges.length ? ranges[0].key : null);
      $$('[data-sizes]', root).forEach(function (ul) { ul.hidden = shown ? ul.getAttribute('data-sizes') !== shown : false; });
      var firstVisible = null;
      sizes.forEach(function (z) {
        var on = z.li === state.size; z.btn.setAttribute('aria-checked', on ? 'true' : 'false');
        if (!firstVisible && (!shown || z.range === shown)) { firstVisible = z; }
      });
      sizes.forEach(function (z) { z.btn.tabIndex = (z.li === state.size || (!sizeObj() && z === firstVisible)) ? 0 : -1; });
      heights.forEach(function (h, i) { var on = h.li === state.h; h.btn.setAttribute('aria-checked', on ? 'true' : 'false'); h.btn.tabIndex = (on || (!heightObj() && i === 0)) ? 0 : -1; });

      $$('[data-ht]', root).forEach(function (n) { var hv = heightObj(); n.className = n.className.replace(/\s*is-on/, '') + (hv && +n.getAttribute('data-ht') === hv.h ? ' is-on' : ''); });
      var z = sizeObj() || firstOfRange(shown), h = heightObj() || heights[Math.min(1, heights.length - 1)];
      var pending = !sizeObj() || !heightObj();
      root.setAttribute('data-pending', pending ? 'true' : 'false');
      go(z.l, z.w, h.h);
      setLab(labL, z.l + ' cm', inch(z.l) + ' in');
      setLab(labW, z.w + ' cm', inch(z.w) + ' in');
      setLab(labH, h.h + ' cm', inch(h.h) + ' in');
      s.setAttribute('aria-label', (rangeName() ? rangeName() + ' mattress, ' : 'Mattress, ') + z.w + ' by ' + z.l + ' centimetres (' + inch(z.w) + ' by ' + inch(z.l) + ' inches), ' + h.h + ' centimetres (' + inch(h.h) + ' inches) high' + (pending ? '. Example only: choose a size and a height.' : '.'));

      if (pending) {
        sumV.textContent = 'Choose a type, a size and a height.';
        sumV2.textContent = 'The drawing shows an example until you choose.';
        sumSt.textContent = '';
      } else {
        sumV.textContent = (rangeName() ? rangeName() + ' · ' : '') + z.w + ' × ' + z.l + ' cm · ' + h.h + ' cm';
        sumV2.textContent = inch(z.w) + ' × ' + inch(z.l) + ' in · ' + inch(h.h) + ' in · Medium';
        if (state.unit === 'in') { var a = sumV.textContent; sumV.textContent = sumV2.textContent.replace(' · Medium', ''); sumV2.textContent = a + ' · Medium'; }
        sumSt.textContent = state.synced === 'ok' ? 'Selected in the options on this page.' : state.synced === 'nomatch' ? 'This combination is not in the options yet. Please choose it in the options on this page.' : 'Please choose the same size and height in the options on this page.';
      }
      sumSt.setAttribute('data-state', pending ? 'none' : state.synced);
      cta.hidden = !(state.synced === 'ok' && !pending && nativeAddToBag(root));
    }

    /* push the choice into Ecwid's dropdowns, then show Ecwid's price */
    function pricePoll(n) {
      var p = readPrice();
      if (p && state.synced === 'ok') { sumPrice.textContent = p; sumRow.setAttribute('data-has-price', 'true'); return; }
      if (n > 0) { window.setTimeout(function () { pricePoll(n - 1); }, 350); } else { sumPrice.textContent = ''; sumRow.setAttribute('data-has-price', 'false'); }
    }
    function sync() {
      var z = sizeObj(), h = heightObj();
      var ss = findSelect(nameSize), hs = findSelect(nameHeight), ok = true, any = false;
      busy = true;
      try {
        if (z && ss) { any = true; ok = setSelect(ss, function (t) { var m = parseSize(t); return !!m && ((m.a === z.w && m.b === z.l) || (m.a === z.l && m.b === z.w)); }) && ok; }
        if (h && hs) { any = true; ok = setSelect(hs, function (t) { var m = parseHeight(t); return m === h.h; }) && ok; }
      } finally { busy = false; }
      var haveBoth = z && h && ss && hs;
      state.synced = !any ? 'none' : (ok && haveBoth ? 'ok' : (ok ? 'none' : 'nomatch'));
      if (state.synced === 'ok') { pricePoll(8); } else { sumPrice.textContent = ''; sumRow.setAttribute('data-has-price', 'false'); }
    }
    function choose(kind, it) {
      if (kind === 'range') {
        state.range = it.key;
        var z = sizeObj(); if (!z || z.range !== it.key) { state.size = null; }
      } else if (kind === 'size') { state.size = it.li; state.range = it.range || state.range; }
      else { state.h = it.li; }
      sync(); render();
      openPanel(kind === 'height' ? 'height' : 'size');
    }

    /* events: click and arrow keys on every radio group */
    function wire(items, kind) {
      items.forEach(function (it) {
        it.btn.addEventListener('click', function () { choose(kind, it); });
        it.btn.addEventListener('keydown', function (e) {
          var k = e.key || e.keyCode, dir = 0;
          if (k === 'ArrowRight' || k === 'ArrowDown' || k === 39 || k === 40) { dir = 1; }
          else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 37 || k === 38) { dir = -1; }
          else if (k === 'Home') { dir = -99; } else if (k === 'End') { dir = 99; } else { return; }
          var list = items.filter(function (x) { return !x.li.parentNode.hidden; });
          var i = list.indexOf(it), n = dir === -99 ? 0 : dir === 99 ? list.length - 1 : (i + dir + list.length) % list.length;
          e.preventDefault(); list[n].btn.focus(); choose(kind, list[n]);
        });
      });
    }
    wire(ranges, 'range'); wire(sizes, 'size'); wire(heights, 'height');

    /* follow the customer when they use Ecwid's own dropdowns */
    function fromNative() {
      if (busy) { return; }
      var ss = findSelect(nameSize), hs = findSelect(nameHeight), changed = false;
      var m = ss ? parseSize(selectedText(ss)) : null;
      if (m) { sizes.forEach(function (z) { if ((m.a === z.w && m.b === z.l) || (m.a === z.l && m.b === z.w)) { state.size = z.li; state.range = z.range || state.range; changed = true; } }); }
      var hv = hs ? parseHeight(selectedText(hs)) : null;
      if (hv !== null) { heights.forEach(function (h) { if (h.h === hv) { state.h = h.li; changed = true; } }); }
      if (changed) { openPanel(m ? 'size' : 'height'); state.synced = (sizeObj() && heightObj() && ss && hs) ? 'ok' : 'none'; if (state.synced === 'ok') { pricePoll(8); } render(); }
    }
    document.addEventListener('change', function (e) { var t = e.target; if (t && t.tagName === 'SELECT' && t.closest && t.closest('.details-product-option')) { fromNative(); } }, true);

    root.className += ' dbs--on';
    openPanel(panels.length ? panels[0].key : '');
    draw(big.l, big.w, heights[Math.min(1, heights.length - 1)].h);
    fromNative();
    render();
  }

  /* ---------- start: after Ecwid has rendered the page; bounded polling, no observers ---------- */
  var timer = 0;
  function scan() { $$('[data-dbs]').forEach(init); }
  function kick() {
    if (timer) { window.clearInterval(timer); }
    var n = 0; scan();
    timer = window.setInterval(function () { n++; scan(); if (n > 40) { window.clearInterval(timer); timer = 0; } }, 300);
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', kick); } else { kick(); }
  var tries = 0;
  (function hook() {
    if (window.Ecwid && window.Ecwid.OnPageLoaded && window.Ecwid.OnPageLoaded.add) { window.Ecwid.OnPageLoaded.add(function () { kick(); }); return; }
    if (tries++ < 50) { window.setTimeout(hook, 200); }
  }());
}());
