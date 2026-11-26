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
  var host = null, app = null, mo = null, poll = null, pending = null, bagAt = 0, lastPid = null, foldBtn = null, infoBox = null;

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
    /* a change of the choices draws the whole screen; a change of the price alone draws only what shows a price (the screen does not blink
       while the shop's price arrives a moment after a choice) */
    var ps = priceSig(), priceChanged = ps !== pull.ps; if (priceChanged) pull.ps = ps;
    if (changed || priceChanged) { busy = true; try { if (!changed && A.drawPrice) A.drawPrice(); else A.draw(); } finally { busy = false; } }
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
    /* owner, 26 Nov: the row "Home / Store / Collection" with its two arrows and the 100 px the page leaves above it are not needed with the television
       (the site menu and the logo already lead everywhere); the row stays in the page for readers and search engines, only not shown;
       the standard view gives the page back exactly as the shop made it */
    /* owner, 26 Nov: the shop's own product title (a draft name on the test product) is not shown above the television; it stays in the page */
    'html.ddtv-on .product-details__product-title{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important;border:0!important;padding:0!important;margin:0!important}' +
    'html.ddtv-on .product-details__top{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important;border:0!important;padding:0!important;margin:0!important}' +
    'html.ddtv-on #tile-product-details .ins-tile__wrap{margin-top:14px!important}' +
    /* owner, 26 Nov: no peek and no fade ("snow"): folded, the text is simply not shown (it stays in the page); one centred button opens it */
    'html.ddtv-on:not(.ddtv-desc-open) .product-details__description{max-height:0;overflow:hidden;padding:0!important;margin:0!important}' +
    /* owner, 26 Nov: where the two views meet, a short information block says what each is for (so nobody does the choosing twice);
       rounded boxes, no pills; a button is only drawn where it does something; the colours are the television's */
    '.ddtv-info{display:block!important;clear:both!important;float:none!important;box-sizing:border-box!important;max-width:100%!important;margin:18px 0 10px!important;padding:16px 18px!important;border:1px solid #D6CFBC!important;border-left:4px solid #6E8601!important;border-radius:14px!important;background:#FBFBED!important;color:#2E3633!important;font:400 15px/1.55 Chillax,"Helvetica Neue",Arial,sans-serif!important}' +
    '.ddtv-info p{margin:0 0 8px!important;color:#2E3633!important;font:inherit!important}' +
    '.ddtv-info .ddtv-info__h{margin:0 0 10px!important;font:700 17px/1.3 Chillax,"Helvetica Neue",Arial,sans-serif!important}' +
    '.ddtv-info__g{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))!important;gap:10px!important;margin:0 0 10px!important}' +
    '.ddtv-info__c{margin:0!important;padding:10px 14px!important;border:1px solid #D6CFBC!important;border-radius:12px!important;background:#FEFEF6!important}' +
    '.ddtv-info__c b{display:block;margin:0 0 2px;font-weight:700}' +
    '.ddtv-info__a{display:flex!important;flex-wrap:wrap!important;gap:10px!important;margin:12px 0 0!important}' +
    '.ddtv-btn,.ddtv-fold,#ddtv-back{display:inline-block!important;float:none!important;box-sizing:border-box!important;width:auto!important;max-width:100%!important;margin:0!important;padding:11px 20px!important;border-radius:12px!important;font:700 15px/1.2 Chillax,"Helvetica Neue",Arial,sans-serif!important;text-align:center!important;cursor:pointer!important}' +
    '.ddtv-btn,#ddtv-back{border:1.5px solid #6E8601!important;background:#6E8601!important;color:#FFFFFF!important}' +
    '.ddtv-btn:hover,#ddtv-back:hover{background:#566901!important;border-color:#566901!important}' +
    '.ddtv-fold{border:1.5px solid #384442!important;background:#FEFEF6!important;color:#2E3633!important}' +
    '.ddtv-fold:hover{background:#384442!important;color:#FBFBED!important}' +
    'html.ddtv-classic #ddtv-info{display:none!important}' +
    '#ddtv-experience{display:block;width:100%;margin:0 0 24px;clear:both}' +
    'html.ddtv-classic #ddtv-experience{display:none}';

  function pageStyle() {
    if (doc.getElementById('ddtv-page-css')) return;
    var st = doc.createElement('style'); st.id = 'ddtv-page-css'; st.textContent = PAGE_CSS; (doc.head || doc.documentElement).appendChild(st);
    if (CFG.fontCss && !doc.getElementById('ddtv-font')) { var l = doc.createElement('link'); l.id = 'ddtv-font'; l.rel = 'stylesheet'; l.href = CFG.fontCss; (doc.head || doc.documentElement).appendChild(l); }
  }
  var BOTH = 'Both show the same mattress and the same choices, so you only need one of them.';
  function infoHtml(inStd) {
    var tv = '<div class="ddtv-info__c"><b>Optimised Preview</b>The modern, guided way: explore the information and make your choices in one screen.</div>',
        sd = '<div class="ddtv-info__c"><b>Standard Product View</b>The familiar page: dropdown selectors beside the text and all the information in menus.</div>';
    return '<p class="ddtv-info__h">' + (inStd ? 'You are in the Standard Product View' : 'Two ways to view this mattress') + '</p><div class="ddtv-info__g">' + (inStd ? sd + tv : tv + sd) + '</div><p>' + BOTH + '</p>';
  }
  function ensureFold() {
    if (doc.documentElement.classList.contains('ddtv-classic')) return;   // the standard view has its own block and no fold
    var d = doc.querySelector('.product-details__description'); if (!d) return;
    if (infoBox && infoBox.parentNode && infoBox.nextSibling === d) return;
    if (!infoBox) {
      infoBox = doc.createElement('div'); infoBox.id = 'ddtv-info'; infoBox.className = 'ddtv-info'; infoBox.setAttribute('role', 'region'); infoBox.setAttribute('aria-label', 'Two ways to view this mattress');
      infoBox.innerHTML = infoHtml(false) + '<div class="ddtv-info__a"></div>';
      var to = doc.createElement('button'); to.type = 'button'; to.className = 'ddtv-btn'; to.id = 'ddtv-to-standard'; to.textContent = 'Open the Standard Product View'; to.onclick = classic;
      foldBtn = doc.createElement('button'); foldBtn.type = 'button'; foldBtn.className = 'ddtv-fold';
      foldBtn.onclick = function () { var on = doc.documentElement.classList.toggle('ddtv-desc-open'); foldBtn.setAttribute('aria-expanded', String(on)); foldBtn.textContent = on ? 'Fold the description' : 'Read the full description'; };
      var a = infoBox.querySelector('.ddtv-info__a'); a.appendChild(to); a.appendChild(foldBtn);
    }
    var open = doc.documentElement.classList.contains('ddtv-desc-open');
    foldBtn.setAttribute('aria-expanded', String(open)); foldBtn.textContent = open ? 'Fold the description' : 'Read the full description';
    d.parentNode.insertBefore(infoBox, d);
  }

  /* the classic view: the shop's own page, the television steps aside; one button brings it back */
  function classic() {
    if (!host) return;
    doc.documentElement.classList.remove('ddtv-on', 'ddtv-desc-open');
    doc.documentElement.classList.add('ddtv-classic');
    if (infoBox && infoBox.parentNode) infoBox.parentNode.removeChild(infoBox); infoBox = null; foldBtn = null;
    if (!doc.getElementById('ddtv-backbox')) {
      var r = shopRoot(); if (!r) return;
      var bx = doc.createElement('div'); bx.id = 'ddtv-backbox'; bx.className = 'ddtv-info'; bx.setAttribute('role', 'region'); bx.setAttribute('aria-label', 'Two ways to view this mattress');
      bx.innerHTML = infoHtml(true) + '<div class="ddtv-info__a"></div>';
      var bk = doc.createElement('button'); bk.id = 'ddtv-back'; bk.type = 'button'; bk.textContent = 'Open the Optimised Preview'; bk.onclick = tvOn;
      bx.querySelector('.ddtv-info__a').appendChild(bk); r.parentNode.insertBefore(bx, r);
    }
    try { global.scrollTo && global.scrollTo(0, Math.max(0, (doc.getElementById('ddtv-backbox').getBoundingClientRect().top + (global.pageYOffset || 0)) - 80)); } catch (e) { /* the page stays where it is */ }
  }
  function tvOn() {
    doc.documentElement.classList.remove('ddtv-classic');
    doc.documentElement.classList.add('ddtv-on');
    var bx = doc.getElementById('ddtv-backbox'); if (bx && bx.parentNode) bx.parentNode.removeChild(bx);
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
    /* first of all: from this moment the shop's own top row (the path Home / Store / ..., the title, the 100 px above) is hidden, so the loader's
       hold can pass the job on without a gap and nothing shows while the television is built (on a slow tablet that takes seconds) */
    doc.documentElement.classList.add('ddtv-on');
    try {
    host = doc.createElement('div'); host.id = 'ddtv-experience'; host.setAttribute('data-ddtv', 'tv');
    pd.parentNode.insertBefore(host, pd);
    var R = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    app = global.__DDTVX_TV(R, {   // the television, built from the approved design
      shop: shop, addToBag: addToBag, checkout: checkout, classic: classic, after: push,
      firstTime: function () { try { if (global.sessionStorage.getItem('ddtvIgnited')) return false; global.sessionStorage.setItem('ddtvIgnited', '1'); } catch (e) { /* private mode: play it */ } return true; },
      attach: function (api) { A = api; pull.ps = priceSig(); pull(); }
    });
    } catch (err) { unmount(); return null; }   // if the television cannot be built, the shop's page is given back whole
    bleed(); global.addEventListener('resize', onResize);
    ensureFold();
    mo = new MutationObserver(schedule);
    mo.observe(pd, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'selected', 'disabled'] });
    doc.addEventListener('change', onNativeChange, true);
    poll = setInterval(function () { if (!doc.hidden) { keep(); pull(); } }, 1500);
    lastPid = pid;
    return host;
  }
  /* the page's state is asserted, not assumed: if the shop's own script ever removes the style or the class while the television is on, it is put back within a moment */
  function keep() {
    var cl = doc.documentElement.classList; if (!host || !A) return;
    if (!doc.getElementById('ddtv-page-css')) pageStyle();
    if (A.S && A.S.view === 'tv' && !cl.contains('ddtv-on') && !cl.contains('ddtv-classic')) cl.add('ddtv-on');
  }
  function onNativeChange(e) { if (e.target && e.target.closest && e.target.closest('.details-product-option')) schedule(); }
  function unmount() {
    if (mo) mo.disconnect(); mo = null; clearInterval(poll); poll = null;
    doc.removeEventListener('change', onNativeChange, true); global.removeEventListener('resize', onResize);
    if (host && host.parentNode) host.parentNode.removeChild(host);
    if (infoBox && infoBox.parentNode) infoBox.parentNode.removeChild(infoBox);
    host = null; app = null; A = null; foldBtn = null; infoBox = null;
    doc.documentElement.classList.remove('ddtv-on', 'ddtv-desc-open', 'ddtv-classic');
    var bx = doc.getElementById('ddtv-backbox'); if (bx && bx.parentNode) bx.parentNode.removeChild(bx);
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
