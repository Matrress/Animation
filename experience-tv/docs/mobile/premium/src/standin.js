/* STAND-IN for the Ecwid product block (preview only). It mimics the observed structure and behaviour of the real page
   (class names, native <select>s, a price that follows a choice after ~0.6 s) so that the SAME adapter (sync.js) runs on
   it and on the real page. The price rule below is an illustration of what was OBSERVED on the live page on 2026-11-10
   (the sum of the choice modifiers shown in the labels, less 10 %); the real interface never computes a price. */
(function (w, d) {
  'use strict';
  var D = w.DDDATA, S = D.standin;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var roleClass = { size: 'SIZE', depth: 'Select-Mattress-Depth', firmness: 'FIRMNESS-BY-BODY-WEIGHT', cover: 'COVERS' };
  var html = '<div class="ec-store ec-store__product-page"><div class="so-gallery" id="gallery"></div><div class="so-head"><h1 class="so-title">' + esc(D.product.name) + '</h1>' +
    '<div class="so-price"><span class="details-product-price__value" id="so-price">£0</span> <span class="details-product-price-compare__container"><s id="so-compare"></s></span> <span class="product-details__product-price-discount" id="so-save"></span></div>' +
    '<p class="so-intro">' + esc(D.product.intro) + '</p><div id="cfg-cta"></div></div><div id="cfg"></div>' +
    '<div class="so-native" id="native"><div class="so-native__tag">Ecwid’s own options · always available</div>';
  S.options.forEach(function (o) {
    html += '<div class="product-details-module details-product-option details-product-option--' + roleClass[o.role] + ' details-product-option--select"><label class="form-control__label">' + esc(o.title) + '</label><select class="form-control__select"><option value="0">Please choose</option>' +
      o.choices.map(function (c, i) { return '<option value="' + (i + 1) + '">' + esc(c) + '</option>'; }).join('') + '</select></div>';
  });
  html += '<button class="so-atb" id="so-atb" type="button">Add to Bag</button><p class="so-atb-note">Native Ecwid button. Never clicked in any test.</p></div><div id="desc-slot"></div></div>';
  d.getElementById('store').innerHTML = html;
  var NOTE = !/promonote=0/.test(w.location.search), timer = null, PROMO = (/promo=(\d+)/.exec(w.location.search) || [0, 10])[1] * 1;   /* the store's promotion, as the store would show it: 10, 15, 17 or any other percentage; 0 = none */
  function fmt(n) { return '£' + n.toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace(/(\.\d)$/, '$10'); }
  function recompute() {
    var sum = 0, any = false;
    d.querySelectorAll('.so-native select').forEach(function (s) {
      var o = s.options[s.selectedIndex]; if (!o || s.selectedIndex < 1) return;
      var m = /\(\+£([\d\s]+)\)/.exec(o.text); if (m) { sum += parseInt(m[1].replace(/\s/g, ''), 10); any = true; }
    });
    var el = d.getElementById('so-price'), pc = PROMO; el.textContent = any ? fmt(sum * (100 - pc) / 100) : '£0';
    d.getElementById('so-compare').textContent = any && pc && NOTE ? fmt(sum) : ''; d.getElementById('so-save').textContent = any && pc && NOTE ? 'Save ' + pc + '%' : '';
  }
  d.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('.so-native')) { clearTimeout(timer); timer = setTimeout(recompute, 600); } }, true);
  /* STAND-IN for Ecwid's cart API: Add to Bag with the four options chosen puts the product in the cart and tells the listeners; gotoCheckout opens the checkout (a stand-in screen) */
  var listeners = [], cart = { productsQuantity: 0 };
  /* open the shopping cart (Ecwid's own protocol) and count the calls; the stand-in does not open anything */
  function openPage(page) { if (page !== 'cart') return; w.__cartOpened = (w.__cartOpened || 0) + 1; var t = d.getElementById('toast'); t.textContent = 'Opens the shopping cart, built from your choices (stand-in: not opened in the preview)'; t.classList.add('on'); setTimeout(function () { t.classList.remove('on'); }, 2600); }
  w.Ecwid = { OnCartChanged: { add: function (f) { listeners.push(f); } }, Cart: { get: function (cb) { cb(cart); } }, openPage: openPage };
  d.getElementById('so-atb').addEventListener('click', function () {
    var n = 0; d.querySelectorAll('.so-native select').forEach(function (s) { if (s.selectedIndex > 0) n++; });
    var t = d.getElementById('toast');
    if (n < 4) { t.textContent = 'Please choose all options first (the shop refuses)'; t.classList.add('on'); setTimeout(function () { t.classList.remove('on'); }, 2200); return; }
    cart = { productsQuantity: 1 }; listeners.forEach(function (f) { f(cart); });
  });
}(window, document));
