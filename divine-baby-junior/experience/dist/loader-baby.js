/* Divine DunlopDreams · Baby & Junior Experience loader (an alternative to the shop's own loader: it serves the two files from jsDelivr).
   Acts only on a product page that carries its own #ddtv-pointer for that product id. ?ddtv=off: nothing. ?ddtv=test: test opt-in for channel "test". */
(function (w, d) {
  var B = 'https://cdn.jsdelivr.net/gh/Matrress/Animation@ff28404f10230b45a7e67232eb56e6775a984846/divine-baby-junior/experience/dist/', NAME = /^[a-z][a-z0-9-]{0,45}-[0-9a-f]{20}\.js$/, q = w.location.search, seen = {};
  if (/[?&]ddtv=off\b/.test(q) || w.__ddbabyLoader) { return; } w.__ddbabyLoader = 1;
  try { if (/[?&]ddtv=test\b/.test(q)) { w.sessionStorage.setItem('ddtvTest', '1'); } } catch (e) { /* no storage */ }
  function testOn() { try { return w.sessionStorage.getItem('ddtvTest') === '1'; } catch (e) { return false; } }
  function phone() { var s = w.screen || {}, p = Math.min(s.width || 9999, s.height || 9999) < 600; if (/[?&]ddtv=tv\b/.test(q)) { p = false; } if (/[?&]ddtv=phone\b/.test(q)) { p = true; } return p; }
  function use(e) {
    var a = function (k) { return e.getAttribute('data-ddtv-' + k) || ''; }, c = a('channel'), f = phone() ? a('phone') : a('tv');
    if (a('v') !== '1' || a('model') !== 'baby' || !NAME.test(f)) { return; }
    if (!((c === 'test' && testOn()) || c === 'live')) { return; }
    if (seen[f]) { return; } seen[f] = 1;
    var s = d.createElement('script'); s.async = false; s.src = B + f; d.head.appendChild(s);
  }
  function look(n) { var e = d.getElementById('ddtv-pointer'); if (e) { use(e); return; } if (n < 200) { setTimeout(function () { look(n + 1); }, 150); } }
  (function wait(n) { if (w.Ecwid && w.Ecwid.OnPageLoaded) { w.Ecwid.OnPageLoaded.add(function (g) { if (g && g.type === 'PRODUCT') { look(0); } }); look(0); return; } if (n < 300) { setTimeout(function () { wait(n + 1); }, 100); } }(0));
}(window, document));
