/* Guided configuration (PREVIEW, NOT DEPLOYED). Three shells over ONE set of steps and ONE adapter.
   Reads and writes Ecwid only through DDSync. Computes no price. Firmness guidance comes from DDFirmnessCore, the rule
   extracted from the published Firmness Navigator (see tools/build-premium-preview.mjs). Approved wording comes from
   window.DDDATA, which the build reads from the approved description; interface words are the only words written here. */
(function (w, d) {
  'use strict';
  var D = w.DDDATA, core = w.DDFirmnessCore, sync = w.DDSync.create();
  var STEPS = ['size', 'firmness', 'depth', 'cover', 'review'];
  var TITLES = { size: 'Size', firmness: 'Firmness', depth: 'Depth', cover: 'Cover', review: 'Review' };
  var q = new URLSearchParams(location.search);
  var S = { concept: q.get('concept') || 'sheet', open: false, step: 'size', min: false, weight: null, height: null, native: null, galleryOpen: false, ready: false, lastSource: '' };
  var root = d.getElementById('cfg');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s, r) { return (r || d).querySelector(s); }

  /* ---------- reading Ecwid's answers into panel terms ---------- */
  function dims(label) { var m = /(\d{2,3})\s*[x×]\s*(\d{2,3})/.exec(label); return m ? [+m[1], +m[2]] : null; }
  function sizeName(label) { var m = /^(.*?)(?:\s*[–-]?\s*\d{2,3}\s*[x×])/.exec(label); return (m ? m[1] : label).replace(/[–\-\s]+$/, ''); }
  function sizeGroup(label) {
    if (/contact us/i.test(label)) return 'Other';
    if (/Super King/i.test(label)) return 'Super King'; if (/Emperor/i.test(label)) return 'Emperor'; if (/King/i.test(label)) return 'King';
    if (/Double/i.test(label)) return 'Double'; return 'Single';
  }
  function fKey(label) { var L = label.toUpperCase(); return /EXTRA FIRM/.test(L) ? 'xfirm' : /FIRM/.test(L) ? 'firm' : /MEDIUM/.test(L) ? 'medium' : /SOFT/.test(L) ? 'soft' : ''; }
  function cKey(label) { var L = label.toLowerCase(); return /cashmere/.test(L) ? 'cashmere' : /aloe/.test(L) ? 'aloe' : /wool/.test(L) ? 'wool' : /cotton/.test(L) ? 'cotton' : ''; }
  function dKey(label) { var m = /(\d{2})\s*cm/.exec(label); return m ? m[1] : ''; }
  function short(role, label) {
    if (!label) return '';
    if (role === 'size') { var dm = dims(label); return /contact us/i.test(label) ? 'Another size' : sizeName(label) + (dm ? ' ' + dm[0] + '×' + dm[1] : ''); }
    if (role === 'depth') return dKey(label) + ' cm';
    if (role === 'firmness') { var k = fKey(label); return k === 'xfirm' ? 'Extra Firm' : k.charAt(0).toUpperCase() + k.slice(1); }
    var c = D.covers.filter(function (x) { return x.key === cKey(label); })[0]; return c ? c.name : label;
  }
  function chosen(role) { var o = S.native && S.native.options[role]; return o && o.chosen ? o : null; }
  function doneCount() { return ['size', 'firmness', 'depth', 'cover'].filter(function (r) { return chosen(r); }).length; }
  function nextOpen() { for (var i = 0; i < 4; i++) if (!chosen(STEPS[i])) return STEPS[i]; return 'review'; }

  /* ---------- step bodies ---------- */
  function why(step) { return { size: D.why.size, firmness: D.why.firmness, depth: D.why.depth, cover: D.why.cover, review: D.why.review }[step]; }
  function bodySize() {
    var o = S.native.options.size, groups = {}, order = ['Single', 'Double', 'King', 'Super King', 'Emperor', 'Other'];
    o.choices.forEach(function (c) { var g = sizeGroup(c.label); (groups[g] = groups[g] || []).push(c); });
    var cur = chosen('size'), cd = cur && dims(cur.label), h = '';
    h += '<div class="foot">' + footprint(cd) + '<div class="foot__t">' + (cur ? esc(short('size', cur.label)) + '<small>cm</small>' : 'Choose a size') + '</div></div>';
    order.forEach(function (g) {
      if (!groups[g]) return;
      h += '<div class="grp"><div class="grp__t">' + (g === 'Other' ? 'Not listed' : g) + '</div><div class="chips">';
      groups[g].forEach(function (c) {
        var dm = dims(c.label), on = cur && cur.value === c.value;
        h += '<button class="chip' + (on ? ' on' : '') + '" data-act="pick" data-role="size" data-value="' + esc(c.value) + '" aria-pressed="' + !!on + '"><span class="chip__n">' + esc(g === 'Other' ? 'For more options, contact us' : sizeName(c.label)) + '</span>' + (dm ? '<span class="chip__d">' + dm[0] + ' × ' + dm[1] + ' cm</span>' : '') + '</button>';
      });
      h += '</div></div>';
    });
    return h;
  }
  function footprint(cd) {
    var W = cd ? cd[0] : 150, L = cd ? cd[1] : 200, sc = 0.32, w = Math.max(30, W * sc), l = Math.max(40, L * sc * 0.6);
    return '<svg class="fp" viewBox="0 0 120 84" aria-hidden="true"><rect x="' + (60 - w / 2) + '" y="' + (42 - l / 2) + '" width="' + w + '" height="' + l + '" rx="5" class="fp__r' + (cd ? ' on' : '') + '"/><text x="60" y="' + (42 + 4) + '" class="fp__t">' + (cd ? W + '×' + L : '') + '</text></svg>';
  }
  function bodyFirm() {
    var o = S.native.options.firmness, cur = chosen('firmness'), curK = cur ? fKey(cur.label) : '';
    var w0 = S.weight == null ? 70 : S.weight, h0 = S.height == null ? 170 : S.height, rec = null;
    if (S.weight != null && S.height != null) rec = core.recommend(S.weight, S.height);
    var recK = rec ? { 'SOFT': 'soft', 'MEDIUM': 'medium', 'FIRM': 'firm', 'EXTRA FIRM': 'xfirm' }[rec.display] : '';
    var h = '<div class="fg"><div class="fg__row"><label for="fw">Body weight</label><output>' + (S.weight == null ? '—' : S.weight + ' kg') + '</output></div><input id="fw" type="range" min="' + core.limits.weight[0] + '" max="' + core.limits.weight[1] + '" value="' + w0 + '" data-act="body" data-k="weight" aria-label="Body weight in kilograms">' +
      '<div class="fg__row"><label for="fh">Height</label><output>' + (S.height == null ? '—' : S.height + ' cm') + '</output></div><input id="fh" type="range" min="' + core.limits.height[0] + '" max="' + core.limits.height[1] + '" value="' + h0 + '" data-act="body" data-k="height" aria-label="Height in centimetres"></div>';
    h += scale(recK, curK);
    h += '<p class="guide">' + (rec ? 'Guidance for your body: <b>' + esc(rec.display.charAt(0) + rec.display.slice(1).toLowerCase()) + '</b>.' + (rec.second ? ' ' + esc(D.firmness.decision2) : '') : 'Move both sliders for guidance from the Divine Firmness Navigator, or choose directly below.') + '</p>';
    h += '<div class="fcards">';
    D.firmness.cards.forEach(function (c) {
      var ch = o.choices.filter(function (x) { return fKey(x.label) === c.key; })[0]; if (!ch) return;
      h += '<button class="fcard' + (curK === c.key ? ' on' : '') + (recK === c.key ? ' rec' : '') + '" data-act="pick" data-role="firmness" data-value="' + esc(ch.value) + '" aria-pressed="' + (curK === c.key) + '"><span class="fcard__n">' + esc(c.name) + (recK === c.key ? '<i>for you</i>' : '') + '</span><span class="fcard__d">' + esc(c.desc) + '</span></button>';
    });
    h += '</div><p class="fine">' + esc(D.firmness.notice) + ' <a href="https://divinedunlop.com/firmnesses" target="_blank" rel="noopener">Full Firmness Navigator</a></p>';
    return h;
  }
  function scale(recK, curK) {
    var seg = [['soft', 'Soft'], ['medium', 'Medium'], ['firm', 'Firm'], ['xfirm', 'Extra Firm']];
    return '<svg class="scale" viewBox="0 0 320 46" role="img" aria-label="Firmness scale">' + seg.map(function (s, i) {
      var x = i * 80, fill = ['#CBE3EA', '#A9CBD3', '#86B1B9', '#5E8D95'][i];
      return '<rect x="' + (x + 1) + '" y="8" width="78" height="14" rx="7" fill="' + fill + '"/>' + (recK === s[0] ? '<path d="M' + (x + 40) + ' 3 l6 -6 h-12z" fill="#364849" transform="translate(0 6)"/>' : '') + (curK === s[0] ? '<circle cx="' + (x + 40) + '" cy="15" r="5" fill="#364849"/><circle cx="' + (x + 40) + '" cy="15" r="2" fill="#fff"/>' : '') + '<text x="' + (x + 40) + '" y="40" class="scale__t">' + s[1] + '</text>';
    }).join('') + '</svg>';
  }
  function bodyDepth() {
    var o = S.native.options.depth, cur = chosen('depth'), curK = cur ? dKey(cur.label) : '', h = '<div class="dbars">';
    D.depths.forEach(function (x) {
      var ch = o.choices.filter(function (c) { return dKey(c.label) === x.cm; })[0]; if (!ch) return;
      h += '<button class="dcard' + (curK === x.cm ? ' on' : '') + '" data-act="pick" data-role="depth" data-value="' + esc(ch.value) + '" aria-pressed="' + (curK === x.cm) + '"><span class="dcard__bar" style="height:' + (x.cm * 2.2) + 'px"><b>' + x.cm + '</b></span><span class="dcard__n">' + esc(x.name) + '</span><span class="dcard__i">' + esc(x.inch) + '</span></button>';
    });
    h += '</div>';
    var sel = D.depths.filter(function (x) { return x.cm === curK; })[0];
    h += '<p class="guide">' + (sel ? esc(sel.desc) : esc(D.depthSub)) + '</p><p class="fine">' + esc(D.coverFacts.height) + '</p>';
    return h;
  }
  function pattern(k) { return ({ cotton: 'url(#p-cotton)', wool: 'url(#p-wool)', aloe: 'url(#p-aloe)', cashmere: 'url(#p-cash)' })[k]; }
  function bodyCover() {
    var o = S.native.options.cover, cur = chosen('cover'), curK = cur ? cKey(cur.label) : '', h = '<div class="ccards">';
    D.covers.forEach(function (c) {
      var ch = o.choices.filter(function (x) { return cKey(x.label) === c.key; })[0]; if (!ch) return;
      h += '<button class="ccard' + (curK === c.key ? ' on' : '') + '" data-act="pick" data-role="cover" data-value="' + esc(ch.value) + '" aria-pressed="' + (curK === c.key) + '"><svg class="ccard__sw" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="12" fill="' + pattern(c.key) + '"/></svg><span class="ccard__t"><b>' + esc(c.name) + '</b><i>' + esc(c.tag) + '</i><span>' + esc(c.body) + '</span></span></button>';
    });
    return h + '</div><p class="fine">' + esc(D.coverSub) + '</p><p class="fine tex">Cover textures load only when this step opens (placeholders shown here).</p>';
  }
  function bodyReview() {
    var rows = ['size', 'firmness', 'depth', 'cover'], n = doneCount(), h = '<ul class="rv">';
    rows.forEach(function (r) { var c = chosen(r); h += '<li class="' + (c ? 'ok' : '') + '"><span>' + TITLES[r] + '</span><b>' + (c ? esc(short(r, c.label)) : 'Not chosen yet') + '</b><button data-act="go" data-step="' + r + '">' + (c ? 'Change' : 'Choose') + '</button></li>'; });
    h += '</ul><div class="ready ' + (n === 4 ? 'yes' : '') + '"><div class="ready__p"><small>Your price, from Ecwid</small><b>' + esc(S.native.price) + '</b></div><div class="ready__s">' + (n === 4 ? 'Your mattress is configured. Add it to your bag with Ecwid’s own button.' : (4 - n) + ' choice' + (4 - n > 1 ? 's' : '') + ' left to make.') + '</div></div>';
    h += '<button class="btn btn--p" data-act="native">' + (n === 4 ? 'Go to Add to Bag' : 'See Ecwid’s options') + '</button>';
    D.reviewFacts.forEach(function (f) { h += '<p class="fine">' + esc(f) + '</p>'; });
    return h;
  }
  var BODY = { size: bodySize, firmness: bodyFirm, depth: bodyDepth, cover: bodyCover, review: bodyReview };

  /* ---------- structure ---------- */
  function rail() {
    return '<ol class="rail" aria-label="Steps">' + STEPS.map(function (s, i) {
      var done = s !== 'review' && chosen(s), cur = S.step === s;
      return '<li><button class="rail__b' + (cur ? ' cur' : '') + (done ? ' done' : '') + '" data-act="go" data-step="' + s + '" aria-current="' + (cur ? 'step' : 'false') + '"><i>' + (done ? '✓' : i + 1) + '</i><span>' + TITLES[s] + '</span></button></li>';
    }).join('') + '</ol>';
  }
  function dock() {
    var n = doneCount();
    return '<div class="dock"><div class="dock__v">' + ['size', 'firmness', 'depth', 'cover'].map(function (r) { var c = chosen(r); return '<span class="dv' + (c ? ' ok' : '') + '"><i>' + TITLES[r] + '</i>' + (c ? esc(short(r, c.label)) : '·') + '</span>'; }).join('') + '</div><div class="dock__r"><div class="dock__p"><small>' + (n === 4 ? 'Ready to order' : n + ' of 4 chosen') + '</small><b>' + esc(S.native.price) + '</b></div><button class="btn btn--p" data-act="next">' + (n === 4 && S.step !== 'review' ? 'Review' : S.step === 'review' ? 'Ecwid options' : 'Next') + '</button></div></div>';
  }
  function head() { return '<div class="ph"><div class="ph__t"><small>Step ' + (STEPS.indexOf(S.step) + 1) + ' of 5</small><h2>' + (S.step === 'review' ? 'Review your mattress' : 'Choose your ' + TITLES[S.step].toLowerCase()) + '</h2></div><button class="ph__x" data-act="close" aria-label="Close configuration">×</button></div>'; }

  function stageSvg() {
    var sz = chosen('size'), cd = sz && dims(sz.label) || [150, 200], dp = chosen('depth'), T = (dp ? +dKey(dp.label) : 22) * 1.1;
    var fk = chosen('firmness') ? fKey(chosen('firmness').label) : '', ck = chosen('cover') ? cKey(chosen('cover').label) : '';
    var W = Math.min(190, Math.max(90, cd[0] * 0.95)), L = Math.min(120, Math.max(70, cd[1] * 0.5)), x0 = 100 - W / 2, y0 = 24, sk = 38;
    var tint = { soft: '#CBE3EA', medium: '#A9CBD3', firm: '#86B1B9', xfirm: '#5E8D95' }[fk] || '#DDEBF1';
    var top = [[x0 + sk, y0], [x0 + sk + W, y0], [x0 + W, y0 + L], [x0, y0 + L]];
    function P(a) { return a.map(function (p) { return p.join(','); }).join(' '); }
    var bands = '', i; for (i = 0; i < 7; i++) { var t0 = i / 7, t1 = (i + 1) / 7; var a = [[x0 + sk * (1 - t0), y0 + L * t0], [x0 + sk * (1 - t0) + W, y0 + L * t0], [x0 + sk * (1 - t1) + W, y0 + L * t1], [x0 + sk * (1 - t1), y0 + L * t1]]; bands += '<polygon points="' + P(a) + '" fill="' + tint + '" opacity="' + (fk ? (0.55 + (i % 2) * 0.18) : 0.35) + '" stroke="#fff" stroke-width=".6"/>'; }
    return '<svg class="stage__svg" viewBox="0 0 200 ' + (y0 + L + T + 18) + '" role="img" aria-label="Your mattress, drawn from your choices"><polygon points="' + P([[x0, y0 + L], [x0 + W, y0 + L], [x0 + W, y0 + L + T], [x0, y0 + L + T]]) + '" fill="#9FB3B7"/><polygon points="' + P([[x0 + W, y0 + L], [x0 + sk + W, y0], [x0 + sk + W, y0 + T], [x0 + W, y0 + L + T]]) + '" fill="#7F9599"/>' + bands + (ck ? '<polygon points="' + P(top) + '" fill="' + pattern(ck) + '" opacity=".55"/>' : '') + '<polygon points="' + P(top) + '" fill="none" stroke="#364849" stroke-width=".8"/><text x="100" y="' + (y0 + L + T + 14) + '" class="stage__t">' + (sz ? cd[0] + ' × ' + cd[1] + ' cm' : 'Choose a size') + (dp ? ' · ' + dKey(dp.label) + ' cm' : '') + '</text></svg>';
  }

  function render() {
    if (!S.ready) return;
    var body = BODY[S.step](), html;
    if (S.concept === 'journey') {
      html = '<section class="jr" aria-label="Configure your mattress">' + STEPS.map(function (s, i) {
        var done = s !== 'review' && chosen(s), cur = S.step === s;
        return '<div class="jr__s' + (cur ? ' cur' : '') + (done ? ' done' : '') + '"><button class="jr__h" data-act="go" data-step="' + s + '" aria-expanded="' + cur + '"><i>' + (done ? '✓' : i + 1) + '</i><span>' + (s === 'review' ? 'Review' : TITLES[s]) + '</span><em>' + (done ? esc(short(s, chosen(s).label)) : '') + '</em></button>' + (cur ? '<div class="jr__b"><p class="why">' + esc(why(s)) + '</p>' + body + '</div>' : '') + '</div>';
      }).join('') + '</section>' + (S.open ? dock() : '');
    } else if (S.concept === 'stage') {
      html = (S.open ? '<div class="stage" role="dialog" aria-modal="true" aria-label="Configure your mattress"><button class="stage__g" data-act="gallery" aria-label="Return to the gallery"><img src="' + esc(D.images[0]) + '" alt=""><span>Gallery</span></button><button class="ph__x stage__x" data-act="close" aria-label="Close">×</button>' + stageSvg() + '<div class="stage__panel">' + rail() + head() + '<div class="pb"><p class="why">' + esc(why(S.step)) + '</p>' + body + '</div></div>' + dock() + '</div>' : '');
    } else {
      html = (S.open ? '<div class="sheet' + (S.min ? ' min' : '') + '" role="dialog" aria-modal="false" aria-label="Configure your mattress"><button class="sheet__h" data-act="min" aria-label="' + (S.min ? 'Expand' : 'Minimise') + ' the panel"><span></span></button>' + (S.min ? '' : rail() + head() + '<div class="pb"><p class="why">' + esc(why(S.step)) + '</p>' + body + '</div>') + dock() + '</div>' : '');
    }
    var scroll = root.querySelector('.pb, .jr__b'); var st = scroll ? scroll.scrollTop : 0;
    root.innerHTML = html;
    var sc = root.querySelector('.pb, .jr__b'); if (sc) sc.scrollTop = st;
    root.className = 'cfg cfg--' + S.concept + (S.open ? ' open' : '');
    d.documentElement.setAttribute('data-concept', S.concept); d.documentElement.classList.toggle('cfg-open', S.open && S.concept !== 'journey');
    d.documentElement.classList.toggle('gal-small', S.open);
    var cta = d.getElementById('cfg-cta'); var n = S.native ? doneCount() : 0;
    cta.innerHTML = '<button class="btn btn--p cta" data-act="open">' + (n ? 'Continue configuring · ' + n + ' of 4' : 'Configure Your Mattress') + '</button>';
  }

  /* ---------- actions ---------- */
  function setStep(s) { S.step = s; render(); }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return; var a = t.getAttribute('data-act');
    if (a === 'pick') {
      var role = t.getAttribute('data-role'), val = t.getAttribute('data-value'); t.classList.add('busy');
      sync.set(role, val).then(function (r) { if (!r.ok) fail(r.reason); else { var nx = nextOpen(); if (S.step !== 'review' && nx !== S.step && S.concept !== 'journey') { setTimeout(function () { setStep(nx); }, 450); } } });
    } else if (a === 'go') setStep(t.getAttribute('data-step'));
    else if (a === 'next') setStep(S.step === 'review' ? S.step : (doneCount() === 4 ? 'review' : nextOpen() === S.step ? STEPS[STEPS.indexOf(S.step) + 1] : nextOpen()));
    else if (a === 'close') { S.open = false; render(); d.getElementById('gallery').scrollIntoView({ block: 'start' }); }
    else if (a === 'min') { S.min = !S.min; render(); }
    else if (a === 'gallery') { S.open = false; render(); d.getElementById('gallery').scrollIntoView({ block: 'start' }); }
    else if (a === 'native') { if (S.concept !== 'journey') { S.open = false; render(); } var nt = d.getElementById('native'); nt.scrollIntoView({ block: 'start' }); var sel = nt.querySelector('select'); if (sel) sel.focus({ preventScroll: true }); }
  });
  root.addEventListener('input', function (e) {
    var t = e.target; if (t.getAttribute('data-act') !== 'body') return;
    S[t.getAttribute('data-k')] = +t.value; var o = t.parentElement.querySelectorAll('output'); render();
    var again = root.querySelector('#' + t.id); if (again) again.focus({ preventScroll: true });
  });
  d.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#cfg-cta [data-act="open"]'); if (!t) return;
    S.open = true; S.min = false; S.step = nextOpen(); render();
    if (S.concept === 'journey') { var j = root.querySelector('.jr'); if (j) j.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  });
  d.getElementById('gal-btn') && d.getElementById('gal-btn').addEventListener('click', function () { S.open = false; render(); });
  function fail(reason) { var t = d.getElementById('toast'); t.textContent = 'That choice could not be applied (' + reason + '). Use Ecwid’s own option below.'; t.classList.add('on'); setTimeout(function () { t.classList.remove('on'); }, 3200); }

  /* ---------- Ecwid -> panel ---------- */
  sync.onChange(function (s, info) { S.native = s; S.lastSource = info.source; render(); var pv = d.getElementById('pv-src'); if (pv) pv.textContent = info.source; });
  sync.ready(6000).then(function (ok) {
    S.ready = ok; if (!ok) { root.innerHTML = '<p class="fine">Guided configuration is unavailable; use Ecwid’s own options below.</p>'; return; }
    S.native = sync.read(); render();
  });
  w.__cfg = { state: S, sync: sync, set: function (c) { S.concept = c; render(); } };
}(window, document));
