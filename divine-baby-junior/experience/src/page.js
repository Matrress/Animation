/* ===== the page layer of the television: mount, the two views, the information blocks, the folded description =====
   Same scheme as Botanic TV: the television is built in a shadow root placed before Ecwid's product block; the shop's own top row, sidebar and
   description stay in the page (they are the indexed text) but are not shown; the Standard Product View gives the page back as the shop made it. */
var CFG = win.__DDTVX_CONFIG = win.__DDTVX_CONFIG || {};
CFG.products = CFG.products || [DATA.product.id]; CFG.phoneMaxShortSide = CFG.phoneMaxShortSide || 600;
var host = null, infoBox = null, foldBtn = null, mo = null, pollT2 = null, ro = null, pending = null, lastPid = null, ignited = false, booted = false;
var HIDE = { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', 'clip-path': 'inset(50%)', 'white-space': 'nowrap', opacity: '0', 'pointer-events': 'none', border: '0', padding: '0', margin: '0' };
function hideRule(sel) { var s = sel + '{'; for (var k in HIDE) { s += k + ':' + HIDE[k] + '!important;'; } return s + '}'; }
var PAGE_CSS =
  hideRule('html.ddtv-on .product-details__sidebar,html.ddtv-on .details-product-share,html.ddtv-on .product-details__product-title,html.ddtv-on .product-details__top') +
  'html.ddtv-on #tile-product-details .ins-tile__wrap{margin-top:14px!important}' +
  'html.ddtv-on:not(.ddtv-desc-open) .product-details__description{max-height:0;overflow:hidden;padding:0!important;margin:0!important}' +
  '.ddtv-info{display:block!important;clear:both!important;float:none!important;box-sizing:border-box!important;max-width:100%!important;margin:18px 0 10px!important;padding:16px 18px!important;border:1px solid rgba(0,58,104,.18)!important;border-left:4px solid #006591!important;border-radius:16px!important;background:#E4E8F0!important;color:#003A68!important;font:400 15px/1.55 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif!important}' +
  '.ddtv-info p{margin:0 0 8px!important;color:#003A68!important;font:inherit!important}' +
  '.ddtv-info .ddtv-info__h{margin:0 0 10px!important;font:600 17px/1.3 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif!important}' +
  '.ddtv-info__g{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))!important;gap:10px!important;margin:0 0 10px!important}' +
  '.ddtv-info__c{margin:0!important;padding:10px 14px!important;border:1px solid rgba(0,58,104,.18)!important;border-radius:12px!important;background:#FFFFFF!important}' +
  '.ddtv-info__c b{display:block;margin:0 0 2px;font-weight:600}' +
  '.ddtv-info__a{display:flex!important;flex-wrap:wrap!important;gap:10px!important;margin:12px 0 0!important}' +
  '.ddtv-btn,.ddtv-fold,#ddtv-back{display:inline-block!important;float:none!important;box-sizing:border-box!important;width:auto!important;max-width:100%!important;margin:0!important;padding:11px 20px!important;border-radius:12px!important;font:600 15px/1.2 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif!important;text-align:center!important;cursor:pointer!important}' +
  '.ddtv-btn,#ddtv-back{border:1.5px solid #006591!important;background:#006591!important;color:#FFFFFF!important}' +
  '.ddtv-btn:hover,#ddtv-back:hover{background:#003A68!important;border-color:#003A68!important}' +
  '.ddtv-fold{border:1.5px solid rgba(0,58,104,.18)!important;background:#FFFFFF!important;color:#003A68!important}' +
  '.ddtv-fold:hover{border-color:#003A68!important}' +
  'html.ddtv-classic #ddtv-info{display:none!important}' +
  'html.ddtv-on,html.ddtv-on body{overflow-x:hidden}@supports (overflow:clip){html.ddtv-on,html.ddtv-on body{overflow-x:clip}}' +
  '#ddtv-experience{display:block;width:100%;margin:0 0 24px;clear:both}' +
  'html.ddtv-classic #ddtv-experience{display:none}';
function pageStyle() {
  if (doc.getElementById('ddtv-page-css')) { return; }
  var st = doc.createElement('style'); st.id = 'ddtv-page-css'; st.textContent = PAGE_CSS; (doc.head || doc.documentElement).appendChild(st);
  if (!doc.getElementById('ddtv-font-baby')) {              /* the font of the description's family, declared for the shadow root too (fonts are document-wide) */
    var f = doc.createElement('style'); f.id = 'ddtv-font-baby';
    f.textContent = '@font-face{font-family:"DBJChillax";font-style:normal;font-weight:400;font-display:swap;src:url(' + FONT400 + ') format("woff2")}@font-face{font-family:"DBJChillax";font-style:normal;font-weight:600;font-display:swap;src:url(' + FONT600 + ') format("woff2")}';
    (doc.head || doc.documentElement).appendChild(f);
  }
}
var BOTH = 'Both show the same mattress and the same choices, so you only need one of them.';
function infoHtml(inStd) {
  var tv = '<div class="ddtv-info__c"><b>Optimised Preview</b>The modern, guided way: explore the information and make your choices in one screen.</div>',
      sd = '<div class="ddtv-info__c"><b>Standard Product View</b>The familiar page: dropdown selectors beside the text and all the information in menus.</div>';
  return '<p class="ddtv-info__h">' + (inStd ? 'You are in the Standard Product View' : 'Two ways to view this mattress') + '</p><div class="ddtv-info__g">' + (inStd ? sd + tv : tv + sd) + '</div><p>' + BOTH + '</p>';
}
function ensureFold() {
  if (doc.documentElement.classList.contains('ddtv-classic')) { return; }
  var d = $('.product-details__description'); if (!d) { return; }
  if (infoBox && infoBox.parentNode && infoBox.nextSibling === d) { return; }
  if (!infoBox) {
    infoBox = doc.createElement('div'); infoBox.id = 'ddtv-info'; infoBox.className = 'ddtv-info'; infoBox.setAttribute('role', 'region'); infoBox.setAttribute('aria-label', 'Two ways to view this mattress');
    infoBox.innerHTML = infoHtml(false) + '<div class="ddtv-info__a"></div>';
    var to = doc.createElement('button'); to.type = 'button'; to.className = 'ddtv-btn'; to.id = 'ddtv-to-standard'; to.textContent = 'Open the Standard Product View'; to.onclick = classic;
    foldBtn = doc.createElement('button'); foldBtn.type = 'button'; foldBtn.className = 'ddtv-fold';
    foldBtn.onclick = function () { var on = doc.documentElement.classList.toggle('ddtv-desc-open'); foldBtn.setAttribute('aria-expanded', String(on)); foldBtn.textContent = on ? 'Fold the description' : 'Read the full description'; };
    var a = $('.ddtv-info__a', infoBox); a.appendChild(to); a.appendChild(foldBtn);
  }
  var open = doc.documentElement.classList.contains('ddtv-desc-open');
  foldBtn.setAttribute('aria-expanded', String(open)); foldBtn.textContent = open ? 'Fold the description' : 'Read the full description';
  d.parentNode.insertBefore(infoBox, d);
}
/* the Standard Product View: the shop's own page, the television steps aside; one button brings it back */
function classic() {
  if (!host) { return; }
  doc.documentElement.classList.remove('ddtv-on', 'ddtv-desc-open'); doc.documentElement.classList.add('ddtv-classic');
  if (infoBox && infoBox.parentNode) { infoBox.parentNode.removeChild(infoBox); } infoBox = null; foldBtn = null;
  if (!doc.getElementById('ddtv-backbox')) {
    var r = shopRoot(); if (!r) { return; }
    var bx = doc.createElement('div'); bx.id = 'ddtv-backbox'; bx.className = 'ddtv-info'; bx.setAttribute('role', 'region'); bx.setAttribute('aria-label', 'Two ways to view this mattress');
    bx.innerHTML = infoHtml(true) + '<div class="ddtv-info__a"></div>';
    var bk = doc.createElement('button'); bk.id = 'ddtv-back'; bk.type = 'button'; bk.textContent = 'Open the Optimised Preview'; bk.onclick = tvOn;
    $('.ddtv-info__a', bx).appendChild(bk); r.parentNode.insertBefore(bx, r);
  }
  try { win.scrollTo && win.scrollTo(0, Math.max(0, (doc.getElementById('ddtv-backbox').getBoundingClientRect().top + (win.pageYOffset || 0)) - 80)); } catch (e) { /* stays */ }
}
function tvOn() {
  doc.documentElement.classList.remove('ddtv-classic'); doc.documentElement.classList.add('ddtv-on');
  var bx = doc.getElementById('ddtv-backbox'); if (bx && bx.parentNode) { bx.parentNode.removeChild(bx); }
  if (TV) { TV.U.view = 'tv'; TV.draw(); }
  ensureFold(); bleed();
}
/* the television takes the page's full width and centres itself (document coordinates, so scrolling, bounce or zoom cannot move it) */
function docLeft(el) { var x = 0; for (var e = el; e; e = e.offsetParent) { x += e.offsetLeft || 0; } return x; }
function bleed() {
  if (!host || !host.parentNode) { return; }
  var cw = doc.documentElement.clientWidth || win.innerWidth, cur = parseFloat(host.style.marginLeft) || 0, natural = docLeft(host) - cur;
  var vv = win.visualViewport, r = host.getBoundingClientRect(), sx = win.pageXOffset || 0;
  if ((!vv || (Math.abs(vv.scale - 1) < 0.001 && !vv.offsetLeft)) && Math.abs((r.left + sx - cur) - natural) < 2) { natural = r.left + sx - cur; }
  host.style.maxWidth = 'none'; if (host.style.width !== cw + 'px') { host.style.width = cw + 'px'; }
  if (Math.abs(-natural - cur) > 0.5) { host.style.marginLeft = (-natural) + 'px'; }
}
var onResize = function () { clearTimeout(onResize.t); onResize.t = setTimeout(bleed, 60); };
function schedule() { if (pending) { return; } pending = setTimeout(function () { pending = null; if (pull() && TV) { TV.draw(); } else if (TV && priceSig() !== schedule.ps) { schedule.ps = priceSig(); TV.draw(); } ensureFold(); carousels(); bleed(); }, 80); }
function priceSig() { return rawPrice(); }
function mount(pid) {
  if (host && doc.body.contains(host)) { return host; }
  if (isPhone() && !win.__ddtvForceTv) { return null; }
  var pd = shopRoot(); if (!pd || !pd.parentNode) { return null; }
  pageStyle(); doc.documentElement.classList.add('ddtv-on');
  try {
    host = doc.createElement('div'); host.id = 'ddtv-experience'; host.setAttribute('data-ddtv', 'tv'); pd.parentNode.insertBefore(host, pd);
    var R = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    buildTv(R, { classic: classic });
    pull(); TV.draw();
  } catch (err) { unmount(); return null; }                 /* if the television cannot be built, the shop's page is given back whole */
  bleed(); win.addEventListener('resize', onResize); win.addEventListener('orientationchange', onResize);
  if (win.visualViewport) { win.visualViewport.addEventListener('resize', onResize); }
  if (win.ResizeObserver) { try { ro = new win.ResizeObserver(onResize); ro.observe(doc.documentElement); if (host.parentNode) { ro.observe(host.parentNode); } } catch (e) { ro = null; } }
  ensureFold();
  mo = new MutationObserver(schedule); mo.observe(pd, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'selected', 'disabled'] });
  doc.addEventListener('change', onNativeChange, true);
  pollT2 = setInterval(function () { if (!doc.hidden) { keep(); if (pull() && TV) { TV.draw(); } } }, 1500);
  lastPid = pid; carousels(); keep(); return host;
}
function keep() {                                         /* the page's state is asserted, not assumed */
  if (!host || !TV) { return; } var cl = doc.documentElement.classList;
  if (!doc.getElementById('ddtv-page-css')) { pageStyle(); }
  if (TV.U.view === 'tv' && !cl.contains('ddtv-classic') && !cl.contains('ddtv-on')) { cl.add('ddtv-on'); }
  carousels();
}
function onNativeChange(e) { if (!X.busy && e.target && e.target.closest && e.target.closest('.details-product-option')) { schedule(); } }
function unmount() {
  if (mo) { mo.disconnect(); } mo = null; clearInterval(pollT2); pollT2 = null;
  doc.removeEventListener('change', onNativeChange, true); win.removeEventListener('resize', onResize); win.removeEventListener('orientationchange', onResize);
  if (win.visualViewport) { win.visualViewport.removeEventListener('resize', onResize); } if (ro) { ro.disconnect(); } ro = null;
  if (host && host.parentNode) { host.parentNode.removeChild(host); } if (infoBox && infoBox.parentNode) { infoBox.parentNode.removeChild(infoBox); }
  host = null; TV = null; foldBtn = null; infoBox = null;
  doc.documentElement.classList.remove('ddtv-on', 'ddtv-desc-open', 'ddtv-classic');
  var bx = doc.getElementById('ddtv-backbox'); if (bx && bx.parentNode) { bx.parentNode.removeChild(bx); }
}
function onPage(page) {
  var pid = page && page.type === 'PRODUCT' ? Number(page.productId) : null;
  if (pid != null && CFG.products.indexOf(pid) >= 0) { if (lastPid !== pid) { unmount(); } var tries = 0; (function go() { if (!mount(pid) && ++tries < 40 && !isPhone()) { setTimeout(go, 150); } })(); }
  else { unmount(); }
}
function currentProductId() { var n = $('[class*="ecwid-productBrowser-ProductPage-"]'), m = n && /ecwid-productBrowser-ProductPage-(\d+)/.exec(String(n.className)); return m ? Number(m[1]) : null; }
function boot() {
  if (booted) { return; } booted = true; var E = win.Ecwid;
  E.OnPageLoaded.add(onPage);
  if (E.OnProductSelectedOptionsChanged) { E.OnProductSelectedOptionsChanged.add(function () { schedule(); }); }
  if (E.OnCartChanged) { E.OnCartChanged.add(onCart); }
  var id = currentProductId(); if (id == null && win.__ddtvPage) { id = Number(win.__ddtvPage.productId); }
  if (id != null) { onPage({ type: 'PRODUCT', productId: id }); }
}
(function waitEcwid(n) { if (win.Ecwid && win.Ecwid.OnPageLoaded) { boot(); return; } if (n < 300) { setTimeout(function () { waitEcwid(n + 1); }, 100); } })(0);
