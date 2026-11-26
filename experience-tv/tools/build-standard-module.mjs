// Builds the STANDARD module (the plain, selector-based product page) of Botanic from the approved description:
// the same words, in a light, semantic structure of collapsible topics (<details>, no script), in the television's colours.
//
//   node tools/build-standard-module.mjs        (needs playwright: NODE_PATH=$(npm root -g))
//
// Reads  source/botanic-original-description.html   (the approved description of the shop)
// Writes dist/standard/botanic-standard-description.html   (the whole description, pointer NOT included)
//        dist/standard/REPORT.txt                   (weight, text check: nothing approved is lost)
//
// Rules of the owner (26 Nov): one set of selectors (Ecwid's own, kept and made reachable), one bar not two, information in
// collapsible menus, videos only when asked for, the shop's description still complete in the page for readers and search engines,
// no sentence invented: only the approved text, shortened only by removing decoration, never by removing a statement.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'source', 'botanic-original-description.html'), 'utf8');
const css = readFileSync(join(root, 'tools', 'standard-module.css'), 'utf8');

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
const res = await page.evaluate(({ src }) => {
  const doc = new DOMParser().parseFromString(src, 'text/html');
  const pageEl = doc.querySelector('.dd-botanic-page');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const att = (s) => esc(s).replace(/"/g, '&quot;');
  const norm = (s) => s.replace(/\s+/g, ' ');
  const tag = (e) => e.tagName.toLowerCase();
  const BLOCK = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table', 'dl', 'blockquote', 'details', 'video', 'img', 'figure']);
  const isSkip = (e) => {
    const t = tag(e);
    return t === 'svg' || t === 'style' || t === 'script' || t === 'nav' || t === 'button' || t === 'noscript' || t === 'hr' ||
      e.classList.contains('b-leaf-divider') || e.classList.contains('b-floating-top') || e.classList.contains('sum-idx') ||
      e.classList.contains('b-btns') || e.classList.contains('b-main-video-actions') || e.classList.contains('b-video-modal__close') ||
      (t === 'a' && /(^|\s)b-btn/.test(e.className));
  };
  const hasBlock = (e) => { const all = e.querySelectorAll('*'); for (const x of all) if (BLOCK.has(tag(x)) && !x.closest('svg')) return true; return false; };
  // the part of the old BEM name after "__" becomes a small hook: b-fc__name -> k-name
  const hook = (e) => { const m = (e.className && typeof e.className === 'string' ? e.className : '').match(/__([a-z0-9]+)/); return m ? ' class="k-' + m[1] + '"' : ''; };
  const inline = (e) => {
    let o = '';
    for (const n of e.childNodes) {
      if (n.nodeType === 3) { o += esc(norm(n.textContent)); continue; }
      if (n.nodeType !== 1 || isSkip(n)) continue;
      const t = tag(n), inner = inline(n);
      if (t === 'strong' || t === 'b') o += '<strong>' + inner + '</strong>';
      else if (t === 'em' || t === 'i') o += '<em>' + inner + '</em>';
      else if (t === 'br') o += '<br>';
      else if (t === 'sup' || t === 'sub') o += '<' + t + '>' + inner + '</' + t + '>';
      else if (t === 'a') { const h = n.getAttribute('href') || ''; o += (/^(#|https?:)/.test(h) ? '<a href="' + att(h) + '">' + inner + '</a>' : inner); }
      else o += inner + (t === 'div' || t === 'li' ? ' ' : '');
    }
    return o;
  };
  const kidsEls = (e) => [...e.children].filter((c) => !isSkip(c));
  const cls1 = (c) => (c.classList[0] || '').replace(/\d+$/, '');
  const sameKind = (ch) => ch.length >= 2 && ch[0].classList.length > 0 && ch.every((c) => cls1(c) === cls1(ch[0]));
  const grid = (ch) => '<div class="dd-g">' + ch.map(card).join('') + '</div>';
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const leaves = (c) => {      // children are small text boxes: each is one line of the card
    const els = kidsEls(c); if (!els.length || ownText(c)) { const h = inline(c).trim(); return h ? '<p>' + h + '</p>' : ''; }
    return els.map((x) => {
      if (hasBlock(x)) return kids(x);
      const dv = kidsEls(x).filter((y) => tag(y) === 'div');
      if (dv.length >= 2) return leaves(x);
      const h = inline(x).trim(); return h ? '<p' + hook(x) + '>' + h + '</p>' : '';
    }).join('');
  };
  const card = (c) => {
    const only = kidsEls(c); if (only.length === 1 && tag(only[0]) === 'details') return det(only[0]);    // a menu in a box is just the menu
    if (only.length >= 2 && sameKind(only) && !ownText(c) && only.every((x) => kidsEls(x).length >= 2)) return grid(only);   // a row of boxes in a box: the boxes
    return '<div class="dd-c">' + (hasBlock(c) ? kids(c) : leaves(c)) + '</div>';
  };
  const kids = (e) => {
    let o = '';
    for (const n of e.childNodes) {
      if (n.nodeType === 3) { const s = norm(n.textContent).trim(); if (s) o += '<p>' + esc(s) + '</p>'; }
      else if (n.nodeType === 1) o += conv(n);
    }
    return o;
  };
  const video = (v) => {
    const s = v.querySelector('source'), url = s ? s.getAttribute('src') : v.getAttribute('src'); if (!url) return '';
    return '<video controls playsinline preload="none" aria-label="' + att(v.getAttribute('aria-label') || '') + '"><source src="' + att(url) + '" type="video/mp4"></video>';
  };
  const mtv = (e) => {
    const v = e.querySelector('video'), mode = e.querySelector('.b-mtv__mode'), ti = e.querySelector('.b-mtv__title'), de = e.querySelector('.b-mtv__desc');
    return '<figure class="dd-v"><div class="dd-v__f">' + video(v) + '</div><figcaption>' + (mode ? '<span class="k-mode">' + esc(norm(mode.textContent).trim()) + '</span> ' : '') +
      (ti ? '<strong>' + esc(norm(ti.textContent).trim()) + '</strong> ' : '') + (de ? '<span>' + esc(norm(de.textContent).trim()) + '</span>' : '') + '</figcaption></figure>';
  };
  const det = (d) => {
    const sm = d.querySelector(':scope > summary'); let lab = '';
    if (sm) { const c = sm.cloneNode(true); c.querySelectorAll('svg,.sum-idx').forEach((x) => x.remove()); lab = norm(c.textContent).trim(); }
    let body = ''; for (const c of d.children) if (tag(c) !== 'summary') body += conv(c);
    return '<details class="dd-m"><summary>' + esc(lab) + '</summary><div class="dd-m__b">' + body + '</div></details>';
  };
  const conv = (e) => {
    if (isSkip(e)) return '';
    const t = tag(e);
    if (t === 'p') { const h = inline(e).trim(); return h ? '<p' + hook(e) + '>' + h + '</p>' : ''; }
    if (/^h[1-6]$/.test(t)) { const lv = (t === 'h4' || t === 'h5' || t === 'h6') ? 'h4' : 'h3'; return '<' + lv + '>' + inline(e).trim() + '</' + lv + '>'; }
    if (t === 'ul' || t === 'ol') return '<' + t + '>' + [...e.children].filter((c) => tag(c) === 'li').map((c) => '<li>' + (hasBlock(c) ? kids(c) : inline(c).trim()) + '</li>').join('') + '</' + t + '>';
    if (t === 'table') return '<table>' + [...e.querySelectorAll('tr')].map((r) => '<tr>' + [...r.children].map((c) => '<' + tag(c) + '>' + inline(c).trim() + '</' + tag(c) + '>').join('') + '</tr>').join('') + '</table>';
    if (t === 'dl') return '<dl>' + [...e.children].map((c) => '<' + tag(c) + '>' + inline(c).trim() + '</' + tag(c) + '>').join('') + '</dl>';
    if (t === 'blockquote') return '<blockquote>' + kids(e) + '</blockquote>';
    if (t === 'details') return det(e);
    if (t === 'video') return '<figure class="dd-v"><div class="dd-v__f">' + video(e) + '</div></figure>';
    if (t === 'img') return '<img src="' + att(e.getAttribute('src') || '') + '" alt="' + att(e.getAttribute('alt') || '') + '" loading="lazy" decoding="async">';
    if (t === 'figure') return kids(e);
    if (e.classList.contains('b-mtv')) return mtv(e);
    if (e.classList.contains('b-cover-micro-wrap')) {      // the cover pictures: each picture with its own words (the radio-tab gallery of the old module is not needed)
      const sl = [...e.querySelectorAll('.b-cover-micro-slide img')], tx = [...e.querySelectorAll('.b-cover-micro-text')];
      return '<div class="dd-g dd-cov">' + sl.map((im, i) => '<figure class="dd-cv"><img src="' + att(im.getAttribute('src') || '') + '" alt="' + att(im.getAttribute('alt') || '') + '" loading="lazy" decoding="async"><figcaption>' + (tx[i] ? inline(tx[i]).trim() : '') + '</figcaption></figure>').join('') + '</div>';
    }
    const ch = kidsEls(e);
    // rows of look-alike boxes: each row becomes a grid of cards; a row of look-alike boxes is a grid of cards
    if (ch.length >= 1 && ch.every((c) => { const k = kidsEls(c); return k.length >= 2 && sameKind(k); })) return ch.map((c) => grid(kidsEls(c))).join('');
    if (sameKind(ch)) return grid(ch);
    if (!hasBlock(e)) {
      const dv = ch.filter((c) => tag(c) === 'div');
      if (dv.length >= 2) return card(e);
      const h = inline(e).trim(); return h ? '<p' + hook(e) + '>' + h + '</p>' : '';
    }
    return kids(e);
  };

  // ---- header (hero without its decoration, buttons, loop video and the second bar)
  const q = (s, r) => (r || pageEl).querySelector(s);
  const txt = (e) => (e ? norm(e.textContent).trim() : '');
  const hero = q('.b-hero');
  const eyebrow = txt(q('.b-eyebrow span', hero)), logo = txt(q('.b-logo-text', hero));
  const h1 = q('.b-h1', hero), h1em = txt(h1.querySelector('em')), h1rest = txt(h1).replace(h1em, '').trim();
  const intro = inline(q('.b-intro', hero)).trim(), rule = inline(q('.b-hero-rule', hero)).trim();
  const keys = [...pageEl.querySelectorAll('.b-hero-bar:not(nav) .b-hero-bar__item')].map((a) => txt(a));
  const og = [...pageEl.querySelectorAll('.b-ocard__item')].map((i) => {
    const lbl = txt(i.querySelector('.b-ocard__lbl')), val = txt(i.querySelector('.b-ocard__val')), pills = [...i.querySelectorAll('.b-ocard__pills span')].map(txt), note = txt(i.querySelector('.b-ocard__note'));
    return '<div><dt>' + esc(lbl) + '</dt><dd>' + esc(val || pills.join(' · ')) + (note ? '<small>' + esc(note) + '</small>' : '') + '</dd></div>';
  }).join('');
  const full = pageEl.querySelector('.b-video-modal video'), fullTitle = txt(pageEl.querySelector('.b-video-modal__title'));
  const header = '<header class="dd-hd" id="bp-top-head"><p class="dd-eyebrow">' + esc(eyebrow) + '</p>' +
    '<h2 class="dd-title"><span class="dd-title__b">' + esc(logo) + '</span> <em>' + esc(h1em) + '</em> ' + esc(h1rest) + '</h2>' +
    '<p class="dd-intro">' + intro + '</p>' +
    (keys.length ? '<ul class="dd-key">' + keys.map((k) => '<li>' + esc(k) + '</li>').join('') + '</ul>' : '') +
    '<p class="dd-rule">' + rule + '</p>' +
    '<p class="dd-how">Choose your size, height, firmness and cover in the selector, then add the mattress to your bag.</p>' +
    (og ? '<h3 class="dd-glance__t">' + esc(txt(q('.b-ocard__title'))) + '</h3><dl class="dd-glance">' + og + '</dl>' : '') +
    (full ? '<details class="dd-m dd-film"><summary>' + esc(fullTitle) + '</summary><div class="dd-m__b"><figure class="dd-v"><div class="dd-v__f">' + video(full) + '</div></figure></div></details>' : '') +
    '</header>';

  // ---- topics
  const secs = {}; for (const s of pageEl.querySelectorAll('section.b-sec')) secs[s.id.replace('bp-', '')] = s;
  const topic = (id) => {
    const s = secs[id]; if (!s) return '';
    const bw = s.querySelector(':scope > .bw'), sh = bw.querySelector(':scope > .b-sh');
    const n = txt(sh.querySelector('.b-sh__n')).replace(/^\d+\s*[—–-]\s*/, ''), t = txt(sh.querySelector('.b-sh__t')), sub = sh.querySelector('.b-sh__s');
    let body = sub ? '<p class="dd-lead">' + inline(sub).trim() + '</p>' : '';
    for (const c of bw.children) if (c !== sh) body += conv(c);
    return '<details class="dd-t" id="bp-' + id + '"><summary><h2 class="dd-t__h">' + esc(n) + '</h2>' + (t ? '<span class="dd-t__s">' + esc(t) + '</span>' : '') + '</summary><div class="dd-t__b">' + body + '</div></details>';
  };
  const GROUPS = [
    ['Choose your mattress', ['firmness', 'height', 'covers']],
    ['Why Botanic', ['comfort', 'benefits', 'support', 'adaptation', 'zones', 'ventilation', 'hygiene']],
    ['Made, certified and delivered', ['certs', 'warranty', 'delivery']]];
  const used = new Set(); let topics = '';
  for (const [g, ids] of GROUPS) { topics += '<p class="dd-grp">' + esc(g) + '</p>'; for (const id of ids) { topics += topic(id); used.add(id); } }
  const missing = Object.keys(secs).filter((k) => !used.has(k));
  const cta = pageEl.querySelector('.b-cta');
  const end = cta ? '<aside class="dd-end"><h3>' + esc(txt(cta.querySelector('.b-cta__t'))) + '</h3><p>' + inline(cta.querySelector('.b-cta__s')).trim() + '</p></aside>' : '';
  const html = '<div id="bp-top" class="dd-std">' + header + topics + end + '</div>';

  // ---- text check: every word of the approved text (minus decoration/buttons/navigation) must be in the result
  const words = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, ' ').split(/\s+/).filter((w) => w.length > 0);
  const srcClone = pageEl.cloneNode(true);
  srcClone.querySelectorAll('svg,style,script,nav,.b-leaf-divider,.b-floating-top,.sum-idx,.b-btns,.b-main-video-actions,.b-video-modal__close,.b-cta__b,a.b-btn,a.b-btn-p,a.b-btn-o,a.b-btn-hero-p,a.b-btn-hero-o,.b-hero-bar__title').forEach((x) => x.remove());
  const outDoc = new DOMParser().parseFromString(html, 'text/html');
  const wc = (arr) => { const m = new Map(); arr.forEach((w) => m.set(w, (m.get(w) || 0) + 1)); return m; };
  const tx = (root) => { const w = (root.ownerDocument || root).createTreeWalker(root, NodeFilter.SHOW_TEXT); let o = [], n; while ((n = w.nextNode())) o.push(n.textContent); return o.join(' '); };   // spaced: adjacent elements are different words
  const A = wc(words(tx(srcClone))), B = wc(words(tx(outDoc.body)));
  const lost = []; for (const [w, n] of A) { const k = B.get(w) || 0; if (k < n) lost.push(w + '×' + (n - k)); }
  const added = []; for (const [w, n] of B) { const k = A.get(w) || 0; if (k < n) added.push(w + '×' + (n - k)); }
  return { html, missing, lost, added, srcWords: [...A.values()].reduce((a, b) => a + b, 0), outWords: [...B.values()].reduce((a, b) => a + b, 0) };
}, { src });
await browser.close();

const out = join(root, 'dist', 'standard'); mkdirSync(out, { recursive: true });
// the module's own rules are tied to its id (#bp-top), so that the shop's heavier rules for headings, lists and buttons cannot override them
const part = (t, from, to) => { const i = from ? t.indexOf(from) + from.length : 0, j = to ? t.indexOf(to) : t.length; return t.slice(i, j); };
const prefix = (rules) => rules.replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, body) => sel.split(',').map((x) => x.trim()).map((x) => x.startsWith('.dd-std') ? '#bp-top' + x : '#bp-top ' + x).join(',') + '{' + body + '}');
const mini = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}').trim();
const cssMin = mini(part(css, null, '/*=MODULE=*/') + prefix(part(css, '/*=MODULE=*/', '/*=END=*/')) + part(css, '/*=END=*/', null));
const full = '<style>' + cssMin + '</style>' + res.html;
writeFileSync(join(out, 'botanic-standard-description.html'), full);
const rep = [
  'STANDARD MODULE (Botanic): built from source/botanic-original-description.html',
  'old description : ' + Buffer.byteLength(src) + ' bytes (css ' + (src.match(/<style[\s\S]*?<\/style>/) || [''])[0].length + ')',
  'new description : ' + Buffer.byteLength(full) + ' bytes (css ' + cssMin.length + ', html ' + Buffer.byteLength(res.html) + ')',
  'sections not placed: ' + (res.missing.join(', ') || 'none'),
  'words in approved text: ' + res.srcWords + ' | words in result: ' + res.outWords,
  'WORDS LOST (approved text not found in the result): ' + (res.lost.length ? res.lost.join(' ') : 'none'),
  'WORDS ADDED (in the result, not in the approved text): ' + (res.added.length ? res.added.join(' ') : 'none')].join('\n');
writeFileSync(join(out, 'REPORT.txt'), rep + '\n');
console.log(rep);
