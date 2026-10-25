/* Divine DunlopDreams: the System tile, __VERSION__. Enhancement only.
   Without this file the section is a complete document: the band, then the five topics and the story one after another.
   This script turns the topics into ONE dialog (the same nodes are moved, nothing is copied), opened from the band, from the navigator's
   "Explore the System" link (any a[href="#ddhd-system"]) or from a topic button. No automatic carousel: it moves only when the visitor asks.
   Keyboard: Escape closes; Left / Right (or Previous / Next) move between topics; Tab stays inside the dialog and returns to where the visitor came from.
   Touch: swipe left / right. The last topic leads on to the complete story; its button "Find Your Latex Mattress" returns to the navigator's model choice.
   Events (bubbling from the section, for GTM): dsys:open, dsys:topic, dsys:close, dsys:find.
   Vanilla JS; one global, window.DSYS. */
(function (w, d) {
  'use strict';
  var VERSION = '__VERSION__';
  if (w.DSYS && w.DSYS.version) { w.DSYS.scan(); return; }

  var st = null;          // the open dialog's state: {root, dlg, host, trigger, i}
  var insts = [];
  var FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),input,select,textarea';

  function qs(r, s) { return r.querySelector(s); }
  function qa(r, s) { return [].slice.call(r.querySelectorAll(s)); }
  function reduced() { return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function el(tag, cls, text) { var n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function init(root) {
    if (root.__dsys) return null;
    var dlg = qs(root, '.dsys__dlg'), body = dlg && qs(dlg, '.dsys__body');
    var panels = dlg ? qa(dlg, '.dsys__p') : [];
    if (!dlg || !body || panels.length < 2) return null;
    var story = panels.filter(function (p) { return p.getAttribute('data-i') === 'story'; })[0];
    var topics = panels.filter(function (p) { return p !== story; });   // the five topics, in order
    var N = topics.length;
    root.classList.add('is-js');

    /* ---- the dialog frame, built around the existing body (no content is copied) ---- */
    var box = el('div', 'dsys__box');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'What makes our latex sleep system different?');
    var bar = el('div', 'dsys__bar');
    var bt = el('p', 'dsys__bt', 'The Divine Latex Sleep System');
    var pg = el('p', 'dsys__pg'); pg.setAttribute('aria-live', 'polite'); pg.setAttribute('aria-atomic', 'true');
    var x = el('button', 'dsys__x'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
    bar.appendChild(bt); bar.appendChild(pg); bar.appendChild(x);
    var nav = el('div', 'dsys__nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Topics');
    var tabs = panels.map(function (p, k) {
      var isStory = p === story, t = el('button', 'dsys__tab' + (isStory ? ' dsys__tab--story' : ''), p.getAttribute('data-title'));
      t.type = 'button'; t.id = 'dsys-tab-' + (isStory ? 'story' : k + 1); t.setAttribute('role', 'tab'); t.setAttribute('aria-controls', p.id);
      p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id);
      nav.appendChild(t); return t;
    });
    var ft = el('div', 'dsys__ft');
    var prev = el('button', 'dsys__btn dsys__btn--ghost', 'Previous'); prev.type = 'button';
    var dots = el('div', 'dsys__dots'); dots.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < N; k++) dots.appendChild(el('i'));
    var next = el('button', 'dsys__btn', 'Next'); next.type = 'button';
    ft.appendChild(prev); ft.appendChild(dots); ft.appendChild(next);
    body.tabIndex = 0; body.setAttribute('role', 'region'); body.setAttribute('aria-label', 'Topic');   // a scrolling area must be reachable from the keyboard
    body.parentNode.removeChild(body);
    box.appendChild(bar); box.appendChild(nav); box.appendChild(body); box.appendChild(ft);
    dlg.appendChild(box);
    /* the two kinds of pages of the one dialog: topic pages numbered "n of 5", and the story */
    var cur = 0;   // index in panels

    function show(i, o) {
      o = o || {};
      if (i < 0 || i >= panels.length) return;
      cur = i;
      var isStory = panels[i] === story;
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      tabs.forEach(function (t, j) { var on = j === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      pg.textContent = isStory ? 'Complete Story' : (i + 1) + ' of ' + N;
      [].forEach.call(dots.children, function (dt, j) { dt.className = !isStory && j === i ? 'is-on' : ''; });
      prev.disabled = i === 0;
      next.textContent = isStory ? 'Find Your Latex Mattress' : i === N - 1 ? 'See the Complete System' : 'Next';   // the story is the end of the path: the footer button leads back to the models
      body.scrollTop = 0;
      var t = tabs[i];   // on a narrow screen the tab strip scrolls: keep the chosen tab fully in view
      if (t && nav.scrollWidth > nav.clientWidth) { var l = t.offsetLeft - 16, r = t.offsetLeft + t.offsetWidth + 16; if (l < nav.scrollLeft) nav.scrollLeft = Math.max(0, l); else if (r > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = r - nav.clientWidth; }
      if (o.focus) { var h = qs(panels[i], '.dsys__h'); if (h) h.focus({ preventScroll: true }); }
      fire(root, 'topic', { topic: isStory ? 'story' : i + 1, title: panels[i].getAttribute('data-title') });
    }
    function go(delta) { var j = cur + delta; if (j >= 0 && j < panels.length) show(j, { focus: true }); }

    /* ---- open / close ---- */
    function open(which, trigger) {
      if (st) close(false);
      var host = d.createElement('div'); host.className = 'dsys dsys--host is-js'; host.setAttribute('data-dsys-host', '');
      d.body.appendChild(host); host.appendChild(dlg);
      dlg.classList.add('is-open');
      var sw = w.innerWidth - d.documentElement.clientWidth;
      st = { root: root, dlg: dlg, host: host, trigger: trigger || null, prevOverflow: d.documentElement.style.overflow, prevPad: d.body.style.paddingRight };
      d.documentElement.style.overflow = 'hidden'; if (sw > 0) d.body.style.paddingRight = sw + 'px';   // scroll lock without a page jump
      var i = which === 'story' ? panels.indexOf(story) : Math.max(0, Math.min(N - 1, (parseInt(which, 10) || 1) - 1));
      show(i);
      x.focus({ preventScroll: true });
      fire(root, 'open', { topic: which });
    }
    function close(returnFocus) {
      if (!st || st.root !== root) return;
      var s = st; st = null;
      s.dlg.classList.remove('is-open');
      root.querySelector('.dsys__in').appendChild(s.dlg);   // the one copy goes back into its tile
      if (s.host.parentNode) s.host.parentNode.removeChild(s.host);
      d.documentElement.style.overflow = s.prevOverflow; d.body.style.paddingRight = s.prevPad;
      if (returnFocus !== false && s.trigger && d.contains(s.trigger)) s.trigger.focus({ preventScroll: true });
      fire(root, 'close', {});
    }
    function find() {
      close(false);
      fire(root, 'find', {});
      var navr = d.getElementById('ddhd');
      var tab = d.getElementById('ddhd-tab-mattress');
      if (tab && navr) {
        tab.click();   // the navigator's own switch: selects the mattress view, exactly as a visitor's tap would
        var top = navr.getBoundingClientRect().top + w.pageYOffset - 12;
        w.scrollTo({ top: top, behavior: reduced() ? 'auto' : 'smooth' });
        tab.focus({ preventScroll: true });
      } else if (w.location) { w.location.hash = 'ddhd-mattress'; }
    }

    /* ---- controls ---- */
    var ac = typeof AbortController === 'function' ? new AbortController() : null;
    var sig = ac ? { signal: ac.signal } : false;
    x.addEventListener('click', function () { close(true); }, sig);
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) close(true); }, sig);   // a press on the dark area around the box
    prev.addEventListener('click', function () { go(-1); }, sig);
    next.addEventListener('click', function () { if (panels[cur] === story) find(); else go(1); }, sig);
    tabs.forEach(function (t, j) { t.addEventListener('click', function () { show(j, { focus: true }); }, sig); });
    nav.addEventListener('keydown', function (e) {
      var k = e.key, j = tabs.indexOf(d.activeElement);
      if (j < 0) return;
      var t = k === 'ArrowRight' ? j + 1 : k === 'ArrowLeft' ? j - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : -1;
      if (t < 0 || t >= tabs.length) return;
      e.preventDefault(); show(t); tabs[t].focus();
    }, sig);
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !(e.target.closest && e.target.closest('[role="tablist"]'))) { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); return; }
      if (e.key === 'Tab') {   // focus stays inside the dialog
        var f = qa(box, FOCUSABLE).filter(function (n) { return n.offsetParent !== null || n === d.activeElement; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (d.activeElement === first || !box.contains(d.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (d.activeElement === last || !box.contains(d.activeElement))) { e.preventDefault(); first.focus(); }
      }
    }, sig);
    /* swipe: a clear horizontal move; vertical scrolling and the tab strip are left alone */
    var tx = 0, ty = 0, tn = false;
    body.addEventListener('touchstart', function (e) { var t = e.touches[0]; tx = t.clientX; ty = t.clientY; tn = e.touches.length === 1; }, { passive: true });
    body.addEventListener('touchend', function (e) {
      if (!tn) return; tn = false;
      var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    /* "Find your latex mattress" and the story's own links */
    panels.forEach(function (p) {
      var f = qs(p, '[data-dsys-find]');
      if (f) f.addEventListener('click', function (e) { e.preventDefault(); find(); }, sig);
    });
    /* panels that start hidden so the first paint is the band only */
    panels.forEach(function (p, j) { p.hidden = j !== 0; });

    var inst = { root: root, open: open, close: close, destroy: function () { if (st && st.root === root) close(false); if (ac) ac.abort(); root.__dsys = null; root.classList.remove('is-js'); } };
    root.__dsys = inst;
    return inst;
  }

  function fire(root, name, detail) { try { root.dispatchEvent(new CustomEvent('dsys:' + name, { bubbles: true, detail: detail })); } catch (e) { /* old browser: no events */ } }
  function current() { for (var i = 0; i < insts.length; i++) if (d.contains(insts[i].root) || (st && st.root === insts[i].root)) return insts[i]; return null; }

  function scan() {
    // forget sections Ecwid has removed (a re-render builds a new one); an open dialog of a removed section is released
    insts = insts.filter(function (n) {
      var alive = d.contains(n.root) || (st && st.root === n.root && d.contains(st.dlg));
      if (!alive) { try { n.destroy(); } catch (e) { /* ignore */ } }
      return alive;
    });
    if (st && !d.contains(st.root)) { /* the tile was replaced while open: close and release the page */
      var s = st; st = null;
      if (s.host.parentNode) s.host.parentNode.removeChild(s.host);
      d.documentElement.style.overflow = s.prevOverflow; d.body.style.paddingRight = s.prevPad;
    }
    qa(d, '[data-dsys]').forEach(function (r) { var n = init(r); if (n) insts.push(n); });
    markTriggers();
  }

  /* the navigator's link only makes sense when the System tile is installed: otherwise it is hidden instead of leading nowhere */
  function markTriggers() {
    var has = !!qs(d, '[data-dsys]');
    qa(d, 'a[href="#ddhd-system"][data-ddhd-system]').forEach(function (a) { a.hidden = !has; });
  }

  /* one delegated listener for every opener on the page, present or added later (Ecwid re-renders tiles) */
  d.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var t = e.target.closest ? e.target : e.target.parentNode;
    var a = t && t.closest && t.closest('a[href="#ddhd-system"],[data-dsys-open]');
    if (!a) return;
    var n = current(); if (!n) return;   // no script-enhanced System tile: the plain link scrolls to the section
    e.preventDefault();
    var which = a.getAttribute('data-dsys-open') || '1';
    n.open(which, a);
  });

  w.DSYS = { version: VERSION, scan: scan, open: function (i) { var n = current(); if (n) n.open(i || 1, d.activeElement); }, close: function () { var n = current(); if (n) n.close(true); } };
  var hooked = false;
  function hook() {
    var is = w.instantsite;
    if (hooked || !is || !is.onTileLoaded || !is.onTileUnloaded) return;
    hooked = true; is.onTileLoaded.add(scan); is.onTileUnloaded.add(scan);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { scan(); hook(); }, { once: true });
  else { scan(); hook(); }
  var tries = 0, iv = setInterval(function () { hook(); if (hooked || ++tries > 40) clearInterval(iv); }, 500);
})(window, document);
