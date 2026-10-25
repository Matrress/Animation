// Divine DunlopDreams · Four Laws of Good Sleep (pillars) · build
// Writes ecwid/pillars-<v>.html (the Ecwid custom-code tile, complete and readable without JS)
// and release/<v>/ (dpl.css, dpl.js, the four circle photos), all generated from src/content.mjs.
// Env:
//   DPL_REF   commit that hosts release/<v>/ on jsDelivr (default "main-preview" = not yet pinned)
//   DPL_BASE  full base URL for the release files (overrides jsDelivr; used for local previews)
//   ESBUILD   path to esbuild's lib/main.js; without it the CSS/JS are written unminified
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HEAD, MATERIALS, COMPARE, PILLARS, FOOT, DIFF } from './src/content.mjs';

const VERSION = '0.9.0';
const here = path.dirname(fileURLToPath(import.meta.url));
const REF = process.env.DPL_REF || 'main-preview';
const BASE = process.env.DPL_BASE || `https://cdn.jsdelivr.net/gh/Matrress/Animation@${REF}/divine-pillars/release/${VERSION}/`;
// the Hero's own Chillax files, pinned (the same URLs Home Discovery and Firmness use)
const FONT_BASE = 'https://cdn.jsdelivr.net/gh/Matrress/Animation@f727e88417fd562938847735378af9a167e96034/divine-hero/release/1.20.2/assets/';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const out = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

// ---- the tile ----
// Part A: one square card, one large disc in it, four circles in a 2 x 2 grid. Each circle is one button (photo, data rings,
// number, and the arc tab with its verb). The numbers live in the rows beside the card.
const circle = (p) => `<li class="dpl__p" id="dpl-${p.id}">
<button type="button" class="dpl__orb" aria-controls="dpl-panel" aria-expanded="false" aria-label="${esc(p.verb)}: ${esc(p.title)}, open the details"><img src="${BASE}${p.img}.webp" width="480" height="480" loading="lazy" decoding="async" alt="${esc(p.alt)}"><span class="dpl__arc" aria-hidden="true">${esc(p.verb)}</span></button><span class="dpl__num" aria-hidden="true">${p.n}</span>
</li>`;
const row = (p) => `<li class="dpl__row">
<span class="dpl__rn" aria-hidden="true">${p.n}</span>
<div><p class="dpl__pv">${esc(p.verb)}</p><h3 class="dpl__t">${esc(p.title)}</h3>
<p class="dpl__k"><b>${esc(p.key[0])}</b> ${esc(p.key[1])}</p>
<p class="dpl__s">${esc(p.short)}</p></div>
</li>`;

// Part B: the square module of four tiles (same proportions as the card), with the text and the three links beside it
const ICON = {
  leaf: '<path d="M10 38C14 24 24 14 40 8C38 24 28 34 10 38Z"/><path d="M10 38C20 28 28 20 40 8"/>',
  slider: '<path d="M8 14h32M8 24h32M8 34h32"/><circle cx="16" cy="14" r="3.6"/><circle cx="31" cy="24" r="3.6"/><circle cx="22" cy="34" r="3.6"/>',
  pair: '<circle cx="18" cy="24" r="11"/><circle cx="30" cy="24" r="11"/>',
  frame: '<path d="M8 16V8h8M32 8h8v8M40 32v8h-8M16 40H8v-8"/><circle cx="24" cy="24" r="5"/>',
};
const tile = (t) => `<li class="dpl__tl"><span class="dpl__ic"><svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[t.icon]}</svg></span>
<h3 class="dpl__tt">${esc(t.title)}</h3><p class="dpl__tx2">${esc(t.text)}</p></li>`;

const table = `<div class="dpl__tbw"><div class="dpl__tbs"><table>
<caption class="dpl-sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Six material classes compared on density, resilience, recovery, support factor, air channels and heat response</caption>
<thead><tr><th scope="col">Material</th>${COMPARE.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
<tbody>${MATERIALS.map((m) => `<tr class="${m.ours ? 'is-ours' : ''}${m.id === 'tempur' ? 'is-tempur' : ''}"><th scope="row">${esc(m.name)}<small>${esc(m.how)}</small></th>${COMPARE.rows[m.id].map((v, i) => `<td data-l="${esc(COMPARE.cols[i])}">${esc(v)}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table></div><p class="dpl__note">${esc(COMPARE.note)}</p></div>`;

const loader = `<script>(function(){var s=document.getElementById('dpl');if(!s)return;s.classList.add('is-js');if(window.DPL){window.DPL.scan();return}var x=document.createElement('script');x.src='${BASE}dpl.js';x.defer=true;x.onerror=function(){s.classList.remove('is-js')};document.head.appendChild(x);setTimeout(function(){if(!window.DPL)s.classList.remove('is-js')},8000)})();</script>`;

const html = `<link rel="stylesheet" href="${BASE}dpl.css">
<section class="dpl" id="dpl" aria-labelledby="dpl-h" data-version="${VERSION}">
<div class="dpl__in">
<header class="dpl__hd"><p class="dpl__eb">${esc(HEAD.eyebrow)}</p>
<h2 class="dpl__h" id="dpl-h">${HEAD.title}</h2>
<p class="dpl__lede">${esc(HEAD.lede)}</p></header>
<div class="dpl__top">
<div class="dpl__fig"><div class="dpl__card"><div class="dpl__disc" aria-hidden="true"></div>
<ol class="dpl__sun">
${PILLARS.map(circle).join('\n')}
</ol></div></div>
<ol class="dpl__rows">
${PILLARS.map(row).join('\n')}
</ol>
</div>
<div class="dpl__panel" id="dpl-panel" role="region" hidden><div></div></div>
<div class="dpl__foot">
<details class="dpl__cmp" id="dpl-compare"><summary class="dpl__btn is-pri">${esc(FOOT.compare)}</summary>
${table}
</details>
</div>
<div class="dpl__diff">
<div class="dpl__dt"><p class="dpl__eb">${esc(DIFF.eyebrow)}</p>
<h2 class="dpl__h2" id="dpl-h2">${DIFF.title}</h2>
<p class="dpl__lede2">${esc(DIFF.lede)}</p>
<p class="dpl__ctas"><a class="dpl__btn is-pri" href="#ddhd-mattress" data-need="#ddhd" hidden>${esc(DIFF.ctas.mattress)}</a>
<a class="dpl__btn" href="#ddhd-topper" data-need="#ddhd" hidden>${esc(DIFF.ctas.topper)}</a>
<a class="dpl__btn" href="#dn" data-need="#dn" hidden>${esc(DIFF.ctas.firmness)} <u aria-hidden="true">&uarr;</u></a></p></div>
<div class="dpl__cube"><ul class="dpl__tiles" aria-labelledby="dpl-h2">
${DIFF.tiles.map(tile).join('\n')}
</ul></div>
</div>
<p class="dpl__next" data-need="#ddhd-system" hidden><span>${esc(FOOT.systemLead)}</span><a class="dpl__btn" href="#ddhd-system">${esc(FOOT.system)} <u aria-hidden="true">&darr;</u></a></p>
</div>
</section>
${loader}
`;

// ---- dpl.js: the data the panels need, nothing more ----
const data = {
  version: VERSION, compare: FOOT.compare,
  materials: MATERIALS.map(({ id, name, ours }) => ({ id, name, ours: !!ours })),
  pillars: PILLARS.map(({ id, label, n, title, verb, img, alt, head, body, quote, stats, vs, chart }) => ({ id, label, n, title, verb, img, alt, head, body, quote, stats, vs, chart })),
};
let js = fs.readFileSync(path.join(here, 'src/dpl.js'), 'utf8').replace('__DPL_DATA__', JSON.stringify(data));
let css = `@font-face{font-family:DPLChillax;src:url(${FONT_BASE}chillax-400.woff2) format("woff2");font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:DPLChillax;src:url(${FONT_BASE}chillax-600.woff2) format("woff2");font-weight:600;font-style:normal;font-display:swap}\n` + fs.readFileSync(path.join(here, 'src/dpl.css'), 'utf8');

// ---- the owner's standing rules, checked on everything a reader can see ----
const visible = (html.replace(/<script[\s\S]*?<\/script>/g, '') + JSON.stringify(data.pillars)).replace(/<[^>]+>/g, ' ');
const guards = [
  [/\blayers?\b/i, 'the word "layer"'],
  [/approximately|~/i, '"approximately" or "~"'],
  [/[£€$]\s?\d|\bprice\b/i, 'a price'],
  [/overheating|no more over/i, 'an absolute temperature promise'],
  [/Hotel Line/, 'Hotel Line'],
  [/unbeatable|best in class|highest in class/i, 'an untested superlative'],
];
for (const [re, what] of guards) if (re.test(visible)) throw new Error(`content guard: the tile or a panel contains ${what}`);
for (const m of html.matchAll(/class="dpl__btn[^"]*"[^>]*>([^<]+)/g)) {   // buttons in Title Case, "and" / "or" in lower case
  for (const w of m[1].trim().split(/\s+/)) if (/^[a-z]/.test(w) && !['and', 'or'].includes(w)) throw new Error(`button not in Title Case: "${m[1].trim()}"`);
}
if (PILLARS.length !== 4) throw new Error('expected four laws');
if (DIFF.tiles.length !== 4) throw new Error('expected four difference tiles');
if (!/Natural Latex Mattress/.test(html) || !/Natural Latex Topper/.test(html)) throw new Error('the section must say "Natural Latex Mattress" and "Natural Latex Topper"');
if (/coir|coconut/i.test(html)) throw new Error('coconut coir is not claimed or denied here (open question for the owner)');
for (const p of PILLARS) if (!fs.existsSync(path.join(here, 'assets', `${p.img}.webp`))) throw new Error(`missing photo assets/${p.img}.webp`);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('duplicate id in the tile');
if (ids.some((i) => !/^dpl/.test(i))) throw new Error('every id starts with dpl (no clash with ddhd-, dsys-, fq-)');

// ---- minify (optional) and write ----
let minified = false;
if (process.env.ESBUILD) {
  const { transformSync } = await import(pathToFileURL(process.env.ESBUILD).href);
  css = transformSync(css, { loader: 'css', minify: true, charset: 'utf8' }).code;
  js = `/* Divine DunlopDreams · Four Laws ${VERSION} */\n` + transformSync(js, { loader: 'js', minify: true, target: 'es2017', charset: 'utf8' }).code;
  minified = true;
}
const rel = path.join(here, 'release', VERSION);
out(path.join(rel, 'dpl.css'), css);
out(path.join(rel, 'dpl.js'), js);
for (const p of PILLARS) fs.copyFileSync(path.join(here, 'assets', `${p.img}.webp`), path.join(rel, `${p.img}.webp`));
// a build pinned to a commit (DPL_REF) is the paste-ready file; every other build is the preview
out(path.join(here, 'ecwid', REF !== 'main-preview' && !process.env.DPL_BASE ? `pillars-${VERSION}-pinned.html` : `pillars-${VERSION}.html`), html);
console.log(`dpl ${VERSION} base=${BASE}`);
console.log(`tile ${html.length} chars · css ${Buffer.byteLength(css)} B · js ${Buffer.byteLength(js)} B${minified ? '' : ' (unminified: set ESBUILD)'}`);
if (html.length > 19000) throw new Error(`tile is ${html.length} characters; Ecwid cuts near 20,000`);
