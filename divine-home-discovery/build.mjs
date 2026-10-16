// Divine DunlopDreams Home Discovery: build.
//   node divine-home-discovery/build.mjs
//
// Product facts are NOT stored in this folder. The approved Collection 3.13.2 sources (src/data.mjs, src/nav.mjs) are read
// straight from the pinned git commit (DHD_SOURCE_REF) with `git show`, written to .source/ (git-ignored) and imported from there.
// Nothing is copied into the repository, so there is no second product database to drift.
//
// env:
//   DHD_SOURCE_REF  commit that holds the approved Collection 3.13.2 sources (default: f4d9318, the commit the live loader is pinned to)
//   DHD_REF         commit that will host THIS tool's release files on jsDelivr (default "main-preview" = not yet pinned)
//   DHD_BASE        full base URL for dhd.css / dhd.js (overrides the jsDelivr URL; used for local previews)
//   ESBUILD         path to esbuild's main.js (npm i esbuild@0.24.0); without it the CSS/JS are written unminified
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { systemHtml } from './src/system.mjs';

const VERSION = '0.7.4';
// 0.7.4: same as 0.7.3 but the tile keeps its original outer layout; only the heading/lede pair is sized to one width.
// 0.7.3: the lede is exactly as wide as the heading (heading sets the width, lede fills it, justified). Replaces the 0.7.2 justified heading.
// 0.7.2: heading text-align:justify;text-align-last:justify — the h2 now spans the full container width, matching the lede paragraph below it.
// 0.7.1: the navigator stands alone. The System tile (0.7.0) stays in the repository but is only built and linked when DHD_SYSTEM_LINK=1.
const WITH_SYSTEM = process.env.DHD_SYSTEM_LINK === '1';
const SOURCE_VERSION = '3.13.2';
const SOURCE_REF = process.env.DHD_SOURCE_REF || 'f4d9318a14f32ede544936f332f3ff4e5e800768';
const REF = process.env.DHD_REF || 'main-preview';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
const BASE = process.env.DHD_BASE || `https://cdn.jsdelivr.net/gh/Matrress/Animation@${REF}/divine-home-discovery/release/${VERSION}/`;
// The Chillax files the live Hero 1.20.2 already loads (same URLs, so the browser cache is shared).
const FONT_BASE = 'https://cdn.jsdelivr.net/gh/Matrress/Animation@f727e88417fd562938847735378af9a167e96034/divine-hero/release/1.20.2/assets/';
// The one picture that lives in the collection's own release, not in the hero's assets.
const OWN_ASSETS = `https://cdn.jsdelivr.net/gh/Matrress/Animation@${SOURCE_REF}/divine-collection/release/${SOURCE_VERSION}/assets/`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Title Case for button and card labels (owner rule): every word capitalised except and / or / with / for / of / to / the ... ; units (cm) and numbers are left alone
const MINOR = new Set(['and', 'or', 'with', 'for', 'of', 'to', 'the', 'a', 'an', 'in', 'on', 'at', 'by', 'from', 'vs']);
const tc = (s) => String(s).split(' ').map((tok, i) => {
  const m = /^([^A-Za-z]*)([A-Za-z][A-Za-z’']*)(.*)$/.exec(tok);
  if (!m) return tok;
  const [, pre, w, post] = m, lw = w.toLowerCase();
  if (/^(cm|mm|kg)$/.test(lw)) return tok;
  if (i > 0 && MINOR.has(lw)) return pre + lw + post;
  if (w.length > 1 && w === w.toUpperCase()) return tok;
  return pre + w[0].toUpperCase() + w.slice(1) + post;
}).join(' ');
const out = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

// ---------- 1. approved sources, read from the pinned commit ----------
function show(p) {
  try { return execFileSync('git', ['show', `${SOURCE_REF}:${p}`], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { throw new Error(`Cannot read ${p} at ${SOURCE_REF}. Fetch the approved branch first:  git fetch origin claude/divine-collection\n${e.stderr || e.message}`); }
}
const collBuild = show('divine-collection/build.mjs');
if (!new RegExp(`const VERSION = '${SOURCE_VERSION.replace(/\./g, '\\.')}'`).test(collBuild)) throw new Error(`${SOURCE_REF} is not Collection ${SOURCE_VERSION}`);
// design tokens of the approved firmness colours: parsed strictly (four `k: '#rrggbb'` pairs), never evaluated
const firmBlock = /const FIRM_HEX = \{([^}]+)\};/.exec(collBuild);
if (!firmBlock) throw new Error('FIRM_HEX not found in the approved build.mjs');
const firmHex = Object.fromEntries([...firmBlock[1].matchAll(/\b([smfx]):\s*'(#[0-9a-fA-F]{6})'/g)].map((m) => [m[1], m[2]]));
if (Object.keys(firmHex).length !== 4) throw new Error('expected four firmness colours');
const srcDir = path.join(here, '.source', SOURCE_REF.slice(0, 12), 'divine-collection', 'src');
const hashes = {};
for (const f of ['data.mjs', 'nav.mjs']) {
  const txt = show(`divine-collection/src/${f}`);
  hashes[f] = crypto.createHash('sha256').update(txt).digest('hex');
  out(path.join(srcDir, f), txt);
}
const { collections, FIRM, HERO_ASSETS } = await import(pathToFileURL(path.join(srcDir, 'data.mjs')).href);
const { ROUTES, LABELS } = await import(pathToFileURL(path.join(srcDir, 'nav.mjs')).href);

// the body-weight ranges are the Hero's own Firmness Regulation card (same source the Collection navigator reads), read from the Hero commit that is live
const HERO_REF = process.env.DHD_HERO_REF || '199c8f8daa17c32bfc928dc6ba229332be5fe6ee';
let heroSheets;
try { heroSheets = execFileSync('git', ['show', `${HERO_REF}:divine-hero/src/sheets.html`], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { throw new Error(`Cannot read the Hero's sheets.html at ${HERO_REF}. Fetch it first:  git fetch origin claude/divine-hero-polish\n${e.stderr || e.message}`); }
const hi = heroSheets.indexOf('id="ddh-hc-weight"');
if (hi < 0) throw new Error('hero sheets.html: the Firmness Regulation card moved');
const hblk = heroSheets.slice(hi, heroSheets.indexOf('</aside>', hi));
const ranges = [...hblk.matchAll(/<li class="ddh__hcf-(\w)"><b[^>]*>([^<]*)<\/b><span[^>]*>([^<]*)<\/span>/g)].map((m) => ({ k: m[1], n: m[2], r: m[3] }));
if (ranges.map((r) => r.k).join('') !== 'smfx' || ranges.some((r) => !/\d\s*kg/.test(r.r) || /[~≈]|approx/i.test(r.r))) throw new Error('hero firmness ranges changed');
hashes['hero-sheets.html'] = crypto.createHash('sha256').update(heroSheets).digest('hex');

// ---------- 2. markup ----------
const M = collections.mattress, T = collections.topper;
const famOf = (c, m) => c.families.find((f) => f.models.includes(m.id));
const label = (c, m) => (c === M && LABELS[m.id] ? LABELS[m.id].join(' · ') : famOf(c, m).name);
const imgSrc = (m, big) => (big && m.img.big ? HERO_ASSETS + m.img.big : (m.img.own ? OWN_ASSETS : HERO_ASSETS) + m.img.src);
const byName = (c, name) => c.models.find((x) => x.name === name);
const F = (k) => `<span class="ddhd__f ddhd__f--${k}">${esc(FIRM[k])}</span>`;
const stk = (t, b) => `<span class="ddhd__stk" aria-hidden="true"><i class="ddhd__f--${t}"></i><b class="ddhd__f--${b}"></b></span>`;

function facts(m) {
  const f = m.firm; let h = '';
  if (f.levels) h = `<p class="ddhd__fz">${f.levels.map(F).join(' ')}</p>`;
  else if (f.pairs) h = '';  // shown as the approved topper-over-mattress diagrams (see dualPlush below), not as a second list
  else if (f.layers) h = `<ul class="ddhd__ul">${f.layers.map(([t, b]) => `<li>${stk(t, b)}<span>${F(t)} upper layer over ${F(b)} lower layer</span></li>`).join('')}</ul>`;
  else if (f.split) h = `<ul class="ddhd__ul">${f.split.map(([a, b]) => `<li><span>${F(a)} + ${F(b)}</span></li>`).join('')}</ul>`;
  else if (f.sides) h = `<ul class="ddhd__ul">${f.sides.map((k, i) => `<li><span>${F(k)} ${esc(f.sideNames[i].toLowerCase())}</span></li>`).join('')}</ul>`;
  else if (f.text) h = `<p class="ddhd__fz">${f.text.map(([k, t]) => `<span class="ddhd__f ddhd__f--${k}">${esc(t)}</span>`).join(' ')}</p>`;
  else throw new Error(`${m.id}: no firmness data`);
  const title = f.layers ? 'Layer Combinations' : f.split ? 'Firmness, One for Each Side' : 'Firmness';
  return `<div class="ddhd__pf">${h ? `<div><p class="ddhd__k">${title}</p>${h}</div>` : ''}<div><p class="ddhd__k">${esc(tc(m.depth.label))}</p><p class="ddhd__dl">${m.depth.items.map((d) => `<span class="ddhd__d">${esc(d)}</span>`).join(' ')}</p></div></div>`;
}

// the Bio Dunlop mark (the owner's drawing, converted once: assets/bio-dunlop.svg) with its window: <details>, so it opens without script too; the wording is the owner's
// pinned to the commit that first carried the file, so dhd.js is byte-identical in every build (it does not depend on DHD_REF / DHD_BASE)
const BIO_IMG = 'https://cdn.jsdelivr.net/gh/Matrress/Animation@9d681f860c9dae7dd866236d6824f413443b8512/divine-home-discovery/assets/bio-dunlop.svg';
const bio = () => `<details class="ddhd__bio"><summary class="ddhd__bio-s"><img class="ddhd__bio-i" src="${BIO_IMG}" loading="lazy" alt="Bio Dunlop: certified European production"></summary><div class="ddhd__bio-p"><p class="ddhd__bio-h">Fully Certified</p><p>Certified European production for European customers and standards.</p></div></details>`;
// the owner's wording for the Dual Plush principle replaces the Collection's "Layers with a job" line (no "layer" in Dual Plush wording)
const principle = ([h, t]) => /^layers with a job$/i.test(h) ? ['Dual Plush', 'A latex mattress with a latex topper on top is one system: the mattress gives the support and the latex topper gives the comfort.'] : [h, t];

// the preview of one model: built here, once, from the approved data; the script only inserts it
function preview(c, m) {
  const big = imgSrc(m, true);
  const w = m.img.big ? m.img.bw : m.img.w, h = m.img.big ? m.img.bh : m.img.h;
  const diff = (m.differs || []).map(([n, t]) => {
    const o = byName(c, n);
    return `<li>${o ? `<button type="button" class="ddhd__jump" data-jump="${o.id}">${esc(n)}</button>` : `<b>${esc(n)}</b>`} ${esc(t)}</li>`;
  }).join('');
  // Dual Plush: the approved explanation, and one diagram per combination = the Collection 3.13.2 SVG assets (dual-plush-<top>-<bottom>.svg), same wording as the Collection page
  const n = m.firm.pairs ? m.firm.pairs.length : 0;
  const combos = n ? `<div class="ddhd__dp-c"><p class="ddhd__k">Dual Plush: ${n} Combinations</p><ul class="ddhd__dpg ddhd__dpg--${n}">${m.firm.pairs.map(([t, b]) => `<li class="ddhd__dpv"><img class="ddhd__dpv-i" src="${OWN_ASSETS}dual-plush-${t}-${b}.svg" width="246" height="100" loading="lazy" decoding="async" alt="${esc(FIRM[t])} topper above a ${esc(FIRM[b])} mattress"><span class="ddhd__dpv-r">${F(t)} <span>topper, above</span></span><span class="ddhd__dpv-r">${F(b)} <span>mattress, below</span></span></li>`).join('')}</ul></div>` : '';
  const dp = m.dp && c.dualPlush ? `<div class="ddhd__dp"><div class="ddhd__dp-t"><p class="ddhd__k">${esc(tc(c.dualPlush.h))}</p><p>${esc(c.dualPlush.p)}</p></div>${combos}</div>` : '';
  return `<div class="ddhd__pv">
<div class="ddhd__pv-l"><div class="ddhd__pv-fig"><img src="${big}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(m.img.alt)}"></div>
${facts(m)}</div>
<div class="ddhd__pv-r"><div class="ddhd__pv-main">
<p class="ddhd__crumb">${esc(label(c, m))}</p>
<h4 class="ddhd__pv-name" id="ddhd-pv-${m.id}">${esc(m.name)}</h4>
${m.type ? `<p class="ddhd__pv-type">${esc(m.type)}</p>` : ''}<p class="ddhd__what">${esc(m.what)}</p>
<p class="ddhd__who"><b>Who it suits.</b> ${esc(m.who)}</p>
<p class="ddhd__bld"><b>How it is built.</b> ${esc(m.build)}</p>
</div></div>
${dp}<div class="ddhd__df">${diff ? `<div class="ddhd__dfl"><p class="ddhd__k">How It Differs</p><ul class="ddhd__ul ddhd__ul--p">${diff}</ul></div>` : ''}${bio()}</div>
<div class="ddhd__pv-foot"><p class="ddhd__buy">${esc(c.buy)}</p><a class="ddhd__cta" data-ddhd-product="${m.id}" href="${m.url}">View ${esc(m.name)} &amp; Buy</a></div>
</div>`;
}

function card(c, m, kind) {
  const fam = famOf(c, m);
  return `<li class="ddhd__card" id="ddhd-m-${m.id}" data-id="${m.id}">
<div class="ddhd__fig${m.img.photo ? ' ddhd__fig--photo' : ''}"><img src="${imgSrc(m)}" width="${m.img.w}" height="${m.img.h}" loading="lazy" decoding="async" alt="${esc(m.img.alt)}"></div>
<div class="ddhd__bd"><p class="ddhd__lab">${esc(label(c, m))}${m.dp ? ' <span class="ddhd__dpb">+ Topper</span>' : ''}</p>
<h4 class="ddhd__nm"><a data-ddhd-product="${m.id}" href="${m.url}">${esc(m.name)}</a></h4>
<p class="ddhd__ty">${esc(m.type || fam.says)}</p>
<p class="ddhd__fn">${esc(tc(m.fn || m.row))}</p></div>
<p class="ddhd__ac"><button type="button" class="ddhd__more" aria-expanded="false"><span>Compare &amp; Details</span><span class="ddhd__sr"> ${esc(m.name)}</span></button><a class="ddhd__go" href="${m.url}">View Model<span class="ddhd__sr"> ${esc(m.name)}</span> &rarr;</a></p>
</li>`;
}

const needs = ROUTES.map((r, i) => {
  const first = r.models[0].id;
  return `<li><a class="ddhd__chip" data-route="${i}" href="#ddhd-m-${first}">${esc(tc(r.title))}</a></li>`;
}).join('\n');

function view(c, kind, id) {
  const n = c.models.length;
  const isM = kind === 'mattress';
  return `<div class="ddhd__view" id="ddhd-${id}" data-view-panel="${id}">
<div class="ddhd__vh"><div class="ddhd__vt"><h3 class="ddhd__q">${esc(c.question)}</h3><p class="ddhd__lede">${esc(c.lede)}</p></div>${bio()}</div>
${isM ? `<div class="ddhd__needs"><p class="ddhd__needs-h" id="ddhd-needs-h">What Matters Most to You?</p>
<ul class="ddhd__chips" aria-labelledby="ddhd-needs-h">
<li class="ddhd__js"><a class="ddhd__chip ddhd__chip--all" data-route="all" href="#ddhd-mattress">All ${n} Models</a></li>
${needs}
</ul>
<div class="ddhd__guide ddhd__js" aria-live="polite" hidden></div></div>` : ''}
<ul class="ddhd__grid ddhd__grid--${id}">
${c.models.map((m) => card(c, m, id)).join('\n')}
</ul>
<ul class="ddhd__pr">${c.principles.map(principle).map(([h, t]) => `<li><b>${esc(tc(h))}</b> ${esc(t)}</li>`).join('')}</ul>
<div class="ddhd__ft"><p class="ddhd__all"><a href="${c.url}" data-ddhd-collection="${id}">Open the Full ${esc(c.label)} <span aria-hidden="true">&rarr;</span></a></p>${bio()}</div>
</div>`;
}

const section = `<section class="ddhd" id="ddhd" data-ddhd-root aria-labelledby="ddhd-h">
<div class="ddhd__in">
<div class="ddhd__hd">
<div class="ddhd__ht"><p class="ddhd__eb">Natural latex sleep systems</p>
<h2 class="ddhd__h" id="ddhd-h">Find <b>Your</b> Natural Sleep <b>Solution</b></h2>
<p class="ddhd__lede">Start with what you need: a new latex mattress, or a latex topper to improve the mattress you already have.</p></div>
<div class="ddhd__pick"><p class="ddhd__ask" id="ddhd-ask">What Are You Looking For?</p><p class="ddhd__ask-s">Select one to see your models and how to choose</p>
<nav class="ddhd__sw" aria-labelledby="ddhd-ask">
<a class="ddhd__tab" href="#ddhd-mattress" data-tab="mattress"><span class="ddhd__tab-d" aria-hidden="true"></span><span class="ddhd__tab-n">Latex Mattresses</span><span class="ddhd__tab-c">${M.models.length} Models</span></a>
<a class="ddhd__tab" href="#ddhd-topper" data-tab="topper"><span class="ddhd__tab-d" aria-hidden="true"></span><span class="ddhd__tab-n">Latex Toppers</span><span class="ddhd__tab-c">${T.models.length} Models</span></a>
</nav></div>
</div>
${WITH_SYSTEM ? `<a class="ddhd__sys" href="#ddhd-system" data-ddhd-system><span class="ddhd__sys-t"><b>What Makes Our Latex Sleep System Different?</b><span>Explore how every model, material and comfort configuration is built around a real customer need.</span></span><i class="ddhd__sys-b">Explore the System <u aria-hidden="true">&rarr;</u></i></a>` : ''}
${view(M, 'mattress', 'mattress')}
${view(T, 'topper', 'topper')}
</div>
</section>`;

// the tiny bootstrap that stays in the Ecwid field: marks the section as script-enhanced before first paint (no layout shift),
// loads the one script, and takes the enhancement away again if the script cannot load (the static range then stays visible)
const boot = `<script>(function(){var s=document.getElementById('ddhd');if(!s)return;s.classList.add('is-js');if(window.DDHD){window.DDHD.scan();return}var x=document.createElement('script');x.src='${BASE}dhd.js';x.defer=true;x.onerror=function(){s.classList.remove('is-js')};document.head.appendChild(x);setTimeout(function(){if(!window.DDHD)s.classList.remove('is-js')},8000)})();</script>`;

const header = `<!-- Divine DunlopDreams Home Discovery ${VERSION} · Collection ${SOURCE_VERSION} @ ${SOURCE_REF.slice(0, 12)} · generated by build.mjs -->`;
const embed = `${header}\n<link rel="stylesheet" href="${BASE}dhd.css">\n${section}\n${boot}\n`;

// ---------- 2b. tile 2: the System section (own file, own script; linked to tile 1 by the id #ddhd-system and the mattress tab) ----------
// (routes need dpWords, defined below with the script data: the tile is generated after section 3)

// ---------- 3. data for the script (previews, route guidance) ----------
const previews = {}, names = {};
for (const c of [M, T]) for (const m of c.models) { previews[m.id] = preview(c, m); names[m.id] = { n: m.name, v: c === M ? 'mattress' : 'topper' }; }
// the owner's rule: in Dual Plush wording the upper part is always "latex topper", never a "layer" (the Collection source still says "comfort layer"; the wording is rewritten here, the source is not touched)
const dpWords = (t) => String(t)
  .replace(/\b(?:a|an) (second|additional) (?:(natural|adaptable) )?(?:latex )?comfort layer\b/gi, (m, w, adj) => { const mid = [/^add/i.test(w) ? 'additional' : '', adj || ''].filter(Boolean); return `${/^[aeiou]/i.test(mid[0] || 'l') ? 'an' : 'a'} ${mid.join(' ')}${mid.length ? ' ' : ''}latex topper`; })
  .replace(/\blatex comfort layer\b/gi, 'latex topper')
  .replace(/\bsecond comfort layer\b/gi, 'latex topper')
  .replace(/\bcomfort layer\b/gi, 'latex topper');
const isDP = (r) => r.models.some((x) => /_dp$/.test(x.id)) || /dual plush/i.test(r.answer + r.title);
const routes = ROUTES.map((r) => { const dp = isDP(r); const f = dp ? dpWords : (t) => t; return { t: r.title, need: r.need, a: f(r.answer), m: r.models.map((x) => ({ id: x.id, l: /_dp$/.test(x.id) ? dpWords(x.line) : x.line })) }; });
for (const r of ROUTES) for (const x of r.models) if (!names[x.id]) throw new Error(`route model ${x.id} is not in data.mjs`);

const routesFor = routes.map((r) => ({ ...r }));
const sysSection = systemHtml({ M, T, FIRM, routes: routesFor, ranges, esc, tc, ownAssets: OWN_ASSETS, bioImg: BIO_IMG, firmHex });
const sysBoot = `<script>(function(){var s=document.getElementById('ddhd-system');if(!s)return;s.classList.add('is-js');if(window.DSYS){window.DSYS.scan();return}var x=document.createElement('script');x.src='${BASE}dsys.js';x.defer=true;x.onerror=function(){s.classList.remove('is-js')};document.head.appendChild(x);setTimeout(function(){if(!window.DSYS)s.classList.remove('is-js')},8000)})();</script>`;
const sysHeader = `<!-- Divine DunlopDreams System ${VERSION} · tile 2 of 2, install directly BELOW the Home Discovery navigator tile · product data: Collection ${SOURCE_VERSION} @ ${SOURCE_REF.slice(0, 12)}, body-weight ranges: Hero firmness card @ ${HERO_REF.slice(0, 12)} · generated by divine-home-discovery/build.mjs -->`;
const sysEmbed = `${sysHeader}\n<link rel="stylesheet" href="${BASE}dsys.css">\n${sysSection}\n${sysBoot}\n`;

// ---------- 4. css / js ----------
function importantize(css) {
  // every declaration of a style rule gets !important (Ecwid's id-prefixed storefront CSS would otherwise win); custom properties, @font-face and @keyframes stay as written
  const decls = (b) => b.split(/;(?![^(]*\))/).map((d) => (!d.trim() || /^\s*--/.test(d) || /!important/.test(d) ? d : d.replace(/\s*$/, '') + ' !important')).join(';');
  let i = 0, o = '';
  while (i < css.length) {
    if (/\s/.test(css[i])) { o += css[i++]; continue; }
    if (css.startsWith('/*', i)) { const e = css.indexOf('*/', i); o += css.slice(i, e + 2); i = e + 2; continue; }
    const b = css.indexOf('{', i); if (b < 0) { o += css.slice(i); break; }
    const pre = css.slice(i, b); let depth = 1, j = b + 1;
    while (depth && j < css.length) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(b + 1, j - 1);
    if (/^\s*@(media|container|supports|layer)/.test(pre)) o += pre + '{' + importantize(body) + '}';
    else if (/^\s*@(font-face|keyframes|-webkit-keyframes)/.test(pre)) o += pre + '{' + body + '}';
    else o += pre + '{' + decls(body) + '}';
    i = j;
  }
  return o;
}
const tokens = `.ddhd{${Object.entries(firmHex).map(([k, v]) => `--ddhd-f-${k}:${v}`).join(';')}}`;
const fonts = `@font-face{font-family:DDHDChillax;src:url(${FONT_BASE}chillax-400.woff2) format("woff2");font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:DDHDChillax;src:url(${FONT_BASE}chillax-600.woff2) format("woff2");font-weight:600;font-style:normal;font-display:swap}`;
let css = fonts + '\n' + tokens + '\n' + importantize(fs.readFileSync(path.join(here, 'src/dhd.css'), 'utf8'));
let js = fs.readFileSync(path.join(here, 'src/dhd.js'), 'utf8')
  .replaceAll('__VERSION__', () => VERSION)   // function replacers: a "$" in the data must never be read as a replacement pattern
  .replace('__PREVIEWS__', () => JSON.stringify(previews))
  .replace('__ROUTES__', () => JSON.stringify(routes))
  .replace('__NAMES__', () => JSON.stringify(names));
let sysCss = fonts + '\n' + importantize(fs.readFileSync(path.join(here, 'src/dsys.css'), 'utf8'));
let sysJs = fs.readFileSync(path.join(here, 'src/dsys.js'), 'utf8').replaceAll('__VERSION__', () => VERSION);
let minified = false;
if (process.env.ESBUILD) {
  const { transformSync } = await import(pathToFileURL(process.env.ESBUILD).href);
  css = transformSync(css, { loader: 'css', minify: true }).code;
  js = transformSync(js, { loader: 'js', minify: true, target: 'es2019' }).code;
  sysCss = transformSync(sysCss, { loader: 'css', minify: true }).code;
  sysJs = transformSync(sysJs, { loader: 'js', minify: true, target: 'es2019' }).code;
  minified = true;
}

// ---------- 5. content guards (the owner's standing rules) ----------
const text = embed.replace(/<[^>]+>/g, ' ') + JSON.stringify(previews);
const guards = [
  [/[£€$]\s?\d|\b\d[\d.,]*\s?(GBP|EUR)\b|\bfrom\s+[£€$]/i, 'a price (a currency amount)'],
  [/\b(her|him|she|he|woman|man)\b/i, 'gendered wording'],
  [/approximately|\babout \d/i, '"approximately"'],
  [/<h1/i, 'an H1'],
  [/latest-design-latex-mattresses-cloud-comfort/, 'the retired Bio Comfort URL'],
  [/layers with a job/i, 'the retired "Layers with a job" line'],
];
// Dual Plush wording never says "layer": every route line / answer / preview that mentions Dual Plush
for (const r of routes) for (const t of [r.a, ...r.m.map((x) => x.l)]) if (/dual plush|_dp|topper/i.test(t + JSON.stringify(r.m.map((x) => x.id))) && /layer/i.test(t) && /dual plush|_dp/i.test(r.a + JSON.stringify(r.m.map((x) => x.id)))) throw new Error(`content guard: Dual Plush text says "layer": ${t}`);
for (const [id, html] of Object.entries(previews)) if (/_dp$/.test(id) && /layer/i.test(html)) throw new Error(`content guard: ${id} preview says "layer"`);
for (const [re, what] of guards) if (re.test(embed + JSON.stringify(previews))) throw new Error(`content guard: output contains ${what}`);
// the System tile follows the same standing rules
const sysText = sysEmbed;
if (WITH_SYSTEM) {
for (const [re, what] of guards) if (re.test(sysText)) throw new Error(`content guard (system): output contains ${what}`);
if (/\blayers?\b/i.test(sysText.replace(/<[^>]+>/g, ' '))) throw new Error('content guard (system): the word "layer" appears; the upper part of Dual Plush is always "latex topper"');
if (/\b(baby|babies|infant|OEKO|certificate number)\b/i.test(sysText)) throw new Error('content guard (system): a baby / certificate claim needs a supplied document first');
if (!/More than a mattress\. A complete sleep system\./.test(sysText) || !/Find Your Latex Mattress/.test(sysText)) throw new Error('system: the story ending is missing');
for (const r of ranges) if (!sysText.includes(r.r)) throw new Error(`system: the Hero weight range "${r.r}" is not in the tile`);
}
const cards = (embed.match(/class="ddhd__card"/g) || []).length;
if (cards !== M.models.length + T.models.length) throw new Error(`expected ${M.models.length + T.models.length} cards, got ${cards}`);
for (const m of [...M.models, ...T.models]) if (!embed.includes(`href="${m.url}"`)) throw new Error(`${m.id}: product link missing`);
if (M.models.length !== 8 || T.models.length !== 3) throw new Error('expected 8 mattresses and 3 toppers');

// ---------- 6. write ----------
const rel = path.join(here, 'release', VERSION);
out(path.join(rel, 'dhd.css'), css);
out(path.join(rel, 'dhd.js'), js);
if (WITH_SYSTEM) { out(path.join(rel, 'dsys.css'), sysCss); out(path.join(rel, 'dsys.js'), sysJs); }
out(path.join(here, 'ecwid', `section-${VERSION}.html`), embed);
if (WITH_SYSTEM) out(path.join(here, 'ecwid', `system-${VERSION}.html`), sysEmbed);
out(path.join(rel, 'SOURCES.json'), JSON.stringify({ tool: VERSION, collection: SOURCE_VERSION, sourceCommit: SOURCE_REF, heroCommit: HERO_REF, sha256: hashes, fonts: FONT_BASE, images: [HERO_ASSETS, OWN_ASSETS] }, null, 2) + '\n');
console.log(`ddhd ${VERSION} source=${SOURCE_REF.slice(0, 12)} base=${BASE}`);
console.log(`system tile ${sysEmbed.length} chars · dsys.css ${Buffer.byteLength(sysCss)} B · dsys.js ${Buffer.byteLength(sysJs)} B`);
console.log(`section ${embed.length} chars (${Buffer.byteLength(embed)} B) · css ${Buffer.byteLength(css)} B · js ${Buffer.byteLength(js)} B${minified ? '' : ' (unminified: set ESBUILD)'} · ${cards} cards`);
