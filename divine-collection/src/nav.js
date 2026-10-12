/* Divine DunlopDreams Collection — decision navigator (overlay).
   Turns the question of the Latex Mattresses Collection into an interactive entry point:
   - hover (mouse) previews the navigator, click / tap / Enter / Space opens it and keeps it open
   - Sizes and Firmness Regulation are two more views of the SAME dialog (never a modal on a modal); "Back to Mattress Guide" returns
   - the route text lives in the description as real text and links; this script only moves it into the overlay (nothing is duplicated)
   Vanilla JS. Loaded with ddc.js; called from ddc.js for every .ddc that carries a .ddc__nv block. Idempotent: one overlay at a time. */
(function () {
  'use strict';
  var D = __DDC_NAV_DATA__;
  // images of the firmness view sit next to this script (release/<v>/assets/): the base is read from the script's own address, so the file never carries a commit id
  var SELF = document.currentScript && document.currentScript.src ? document.currentScript.src.replace(/[^\/]*$/, '') + 'assets/' : D.own;
  var state = null;   // { root, ov, card, views, trigger[], open, pinned, view, last, timers }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var FN = { s: 'Soft', m: 'Medium', f: 'Firm', x: 'Extra Firm' };
  function canHover(e) { return e.pointerType !== 'touch' && !!window.matchMedia && matchMedia('(any-hover: hover)').matches; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ICON_RULER = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><rect x="2.5" y="8" width="19" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var ICON_FIRM = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><rect x="3" y="14.5" width="18" height="4.5" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="9.2" width="14" height="3.6" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v4M9.8 5.2 12 7.4l2.2-2.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_Q = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.3 9.6a2.8 2.8 0 1 1 4.2 2.4c-.9.6-1.5 1.1-1.5 2.1M12 16.9v.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';

  // ---------- the two views built from the shared data ----------
  function sizesView() {
    var S = D.sz, rows = S.sizes.map(function (s) {
      return '<li><span>' + esc(s.n) + '</span> <b>' + s.cm[0] + ' × ' + s.cm[1] + ' cm</b> <small>' + s.in[0] + '″ × ' + s.in[1] + '″</small></li>';
    }).join('');
    var contact = S.contactUrl ? '<a href="' + esc(S.contactUrl) + '">' + esc(S.contact) + '</a>' : '<b>' + esc(S.contact) + '</b>';
    return '<div class="ddc-ov__hdr"><div class="ddc-ov__top"><h3 class="ddc-ov__h">' + esc(S.title) + '</h3><p class="ddc-ov__s">' + esc(S.sub) + '</p><p class="ddc-ov__l">' + esc(S.lead) + '</p></div></div>' +
      '<div class="ddc-ov__main"><ul class="ddc-szl">' + rows + '<li class="ddc-szl__c"><span>' + esc(S.custom) + '</span>' + contact + '</li></ul>' +
      '<p class="ddc-szn">' + esc(S.foot) + '</p><p class="ddc-szn ddc-szn--s">' + esc(S.note) + '</p></div>';
  }
  function squares(on) {
    return '<span class="ddc-fsq" aria-hidden="true">' + 'smfx'.split('').map(function (k) { return '<i class="ddc-fsq__c ddc-fsq__c--' + k + (on.indexOf(k) > -1 ? ' is-on' : '') + '"></i>'; }).join('') + '</span>';
  }
  function soloList(list) {
    return '<ul class="ddc-fml">' + list.map(function (m) {
      return '<li><a class="ddc-fml__n" href="' + esc(m.u) + '">' + esc(m.n) + '</a> ' + squares(m.on) + ' <span class="ddc__sr">' + m.on.split('').map(function (k) { return FN[k]; }).join(', ') + '</span></li>';
    }).join('') + '</ul>';
  }
  function chip(k) { return '<i class="ddc__f ddc__f--' + k + '">' + FN[k] + '</i>'; }
  function firmnessView() {
    var F = D.fm;
    var ranges = '<ol class="ddc-frg">' + F.ranges.map(function (r) { return '<li class="ddc-frg__' + r.k + '"><b>' + esc(r.n) + '</b> <span>' + esc(r.r) + '</span></li>'; }).join('') + '</ol>';
    var col1 = '<section class="ddc-fc"><h4 class="ddc-fc__h"><i>1</i><span>' + esc(F.solo.h) + '</span></h4><p class="ddc-fc__x">' + esc(F.solo.x) + '</p>' + ranges +
      '<h5 class="ddc-fc__k">' + esc(F.solo.mm) + '</h5>' + soloList(F.soloModels) + '<h5 class="ddc-fc__k">' + esc(F.solo.tt) + '</h5>' + soloList(F.topperModels) + '</section>';
    var combos = '<ol class="ddc-dpl">' + F.combos.map(function (c) {
      return '<li><img src="' + esc(SELF) + 'dual-plush-' + c[0] + '-' + c[1] + '.svg" width="150" height="61" alt="" loading="lazy" decoding="async"><span class="ddc-dpl__r"><b>' + esc(F.dp.topper) + '</b>' + chip(c[0]) + '</span><span class="ddc-dpl__r"><b>' + esc(F.dp.mattress) + '</b>' + chip(c[1]) + '</span></li>';
    }).join('') + '</ol>';
    var col2;
    var dpList = '<ul class="ddc-fml ddc-fml--l">' + F.dpModels.map(function (m) { return '<li><a class="ddc-fml__n" href="' + esc(m.u) + '">' + esc(m.n) + '</a></li>'; }).join('') + '</ul>';
    col2 = '<section class="ddc-fc"><h4 class="ddc-fc__h"><i>2</i><span>' + esc(F.dp.h) + '</span></h4><p class="ddc-fc__x">' + esc(F.dp.x) + '</p><ul class="ddc-fpt">' + F.dp.points.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' + combos + '<h5 class="ddc-fc__k">' + esc(F.dp.models) + '</h5>' + dpList + '</section>';
    var col3 = '<section class="ddc-fc"><h4 class="ddc-fc__h"><i>3</i><span>' + esc(F.partners.h) + '</span></h4><p class="ddc-fc__x">' + esc(F.partners.x) + '</p>' +
      '<div class="ddc-fsd" aria-hidden="true"><span class="ddc-fsd__s ddc-fsd__s--m"><small>' + esc(F.partners.one) + '</small> <b>Medium</b></span> <span class="ddc-fsd__s ddc-fsd__s--f"><small>' + esc(F.partners.other) + '</small> <b>Firm</b></span></div>' +
      '<span class="ddc__sr">' + esc(F.partners.one) + ': Medium. ' + esc(F.partners.other) + ': Firm.</span>' +
      '<ul class="ddc-fml ddc-fml--l">' + F.partnerModels.map(function (m) { return '<li><a class="ddc-fml__n" href="' + esc(m.u) + '">' + esc(m.n) + '</a></li>'; }).join('') + '</ul></section>';
    return '<div class="ddc-ov__hdr"><div class="ddc-ov__top"><h3 class="ddc-ov__h">' + esc(F.title) + '</h3><p class="ddc-ov__s">' + esc(F.sub) + '</p><p class="ddc-ov__l">' + esc(F.lead) + '</p></div></div>' +
      '<div class="ddc-ov__main"><div class="ddc-fcs">' + col1 + col2 + col3 + '</div><p class="ddc-fok">' + esc(F.ok) + '</p><p class="ddc-szn ddc-szn--s">' + esc(F.note) + '</p></div>';
  }
  // adjacent elements get a real space between them, so text read by copy, screen readers or crawlers never runs together ("SoftUp to 48 kg")
  function spaceOut(root) {
    var all = root.querySelectorAll('*'), i, n;
    for (i = 0; i < all.length; i++) {
      n = all[i].nextSibling;
      if (n && n.nodeType === 1 && all[i].tagName !== 'BR') all[i].parentNode.insertBefore(document.createTextNode(' '), n);
    }
  }

  // ---------- focus, scroll lock ----------
  var lockSaved = null;
  function lock(on) {
    var h = document.documentElement, b = document.body;
    if (on && !lockSaved) { lockSaved = { h: h.style.overflow, b: b.style.overflow }; h.style.overflow = 'hidden'; b.style.overflow = 'hidden'; }
    else if (!on && lockSaved) { h.style.overflow = lockSaved.h; b.style.overflow = lockSaved.b; lockSaved = null; }
  }
  function focusables(root) {
    return [].filter.call(root.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'), function (n) {
      return n.offsetParent !== null && !n.closest('.ddc-ov__view:not(.is-on)') && getComputedStyle(n).visibility !== 'hidden';
    });
  }

  // ---------- open / close ----------
  function setExpanded(v) { state.trigger.forEach(function (t) { t.setAttribute('aria-expanded', v ? 'true' : 'false'); }); }
  function showView(name) {
    state.view = name;
    Object.keys(state.views).forEach(function (k) { state.views[k].classList.toggle('is-on', k === name); });
    state.card.scrollTop = 0;
    state.card.setAttribute('aria-labelledby', state.ids[name]);
    state.ov.setAttribute('data-view', name);
    state.back.hidden = name === 'guide';
  }
  function open(mode, view, from) {
    var s = state; if (!s) return;
    clearTimeout(s.tIn); clearTimeout(s.tOut);
    if (from) s.last = from;
    showView(view || s.view || 'guide');
    if (!s.open) {
      s.ov.classList.add('is-open');
      s.open = true; setExpanded(true);
      if (!reduce) { s.card.classList.remove('is-in'); void s.card.offsetWidth; s.card.classList.add('is-in'); }
    }
    if (mode === 'pin') pin(true);
  }
  function pin(focus) {
    var s = state; if (!s || !s.open) return;
    if (!s.pinned) { s.pinned = true; s.ov.classList.add('is-pinned'); lock(true); }
    if (focus !== false) { try { s.card.focus({ preventScroll: true }); } catch (e) { s.card.focus(); } }
  }
  function close(restore) {
    var s = state; if (!s || !s.open) return;
    clearTimeout(s.tIn); clearTimeout(s.tOut);
    var wasPinned = s.pinned;
    s.open = false; s.pinned = false;
    s.ov.classList.remove('is-open', 'is-pinned'); s.card.classList.remove('is-in');
    lock(false); setExpanded(false);
    if (restore !== false && (wasPinned || restore === true) && s.last && document.body.contains(s.last)) { try { s.last.focus({ preventScroll: true }); } catch (e) { s.last.focus(); } }
  }
  function peekClose() { var s = state; if (s && s.open && !s.pinned) close(false); }

  // ---------- mount ----------
  function destroy() {
    if (!state) return;
    var s = state; state = null;
    clearTimeout(s.tIn); clearTimeout(s.tOut);
    lock(false);
    document.removeEventListener('keydown', s.onKey, true);
    if (s.ov.parentNode) s.ov.parentNode.removeChild(s.ov);
  }
  function mount(root) {
    var nv = root.querySelector('.ddc__nv'), q = root.querySelector('.ddc__q'), hd = root.querySelector('.ddc__hd');
    if (!nv || !q || !hd) return;
    destroy();
    var uid = 'ddcnv' + Math.floor(Math.random() * 1e6);
    var ov = el('div', 'ddc ddc-ov'), bd = el('div', 'ddc-ov__bd');
    var card = el('section', 'ddc-ov__card');
    card.id = uid; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.tabIndex = -1;
    var bar = el('div', 'ddc-ov__sticky');
    var back = el('button', 'ddc-ov__back', '<span class="ddc-ov__ba" aria-hidden="true"></span> Back to Mattress Guide'); back.type = 'button'; back.hidden = true;
    var x = el('button', 'ddc-ov__x', '<i aria-hidden="true"></i>'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
    bar.appendChild(back); bar.appendChild(x);
    var vGuide = el('div', 'ddc-ov__view ddc-ov__view--guide is-on'), vSizes = el('div', 'ddc-ov__view ddc-ov__view--sizes', sizesView()), vFirm = el('div', 'ddc-ov__view ddc-ov__view--firmness', firmnessView());
    // the guide view: the route block from the description (visible there without JavaScript) is MOVED here: one copy, never duplicated
    var title = nv.querySelector('.ddc__nv-t'); if (title) title.id = uid + '-g';
    vSizes.querySelector('.ddc-ov__h').id = uid + '-s'; vFirm.querySelector('.ddc-ov__h').id = uid + '-f';
    var rs = nv.querySelector('.ddc__rs');
    var tiles = el('div', 'ddc-rst');
    function tile(cls, icon, t, sub, view) {
      var b = el('button', 'ddc-rst__b ' + cls, '<span class="ddc-rst__i">' + icon + '</span><span class="ddc-rst__t"><b>' + esc(t) + '</b> <span>' + esc(sub) + '</span></span><span class="ddc-rst__a" aria-hidden="true"></span>');
      b.type = 'button'; b.setAttribute('data-view', view); return b;
    }
    var bS = tile('ddc-rst__b--s', ICON_RULER, D.reassure.sizes.title, D.reassure.sizes.sub, 'sizes');
    var bF = tile('ddc-rst__b--f', ICON_FIRM, D.reassure.firmness.title, D.reassure.firmness.sub, 'firmness');
    tiles.appendChild(bS); tiles.appendChild(bF); if (rs) rs.appendChild(tiles);
    vGuide.appendChild(nv);
    card.appendChild(bar); card.appendChild(vGuide); card.appendChild(vSizes); card.appendChild(vFirm);
    ov.appendChild(bd); ov.appendChild(card);
    spaceOut(card);
    document.body.appendChild(ov);

    // the trigger: the question itself becomes a button; two small tools sit beside the steps
    var qt = q.textContent.trim() || D.q; q.textContent = '';
    var qb = el('button', 'ddc__qb', '<span class="ddc__qb-t">' + esc(qt) + '</span><span class="ddc__qb-h"><span class="ddc__qb-d" aria-hidden="true"></span><span class="ddc__qb-i" aria-hidden="true">' + ICON_Q + '</span> ' + esc(D.hint) + '</span>');
    qb.type = 'button'; qb.setAttribute('aria-haspopup', 'dialog'); qb.setAttribute('aria-expanded', 'false'); qb.setAttribute('aria-controls', uid);
    q.appendChild(qb);
    var tools = el('div', 'ddc__tools');
    function tool(icon, label, view) {
      var b = el('button', 'ddc__tb', '<span class="ddc__tb-i">' + icon + '</span> <span class="ddc__tb-t">' + esc(label) + '</span>');
      b.type = 'button'; b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', uid); b.setAttribute('data-view', view); return b;
    }
    var tS = tool(ICON_RULER, D.reassure.sizes.title, 'sizes'), tF = tool(ICON_FIRM, D.reassure.firmness.title, 'firmness');
    tools.appendChild(tS); tools.appendChild(tF); hd.appendChild(tools);
    spaceOut(q); spaceOut(tools);
    root.classList.add('ddc--nav');

    var s = state = { root: root, ov: ov, card: card, back: back, views: { guide: vGuide, sizes: vSizes, firmness: vFirm }, ids: { guide: uid + '-g', sizes: uid + '-s', firmness: uid + '-f' },
      trigger: [qb, tS, tF], open: false, pinned: false, view: 'guide', last: null, tIn: 0, tOut: 0 };
    card.setAttribute('aria-labelledby', s.ids.guide);

    // triggers: mouse hover previews (with a short intent delay), click / tap / Enter / Space pins
    [[qb, 'guide'], [tS, 'sizes'], [tF, 'firmness']].forEach(function (p) {
      var b = p[0], view = p[1];
      b.addEventListener('pointerenter', function (e) {
        if (!canHover(e) || s.pinned) return;
        clearTimeout(s.tOut); clearTimeout(s.tIn);
        s.tIn = setTimeout(function () { open('peek', view, b); }, 160);
      });
      b.addEventListener('pointerleave', function (e) {
        if (!canHover(e)) return;
        clearTimeout(s.tIn); clearTimeout(s.tOut);
        s.tOut = setTimeout(peekClose, 380);
      });
      b.addEventListener('click', function () {
        if (s.open && s.pinned && s.view === view && (s.last === b)) { close(true); return; }
        open('pin', view, b);
      });
    });
    // the card: moving from a trigger onto it keeps it open; a click inside pins it
    card.addEventListener('pointerenter', function (e) { if (canHover(e)) { clearTimeout(s.tOut); clearTimeout(s.tIn); } });
    card.addEventListener('pointerleave', function (e) { if (canHover(e) && s.open && !s.pinned) { clearTimeout(s.tOut); s.tOut = setTimeout(peekClose, 380); } });
    card.addEventListener('pointerdown', function () { if (s.open && !s.pinned) pin(false); }, true);
    x.addEventListener('click', function () { close(true); });
    bd.addEventListener('click', function () { if (s.pinned) close(true); });
    ov.addEventListener('click', function (e) {
      var back = e.target.closest && e.target.closest('.ddc-ov__back');
      if (back) { showView('guide'); try { s.card.focus({ preventScroll: true }); } catch (er) { /* ignore */ } return; }
      var t = e.target.closest && e.target.closest('.ddc-rst__b'); if (t) { clearTimeout(s.tIn); showView(t.getAttribute('data-view')); try { s.card.focus({ preventScroll: true }); } catch (er2) { /* ignore */ } }
    });
    // the two reassurance tiles also answer to a calm hover (switch the content of the same dialog, never open a second one)
    [bS, bF].forEach(function (b) {
      b.addEventListener('pointerenter', function (e) { if (!canHover(e)) return; clearTimeout(s.tIn); s.tIn = setTimeout(function () { showView(b.getAttribute('data-view')); }, 420); });
      b.addEventListener('pointerleave', function () { clearTimeout(s.tIn); });
    });
    s.onKey = function (e) {
      if (!s.open) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
      if (e.key !== 'Tab' || !s.pinned) return;
      var f = focusables(card); if (!f.length) { e.preventDefault(); card.focus(); return; }
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || a === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      else if (!card.contains(a)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', s.onKey, true);
  }
  function gc() { if (state && !document.body.contains(state.root)) destroy(); }

  window.DDCNav = { mount: mount, gc: gc, open: function (v) { if (state) open('pin', v || 'guide', state.trigger[0]); }, close: function () { close(true); }, state: function () { return state; } };
})();
