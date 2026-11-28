/* ===== core: the binding to Ecwid, shared by the television and the phone layer =====
   Ecwid stays the executor: options, price, bag and checkout are the store's own. This file only
   (1) reads and sets Ecwid's own dropdowns the way a customer would, (2) shows Ecwid's own price,
   (3) presses Ecwid's own Add to Bag button, only when the customer asks, and (4) keeps the selection laws. */
var doc = document, win = window;
function $(s, r) { return (r || doc).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
function txt(n) { return n ? String(n.textContent || '').replace(/[\s ]+/g, ' ').replace(/^ | $/g, '') : ''; }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fire(node, type) {
  var e; try { e = new Event(type, { bubbles: true }); } catch (x) { e = doc.createEvent('Event'); e.initEvent(type, true, true); }
  node.dispatchEvent(e);
}
function inch(cm) { return (Math.round(cm / 2.54 * 10) / 10).toFixed(1); }
function isPhone() {
  var q = win.location.search, s = win.screen || {}, p = Math.min(s.width || 9999, s.height || 9999) < 600;
  if (/[?&]ddtv=tv\b/.test(q)) { p = false; } if (/[?&]ddtv=phone\b/.test(q)) { p = true; }
  return p;
}

/* ---------- the two choices the customer makes (firmness and cover are fixed for this model) ---------- */
var ROLE = { size: /^size\b/i, height: /height|depth/i };
var ROLES = ['size', 'height'];
var ORDER = [['size', 'Size'], ['height', 'Depth']];   /* the shop's own option is still called Height: the interface says Depth */
function shopRoot() {
  var c = $$('.product-details');
  for (var i = 0; i < c.length; i++) { if (c[i].offsetParent || c[i].getClientRects().length) { return c[i]; } }
  return c[0] || null;
}
function selectFor(role) {
  var r = shopRoot(); if (!r) { return null; }
  var bs = $$('.details-product-option', r);
  for (var i = 0; i < bs.length; i++) {
    var t = txt($('.details-product-option__title, .product-details-module__title, legend, label.form-control__label', bs[i])).replace(/[*\s]+$/, '');
    if (ROLE[role].test(t)) { return $('select', bs[i]); }
  }
  return null;
}
function chosenText(sel) {
  if (!sel || sel.selectedIndex < 0) { return null; }
  var o = sel.options[sel.selectedIndex], t = txt(o);
  if (!t || o.disabled || /^please\s+choose/i.test(t) || /contact\s+us/i.test(t)) { return null; }
  return t;
}
function dimsOf(t) { var m = /(\d{2,3})\s*[x×]\s*(\d{2,3})/.exec(String(t || '')); return m ? [+m[1], +m[2]].sort(function (a, b) { return a - b; }) : null; }
function cmOf(t) { var m = /(\d{1,2})\s*cm/i.exec(String(t || '')); return m ? m[1] : null; }
function shopKey(role, t) {
  if (t == null) { return null; }
  if (role === 'size') { var d = dimsOf(t); return d ? d.join('x') : null; }
  return cmOf(t);
}
function sizeKey(z) { return Math.min(z.w, z.l) + 'x' + Math.max(z.w, z.l); }
function sizeByKey(k) { for (var i = 0; i < DATA.sizes.length; i++) { if (sizeKey(DATA.sizes[i]) === k) { return DATA.sizes[i]; } } return null; }
function heightByKey(k) { for (var i = 0; i < DATA.heights.length; i++) { if (String(DATA.heights[i].cm) === String(k)) { return DATA.heights[i]; } } return null; }
/* the two collections have their own depths: Baby Cot 10 / 12 cm, Junior 14 / 16 cm. A depth without a group (the tests on Bio Comfort) goes with every size. */
function heightsFor(z) { return DATA.heights.filter(function (h) { return h.g == null || !z || h.g === z.g; }); }
function validPair(zk, hk) { var z = sizeByKey(zk), h = heightByKey(hk); return !!(z && h && (h.g == null || h.g === z.g)); }
function groupByKey(k) { for (var i = 0; i < DATA.groups.length; i++) { if (DATA.groups[i].key === k) { return DATA.groups[i]; } } return null; }
/* is this size / height among Ecwid's own options? (an option the store does not have is shown as not available yet) */
function shopHas(role, key) {
  var sel = selectFor(role); if (!sel) { return null; }                 /* null: the options have not arrived yet */
  for (var i = 0; i < sel.options.length; i++) { if (shopKey(role, txt(sel.options[i])) === key && (!sel.options[i].disabled || sel.options[i].hasAttribute('data-ddx-off'))) { return true; } }
  return false;
}

/* ---------- reading the shop and setting the shop ---------- */
var X = { S: { size: null, height: null, bagged: '' }, last: 'size', busy: false, probing: false, prices: {}, gone: {}, hooks: {} };
function readShop() { var o = {}; ROLES.forEach(function (r) { o[r] = shopKey(r, chosenText(selectFor(r))); }); return o; }
function setShop(role, key) {
  var sel = selectFor(role); if (!sel || key == null) { return false; }
  for (var i = 0; i < sel.options.length; i++) {
    if (shopKey(role, txt(sel.options[i])) === key && (!sel.options[i].disabled || sel.options[i].hasAttribute('data-ddx-off'))) {
      if (sel.selectedIndex !== i) { sel.selectedIndex = i; fire(sel, 'input'); fire(sel, 'change'); }
      return true;
    }
  }
  return false;
}
/* Defence in depth: in Ecwid's own Height dropdown the depths of the other collection are switched off, and a combination that does not exist is cleared.
   (Ecwid itself has only the 20 valid variations, so an invalid pair cannot be bought; this also keeps the dropdown honest.) */
function enforceOptions() {
  var hs = selectFor('height'), z = X.S.size && sizeByKey(X.S.size); if (!hs) { return; }
  for (var i = 0; i < hs.options.length; i++) {
    var o = hs.options[i], k = shopKey('height', txt(o)), h = k != null ? heightByKey(k) : null;
    var off = !!(z && h && h.g != null && h.g !== z.g);
    if (off) { if (!o.disabled) { o.disabled = true; o.setAttribute('data-ddx-off', '1'); } }
    else if (o.hasAttribute('data-ddx-off')) { o.disabled = false; o.removeAttribute('data-ddx-off'); }
  }
  var cur = hs.options[hs.selectedIndex]; if (cur && cur.hasAttribute('data-ddx-off') && !X.probing) { clearShop('height'); }
}
function clearShop(role) {
  var sel = selectFor(role); if (!sel || sel.selectedIndex <= 0 || !/^please\s+choose/i.test(txt(sel.options[0]))) { return; }
  X.busy = true; try { sel.selectedIndex = 0; fire(sel, 'input'); fire(sel, 'change'); } finally { X.busy = false; }
}
/* the customer's choice goes into the shop's dropdowns */
function push() {
  if (X.busy) { return; }
  var shop = readShop(); X.busy = true;
  try {
    if (X.S.size != null && X.S.height != null && !validPair(X.S.size, X.S.height)) { if (X.last === 'height') { X.S.size = null; clearShop('size'); } else { X.S.height = null; clearShop('height'); } }
    ROLES.forEach(function (r) { var want = X.S[r]; if (want != null && want !== shop[r]) { setShop(r, want); if (r === 'size') { enforceOptions(); } } });
    enforceOptions();
  } finally { X.busy = false; }
}
/* the shop changed (the customer used Ecwid's own dropdowns): bring the selection up to date */
function pull() {
  if (X.busy) { return false; }
  var shop = readShop(), changed = false;
  ROLES.forEach(function (r) {
    if (X.S[r] === shop[r]) { return; }
    if (shop[r] != null && (r === 'size' ? !sizeByKey(shop[r]) : !heightByKey(shop[r]))) { return; }
    X.S[r] = shop[r]; X.last = r; changed = true;
  });
  if (X.S.size != null && X.S.height != null && !validPair(X.S.size, X.S.height)) { if (X.last === 'height') { X.S.size = null; clearShop('size'); } else { X.S.height = null; clearShop('height'); } changed = true; }
  enforceOptions();
  return changed;
}

/* ---------- price: Ecwid's own text, never calculated here ---------- */
function rawPrice() { var r = shopRoot(), e = r && $('.details-product-price__value', r); return e ? e.textContent : ''; }
function priceNow() {
  var t = txt($('.details-product-price__value', shopRoot() || doc));
  return /\d/.test(t) && !/^[^\d]*0(?:[.,]0+)?[^\d]*$/.test(t.replace(/[\s ]/g, '')) ? t : '';
}
function numOf(t) { var n = parseFloat(String(t).replace(/,/g, '').replace(/[^\d.]/g, '')); return isNaN(n) ? null : n; }
function pkey(z, h) { return sizeKey(z) + '|' + h.cm; }
function priceOf(z, h) { return X.prices[pkey(z, h)] || ''; }
/* Ecwid now also holds the blocked combinations as Out of stock variations: a price is never taken from one, and it never goes into the tables */
function soldOut() { var r = shopRoot(); return !!r && !shopBagButton() && /out\s+of\s+stock|sold\s+out/i.test(r.textContent || ''); }
function remember() {
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height), p = priceNow();
  if (z && h && p && !soldOut()) { X.prices[pkey(z, h)] = p; }
}
/* Ecwid changes its price in one step, 250 to 480 ms after a change: wait for the real change (or, for an equal price, long enough) */
var pollT = 0;
function awaitPrice(before, cb, t) {
  t = t || 0; if (t === 0 && pollT) { win.clearTimeout(pollT); }
  var raw = rawPrice(), p = priceNow();
  if (p && ((raw !== before) || t >= 900)) { remember(); pollT = 0; cb(p); return; }
  if (t < 2600) { pollT = win.setTimeout(function () { awaitPrice(before, cb, t + 40); }, 40); } else { pollT = 0; cb(''); }
}
function missingCombos(only) {
  var list = []; DATA.sizes.forEach(function (z) { if (only && z !== only) { return; } heightsFor(z).forEach(function (h) { if (!X.prices[pkey(z, h)] && !X.gone[pkey(z, h)] && shopHas('size', sizeKey(z)) && shopHas('height', String(h.cm))) { list.push({ z: z, h: h }); } }); });
  return list;
}
/* Select each combination in Ecwid's own dropdowns, wait for the price to change, remember it, then put the customer's selection back.
   While it runs, Ecwid's price, its Add to Bag button and its dropdowns are blocked, so nothing wrong can be bought. */
function readCombos(list, progress, finish) {
  var ss = selectFor('size'), hs = selectFor('height'), buy = shopBagButton();
  if (X.probing || !ss || !hs || !buy || !list.length) { if (finish) { finish(false); } return; }
  X.probing = true; X.busy = true; if (X.hooks.state) { X.hooks.state(); }
  var root = shopRoot(), box = $('.details-product-price', root), blocks = [ss, hs].map(function (s0) { return s0.closest ? s0.closest('.details-product-option') : null; });
  var keep = { s: ss.selectedIndex, h: hs.selectedIndex, raw: rawPrice(), vis: box ? box.style.visibility : '', pe: buy.style.pointerEvents, bp: blocks.map(function (x) { return x ? x.style.pointerEvents : ''; }) };
  if (box) { box.style.visibility = 'hidden'; }
  buy.style.pointerEvents = 'none'; blocks.forEach(function (x) { if (x) { x.style.pointerEvents = 'none'; } });
  var i = 0;
  function idx(sel, role, key) { for (var k = 0; k < sel.options.length; k++) { if (shopKey(role, txt(sel.options[k])) === key) { return k; } } return -1; }
  function leave() {
    if (box) { box.style.visibility = keep.vis; } buy.style.pointerEvents = keep.pe;
    blocks.forEach(function (x, k) { if (x) { x.style.pointerEvents = keep.bp[k]; } });
    X.busy = false; X.probing = false; enforceOptions(); if (X.hooks.state) { X.hooks.state(); } if (finish) { finish(true); }
  }
  function restore() {
    var s2 = selectFor('size'), h2 = selectFor('height');
    try {
      if (s2 && s2.selectedIndex !== keep.s) { s2.selectedIndex = keep.s; fire(s2, 'input'); fire(s2, 'change'); }
      if (h2 && h2.selectedIndex !== keep.h) { h2.selectedIndex = keep.h; fire(h2, 'input'); fire(h2, 'change'); }
    } catch (e) { /* leave the dropdowns as they are */ }
    var w = 0;
    (function settle() { if (rawPrice() === keep.raw || w >= 1500) { leave(); return; } w += 40; win.setTimeout(settle, 40); }());
  }
  function next() {
    if (i >= list.length) { restore(); return; }
    var c = list[i++], s2 = selectFor('size'), h2 = selectFor('height');
    if (!s2 || !h2) { restore(); return; }
    var zi = idx(s2, 'size', sizeKey(c.z)), hi = idx(h2, 'height', String(c.h.cm)), before = rawPrice(), t = 0;
    if (zi < 0 || hi < 0) { next(); return; }
    s2.selectedIndex = zi; h2.selectedIndex = hi; fire(s2, 'input'); fire(s2, 'change'); fire(h2, 'input'); fire(h2, 'change');
    (function wait() {
      var raw = rawPrice(), p = priceNow();
      if ((raw !== before && p) || t >= 900) { if (p && soldOut()) { X.gone[pkey(c.z, c.h)] = 1; } else if (p) { X.prices[pkey(c.z, c.h)] = p; } if (progress) { progress(i, list.length); } if (X.hooks.prices) { X.hooks.prices(); } next(); return; }
      t += 25; win.setTimeout(wait, 25);
    }());
  }
  next();
}

/* ---------- the bag: Ecwid's own button, pressed only by the customer ---------- */
function shopBagButton() {
  var r = shopRoot(); if (!r) { return null; }
  var b = $$('button', r);
  for (var i = 0; i < b.length; i++) { if (/add\s+to\s+(bag|cart)/i.test(txt(b[i]))) { return b[i]; } }
  return null;
}
var bagAt = 0, bagSig = '';
function addToBag() {
  push(); var b = shopBagButton(); if (!b) { return false; }
  bagAt = Date.now(); bagSig = signature(); b.click(); return true;
}
function onCart() { if (!bagAt || Date.now() - bagAt > 15000) { return; } bagAt = 0; X.S.bagged = bagSig; if (X.hooks.draw) { X.hooks.draw(); } }
function openCart() { if (win.Ecwid && win.Ecwid.openPage) { win.Ecwid.openPage('cart'); } }

/* ---------- the selection laws (one place; the television and the phone layer share them) ----------
   1. The bag button is READY only when every choice is made: size and depth. Firmness (Medium) and cover (100% cotton) are fixed and have nothing to select.
   2. Once complete, changing a choice keeps the button active for the new configuration.
   3. When the bag holds exactly this configuration, the same button is Go to Checkout (it opens the shopping cart, Ecwid's own).
   4. Whatever is missing is named: "Still to choose: Size · Depth".
   5. A coupon or code is entered in the cart, never here. */
function missing() { return ORDER.filter(function (o) { return X.S[o[0]] == null; }).map(function (o) { return o[1]; }); }
function complete() { return missing().length === 0; }
function signature() { return complete() ? ORDER.map(function (o) { return o[0] + '=' + X.S[o[0]]; }).join('|') : ''; }
function bagFace() {
  if (!complete()) { return { face: 'add', enabled: false, ready: false, text: 'Add to Bag', guide: 'Still to choose: ' + missing().join(' · ') }; }
  if (soldOut()) { return { face: 'add', enabled: false, ready: false, text: 'Add to Bag', guide: 'This size and depth is not available' }; }
  if (X.S.bagged && X.S.bagged === signature()) { return { face: 'checkout', enabled: true, ready: false, text: 'Go to Checkout', guide: 'Added to your bag' }; }
  return { face: 'add', enabled: true, ready: true, text: 'Add to Bag', guide: X.S.bagged ? 'Your new choice is not in the bag yet: Add to Bag again' : 'Ready to order: size and depth chosen' };
}
function chosenLabel(role) {
  if (role === 'size') { var z = X.S.size && sizeByKey(X.S.size); return z ? (groupByKey(z.g).name + ' · ' + z.w + ' × ' + z.l + ' cm') : null; }
  var h = X.S.height && heightByKey(X.S.height); return h ? h.cm + ' cm' : null;
}

/* ---------- the picture carousels of the standard description ([data-dbg]): dots, mouse drag, arrow keys ---------- */
var reduce = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
function initCarousel(fig) {
  if (fig.__dbg) { return; }
  var v = $('.dbj-car__v', fig), slides = $$('.dbj-car__s', fig), d = $('.dbj-car__d', fig);
  if (!v || slides.length < 2 || !d) { return; }
  fig.__dbg = 1;
  var dots = [], raf = 0;
  function cur() { return Math.max(0, Math.min(slides.length - 1, Math.round(v.scrollLeft / (v.clientWidth || 1)))); }
  function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); var x = i * v.clientWidth; try { v.scrollTo({ left: x, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { v.scrollLeft = x; } }
  function mark() { var n = cur(); dots.forEach(function (b, k) { b.className = 'dbj-car__dot' + (k === n ? ' on' : ''); b.setAttribute('aria-current', k === n ? 'true' : 'false'); }); }
  slides.forEach(function (s, i) {
    var b = doc.createElement('button'); b.className = 'dbj-car__dot'; b.type = 'button'; b.setAttribute('aria-label', 'Picture ' + (i + 1) + ' of ' + slides.length);
    b.addEventListener('click', function () { go(i); }); d.appendChild(b); dots.push(b);
  });
  v.addEventListener('scroll', function () { if (!raf) { raf = win.requestAnimationFrame(function () { raf = 0; mark(); }); } }, { passive: true });
  v.addEventListener('keydown', function (e) { var k = e.key || e.keyCode; if (k === 'ArrowRight' || k === 39) { e.preventDefault(); go(cur() + 1); } else if (k === 'ArrowLeft' || k === 37) { e.preventDefault(); go(cur() - 1); } });
  var drag = null;
  v.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) { return; } drag = { x: e.clientX, s: v.scrollLeft, moved: false }; });
  win.addEventListener('pointermove', function (e) { if (!drag) { return; } var dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; v.className += ' dbj-drag'; } if (drag.moved) { v.scrollLeft = drag.s - dx; } });
  win.addEventListener('pointerup', function () { if (!drag) { return; } var was = drag.moved; drag = null; if (was) { v.className = v.className.replace(/\s*dbj-drag/, ''); go(cur()); } });
  fig.className += ' dbj-car--on'; mark();
}
function carousels() { $$('[data-dbg]').forEach(initCarousel); }
