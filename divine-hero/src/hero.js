/*! Divine DunlopDreams Hero 1.6.0 | vanilla, no dependencies | window.DDHero = {init, destroy, boot, version} */
(function (w, d) {
  'use strict';
  if (w.DDHero && w.DDHero.boot) { w.DDHero.boot(); return; } // script re-executed by a section re-render

  var VERSION = '1.6.0';
  var TRANSLATED = /(^|\s)translated-(ltr|rtl)(\s|$)/;
  // Proximity radii (fraction of artwork width) and the back-zone rectangle — unchanged from v26.
  var R = { shoulder: .075, back: .06, zones: .085, head: .085, system: .09, firmness: .062, temperature: .062, sizes: .055, weight: .06 };
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
    function layout() { if (!mRaf) mRaf = w.requestAnimationFrame(layoutNow); }
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
      root.style.removeProperty('--ddh-top'); root.style.removeProperty('--ddh-safe'); root.style.removeProperty('--ddh-win-top'); root.removeAttribute('data-ddh-lockup-yield'); root.style.removeProperty('--ddh-edge-r'); root.removeAttribute('data-ddh-measured');
    });

    // The pasted section ends with <i class="ddh__end">. If it is missing, the site builder cut the code short.
    if (!root.querySelector('.ddh__end') && w.console) w.console.warn('[DDHero] the hero section code looks truncated: paste the complete code (it must end with ddh__end).');

    var viewport = root.querySelector('.ddh__art'), art = root.querySelector('.ddh__plane'), group = root.querySelector('.ddh__points');
    if (root.getAttribute('data-ddh-mode') !== 'interactive' || !viewport || !art || !group) return inst;

    var points = [].slice.call(group.querySelectorAll('[data-ddh-point]'));
    var copies = [].slice.call(root.querySelectorAll('[data-ddh-copy]'));
    var screens = [].slice.call(root.querySelectorAll('.ddh__screen'));
    var lazyImgs = [].slice.call(root.querySelectorAll('.ddh__screen img'));
    var fine = w.matchMedia ? w.matchMedia('(hover:hover) and (pointer:fine)') : { matches: true };
    var live = d.createElement('p');
    live.className = 'ddh__sr';
    live.setAttribute('aria-live', 'polite');
    root.appendChild(live);
    cleanups.push(function () { if (live.parentNode) live.parentNode.removeChild(live); });
    var active = null;

    // Interaction graphics (~15 KB) load on first sign of intent, not with the page.
    var warmed = false;
    // 1.4.0: hotspots are hidden on an upright phone (CSS); nothing may open or download there.
    function pointsOff() { return !group.offsetWidth; }
    function warm() {
      if (warmed || pointsOff()) return; warmed = true;
      lazyImgs.forEach(function (img) { img.loading = 'eager'; });
    }

    function show(key, announce) {
      if (key && pointsOff()) key = null;
      if (key === active) { if (key && announce) live.textContent = txtOf(key); return; }
      active = key;
      if (key) { warm(); root.setAttribute('data-ddh-state', key); root.setAttribute('data-ddh-screen', key === 'back' ? 'back' : 'brand'); fit(key); }
      else { root.removeAttribute('data-ddh-state'); root.removeAttribute('data-ddh-screen'); }
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
    var centres = null;
    function measure() {
      var b = art.getBoundingClientRect();
      if (!b.width || !b.height) { centres = null; return; }
      centres = points.map(function (p) {
        var r = p.getBoundingClientRect();
        return { key: p.getAttribute('data-ddh-point'), x: (r.left + r.width / 2 - b.left) / b.width, y: (r.top + r.height / 2 - b.top) / b.height };
      });
    }
    function invalidate() { centres = null; }
    if (w.ResizeObserver) {
      var ro = new ResizeObserver(invalidate);
      ro.observe(art);
      cleanups.push(function () { ro.disconnect(); });
    } else on(w, 'resize', invalidate, { passive: true });

    function hit(cx, cy, scale) {
      if (!centres) measure();
      if (!centres) return null;
      var b = art.getBoundingClientRect(), x = (cx - b.left) / b.width, y = (cy - b.top) / b.height;
      if (x < -.02 || x > 1.02 || y < -.02 || y > 1.02) return null;
      var ratio = b.height / b.width, best = null, bd = Infinity, e = scale > 1 ? .02 : 0;
      centres.forEach(function (p) {
        var dd = Math.hypot(x - p.x, (y - p.y) * ratio), r = R[p.key] * scale;
        if (active === p.key) r += .02;
        if (dd < r && dd < bd) { best = p.key; bd = dd; }
      });
      var inBack = x >= BACK.l - e && x <= BACK.r + e && y >= BACK.t - e && y <= BACK.b + e;
      if (inBack && (!best || bd > R[best] * .55 * scale)) return 'back';
      return best;
    }

    // Pointer proximity: coalesced to one hit-test per frame.
    var raf = 0, lastX = 0, lastY = 0;
    function frame() { raf = 0; show(hit(lastX, lastY, 1)); }
    on(art, 'pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      lastX = ev.clientX; lastY = ev.clientY;
      if (!raf) raf = w.requestAnimationFrame(frame);
    }, { passive: true });
    cleanups.push(function () { if (raf) w.cancelAnimationFrame(raf); });
    on(art, 'pointerleave', function (ev) {
      if (ev.pointerType === 'touch' || group.contains(d.activeElement)) return;
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
      if (ev.detail === 0) { if (key) show(key, true); return; } // keyboard activation
      if (!precise && key && key === active) key = null;           // second tap closes
      if (precise && !key) return;
      show(key, true);
    });
    points.forEach(function (p) {
      on(p, 'pointerenter', function (ev) { if (ev.pointerType !== 'touch') show(p.getAttribute('data-ddh-point')); }, { passive: true });
    });
    on(d, 'click', function (ev) { if (active && !viewport.contains(ev.target)) show(null); });
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

    // Roving tabindex: one Tab stop, arrows move between the points.
    function rove(t) { points.forEach(function (p) { p.tabIndex = p === t ? 0 : -1; }); t.focus(); }
    points.forEach(function (p, i) { p.tabIndex = i ? -1 : 0; p.style.setProperty('--i', i); });
    on(group, 'keydown', function (ev) {
      var i = points.indexOf(d.activeElement); if (i < 0) return;
      var n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (n) { ev.preventDefault(); rove(points[(i + n + points.length) % points.length]); }
      else if (ev.key === 'Home' || ev.key === 'End') { ev.preventDefault(); rove(points[ev.key === 'Home' ? 0 : points.length - 1]); }
    });
    // Open on keyboard focus only. A tap also focuses the button (Chrome/Android); opening here would make the
    // click that follows read as a "second tap" and close it again.
    function kbFocus(el) { try { return el.matches(':focus-visible'); } catch (e) { return true; } }
    on(group, 'focusin', function (ev) { var p = ev.target.closest('[data-ddh-point]'); if (p && kbFocus(p)) show(p.getAttribute('data-ddh-point'), true); });
    on(group, 'focusout', function (ev) { if (!group.contains(ev.relatedTarget)) show(null); });

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
