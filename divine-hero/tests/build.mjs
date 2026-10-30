// Build: src/ -> release/<version>/ (minified CSS/JS) + Ecwid section files + local test harnesses.
// usage: node tests/build.mjs   (needs esbuild; see README "Rebuilding")
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const VERSION = '1.20.8';
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
    // 1.19.6: the buttons form one row at the foot of the text area (spanning both columns), not a stack in the narrow left column
    const acts = `<div class="ddh__pv-acts">${cta[0]}${back[0]}</div>`;
    const cut = art.replace(back[0], '').replace(cta[0], '');
    const end = cut.lastIndexOf('</div></article>');
    return end < 0 ? art : cut.slice(0, end) + acts + cut.slice(end);
  });
  // 1.17.2 Dual Plush icon: the owner's own drawing (dual_olush_latex_mattress_.svg): a thin latex topper over a thicker latex mattress.
  // The three outlines are defined once (an invisible <svg> at the top of the sheets) and filled per icon from the firmness classes
  // (.ddh__sl--s|m|f|x set --ct top / --cl front); ISO:t:m = topper over mattress, ISO2:a:b = two thin layers (two-layer topper).
  {
    const P1 = 'M1834.22,779.722L1834.6,769.453C1834.6,769.453 1845.4,766.834 1862.62,764.911C1901.54,760.562 1968.87,754.462 1987.17,752.497C1989.07,752.293 1991.01,752.289 1992.92,752.449C2016.47,754.424 2104.82,762.065 2128.48,764.349C2130.68,764.561 2133.63,764.49 2134.87,766.153C2136.1,767.815 2136,772.585 2135.89,774.325C2135.83,775.263 2135.13,776.344 2134.22,776.596C2111.39,782.956 2023.41,806.3 1998.91,812.486C1995.09,813.449 1991.03,814.483 1987.17,813.716C1959.72,808.255 1834.22,779.722 1834.22,779.722Z';
    const P2 = 'M1997.91,845.653C2023.59,837.687 2111.82,807.097 2135.12,798.503C2136.72,797.911 2137.58,795.787 2137.71,794.085C2137.96,790.983 2136.92,782.659 2136.61,779.895C2136.51,779.061 2136.65,777.694 2135.84,777.5C2134.82,777.26 2132.28,777.991 2130.55,778.454C2108.37,784.396 2025.83,807.043 2002.76,813.15C1999.28,814.072 1995.73,815.068 1992.12,815.092C1987.94,815.12 1982.43,814.33 1977.69,813.317C1951.93,807.816 1861.56,787.472 1837.6,782.086C1836.34,781.804 1834.59,780.72 1833.9,780.999C1833.21,781.279 1833.5,782.831 1833.45,783.764C1833.34,786.302 1833.22,793.306 1833.23,796.225C1833.23,797.912 1833.3,799.883 1833.52,801.279C1833.7,802.422 1833.96,803.864 1834.53,804.599C1835.07,805.297 1836.09,805.45 1836.94,805.692C1861.36,812.641 1954.2,839.636 1981.03,846.297C1986.49,847.653 1992.53,847.321 1997.91,845.653Z';
    const EDGE = 'M1835.26,769.928L1985.34,798.633C1985.34,798.633 1990.66,799.184 1993.31,798.983C1996.37,798.751 2000.29,798.03 2003.71,797.239C2027.23,791.807 2135.94,766.093 2134.4,766.39L2134.4,700L1835.26,700Z';
    const defs = `<svg class="ddh__ico-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><clipPath id="ddh-i-c"><path d="${EDGE}"/></clipPath><g id="ddh-i-t"><path d="${P1}" style="fill:var(--cl)"/><path d="${P1}" clip-path="url(#ddh-i-c)" style="fill:var(--ct)"/><path d="${P1}" style="fill:none;stroke:#fff;stroke-width:1.2px;vector-effect:non-scaling-stroke;stroke-linejoin:round"/></g><path id="ddh-i-m" d="${P2}" style="fill:var(--cl)"/></defs></svg>\n`;
    const T = '<g transform="matrix(1.09065,0,0,1.35976,-95.9009,-471.421)"><g transform="matrix(3.9566,0,0,3.9566,-7130.96,-2596.56)">', E = '</g></g>';
    const icon = (a, b, thin) => thin
      ? `<svg class="ddh__iso" viewBox="30 38 1330 440" aria-hidden="true" focusable="false">${T}<g class="ddh__sl--${b}" transform="translate(0,15.5)"><use href="#ddh-i-t"/></g><g class="ddh__sl--${a}"><use href="#ddh-i-t"/></g>${E}</svg>`
      : `<svg class="ddh__iso" viewBox="30 38 1330 540" aria-hidden="true" focusable="false"><ellipse class="ddh__iso-sh" cx="695" cy="562" rx="560" ry="14"/>${T}<g class="ddh__sl--${b}"><use href="#ddh-i-m"/></g><g class="ddh__sl--${a}"><use href="#ddh-i-t"/></g>${E}</svg>`;
    src = src.replace(/<!--ISO:(\w):(\w)-->/g, (m0, a, b) => icon(a, b, false)).replace(/<!--ISO2:(\w):(\w)-->/g, (m0, a, b) => icon(a, b, true));
    src = src.replace('<div class="ddh__sheets">', '<div class="ddh__sheets">' + defs);
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
