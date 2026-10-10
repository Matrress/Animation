/*! Divine DunlopDreams Hero 1.17.1 | vanilla, no dependencies | window.DDHero = {init, destroy, boot, version} */
(function (w, d) {
  'use strict';
  if (w.DDHero && w.DDHero.boot) { w.DDHero.boot(); return; } // script re-executed by a section re-render

  var VERSION = '1.17.1';
  var TRANSLATED = /(^|\s)translated-(ltr|rtl)(\s|$)/;
  // Proximity radii (fraction of artwork width) and the back-zone rectangle — unchanged from v26.
  var R = { shoulder: .075, back: .06, zones: .085, head: .085, system: .09, firmness: .062, temperature: .062, sizes: .055, weight: .06, night: .07, bio: .055 };
  // 1.8.0: 'immersive' states take over the whole scene; while one is open only its own point is live
  function immersive(k, w) { return k === 'night' || (k === 'system' && w.innerWidth > 700); }
  var NIGHT = 'night'; // 1.7.0: night mode (pointer screens >=1051px); 1.7.1: hover in/out like every other point
  // 1.5.0: hotspot copy in the visitor's language (page lang first, then browser preference; English stays in the HTML).
  var LANGS = ['de', 'sv', 'fr', 'es', 'pt', 'el', 'fi', 'it'];
  var BACK = { l: .008, r: .465, t: .4468, b: .6864 };
  var instances = [];

  function find(root) {
    for (var i = 0; i < instances.length; i++) if (instances[i].root === root) return instances[i];
    return null;
  }

  function init(root) {
    if (!root || find(root)) return;
    var ac = w.AbortController ? new AbortController() : null;
    var signal = ac ? ac.signal : undefined;
    var cleanups = [];
    var inst = { root: root, destroy: destroy };
    instances.push(inst);
    root.setAttribute('data-ddh-ready', '1');

    function on(target, type, fn, opts) {
      var o = opts || {};
      if (signal) { o.signal = signal; target.addEventListener(type, fn, o); }
      else { target.addEventListener(type, fn, o); cleanups.push(function () { target.removeEventListener(type, fn, o); }); }
    }

    // Google Translate & co.: show the HTML benefit list over the artwork when the page language changes.
    var html = d.documentElement, baseLang = (html.getAttribute('lang') || 'en').toLowerCase();
    function translation() {
      var lang = (html.getAttribute('lang') || '').toLowerCase();
      var isOn = TRANSLATED.test(html.className) || (lang && lang.slice(0, 2) !== baseLang.slice(0, 2));
      root.classList.toggle('ddh--translated', !!isOn);
    }
    translation();
    if (w.MutationObserver) {
      var mo = new MutationObserver(translation);
      mo.observe(html, { attributes: true, attributeFilter: ['class', 'lang'] });
      cleanups.push(function () { mo.disconnect(); });
    }

    // Opt-in breakout: expose the classic-scrollbar width so calc(100vw - sbw) is exactly the page width.
    if (root.classList.contains('ddh--breakout')) {
      var sbw = function () { root.style.setProperty('--ddh-sbw', Math.max(0, w.innerWidth - html.clientWidth) + 'px'); };
      sbw(); on(w, 'resize', sbw, { passive: true });
      cleanups.push(function () { root.style.removeProperty('--ddh-sbw'); });
    }

    // 1.1.0 Header-aware layout. The Instant Site header is transparent and lies over the first section, so measure
    //  --ddh-top : distance from the page top to the hero (announcement bar)  → hero height = screen − top
    //  --ddh-safe: how far the overlaying header reaches into the hero        → lockup, logo and hotspots go below it
    // Found two ways: known header containers, then hit-testing what actually sits on top of the hero.
    var HEADER_SEL = '.ins-tile--header, header, [role="banner"]';
    var mRaf = 0, pendingTop = false;
    function covering(el) { return el && el !== d.body && el !== html && !root.contains(el) && !el.contains(root); }
    // 1.6.0: lines marked [data-ddh-spread] (certification block, "Dual Plush") are tracked out to exactly the width
    // of their box, so they form a clean block edge to edge. letter-spacing also follows the last glyph: margin cancels it.
    function spread() {
      [].forEach.call(root.querySelectorAll('[data-ddh-spread]'), function (el) {
        el.style.letterSpacing = '0px'; el.style.marginRight = '0px';
        var W = el.parentNode.clientWidth, w0 = el.offsetWidth, n = el.textContent.length;
        if (!W || !w0 || n < 2) return;
        var ls = Math.max(0, (W - w0) / (n - 1));
        el.style.letterSpacing = ls.toFixed(2) + 'px'; el.style.marginRight = -ls.toFixed(2) + 'px';
      });
    }
    cleanups.push(function () { [].forEach.call(root.querySelectorAll('[data-ddh-spread]'), function (el) { el.style.letterSpacing = ''; el.style.marginRight = ''; }); });
    function layoutNow() {
      mRaf = 0;
      var r = root.getBoundingClientRect(), vh = w.innerHeight, vw = html.clientWidth || w.innerWidth;
      if (!r.width || !vh) return;
      spread();
      var sy = w.pageYOffset || html.scrollTop || 0, docTop = r.top + sy;
      root.style.setProperty('--ddh-top', (docTop < vh * .4 ? Math.max(0, Math.round(docTop)) : 0) + 'px');
      if (sy > 2) { pendingTop = true; return; }            // only measure the overlap with the page at rest at the top
      pendingTop = false;
      // only the top part of the hero itself is scanned: anything below the hero (the next section) is not a header
      var safe = 0, limit = Math.min(vh * .45, 420, r.height * .6), i, c, edgeR = 0;
      var cands = d.querySelectorAll(HEADER_SEL);
      for (i = 0; i < cands.length; i++) {
        if (!covering(cands[i])) continue;
        c = cands[i].getBoundingClientRect();
        if (c.height > 4 && c.width > vw * .5 && c.top < r.top + limit && c.bottom > r.top && c.bottom - r.top < limit) {
          safe = Math.max(safe, c.bottom - r.top);
          // right edge of the header's own content (icons / bag), so our lockup and CTAs line up under it
          var items = cands[i].querySelectorAll('a,button,svg,img,input,[role="button"],[class*="icon"]');
          for (var k = 0; k < items.length; k++) { var q = items[k].getBoundingClientRect(); if (q.width && q.height && q.right <= vw + 1) edgeR = Math.max(edgeR, q.right); }
        }
      }
      if (edgeR > vw * .6) root.style.setProperty('--ddh-edge-r', Math.round(Math.min(Math.max(vw - edgeR, 12), vw * .12)) + 'px');
      else root.style.removeProperty('--ddh-edge-r');
      if (d.elementFromPoint) {
        var xs = [.1, .3, .5, .7, .9];
        for (i = 0; i < xs.length; i++) {
          var miss = 0, seen = false;
          for (var y = Math.max(0, r.top) + 1; y < r.top + limit && y < vh; y += 6) {
            if (covering(d.elementFromPoint(vw * xs[i], y))) { seen = true; miss = 0; safe = Math.max(safe, y + 6 - r.top); }
            else if (seen && (miss += 6) > 60) break;
          }
        }
      }
      root.style.setProperty('--ddh-safe', Math.round(safe) + 'px');
      spread(); // the lockup width follows --ddh-edge-r, just set
      // 1.7.2: the night moon sits on the site logo's meridian. The plate puts the moon at 50% of the picture; if the
      // header logo is measured off-centre (scrollbar, asymmetric header), shift the night image by the difference.
      var night = root.querySelector('.ddh__night-img'), lg = null;
      if (night) {
        var hdr = d.querySelector('.ins-tile--header, header, [role="banner"]'), plr = root.querySelector('.ddh__plane').getBoundingClientRect();
        if (hdr && covering(hdr)) {
          var cand = hdr.querySelectorAll('[class*="logo"], img, svg'), best = 1e9;
          for (var j = 0; j < cand.length; j++) { var q = cand[j].getBoundingClientRect(), cx = q.left + q.width / 2;
            if (q.width > 8 && q.width < 320 && Math.abs(cx - vw / 2) < vw * .12 && Math.abs(cx - vw / 2) < best) { best = Math.abs(cx - vw / 2); lg = cx; } }
        }
        var dx = lg == null ? 0 : Math.max(-plr.width * .03, Math.min(plr.width * .03, lg - (plr.left + plr.width / 2)));
        root.style.setProperty('--ddh-moon-dx', dx.toFixed(1) + 'px');
        root.style.setProperty('--ddh-moon-s', (1 + 2 * Math.abs(dx) / (plr.width || 1)).toFixed(4));
      }
      // 1.6.0: top of the copy window (picture px): 20% of the picture, but never under the header or the LATEX lockup
      var pl = root.querySelector('.ddh__plane'), lk = root.querySelector('.ddh__sky-lockup');
      if (pl) {
        var pr = pl.getBoundingClientRect(), wy = pr.top + pr.height * .2;
        wy = Math.max(wy, r.top + safe + 8);
        // where the lockup sits above the window (tablets, phones) it steps aside while a text is open, like the logo
        var yieldLk = false;
        if (lk) { var lr = lk.getBoundingClientRect(); yieldLk = !!lr.height && lr.left < pr.left + pr.width * .725 && lr.right > pr.left + pr.width * .44 && lr.bottom + 10 > wy; }
        root.toggleAttribute('data-ddh-lockup-yield', yieldLk);
        root.style.setProperty('--ddh-win-top', Math.round(wy - pr.top) + 'px');
      }
      root.setAttribute('data-ddh-measured', '1');
    }
    var mAt = 0;
    function layout() {
      if (mRaf && Date.now() - mAt > 250) { w.cancelAnimationFrame(mRaf); mRaf = 0; }   // a frame lost to sleep never blocks layout
      if (!mRaf) { mAt = Date.now(); mRaf = w.requestAnimationFrame(layoutNow); }
    }
    inst.layout = layout;
    layout();
    on(w, 'resize', layout, { passive: true });
    on(w, 'orientationchange', layout, { passive: true });
    if (d.readyState !== 'complete') on(w, 'load', layout, { once: true });
    on(w, 'scroll', function () { if (pendingTop && (w.pageYOffset || 0) <= 2) layout(); }, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { if (inst.layout) layout(); });
    [500, 1500, 4000].forEach(function (t) { var id = setTimeout(layout, t); cleanups.push(function () { clearTimeout(id); }); });
    cleanups.push(function () {
      if (mRaf) w.cancelAnimationFrame(mRaf);
      inst.layout = null;
      root.style.removeProperty('--ddh-top'); root.style.removeProperty('--ddh-safe'); root.style.removeProperty('--ddh-win-top'); root.style.removeProperty('--ddh-moon-dx'); root.style.removeProperty('--ddh-moon-s'); root.removeAttribute('data-ddh-lockup-yield'); root.removeAttribute('data-ddh-warm'); root.style.removeProperty('--ddh-edge-r'); root.removeAttribute('data-ddh-measured');
    });

    // The pasted section ends with <i class="ddh__end">. If it is missing, the site builder cut the code short.
    if (!root.querySelector('.ddh__end') && w.console) w.console.warn('[DDHero] the hero section code looks truncated: paste the complete code (it must end with ddh__end).');

    var viewport = root.querySelector('.ddh__art'), art = root.querySelector('.ddh__plane'), group = root.querySelector('.ddh__points');
    if (root.getAttribute('data-ddh-mode') !== 'interactive' || !viewport || !art || !group) return inst;

    var points = [].slice.call(group.querySelectorAll('[data-ddh-point]'));
    var copies = [].slice.call(root.querySelectorAll('[data-ddh-copy]'));
    var screens = [].slice.call(root.querySelectorAll('.ddh__screen'));
    var lazyImgs = [].slice.call(root.querySelectorAll('.ddh__screen img, .ddh__mat img, .ddh__bed img'));
    var fine = w.matchMedia ? w.matchMedia('(hover:hover) and (pointer:fine)') : { matches: true };
    var nightMQ = w.matchMedia ? w.matchMedia('(min-width:1051px) and (any-hover:hover)') : { matches: false };
    var nightImg = root.querySelector('.ddh__night-img');
    var live = d.createElement('p');
    live.className = 'ddh__sr';
    live.setAttribute('aria-live', 'polite');
    root.appendChild(live);
    cleanups.push(function () { if (live.parentNode) live.parentNode.removeChild(live); });
    var active = null;
    // 1.15.0: a quiet invitation to explore the points (upper left, mirroring the LATEX lockup). It retires for the rest of the visit once three
    // different points have been opened; it never shows on an upright phone (no points there) and steps aside while any card, screen or selector is open.
    var hintEl = root.querySelector('.ddh__hint'), hintSeen = {}, hintN = 0, hintT = 0;
    function hintDone() { try { return w.sessionStorage.getItem('ddh-hint') === '1'; } catch (e) { return false; } }
    function hintNote(key) {
      if (!hintEl || !key || hintSeen[key]) return; hintSeen[key] = 1;
      if (++hintN >= 3) { hintEl.setAttribute('data-gone', ''); try { w.sessionStorage.setItem('ddh-hint', '1'); } catch (e) { /* private mode: the invitation simply returns on the next page */ } }
    }
    if (hintEl && !hintDone()) {
      hintEl.hidden = false; hintT = w.setTimeout(function () { hintEl.setAttribute('data-on', ''); }, 60);
      cleanups.push(function () { w.clearTimeout(hintT); hintEl.hidden = true; hintEl.removeAttribute('data-on'); hintEl.removeAttribute('data-gone'); });
    }

    // Interaction graphics (~15 KB) load on first sign of intent, not with the page.
    var warmed = false;
    // 1.4.0: hotspots are hidden on an upright phone (CSS); nothing may open or download there.
    function pointsOff() { return !group.offsetWidth; }
    function warm() {
      if (warmed || pointsOff()) return; warmed = true;
      lazyImgs.forEach(function (img) { img.loading = 'eager'; });
      root.setAttribute('data-ddh-warm', '');                       // lets the mattress / night layers render (and load)
      if (nightImg && nightMQ.matches) nightImg.loading = 'eager';
    }


    function show(key, announce) {
      if (key && (pointsOff() || sheet)) key = null;
      if (key === active) { if (key && announce) live.textContent = txtOf(key); return; }
      active = key;
      if (key) { hintNote(key); warm(); root.setAttribute('data-ddh-state', key); root.setAttribute('data-ddh-screen', key === 'back' ? 'back' : key === NIGHT ? NIGHT : 'brand'); fit(key); placeCard(key); replaceSoon(key); }
      else { root.removeAttribute('data-ddh-state'); root.removeAttribute('data-ddh-screen'); }
      if (typeof unplace === 'function' && (!key || !cardOf(key))) unplace();
      var txt = '';
      copies.forEach(function (c) { var isOn = c.getAttribute('data-ddh-copy') === key; c.setAttribute('aria-hidden', String(!isOn)); if (isOn) txt = speak(c); });
      screens.forEach(function (s) { var isBack = s.classList.contains('ddh__screen--back'); s.setAttribute('aria-hidden', String(!key || (key === 'back' ? !isBack : isBack))); });
      points.forEach(function (p) { p.setAttribute('aria-expanded', String(p.getAttribute('data-ddh-point') === key)); });
      // Announce only for keyboard/tap/click activation — not for every mouse hover.
      if (announce || !key) live.textContent = key ? txt : '';
    }

    // Lines are separate elements with no whitespace between them: join them so "Title" + "Line" is not read as "TitleLine".
    function speak(c) { return [].map.call(c.querySelectorAll('strong,span'), function (el) { return el.textContent; }).filter(function (t, i, a) { return a.indexOf(t) === i; }).join('. ').replace(/\s+/g, ' ').trim(); }

    function txtOf(key) {
      for (var i = 0; i < copies.length; i++) if (copies[i].getAttribute('data-ddh-copy') === key) return speak(copies[i]);
      return '';
    }

    // Hotspot centres as fractions of the artwork. Recomputed only when layout changes (ResizeObserver),
    // so pointermove does a single rect read instead of eight.
    var centres = null, measuredAt = 0;
    function measure() {
      var b = art.getBoundingClientRect(); measuredAt = Date.now();
      if (!b.width || !b.height) { centres = null; return; }
      centres = points.filter(function (p) { return p.offsetWidth > 0; }).map(function (p) { // hidden points (night on touch) never hit
        var r = p.getBoundingClientRect();
        return { key: p.getAttribute('data-ddh-point'), el: p, x: (r.left + r.width / 2 - b.left) / b.width, y: (r.top + r.height / 2 - b.top) / b.height };
      });
    }
    function invalidate() { centres = null; }
    if (w.ResizeObserver) {
      var ro = new ResizeObserver(invalidate);
      ro.observe(art);
      cleanups.push(function () { ro.disconnect(); });
    } else on(w, 'resize', invalidate, { passive: true });

    function hit(cx, cy, scale) {
      if (!centres || !centres.length || Date.now() - measuredAt > 1000) measure();
      if (!centres) return null;
      var b = art.getBoundingClientRect(), x = (cx - b.left) / b.width, y = (cy - b.top) / b.height;
      if (x < -.02 || x > 1.02 || y < -.02 || y > 1.02) return null;
      var ratio = b.height / b.width, best = null, bd = Infinity, e = scale > 1 ? .02 : 0;
      centres.forEach(function (p) {
        p.under = p.el.hasAttribute('data-ddh-under');
        if (active && immersive(active, w) && p.key !== active) return; // immersive: only its own point is live
        if (p.under) return;                                           // 1.14.0: under the open card
        var dd = Math.hypot(x - p.x, (y - p.y) * ratio), r = R[p.key] * scale;
        if (active === p.key) r += immersive(p.key, w) ? .05 : .02; // immersive states hold a little wider
        if (dd < r && dd < bd) { best = p.key; bd = dd; }
      });
      var inBack = x >= BACK.l - e && x <= BACK.r + e && y >= BACK.t - e && y <= BACK.b + e;
      if (inBack && (!best || bd > R[best] * .55 * scale)) return 'back';
      return best;
    }

    // Pointer proximity: coalesced to one hit-test per frame. 1.9.1: a frame the browser never delivers (the display
    // slept, the tab was frozen) can no longer leave the points dead: a pending frame older than 120 ms is dropped and
    // the hit-test runs at once; waking the page resets everything (see below).
    var raf = 0, rafAt = 0, lastX = 0, lastY = 0;
    function now() { return w.performance && performance.now ? performance.now() : Date.now(); }
    function frame() {
      raf = 0; var k = hit(lastX, lastY, 1);
      // 1.11.1: while the Dual Plush card is up, leaving the lifted mattress does not drop it at once: the pointer gets a
      // moment to travel across to the card (on the card it stays; anywhere else it closes as before)
      var oc = cardOf(active);
      if (oc && k !== active && inBox(oc, lastX, lastY)) { if (dpcT) { w.clearTimeout(dpcT); dpcT = 0; } return; }   // reading the card (perhaps over a point it covers)
      if (oc && k !== active && toward(oc, lastX, lastY)) { if (!dpcT) { var was = active; dpcT = w.setTimeout(function () { dpcT = 0; if (!overDpc && active === was) show(hit(lastX, lastY, 1)); }, 500); } return; }
      if (dpcT) { w.clearTimeout(dpcT); dpcT = 0; }
      show(k);
    }
    on(art, 'pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      lastX = ev.clientX; lastY = ev.clientY;
      if (raf && now() - rafAt > 120) { w.cancelAnimationFrame(raf); frame(); return; }
      if (!raf) { rafAt = now(); raf = w.requestAnimationFrame(frame); }
    }, { passive: true });
    function unstick() {
      if (raf) { w.cancelAnimationFrame(raf); raf = 0; }
      if (mRaf) { w.cancelAnimationFrame(mRaf); mRaf = 0; }
      invalidate(); layout();
    }
    function wake() { unstick(); if (active && !group.contains(d.activeElement)) show(null); }
    on(d, 'visibilitychange', function () { if (!d.hidden) wake(); });
    on(w, 'pageshow', function (ev) { if (ev.persisted) wake(); else unstick(); });
    on(d, 'resume', wake);
    on(w, 'focus', unstick);
    cleanups.push(function () { if (raf) w.cancelAnimationFrame(raf); });
    on(art, 'pointerleave', function (ev) {
      if (ev.pointerType === 'touch' || group.contains(d.activeElement)) return;
      if (inCards(ev.relatedTarget)) return;   // onto the open card (1.11.1 Dual Plush, 1.14.0 context cards)
      if (raf) { w.cancelAnimationFrame(raf); raf = 0; }
      show(null);
    }, { passive: true });

    // Intent → fetch interaction graphics.
    // (pointermove, not pointerover: browsers fire a synthetic pointerover when content lays out under a resting cursor.)
    on(viewport, 'pointermove', warm, { passive: true, once: true });
    on(viewport, 'pointerdown', warm, { passive: true, once: true });
    on(viewport, 'touchstart', warm, { passive: true, once: true });
    on(group, 'focusin', warm, { once: true });

    on(art, 'click', function (ev) {
      var btn = ev.target.closest && ev.target.closest('[data-ddh-point]');
      var precise = ev.pointerType === 'mouse' || ev.pointerType === 'pen' || (!ev.pointerType && fine.matches);
      var key = btn ? btn.getAttribute('data-ddh-point') : hit(ev.clientX, ev.clientY, precise ? 1 : 1.7);
      if (key === 'bio') { openSheet('bio', 'modal', btn || bioPoint); return; }       // 1.10.0: Bio Comfort opens its screen
      if (ev.detail === 0) { if (key) show(key, true); return; } // keyboard activation
      if (!precise && key && key === active) key = null;           // second tap closes
      if (precise && !key) return;
      show(key, true);
    });
    points.forEach(function (p) {
      on(p, 'pointerenter', function (ev) { var k = p.getAttribute('data-ddh-point'); if (ev.pointerType !== 'touch' && !p.hasAttribute('data-ddh-under') && (!active || !immersive(active, w) || k === active)) show(k); }, { passive: true });   // 1.14.0: a point under the open card opens by click/tap, not by hover
    });
    on(d, 'click', function (ev) { if (active && !viewport.contains(ev.target) && !inCards(ev.target)) show(null); });
    on(d, 'keydown', function (ev) { if (active && (ev.key === 'Escape' || ev.key === 'Esc')) show(null); });
    on(w, 'resize', function () { if (active && pointsOff()) show(null); }, { passive: true }); // rotated to upright phone

    // Long words (German compounds, the nowrap firmness scale, the letter-spaced spine line): shrink a line until it
    // fits its box. Runs only when a state opens; English normally needs nothing.
    function fit(key) {
      copies.forEach(function (c) {
        if (c.getAttribute('data-ddh-copy') !== key) return;
        [].forEach.call(c.querySelectorAll('strong,span'), function (el) {
          el.style.fontSize = '';
          for (var n = 0; n < 6 && el.scrollWidth > el.clientWidth + 1; n++) el.style.fontSize = parseFloat(w.getComputedStyle(el).fontSize) * .92 + 'px';
        });
      });
    }

    // Translations: <base>i18n/<lang>.json, fetched after page load and only for the eight languages.
    function pickLang() {
      var q = /[?&]ddh-lang=([a-z]{2})/.exec(w.location.search || ''); if (q) return LANGS.indexOf(q[1]) > -1 ? q[1] : null;
      var page = (d.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase(); if (LANGS.indexOf(page) > -1) return page;
      var list = (w.navigator.languages && w.navigator.languages.length) ? w.navigator.languages : [w.navigator.language || ''];
      for (var i = 0; i < list.length; i++) { var l = String(list[i]).slice(0, 2).toLowerCase(); if (l === 'en') return null; if (LANGS.indexOf(l) > -1) return l; }
      return null;
    }
    function fill(el, line) {
      while (el.firstChild) el.removeChild(el.firstChild);
      if (Array.isArray(line)) { line.forEach(function (word, i) { if (i) el.appendChild(d.createTextNode(' · ')); var t = d.createElement('i'); t.className = 'ddh__w' + (i + 1); t.textContent = word; el.appendChild(t); }); return; }
      String(line).split('**').forEach(function (part, i) { if (!part) return; if (i % 2) { var b = d.createElement('b'); b.textContent = part; el.appendChild(b); } else el.appendChild(d.createTextNode(part)); });
    }
    function applyLang(dict, lang) {
      copies.forEach(function (c) {
        var lines = dict[c.getAttribute('data-ddh-copy')];
        var slots = [].filter.call(c.children, function (k) { return k.tagName === 'STRONG' || k.tagName === 'SPAN'; });
        if (!Array.isArray(lines) || lines.length !== slots.length) return;
        slots.forEach(function (sl, i) { fill(sl, lines[i]); });
        c.setAttribute('lang', lang);
      });
      [].forEach.call(root.querySelectorAll('[data-ddh-t]'), function (el) { var v = dict[el.getAttribute('data-ddh-t')]; if (typeof v === 'string') fill(el, v); });
      root.setAttribute('data-ddh-lang', lang);
      if (active) fit(active);
    }
    var lang = pickLang(), img = root.querySelector('.ddh__img');
    if (lang && img && w.fetch) {
      var url = (img.getAttribute('src') || '').replace(/assets\/[^\/]*$/, '') + 'i18n/' + lang + '.json';
      var load = function () {
        w.fetch(url, { signal: signal }).then(function (r) { if (!r.ok) throw r; return r.json(); })
          .then(function (dict) { if (root.hasAttribute('data-ddh-ready')) applyLang(dict, lang); })
          .catch(function () {}); // English stays
      };
      if (d.readyState === 'complete') load(); else on(w, 'load', load, { once: true });
    }

    // 1.10.0 Sheets: the Bio Comfort screen (from its point) and the collection previews (hovering the Shop buttons).
    // Their markup is one small HTML file per language next to hero.js (<base>sheets/<lang>.html), fetched once the page
    // has loaded (search engines render it too) or at the first sign of intent, whichever comes first. Desktop with a
    // pointer: the previews open on hover and stay while the pointer is on the button or the sheet; a click on the button
    // still goes to the collection. Touch / narrow screens: the first tap opens the sheet full screen (its own button
    // leads on); Escape, the close button or a click outside closes it.
    var sheetBox = null, sheetReq = false, sheet = null, sheetMode = '', sheetFrom = null, sheetWait = null, hoverT = 0, lastPT = '', openedAt = 0;
    var dpc = null, overDpc = false, dpcT = 0, hcs = null, cardDownAt = 0;   // 1.11.1 the Dual Plush card (revealed with the lifted mattress)
    var pvT = 0, sheetPT = '', backFocus = false, szBtn = root.querySelector('.ddh__sz'), szEl = null, szMode = '', szT = 0;   // 1.11.1 model previews, size guide
    var ctas = [].slice.call(root.querySelectorAll('[data-ddh-sheet]')), bioPoint = group.querySelector('[data-ddh-point=bio]');
    var deskMQ = w.matchMedia ? w.matchMedia('(min-width:1051px) and (any-hover:hover)') : { matches: true };
    // 1.10.1: tablets, laptops and monitors only. On a phone (either way up) the screens never open: the Bio point is
    // hidden (CSS, same query) and the Shop buttons go straight to the collections. The screens' text is still loaded
    // into the page there (hidden), so Google's smartphone crawler indexes it; their pictures are not.
    var phoneMQ = w.matchMedia ? w.matchMedia('(max-width:700px),(max-height:500px) and (pointer:coarse)') : { matches: false };
    function base() { return (img && img.getAttribute('src') || '').replace(/assets\/[^\/]*$/, ''); }
    function loadSheets() {
      if (sheetReq || !w.fetch || !img) return; sheetReq = true;
      w.fetch(base() + 'sheets/' + (lang || 'en') + '.html', { signal: signal }).then(function (r) { if (!r.ok) throw r; return r.text(); })
        .then(function (html) {
          if (!root.hasAttribute('data-ddh-ready')) return;
          var t = d.createElement('template'); t.innerHTML = html.replace(/\{\{BASE\}\}/g, base());
          sheetBox = t.content.firstElementChild; if (!sheetBox) return;
          root.appendChild(sheetBox);
          cleanups.push(function () { closeSheet(true); if (sheetBox && sheetBox.parentNode) sheetBox.parentNode.removeChild(sheetBox); sheetBox = null; });
          wireSheets();
      // 1.11.2: a picture that fails to load (a CDN hiccup, a dropped connection) is asked for again, twice, with a short pause;
      // if it still fails it is hidden quietly (the card keeps its soft background) instead of showing a broken-image icon
      on(sheetBox, 'error', function (ev) {
        var im = ev.target; if (!im || im.tagName !== 'IMG') return;
        var n = +im.getAttribute('data-ddh-r') || 0;
        if (n >= 2) { im.setAttribute('data-ddh-bad', ''); return; }
        im.setAttribute('data-ddh-r', String(n + 1));
        var u = (im.getAttribute('src') || '').replace(/[?&]ddhr=\d+$/, '');
        w.setTimeout(function () { if (sheetBox && sheetBox.contains(im)) im.src = u + (u.indexOf('?') > -1 ? '&' : '?') + 'ddhr=' + (n + 1); }, 700 * (n + 1));
      }, { capture: true });   // error events do not bubble: listen on the way down
          if (!phoneMQ.matches && !lean()) eager(sheetBox);              // the rest of the pictures, low priority, right after
          if (sheetWait) { var f = sheetWait; sheetWait = null; f(); }
        })
        .catch(function () { sheetReq = false; });
    }
    // Full screen (touch / narrow): the sheets move to a wrapper at the end of <body> (class "ddh", so the styles still
    // apply) — inside the section they would stay under the site header (the section is its own stacking context).
    var portal = null;
    function host(full) {
      if (!full) return root;
      if (!portal) { portal = d.createElement('div'); portal.className = 'ddh ddh__portal'; d.body.appendChild(portal); cleanups.push(function () { if (portal && portal.parentNode) portal.parentNode.removeChild(portal); portal = null; }); }
      return portal;
    }
    function eager(el) { [].forEach.call(el.querySelectorAll('img'), function (im) { if (im.loading !== 'eager' && !im.closest('[data-ddh-pv][hidden]')) { im.setAttribute('fetchpriority', 'low'); im.loading = 'eager'; } }); }
    function lock(on) { var s = d.documentElement.style; if (on) { if (!root.hasAttribute('data-ddh-lock')) { root.setAttribute('data-ddh-lock', s.overflow || ''); s.overflow = 'hidden'; } } else if (root.hasAttribute('data-ddh-lock')) { s.overflow = root.getAttribute('data-ddh-lock'); root.removeAttribute('data-ddh-lock'); } }
    function openSheet(name, mode, from, via) {
      if (phoneMQ.matches) return;
      if (!sheetBox) { sheetWait = function () { openSheet(name, mode, from, via); }; loadSheets(); return; }
      var el = sheetBox.querySelector('#ddh-sheet-' + name); if (!el) return;
      w.clearTimeout(hoverT);
      if (sheet === el) { if (mode === 'modal' && sheetMode !== 'modal') { sheetMode = 'modal'; el.focus({ preventScroll: true }); } return; }
      closeSheet(true); szClose(); show(null);
      if (via) root.setAttribute('data-ddh-via', via); else root.removeAttribute('data-ddh-via');
      sheet = el; sheetMode = mode; sheetFrom = from || null; openedAt = Date.now();
      navGrace = via === 'nav';
      var h = host(!deskMQ.matches); if (sheetBox.parentNode !== h) h.appendChild(sheetBox);
      if (sheetBox.getAttribute('lang') !== (lang || 'en')) sheetBox.setAttribute('lang', lang || 'en');
      showGuide(el); eager(el); el.hidden = false; root.setAttribute('data-ddh-open-sheet', name);
      el.setAttribute('aria-modal', String(mode === 'modal'));
      if (sheetFrom) sheetFrom.setAttribute('aria-expanded', 'true');
      if (!deskMQ.matches) lock(true);
      if (mode === 'modal') el.focus({ preventScroll: true });
    }
    function closeSheet(quiet) {
      w.clearTimeout(hoverT);
      if (!sheet) return;
      var from = sheetFrom, modal = sheetMode === 'modal';
      var inside = sheet.contains(d.activeElement);
      sheet.hidden = true; root.removeAttribute('data-ddh-open-sheet'); root.removeAttribute('data-ddh-via'); lock(false); navGrace = false; navOrigin = null;
      if (from) from.setAttribute('aria-expanded', 'false');
      sheet = null; sheetFrom = null; sheetMode = '';
      if ((modal || inside) && !quiet && from && from.offsetWidth) { backFocus = true; from.focus({ preventScroll: true }); backFocus = false; }   // focus comes back without reopening
    }
    // 1.15.0: from the site menu the selector rises over the menu itself, so it appears under a pointer that has not moved (Safari sends no boundary event then): no closing until the pointer moves
    var navGrace = false, navOrigin = null;   // navOrigin: the site-menu link the selector rose from; a click on the panel exactly over it still follows that link
    function later() { w.clearTimeout(hoverT); if (navGrace) return; if (sheetMode === 'hover') hoverT = w.setTimeout(function () { closeSheet(true); }, root.getAttribute('data-ddh-via') === 'nav' ? 450 : 280); }   // from the site header the pointer has a gap to cross
    function pick(btn) {
      var el = btn.closest('.ddh__sheet'), v = btn.getAttribute('data-ddh-v');
      [].forEach.call(el.querySelectorAll('[data-ddh-v]'), function (b) { var on = b === btn; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      [].forEach.call(el.querySelectorAll('[data-v]'), function (x) { x.hidden = x.getAttribute('data-v') !== v; });
      var panel = el.querySelector('[role=tabpanel]'); if (panel) panel.setAttribute('aria-labelledby', btn.id);
    }
    function wireSheets() {
      on(sheetBox, 'pointerdown', function (ev) { sheetPT = ev.pointerType; }, { passive: true });
      on(sheetBox, 'click', function (ev) {
        var t = ev.target;
        if (t.closest('[data-ddh-close]')) { if (t.closest('#ddh-sizes')) szClose(true); else closeSheet(); return; }
        // 1.11.1: a model card is a plain link to its product. A touch on a card that is not the one previewed shows its
        // preview first (the preview's own button, or a second touch, leads on); a mouse click goes straight there.
        var g = t.closest('[data-ddh-go]'); if (g) { var gc = g.closest('.ddh__sheet').querySelector('[data-ddh-m="' + g.getAttribute('data-ddh-go') + '"]'); if (gc) { pickModel(gc, true); if (fv(g)) gc.focus({ preventScroll: true }); } return; }
        var bk = t.closest('[data-ddh-guide]'); if (bk) { var sh0 = bk.closest('.ddh__sheet'); showGuide(sh0); var gb = sh0.querySelector('[data-ddh-go]'); if (gb && fv(bk)) gb.focus({ preventScroll: true }); return; }
        var c = t.closest('[data-ddh-m]'), pt = sheetPT; sheetPT = '';
        if (c && pt === 'touch' && c.getAttribute('aria-current') !== 'true' && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); pickModel(c, true); return; }
        var v = t.closest('[data-ddh-v]'); if (v) { pick(v); return; }
        if (sheet && sheetMode === 'modal' && t === sheet && !deskMQ.matches) closeSheet();   // the backdrop of a full-screen sheet
      });
      on(sheetBox, 'keydown', function (ev) {
        var v = ev.target.closest && ev.target.closest('[data-ddh-v]');
        if (v && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { var all = [].slice.call(v.parentNode.querySelectorAll('[data-ddh-v]')), n = all[(all.indexOf(v) + (ev.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; pick(n); n.focus(); ev.preventDefault(); return; }
        if (ev.key === 'Tab' && sheet && sheetMode === 'hover' && sheetFrom) {                         // 1.11.1: a preview opened from the keyboard: Tab leads back out next to its button
          var g = focusables(sheet), at0 = d.activeElement;
          if (!ev.shiftKey && at0 === g[g.length - 1]) { var nx = after(sheetFrom); if (nx) { ev.preventDefault(); closeSheet(true); nx.focus(); } }
          else if (ev.shiftKey && at0 === g[0]) { ev.preventDefault(); sheetFrom.focus(); }
          return;
        }
        if (ev.key === 'Tab' && sheet && sheetMode === 'modal') {                                       // keep keyboard focus inside the dialog
          var f = [].filter.call(sheet.querySelectorAll('a[href],button:not([tabindex="-1"])'), function (x) { return x.offsetWidth > 0; });
          if (!f.length) return;
          var first = f[0], last = f[f.length - 1], at = d.activeElement;
          if (ev.shiftKey && (at === first || at === sheet)) { last.focus(); ev.preventDefault(); }
          else if (!ev.shiftKey && at === last) { first.focus(); ev.preventDefault(); }
        }
      });
      on(sheetBox, 'pointerenter', function (ev) { if (ev.pointerType !== 'touch') w.clearTimeout(hoverT); });
      on(sheetBox, 'pointerleave', function (ev) { if (ev.pointerType !== 'touch') later(); });
      // 1.11.1 model selector: pointing at a card (after a short pause, so crossing the list does not flicker) or focusing it
      // shows its preview; the preview area keeps whatever was shown last.
      on(sheetBox, 'pointerover', function (ev) {
        if (ev.pointerType === 'touch') return;
        var c = ev.target.closest && ev.target.closest('[data-ddh-m]'); w.clearTimeout(pvT);
        if (c && c.getAttribute('aria-current') !== 'true') pvT = w.setTimeout(function () { pickModel(c); }, 90);
      }, { passive: true });
      on(sheetBox, 'focusin', function (ev) { var c = ev.target.closest && ev.target.closest('[data-ddh-m]'); if (c && fv(c)) pickModel(c); });   // keyboard focus only: a touch focuses the link before its click
      on(sheetBox, 'focusout', function (ev) {
        var to = ev.relatedTarget; if (!to) return;
        if (sheet && sheetMode === 'hover' && !sheet.contains(to) && to !== sheetFrom && !isCta(to)) closeSheet(true);
        if (szEl && !szEl.hidden && !szEl.contains(to) && to !== szBtn) szClose();
      });
      // 1.11.1 the Dual Plush card lives in the hero itself (not in the screens), shown by the lifted-mattress state
      dpc = sheetBox.querySelector('#ddh-dpc');
      if (dpc) {
        root.appendChild(dpc); root.setAttribute('data-ddh-dpc', '');
        cleanups.push(function () { if (dpc && dpc.parentNode) dpc.parentNode.removeChild(dpc); root.removeAttribute('data-ddh-dpc'); dpc = null; });
        wireCard(dpc);
      }
      // 1.14.0 context cards for five points (Natural Adaptation, Original Dunlop Technology, Firmness Regulation, Cover
      // Options, Balance & Relief): one at a time, in one slot on the right; the short copy in the section stays as the
      // fallback (before this file arrives, on phones in landscape) and as the screen-reader text
      hcs = sheetBox.querySelector('.ddh__hcs');
      if (hcs) {
        root.appendChild(hcs); root.setAttribute('data-ddh-cards', '');
        [].forEach.call(hcs.querySelectorAll('[data-ddh-card]'), function (c) {
          wireCard(c); var p = group.querySelector('[data-ddh-point="' + c.getAttribute('data-ddh-card') + '"]');
          if (p) { p.setAttribute('data-ddh-ctl', p.getAttribute('aria-controls') || ''); p.setAttribute('aria-controls', c.id); }
        });
        cleanups.push(function () {
          [].forEach.call(group.querySelectorAll('[data-ddh-ctl]'), function (p) { p.setAttribute('aria-controls', p.getAttribute('data-ddh-ctl')); p.removeAttribute('data-ddh-ctl'); });
          if (hcs && hcs.parentNode) hcs.parentNode.removeChild(hcs); root.removeAttribute('data-ddh-cards'); hcs = null;
        });
        if (active) placeCard(active);
      }
      szEl = sheetBox.querySelector('#ddh-sizes');
      if (szEl) {
        on(szEl, 'pointerenter', function (ev) { if (ev.pointerType !== 'touch') w.clearTimeout(szT); });
        on(szEl, 'pointerleave', function (ev) { if (ev.pointerType !== 'touch' && szMode === 'hover') szT = w.setTimeout(szClose, 280); });
      }
    }
    // the "safe triangle": from the open point towards the facing edge of its card (any other direction closes at once)
    function toward(c, x, y) {
      var pt = group.querySelector('[data-ddh-point="' + active + '"]'); if (!pt || !c) return false;
      var a = pt.getBoundingClientRect(), r = c.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, m = 40;
      if (ax >= r.left && ax <= r.right && ay >= r.top && ay <= r.bottom) return x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;   // the point lies under its card
      var bx = ax < r.left ? r.left + 2 : ax > r.right ? r.right - 2 : null;
      if (bx === null) { var by = ay < r.top ? r.top + 2 : r.bottom - 2, ty = (y - ay) / (by - ay); if (ty < -.1 || ty > 1.05) return false; return x >= Math.min(ax + (r.left - m - ax) * ty, ax - m) && x <= Math.max(ax + (r.right + m - ax) * ty, ax + m); }
      var t = (x - ax) / (bx - ax); if (t < -.1 || t > 1.05) return false;
      var top = ay + (r.top - m - ay) * t, bot = ay + (r.bottom + m - ay) * t;
      return y >= Math.min(top, ay - m) && y <= Math.max(bot, ay + m);
    }
    function inBox(c, x, y) { var r = c.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
    function inCards(el) { return !!(el && el.nodeType === 1 && ((dpc && dpc.contains(el)) || (hcs && hcs.contains(el)))); }
    function cardsLive() { return !!(hcs && w.innerWidth > 700 && w.innerHeight > 500); }
    function cardOf(k) { if (!k) return null; if (k === 'system') return dpcLive() ? dpc : null; return cardsLive() ? hcs.querySelector('[data-ddh-card="' + k + '"]') : null; }
    // a context card sits on the right, below the LATEX lockup and above the Shop buttons (never over them)
    // 1.15.0: the compaction tier is measured when the card opens; a picture or the web font that arrives a moment later changes the height, so the card is measured again
    // (a slow connection used to leave the Natural Adaptation picture blank and the seven tiles pushed out of sight)
    var replaceT = [];
    function replaceSoon(k) {
      replaceT.forEach(function (t) { w.clearTimeout(t); }); replaceT = [];
      var c = cardOf(k); if (!c) return;
      var again = function () { if (active === k) placeCard(k); };
      [].forEach.call(c.querySelectorAll('img'), function (im) {
        if (im.loading !== 'eager') { im.loading = 'eager'; }
        if (!im.complete) { im.addEventListener('load', again, { once: true }); im.addEventListener('error', again, { once: true }); }
      });
      [180, 600, 1400].forEach(function (ms) { replaceT.push(w.setTimeout(again, ms)); });
      if (w.document.fonts && w.document.fonts.ready) w.document.fonts.ready.then(again);
    }
    cleanups.push(function () { replaceT.forEach(function (t) { w.clearTimeout(t); }); });
    function placeCard(k) {
      if (k === 'system') {                                           // the Dual Plush card ends above the measured Shop row (its height varies)
        var dc = cardOf(k), shp = root.querySelector('.ddh__shop'); if (!dc || !shp) return;
        dc.style.bottom = Math.round(root.getBoundingClientRect().bottom - shp.getBoundingClientRect().top + 16) + 'px'; return;
      }
      var c = cardOf(k); if (!c) return;
      var rr = root.getBoundingClientRect(), lk = root.querySelector('.ddh__sky-lockup'), sh = root.querySelector('.ddh__shop');
      var safe = parseFloat(w.getComputedStyle(root).getPropertyValue('--ddh-safe')) || 64;
      var top = Math.max(safe + 10, lk ? lk.getBoundingClientRect().bottom - rr.top + 16 : 0);
      if (k === 'weight') top = 10;                                 // 1.17.0: the firmness navigator is a full panel: it rises over the site header like the selectors
      var bottom = sh ? sh.getBoundingClientRect().top - rr.top - 16 : rr.height - 16;
      var vb = w.innerHeight - rr.top - 16; if (vb - top >= 300 && vb < bottom) bottom = vb;
      if (k === 'weight') bottom = Math.min(rr.height, w.innerHeight - rr.top) - 12;   // 1.17.0: the navigator may use the whole window (it has its own close)   // the Shop row below the fold: the card still ends on screen
      c.style.top = Math.round(top) + 'px'; c.style.maxHeight = Math.max(160, Math.round(bottom - top)) + 'px';
      c.removeAttribute('data-ddh-wide');
      c.removeAttribute('data-tight');                                                         // low hero: optional lines step aside (type never shrinks)
      for (var tier = 0; tier <= 3 && c.scrollHeight > c.clientHeight + 1; tier++) c.setAttribute('data-tight', String(tier));   // 0 tightens the spacing, 1-3 let optional lines step aside
      if (c.scrollHeight > c.clientHeight + 1) c.setAttribute('data-ddh-wide', '');                 // 1.15.0: still too tall (longer translations, 668 px windows): the card widens, fewer wrapped lines; what is left scrolls inside it
      // points the open card covers step aside (they would otherwise catch the pointer resting on the card)
      var r = c.getBoundingClientRect();
      points.forEach(function (p) { var q = p.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2; p.toggleAttribute('data-ddh-under', !!q.width && x > r.left - 6 && x < r.right + 6 && y > r.top - 6 && y < r.bottom + 6); });
    }
    function unplace() { points.forEach(function (p) { p.removeAttribute('data-ddh-under'); }); }
    function wireCard(c) {
      on(c, 'pointerenter', function (ev) { if (ev.pointerType !== 'touch') { overDpc = true; if (dpcT) { w.clearTimeout(dpcT); dpcT = 0; } } });
      on(c, 'pointerleave', function (ev) {
        if (ev.pointerType === 'touch') return; overDpc = false;
        var to = ev.relatedTarget; if (to && (art.contains(to) || inCards(to))) return;   // back over the picture: the hit-test decides
        var was = active; dpcT = w.setTimeout(function () { dpcT = 0; if (!overDpc && active === was) show(null); }, 280);
      });
      on(c, 'click', function (ev) { var x = ev.target.closest && ev.target.closest('[data-ddh-hcx]'); if (!x) return; var p = group.querySelector('[data-ddh-point="' + active + '"]'); show(null); if (p && fv(x)) p.focus({ preventScroll: true }); });
      on(c, 'pointerdown', function () { cardDownAt = Date.now(); }, { passive: true });   // a tap on the card's text blurs the point that opened it: that is not leaving
      on(c, 'focusout', function (ev) { var to = ev.relatedTarget; if (to ? !c.contains(to) && !group.contains(to) : !c.matches(':hover') && Date.now() - cardDownAt > 500) show(null); });
      on(c, 'keydown', function (ev) { if (ev.key === 'Tab' && ev.shiftKey && ev.target === c.querySelector('button,a[href]')) { var p = group.querySelector('[data-ddh-point="' + active + '"]'); if (p) { ev.preventDefault(); p.focus({ preventScroll: true }); } } });
    }
    function dpcLive() { return !!(dpc && w.innerWidth > 700 && root.hasAttribute('data-ddh-dpc')); }
    function showGuide(sh) {
      if (!sh.querySelector('[data-ddh-pv="guide"]')) return;
      [].forEach.call(sh.querySelectorAll('[data-ddh-m]'), function (c) { c.removeAttribute('aria-current'); });
      [].forEach.call(sh.querySelectorAll('[data-ddh-pv]'), function (p) { p.hidden = p.getAttribute('data-ddh-pv') !== 'guide'; });
    }
    function pickModel(card, reveal) {
      var sh = card.closest('.ddh__sheet'), id = card.getAttribute('data-ddh-m'), pv = null; if (!sh) return;
      [].forEach.call(sh.querySelectorAll('[data-ddh-m]'), function (c) { if (c === card) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
      [].forEach.call(sh.querySelectorAll('[data-ddh-pv]'), function (p) { var on1 = p.getAttribute('data-ddh-pv') === id; p.hidden = !on1; if (on1) pv = p; });
      if (reveal && pv && !deskMQ.matches && pv.scrollIntoView) pv.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' });
    }
    function calm() { return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    function focusables(el) { return [].filter.call(el.querySelectorAll('a[href],button:not([tabindex="-1"])'), function (x) { return x.offsetWidth > 0 && !x.closest('[hidden]'); }); }
    function after(el) { var all = focusables(root).filter(function (x) { return !(sheetBox && sheetBox.contains(x)); }); return all[all.indexOf(el) + 1] || null; }
    function isCta(el) { return ctas.indexOf(el) > -1; }
    function fv(el) { try { return el.matches(':focus-visible'); } catch (e) { return true; } }
    ctas.forEach(function (a) {
      var name = a.getAttribute('data-ddh-sheet');
      on(a, 'pointerdown', function (ev) { lastPT = ev.pointerType; }, { passive: true });
      on(a, 'pointerenter', function (ev) {
        if (ev.pointerType === 'touch' || !deskMQ.matches || (sheet && sheetMode === 'modal')) return;
        loadSheets(); w.clearTimeout(hoverT);
        hoverT = w.setTimeout(function () { openSheet(name, 'hover', a); }, sheet ? 0 : 140);
      }, { passive: true });
      on(a, 'pointerleave', function (ev) { if (ev.pointerType !== 'touch') { if (!sheet) w.clearTimeout(hoverT); later(); } }, { passive: true });
      // 1.11.1 keyboard: focusing the button shows its preview; Tab steps into the model list, Enter still opens the collection
      on(a, 'focus', function () { if (!backFocus && deskMQ.matches && fv(a) && !(sheet && sheetMode === 'modal')) openSheet(name, 'hover', a); });
      on(a, 'keydown', function (ev) {
        if (ev.key !== 'Tab' || ev.shiftKey || !sheet || sheetFrom !== a) return;
        var f = sheet.querySelector('[data-ddh-m][aria-current=true]') || sheet.querySelector('[data-ddh-m]'); if (f) { ev.preventDefault(); f.focus(); }
      });
      on(a, 'blur', function (ev) { var to = ev.relatedTarget; if (to && sheet && sheetFrom === a && sheetMode === 'hover' && !sheet.contains(to) && !isCta(to)) closeSheet(true); });
      on(a, 'click', function (ev) {
        if (ev.detail === 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || phoneMQ.matches) return;                          // keyboard / new tab: straight to the collection
        var touchy = lastPT === 'touch' || !deskMQ.matches; lastPT = '';
        if (touchy && !(sheet && sheetFrom === a)) { ev.preventDefault(); openSheet(name, 'modal', a); }
      });
    });
    if (bioPoint) {
      on(bioPoint, 'pointerenter', loadSheets, { passive: true });
      // 1.11.1: on computers the Bio Comfort point opens its screen on hover too (click still pins it open); touch is unchanged
      on(bioPoint, 'pointerenter', function (ev) {
        if (ev.pointerType === 'touch' || !deskMQ.matches || (sheet && sheetMode === 'modal')) return;
        w.clearTimeout(hoverT);
        hoverT = w.setTimeout(function () { openSheet('bio', 'hover', bioPoint); }, sheet ? 0 : 140);
      }, { passive: true });
      on(bioPoint, 'pointerleave', function (ev) { if (ev.pointerType !== 'touch') { if (!sheet) w.clearTimeout(hoverT); later(); } }, { passive: true });
    }
    on(root.querySelector('.ddh__shop') || root, 'pointerenter', loadSheets, { passive: true });
    // 1.11.1 global size guide: one quiet trigger by the Shop buttons, a compact list of every UK & EU size (no prices).
    // Pointer: opens on hover, closes on leaving; click / tap / Enter pins it; Escape, a click outside or focus moving
    // away closes it. Phones get it too (a bottom sheet): it is light, text only.
    function szOpen(mode) {
      if (!sheetBox) { sheetWait = function () { szOpen(mode); }; loadSheets(); return; }
      if (!szEl) return;
      w.clearTimeout(szT); if (sheet) closeSheet(true);
      var h = host(!deskMQ.matches); if (sheetBox.parentNode !== h) h.appendChild(sheetBox);
      if (sheetBox.getAttribute('lang') !== (lang || 'en')) sheetBox.setAttribute('lang', lang || 'en');
      szEl.hidden = false; szMode = mode; szBtn.setAttribute('aria-expanded', 'true'); root.setAttribute('data-ddh-sizes', '');
      if (mode === 'pin' && !deskMQ.matches) szEl.focus({ preventScroll: true });
    }
    function szClose(back) {
      w.clearTimeout(szT); if (!szEl || szEl.hidden) return;
      szEl.hidden = true; szMode = ''; szBtn.setAttribute('aria-expanded', 'false'); root.removeAttribute('data-ddh-sizes');
      if (back) szBtn.focus({ preventScroll: true });
    }
    if (szBtn) {
      szBtn.hidden = false;
      on(szBtn, 'pointerdown', function (ev) { lastPT = ev.pointerType; }, { passive: true });
      on(szBtn, 'pointerenter', function (ev) {
        if (ev.pointerType === 'touch' || !deskMQ.matches || (sheet && sheetMode === 'modal')) return;
        loadSheets(); w.clearTimeout(szT); szT = w.setTimeout(function () { szOpen('hover'); }, 120);
      }, { passive: true });
      on(szBtn, 'pointerleave', function (ev) { if (ev.pointerType !== 'touch' && szMode !== 'pin') { w.clearTimeout(szT); szT = w.setTimeout(szClose, 280); } }, { passive: true });
      on(szBtn, 'click', function () { if (szEl && !szEl.hidden && szMode === 'pin') szClose(); else if (szEl && !szEl.hidden) szMode = 'pin'; else szOpen('pin'); });
    }
    // 1.11.1 bridge from the site's own header: pointing at (or tabbing to) its "Mattresses" / "Toppers" links opens the
    // same preview under the header, while the hero is on screen. Read-only: nothing in the header is changed, clicks go
    // where they always went, touch is left alone, and the hero still works if the header changes.
    var navA = null;
    function navSheet(a) {
      if (!a || root.contains(a) || (sheetBox && sheetBox.contains(a)) || (portal && portal.contains(a))) return '';
      var href = (a.getAttribute('href') || '').toLowerCase(), t = (a.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      var name = (/latex-mattresses-collection/.test(href) || t === 'mattresses') ? 'mattress' : (/latex-toppers-collection/.test(href) || t === 'toppers') ? 'topper' : '';
      if (!name) return '';
      var r = a.getBoundingClientRect(), hr = root.getBoundingClientRect(), safe = parseFloat(w.getComputedStyle(root).getPropertyValue('--ddh-safe')) || 120;
      return (hr.top > -40 && hr.top < w.innerHeight * .35 && r.bottom <= hr.top + safe + 8 && r.bottom > 0) ? name : '';
    }
    on(d, 'click', function (ev) {
      if (!sheet || !navOrigin || !sheet.contains(ev.target) || (ev.target.closest && ev.target.closest('a,button'))) return;
      var r = navOrigin.getBoundingClientRect(); if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
      var a = navOrigin; ev.preventDefault(); closeSheet(true); a.click();
    });
    on(d, 'pointermove', function (ev) { if (!navGrace) return; navGrace = false; if (sheet && !sheet.contains(ev.target)) later(); }, { passive: true });
    on(d, 'pointerover', function (ev) {
      if (ev.pointerType !== 'mouse' || !deskMQ.matches || (sheet && sheetMode === 'modal')) return;
      var a = ev.target.closest && ev.target.closest('a'); if (!a || a === navA) return;
      var name = navSheet(a); if (!name) return;
      navA = a; loadSheets(); w.clearTimeout(hoverT);
      hoverT = w.setTimeout(function () { openSheet(name, 'hover', null, 'nav'); navOrigin = a; }, sheet ? 0 : 160);
    }, { passive: true });
    on(d, 'pointerout', function (ev) {
      if (!navA || (ev.relatedTarget && navA.contains(ev.relatedTarget)) || !(ev.target.closest && ev.target.closest('a') === navA)) return;
      navA = null; if (!sheet) w.clearTimeout(hoverT); later();
    }, { passive: true });
    on(d, 'focusin', function (ev) {
      var a = ev.target; if (!deskMQ.matches || !a || a.tagName !== 'A' || !fv(a)) return;
      var name = navSheet(a); if (name && !(sheet && sheetMode === 'modal')) openSheet(name, 'hover', null, 'nav');
      else if (sheet && sheetMode === 'hover' && root.getAttribute('data-ddh-via') === 'nav' && !sheet.contains(a)) closeSheet(true);
    });
    on(d, 'keydown', function (ev) { if ((ev.key === 'Escape' || ev.key === 'Esc') && szEl && !szEl.hidden) { szClose(true); ev.stopPropagation(); } });
    on(d, 'click', function (ev) { if (szEl && !szEl.hidden && !szEl.contains(ev.target) && !(szBtn && szBtn.contains(ev.target))) szClose(); });
    on(d, 'keydown', function (ev) { if (sheet && (ev.key === 'Escape' || ev.key === 'Esc')) closeSheet(); });
    on(d, 'click', function (ev) { if (sheet && sheetMode === 'modal' && Date.now() - openedAt > 300 && !sheet.contains(ev.target) && !(sheetFrom && sheetFrom.contains(ev.target)) && !(bioPoint && bioPoint.contains(ev.target))) closeSheet(true); });
    on(w, 'resize', function () { if (sheet && (phoneMQ.matches || (sheetMode === 'hover' && !deskMQ.matches))) closeSheet(true); if (active) placeCard(active); }, { passive: true });
    // 1.10.1 loading in two stages: the first paint is the plain scene (photo, lettering, buttons) and nothing else.
    // Once the page has loaded and the browser is idle, the other modes follow at low priority: the screens' text
    // (every device: it is what search engines index), then on tablets/computers the hotspot graphics, the night
    // picture and the screens' pictures, so every mode opens instantly. Data-saver / 2G connections wait for intent.
    function lean() { var c = w.navigator.connection; return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))); }
    function stage2() {
      var go = function () { if (!root.hasAttribute('data-ddh-ready')) return; loadSheets(); if (!phoneMQ.matches && !lean()) warm(); };
      var t = w.setTimeout(function () { if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 2000 }); else go(); }, 900);
      cleanups.push(function () { w.clearTimeout(t); });
    }
    if (d.readyState === 'complete') stage2(); else on(w, 'load', stage2, { once: true });
    cleanups.push(function () { w.clearTimeout(hoverT); w.clearTimeout(pvT); w.clearTimeout(szT); lock(false); if (szBtn) { szBtn.hidden = true; szBtn.setAttribute('aria-expanded', 'false'); } root.removeAttribute('data-ddh-sizes'); root.removeAttribute('data-ddh-via'); });

    // Roving tabindex: one Tab stop, arrows move between the points.
    function rove(t) { points.forEach(function (p) { p.tabIndex = p === t ? 0 : -1; }); t.focus(); }
    function visible() { return points.filter(function (p) { return p.offsetWidth > 0; }); }
    points.forEach(function (p, i) { p.tabIndex = i ? -1 : 0; p.style.setProperty('--i', i); });
    on(group, 'keydown', function (ev) {
      var vis = visible(), i = vis.indexOf(d.activeElement); if (i < 0) return; // hidden points (night on tablets) are skipped
      var n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (n) { ev.preventDefault(); rove(vis[(i + n + vis.length) % vis.length]); }
      else if (ev.key === 'Home' || ev.key === 'End') { ev.preventDefault(); rove(vis[ev.key === 'Home' ? 0 : vis.length - 1]); }
    });
    // Open on keyboard focus only. A tap also focuses the button (Chrome/Android); opening here would make the
    // click that follows read as a "second tap" and close it again.
    function kbFocus(el) { try { return el.matches(':focus-visible'); } catch (e) { return true; } }
    on(group, 'focusin', function (ev) { var p = ev.target.closest('[data-ddh-point]'), k = p && p.getAttribute('data-ddh-point'); if (p && kbFocus(p)) show(k, true); });
    on(group, 'focusout', function (ev) { if (!group.contains(ev.relatedTarget) && !inCards(ev.relatedTarget) && !(!ev.relatedTarget && Date.now() - cardDownAt < 500)) show(null); });
    // 1.14.0: with a context card open, Tab from its point steps into the card (its close button); Escape returns
    on(group, 'keydown', function (ev) {
      var c = cardOf(active); if (ev.key !== 'Tab' || ev.shiftKey || !c) return;
      var f = c.querySelector('button,a[href]'); if (f) { ev.preventDefault(); f.focus(); }
    });

    // Out of view: close any open state and pause the pulses.
    if (w.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          root.classList.toggle('ddh--offscreen', !en.isIntersecting);
          if (en.intersectionRatio < .3) show(null);
        });
      }, { threshold: [0, .3] });
      io.observe(root);
      cleanups.push(function () { io.disconnect(); });
    }
    cleanups.push(function () { show(null); points.forEach(function (p) { p.removeAttribute('tabindex'); }); });
    return inst;

    function destroy() {
      if (ac) ac.abort();
      while (cleanups.length) { try { cleanups.pop()(); } catch (e) {} }
      root.removeAttribute('data-ddh-ready');
      root.classList.remove('ddh--translated', 'ddh--offscreen');
      var i = instances.indexOf(inst); if (i > -1) instances.splice(i, 1);
    }
  }

  function destroy(root) {
    if (!root) { while (instances.length) instances[0].destroy(); return; }
    var inst = find(root); if (inst) inst.destroy();
  }

  // Idempotent: drops instances whose section was removed by Instant Site, initialises new ones.
  function boot() {
    instances.slice().forEach(function (inst) { if (!inst.root.isConnected) inst.destroy(); else if (inst.layout) inst.layout(); });
    [].forEach.call(d.querySelectorAll('.ddh'), init);
  }

  w.DDHero = { version: VERSION, init: init, destroy: destroy, boot: boot };

  // Instant Site loads/unloads sections with the viewport; re-sync on both events (cheap, idempotent).
  var hooked = false;
  function hook() {
    var is = w.instantsite;
    if (hooked || !is || !is.onTileLoaded || !is.onTileUnloaded) return;
    hooked = true;
    is.onTileLoaded.add(boot);
    is.onTileUnloaded.add(boot);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { boot(); hook(); }, { once: true });
  else { boot(); hook(); }
  w.addEventListener('load', hook, { once: true });
})(window, document);
