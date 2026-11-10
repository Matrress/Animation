/* GRAPHITE BLUE guided configuration (PREVIEW, not deployed). One full-height screen per step, four side pillars, a bottom
   selection panel. Native Ecwid <select>s stay the single source of truth, through DDSync. Prices are Ecwid's text, never computed.
   Firmness guidance comes from DDFirmnessCore (extracted from the published Firmness Navigator). */
(function (w, d) {
  'use strict';
  var D = w.DDDATA, core = w.DDFirmnessCore, sync = w.DDSync.create();
  var STEPS = ['size', 'firmness', 'depth', 'cover'], NAMES = { size: 'Size', firmness: 'Firmness', depth: 'Depth', cover: 'Cover' };
  var S = { open: false, step: 'size', native: null, ready: false, weight: null, height: null, upd: false, before: '', timer: null, mode: 'gx' };
  var root = d.getElementById('cfg');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function first(s) { var m = /^(.*?[.!?])(\s|$)/.exec(s || ''); return m ? m[1] : s; }

  /* ---------- reading Ecwid's answers ---------- */
  function dims(label) { var m = /(\d{2,3})\s*[x×]\s*(\d{2,3})/.exec(label); return m ? [+m[1], +m[2]] : null; }
  function group(wd) { return wd <= 100 ? 'SINGLE' : wd <= 140 ? 'DOUBLE' : wd <= 160 ? 'KING' : 'SUPERKING · EMPEROR'; }
  function fKey(l) { l = l.toUpperCase(); return /EXTRA FIRM/.test(l) ? 'xfirm' : /FIRM/.test(l) ? 'firm' : /MEDIUM/.test(l) ? 'medium' : /SOFT/.test(l) ? 'soft' : ''; }
  function cKey(l) { l = l.toLowerCase(); return /cashmere/.test(l) ? 'cashmere' : /aloe/.test(l) ? 'aloe' : /wool/.test(l) ? 'wool' : /cotton/.test(l) ? 'cotton' : ''; }
  function dKey(l) { var m = /(\d{2})\s*cm/.exec(l); return m ? m[1] : ''; }
  function chosen(r) { var o = S.native && S.native.options[r]; return o && o.chosen ? o : null; }
  function label(r) {
    var c = chosen(r); if (!c) return '';
    if (r === 'size') { var dm = dims(c.label); return dm ? dm[0] + ' × ' + dm[1] + ' cm' : 'Another size'; }
    if (r === 'depth') return dKey(c.label) + ' cm';
    if (r === 'firmness') { var k = fKey(c.label); return k === 'xfirm' ? 'Extra Firm' : k.charAt(0).toUpperCase() + k.slice(1); }
    var cv = D.covers.filter(function (x) { return x.key === cKey(c.label); })[0]; return cv ? cv.name : c.label;
  }
  function done() { return STEPS.filter(function (r) { return chosen(r); }).length; }
  function nextOpen() { for (var i = 0; i < 4; i++) if (!chosen(STEPS[i])) return STEPS[i]; return 'review'; }
  function startingOnly() { return chosen('size') && !chosen('firmness') && !chosen('cover') && (!chosen('depth') || dKey(chosen('depth').label) === '20'); }

  /* ---------- step bodies ---------- */
  function bodySize() {
    var o = S.native.options.size, g = {}, order = ['SINGLE', 'DOUBLE', 'KING', 'SUPERKING · EMPEROR'], cur = chosen('size'), n = 0, h = '';
    o.choices.forEach(function (c) { var dm = dims(c.label); if (!dm) return; n++; (g[group(dm[0])] = g[group(dm[0])] || []).push({ c: c, dm: dm }); });
    S.sizeCount = n;
    order.forEach(function (name) {
      if (!g[name]) return;
      h += '<div class="gx-grp"><h3>' + name + '</h3><div class="gx-chips">' + g[name].map(function (x) {
        var on = cur && cur.value === x.c.value;
        return '<button class="gx-chip" data-act="pick" data-role="size" data-value="' + esc(x.c.value) + '" aria-pressed="' + !!on + '" aria-label="' + esc(x.c.label.replace(/\s*\(\+[^)]*\)/, '')) + '">' + x.dm[0] + '×' + x.dm[1] + '</button>';
      }).join('') + '</div></div>';
    });
    return h + '<div class="gx-note"><span>All dimensions in cm</span><a href="https://divinedunlop.com/customsizes" target="_blank" rel="noopener">Custom sizes</a></div>';
  }
  function scaleSvg(recK, curK) {
    var seg = [['soft', 'Soft'], ['medium', 'Medium'], ['firm', 'Firm'], ['xfirm', 'Extra Firm']], fills = ['#3A4B66', '#46597A', '#566E93', '#6A86AE'];
    return '<svg class="gx-scale" viewBox="0 0 320 44" role="img" aria-label="Firmness scale">' + seg.map(function (s, i) {
      var x = i * 80;
      var dim = recK && recK !== s[0] && curK !== s[0];
      return '<g opacity="' + (dim ? '.3' : '1') + '"><rect x="' + (x + 1) + '" y="12" width="78" height="14" rx="7" fill="' + fills[i] + '"/></g>' + (recK === s[0] ? '<path d="M' + (x + 40) + ' 9 l6 -8 h-12z" fill="#C3D5ED"/>' : '') + (curK === s[0] ? '<circle cx="' + (x + 40) + '" cy="19" r="5.5" fill="#fff"/>' : '') + '<text x="' + (x + 40) + '" y="41" opacity="' + (dim ? '.4' : '1') + '">' + s[1] + '</text>';
    }).join('') + '</svg>';
  }
  function firmDyn() {
    var o = S.native.options.firmness, cur = chosen('firmness'), curK = cur ? fKey(cur.label) : '', rec = (S.weight != null && S.height != null) ? core.recommend(S.weight, S.height) : null;
    var recK = rec ? { 'SOFT': 'soft', 'MEDIUM': 'medium', 'FIRM': 'firm', 'EXTRA FIRM': 'xfirm' }[rec.display] : '', h = scaleSvg(recK, curK);
    h += '<p class="gx-guide">' + (rec ? 'Guidance for your body: <b>' + esc(rec.display.charAt(0) + rec.display.slice(1).toLowerCase()) + '</b>.' + (rec.second ? ' ' + esc(D.firmness.decision2) : '') : 'Set your weight and height for guidance, or choose directly.') + '</p><div class="gx-2">';
    D.firmness.cards.forEach(function (c) {
      var ch = o.choices.filter(function (x) { return fKey(x.label) === c.key; })[0]; if (!ch) return;
      var isRec = recK === c.key, isCur = curK === c.key, dim = recK && !isRec && !isCur;
      h += '<button class="gx-card' + (isRec ? ' rec' : '') + (dim ? ' dim' : '') + '" data-act="pick" data-role="firmness" data-key="' + c.key + '" data-value="' + esc(ch.value) + '" aria-pressed="' + isCur + '" aria-label="' + esc(c.name + (isRec ? ', your guided firmness' : (recK ? ', other option' : ''))) + '">' + esc(c.name) + (isRec ? '<small>For you</small>' : '') + '</button>';
    });
    var shown = D.firmness.cards.filter(function (c) { return c.key === (curK || recK); })[0];
    return h + '</div><p class="gx-desc">' + (shown ? esc(shown.desc) : esc(D.firmness.notice)) + ' <a href="https://divinedunlop.com/firmnesses" target="_blank" rel="noopener">Full Firmness Navigator</a></p>';
  }
  function bodyFirm() {
    var w0 = S.weight == null ? 70 : S.weight, h0 = S.height == null ? 170 : S.height;
    return '<div class="gx-fg"><div class="r"><label for="gw">Body weight</label><b id="gwv">' + (S.weight == null ? '—' : S.weight + ' kg') + '</b></div><input id="gw" type="range" min="' + core.limits.weight[0] + '" max="' + core.limits.weight[1] + '" value="' + w0 + '" data-k="weight" aria-label="Body weight in kilograms">' +
      '<div class="r"><label for="gh">Height</label><b id="ghv">' + (S.height == null ? '—' : S.height + ' cm') + '</b></div><input id="gh" type="range" min="' + core.limits.height[0] + '" max="' + core.limits.height[1] + '" value="' + h0 + '" data-k="height" aria-label="Height in centimetres"></div><div id="gdyn">' + firmDyn() + '</div>';
  }
  function bodyDepth() {
    var o = S.native.options.depth, cur = chosen('depth'), curK = cur ? dKey(cur.label) : '', h = '<div class="gx-bars">';
    D.depths.forEach(function (x) {
      var ch = o.choices.filter(function (c) { return dKey(c.label) === x.cm; })[0]; if (!ch) return;
      h += '<button class="gx-bar" data-act="pick" data-role="depth" data-value="' + esc(ch.value) + '" aria-pressed="' + (curK === x.cm) + '"><span class="slab" style="height:' + (x.cm * 3.4) + 'px">' + x.cm + '</span><span class="n">' + esc(x.name) + '</span></button>';
    });
    var sel = D.depths.filter(function (x) { return x.cm === curK; })[0];
    return h + '</div><p class="gx-desc">' + esc(sel ? sel.desc : D.depthSub) + '</p><p class="gx-desc">' + esc(D.coverFacts.height) + '</p>';
  }
  var PAT = { cotton: 'p-cotton', wool: 'p-wool', aloe: 'p-aloe', cashmere: 'p-cash' };
  function bodyCover() {
    var o = S.native.options.cover, cur = chosen('cover'), curK = cur ? cKey(cur.label) : '', h = '<div class="gx-2">';
    D.covers.forEach(function (c) {
      var ch = o.choices.filter(function (x) { return cKey(x.label) === c.key; })[0]; if (!ch) return;
      h += '<button class="gx-cov" data-act="pick" data-role="cover" data-value="' + esc(ch.value) + '" aria-pressed="' + (curK === c.key) + '"><svg viewBox="0 0 64 64" preserveAspectRatio="none" aria-hidden="true"><rect width="64" height="64" fill="url(#' + PAT[c.key] + ')"/></svg>' + (c.img ? '<img src="' + esc(c.img) + '" alt="" loading="lazy" decoding="async">' : '') + '<span>' + esc(c.name) + '</span></button>';
    });
    var sel = D.covers.filter(function (c) { return c.key === curK; })[0];
    return h + '</div><p class="gx-desc">' + (sel ? '<b>' + esc(sel.tag) + '.</b> ' + esc(sel.body) : esc(D.coverSub)) + '</p>';
  }
  function bodyReview() {
    var fk = chosen('firmness') ? fKey(chosen('firmness').label) : '', tint = { soft: '#3A4B66', medium: '#46597A', firm: '#566E93', xfirm: '#6A86AE' }[fk] || '#314058';
    var h = '<div class="gx-mat" style="--mat-top:' + tint + ';--mat-top-2:' + tint + '">' + D.mattressSvg + '</div><ul class="gx-rv">';
    STEPS.forEach(function (r) { var c = chosen(r); h += '<li><span>' + NAMES[r] + '</span><b>' + (c ? esc(label(r)) : 'Not chosen yet') + '</b><button data-act="go" data-step="' + r + '">' + (c ? 'Change' : 'Choose') + '</button></li>'; });
    h += '</ul>'; D.reviewFacts.forEach(function (f) { h += '<p class="gx-desc">' + esc(f) + '</p>'; });
    return h;
  }
  var BODY = { size: bodySize, firmness: bodyFirm, depth: bodyDepth, cover: bodyCover, review: bodyReview };
  var TITLE = { size: 'Choose Your Size', firmness: 'Choose Your Firmness', depth: 'Choose Your Depth', cover: 'Choose Your Cover', review: 'Your Mattress' };
  function sub() {
    if (S.step === 'size') return (S.sizeCount || 22) + ' dimensions · Custom made to order';
    if (S.step === 'firmness') return first(D.firmness.sub);
    if (S.step === 'depth') return first(D.depthSub);
    if (S.step === 'cover') return first(D.coverSub);
    return D.keyFeatures.filter(function (k) { return /Custom Made|Delivery/.test(k); }).join(' · ');
  }

  /* ---------- chrome: pillars, bottom panel ---------- */
  function rail() {
    return '<nav class="gx-rail" aria-label="Steps">' + STEPS.map(function (s, i) { var dn = chosen(s), cur = S.step === s; return '<button class="pil' + (cur ? ' cur' : '') + (dn ? ' done' : '') + '" data-act="go" data-step="' + s + '" aria-current="' + (cur ? 'step' : 'false') + '" aria-label="' + NAMES[s] + (dn ? ', chosen' : '') + '"><i>' + (dn ? '✓' : '0' + (i + 1)) + '</i><span>' + NAMES[s] + '</span></button>'; }).join('') + '</nav>';
  }
  function dock() {
    var n = S.native, st = S.step, rv = st === 'review', cur = rv ? null : chosen(st), size = chosen('size'), only = startingOnly();
    var others = STEPS.filter(function (r) { return r !== st && chosen(r); }).map(label).join(' · ');
    var left = rv ? done() + ' of 4 chosen' : (cur ? label(st) : '—');
    var price = n.price, contact = size && !dims(size.label);
    var pv = contact ? 'Contact us' : (!size && !done() ? '—' : price);
    var pl = rv || !only ? 'Your price' : 'Starting price';
    var cap = only ? '20 cm base depth · Price loaded from Ecwid' : 'Price loaded from Ecwid';
    var nxt = { size: 'Continue to <b>Firmness</b>', firmness: 'Continue to <b>Depth</b>', depth: 'Continue to <b>Cover</b>', cover: '<b>Review</b> & order', review: done() === 4 ? 'Go to <b>Add to Bag</b>' : 'See <b>Ecwid’s options</b>' }[st];
    var dis = !rv && !cur;
    return '<section class="gx-dock" aria-label="Your selection"><div class="gx-sel"><div><small>' + (rv ? 'Your configuration' : 'Your selection') + '</small><b>' + esc(left) + '</b>' + (others ? '<em>' + esc(others) + '</em>' : '') + '</div><div class="gx-r' + (S.upd ? ' upd' : '') + '"><small>' + pl + '</small><b>' + esc(pv) + '</b></div></div><p class="gx-cap">' + esc(cap) + '</p><button class="gx-btn" data-act="next" aria-disabled="' + dis + '">' + nxt + '</button><button class="gx-alt" data-act="native">Use Ecwid’s own menus instead</button></section>';
  }

  function render() {
    if (!S.ready) return;
    var cta = d.getElementById('cfg-cta'), n = done();
    cta.innerHTML = '<button class="btn btn--p cta" data-act="open">' + (n ? 'Continue configuring · ' + n + ' of 4' : 'Configure Your Mattress') + '</button>';
    d.documentElement.classList.toggle('gal-small', S.open); d.documentElement.classList.toggle('cfg-open', S.open);
    if (!S.open) { root.innerHTML = ''; root.className = 'cfg'; return; }
    var idx = STEPS.indexOf(S.step), body = d.querySelector('.gx-body'), st = body ? body.scrollTop : 0;
    root.className = 'cfg cfg--gx open';
    root.innerHTML = '<div class="gx" role="dialog" aria-modal="true" aria-label="Configure your mattress">' + rail() + '<div class="gx-main"><div class="gx-top"><b>Divine DunlopDreams</b><span>' + (S.step === 'review' ? 'Review' : '0' + (idx + 1) + ' / 04') + '<button class="gx-x" data-act="close" aria-label="Close configuration">×</button></span></div><div><h2 tabindex="-1">' + TITLE[S.step] + '</h2><p class="gx-sub">' + esc(sub()) + '</p></div><div class="gx-body">' + BODY[S.step]() + '</div>' + dock() + '</div></div>';
    var nb = d.querySelector('.gx-body'); if (nb) nb.scrollTop = st;
  }

  /* ---------- actions ---------- */
  function go(s) { S.step = s; render(); }
  function fail(reason) { var t = d.getElementById('toast'); t.textContent = 'That choice could not be applied (' + reason + '). Use Ecwid’s own option instead.'; t.classList.add('on'); setTimeout(function () { t.classList.remove('on'); }, 3200); }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return; var a = t.getAttribute('data-act');
    if (a === 'pick') {
      S.before = S.native.price; S.upd = true; clearTimeout(S.timer); S.timer = setTimeout(function () { S.upd = false; render(); }, 1500);
      sync.set(t.getAttribute('data-role'), t.getAttribute('data-value')).then(function (r) { if (!r.ok) { S.upd = false; fail(r.reason); render(); } });
      render();
    } else if (a === 'go') go(t.getAttribute('data-step'));
    else if (a === 'next') {
      if (t.getAttribute('aria-disabled') === 'true') return;
      if (S.step === 'review') return toNative();
      var i = STEPS.indexOf(S.step); go(i < 3 ? STEPS[i + 1] : 'review');
    } else if (a === 'close') { S.open = false; render(); }
    else if (a === 'native') toNative();
  });
  function toNative() {
    var role = S.step === 'review' ? 'size' : S.step; S.open = false; render();
    var b = sync.blocks()[role]; var tgt = b ? b.block : d.getElementById('native');
    tgt.scrollIntoView({ block: 'center' }); if (b) b.select.focus({ preventScroll: true });
  }
  function patchFirm() {
    var g = d.getElementById('gdyn'); if (!g) return;
    var rec = (S.weight != null && S.height != null) ? core.recommend(S.weight, S.height) : null, cur = chosen('firmness'), curK = cur ? fKey(cur.label) : '';
    var recK = rec ? { 'SOFT': 'soft', 'MEDIUM': 'medium', 'FIRM': 'firm', 'EXTRA FIRM': 'xfirm' }[rec.display] : '';
    var sc = g.querySelector('.gx-scale'); if (sc) sc.outerHTML = scaleSvg(recK, curK);
    var gd = g.querySelector('.gx-guide'); if (gd) gd.innerHTML = rec ? 'Guidance for your body: <b>' + esc(rec.display.charAt(0) + rec.display.slice(1).toLowerCase()) + '</b>.' + (rec.second ? ' ' + esc(D.firmness.decision2) : '') : 'Set your weight and height for guidance, or choose directly.';
    g.querySelectorAll('.gx-card').forEach(function (c) {
      var k = c.getAttribute('data-key'), isRec = recK === k, isCur = curK === k, sm = c.querySelector('small');
      c.classList.toggle('rec', isRec); c.classList.toggle('dim', !!recK && !isRec && !isCur);
      if (isRec && !sm) c.insertAdjacentHTML('beforeend', '<small>For you</small>'); if (!isRec && sm) sm.remove();
    });
    var shown = D.firmness.cards.filter(function (c) { return c.key === (curK || recK); })[0], ds = g.querySelector('.gx-desc');
    if (ds) ds.firstChild.textContent = (shown ? shown.desc : D.firmness.notice) + ' ';
  }
  /* sliders: update only what depends on them, never replace the slider being dragged */
  root.addEventListener('input', function (e) {
    var t = e.target; var k = t.getAttribute && t.getAttribute('data-k'); if (!k) return;
    S[k] = +t.value; var v = d.getElementById(k === 'weight' ? 'gwv' : 'ghv'); if (v) v.textContent = S[k] + (k === 'weight' ? ' kg' : ' cm');
    patchFirm();
  });
  d.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('#cfg-cta [data-act="open"]'); if (!t) return; S.open = true; S.step = nextOpen() === 'review' ? 'size' : nextOpen(); render(); var h = root.querySelector('h2'); if (h) h.focus({ preventScroll: true }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.open) { S.open = false; render(); } });
  root.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') e.target.remove(); }, true);   /* texture not reachable: the pattern behind it stays */

  /* ---------- Ecwid -> panel ---------- */
  sync.onChange(function (s, info) { S.native = s; if (s.price !== S.before && S.upd) { S.upd = false; clearTimeout(S.timer); } render(); var pv = d.getElementById('pv-src'); if (pv) pv.textContent = info.source; });
  sync.ready(6000).then(function (ok) { S.ready = ok; if (!ok) { root.innerHTML = '<p class="fine">Guided configuration is unavailable; use Ecwid’s own options below.</p>'; return; } S.native = sync.read(); render(); });
  w.__cfg = { state: S, sync: sync, set: function () {} };
}(window, document));
