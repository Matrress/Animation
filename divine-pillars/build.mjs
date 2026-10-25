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
import { HEAD, MATERIALS, COMPARE, PILLARS, FOOT } from './src/content.mjs';

const VERSION = '0.8.0';
const here = path.dirname(fileURLToPath(import.meta.url));
const REF = process.env.DPL_REF || 'main-preview';
const BASE = process.env.DPL_BASE || `https://cdn.jsdelivr.net/gh/Matrress/Animation@${REF}/divine-pillars/release/${VERSION}/`;
// the Hero's own Chillax files, pinned (the same URLs Home Discovery and Firmness use)
const FONT_BASE = 'https://cdn.jsdelivr.net/gh/Matrress/Animation@f727e88417fd562938847735378af9a167e96034/divine-hero/release/1.20.2/assets/';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const out = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

// ---- the tile ----
const card = (p) => `<li class="dpl__p" id="dpl-${p.id}">
<button type="button" class="dpl__orb" aria-controls="dpl-panel" aria-expanded="false" aria-label="${p.n} ${esc(p.title)}: open the details"><img src="${BASE}${p.img}.webp" width="480" height="480" loading="lazy" decoding="async" alt="${esc(p.alt)}"><span class="dpl__num" aria-hidden="true">${p.n}</span></button>
<p class="dpl__pv">${esc(p.verb)}</p>
<h3 class="dpl__t">${esc(p.title)}</h3>
<p class="dpl__k"><b>${esc(p.key[0])}</b>${esc(p.key[1])}</p>
<p class="dpl__s">${esc(p.short)}</p>
<button type="button" class="dpl__btn dpl__more" aria-controls="dpl-panel" aria-expanded="false" aria-label="Explore ${esc(p.label)}${p.label !== p.title ? `, ${esc(p.title)}` : ''}">Explore<span class="dpl__bl"> ${esc(p.label)}</span> <u aria-hidden="true">&rarr;</u></button>
</li>`;

const table = `<div class="dpl__tbw"><div class="dpl__tbs"><table>
<caption class="dpl-sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Six material classes compared on density, resilience, recovery, support factor, air channels and heat response</caption>
<thead><tr><th scope="col">Material</th>${COMPARE.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
<tbody>${MATERIALS.map((m) => `<tr class="${m.ours ? 'is-ours' : ''}${m.id === 'tempur' ? 'is-tempur' : ''}"><th scope="row">${esc(m.name)}<small>${esc(m.how)}</small></th>${COMPARE.rows[m.id].map((v, i) => `<td data-l="${esc(COMPARE.cols[i])}">${esc(v)}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table></div><p class="dpl__note">${esc(COMPARE.note)}</p></div>`;

const loader = `<script>(function(){var s=document.getElementById('dpl');if(!s)return;s.classList.add('is-js');if(window.DPL){window.DPL.scan();return}var x=document.createElement('script');x.src='${BASE}dpl.js';x.defer=true;x.onerror=function(){s.classList.remove('is-js')};document.head.appendChild(x);setTimeout(function(){if(!window.DPL)s.classList.remove('is-js')},8000)})();</script>`;

const tile = `<link rel="stylesheet" href="${BASE}dpl.css">
<section class="dpl" id="dpl" aria-labelledby="dpl-h" data-version="${VERSION}">
<div class="dpl__in">
<header class="dpl__hd"><p class="dpl__eb">${esc(HEAD.eyebrow)}</p>
<h2 class="dpl__h" id="dpl-h">${HEAD.title}</h2>
<p class="dpl__lede">${esc(HEAD.lede)}</p></header>
<ol class="dpl__sun">
${PILLARS.map(card).join('\n')}
</ol>
<div class="dpl__panel" id="dpl-panel" role="region" hidden><div></div></div>
<div class="dpl__foot">
<details class="dpl__cmp" id="dpl-compare"><summary class="dpl__btn is-pri">${esc(FOOT.compare)}</summary>
${table}
</details>
<p class="dpl__next" data-dpl-sys hidden><span>${esc(FOOT.systemLead)}</span><a class="dpl__btn" href="#ddhd-system">${esc(FOOT.system)} <u aria-hidden="true">&darr;</u></a></p>
</div>
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
const visible = (tile.replace(/<script[\s\S]*?<\/script>/g, '') + JSON.stringify(data.pillars)).replace(/<[^>]+>/g, ' ');
const guards = [
  [/\blayers?\b/i, 'the word "layer"'],
  [/approximately|~/i, '"approximately" or "~"'],
  [/[£€$]\s?\d|\bprice\b/i, 'a price'],
  [/overheating|no more over/i, 'an absolute temperature promise'],
  [/Hotel Line/, 'Hotel Line'],
  [/unbeatable|best in class|highest in class/i, 'an untested superlative'],
];
for (const [re, what] of guards) if (re.test(visible)) throw new Error(`content guard: the tile or a panel contains ${what}`);
for (const m of tile.matchAll(/class="dpl__btn[^"]*"[^>]*>([^<]+)/g)) {   // buttons in Title Case, "and" / "or" in lower case
  for (const w of m[1].trim().split(/\s+/)) if (/^[a-z]/.test(w) && !['and', 'or'].includes(w)) throw new Error(`button not in Title Case: "${m[1].trim()}"`);
}
if (PILLARS.length !== 4) throw new Error('expected four laws');
for (const p of PILLARS) if (!fs.existsSync(path.join(here, 'assets', `${p.img}.webp`))) throw new Error(`missing photo assets/${p.img}.webp`);
const ids = [...tile.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
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
out(path.join(here, 'ecwid', REF !== 'main-preview' && !process.env.DPL_BASE ? `pillars-${VERSION}-pinned.html` : `pillars-${VERSION}.html`), tile);
console.log(`dpl ${VERSION} base=${BASE}`);
console.log(`tile ${tile.length} chars · css ${Buffer.byteLength(css)} B · js ${Buffer.byteLength(js)} B${minified ? '' : ' (unminified: set ESBUILD)'}`);
if (tile.length > 19000) throw new Error(`tile is ${tile.length} characters; Ecwid cuts near 20,000`);
