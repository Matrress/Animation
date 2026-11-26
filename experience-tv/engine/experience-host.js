/* Botanic Experience: the host of the television on the Ecwid product page.
 *
 * Ecwid is the executor. This file mounts the approved television (built from docs/tv-preview by tools/build-experience.mjs)
 * above Ecwid's own product block, in its own Shadow DOM, and binds it to the shop:
 *   - a choice on the television is set on Ecwid's own dropdown, exactly as a customer would (value + input + change);
 *   - a choice in Ecwid's dropdown appears on the television (OnProductSelectedOptionsChanged, change events, a slow poll);
 *   - the price texts (price, struck price, discount note) are read from what Ecwid shows; nothing is computed here;
 *   - Add to Bag on the television presses Ecwid's own Add to Bag, only when the customer presses it; Go to Checkout opens Ecwid's cart.
 * Nothing in the store is written, no text of the description is changed, Ecwid's own options and button never leave the page.
 * ?ddtv=off switches everything off. Only listed products start it. Phones get the phone layer, never this file's television.
 *
 * Exposes window.DDTVX (mount, unmount, state, version) for the tests and for support.
 */
(function (global, doc) {
  'use strict';
  if (/[?&]ddtv=off\b/.test((global.location && global.location.search) || '')) return;
  if (global.DDTVX) return;

  var CFG = global.__DDTVX_CONFIG || {};                         // set by the build (products, phone limit, assets base)
  var PRODUCTS = (global.__ddtvAllow || CFG.products || []).map(Number);
  var PHONE_MAX_SHORT_SIDE = CFG.phoneMaxShortSide || 600;
  var ROLE = { size: /^\s*size\b/i, depth: /depth|height/i, firmness: /firmness/i, cover: /cover/i };
  var ROLES = ['size', 'depth', 'firmness', 'cover'];
  var host = null, app = null, mo = null, poll = null, pending = null, bagAt = 0, lastPid = null, foldBtn = null;

  function txt(n) { return n ? (n.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function isPhone() { var s = global.screen || {}; return Math.min(s.width || 9999, s.height || 9999) < PHONE_MAX_SHORT_SIDE; }
  function fire(node, type) { var ev; try { ev = new Event(type, { bubbles: true, cancelable: true }); } catch (e) { ev = doc.createEvent('Event'); ev.initEvent(type, true, true); } node.dispatchEvent(ev); }

  /* ---------- the shop's own product block (the visible copy: Ecwid can keep two on slow phones) ---------- */
  function shopRoot() {
    var c = doc.querySelectorAll('.product-details');
    for (var i = 0; i < c.length; i++) if (c[i].offsetParent || c[i].getClientRects().length) return c[i];
    return c[0] || null;
  }
  function selectFor(role) {
    var r = shopRoot(); if (!r) return null;
    var bs = r.querySelectorAll('.details-product-option');
    for (var i = 0; i < bs.length; i++) {
      var t = txt(bs[i].querySelector('.details-product-option__title, .product-details-module__title, legend, label.form-control__label'));
      if (ROLE[role].test(t)) return bs[i].querySelector('select');
    }
    return null;
  }
  function chosenText(sel) {
    if (!sel || sel.selectedIndex < 0) return null;
    var o = sel.options[sel.selectedIndex], t = txt(o);
    if (!t || o.disabled || /^please\s+choose/i.test(t) || /contact\s+us/i.test(t)) return null;
    return t;
  }

  /* ---------- how a shop label maps onto the television's data (D) ---------- */
  function dimsOf(t) { var m = String(t || '').match(/(\d{2,3})\s*[x×]\s*(\d{2,3})/); return m ? [+m[1], +m[2]] : null; }
  function cmOf(t) { var m = String(t || '').match(/(\d{2})\s*cm/i); return m ? m[1] : null; }
  function firmOf(t) { t = String(t || ''); return /extra/i.test(t) ? 'Extra Firm' : /\bfirm\b/i.test(t) ? 'Firm' : /medium/i.test(t) ? 'Medium' : /soft/i.test(t) ? 'Soft' : null; }
  function coverOf(t) { t = String(t || ''); return /cashmere|silver/i.test(t) ? 3 : /aloe/i.test(t) ? 2 : /wool/i.test(t) ? 1 : /cotton/i.test(t) ? 0 : -1; }
  /* the same key for both sides, so a difference is a real difference */
  function shopKey(role, t) {
    if (t == null) return null;
    if (role === 'size') { var d = dimsOf(t); return d ? d.join('x') : null; }
    if (role === 'depth') return cmOf(t);
    if (role === 'firmness') return firmOf(t);
    var c = coverOf(t); return c < 0 ? null : String(c);
  }
  function tvKey(role, S) {
    var v = S[role]; if (v == null) return null;
    if (role === 'size') return v.dims ? v.dims.join('x') : null;
    if (role === 'depth') return String(v.cm);
    if (role === 'firmness') return String(v);
    return v.i != null ? String(v.i) : null;
  }
  function tvValue(role, key, D) {
    var i;
    if (role === 'size') { for (i = 0; i < D.sizes.length; i++) if (D.sizes[i].dims.join('x') === key) return D.sizes[i]; return null; }
    if (role === 'depth') { for (i = 0; i < D.depths.length; i++) if (String(D.depths[i].cm) === key) return Object.assign({ i: i }, D.depths[i]); return null; }
    if (role === 'firmness') return key;
    var k = +key; return D.covers[k] ? Object.assign({ i: k }, D.covers[k]) : null;
  }

  /* ---------- the television's side of the binding (A = { S, draw, D } given by the television when it starts) ---------- */
  var A = null, busy = false;
  function readShop() { var o = {}; ROLES.forEach(function (r) { o[r] = shopKey(r, chosenText(selectFor(r))); }); return o; }

  /* the shop changed (or the price arrived): bring the television up to date, never the other way round in the same step */
  function pull() {
    if (!A || busy) return;
    var shop = readShop(), S = A.S, changed = false;
    ROLES.forEach(function (r) {
      if (tvKey(r, S) === shop[r]) return;
      if (shop[r] == null) { S[r] = null; changed = true; return; }
      var v = tvValue(r, shop[r], A.D); if (v == null) return;
      S[r] = v; if (S.pick) S.pick[r] = null; if (S.edit) S.edit[r] = false; changed = true;
    });
    var ps = priceSig();
    if (ps !== pull.ps) { pull.ps = ps; changed = true; }
    if (changed) { busy = true; try { A.draw(); } finally { busy = false; } }
  }

  /* the television changed: set the shop's own dropdowns, the way a customer would */
  function push() {
    if (!A || busy) return;
    var shop = readShop(), S = A.S;
    ROLES.forEach(function (r) {
      var want = tvKey(r, S);
      if (want == null || want === shop[r]) return;
      var sel = selectFor(r); if (!sel) return;
      for (var i = 0; i < sel.options.length; i++) {
        if (shopKey(r, txt(sel.options[i])) === want && !sel.options[i].disabled) {
          sel.selectedIndex = i; fire(sel, 'input'); fire(sel, 'change');
          return;
        }
      }
    });
  }

  /* ---------- price: Ecwid's own texts ---------- */
  function priceTexts() {
    var r = shopRoot(); if (!r) return null;
    var cur = txt(r.querySelector('.details-product-price__value'));
    /* the struck earlier price and the discount note exist only while the store has a promotion; whatever its kind (a percentage, an
       amount, a sale price), the television shows the shop's own texts and nothing else */
    var old = txt(r.querySelector('.details-product-price-compare__container s, .details-product-price-compare__container del, .details-product-price-compare__price, .product-details__product-price s, .product-details__product-price del'));
    var badge = txt(r.querySelector('.product-details__product-price-discount, .details-product-price-compare__discount'));
    return { cur: cur, old: old && old !== cur ? old : '', badge: badge };
  }
  function priceSig() { var p = priceTexts(); return p ? p.cur + '|' + p.old + '|' + p.badge : ''; }
  /* what the television shows: nothing before a size, Ecwid's texts after it, a quiet ellipsis while Ecwid is still updating */
  function shop(S) {
    if (!S.size) return null;
    var p = priceTexts(); if (!p || !p.cur) return null;
    if (/^[^\d]*0([.,]0+)?[^\d]*$/.test(p.cur.replace(/[\s\u00a0]/g, ''))) return { cur: '…', old: '', badge: '' };   /* Ecwid is still updating (its base price is zero): never show a zero */
    return p;
  }

  /* ---------- the bag: Ecwid's own button, pressed only by the customer ---------- */
  function shopBagButton() {
    var r = shopRoot(); if (!r) return null;
    var b = r.querySelectorAll('button');
    for (var i = 0; i < b.length; i++) if (/add\s+to\s+(bag|cart)/i.test(txt(b[i]))) return b[i];
    return null;
  }
  function addToBag(sig) {
    push();
    var b = shopBagButton(); if (!b) return false;
    bagAt = Date.now(); addToBag.sig = sig;
    b.click();
    return true;
  }
  function onCart() {
    if (!A || !bagAt || Date.now() - bagAt > 15000) return;
    bagAt = 0; A.S.bagged = addToBag.sig; A.draw();
  }
  function checkout() { if (global.Ecwid && global.Ecwid.openPage) global.Ecwid.openPage('cart'); }

  /* ---------- the long description: still in the page (it is the indexed text), folded under the television ---------- */
  var PAGE_CSS = 'html.ddtv-on .product-details__sidebar,html.ddtv-on .details-product-share{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important;border:0!important;margin:0!important;padding:0!important}' +
    'html.ddtv-on:not(.ddtv-desc-open) .product-details__description{max-height:420px;overflow:hidden;position:relative;' +
    '-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}' +
    '.ddtv-fold{display:block;margin:14px auto 28px;padding:12px 22px;border-radius:12px;border:1.5px solid #434239;background:#FBFBED;color:#2E3633;font:600 15px/1.2 Chillax,"Helvetica Neue",Arial,sans-serif;cursor:pointer}' +
    '.ddtv-fold:hover{background:#434239;color:#FBFBED}' +
    '#ddtv-experience{display:block;width:100%;margin:0 0 24px;clear:both}' +
    'html.ddtv-classic #ddtv-experience{display:none}' +
    '#ddtv-back{display:block;margin:0 auto 18px;padding:12px 22px;border-radius:12px;border:1.5px solid #434239;background:#FBFBED;color:#2E3633;font:600 15px/1.2 Chillax,"Helvetica Neue",Arial,sans-serif;cursor:pointer}' +
    '#ddtv-back:hover{background:#434239;color:#FBFBED}';
  function pageStyle() {
    if (doc.getElementById('ddtv-page-css')) return;
    var st = doc.createElement('style'); st.id = 'ddtv-page-css'; st.textContent = PAGE_CSS; (doc.head || doc.documentElement).appendChild(st);
    if (CFG.fontCss && !doc.getElementById('ddtv-font')) { var l = doc.createElement('link'); l.id = 'ddtv-font'; l.rel = 'stylesheet'; l.href = CFG.fontCss; (doc.head || doc.documentElement).appendChild(l); }
  }
  function ensureFold() {
    var d = doc.querySelector('.product-details__description'); if (!d) return;
    if (foldBtn && foldBtn.parentNode && foldBtn.previousSibling === d) return;
    foldBtn = foldBtn || doc.createElement('button');
    foldBtn.type = 'button'; foldBtn.className = 'ddtv-fold';
    foldBtn.textContent = doc.documentElement.classList.contains('ddtv-desc-open') ? 'Fold the description' : 'Read the full description';
    foldBtn.onclick = function () { var on = doc.documentElement.classList.toggle('ddtv-desc-open'); foldBtn.textContent = on ? 'Fold the description' : 'Read the full description'; };
    d.parentNode.insertBefore(foldBtn, d.nextSibling);
  }

  /* the classic view: the shop's own page, the television steps aside; one button brings it back */
  function classic() {
    if (!host) return;
    doc.documentElement.classList.remove('ddtv-on', 'ddtv-desc-open');
    doc.documentElement.classList.add('ddtv-classic');
    if (foldBtn && foldBtn.parentNode) foldBtn.parentNode.removeChild(foldBtn); foldBtn = null;
    if (!doc.getElementById('ddtv-back')) {
      var r = shopRoot(); if (!r) return;
      var bk = doc.createElement('button'); bk.id = 'ddtv-back'; bk.type = 'button'; bk.textContent = 'Optimised Preview';
      bk.onclick = tvOn; r.parentNode.insertBefore(bk, r);
    }
  }
  function tvOn() {
    doc.documentElement.classList.remove('ddtv-classic');
    doc.documentElement.classList.add('ddtv-on');
    var bk = doc.getElementById('ddtv-back'); if (bk && bk.parentNode) bk.parentNode.removeChild(bk);
    if (A) { A.S.view = 'tv'; A.draw(); }
    ensureFold();
  }

  /* The approved design is drawn for the whole width of the screen (its own maximum is 1440 px, centred); the shop's column is
     narrower (1120 px). The television therefore takes the page's full width and the design centres itself, as approved. */
  function bleed() {
    if (!host) return;
    var cw = doc.documentElement.clientWidth || global.innerWidth;
    host.style.width = cw + 'px'; host.style.maxWidth = 'none'; host.style.marginLeft = '0px';
    var left = host.getBoundingClientRect().left;
    host.style.marginLeft = (-left) + 'px';
  }
  var onResize = function () { clearTimeout(onResize.t); onResize.t = setTimeout(bleed, 60); };

  /* ---------- mount and unmount (Ecwid swaps product pages without reloading) ---------- */
  function schedule() { if (pending) return; pending = setTimeout(function () { pending = null; pull(); ensureFold(); }, 80); }
  function mount(pid) {
    if (host && doc.body.contains(host)) return host;
    if (isPhone() && !global.__ddtvForceTv) return null;
    var pd = shopRoot(); if (!pd || !pd.parentNode) return null;
    pageStyle();
    host = doc.createElement('div'); host.id = 'ddtv-experience'; host.setAttribute('data-ddtv', 'tv');
    pd.parentNode.insertBefore(host, pd);
    var R = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    app = global.__DDTVX_TV(R, {   // the television, built from the approved design
      shop: shop, addToBag: addToBag, checkout: checkout, classic: classic, after: push,
      firstTime: function () { try { if (global.sessionStorage.getItem('ddtvIgnited')) return false; global.sessionStorage.setItem('ddtvIgnited', '1'); } catch (e) { /* private mode: play it */ } return true; },
      attach: function (api) { A = api; pull.ps = priceSig(); pull(); }
    });
    doc.documentElement.classList.add('ddtv-on');
    bleed(); global.addEventListener('resize', onResize);
    ensureFold();
    mo = new MutationObserver(schedule);
    mo.observe(pd, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'selected', 'disabled'] });
    doc.addEventListener('change', onNativeChange, true);
    poll = setInterval(function () { if (!doc.hidden) pull(); }, 1500);
    lastPid = pid;
    return host;
  }
  function onNativeChange(e) { if (e.target && e.target.closest && e.target.closest('.details-product-option')) schedule(); }
  function unmount() {
    if (mo) mo.disconnect(); mo = null; clearInterval(poll); poll = null;
    doc.removeEventListener('change', onNativeChange, true); global.removeEventListener('resize', onResize);
    if (host && host.parentNode) host.parentNode.removeChild(host);
    if (foldBtn && foldBtn.parentNode) foldBtn.parentNode.removeChild(foldBtn);
    host = null; app = null; A = null; foldBtn = null;
    doc.documentElement.classList.remove('ddtv-on', 'ddtv-desc-open', 'ddtv-classic');
    var bk = doc.getElementById('ddtv-back'); if (bk && bk.parentNode) bk.parentNode.removeChild(bk);
  }

  function onPage(page) {
    var pid = page && page.type === 'PRODUCT' ? Number(page.productId) : null;
    if (pid != null && PRODUCTS.indexOf(pid) >= 0) { if (lastPid !== pid) unmount(); var tries = 0; (function go() { if (!mount(pid) && ++tries < 40 && !isPhone()) setTimeout(go, 150); })(); }
    else unmount();
  }
  /* The id of the product page on screen (the class Ecwid puts on it); used when Ecwid announced the page before this file ran. */
  function currentProductId() {
    var n = doc.querySelector('[class*="ecwid-productBrowser-ProductPage-"]');
    var m = n && /ecwid-productBrowser-ProductPage-(\d+)/.exec(String(n.className));
    return m ? Number(m[1]) : null;
  }
  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    var E = global.Ecwid;
    E.OnPageLoaded.add(onPage);
    if (E.OnProductSelectedOptionsChanged) E.OnProductSelectedOptionsChanged.add(function () { schedule(); });
    if (E.OnCartChanged) E.OnCartChanged.add(onCart);
    var id = currentProductId(); if (id == null && global.__ddtvPage) id = Number(global.__ddtvPage.productId);
    if (id != null) onPage({ type: 'PRODUCT', productId: id });
  }
  (function waitEcwid(n) {
    if (global.Ecwid && global.Ecwid.OnPageLoaded) { boot(); return; }
    if (n < 300) setTimeout(function () { waitEcwid(n + 1); }, 100);
  })(0);

  global.DDTVX = {
    version: CFG.version || 'dev', mount: mount, unmount: unmount, pull: pull, push: push,
    state: function () { return { shop: readShop(), tv: A ? ROLES.reduce(function (o, r) { o[r] = tvKey(r, A.S); return o; }, {}) : null, price: priceTexts(), mounted: !!host } },
    _test: { shopKey: shopKey, onPage: onPage, isPhone: isPhone, currentProductId: currentProductId }
  };
})(window, document);
