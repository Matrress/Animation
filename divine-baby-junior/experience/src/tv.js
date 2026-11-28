/* ===== the television: the Optimised Preview (same scheme as Botanic TV, for the Baby & Junior mattress) ===== */
var TV = null;                                      /* { R, W, U, draw, ... } once built */
function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function ico(name) {
  var p = {
    bag: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    size: '<path d="M3 16l9 4 9-4"/><path d="M3 11l9 4 9-4-9-4-9 4z"/>',
    height: '<path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17l4 4 4-4"/>',
    firm: '<path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2" fill="currentColor"/><circle cx="15" cy="16" r="2" fill="currentColor"/>',
    cover: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 12h16M12 5v14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (p[name] || '') + '</svg>';
}
function leaf() { return '<svg class="lf" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill="currentColor"/></svg>'; }

/* a mattress drawn in proportion, in isometric view: width, length and height in cm */
function isoSvg(L, W, Hh, o) {
  o = o || {};
  var COS = 0.8660254, SIN = 0.5, VBW = 640, VBH = o.h || 340, maxL = 200, maxW = 80, maxH = 14;
  var S = o.fit ? Math.min((VBW - 150) / ((L + W) * COS), (VBH - 70) / ((L + W) * SIN + Hh * 1.4)) : Math.min((VBW - 120) / ((maxL + maxW) * COS), (VBH - 80) / ((maxL + maxW) * SIN + maxH));
  function pt(x, y, z, cx, cy) { return [VBW / 2 + ((x - cx) - (y - cy)) * COS * S, VBH / 2 + 14 + ((x - cx) + (y - cy)) * SIN * S - z * S]; }
  function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  var cx = L / 2, cy = W / 2;
  var A = pt(0, 0, 0, cx, cy), B = pt(L, 0, 0, cx, cy), C = pt(L, W, 0, cx, cy), D = pt(0, W, 0, cx, cy);
  var A2 = pt(0, 0, Hh, cx, cy), B2 = pt(L, 0, Hh, cx, cy), C2 = pt(L, W, Hh, cx, cy), D2 = pt(0, W, Hh, cx, cy);
  var qd = '', qn = Math.max(4, Math.round(L / 16));
  for (var i = 1; i < qn; i++) { var a = pt(L * i / qn, 0, Hh, cx, cy), b = pt(L * i / qn, W, Hh, cx, cy); qd += 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
  var big = [pt(0, 0, 0, maxL / 2, maxW / 2), pt(maxL, 0, 0, maxL / 2, maxW / 2), pt(maxL, maxW, 0, maxL / 2, maxW / 2), pt(0, maxW, 0, maxL / 2, maxW / 2)];
  var off = 16, nL = [-SIN, COS], nW = [SIN, COS];
  function mv(p, n) { return [p[0] + n[0] * off, p[1] + n[1] * off]; }
  function ln(a, b) { return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
  var dL1 = mv(D, nL), dL2 = mv(C, nL), dW1 = mv(C, nW), dW2 = mv(B, nW), dH1 = [D[0] - off, D[1]], dH2 = [D2[0] - off, D2[1]];
  var dims = ln(dL1, dL2) + ln(dW1, dW2) + ln(dH1, dH2) + ln(D, dL1) + ln(C, dL2) + ln(C, dW1) + ln(B, dW2) + ln(D, dH1) + ln(D2, dH2);
  function lab(p, n, dx, dy, a, b2) { return '<text x="' + (p[0] + n[0] * dx).toFixed(1) + '" y="' + (p[1] + n[1] * dy).toFixed(1) + '" text-anchor="middle" class="d1">' + a + '</text><text x="' + (p[0] + n[0] * dx).toFixed(1) + '" y="' + (p[1] + n[1] * dy + 14).toFixed(1) + '" text-anchor="middle" class="d2">' + b2 + '</text>'; }
  var lL = lab([(D[0] + C[0]) / 2, (D[1] + C[1]) / 2], nL, 44, 36, L + ' cm', inch(L) + ' in');
  var lW = lab([(C[0] + B[0]) / 2, (C[1] + B[1]) / 2], nW, 44, 36, W + ' cm', inch(W) + ' in');
  var lH = '<text x="' + (D[0] - off - 8).toFixed(1) + '" y="' + (((D[1] + D2[1]) / 2) - 2).toFixed(1) + '" text-anchor="end" class="d1">' + Hh + ' cm</text><text x="' + (D[0] - off - 8).toFixed(1) + '" y="' + (((D[1] + D2[1]) / 2) + 12).toFixed(1) + '" text-anchor="end" class="d2">' + inch(Hh) + ' in</text>';
  return '<svg class="iso" viewBox="0 0 ' + VBW + ' ' + VBH + '" role="img" aria-label="' + esc(o.label || ('Mattress, ' + W + ' by ' + L + ' centimetres, ' + Hh + ' centimetres high, drawn to scale')) + '">' +
    (o.fit ? '' : '<polygon class="gh" points="' + pts(big) + '"/>') +
    '<polygon class="fr" points="' + pts([B, C, C2, B2]) + '"/><polygon class="fl" points="' + pts([C, D, D2, C2]) + '"/><polygon class="ft" points="' + pts([A2, B2, C2, D2]) + '"/>' +
    '<path class="qu" d="' + qd + '"/><path class="dm" d="' + dims + '"/>' + (o.nolab ? '' : lL + lW + lH) + '</svg>';
}

/* ---------- the photos (the standard description's own pictures): crops by CSS, no new files ---------- */
function slideHtml(s) {
  var map = { closed: ['closed', '53%', 1, '50%'], open: ['open', '55%', 1, '50%'], core: ['open', '12%', 1.9, '57%'], quilt: ['closed', '40%', 2, '40%'], zip: ['closed', '28%', 2.1, '68%'] };
  var m = map[s.id]; var src = DATA.images[m[0]];
  return '<div class="sl"><img src="' + src.src + '" srcset="' + src.srcset + '" sizes="(min-width:900px) 420px, 100vw" alt="' + esc(s.alt) + '" loading="lazy" decoding="async" draggable="false" style="--p:' + m[1] + ';--k:' + m[2] + ';--oy:' + m[3] + '"><span class="slc">' + esc(s.label) + '</span></div>';
}
function sliderHtml(id) {
  return '<div class="slider" data-slider="' + id + '"><div class="slv" tabindex="0" role="group" aria-label="Pictures of the mattress. Swipe or use the arrow keys.">' + DATA.slides.map(slideHtml).join('') + '</div><div class="sld" aria-hidden="false">' + DATA.slides.map(function (s, i) { return '<button type="button" class="dot' + (i ? '' : ' on') + '" data-dot="' + i + '" aria-label="Picture ' + (i + 1) + ' of ' + DATA.slides.length + '"></button>'; }).join('') + '</div></div>';
}
function wireSliders(R) {
  $$('[data-slider]', R).forEach(function (sl) {
    if (sl.__w) { return; } sl.__w = 1;
    var v = $('.slv', sl), dots = $$('.dot', sl);
    function cur() { return Math.max(0, Math.min(dots.length - 1, Math.round(v.scrollLeft / (v.clientWidth || 1)))); }
    function go(i) { i = Math.max(0, Math.min(dots.length - 1, i)); try { v.scrollTo({ left: i * v.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { v.scrollLeft = i * v.clientWidth; } }
    function mark() { var n = cur(); dots.forEach(function (d, k) { d.className = 'dot' + (k === n ? ' on' : ''); }); }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    v.addEventListener('scroll', function () { win.requestAnimationFrame(mark); }, { passive: true });
    v.addEventListener('keydown', function (e) { var k = e.key; if (k === 'ArrowRight') { e.preventDefault(); go(cur() + 1); } else if (k === 'ArrowLeft') { e.preventDefault(); go(cur() - 1); } });
    var drag = null;
    v.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button === 0) { drag = { x: e.clientX, s: v.scrollLeft, m: false }; } });
    win.addEventListener('pointermove', function (e) { if (!drag) { return; } var dx = e.clientX - drag.x; if (!drag.m && Math.abs(dx) > 4) { drag.m = true; v.classList.add('drag'); } if (drag.m) { v.scrollLeft = drag.s - dx; } });
    win.addEventListener('pointerup', function () { if (!drag) { return; } var m = drag.m; drag = null; if (m) { v.classList.remove('drag'); go(cur()); } });
  });
}

/* ---------- the content blocks ---------- */
function blocksHtml(groups) {
  return groups.map(function (g) {
    return (g.h ? '<h4 class="gh4">' + esc(g.h) + '</h4>' : '') + g.blocks.map(function (b) {
      if (b.k === 'li') { return '<ul class="bl">' + b.t.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ul>'; }
      return '<p class="bp">' + rich(b.t) + '</p>';
    }).join('');
  }).join('');
}
function priceTagHtml(p) { return p ? '<span class="pr">' + esc(p) + '</span>' : ''; }
function sizeCardHtml(z, pick) {
  var avail = shopHas('size', sizeKey(z)), cheapest = '', n = 0, same = true, first = '', best = null;
  DATA.heights.forEach(function (h) { var p = priceOf(z, h); if (!p) { return; } n++; if (!first) { first = p; } else if (p !== first) { same = false; } var v = numOf(p); if (v !== null && (best === null || v < best)) { best = v; cheapest = p; } });
  var on = X.S.size === sizeKey(z);
  return '<button type="button" class="card sz' + (on ? ' on' : '') + '" ' + (pick ? 'data-pick-size="' + sizeKey(z) + '"' : 'data-go-size="' + sizeKey(z) + '"') + (avail === false ? ' disabled' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
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
  out += '<p class="bn">' + (miss === DATA.sizes.length * DATA.heights.length ? 'Press a size and height to see its price. Every price comes from the store.' : 'These prices are read from the store, not typed into this page.') + '</p>';
  if (miss) { out += '<button type="button" class="btn ghost" data-readall' + (X.probing ? ' disabled' : '') + '>' + (X.probing ? 'Reading prices from the store…' : 'Show every price') + '</button>'; }
  return out;
}

/* ---------- the parts (panels) of the explore mode ---------- */
function panelHtml(ch, p) {
  var k = p.kind;
  if (k === 'hero') {
    return '<div class="hero2"><div class="hero2t"><p class="eyebrow">100% Natural · Dunlop Technology · Made to order</p><h3 class="h3x">' + esc(DATA.product.heroHead || 'One piece of natural latex') + '</h3><p class="lead">' + esc(DATA.product.intro) + '</p></div>' +
      '<div class="media">' + sliderHtml('hero') + '</div></div>' +
      '<ul class="keys">' + DATA.keyFeatures.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>';
  }
  if (k === 'facts') {
    return '<div class="facts">' + DATA.facts.map(function (f) { return '<div class="fact"><p class="fl">' + esc(f.l) + '</p><p class="fv">' + esc(f.v) + '</p>' + (f.pills && f.pills.length ? '<p class="pills">' + f.pills.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>' : '') + '</div>'; }).join('') + '</div>';
  }
  if (k === 'read') { return '<div class="read">' + blocksHtml(p.groups) + '</div>'; }
  if (k === 'sizes') {
    var g = groupByKey(p.group);
    return '<p class="bp">' + esc(g.sub) + '. Every size in centimetres and inches, width × length.</p><div class="cards">' + DATA.sizes.filter(function (z) { return z.g === p.group; }).map(function (z) { return sizeCardHtml(z, false); }).join('') + '</div>' +
      '<div class="isobox">' + (function () { var z = DATA.sizes.filter(function (q) { return q.g === p.group; }); var b = z[z.length - 1]; return isoSvg(b.l, b.w, 10, { h: 300, fit: true, label: 'The largest ' + g.name + ' drawn in proportion: ' + b.w + ' by ' + b.l + ' centimetres' }); }()) + '<p class="cap">The largest ' + esc(g.name) + ', ' + DATA.sizes.filter(function (q) { return q.g === p.group; }).slice(-1).map(function (b) { return b.w + ' × ' + b.l + ' cm (' + inch(b.w) + ' × ' + inch(b.l) + ' in)'; })[0] + ', drawn in proportion.</p></div>' +
      '<p class="act2"><button type="button" class="btn" data-open-buy="size">Choose your size</button></p>';
  }
  if (k === 'heights') {
    return '<p class="bp">Length and width stay exactly the same. Only the height of the latex core changes.</p><div class="hts">' + DATA.heights.map(function (h) {
      return '<div class="ht"><span class="bar" style="--h:' + h.cm + '"></span><p class="num">' + h.cm + '<span>cm</span></p><p class="bp s">' + inch(h.cm) + ' in</p><p class="bp s">' + esc(h.desc) + '</p></div>'; }).join('') + '</div><p class="cap">Drawn to scale against each other.</p>' +
      '<p class="act2"><button type="button" class="btn" data-open-buy="height">Choose your height</button></p>';
  }
  if (k === 'cover') {
    return '<div class="duo"><figure class="ph"><div class="crop"><img src="' + DATA.images.quilt.src + '" alt="Close-up of the quilted 100% cotton cover with its wide transverse waves" loading="lazy"></div><figcaption>Wide quilted waves</figcaption></figure>' +
      '<figure class="ph"><div class="crop"><img src="' + DATA.images.zip.src + '" alt="Close-up of the zip puller and the side panel of the cover" loading="lazy"></div><figcaption>A zip along the side</figcaption></figure></div>' +
      '<div class="facts f3"><div class="fact"><p class="fl">Fabric</p><p class="fv">100% cotton</p></div><div class="fact"><p class="fl">Finish</p><p class="fv">Wide transverse quilting waves</p></div><div class="fact"><p class="fl">Closure</p><p class="fv">Zip along the side</p></div></div>';
  }
  if (k === 'core') {
    return '<div class="duo one"><figure class="ph wide"><div class="crop"><img src="' + DATA.images.latex.src + '" alt="Close-up of the one-piece natural Dunlop latex core with its rows of ventilation channels" loading="lazy"></div><figcaption>One piece of natural Dunlop latex, with ventilation channels you can see</figcaption></figure></div>' +
      '<div class="read"><p class="bp">A single moulded block of **natural Dunlop latex**, with no glued layers.</p></div>'.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }
  if (k === 'prices') { return '<div class="read"><p class="bp">Each price is read from the store\'s own options for this product. Press a price to choose that size and height.</p></div><div class="pm">' + pricesMatrixHtml() + '</div>'; }
  return '';
}

/* ---------- the pieces of the screen ---------- */
function chapterOf(id) { for (var i = 0; i < DATA.chapters.length; i++) { if (DATA.chapters[i].id === id) { return DATA.chapters[i]; } } return DATA.chapters[0]; }
function flat() { var a = []; DATA.chapters.forEach(function (c) { c.panels.forEach(function (p, i) { a.push({ c: c, p: p, i: i }); }); }); return a; }
var STEPS = [
  { id: 'size', n: 'Size', icon: 'size', fixed: false },
  { id: 'height', n: 'Height', icon: 'height', fixed: false },
  { id: 'firmness', n: 'Firmness', icon: 'firm', fixed: true },
  { id: 'cover', n: 'Cover', icon: 'cover', fixed: true }
];
function stepValue(id) {
  if (id === 'size') { var z = X.S.size && sizeByKey(X.S.size); return z ? z.w + ' × ' + z.l + ' cm' : ''; }
  if (id === 'height') { return X.S.height ? X.S.height + ' cm' : ''; }
  return DATA.fixed[id].value;
}
function stepDone(id) { return id === 'size' ? X.S.size != null : id === 'height' ? X.S.height != null : true; }
function nextStep() { for (var i = 0; i < STEPS.length; i++) { if (!STEPS[i].fixed && !stepDone(STEPS[i].id)) { return STEPS[i]; } } return null; }

function chbarHtml(U) {
  var seen = U.seen || {};
  var ex = '<section class="card2 explore" aria-label="Explore"><p class="lab">' + leaf() + 'Explore</p><div class="chips">' + DATA.chapters.map(function (c) {
    return '<button type="button" class="chip' + (U.mode === 'explore' && U.topic === c.id ? ' on' : '') + (seen[c.id] ? ' seen' : '') + '" data-topic="' + c.id + '" aria-pressed="' + (U.mode === 'explore' && U.topic === c.id ? 'true' : 'false') + '"><i class="dotc"></i>' + esc(c.label) + '</button>'; }).join('') + '</div></section>';
  var done = STEPS.filter(function (s) { return stepDone(s.id); }).length;
  var buy = '<section class="card2 order" aria-label="Select and Buy: your order"><p class="lab">' + leaf() + 'Select &amp; Buy · Your order</p><div class="steps">' + STEPS.map(function (s, i) {
    var on = U.mode === 'buy' && U.step === s.id, v = stepValue(s.id);
    return '<button type="button" class="stp' + (on ? ' on' : '') + (stepDone(s.id) ? ' done' : '') + (s.fixed ? ' fx' : '') + '" data-step="' + s.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + ico(s.icon) + '<span class="st1">' + s.n + '</span><span class="st2">' + (v ? esc(v) : 'Choose') + '</span><span class="num">' + (i + 1) + '</span></button>';
  }).join('') + '<button type="button" class="rev' + (U.mode === 'buy' && U.step === 'review' ? ' on' : '') + (complete() ? ' ready' : '') + '" data-step="review">' + ico('bag') + '<span class="st1">Review</span><span class="st2">Your order</span></button></div></section>';
  return ex + buy;
}
function railHtml(U) {
  if (U.mode === 'explore') {
    var ch = chapterOf(U.topic);
    return '<p class="lab">' + leaf() + 'In this topic</p><div class="tree"><div class="tnode on"><i class="dotc"></i><b>' + esc(ch.label) + '</b><span>' + ch.panels.length + ' parts in this topic</span></div><div class="kids">' +
      ch.panels.map(function (p, i) { return '<button type="button" class="kid' + (U.part === i ? ' on' : '') + '" data-part="' + i + '" aria-current="' + (U.part === i ? 'true' : 'false') + '"><span class="ltr">' + String.fromCharCode(65 + i) + '</span>' + esc(p.label) + '</button>'; }).join('') + '</div></div><p class="hint">Tap a part to move between them, forward or back.</p>';
  }
  var cur = U.step === 'review' ? { n: 'Review', icon: 'bag' } : STEPS.filter(function (s) { return s.id === U.step; })[0];
  var st = U.step === 'review' ? (complete() ? 'Ready to order' : 'Still to choose: ' + missing().join(' · ')) : (stepDone(U.step) ? stepValue(U.step) : 'Not chosen yet');
  return '<p class="lab">' + leaf() + 'You are choosing</p><div class="tree"><div class="tnode on step">' + ico(cur.icon) + '<b>' + cur.n + '</b><span>' + esc(st) + '</span></div></div><p class="hint">' +
    (U.step === 'size' ? 'Every size in centimetres and inches, straight from the shop.' : U.step === 'height' ? 'Both heights share the same length and width.' : U.step === 'review' ? 'Check your order, then add it to the bag.' : 'This choice is fixed for this model.') + '</p>';
}
function buyStageHtml(U) {
  var idx = U.step === 'review' ? 5 : STEPS.map(function (s) { return s.id; }).indexOf(U.step) + 1;
  var head = function (q, sub) { return '<div class="banner"><p class="crumb">' + leaf() + 'Select here · Step ' + idx + ' of 5 · ' + (U.step === 'review' ? 'Review' : STEPS[idx - 1].n) + '</p><h3 class="h3q">' + q + '</h3><p class="sub">' + sub + '</p></div>'; };
  var body = '', act = '', ns = nextStep();
  if (U.step === 'size') {
    var fam = U.family || (X.S.size && sizeByKey(X.S.size).g) || null;
    body = head('How big is the cot or bed?', 'Choose your size. Every size is shown in centimetres and in inches.');
    body += '<div class="pick"><p class="lab2">Choose your size group</p><div class="fam">' + DATA.groups.map(function (g) {
      return '<button type="button" class="card fm' + (fam === g.key ? ' on' : '') + '" data-family="' + g.key + '" aria-pressed="' + (fam === g.key ? 'true' : 'false') + '"><span class="fm1">' + esc(g.name) + '</span><span class="fm2">' + DATA.sizes.filter(function (z) { return z.g === g.key; }).length + ' sizes</span><span class="fm3">' + esc(g.sub) + '</span></button>'; }).join('') + '</div></div>';
    if (fam) { body += '<div class="pick"><p class="lab2">' + esc(groupByKey(fam).name) + ' · width × length</p><div class="cards">' + DATA.sizes.filter(function (z) { return z.g === fam; }).map(function (z) { return sizeCardHtml(z, true); }).join('') + '</div></div>'; }
    body += '<p class="need">Cot and bed sizes differ between manufacturers: measure the <b>inside</b> of the frame.</p>';
    act = '<button type="button" class="btn" data-next="height"' + (X.S.size ? '' : ' disabled') + '>Continue to Height</button>';
  } else if (U.step === 'height') {
    var z = X.S.size && sizeByKey(X.S.size);
    body = head('How high should it be?', 'Two heights. Length and width stay the same; check the maximum mattress height your cot or bed allows.');
    body += '<div class="pick"><div class="hcards">' + DATA.heights.map(function (h) {
      var p = z ? priceOf(z, h) : '', on = X.S.height === String(h.cm), av = shopHas('height', String(h.cm));
      return '<button type="button" class="card hc' + (on ? ' on' : '') + '" data-pick-height="' + h.cm + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (av === false ? ' disabled' : '') + '><span class="bar" style="--h:' + h.cm + '"></span><span class="cm">' + h.cm + ' cm</span><span class="in">' + inch(h.cm) + ' in</span>' + (p ? '<span class="pr">' + esc(p) + '</span>' : '') + '<span class="dsc">' + esc(h.desc) + '</span></button>'; }).join('') + '</div></div>';
    act = '<button type="button" class="btn ghost" data-next="size">Back to Size</button><button type="button" class="btn" data-next="firmness"' + (X.S.height ? '' : ' disabled') + '>Continue</button>';
  } else if (U.step === 'firmness' || U.step === 'cover') {
    var f = DATA.fixed[U.step];
    body = head(U.step === 'firmness' ? 'Firmness: Medium' : 'Cover: 100% cotton', 'This choice is fixed for the Baby &amp; Junior mattress, so there is nothing to select.');
    body += '<div class="pick"><div class="fixed">' + ico('lock') + '<div><b>' + esc(f.value) + '</b><p class="bp">' + esc(f.note) + '</p>' + (U.step === 'firmness' ? '<p class="bp s">Our adult, weight-based firmness recommendations do not apply to babies and children and are not used for this range.</p>' : '<p class="bp s">Follow the care instructions supplied with your mattress.</p>') + '</div></div></div>';
    act = '<button type="button" class="btn" data-next="' + (U.step === 'firmness' ? 'cover' : 'review') + '">Continue' + (U.step === 'cover' ? ' to Review' : '') + '</button>';
  } else {
    var fc = bagFace();
    body = head('Review your order', 'Everything you have chosen, with the price the store shows.');
    body += '<div class="pick"><ul class="rv">' + ORDER.map(function (o) { return '<li><span>' + o[1] + '</span><b>' + (chosenLabel(o[0]) ? esc(chosenLabel(o[0])) : '<i>Not chosen yet</i>') + '</b></li>'; }).join('') +
      '<li><span>Firmness</span><b>Medium <i>· fixed</i></b></li><li><span>Cover</span><b>100% cotton <i>· fixed</i></b></li></ul>' +
      '<div class="rvp"><span>Price</span><b>' + (priceNow() && complete() ? esc(priceNow()) : '<i>Choose a size and a height</i>') + '</b></div><p class="bp s">' + esc(fc.guide) + '</p></div>';
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
  var body = (p.kind === 'hero') ? '' : banner;
  body += '<div class="panel" data-kind="' + p.kind + '">' + panelHtml(ch, p) + '</div>';
  return { head: crumb, body: body, act: nx ? '<button type="button" class="btn dark" data-goto="' + nx.c.id + ':' + nx.i + '">Next: ' + esc(nx.p.label) + '</button>' : '<button type="button" class="btn" data-open-buy="size">Select &amp; Buy</button>' };
}
function mineHtml(U) {
  var done = ORDER.filter(function (o) { return X.S[o[0]] != null; }).length, ns = nextStep(), fc = bagFace();
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height);
  var prompt = complete() ? '<button type="button" class="start ok" data-step="review"><span class="s1">Ready</span><span class="s2">Review your order</span>' + ico('arrow') + '</button>' :
    '<button type="button" class="start" data-step="' + ns.id + '"><span class="s1">Start here</span><span class="s2">Choose your ' + ns.n + '</span>' + ico('arrow') + '</button>';
  var price = X.probing ? '<b class="pv">…</b><p class="bp s">Reading the prices from the store…</p>' : (priceNow() && X.S.size && X.S.height ? '<b class="pv">' + esc(priceNow()) + '</b><p class="bp s">The store\'s own price for this size and height.</p>' : '<b class="pv">–</b><p class="bp s">' + (X.S.size ? 'Choose a height to see the price.' : 'Choose a size and a height to see the price.') + '</p>');
  var seg = ORDER.map(function (o, i) { return '<i class="' + (X.S[o[0]] != null ? 'on' : '') + '"></i>'; }).join('');
  return '<p class="lab">' + leaf() + 'Your selection</p>' + prompt + '<div class="prog">' + seg + '</div><p class="pl"><span>' + done + ' of ' + ORDER.length + '</span><span>Your choices</span></p>' +
    '<div class="pricec"><p class="lab2">Price</p>' + price + '</div>' +
    '<div class="prev" aria-label="Your mattress">' + isoSvg(z ? z.l : 120, z ? z.w : 60, h ? h.cm : 10, { h: 260, nolab: true, fit: true }) + '<p class="cap">' + (z && h ? '<b>' + esc(groupByKey(z.g).name) + '</b> · ' + z.w + ' × ' + z.l + ' cm (' + inch(z.w) + ' × ' + inch(z.l) + ' in)<br>' + h.cm + ' cm (' + inch(h.cm) + ' in) high' : 'Example only: choose a size and a height') + '</p></div>' +
    '<button type="button" class="bag' + (fc.ready ? ' ready' : '') + (fc.face === 'checkout' ? ' co' : '') + '" data-bag="1"' + (fc.enabled ? '' : ' disabled') + '>' + ico('bag') + '<span>' + fc.text + '</span></button><p class="guide" aria-live="polite">' + esc(fc.guide) + '</p>' +
    '<div class="brandc"><img src="' + DATA.logo + '" alt="Bio Dunlop" width="120" height="47"></div>';
}
function allHtml() {
  return '<div class="allw"><div class="allh"><p class="lab">' + leaf() + 'All topics</p><button type="button" class="x" data-close-all aria-label="Close the list">' + ico('close') + '</button></div><div class="allg">' + DATA.chapters.map(function (c) {
    return '<div class="allc"><b>' + esc(c.label) + '</b>' + c.panels.map(function (p, i) { return '<button type="button" data-goto="' + c.id + ':' + i + '"><span class="ltr s">' + String.fromCharCode(65 + i) + '</span>' + esc(p.label) + '</button>'; }).join('') + '</div>'; }).join('') + '</div></div>';
}

/* ---------- build the television ---------- */
function buildTv(R, hooks) {
  R.innerHTML = '<style>' + TV_CSS + '</style>' + TV_MARKUP;
  var W = $('.ddx', R), U = { view: 'tv', mode: 'explore', topic: 'discover', part: 0, step: 'size', family: null, seen: { discover: 1 }, all: false };
  W.querySelector('.brand').innerHTML = DATA.product.brand.map(function (b) { return b[0] === 's' ? '<span>' + esc(b[1]) + '</span>' : '<' + b[0] + '>' + esc(b[1]) + '</' + b[0] + '>'; }).join(' ');
  W.querySelector('.brand').setAttribute('aria-label', DATA.product.name);
  var el = { chbar: $('#chbar', R), rail: $('#rail', R), stageh: $('#stageh', R), answer: $('#answer', R), act: $('#act', R), mine: $('#mine', R), all: $('#all', R), galbtn: $('#galbtn', R), allbtn: $('#allbtn', R), toast: $('#toast', R) };
  function toast(t) { el.toast.textContent = t; el.toast.classList.add('on'); win.clearTimeout(toast.t); toast.t = win.setTimeout(function () { el.toast.classList.remove('on'); }, 2600); }
  function draw() {
    el.chbar.innerHTML = chbarHtml(U); el.rail.innerHTML = railHtml(U);
    var st = U.mode === 'buy' ? buyStageHtml(U) : exploreStageHtml(U);
    el.stageh.innerHTML = st.head; el.answer.innerHTML = st.body; el.act.innerHTML = st.act; el.mine.innerHTML = mineHtml(U);
    el.galbtn.setAttribute('aria-pressed', U.mode === 'buy' ? 'true' : 'false'); el.allbtn.setAttribute('aria-pressed', U.all ? 'true' : 'false');
    el.all.hidden = !U.all; if (U.all) { el.all.innerHTML = allHtml(); }
    $$('[data-view]', R).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === U.view ? 'true' : 'false'); });
    wireSliders(R);
  }
  function go(mode, o) { U.mode = mode; if (o) { for (var k in o) { U[k] = o[k]; } } if (mode === 'explore') { U.seen[U.topic] = 1; } U.all = false; draw(); }
  /* choosing: the shop's dropdowns follow, then the shop's price is read back */
  function choose(role, key) {
    var prev = rawPrice(); X.S[role] = key; X.S.bagged = X.S.bagged; push();
    draw();
    var z = X.S.size && sizeByKey(X.S.size);
    if (X.S.size && X.S.height) {
      awaitPrice(prev, function () { draw(); var zz = sizeByKey(X.S.size); var miss = zz ? missingCombos(zz) : []; if (miss.length) { win.setTimeout(function () { readCombos(miss, null, function () { draw(); }); }, 150); } });
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
    if ((v = t.getAttribute('data-family'))) { U.family = v; draw(); return; }
    if ((v = t.getAttribute('data-pick-size'))) { choose('size', v); return; }
    if ((v = t.getAttribute('data-go-size'))) { go('buy', { step: 'size', family: sizeByKey(v).g }); return; }
    if ((v = t.getAttribute('data-pick-height'))) { choose('height', v); return; }
    if ((v = t.getAttribute('data-pair'))) { var pr = v.split(','); X.S.size = pr[0]; X.S.height = pr[1]; var prev = rawPrice(); push(); draw(); awaitPrice(prev, function () { draw(); }); return; }
    if (t.hasAttribute('data-readall')) { readCombos(missingCombos(), null, function () { draw(); }); draw(); return; }
    if (t.hasAttribute('data-bag')) { var f = bagFace(); if (f.face === 'checkout') { openCart(); } else if (f.enabled) { if (addToBag()) { toast('Added to your bag'); } else { toast('The store\'s bag button is not ready yet. Please try again in a moment.'); } } draw(); return; }
    if (t.hasAttribute('data-close-all')) { U.all = false; draw(); return; }
    if ((v = t.getAttribute('data-view'))) { if (v === 'std') { hooks.classic(); } return; }
    if (t.id === 'galbtn') { go(U.mode === 'buy' ? 'explore' : 'buy', { step: nextStep() ? nextStep().id : 'review' }); return; }
    if (t.id === 'allbtn') { U.all = !U.all; draw(); return; }
  });
  W.addEventListener('keydown', function (e) { if (e.key === 'Escape' && U.all) { U.all = false; draw(); } });
  X.hooks.draw = function () { if (TV) { draw(); } }; X.hooks.prices = function () { if (TV) { draw(); } }; X.hooks.state = function () { if (TV) { draw(); } };
  draw();
  TV = { R: R, W: W, U: U, draw: draw, go: go };
  return TV;
}
