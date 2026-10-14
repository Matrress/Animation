/* Divine DunlopDreams Home Discovery __VERSION__: enhancement only.
   The section is complete without this file (every model, its short description and its product link is static HTML; both views show).
   This script adds: the mattress/topper switch, the need chips (they highlight models, never hide them), and ONE preview panel opened inline under the chosen card.
   Product data is not typed here: the previews and route texts below are generated at build time from the approved Collection 3.13.2 sources.
   Events (no analytics are sent from here; GTM can listen): ddhd:view, ddhd:need, ddhd:preview, ddhd:product, ddhd:collection, bubbling from the section.
   Vanilla JS; one global, window.DDHD. */
(function (w, d) {
  'use strict';
  var VERSION = '__VERSION__';
  if (w.DDHD && w.DDHD.version) { w.DDHD.scan(); return; }

  var PV = __PREVIEWS__;      // model id -> preview html
  var ROUTES = __ROUTES__;    // the approved need routes: title, need, answer, models [{id, l}]
  var NAMES = __NAMES__;      // model id -> {n: name, v: view}
  var insts = [];

  function qs(r, s) { return r.querySelector(s); }
  function qa(r, s) { return [].slice.call(r.querySelectorAll(s)); }
  function reduced() { return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function el(tag, cls, text) { var n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function init(root) {
    if (root.__ddhd) return null;
    var ac = typeof AbortController === 'function' ? new AbortController() : null;
    var sig = ac ? { signal: ac.signal } : false;
    var tablist = qs(root, '.ddhd__sw');
    var tabs = qa(root, '.ddhd__tab');
    var views = qa(root, '.ddhd__view');
    if (!tablist || !tabs.length || !views.length) return null;
    root.classList.add('is-js');

    var view = 'mattress', route = null, openCard = null, pli = null, panel = null, ro = null, raf = 0;
    function fire(name, detail) { try { root.dispatchEvent(new CustomEvent('ddhd:' + name, { bubbles: true, detail: detail })); } catch (e) { /* old browser: no events */ } }

    /* ---- semantics: the static links become a proper tab list and toggle buttons ---- */
    tablist.setAttribute('role', 'tablist');
    tabs.forEach(function (t) {
      var v = t.getAttribute('data-tab');
      t.id = 'ddhd-tab-' + v; t.setAttribute('role', 'tab'); t.setAttribute('aria-controls', 'ddhd-' + v);
    });
    views.forEach(function (p) {
      var v = p.getAttribute('data-view-panel');
      p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'ddhd-tab-' + v);
    });
    qa(root, 'a.ddhd__chip').forEach(function (a) {
      var b = el('button', a.className); b.type = 'button'; b.setAttribute('data-route', a.getAttribute('data-route'));
      b.setAttribute('aria-pressed', 'false'); b.textContent = a.textContent; a.parentNode.replaceChild(b, a);
    });
    var guide = qs(root, '.ddhd__guide');

    /* ---- views ---- */
    function setView(name, o) {
      o = o || {};
      if (name !== 'mattress' && name !== 'topper') return;
      var before = tablist.getBoundingClientRect().top;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      });
      views.forEach(function (p) { p.hidden = p.getAttribute('data-view-panel') !== name; });
      closePanel(false);
      var changed = view !== name; view = name;
      if (o.keepPos) { var delta = tablist.getBoundingClientRect().top - before; if (delta) w.scrollBy(0, delta); } // the switch stays where the visitor's eye is
      if (o.focus) { var t = qs(root, '.ddhd__tab[data-tab="' + name + '"]'); if (t) t.focus(); }
      if (changed && !o.silent) fire('view', { view: name });
    }

    /* ---- needs: guidance that highlights, never hides ---- */
    function applyRoute(i) {
      route = i;
      qa(root, '.ddhd__chip').forEach(function (c) {
        var r = c.getAttribute('data-route'), on = i == null ? r === 'all' : r === String(i);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var ids = i == null ? null : ROUTES[i].m.map(function (m) { return m.id; });
      qa(root, '.ddhd__grid--mattress .ddhd__card').forEach(function (c) {
        var on = !!ids && ids.indexOf(c.getAttribute('data-id')) > -1;
        c.classList.toggle('is-match', on); c.classList.toggle('is-dim', !!ids && !on);
        var tag = qs(c, '.ddhd__tag'); if (tag) tag.parentNode.removeChild(tag);
        if (on) c.appendChild(el('span', 'ddhd__tag', 'Matches Your Need'));
      });
      closePanel(false);
      if (!guide) return;
      guide.textContent = '';
      if (i == null) { guide.hidden = true; fire('need', { route: null }); return; }
      var r = ROUTES[i];
      guide.appendChild(el('p', 'ddhd__g-need', '“' + r.need + '”'));
      guide.appendChild(el('p', 'ddhd__g-ans', r.a));
      var ul = el('ul', 'ddhd__g-l');
      r.m.forEach(function (m) {
        var card = qs(root, '#ddhd-m-' + m.id), link = card && qs(card, '.ddhd__nm a');
        var li = el('li');
        if (link) { var a = el('a', null, NAMES[m.id].n); a.href = link.href; a.setAttribute('data-ddhd-product', m.id); li.appendChild(a); li.appendChild(d.createTextNode(': ' + m.l)); }
        ul.appendChild(li);
      });
      guide.appendChild(ul);
      var x = el('p', 'ddhd__g-x'), b = el('button', null, 'Show All Models'); b.type = 'button'; b.setAttribute('data-route', 'all'); b.className = 'ddhd__g-all';
      x.appendChild(b); guide.appendChild(x); guide.hidden = false;
      fire('need', { route: i, title: r.t });
    }

    /* ---- the one preview panel ---- */
    function cardsOf(grid) { return [].filter.call(grid.children, function (c) { return c.classList && c.classList.contains('ddhd__card'); }); }
    function place() {
      if (!openCard || !pli) return;
      var grid = openCard.parentNode, cards = cardsOf(grid);
      var cols = (w.getComputedStyle(grid).gridTemplateColumns || '').split(' ').filter(Boolean).length || 1;
      var idx = cards.indexOf(openCard), end = Math.min(idx - (idx % cols) + cols - 1, cards.length - 1);
      if (pli.previousSibling !== cards[end]) grid.insertBefore(pli, cards[end].nextSibling);
      var cr = openCard.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      pli.style.setProperty('--ax', Math.round(cr.left + cr.width / 2 - pr.left) + 'px');
    }
    function reveal() {
      var r = panel.getBoundingClientRect(), vh = w.innerHeight, dy = 0;
      if (r.height > vh - 120) dy = r.top - 84;
      else if (r.bottom > vh - 16) dy = r.bottom - vh + 28;
      else if (r.top < 70) dy = r.top - 84;
      if (dy) w.scrollBy({ top: dy, behavior: reduced() ? 'auto' : 'smooth' });
    }
    function openPanel(card, o) {
      o = o || {};
      if (openCard === card) { closePanel(true); return; }
      var id = card.getAttribute('data-id'); if (!PV[id]) return;
      closePanel(false);
      if (!pli) {
        pli = el('li', 'ddhd__pli'); panel = el('div', 'ddhd__panel');
        panel.id = 'ddhd-panel'; panel.setAttribute('role', 'region'); panel.tabIndex = -1; pli.appendChild(panel);
      }
      // trusted markup: generated at build time from the approved source, every value escaped (no visitor input reaches this)
      panel.innerHTML = '<button type="button" class="ddhd__x" aria-label="Close preview"></button>' + PV[id];
      panel.setAttribute('aria-labelledby', 'ddhd-pv-' + id);
      openCard = card; place();
      card.classList.add('is-open');
      var b = qs(card, '.ddhd__more'); if (b) { b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-controls', 'ddhd-panel'); }
      if (o.focus) panel.focus({ preventScroll: true });
      reveal();
      fire('preview', { id: id });
    }
    function closePanel(returnFocus) {
      if (!openCard) return;
      var card = openCard; openCard = null;
      card.classList.remove('is-open');
      var b = qs(card, '.ddhd__more'); if (b) { b.setAttribute('aria-expanded', 'false'); b.removeAttribute('aria-controls'); }
      if (pli && pli.parentNode) pli.parentNode.removeChild(pli);
      if (returnFocus && b) b.focus({ preventScroll: true });
    }

    /* ---- events (all delegated, all removed by destroy) ---- */
    root.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest) return;
      var tab = t.closest('.ddhd__tab');
      if (tab) { e.preventDefault(); setView(tab.getAttribute('data-tab'), { keepPos: true }); return; }
      var chip = t.closest('.ddhd__chip, .ddhd__g-all');
      if (chip) { var r = chip.getAttribute('data-route'); applyRoute(r === 'all' ? null : +r); return; }
      if (t.closest('.ddhd__x')) { closePanel(true); return; }
      var jump = t.closest('.ddhd__jump');
      if (jump) { var c = qs(root, '#ddhd-m-' + jump.getAttribute('data-jump')); if (c) openPanel(c, { focus: true }); return; }
      var prod = t.closest('a[data-ddhd-product]');
      if (prod) { fire('product', { id: prod.getAttribute('data-ddhd-product'), from: prod.closest('.ddhd__panel') ? 'preview' : prod.closest('.ddhd__guide') ? 'guide' : 'card' }); return; }
      var coll = t.closest('a[data-ddhd-collection]');
      if (coll) { fire('collection', { view: coll.getAttribute('data-ddhd-collection') }); return; }
      var card = t.closest('.ddhd__card');
      if (card && !t.closest('a')) openPanel(card, { focus: e.detail === 0 });  // detail 0 = keyboard activation: move into the preview
    }, sig);
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openCard) { e.stopPropagation(); closePanel(true); return; }
      var tab = e.target.closest && e.target.closest('.ddhd__tab');
      if (!tab) return;
      var i = tabs.indexOf(tab), n = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + tabs.length - 1) % tabs.length;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
      else if (e.key === ' ') { e.preventDefault(); setView(tab.getAttribute('data-tab'), { keepPos: true }); return; }
      if (n > -1) { e.preventDefault(); setView(tabs[n].getAttribute('data-tab'), { focus: true, keepPos: true }); }
    }, sig);
    // any pointer-down that is not on a card or inside the preview closes it (the section is full width, so "outside" is not "outside the element")
    d.addEventListener('pointerdown', function (e) { if (openCard && !(e.target.closest && e.target.closest('.ddhd__card, .ddhd__pli'))) closePanel(false); }, sig);
    function relayout() { if (raf) return; raf = w.requestAnimationFrame(function () { raf = 0; place(); }); }
    if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(relayout); ro.observe(qs(root, '.ddhd__in')); }
    else w.addEventListener('resize', relayout, sig);
    w.addEventListener('orientationchange', relayout, sig);

    /* deep links: #ddhd-mattress, #ddhd-topper, #ddhd-m-<model id> (e.g. from a Hero button later) */
    function fromHash(scroll) {
      var h = w.location.hash, m = /^#ddhd-(mattress|topper)$/.exec(h);
      if (m) { setView(m[1], { silent: true }); if (scroll) root.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
      m = /^#ddhd-m-([a-z_]+)$/.exec(h);
      if (m && NAMES[m[1]]) { setView(NAMES[m[1]].v, { silent: true }); var c = qs(root, '#ddhd-m-' + m[1]); if (c) openPanel(c, {}); }
    }
    w.addEventListener('hashchange', function () { fromHash(true); }, sig);

    setView('mattress', { silent: true }); applyRoute(null); fromHash(false);
    root.__ddhd = true; root.setAttribute('data-ddhd', VERSION);

    return {
      root: root,
      destroy: function () {
        closePanel(false); if (ac) ac.abort(); if (ro) ro.disconnect(); if (raf) w.cancelAnimationFrame(raf);
        delete root.__ddhd; root.removeAttribute('data-ddhd');
      }
    };
  }

  // Idempotent: drops instances whose section Instant Site removed, initialises new ones.
  function scan() {
    insts = insts.filter(function (i) { if (!i.root.isConnected) { i.destroy(); return false; } return true; });
    qa(d, '.ddhd[data-ddhd-root]').forEach(function (r) { var i = init(r); if (i) insts.push(i); });
  }
  w.DDHD = { version: VERSION, scan: scan };

  // Instant Site loads/unloads sections with the viewport (same hook the Hero uses).
  var hooked = false;
  function hook() {
    var is = w.instantsite;
    if (hooked || !is || !is.onTileLoaded || !is.onTileUnloaded) return;
    hooked = true; is.onTileLoaded.add(scan); is.onTileUnloaded.add(scan);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { scan(); hook(); }, { once: true });
  else { scan(); hook(); }
  w.addEventListener('load', hook, { once: true });
})(window, document);
