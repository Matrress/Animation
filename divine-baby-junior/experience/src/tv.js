/* ===== the television: the Optimised Preview (same scheme as Botanic TV, for the Baby & Junior mattress) =====
   Explore (the information, by topic) and Select & Buy (Size and Depth only) are different jobs: nothing is shown twice.
   The pictures of the mattress live in the "Your mattress" card, always beside the text, and follow the topic. */
var TV = null;
var DRAW_SLIDE = 5;                                   /* the index of the "your size" drawing in the picture card */
function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function ico(name) {
  var p = {
    bag: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    size: '<path d="M3 16l9 4 9-4"/><path d="M3 11l9 4 9-4-9-4-9 4z"/>',
    depth: '<path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17l4 4 4-4"/>',
    tag: '<path d="M4 4h8l8 8-8 8-8-8V4z"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    play: '<path d="M8 5l11 7-11 7V5z" fill="currentColor"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (p[name] || '') + '</svg>';
}
function leaf() { return '<svg class="lf" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill="currentColor"/></svg>'; }

/* a mattress drawn in proportion, in isometric view: width, length and depth in cm */
function isoSvg(L, W, Hh, o) {
  o = o || {};
  var COS = 0.8660254, SIN = 0.5, VBW = 640, VBH = o.h || 340;
  var S = Math.min((VBW - 150) / ((L + W) * COS), (VBH - 70) / ((L + W) * SIN + Hh * 1.4));
  function pt(x, y, z, cx, cy) { return [VBW / 2 + ((x - cx) - (y - cy)) * COS * S, VBH / 2 + 14 + ((x - cx) + (y - cy)) * SIN * S - z * S]; }
  function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  var cx = L / 2, cy = W / 2;
  var A = pt(0, 0, 0, cx, cy), B = pt(L, 0, 0, cx, cy), C = pt(L, W, 0, cx, cy), D = pt(0, W, 0, cx, cy);
  var A2 = pt(0, 0, Hh, cx, cy), B2 = pt(L, 0, Hh, cx, cy), C2 = pt(L, W, Hh, cx, cy), D2 = pt(0, W, Hh, cx, cy);
  var qd = '', qn = Math.max(4, Math.round(L / 16));
  for (var i = 1; i < qn; i++) { var a = pt(L * i / qn, 0, Hh, cx, cy), b = pt(L * i / qn, W, Hh, cx, cy); qd += 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
  var off = 16, nL = [-SIN, COS], nW = [SIN, COS];
  function mv(p, n) { return [p[0] + n[0] * off, p[1] + n[1] * off]; }
  function ln(a, b) { return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
  var dL1 = mv(D, nL), dL2 = mv(C, nL), dW1 = mv(C, nW), dW2 = mv(B, nW), dH1 = [D[0] - off, D[1]], dH2 = [D2[0] - off, D2[1]];
  var dims = ln(dL1, dL2) + ln(dW1, dW2) + ln(dH1, dH2) + ln(D, dL1) + ln(C, dL2) + ln(C, dW1) + ln(B, dW2) + ln(D, dH1) + ln(D2, dH2);
  function lab(p, n, dx, dy, a, b2) { var x = (p[0] + n[0] * dx).toFixed(1), y = p[1] + n[1] * dy; return '<text x="' + x + '" y="' + y.toFixed(1) + '" text-anchor="middle" class="d1">' + a + '</text><text x="' + x + '" y="' + (y + 14).toFixed(1) + '" text-anchor="middle" class="d2">' + b2 + '</text>'; }
  var labs = o.nolab ? '' :
    lab([(D[0] + C[0]) / 2, (D[1] + C[1]) / 2], nL, 44, 36, L + ' cm', inch(L) + ' in') + lab([(C[0] + B[0]) / 2, (C[1] + B[1]) / 2], nW, 44, 36, W + ' cm', inch(W) + ' in') +
    '<text x="' + (D[0] - off - 8).toFixed(1) + '" y="' + (((D[1] + D2[1]) / 2) - 2).toFixed(1) + '" text-anchor="end" class="d1">' + Hh + ' cm</text><text x="' + (D[0] - off - 8).toFixed(1) + '" y="' + (((D[1] + D2[1]) / 2) + 12).toFixed(1) + '" text-anchor="end" class="d2">' + inch(Hh) + ' in</text>';
  return '<svg class="iso" viewBox="0 0 ' + VBW + ' ' + VBH + '" role="img" aria-label="' + esc(o.label || ('Mattress, ' + W + ' by ' + L + ' centimetres, ' + Hh + ' centimetres deep, drawn in proportion')) + '">' +
    '<polygon class="fr" points="' + pts([B, C, C2, B2]) + '"/><polygon class="fl" points="' + pts([C, D, D2, C2]) + '"/><polygon class="ft" points="' + pts([A2, B2, C2, D2]) + '"/>' +
    '<path class="qu" d="' + qd + '"/><path class="dm" d="' + dims + '"/>' + labs + '</svg>';
}

/* ---------- the pictures: crops of the approved photos by CSS, no new files ---------- */
var CROPS = { closed: ['closed', '53%', 1, '50%'], open: ['open', '55%', 1, '50%'], core: ['open', '12%', 1.9, '57%'], quilt: ['closed', '40%', 2, '40%'], zip: ['closed', '28%', 2.1, '68%'] };
function slideHtml(s) {
  var m = CROPS[s.id], src = DATA.images[m[0]];
  return '<div class="sl"><img src="' + src.src + '" srcset="' + src.srcset + '" sizes="320px" alt="' + esc(s.alt) + '" loading="lazy" decoding="async" draggable="false" style="--p:' + m[1] + ';--k:' + m[2] + ';--oy:' + m[3] + '"><span class="slc">' + esc(s.label) + '</span></div>';
}
function drawingSlideHtml() {
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height);
  return '<div class="sl dr"><div class="drw">' + isoSvg(z ? z.l : 120, z ? z.w : 60, h ? h.cm : 10, { h: 300, nolab: true }) + '</div><span class="slc">' + (z && h ? z.w + ' × ' + z.l + ' cm · ' + h.cm + ' cm deep' : 'Your size · example') + '</span></div>';
}
function mineSliderHtml() {
  var n = DATA.slides.length + 1;
  return '<div class="slider" data-slider="mine"><div class="slv" tabindex="0" role="group" aria-label="Pictures of the mattress. Swipe or use the arrow keys.">' + DATA.slides.map(slideHtml).join('') + drawingSlideHtml() + '</div><div class="sld">' +
    Array.apply(null, Array(n)).map(function (x, i) { return '<button type="button" class="dot" data-dot="' + i + '" aria-label="Picture ' + (i + 1) + ' of ' + n + '"></button>'; }).join('') + '</div></div>';
}
function wireSliders(R, U) {
  $$('[data-slider]', R).forEach(function (sl) {
    if (sl.__w) { return; } sl.__w = 1;
    var v = $('.slv', sl), dots = $$('.dot', sl), mine = sl.getAttribute('data-slider') === 'mine';
    function cur() { return Math.max(0, Math.min(dots.length - 1, Math.round(v.scrollLeft / (v.clientWidth || 1)))); }
    function go(i) { i = Math.max(0, Math.min(dots.length - 1, i)); try { v.scrollTo({ left: i * v.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { v.scrollLeft = i * v.clientWidth; } }
    function mark() { var n = cur(); dots.forEach(function (d, k) { d.className = 'dot' + (k === n ? ' on' : ''); }); if (mine && U) { U.slide = n; } }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    v.addEventListener('scroll', function () { win.requestAnimationFrame(mark); }, { passive: true });
    v.addEventListener('keydown', function (e) { var k = e.key; if (k === 'ArrowRight') { e.preventDefault(); go(cur() + 1); } else if (k === 'ArrowLeft') { e.preventDefault(); go(cur() - 1); } });
    var drag = null;
    v.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button === 0) { drag = { x: e.clientX, s: v.scrollLeft, m: false }; } });
    win.addEventListener('pointermove', function (e) { if (!drag) { return; } var dx = e.clientX - drag.x; if (!drag.m && Math.abs(dx) > 4) { drag.m = true; v.classList.add('drag'); } if (drag.m) { v.scrollLeft = drag.s - dx; } });
    win.addEventListener('pointerup', function () { if (!drag) { return; } var m = drag.m; drag = null; if (m) { v.classList.remove('drag'); go(cur()); } });
    if (mine && U) { v.scrollLeft = (U.slide || 0) * v.clientWidth; mark(); }
  });
}

/* ---------- the films (the shop's own natural-latex films, trimmed to the part that suits this page) ---------- */
function vcardHtml(key) {
  var v = DATA.videos[key];
  return '<div class="vcard"><div class="vbox"><video class="vid" muted loop playsinline preload="none" poster="' + v.poster + '" data-vkey="' + key + '" data-src="' + v.url + '" data-end="' + (v.end || 0) + '" aria-label="' + esc(v.label) + '"></video>' +
    '<button type="button" class="vplay" data-play="' + key + '">' + ico('play') + '<span>Watch the film</span></button></div><p class="vcap">' + esc(v.label) + '</p></div>';
}
function wireVideos(R) {
  $$('video.vid', R).forEach(function (v) {
    if (v.__w) { return; } v.__w = 1;
    var end = +v.getAttribute('data-end') || 0;
    if (reduce) { return; }                                  /* reduced motion: the poster stays, the viewer presses the button */
    v.src = v.getAttribute('data-src');
    v.addEventListener('timeupdate', function () { if (end && v.currentTime >= end) { v.currentTime = 0.05; } });
    var pl = v.play && v.play(); if (pl && pl.catch) { pl.catch(function () { /* the browser holds autoplay: the poster stays */ }); }
  });
}
function openFilm(R, key) {
  var vm = $('#vmodal', R), fv = $('#vfull', R), v = DATA.videos[key], end = v.end || 0;
  fv.poster = v.poster; fv.src = v.url; vm.hidden = false; vm.setAttribute('data-key', key);
  fv.ontimeupdate = function () { if (end && fv.currentTime >= end) { fv.pause(); fv.currentTime = 0.05; } };
  var p = fv.play && fv.play(); if (p && p.catch) { p.catch(function () { /* the viewer presses play */ }); }
  $('.vclose', vm).focus();
}
function closeFilm(R) { var vm = $('#vmodal', R), fv = $('#vfull', R); if (!vm || vm.hidden) { return; } try { fv.pause(); } catch (e) { /* ok */ } fv.removeAttribute('src'); fv.load(); vm.hidden = true; }

/* ---------- the content blocks ---------- */
function blocksHtml(groups) {
  return groups.map(function (g) {
    return (g.h ? '<h4 class="gh4">' + esc(g.h) + '</h4>' : '') + g.blocks.map(function (b) {
      if (b.k === 'li') { return '<ul class="bl">' + b.t.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ul>'; }
      return '<p class="bp">' + rich(b.t) + '</p>';
    }).join('');
  }).join('');
}
function sizeCardHtml(z) {
  var avail = shopHas('size', sizeKey(z)), cheapest = '', n = 0, same = true, first = '', best = null;
  DATA.heights.forEach(function (h) { var p = priceOf(z, h); if (!p) { return; } n++; if (!first) { first = p; } else if (p !== first) { same = false; } var v = numOf(p); if (v !== null && (best === null || v < best)) { best = v; cheapest = p; } });
  var on = X.S.size === sizeKey(z);
  return '<button type="button" class="card sz' + (on ? ' on' : '') + '" data-pick-size="' + sizeKey(z) + '"' + (avail === false ? ' disabled' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
    '<span class="cm">' + z.w + ' × ' + z.l + ' cm</span><span class="in">' + inch(z.w) + ' × ' + inch(z.l) + ' in</span>' +
    (cheapest ? '<span class="pr">' + (n > 1 && !same ? 'from ' : '') + esc(cheapest) + '</span>' : '') + (avail === false ? '<span class="na">Not available yet</span>' : '') + '</button>';
}
function pricesMatrixHtml() {
  var out = '';
  DATA.groups.forEach(function (g) {
    out += '<div class="mx"><p class="mxt">' + esc(g.name) + '</p><div class="mxr mxh" style="--n:' + DATA.heights.length + '"><span class="mxk">Width × length</span>' + DATA.heights.map(function (h) { return '<span class="mxs"><b>' + h.cm + ' cm</b><i>' + inch(h.cm) + ' in</i></span>'; }).join('') + '</div>';
    DATA.sizes.filter(function (z) { return z.g === g.key; }).forEach(function (z) {
      out += '<div class="mxr" style="--n:' + DATA.heights.length + '"><span class="mxs"><b>' + z.w + ' × ' + z.l + ' cm</b><i>' + inch(z.w) + ' × ' + inch(z.l) + ' in</i></span>' +
        DATA.heights.map(function (h) {
          var p = priceOf(z, h), on = X.S.size === sizeKey(z) && X.S.height === String(h.cm);
          return '<button type="button" class="mxb' + (p ? '' : ' un') + '" data-pair="' + sizeKey(z) + ',' + h.cm + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (X.probing ? ' disabled' : '') + '>' + (p ? esc(p) : 'See price') + '</button>';
        }).join('') + '</div>';
    });
    out += '</div>';
  });
  var miss = missingCombos().length;
  out += '<p class="bn">' + (miss === DATA.sizes.length * DATA.heights.length ? 'Press a size and depth to see its price. Every price comes from the store.' : 'These prices are read from the store, not typed into this page.') + '</p>';
  if (miss) { out += '<button type="button" class="btn ghost" data-readall' + (X.probing ? ' disabled' : '') + '>' + (X.probing ? 'Reading prices from the store…' : 'Show every price') + '</button>'; }
  return out;
}

/* ---------- the parts (panels) of the explore mode ---------- */
function panelHtml(ch, p) {
  var k = p.kind;
  if (k === 'hero') {
    return '<div class="hero2"><div class="hero2t"><p class="eyebrow">100% Natural · Dunlop Technology · Made to order</p><h3 class="h3x">Natural latex, made for the first beds</h3><p class="lead">' + esc(DATA.product.intro) + '</p></div>' + vcardHtml('origin') + '</div>' +
      '<ul class="keys">' + DATA.keyFeatures.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>';
  }
  if (k === 'facts') {
    return '<div class="facts">' + DATA.facts.map(function (f) { return '<div class="fact"><p class="fl">' + esc(f.l) + '</p><p class="fv">' + esc(f.v) + '</p>' + (f.pills && f.pills.length ? '<p class="pills">' + f.pills.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>' : '') + '</div>'; }).join('') + '</div>';
  }
  if (k === 'read') { return '<div class="read">' + blocksHtml(p.groups) + '</div>'; }
  if (k === 'points') { return '<div class="pts">' + p.items.map(function (it, i) { return '<div class="pt"><span class="pn">' + (i + 1) + '</span><b>' + esc(it.t) + '</b><p>' + esc(it.d) + '</p></div>'; }).join('') + '</div>'; }
  if (k === 'flow') { return '<ol class="flow">' + p.steps.map(function (s, i) { return '<li><span class="pn">' + (i + 1) + '</span>' + esc(s) + '</li>'; }).join('') + '</ol><p class="bp fc">' + esc(p.close) + '</p>'; }
  if (k === 'video') { return '<div class="vrow">' + vcardHtml(p.video) + '<div class="read">' + p.text.map(function (t) { return '<p class="bp">' + rich(t) + '</p>'; }).join('') + '</div></div>'; }
  if (k === 'cover') {
    return '<div class="read cvr">' + p.text.map(function (t) { return '<p class="bp">' + rich(t) + '</p>'; }).join('') + '</div><div class="facts f3"><div class="fact"><p class="fl">Fabric</p><p class="fv">100% cotton</p></div><div class="fact"><p class="fl">Finish</p><p class="fv">Wide transverse quilting waves</p></div><div class="fact"><p class="fl">Closure</p><p class="fv">Zip along the side</p></div></div>';
  }
  return '';
}

/* ---------- the pieces of the screen ---------- */
function chapterOf(id) { for (var i = 0; i < DATA.chapters.length; i++) { if (DATA.chapters[i].id === id) { return DATA.chapters[i]; } } return DATA.chapters[0]; }
function flat() { var a = []; DATA.chapters.forEach(function (c) { c.panels.forEach(function (p, i) { a.push({ c: c, p: p, i: i }); }); }); return a; }
var STEPS = [{ id: 'size', n: 'Size', icon: 'size' }, { id: 'depth', n: 'Depth', icon: 'depth' }];
function stepValue(id) {
  if (id === 'size') { var z = X.S.size && sizeByKey(X.S.size); return z ? z.w + ' × ' + z.l + ' cm' : ''; }
  return X.S.height ? X.S.height + ' cm' : '';
}
function stepDone(id) { return id === 'size' ? X.S.size != null : X.S.height != null; }
function nextStep() { for (var i = 0; i < STEPS.length; i++) { if (!stepDone(STEPS[i].id)) { return STEPS[i]; } } return null; }
function slideFor(U) { return U.mode === 'buy' ? DRAW_SLIDE : (DATA.topicSlide[U.topic] || 0); }

function chbarHtml(U) {
  var seen = U.seen || {};
  var ex = '<section class="card2 explore" aria-label="Explore"><p class="lab">' + leaf() + 'Explore</p><div class="chips">' + DATA.chapters.map(function (c) {
    return '<button type="button" class="chip' + (U.mode === 'explore' && U.topic === c.id ? ' on' : '') + (seen[c.id] ? ' seen' : '') + '" data-topic="' + c.id + '" aria-pressed="' + (U.mode === 'explore' && U.topic === c.id ? 'true' : 'false') + '"><i class="dotc"></i>' + esc(c.label) + '</button>'; }).join('') + '</div></section>';
  var buy = '<section class="card2 order" aria-label="Select and Buy: your order"><p class="lab">' + leaf() + 'Select &amp; Buy · Your order</p><div class="steps">' + STEPS.map(function (s, i) {
    var on = U.mode === 'buy' && U.step === s.id, v = stepValue(s.id);
    return '<button type="button" class="stp' + (on ? ' on' : '') + (stepDone(s.id) ? ' done' : '') + '" data-step="' + s.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + ico(s.icon) + '<span class="st1">' + s.n + '</span><span class="st2">' + (v ? esc(v) : 'Choose') + '</span><span class="num">' + (i + 1) + '</span></button>';
  }).join('') + '<button type="button" class="rev' + (U.mode === 'buy' && U.step === 'review' ? ' on' : '') + (complete() ? ' ready' : '') + '" data-step="review">' + ico('bag') + '<span class="st1">Review</span><span class="st2">Your order</span></button></div>' +
    '<button type="button" class="allpr' + (U.mode === 'buy' && U.step === 'prices' ? ' on' : '') + '" data-step="prices">' + ico('tag') + '<span>All sizes and prices</span></button></section>';
  return ex + buy;
}
function railHtml(U) {
  if (U.mode === 'explore') {
    var ch = chapterOf(U.topic);
    return '<p class="lab">' + leaf() + 'In this topic</p><div class="tree"><div class="tnode on"><i class="dotc"></i><b>' + esc(ch.label) + '</b><span>' + ch.panels.length + ' parts in this topic</span></div><div class="kids">' +
      ch.panels.map(function (p, i) { return '<button type="button" class="kid' + (U.part === i ? ' on' : '') + '" data-part="' + i + '" aria-current="' + (U.part === i ? 'true' : 'false') + '"><span class="ltr">' + String.fromCharCode(65 + i) + '</span>' + esc(p.label) + '</button>'; }).join('') + '</div></div><p class="hint">Tap a part to move between them, forward or back.</p>';
  }
  var nm = { size: ['Size', 'size'], depth: ['Depth', 'depth'], review: ['Review', 'bag'], prices: ['All prices', 'tag'] }[U.step];
  var st = U.step === 'review' ? (complete() ? 'Ready to order' : 'Still to choose: ' + missing().join(' · ')) : U.step === 'prices' ? 'Every size and depth' : (stepDone(U.step) ? stepValue(U.step) : 'Not chosen yet');
  return '<p class="lab">' + leaf() + 'You are choosing</p><div class="tree"><div class="tnode on step">' + ico(nm[1]) + '<b>' + nm[0] + '</b><span>' + esc(st) + '</span></div></div><p class="hint">' +
    (U.step === 'size' ? 'Every size in centimetres and inches, straight from the shop.' : U.step === 'depth' ? 'Both depths share the same length and width.' : U.step === 'prices' ? 'Each price is read from the shop.' : 'Check your order, then add it to the bag.') + '</p>';
}
function buyStageHtml(U) {
  var idx = { size: 1, depth: 2, review: 3, prices: 0 }[U.step];
  var head = function (q, sub) { return '<div class="banner"><p class="crumb">' + leaf() + 'Select here · ' + (idx ? 'Step ' + idx + ' of 3 · ' : '') + { size: 'Size', depth: 'Depth', review: 'Review', prices: 'All prices' }[U.step] + '</p><h3 class="h3q">' + q + '</h3><p class="sub">' + sub + '</p></div>'; };
  var body = '', act = '';
  if (U.step === 'size') {
    body = head('How big is the cot or bed?', 'Choose your size. Every size is shown in centimetres and in inches.');
    body += '<div class="pick">' + DATA.groups.map(function (g) {
      return '<div class="grp"><p class="lab2">' + esc(g.name) + ' · ' + esc(g.sub) + '</p><div class="cards">' + DATA.sizes.filter(function (z) { return z.g === g.key; }).map(sizeCardHtml).join('') + '</div></div>'; }).join('') + '</div>' +
      '<p class="need">Cot and bed sizes differ between manufacturers: measure the <b>inside</b> of the frame.</p>';
    act = '<button type="button" class="btn" data-next="depth"' + (X.S.size ? '' : ' disabled') + '>Continue to Depth</button>';
  } else if (U.step === 'depth') {
    var z = X.S.size && sizeByKey(X.S.size);
    body = head('How deep should it be?', 'Two depths. Length and width stay the same: check the maximum mattress height your cot or bed allows.');
    body += '<div class="pick"><div class="hcards">' + DATA.heights.map(function (h) {
      var p = z ? priceOf(z, h) : '', on = X.S.height === String(h.cm), av = shopHas('height', String(h.cm));
      return '<button type="button" class="card hc' + (on ? ' on' : '') + '" data-pick-height="' + h.cm + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (av === false ? ' disabled' : '') + '><span class="bar" style="--h:' + h.cm + '"></span><span class="cm">' + h.cm + ' cm</span><span class="in">' + inch(h.cm) + ' in</span>' + (p ? '<span class="pr">' + esc(p) + '</span>' : '') + '<span class="dsc">' + esc(h.desc) + '</span></button>'; }).join('') + '</div></div>';
    act = '<button type="button" class="btn ghost" data-next="size">Back to Size</button><button type="button" class="btn" data-next="review"' + (X.S.height ? '' : ' disabled') + '>Review</button>';
  } else if (U.step === 'prices') {
    body = head('Every size and depth, one price each', 'Each price is read from the store. Press one to choose that size and depth.') + '<div class="pm">' + pricesMatrixHtml() + '</div>';
    act = '<button type="button" class="btn ghost" data-next="size">Back to Size</button>';
  } else {
    var fc = bagFace();
    body = head('Review your order', 'Everything you have chosen, with the price the store shows.');
    body += '<div class="pick"><ul class="rv">' + ORDER.map(function (o) { return '<li><span>' + o[1] + '</span><b>' + (chosenLabel(o[0]) ? esc(chosenLabel(o[0])) : '<i>Not chosen yet</i>') + '</b></li>'; }).join('') + '</ul>' +
      '<div class="rvp"><span>Price</span><b>' + (priceNow() && complete() ? esc(priceNow()) : '<i>Choose a size and a depth</i>') + '</b></div><p class="bp s">' + esc(fc.guide) + '</p>' +
      '<p class="bp s incl">Every mattress is <b>Medium</b> firmness with a <b>100% cotton</b> cover. Both are explained in Explore; there is nothing to select.</p></div>';
    act = '<button type="button" class="btn" data-bag="1"' + (fc.enabled ? '' : ' disabled') + '>' + fc.text + '</button>';
  }
  return { head: '', body: body, act: act };
}
function exploreStageHtml(U) {
  var ch = chapterOf(U.topic), p = ch.panels[U.part] || ch.panels[0], all = flat(), at = -1;
  all.forEach(function (x, i) { if (x.c.id === ch.id && x.p.id === p.id) { at = i; } });
  var nx = all[at + 1];
  var crumb = '<p class="crumb">' + leaf() + esc(ch.label) + ' <span class="ltr s">' + String.fromCharCode(65 + (ch.panels.indexOf(p))) + '</span> ' + esc(p.label) + '</p>';
  var banner = '<div class="banner"><h3 class="h3q">' + esc(p.title || ch.label) + '</h3><p class="sub">' + esc(ch.head) + '</p></div>';
  var body = (p.kind === 'hero' ? '' : banner) + '<div class="panel" data-kind="' + p.kind + '">' + panelHtml(ch, p) + '</div>';
  return { head: crumb, body: body, act: nx ? '<button type="button" class="btn dark" data-goto="' + nx.c.id + ':' + nx.i + '">Next: ' + esc(nx.p.label) + '</button>' : '<button type="button" class="btn" data-open-buy="size">Select &amp; Buy</button>' };
}
function mineHtml(U) {
  var done = ORDER.filter(function (o) { return X.S[o[0]] != null; }).length, ns = nextStep(), fc = bagFace();
  var prompt = complete() ? '<button type="button" class="start ok" data-step="review"><span class="s1">Ready</span><span class="s2">Review your order</span>' + ico('arrow') + '</button>' :
    '<button type="button" class="start" data-step="' + ns.id + '"><span class="s1">Start here</span><span class="s2">Choose your ' + ns.n + '</span>' + ico('arrow') + '</button>';
  var price = X.probing ? '<b class="pv">…</b><p class="bp s">Reading the prices from the store…</p>' : (priceNow() && X.S.size && X.S.height ? '<b class="pv">' + esc(priceNow()) + '</b><p class="bp s">The store\'s own price for this size and depth.</p>' : '<b class="pv">–</b><p class="bp s">' + (X.S.size ? 'Choose a depth to see the price.' : 'Choose a size and a depth to see the price.') + '</p>');
  var seg = ORDER.map(function (o) { return '<i class="' + (X.S[o[0]] != null ? 'on' : '') + '"></i>'; }).join('');
  return '<p class="lab">' + leaf() + 'Your selection</p>' + prompt + '<div class="prog">' + seg + '</div><p class="pl"><span>' + done + ' of ' + ORDER.length + '</span><span>Your choices</span></p>' +
    '<div class="pricec"><p class="lab2">Price</p>' + price + '</div>' +
    '<div class="picc"><p class="lab2">Your mattress</p>' + mineSliderHtml() + '</div>' +
    '<button type="button" class="bag' + (fc.ready ? ' ready' : '') + (fc.face === 'checkout' ? ' co' : '') + '" data-bag="1"' + (fc.enabled ? '' : ' disabled') + '>' + ico('bag') + '<span>' + fc.text + '</span></button><p class="guide" aria-live="polite">' + esc(fc.guide) + '</p>' +
    '<div class="brandc"><img src="' + DATA.logo + '" alt="Bio Dunlop" width="120" height="47"></div>';
}
function allHtml() {
  return '<div class="allw"><div class="allh"><p class="lab">' + leaf() + 'All topics</p><button type="button" class="x" data-close-all aria-label="Close the list">' + ico('close') + '</button></div><div class="allg">' + DATA.chapters.map(function (c) {
    return '<div class="allc"><b>' + esc(c.label) + '</b>' + c.panels.map(function (p, i) { return '<button type="button" data-goto="' + c.id + ':' + i + '"><span class="ltr s">' + String.fromCharCode(65 + i) + '</span>' + esc(p.label) + '</button>'; }).join('') + '</div>'; }).join('') + '</div></div>';
}

/* ---------- build the television ---------- */
function buildTv(R, hooks) {
  R.innerHTML = '<style>' + TV_CSS + '</style>' + TV_MARKUP.replace('{{bag}}', ico('bag')).replace('{{list}}', ico('list')).replace('{{close}}', ico('close'));
  var W = $('.ddx', R), U = { view: 'tv', mode: 'explore', topic: 'discover', part: 0, step: 'size', seen: { discover: 1 }, all: false, slide: 0 };
  $('.brand', W).innerHTML = DATA.product.brand.map(function (b) { return b[0] === 's' ? '<span>' + esc(b[1]) + '</span>' : '<' + b[0] + '>' + esc(b[1]) + '</' + b[0] + '>'; }).join(' ');
  $('.brand', W).setAttribute('aria-label', DATA.product.name);
  var el = { chbar: $('#chbar', R), rail: $('#rail', R), stageh: $('#stageh', R), answer: $('#answer', R), act: $('#act', R), mine: $('#mine', R), all: $('#all', R), galbtn: $('#galbtn', R), allbtn: $('#allbtn', R), toast: $('#toast', R) };
  function toast(t) { el.toast.textContent = t; el.toast.classList.add('on'); win.clearTimeout(toast.t); toast.t = win.setTimeout(function () { el.toast.classList.remove('on'); }, 2600); }
  function drawLive() {                                    /* the choices and the price changed: the stage and its films are not redrawn */
    el.chbar.innerHTML = chbarHtml(U); el.mine.innerHTML = mineHtml(U); wireSliders(R, U);
  }
  function draw() {
    el.chbar.innerHTML = chbarHtml(U); el.rail.innerHTML = railHtml(U);
    var st = U.mode === 'buy' ? buyStageHtml(U) : exploreStageHtml(U);
    el.stageh.innerHTML = st.head; el.answer.innerHTML = st.body; el.act.innerHTML = st.act; el.mine.innerHTML = mineHtml(U);
    el.galbtn.setAttribute('aria-pressed', U.mode === 'buy' ? 'true' : 'false'); el.allbtn.setAttribute('aria-pressed', U.all ? 'true' : 'false');
    el.all.hidden = !U.all; if (U.all) { el.all.innerHTML = allHtml(); }
    $$('[data-view]', R).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === U.view ? 'true' : 'false'); });
    wireSliders(R, U); wireVideos(R);
  }
  function live() { if (U.mode === 'buy') { draw(); } else { drawLive(); } }
  function go(mode, o) { U.mode = mode; if (o) { for (var k in o) { U[k] = o[k]; } } if (mode === 'explore') { U.seen[U.topic] = 1; } U.slide = slideFor(U); U.all = false; draw(); }
  function choose(role, key) {
    var prev = rawPrice(); X.S[role] = key; push(); U.slide = DRAW_SLIDE; draw();
    if (X.S.size && X.S.height) {
      awaitPrice(prev, function () { live(); var zz = sizeByKey(X.S.size), miss = zz ? missingCombos(zz) : []; if (miss.length) { win.setTimeout(function () { readCombos(miss, null, function () { live(); }); }, 150); } });
    }
  }
  W.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t || t.disabled) { return; }
    var v;
    if ((v = t.getAttribute('data-topic'))) { go('explore', { topic: v, part: 0 }); return; }
    if ((v = t.getAttribute('data-part'))) { go('explore', { part: +v }); return; }
    if ((v = t.getAttribute('data-goto'))) { var a = v.split(':'); go('explore', { topic: a[0], part: +a[1] }); return; }
    if ((v = t.getAttribute('data-step'))) { go('buy', { step: v }); return; }
    if ((v = t.getAttribute('data-open-buy'))) { go('buy', { step: v }); return; }
    if ((v = t.getAttribute('data-next'))) { go('buy', { step: v }); return; }
    if ((v = t.getAttribute('data-pick-size'))) { choose('size', v); return; }
    if ((v = t.getAttribute('data-pick-height'))) { choose('height', v); return; }
    if ((v = t.getAttribute('data-pair'))) { var pr = v.split(','); X.S.size = pr[0]; X.S.height = pr[1]; var prev = rawPrice(); push(); U.slide = DRAW_SLIDE; draw(); awaitPrice(prev, function () { live(); }); return; }
    if (t.hasAttribute('data-readall')) { readCombos(missingCombos(), null, function () { live(); }); draw(); return; }
    if ((v = t.getAttribute('data-play'))) { openFilm(R, v); return; }
    if (t.classList.contains('vclose')) { closeFilm(R); return; }
    if (t.hasAttribute('data-bag')) { var f = bagFace(); if (f.face === 'checkout') { openCart(); } else if (f.enabled) { if (addToBag()) { toast('Added to your bag'); } else { toast('The store\'s bag button is not ready yet. Please try again in a moment.'); } } live(); return; }
    if (t.hasAttribute('data-close-all')) { U.all = false; draw(); return; }
    if ((v = t.getAttribute('data-view'))) { if (v === 'std') { hooks.classic(); } return; }
    if (t.id === 'galbtn') { go(U.mode === 'buy' ? 'explore' : 'buy', { step: nextStep() ? nextStep().id : 'review' }); return; }
    if (t.id === 'allbtn') { U.all = !U.all; draw(); return; }
  });
  $('#vmodal', R).addEventListener('click', function (e) { if (e.target === this) { closeFilm(R); } });
  W.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!$('#vmodal', R).hidden) { closeFilm(R); } else if (U.all) { U.all = false; draw(); } } });
  X.hooks.draw = function () { if (TV) { live(); } }; X.hooks.prices = function () { if (TV) { live(); } }; X.hooks.state = function () { if (TV) { live(); } };
  draw();
  TV = { R: R, W: W, U: U, draw: draw, live: live, go: go };
  return TV;
}
