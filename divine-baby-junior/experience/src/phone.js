/* ===== the phone layer: a guided configuration over Ecwid's own options (same scheme as Botanic TV's phone layer) =====
   Phones only, listed products only. The shop's own dropdowns, price, bag and checkout stay in the page and do the work. */
var CFG = win.__DDPHONE_CONFIG = win.__DDPHONE_CONFIG || {};
CFG.products = CFG.products || [DATA.product.id];
var PH = null, ctaBtn = null, ctaNote = null, shopWatch = null, lastPid = null, booted = false;
function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function pageStylePhone() {
  if (!doc.getElementById('ddp-font')) {
    var f = doc.createElement('style'); f.id = 'ddp-font';
    f.textContent = '@font-face{font-family:"DBJChillax";font-style:normal;font-weight:400;font-display:swap;src:url(' + FONT400 + ') format("woff2")}@font-face{font-family:"DBJChillax";font-style:normal;font-weight:600;font-display:swap;src:url(' + FONT600 + ') format("woff2")}' +
      '#ddp-cta{display:block;width:100%;margin:14px 0 6px;padding:16px 18px;border:2px solid #003A68;border-radius:16px;background:#006591;color:#fff;font:600 18px/1.2 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif;text-align:center;cursor:pointer;box-shadow:0 0 0 3px #91E8F1}' +
      '#ddp-cta:active{background:#003A68}' +
      '#ddp-note{margin:0 0 12px;padding:10px 14px;border:1px solid rgba(0,58,104,.18);border-radius:12px;background:#E4E8F0;color:#003A68;font:400 14.5px/1.45 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif}' +
      '#ddp-note b{font-weight:600}' +
      'html.ddp-lock,html.ddp-lock body{overflow:hidden!important}';
    (doc.head || doc.documentElement).appendChild(f);
  }
}
/* the guided steps */
var PSTEPS = ['size', 'depth', 'review'];
function phSheetHtml(U) {
  var idx = PSTEPS.indexOf(U.step) + 1, body = '', foot = '';
  if (U.step === 'size') {
    body = '<h2 class="q">What size is your baby&#39;s cot or bed?</h2><p class="sub">Choose your size. Every size in centimetres and in inches.</p>' + DATA.groups.map(function (g) {
      return '<p class="lab2">' + esc(g.name) + ' · ' + DATA.heights.filter(function (h) { return h.g == null || h.g === g.key; }).map(function (h) { return h.cm; }).join(' / ') + ' cm deep</p><p class="gsub">' + esc(g.sub) + '</p><div class="cards">' + DATA.sizes.filter(function (z) { return z.g === g.key; }).map(function (z) {
        var on = X.S.size === sizeKey(z), av = shopHas('size', sizeKey(z));
        return '<button type="button" class="card sz' + (on ? ' on' : '') + '" data-pick-size="' + sizeKey(z) + '"' + (av === false ? ' disabled' : '') + '><span class="cm">' + z.w + ' × ' + z.l + ' cm</span><span class="in">' + inch(z.w) + ' × ' + inch(z.l) + ' in</span></button>'; }).join('') + '</div>'; }).join('');
    body += '<p class="need">Cot and bed sizes differ between manufacturers: measure the <b>inside</b> of the frame.</p>';
    foot = '<button type="button" class="btn" data-go="depth"' + (X.S.size ? '' : ' disabled') + '>Continue to Depth</button>';
  } else if (U.step === 'depth') {
    var z = X.S.size && sizeByKey(X.S.size);
    if (!z) {
      body = '<h2 class="q">How deep should the mattress be?</h2><p class="sub">The depths depend on the collection, so choose your size first.</p><p class="need">Baby Cot sizes come in <b>10 or 12 cm</b>. Junior sizes come in <b>14 or 16 cm</b>.</p>';
      foot = '<button type="button" class="btn" data-go="size">Choose your size</button>';
    } else {
      var hz = heightsFor(z);
      body = '<h2 class="q">How deep should the mattress be?</h2><p class="sub">' + esc(groupByKey(z.g).name) + ' comes in ' + hz.map(function (h) { return h.cm; }).join(' or ') + ' cm. Length and width stay the same: check the maximum mattress depth your cot or bed allows. A deeper mattress is not automatically a better one.</p><div class="cards">' + hz.map(function (h) {
        var p = priceOf(z, h), on = X.S.height === String(h.cm), av = shopHas('height', String(h.cm));
        return '<button type="button" class="card hc' + (on ? ' on' : '') + '" data-pick-height="' + h.cm + '"' + (av === false ? ' disabled' : '') + '><span class="cm">' + h.cm + ' cm</span><span class="in">' + inch(h.cm) + ' in</span>' + (p ? '<span class="pr">' + esc(p) + '</span>' : '') + '<span class="dsc">' + esc(h.desc) + '</span></button>'; }).join('') + '</div>';
      foot = '<button type="button" class="btn ghost" data-go="size">Back</button><button type="button" class="btn" data-go="review"' + (X.S.height ? '' : ' disabled') + '>Review</button>';
    }
  } else {
    var fc = bagFace();
    body = '<h2 class="q">Review your order</h2><ul class="rv">' + ORDER.map(function (o) { return '<li><span>' + o[1] + '</span><b>' + (chosenLabel(o[0]) ? esc(chosenLabel(o[0])) : '<i>Not chosen yet</i>') + '</b></li>'; }).join('') +
      '</ul><p class="bp s incl">Every mattress is <b>Medium</b> firmness with a <b>100% cotton</b> cover. Both are explained in the description; there is nothing to select.</p><div class="rvp"><span>Price</span><b>' + (complete() && priceNow() ? esc(priceNow()) : '<i>Choose a size and a depth</i>') + '</b></div><p class="guide">' + esc(fc.guide) + '</p>';
    foot = '<button type="button" class="btn ghost" data-go="depth">Back</button><button type="button" class="btn big' + (fc.ready ? ' ready' : '') + '" data-bag="1"' + (fc.enabled ? '' : ' disabled') + '>' + fc.text + '</button>';
  }
  return '<header class="hd"><div class="hdt"><span class="stp">Step ' + idx + ' of 3</span><b>' + esc(DATA.product.name) + '</b></div><button type="button" class="x" data-close aria-label="Close the configuration">×</button></header><div class="prog">' + PSTEPS.map(function (s, i) { return '<i class="' + (i < idx ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="bd"><p class="natl"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill="currentColor"/></svg>A natural environment for your baby · 100% natural latex · 100% cotton cover</p>' + body + '</div><footer class="ft">' + foot + '</footer>';
}
function phoneCss() { return PH_CSS; }
function openSheet() {
  if (PH) { return; }
  pageStylePhone();
  var hostEl = doc.createElement('div'); hostEl.id = 'ddp-sheet'; doc.body.appendChild(hostEl);
  var R = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;
  R.innerHTML = '<style>' + phoneCss() + '</style><div class="sheet" role="dialog" aria-modal="true" aria-label="Configure your mattress"></div><div class="toast" role="status"></div>';
  var U = { step: nextStepP() }, sh = $('.sheet', R), toast = $('.toast', R);
  function draw() { sh.innerHTML = phSheetHtml(U); var b = $('.bd', sh); if (b && draw.keep != null) { b.scrollTop = draw.keep; } }
  function say(t) { toast.textContent = t; toast.classList.add('on'); win.clearTimeout(say.t); say.t = win.setTimeout(function () { toast.classList.remove('on'); }, 2600); }
  function close() { doc.documentElement.classList.remove('ddp-lock'); if (hostEl.parentNode) { hostEl.parentNode.removeChild(hostEl); } PH = null; X.hooks.draw = null; X.hooks.prices = null; X.hooks.state = null; refreshCta(); }
  sh.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t || t.disabled) { return; } var v;
    if (t.hasAttribute('data-close')) { close(); return; }
    if ((v = t.getAttribute('data-go'))) { U.step = v; draw.keep = 0; draw(); return; }
    if ((v = t.getAttribute('data-pick-size'))) {
      var prev = rawPrice(); X.S.size = v; push(); draw();
      if (X.S.height) { awaitPrice(prev, function () { draw(); readOthers(); }); }
      return;
    }
    if ((v = t.getAttribute('data-pick-height'))) { var prev2 = rawPrice(); X.S.height = v; push(); draw(); awaitPrice(prev2, function () { draw(); readOthers(); }); return; }
    if (t.hasAttribute('data-bag')) { var f = bagFace(); if (f.face === 'checkout') { close(); openCart(); } else if (f.enabled) { if (addToBag()) { say('Added to your bag'); } else { say('The store\'s bag button is not ready yet. Please try again.'); } } draw(); return; }
  });
  function readOthers() { var z = X.S.size && sizeByKey(X.S.size); if (!z) { return; } var miss = missingCombos(z); if (miss.length) { win.setTimeout(function () { readCombos(miss, null, function () { draw(); }); }, 150); } }
  X.hooks.draw = draw; X.hooks.prices = draw; X.hooks.state = draw;
  doc.documentElement.classList.add('ddp-lock'); PH = { host: hostEl, draw: draw, close: close }; draw();
  var fb = $('.btn:not(:disabled)', sh); if (fb && fb.focus) { try { fb.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
}
function nextStepP() { return X.S.size == null ? 'size' : X.S.height == null ? 'depth' : 'review'; }
/* the button and its one-line status, in the shop's own options block */
function refreshCta() {
  if (!ctaBtn || !ctaNote) { return; }
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height), fc = bagFace();
  ctaBtn.textContent = complete() ? 'Review your mattress' : (X.S.size || X.S.height ? 'Continue configuring' : 'Configure Your Mattress');
  ctaNote.innerHTML = complete() ? '<b>' + esc(chosenLabel('size')) + ' · ' + esc(chosenLabel('height')) + '</b>' + (priceNow() ? ' · ' + esc(priceNow()) : '') : esc(fc.guide);
}
function mountCta() {
  if (ctaBtn && doc.body.contains(ctaBtn)) { return true; }
  var r = shopRoot(); if (!r) { return false; }
  var first = $('.details-product-option', r); if (!first || !first.parentNode) { return false; }
  pageStylePhone();
  ctaBtn = doc.createElement('button'); ctaBtn.type = 'button'; ctaBtn.id = 'ddp-cta'; ctaBtn.onclick = openSheet;
  ctaNote = doc.createElement('p'); ctaNote.id = 'ddp-note'; ctaNote.setAttribute('aria-live', 'polite');
  first.parentNode.insertBefore(ctaNote, first); first.parentNode.insertBefore(ctaBtn, ctaNote);
  doc.documentElement.classList.add('ddtv-phone'); pull(); refreshCta();
  shopWatch = setInterval(function () { if (!doc.hidden && !X.busy) { if (pull() && PH) { PH.draw(); } refreshCta(); carousels(); } }, 1200);
  doc.addEventListener('change', function (e) { if (!X.busy && e.target && e.target.closest && e.target.closest('.details-product-option')) { win.setTimeout(function () { pull(); refreshCta(); if (PH) { PH.draw(); } }, 120); } }, true);
  carousels(); return true;
}
function unmountPhone() { if (PH) { PH.close(); } if (ctaBtn && ctaBtn.parentNode) { ctaBtn.parentNode.removeChild(ctaBtn); } if (ctaNote && ctaNote.parentNode) { ctaNote.parentNode.removeChild(ctaNote); } ctaBtn = null; ctaNote = null; clearInterval(shopWatch); doc.documentElement.classList.remove('ddtv-phone'); }
function onPage(page) {
  var pid = page && page.type === 'PRODUCT' ? Number(page.productId) : null;
  if (pid != null && CFG.products.indexOf(pid) >= 0) { if (lastPid !== pid) { unmountPhone(); } var tries = 0; (function go() { if (!mountCta() && ++tries < 60) { setTimeout(go, 150); } })(); lastPid = pid; }
  else { unmountPhone(); lastPid = null; }
}
function currentProductId() { var n = $('[class*="ecwid-productBrowser-ProductPage-"]'), m = n && /ecwid-productBrowser-ProductPage-(\d+)/.exec(String(n.className)); return m ? Number(m[1]) : null; }
function boot() {
  if (booted) { return; } booted = true; var E = win.Ecwid;
  E.OnPageLoaded.add(onPage); if (E.OnCartChanged) { E.OnCartChanged.add(onCart); }
  var id = currentProductId(); if (id == null && win.__ddtvPage) { id = Number(win.__ddtvPage.productId); }
  if (id != null) { onPage({ type: 'PRODUCT', productId: id }); }
}
(function waitEcwid(n) { if (win.Ecwid && win.Ecwid.OnPageLoaded) { boot(); return; } if (n < 300) { setTimeout(function () { waitEcwid(n + 1); }, 100); } })(0);
