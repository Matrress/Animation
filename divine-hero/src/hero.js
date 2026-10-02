/*! Divine DunlopDreams Hero 1.9.0 | vanilla, no dependencies | window.DDHero = {init, destroy, boot, version} */
(function (w, d) {
  'use strict';
  if (w.DDHero && w.DDHero.boot) { w.DDHero.boot(); return; } // script re-executed by a section re-render

  var VERSION = '1.9.0';
  var TRANSLATED = /(^|\s)translated-(ltr|rtl)(\s|$)/;
  // Proximity radii (fraction of artwork width) and the back-zone rectangle — unchanged from v26.
  var R = { shoulder: .075, back: .06, zones: .085, head: .085, system: .09, firmness: .062, temperature: .062, sizes: .055, weight: .06, night: .07 };
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

    // Interaction graphics (~15 KB) load on first sign of intent, not with the page.
    var warmed = false;
    // 1.4.0: hotspots are hidden on an upright phone (CSS); nothing may open or download there.
    function pointsOff() { return !group.offsetWidth; }
    function warm() {
      if (warmed || pointsOff()) return; warmed = true;
      lazyImgs.forEach(function (img) { img.loading = 'eager'; });
      root.setAttribute('data-ddh-warm', '');                       // lets the mattress / night layers render (and load)
      if (nightImg && nightMQ.matches) nightImg.loading = 'eager';
      settle.load();
    }

    // 1.9.0 "Natural Adaptation": the sleeper settles, ~2 s. A puppet-warp of the photo's own pixels (WebGL, drawn
    // over the photo only where pixels move): the upper shoulder relaxes, the lower shoulder nudges the pillow and sinks
    // into the mattress, the head nestles into the pillow; each movement returns exactly to the photo. The baked
    // lettering never moves. Nothing new is downloaded (the picture already shown is reused). Off for reduced motion.
    var settle = (function () {
      var img = root.querySelector('.ddh__img'), plane = root.querySelector('.ddh__plane');
      var MW = 3554, MH = 2744, RX = 1150, RY = 940, RW = 1800, RH = 1210, DUR = 2.05;
      // the three body parts (master px): centre, rigid half-axes, soft falloff (× half-axis), rotation pivot
      var PARTS = [
        { c: [1680, 1290], r: [170, 110], f: 1.7, p: [1680, 1290] },   // upper shoulder
        { c: [1540, 1760], r: [140, 170], f: 1.1, p: [1540, 1760] },   // lower shoulder, against the pillow
        { c: [2370, 1360], r: [400, 230], f: .45, p: [2420, 1570] }    // head, pivoting on the pillow
      ];
      // baked lettering that must stay put (master px boxes)
      var KEEP = [[1290, 690, 2270, 965], [850, 1280, 1490, 1420], [850, 1470, 1500, 1645], [1740, 1625, 2310, 1715], [1730, 1750, 3430, 1890], [2690, 1910, 3310, 2000]];
      var reduce = w.matchMedia ? w.matchMedia('(prefers-reduced-motion:reduce)') : { matches: false };
      var cv, gl, U, src, built = false, failed = !img || !plane || !w.WebGLRenderingContext, raf = 0, t0 = 0, pending = 0;
      function bump(t, a, p, b) { return t <= a || t >= b ? 0 : t < p ? .5 - .5 * Math.cos(Math.PI * (t - a) / (p - a)) : .5 + .5 * Math.cos(Math.PI * (t - p) / (b - p)); }
      function load() {
        if (failed || src) return;
        src = new Image(); src.crossOrigin = 'anonymous';
        src.onload = function () { setTimeout(build, 0); };
        src.onerror = function () { failed = true; };
        src.src = img.currentSrc || img.src;
      }
      function build() {
        if (built || failed) return;
        try {
          var k = src.naturalWidth / MW, c2 = d.createElement('canvas');
          c2.width = Math.round(RW * k); c2.height = Math.round(RH * k);
          c2.getContext('2d').drawImage(src, RX * k, RY * k, RW * k, RH * k, 0, 0, c2.width, c2.height);
          cv = d.createElement('canvas'); cv.className = 'ddh__settle'; cv.setAttribute('aria-hidden', 'true');
          gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, failIfMajorPerformanceCaveat: true }); // no GPU: no settle
          var hp = gl && gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
          if (!gl || !hp || !hp.precision) throw 0;
          var vs = 'attribute vec2 a;varying vec2 v;void main(){v=a;gl_Position=vec4(a.x*2.-1.,1.-a.y*2.,0.,1.);}';
          var fs = 'precision highp float;uniform sampler2D T;uniform vec4 R;uniform vec2 C[3],H[3],M[3],P[3];uniform float F[3],A[3];uniform vec4 K[6];varying vec2 v;' +
            'void main(){vec2 p=R.xy+v*R.zw,D=vec2(0.);for(int i=0;i<3;i++){float W=1.-smoothstep(1.,1.+F[i],length((p-C[i])/H[i]));vec2 q=p-P[i];float c=cos(A[i]),s=sin(A[i]);' +
            'D+=W*(M[i]+vec2(c*q.x-s*q.y,s*q.x+c*q.y)-q);}for(int i=0;i<6;i++){vec4 k=K[i];vec2 b=smoothstep(k.xy-40.,k.xy,p)*(1.-smoothstep(k.zw,k.zw+40.,p));D*=1.-b.x*b.y;}' +
            'float al=smoothstep(.25,1.,length(D));vec4 t=texture2D(T,(p-D-R.xy)/R.zw);gl_FragColor=vec4(t.rgb*al,al);}';
          var pr = gl.createProgram();
          [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (x) { var sh = gl.createShader(x[0]); gl.shaderSource(sh, x[1]); gl.compileShader(sh); gl.attachShader(pr, sh); });
          gl.linkProgram(pr);
          if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw 0;
          gl.useProgram(pr);
          gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
          var a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
          gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
          [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(function (x) { gl.texParameteri(gl.TEXTURE_2D, x[0], x[1]); });
          U = {}; ['T', 'R', 'C', 'H', 'M', 'P', 'F', 'A', 'K'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n === 'T' || n === 'R' ? n : n + '[0]'); });
          gl.uniform4f(U.R, RX, RY, RW, RH);
          gl.uniform2fv(U.C, [].concat.apply([], PARTS.map(function (q) { return q.c; })));
          gl.uniform2fv(U.H, [].concat.apply([], PARTS.map(function (q) { return q.r; })));
          gl.uniform2fv(U.P, [].concat.apply([], PARTS.map(function (q) { return q.p; })));
          gl.uniform1fv(U.F, PARTS.map(function (q) { return q.f; }));
          gl.uniform4fv(U.K, [].concat.apply([], KEEP));
          plane.insertBefore(cv, img.parentNode.nextSibling);
          built = true;
          if (pending && Date.now() - pending < 700) play();
        } catch (e) { failed = true; if (cv && cv.parentNode) cv.parentNode.removeChild(cv); }
      }
      function draw(t) {
        var dpr = Math.min(w.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); }
        var up = bump(t, 0, .6, 1.75);                                      // upper shoulder: lets go, then gently back
        var push = bump(t, .2, .6, 1.3), sink = bump(t, .35, .85, 1.65);    // lower shoulder: nudges the pillow, sinks, floats up
        var head = bump(t, .4, .95, 1.95) - .18 * bump(t, 1.3, 1.6, 1.95);  // head: nestles in, a breath of rebound, settles
        gl.uniform2fv(U.M, [6 * up, 15 * up, 10 * push, 9 * sink, -3 * head, 8 * head]);
        gl.uniform1fv(U.A, [0, 0, .014 * head]);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      function clock() { return w.performance && performance.now ? performance.now() : Date.now(); }
      function tick() {
        var t = (clock() - t0) / 1000;
        if (t >= DUR) { raf = 0; cv.style.display = ''; root.removeAttribute('data-ddh-settling'); return; }
        draw(t); raf = w.requestAnimationFrame(tick);
      }
      function play() {
        if (reduce.matches || failed) return;
        if (!built) { pending = Date.now(); load(); return; }
        pending = 0; if (raf) return;                                      // one settle at a time; it always completes
        cv.style.display = 'block'; root.setAttribute('data-ddh-settling', '');
        t0 = clock(); draw(0);
        raf = w.requestAnimationFrame(tick);
      }
      cleanups.push(function () { if (raf) w.cancelAnimationFrame(raf); if (cv && cv.parentNode) cv.parentNode.removeChild(cv); root.removeAttribute('data-ddh-settling'); });
      return { load: load, play: play };
    })();

    function show(key, announce) {
      if (key && pointsOff()) key = null;
      if (key === active) { if (key && announce) live.textContent = txtOf(key); return; }
      active = key;
      if (key) { warm(); root.setAttribute('data-ddh-state', key); root.setAttribute('data-ddh-screen', key === 'back' ? 'back' : key === NIGHT ? NIGHT : 'brand'); fit(key); if (key === 'firmness') settle.play(); }
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
      centres = points.filter(function (p) { return p.offsetWidth > 0; }).map(function (p) { // hidden points (night on touch) never hit
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
        if (active && immersive(active, w) && p.key !== active) return; // immersive: only its own point is live
        var dd = Math.hypot(x - p.x, (y - p.y) * ratio), r = R[p.key] * scale;
        if (active === p.key) r += immersive(p.key, w) ? .05 : .02; // immersive states hold a little wider
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
      on(p, 'pointerenter', function (ev) { var k = p.getAttribute('data-ddh-point'); if (ev.pointerType !== 'touch' && (!active || !immersive(active, w) || k === active)) show(k); }, { passive: true });
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
