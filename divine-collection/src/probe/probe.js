/* DDC capability probe: marks test 17 (external script inside the description) and, when loaded by the site-wide probe loader,
   test 18 with what Ecwid reports (page type, category id, description width, re-renders). Read-only: it changes nothing but its own cells. */
(function () {
  function mark(sel, text) { var e = document.querySelectorAll(sel); for (var i = 0; i < e.length; i++) { e[i].textContent = text; if (!/\bok\b/.test(e[i].className)) e[i].className += ' ok'; } }
  var fromLoader = !!window.__ddcProbeLoader;
  var renders = 0, last = null;
  function report() {
    var d = document.querySelector('.ddcp');
    if (!d) return;
    if (!fromLoader) mark('.ddcp-js2', 'external script ran');
    else {
      var w = Math.round(d.getBoundingClientRect().width);
      var lh = getComputedStyle(d.querySelector('p') || d).lineHeight;
      mark('.ddcp-js3', 'site-wide loader active · Ecwid page: ' + (last ? last.type + ' ' + (last.categoryId || '') : 'n/a') + ' · description width ' + w + ' px · p line-height ' + lh + ' · page loads seen ' + renders);
    }
  }
  if (fromLoader && window.Ecwid && Ecwid.OnPageLoaded) Ecwid.OnPageLoaded.add(function (p) { renders++; last = p; setTimeout(report, 50); });
  report();
  if (fromLoader) new MutationObserver(function () { report(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
