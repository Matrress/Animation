// Builds docs/mobile/premium/preview/graphite-cover-proposal.html: the Graphite preview with ONLY the Step 04 cover tiles
// redesigned (architectural material samples). The approved preview graphite.html is read, not modified.
//   node tools/build-cover-proposal.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), P = join(root, 'docs/mobile/premium');
let html = readFileSync(join(P, 'preview/graphite.html'), 'utf8');
const css = readFileSync(join(P, 'src/graphite-cover-proposal.css'), 'utf8');
const newCover = `function bodyCover() {
    var o = S.native.options.cover, cur = chosen('cover'), curK = cur ? cKey(cur.label) : '', h = '<div class="gx-cov4">';
    var FACETS = '<svg class="facets" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,0 58,0 0,62" fill="rgba(255,255,255,.08)"/><polygon points="100,36 100,100 40,100" fill="rgba(21,28,38,.13)"/><path d="M58 0 0 62M100 36 40 100" stroke="rgba(21,28,38,.3)" stroke-width=".8" fill="none" vector-effect="non-scaling-stroke"/></svg>';
    var TICK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 6.4 5 9l4.8-5.6" fill="none" stroke="#151C26" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    D.covers.forEach(function (c) {
      var ch = o.choices.filter(function (x) { return cKey(x.label) === c.key; })[0]; if (!ch) return;
      h += '<button class="gx-s" data-act="pick" data-role="cover" data-value="' + esc(ch.value) + '" aria-pressed="' + (curK === c.key) + '"><span class="sw"><svg viewBox="0 0 64 64" preserveAspectRatio="none" aria-hidden="true"><rect width="64" height="64" fill="url(#' + PAT[c.key] + ')"/></svg>' + (c.img ? '<img src="' + esc(c.img) + '" alt="" loading="lazy" decoding="async">' : '') + FACETS + '<span class="ck">' + TICK + '</span></span><span class="nm">' + esc(c.name) + '</span></button>';
    });
    var sel = D.covers.filter(function (c) { return c.key === curK; })[0];
    return h + '</div><p class="gx-desc">' + (sel ? '<b>' + esc(sel.tag) + '.</b> ' + esc(sel.body) : esc(D.coverSub)) + '</p>';
  }
  `;
const a = html.indexOf('function bodyCover() {'), b = html.indexOf('function bodyReview()');
if (a < 0 || b < 0) throw new Error('cover function not found');
html = html.slice(0, a) + newCover + html.slice(b);
html = html.replace('<style id="premium-css">', '<style id="premium-css">' + css + '\n').replace('<button class="on">Graphite Blue</button>', '<button class="on">Cover tiles: proposal</button>');
writeFileSync(join(P, 'preview/graphite-cover-proposal.html'), html);
console.log('wrote preview/graphite-cover-proposal.html');
