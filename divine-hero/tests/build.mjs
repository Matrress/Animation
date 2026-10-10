// Build: src/ -> release/<version>/ (minified CSS/JS) + Ecwid section files + local test harnesses.
// usage: node tests/build.mjs   (needs esbuild; see README "Rebuilding")
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const VERSION = '1.17.1';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const esbuild = process.env.ESBUILD || 'esbuild';
const rel = path.join(root, 'release', VERSION);
fs.mkdirSync(rel, { recursive: true });

execFileSync(esbuild, [path.join(root, 'src/hero.css'), '--minify', '--legal-comments=inline', '--target=chrome105,safari16,firefox110', '--outfile=' + path.join(rel, 'hero.css')], { stdio: 'inherit' });
execFileSync(esbuild, [path.join(root, 'src/hero.js'), '--minify', '--legal-comments=inline', '--target=es2017', '--outfile=' + path.join(rel, 'hero.js')], { stdio: 'inherit' });
// 1.5.0: hotspot copy translations, minified JSON, fetched on demand (hero.js: <base>i18n/<lang>.json)
fs.mkdirSync(path.join(rel, 'i18n'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'src/i18n'))) fs.writeFileSync(path.join(rel, 'i18n', f), JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, 'src/i18n', f), 'utf8'))));

// 1.10.0: the Bio Comfort screen and the two collection previews ("sheets") live outside the pasted section (the live
// editor cuts pastes at ~20k characters): one HTML file per language, fetched by hero.js after page load.
// src/sheets.html is the English source; data-t / data-ta mark the text (inner HTML) / alt-or-aria-label to translate,
// from src/sheets-i18n/<lang>.txt ("key = value" lines). Every language must cover every key.
{
  let src = fs.readFileSync(path.join(root, 'src/sheets.html'), 'utf8');
  // 1.11.1: the model selector's list cards and the global size guide are generated from src/models.json and
  // src/sizes.json; every model must have its preview (data-ddh-pv) with the same direct product link.
  {
    const { models } = JSON.parse(fs.readFileSync(path.join(root, 'src/models.json'), 'utf8'));
    const sz = JSON.parse(fs.readFileSync(path.join(root, 'src/sizes.json'), 'utf8'));
    const esc = (s) => s.replace(/&/g, '&amp;');
    const W = { s: ['w_s', 'Soft'], m: ['w_m', 'Medium'], f: ['w_f', 'Firm'], x: ['w_x', 'Extra Firm'], sx: ['w_sx', 'Super Firm'] };
    const fw = (l) => `<span data-t="${W[l][0]}">${W[l][1]}</span>`, dot = (l) => `<i class="ddh__fd ddh__fd--${l}"></i>`;
    const firm = (fs) => !fs ? '' : fs.levels ? `<span class="ddh__fds" aria-hidden="true">${fs.levels.map(dot).join('')}</span><span class="ddh__sr">${fs.levels.map(fw).join(', ')}</span>`
      : fs.pairs ? `<span class="ddh__fds ddh__fds--pairs" aria-hidden="true">${fs.pairs.map(([t, m]) => `<i class="ddh__fp">${dot(t)}${dot(m)}</i>`).join('')}</span><span class="ddh__sr">${fs.pairs.map(([t, m]) => fw(m) + ' + ' + fw(t)).join(', ')}</span>`
      : fs.split ? `<span class="ddh__fds" aria-hidden="true"><i class="ddh__fd ddh__fd--split"></i></span><span class="ddh__sr">${fs.split.map(fw).join(' | ')}</span>` : '';
    const chipEn = (k) => { const r = new RegExp(`data-t="${k}">([^<]*)<`).exec(src); if (!r) throw new Error('no chip text for ' + k); return r[1]; };
    const img = (m) => `<span class="ddh__mc-img"><img src="{{BASE}}${m.image.src}" width="${m.image.width}" height="${m.image.height}" loading="lazy" decoding="async" alt=""></span>`;
    const go = '<span class="ddh__mc-go"><span data-t="view_model">View model</span><i aria-hidden="true"></i></span>';
    const name = (m) => `<b class="ddh__mc-n"${m.nameKey ? ` data-t="${m.nameKey}"` : ''}>${esc(m.name)}</b>`;
    // 1.11.1: mattresses are "cubes" (picture, family tag, name, one line, heights + firmness marks); toppers stay a linear list
    const card = (m, first) => `<li><a class="ddh__mc${m.facts ? ' ddh__mc--cube' : ''}" href="${m.url}" data-ddh-m="${m.id}" data-fam="${m.family}"${first ? ' aria-current="true"' : ''}>${img(m)}<span class="ddh__mc-tx">`
      + (m.facts ? `<small class="ddh__mc-tag" data-t="${m.tag.key}">${chipEn(m.tag.key)}</small>${name(m)}<span class="ddh__mc-p" data-t="${m.positioning.key}">${esc(m.positioning.en)}</span><span class="ddh__mc-f"><span class="ddh__mc-h">${m.facts.heights}</span>${firm(m.facts.firmness)}</span>`
        : `${name(m)}<span class="ddh__mc-p" data-t="${m.positioning.key}">${esc(m.positioning.en)}</span><span class="ddh__mc-b">${m.benefits.slice(0, 2).map((b) => `<span data-t="${b.key}">${esc(b.en)}</span>`).join('')}</span>`)
      + `</span>${go}</a></li>`;
    // the previews take their family and their benefits from the same data
    for (const m of models) {
      const at = src.indexOf(`data-ddh-pv="${m.id}"`); if (at < 0) continue;
      const end = src.indexOf('</article>', at), seg = src.slice(at, end);
      const seg2 = seg.replace(`data-ddh-pv="${m.id}"`, `data-ddh-pv="${m.id}" data-fam="${m.family}"`).replace(/<ul class="ddh__pv-b">[\s\S]*?<\/ul>/, `<ul class="ddh__pv-b">${m.benefits.map((b) => `<li data-t="${b.key}">${esc(b.en)}</li>`).join('')}</ul>`);
      src = src.slice(0, at) + seg2 + src.slice(end);
    }
    const list = (pick) => models.filter(pick).map((m) => card(m, false)).join('\n');   // 1.14.0: nothing preselected: the selector opens on its guide
    src = src.replace('<!--MODELS:core-->', list((m) => m.row === 'core')).replace('<!--MODELS:purpose-->', list((m) => m.row === 'purpose')).replace('<!--MODELS:topper-->', list((m) => m.group === 'topper'));
    for (const m of models) {
      const at = src.split(`data-ddh-pv="${m.id}"`).length - 1;
      if (at !== 1) throw new Error(`model ${m.id}: ${at} previews`);
      const pv = src.slice(src.indexOf(`data-ddh-pv="${m.id}"`)), href = /class="ddh__pv-cta" href="([^"]+)"/.exec(pv)[1];
      if (href !== m.url) throw new Error(`model ${m.id}: preview links ${href}, data says ${m.url}`);
    }
    const row = (s) => `<li><span>${s.name}</span><b>${s.cm[0]} × ${s.cm[1]} cm</b><small>${s.in[0]}″ × ${s.in[1]}″</small></li>`;
    const contact = sz.contactUrl ? `<a href="${sz.contactUrl}" data-t="sz_contact">Contact us</a>` : '<b data-t="sz_contact">Contact us</b>';
    src = src.replace('<!--SIZES-->', `<section class="ddh__szp" id="ddh-sizes" role="dialog" aria-modal="false" aria-labelledby="ddh-sz-t" tabindex="-1" hidden>\n<div class="ddh__szp-in">\n<button class="ddh__sh-x" type="button" data-ddh-close aria-label="Close" data-ta="close"><i aria-hidden="true"></i></button>\n<h2 class="ddh__szp-h" id="ddh-sz-t" data-t="sz_h">All UK &amp; EU sizes</h2><p class="ddh__szp-s" data-t="sz_s">Width × length, the same for every mattress and topper</p>\n<ul class="ddh__szl">${sz.sizes.map(row).join('')}<li class="ddh__szl-c"><span data-t="sz_custom">Custom size</span>${contact}</li></ul>\n<p class="ddh__szp-n" data-t="sz_note">Need a custom size, custom depth or special shape? Contact us and we will help configure it.</p>\n</div>\n</section>`);
    if (/£|\$\d|€\d/.test(src)) throw new Error('a price in the sheets: the hero carries none');
    // the same key must carry the same English everywhere (generated list cards vs authored previews)
    const seen = {};
    for (const m of src.matchAll(/<(\w+)\b[^>]*?\sdata-t="(\w+)"[^>]*>([\s\S]*?)<\/\1>/g)) { if (m[2] in seen && seen[m[2]] !== m[3]) throw new Error(`key ${m[2]}: two different English texts`); seen[m[2]] = m[3]; }
  }
  // 1.17.0: "Back to the overview" leaves the picture and sits beside "View model" (owner request): both buttons share one row under the text
  src = src.replace(/<article class="ddh__pv\b[\s\S]*?<\/article>/g, (art) => {
    const back = /<button class="ddh__pv-back"[\s\S]*?<\/button>/.exec(art); const cta = /<a class="ddh__pv-cta"[\s\S]*?<\/a>/.exec(art);
    if (!back || !cta) return art;
    // 1.17.1: the buttons form one row at the foot of the text area (spanning both columns), not a stack in the narrow left column
    const acts = `<div class="ddh__pv-acts">${cta[0]}${back[0]}</div>`;
    const cut = art.replace(back[0], '').replace(cta[0], '');
    const end = cut.lastIndexOf('</div></article>');
    return end < 0 ? art : cut.slice(0, end) + acts + cut.slice(end);
  });
  // 1.17.1 Dual Plush icons: an isometric exploded pair of slabs (thin latex topper over the latex mattress; two thin layers for a two-layer topper).
  // The slab colours come from the firmness classes (.ddh__sl--s|m|f|x set --ct / --cl / --cr); no text lives inside the icon.
  {
    const slab = (y0, t, k) => { const x = (n) => n, d = 38, w = 38;
      return `<g class="ddh__sl ddh__sl--${k}"><path class="ddh__sl-l" d="M10 ${y0 + 19}L48 ${y0 + d}V${y0 + d + t}L10 ${y0 + 19 + t}Z"/><path class="ddh__sl-r" d="M48 ${y0 + d}L86 ${y0 + 19}V${y0 + 19 + t}L48 ${y0 + d + t}Z"/><path class="ddh__sl-t" d="M48 ${y0}L86 ${y0 + 19}L48 ${y0 + d}L10 ${y0 + 19}Z"/></g>`; };
    const icon = (a, b, thin) => `<svg class="ddh__iso" viewBox="0 0 96 74" width="96" height="74" aria-hidden="true" focusable="false"><ellipse class="ddh__iso-sh" cx="48" cy="${thin ? 61 : 67}" rx="30" ry="5"/>${slab(18, thin ? 8 : 16, b)}${slab(2, 7, a)}</svg>`;
    src = src.replace(/<!--ISO:(\w):(\w)-->/g, (m0, a, b) => icon(a, b, false)).replace(/<!--ISO2:(\w):(\w)-->/g, (m0, a, b) => icon(a, b, true));
  }
  const keys = new Set([...src.matchAll(/\sdata-ta?="(\w+)"/g)].map((m) => m[1]));
  const out = path.join(rel, 'sheets'); fs.mkdirSync(out, { recursive: true });
  const finish = (h, lang) => h.replace(/\s(data-ta?)="\w+"/g, '').replace('<div class="ddh__sheets">', `<div class="ddh__sheets" lang="${lang}">`).replace(/>\s*\n\s*</g, '><').trim() + '\n';
  fs.writeFileSync(path.join(out, 'en.html'), finish(src, 'en'));
  for (const f of fs.readdirSync(path.join(root, 'src/sheets-i18n'))) {
    const lang = f.replace('.txt', ''), dict = {};
    for (const line of fs.readFileSync(path.join(root, 'src/sheets-i18n', f), 'utf8').split('\n')) { const m = /^(\w+) = (.+)$/.exec(line.trim()); if (m) dict[m[1]] = m[2]; }
    const missing = [...keys].filter((k) => !(k in dict)), extra = Object.keys(dict).filter((k) => !keys.has(k));
    if (missing.length || extra.length) throw new Error(`sheets ${lang}: missing ${missing.join(',')} extra ${extra.join(',')}`);
    let h = src.replace(/(<(\w+)\b[^>]*?\sdata-t="(\w+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m0, open, tag, k, inner, close) => open + dict[k] + close);
    h = h.replace(/\s(alt|aria-label)="[^"]*"([^>]*?)\sdata-ta="(\w+)"/g, (m0, attr, mid, k) => ` ${attr}="${dict[k].replace(/"/g, '&quot;')}"${mid}`);
    fs.writeFileSync(path.join(out, lang + '.html'), finish(h, lang));
  }
}

const tpl = fs.readFileSync(path.join(root, 'src/section.html'), 'utf8');
const render = (base) => tpl.replaceAll('{{BASE}}', base).replaceAll('{{ORIGIN}}', new URL(base, 'http://local.test/').origin);

export const HOSTS = {
  // Recommended production: first-party static host (see INSTALL.md §2).
  production: `https://assets.divinedunlop.com/divine-hero/${VERSION}/`,
};
fs.mkdirSync(path.join(root, 'ecwid'), { recursive: true });
fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}.html`), render(HOSTS.production));
// Fallback only (INSTALL.md §9): same markup, whitespace between tags removed.
const compact = (h) => h.replace(/\n(?=<)/g, '').replace(/>\n/g, '>').trim() + '\n';
fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}.min.html`), compact(render(HOSTS.production)));
// All-in-one: CSS and JS inlined into the one section; only images/fonts are fetched from `base`.
const css = fs.readFileSync(path.join(rel, 'hero.css'), 'utf8');
const js = fs.readFileSync(path.join(rel, 'hero.js'), 'utf8');
const allInOne = (base) => render(base)
  .replace(/<!-- [^\n]*-->\n/, `<!-- Divine DunlopDreams Hero ${VERSION} | ALL-IN-ONE: one Instant Site "Embed & Custom Code" section | images/fonts: ${base} -->\n`)
  .replace(/<link rel="stylesheet" href="[^"]*hero\.css">\n/, () => `<style>${css.replace(/url\(assets\//g, 'url(' + base + 'assets/').trim()}</style>\n`)
  .replace(/<script src="[^"]*hero\.js" defer><\/script>\n<script>window\.DDHero&&DDHero\.boot\(\)<\/script>\n/, () => `<script>${js.trim()}</script>\n`);
fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-allinone.html`), allInOne(HOSTS.production));
if (process.env.JSDELIVR_REF) {
  const base = `https://cdn.jsdelivr.net/gh/Matrress/Animation@${process.env.JSDELIVR_REF}/divine-hero/release/${VERSION}/`;
  fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-jsdelivr.html`), render(base));
  fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-jsdelivr.min.html`), compact(render(base)));
  fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-allinone-jsdelivr.html`), allInOne(base));
}

// Local harnesses (same markup, assets served from ../release/<version>/)
const local = render(`/release/${VERSION}/`).replace(/<link rel="preconnect"[^>]*>\n/, '');
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview', 'section-local.html'), local);
for (const h of [0, 50]) {
  execFileSync('python3', [path.join(root, 'tests/make-harness.py'), path.join(root, 'preview/section-local.html'), path.join(root, `preview/harness-polished-h${h}.html`), String(h)]);
}

const sizes = {};
for (const f of ['hero.css', 'hero.js', 'sheets/en.html']) sizes[f] = fs.statSync(path.join(rel, f)).size;
const sec = fs.readFileSync(path.join(root, 'ecwid', `section-${VERSION}.html`), 'utf8');
sizes['section chars'] = [...sec].length;
sizes['section bytes'] = Buffer.byteLength(sec);
const min = fs.readFileSync(path.join(root, 'ecwid', `section-${VERSION}.min.html`), 'utf8');
sizes['min section chars'] = [...min].length;
console.log(sizes);
