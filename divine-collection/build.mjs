// Build: node divine-collection/build.mjs   (env DDC_REF=<git sha> pins the own-asset and loader URLs; default "main-preview")
// Writes release/<v>/ (ddc.css, ddc.js, assets/), ecwid/ (the two description fragments, the site-wide loader, the probe),
// preview/ (local pages). Fails on any content rule the owner set (prices, gendered wording, "No layers", "approximately", model counts).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collections, FIRM, HERO_ASSETS } from './src/data.mjs';

const VERSION = '2.0.0';
const here = path.dirname(fileURLToPath(import.meta.url));
const REF = process.env.DDC_REF || 'main-preview';
const CDN = `https://cdn.jsdelivr.net/gh/Matrress/Animation@${REF}/divine-collection/release/${VERSION}/`;
const rel = path.join(here, 'release', VERSION);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const out = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

// ---------- markup ----------
const f = (k) => `<span class="ddc__f ddc__f--${k}">${FIRM[k]}</span>`;
const iso = (top, bot, thin) => `<span class="ddc__iso${thin ? ' ddc__iso--thin' : ''}" aria-hidden="true"><span class="ddc__sl ddc__sl--bot ddc__f--${bot}"></span><span class="ddc__sl ddc__sl--top ddc__f--${top}"></span></span>`;

// compact firmness / depth facts for the floating preview card
function facts(m) {
  const F = m.firm; let h;
  if (F.levels) h = `<p class="ddc__pk">Firmness</p><p class="ddc__fz">${F.levels.map(f).join(' ')}</p>`;
  else if (F.pairs) h = `<p class="ddc__pk">Dual Plush mixes</p><ul class="ddc__mc">${F.pairs.map(([t, b]) => `<li>${f(t)} topper + ${f(b)} mattress</li>`).join('')}</ul>`;
  else if (F.layers) h = `<p class="ddc__pk">Layer combinations</p><ul class="ddc__mc">${F.layers.map(([t, b]) => `<li>${f(t)} upper layer over ${f(b)} lower layer</li>`).join('')}</ul>`;
  else if (F.split) h = `<p class="ddc__pk">Firmness, one for each side</p><ul class="ddc__mc">${F.split.map(([a, b]) => `<li>${f(a)} + ${f(b)}</li>`).join('')}</ul>`;
  else if (F.sides) h = `<p class="ddc__pk">Firmness</p><ul class="ddc__mc">${F.sides.map((k, i) => `<li>${f(k)} ${F.sideNames[i].toLowerCase()}</li>`).join('')}</ul>`;
  else if (F.text) h = `<p class="ddc__pk">Firmness</p><p class="ddc__fz">${F.text.map(([k, t]) => `<span class="ddc__f ddc__f--${k}">${esc(t)}</span>`).join(' ')}</p>`;
  else throw new Error(`${m.id}: no firmness data`);
  return `<div class="ddc__pf"><div>${h}</div><div><p class="ddc__pk">${esc(m.depth.label)}</p><p class="ddc__dl">${m.depth.items.map((d) => `<span class="ddc__d">${esc(d)}</span>`).join(' ')}</p></div></div>`;
}

// the floating card: opens on hover / focus (tap on touch), explains the model, then sends the visitor to the model page to buy
function pop(c, m, fam) {
  const dp = m.dp && c.dualPlush ? `<p class="ddc__dpn">${iso('s', 'm')}<span><b>Dual Plush.</b> ${esc(c.dualPlush.p)}</span></p>` : '';
  return `<div class="ddc__pop ddc-f-${fam.id}" role="group" aria-label="${esc(m.name)}: preview">
<div class="ddc__pc1">
<p class="ddc__crumb"><span class="ddc__crumb-f">${esc(fam.name)}</span>${m.dp ? '<span class="ddc__dp">Dual Plush</span>' : ''}</p>
<h4 class="ddc__pn">${esc(m.name)}</h4>
<p class="ddc__pt">${esc(m.title)}</p>
<p class="ddc__what">${esc(m.what)}</p>
<p class="ddc__who"><b>Who it suits.</b> ${esc(m.who)}</p>
${dp}</div>
<div class="ddc__pc2">${facts(m)}
<p class="ddc__buy"><b>You buy on the model page.</b> ${esc(c.buy)}</p>
<p class="ddc__acts"><a class="ddc__cta" href="${m.url}">View model<span class="ddc__sr"> ${esc(m.name)}</span></a></p>
</div>
</div>`;
}

function description(c, imgBase, ownBase) {
  const byId = Object.fromEntries(c.models.map((m) => [m.id, m]));
  const steps = c.steps.map((s, i) => `<li class="ddc__st${i === 0 ? ' ddc__st--now' : ''}"><span class="ddc__st-n">${i + 1}</span><span class="ddc__st-x"><span class="ddc__st-t">${esc(s)}</span><span class="ddc__st-w">${esc(c.stepNotes[i])}</span></span></li>`).join('');
  const tile = (m, fa) => `<li class="ddc__row ddc-m-${m.id}"><a class="ddc__ra" href="${m.url}"><span class="ddc__th${m.img.photo ? ' ddc__th--photo' : ''}"><img src="${(m.img.own ? ownBase : imgBase) + m.img.src}" width="280" height="${Math.round(m.img.h * 280 / m.img.w)}" loading="lazy" decoding="async" alt=""></span><span class="ddc__rn">${esc(m.name)}${m.dp ? ' <span class="ddc__dp">Dual Plush</span>' : ''}</span><span class="ddc__rd">${esc(m.row)}</span></a>${pop(c, m, fa)}</li>`;
  const fams = c.families.map((fa) => `<div class="ddc__fam ddc__fam--${fa.id} ddc__n${fa.models.length}"><h3 class="ddc__fam-h"><span class="ddc__fam-n">${esc(fa.name)}</span><span class="ddc__fam-s">${esc(fa.says)}</span></h3><ul class="ddc__rows">${fa.models.map((id) => tile(byId[id], fa)).join('')}</ul></div>`).join('\n');
  const foot = c.footer.map((t) => `<li>${esc(t)}</li>`).join('');
  return `<!-- Divine DunlopDreams Collection ${VERSION} · ${c.key} · generated by divine-collection/build.mjs: edit src/data.mjs, not this file -->
<div class="ddc ddc--${c.key}">
<div class="ddc__in">
<div class="ddc__hd">
<div class="ddc__ht"><h2 class="ddc__q">${esc(c.question)}</h2><p class="ddc__lede">${esc(c.lede)}</p></div>
<ol class="ddc__path">${steps}</ol>
</div>
<div class="ddc__tiles">
${fams}
</div>
<ul class="ddc__foot">${foot}</ul>
</div>
</div>
`;
}

// ---------- rules the owner set; the build refuses to write anything that breaks them ----------
const expected = { mattress: ['Botanic', 'Botanic Dual Plush', 'Bio Comfort', 'Bio Comfort Dual Plush', 'Orthopaedic Coconut Coir', 'Ambient', 'Hotel Line', 'Mattress for Partners'], topper: ['Bio Support', 'Bio Support Dual', 'Latex Topper for Partners'] };
function guard(c, html) {
  const names = c.models.map((m) => m.name);
  if (JSON.stringify([...names].sort()) !== JSON.stringify([...expected[c.key]].sort())) throw new Error(`${c.key}: models ${names.join(', ')}`);
  const grouped = c.families.flatMap((fa) => fa.models).sort().join();
  if (grouped !== c.models.map((m) => m.id).sort().join()) throw new Error(`${c.key}: every model must sit in exactly one family`);
  for (const m of c.models) {
    if (!/^https:\/\/divinedunlop\.com\/products\/[a-z0-9-]+$/.test(m.url)) throw new Error(`${m.id}: url ${m.url}`);
    const n = html.split(`href="${m.url}"`).length - 1;
    if (n !== 2) throw new Error(`${m.id}: expected 2 links (row + View model), found ${n}`);
  }
  const text = html.replace(/<[^>]+>/g, ' ');
  const bad = [[/£|\$\s?\d|€\s?\d/, 'a price'], [/\b(her|him|his|hers|women|men|man|woman)\b/i, 'gendered wording'], [/no layers/i, '"No layers"'], [/approximately|approx\.|≈|~\s?\d/i, 'an approximate value'], [/\bcures?\b|pain relief|guarantee/i, 'a medical or guaranteed-outcome claim'], [/Ambient Topper/i, 'an Ambient Topper']];
  for (const [re, what] of bad) if (re.test(text)) throw new Error(`${c.key}: ${what}: …${text.match(re)[0]}…`);
  if (/<script|<style|<link|\son\w+=|style="|data-|\sid="|\shidden/i.test(html)) throw new Error(`${c.key}: the description must not rely on scripts, style blocks, inline styles, data- attributes or ids`);
}

// ---------- CSS: !important on every declaration outside @font-face / @keyframes ----------
function importantize(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // walk the text: a run between braces is either a prelude (followed by "{") or a declaration block (followed by "}")
  const stack = []; let res = '', buf = '';
  const skip = () => stack.some((s) => /^@(font-face|keyframes)/.test(s));
  const decl = (b) => b.split(';').map((d) => {
    // a declaration's colon is outside any parentheses (url(data:…) values carry colons too)
    if (!d.trim() || /!important/.test(d) || !/^\s*[-a-z0-9]+\s*:/i.test(d)) return d;
    return d.replace(/\s*$/, '') + ' !important';
  }).join(';');
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') { const pre = buf.trim().split(/;/).pop().trim(); res += buf + ch; stack.push(pre); buf = ''; }
    else if (ch === '}') { res += (stack.length && !skip() ? decl(buf) : buf) + ch; stack.pop(); buf = ''; }
    else buf += ch;
  }
  res += buf;
  return res.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/\s*([{};])\s*/g, '$1').replace(/;}/g, '}').trim();
}

// ---------- build ----------
fs.rmSync(rel, { recursive: true, force: true });
const css = importantize(fs.readFileSync(path.join(here, 'src/ddc.css'), 'utf8'));
out(path.join(rel, 'ddc.css'), css);
const { transformSync } = await import(process.env.ESBUILD || 'esbuild');
const js = transformSync(fs.readFileSync(path.join(here, 'src/ddc.js'), 'utf8'), { minify: true, target: 'es2017' }).code;
out(path.join(rel, 'ddc.js'), js);
fs.mkdirSync(path.join(rel, 'assets'), { recursive: true });
for (const a of fs.readdirSync(path.join(here, 'src/assets'))) fs.copyFileSync(path.join(here, 'src/assets', a), path.join(rel, 'assets', a));

const sizes = {};
for (const c of Object.values(collections)) {
  const prod = description(c, HERO_ASSETS, CDN + 'assets/');
  guard(c, prod);
  out(path.join(here, `ecwid/description-${c.key}-${VERSION}.html`), prod);
  sizes[c.key] = prod.length;
  // local preview fragment: same markup, pictures from the repository
  out(path.join(here, `preview/fragment-${c.key}.html`), description(c, '../../divine-hero/release/1.17.1/assets/', `../release/${VERSION}/assets/`));
}

// site-wide loader for Instant Site custom code: CSS early (no unstyled flash), script deferred; does nothing twice
const loader = `<!-- Divine DunlopDreams Collection ${VERSION} loader (site-wide custom code). Styles + script for the .ddc category descriptions only. -->
<script>(function(d,b){if(window.__ddcLoader)return;window.__ddcLoader=1;var l=d.createElement('link');l.rel='stylesheet';l.href=b+'ddc.css';d.head.appendChild(l);var s=d.createElement('script');s.src=b+'ddc.js';s.defer=true;d.head.appendChild(s)})(document,'${CDN}');</script>
`;
out(path.join(here, `ecwid/loader-${VERSION}.html`), loader);
// the same loader as plain JavaScript, for a custom-code field that expects code without <script> tags
out(path.join(here, `ecwid/loader-${VERSION}.js`), /<script>([\s\S]*)<\/script>/.exec(loader)[1] + '\n');

// Phase-1 capability probe (for a TEST category only) + its optional site-wide loader
for (const a of ['probe.js', 'probe.css']) fs.copyFileSync(path.join(here, 'src/probe', a), path.join(rel, a));
let probe = fs.readFileSync(path.join(here, 'src/probe/probe.html'), 'utf8').replaceAll('{{V}}', VERSION).replaceAll('{{CDN}}', CDN);
{ // text blocks, each followed by a visible marker once the fragment has reached the given length
  let fill = '', n = 0;
  for (const mark of [15000, 20000, 28000, 35000]) {
    let chunk = '';
    while (probe.length - '{{FILLER}}'.length + fill.length + chunk.length + 160 < mark) chunk += `Probe filler sentence ${++n}: natural latex, seven zones, made to order. `;
    fill += `<details><summary>filler (collapsed)</summary><p>${chunk.trim()}</p></details><p><span class="ok">kept up to ${mark.toLocaleString('en-GB')} characters</span></p>`;
  }
  probe = probe.replace('{{FILLER}}', fill);
}
out(path.join(here, `ecwid/probe-${VERSION}.html`), probe);
out(path.join(here, `ecwid/probe-loader-${VERSION}.html`), `<!-- DDC probe ${VERSION}: OPTIONAL, temporary site-wide custom code for probe test 18. Remove after the test. -->
<script>window.__ddcProbeLoader=1;(function(d){var s=d.createElement('script');s.src='${CDN}probe.js';s.defer=true;d.head.appendChild(s)})(document);</script>
`);

console.log(`ddc ${VERSION} ref=${REF}`);
console.log(`probe ${probe.length} chars`);
console.log(`css ${css.length} B, js ${js.length} B, loader ${loader.length} chars`);
console.log(`description chars: mattress ${sizes.mattress}, topper ${sizes.topper}`);
