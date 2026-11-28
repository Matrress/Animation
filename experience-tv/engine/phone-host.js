/* Botanic Experience: the phone layer's host on the Ecwid product page.
 *
 * Phones only (shortest screen side under 600 px). On a listed product it adds the approved guided configuration (the "Configure Your
 * Mattress" button above Ecwid's own options, a full-screen step-by-step panel) and recolours the shop's own description to the
 * approved palette. Ecwid stays the executor: the panel sets Ecwid's own dropdowns (DDSync), shows Ecwid's own price, presses Ecwid's
 * own Add to Bag only when the customer does, and opens Ecwid's cart. The description's text is never changed.
 * ?ddtv=off switches everything off; ?ddtv=phone forces the layer on a larger screen (review only).
 */
(function (global, doc) {
  'use strict';
  var q = (global.location && global.location.search) || '';
  if (/[?&]ddtv=off\b/.test(q) || global.DDPHONE) return;
  var CFG = global.__DDPHONE_CONFIG || {};
  var PRODUCTS = (global.__ddtvAllow || CFG.products || []).map(Number);
  var mounted = null, started = false;

  function isPhone() { var s = global.screen || {}; return /[?&]ddtv=phone\b/.test(q) || Math.min(s.width || 9999, s.height || 9999) < (CFG.phoneMaxShortSide || 600); }
  function shopRoot() {
    var c = doc.querySelectorAll('.product-details');
    for (var i = 0; i < c.length; i++) if (c[i].offsetParent || c[i].getClientRects().length) return c[i];
    return c[0] || null;
  }
  function style() {
    if (doc.getElementById('ddphone-css')) return;
    var st = doc.createElement('style'); st.id = 'ddphone-css'; st.textContent = global.__DDPHONE_CSS; (doc.head || doc.documentElement).appendChild(st);
    /* owner, 26 Nov (iPad): Safari holds back the page's style updates while a stylesheet link added to the head is still loading, so the television stood
       with the shop's top row, sidebar and old description around it until the font host answered. The font is therefore fetched as a print-media link in the
       body (never render-blocking) and switched on when it has arrived; the page's own rules are inline text and do not wait for any network. */
    if (CFG.fontCss && !doc.getElementById('ddtv-font')) { var l = doc.createElement('link'); l.id = 'ddtv-font'; l.rel = 'stylesheet'; l.media = 'print'; l.onload = function () { l.media = 'all'; }; l.href = CFG.fontCss; (doc.body || doc.head || doc.documentElement).appendChild(l); }
  }
  function mount(pid) {
    if (mounted === pid && doc.getElementById('cfg-cta')) return true;
    var r = shopRoot(); if (!r) return false;
    var opt = r.querySelector('.details-product-option'); if (!opt) return false;
    unmount();
    style();
    doc.documentElement.classList.add('ddtv-phone');
    var cta = doc.createElement('div'); cta.id = 'cfg-cta'; opt.parentNode.insertBefore(cta, opt);
    var panel = doc.createElement('div'); panel.id = 'cfg'; panel.className = 'cfg'; doc.body.appendChild(panel);
    if (!doc.getElementById('toast')) { var t = doc.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); doc.body.appendChild(t); }
    global.__DDPHONE_RUN();                       // the approved configurator (graphite.js), bound through DDSync
    mounted = pid;
    return true;
  }
  function unmount() {
    try { if (global.__cfg && global.__cfg.sync && global.__cfg.sync.destroy) global.__cfg.sync.destroy(); } catch (e) { /* already gone */ }
    ['cfg-cta', 'cfg'].forEach(function (id) { var n = doc.getElementById(id); if (n && n.parentNode) n.parentNode.removeChild(n); });
    doc.documentElement.classList.remove('ddtv-phone', 'cfg-open', 'gal-small');
    mounted = null;
  }
  function onPage(page) {
    var pid = page && page.type === 'PRODUCT' ? Number(page.productId) : null;
    if (pid != null && PRODUCTS.indexOf(pid) >= 0 && isPhone()) { var n = 0; (function go() { if (!mount(pid) && ++n < 40) setTimeout(go, 150); })(); }
    else unmount();
  }
  function currentProductId() {
    var n = doc.querySelector('[class*="ecwid-productBrowser-ProductPage-"]');
    var m = n && /ecwid-productBrowser-ProductPage-(\d+)/.exec(String(n.className));
    return m ? Number(m[1]) : null;
  }
  function boot() {
    if (started) return; started = true;
    global.Ecwid.OnPageLoaded.add(onPage);
    var id = currentProductId(); if (id == null && global.__ddtvPage) id = Number(global.__ddtvPage.productId); if (id != null) onPage({ type: 'PRODUCT', productId: id });
  }
  (function wait(n) { if (global.Ecwid && global.Ecwid.OnPageLoaded) { boot(); return; } if (n < 300) setTimeout(function () { wait(n + 1); }, 100); })(0);
  global.DDPHONE = { version: CFG.version || 'dev', mount: mount, unmount: unmount, _test: { onPage: onPage, isPhone: isPhone } };
})(window, document);
