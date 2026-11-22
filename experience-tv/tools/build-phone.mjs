// Builds the PHONE layer of the Botanic Experience for the Ecwid product page, from the approved phone design
// (docs/mobile/premium: the Graphite configurator, its Ecwid adapter and its description colour layer), recoloured from the
// earlier blue to the approved coffee, vanilla and one-green palette.
//
//   node tools/build-phone.mjs      →  dist/experience/botanic-phone.js (+ MANIFEST-phone.txt)
//
// What changes from the preview: nothing of the behaviour. The stand-in Ecwid block is left out (the real one is on the page),
// the preview bar is left out, the styles apply only while the phone layer is on (html.ddtv-phone), the colours follow the
// approved palette, and the panel is mounted above Ecwid's own options on the listed products only (engine/phone-host.js).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'docs', 'mobile', 'premium', 'src');
const out = join(root, 'dist', 'experience'); mkdirSync(out, { recursive: true });
const S = (f) => readFileSync(join(SRC, f), 'utf8');
const preview = readFileSync(join(root, 'docs', 'mobile', 'premium', 'preview', 'graphite.html'), 'utf8');
const FONT = 'https://api.fontshare.com/v2/css?f[]=chillax@300,400,500,600,700&display=swap';
const arg = (k) => ((process.argv.find((x) => x.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=')) || '';
const PRODUCTS = (arg('products') || '876405767').split(',').map(Number).filter(Boolean);   // --products=831592302 for the live product
function must(c, w) { if (!c) { console.error('BUILD STOPPED: ' + w); process.exit(1); } }

// ---------- the approved palette (DECISIONS: coffee #434239, deep slate #2E3633, vanilla #FBFBED, latte #DDD6C4, olive #646155,
//            one green #6E8601, its text shade on light #566901) ----------
const TOKENS = {
  // description bands and frames (dark)
  'dd-abyss': '#2A2924', 'dd-frame-end': '#2E3633', 'dd-frame-top': '#384442', 'dd-band-end': '#3A3932', 'dd-band-top': '#434239',
  'dd-zone-card': '#434239', 'dd-graphite-2': '#2E3633', 'dd-graphite-1': '#384442',
  // the action colour and its shades: the one green
  'dd-teal': '#6E8601', 'dd-teal-deep': '#566901', 'dd-teal-hover': '#7A9410', 'dd-teal-line': '#566901', 'dd-leaf-dark': '#6E8601',
  // accents on dark: latte, never a pale green or a glow
  'dd-sky': '#DDD6C4', 'dd-leaf-light': '#DDD6C4', 'dd-petrol': '#646155',
  // ink
  'dd-ink': '#2E3633', 'dd-ink-2': '#384442', 'dd-ink-3': '#646155',
  // light grounds and lines
  'dd-c-aebbc6': '#CFC8B4', 'dd-c-c3d5ed': '#DDD6C4', 'dd-c-c9d3db': '#D2CBB8', 'dd-c-c9dce2': '#DDD6C4', 'dd-line': '#DDD6C4',
  'dd-notice': '#EFEBDD', 'dd-ground': '#FBFBED', 'dd-c-f2f7fb': '#F5F4E5', 'dd-white': '#FEFEF6',
  'dd-rgb-c-0e283c': '46, 54, 51', 'dd-rgb-c-141c22': '42, 41, 36', 'dd-rgb-teal': '110, 134, 1', 'dd-rgb-ink': '46, 54, 51',
  'dd-rgb-sky': '221, 214, 196', 'dd-rgb-white': '254, 254, 246',
  // the configurator screen (dark): deep slate ground, coffee chips, the green selection with a vanilla edge, vanilla text
  'bg': '#2E3633', 'panel': '#384442', 'chip': '#434239', 'chip-line': '#646155', 'sel': '#6E8601', 'sel-line': '#FBFBED',
  'dock': '#262D2A', 'dock-line': '#4A5451', 'ink': '#FBFBED', 'mut': '#DDD6C4', 'head': '#DDD6C4', 'dis': '#5B5A4F'
};
// colours written directly in the configurator's rules and drawings (the earlier blue), mapped to the same palette
const HEX = {
  '#1A5C7E': '#6E8601', '#1F6B93': '#566901', '#297CA2': '#6E8601', '#2E86AF': '#6E8601', '#2A5E7E': '#566901', '#50CDFD': '#DDD6C4',
  '#9CC2FF': '#FBFBED', '#33425A': '#434239', '#2A384E': '#384442', '#1A2332': '#262D2A', '#9AA7B2': '#9C9783', '#A9BCD6': '#CFC8B4',
  '#C3D5ED': '#DDD6C4', '#CFE0F5': '#EFEBDD', '#D3DEEC': '#E9E3D3', '#DCE6F3': '#F3F2E2', '#D6D6D6': '#DDD6C4',
  '#314058': '#384442', '#3A4B66': '#434239', '#46597A': '#646155', '#566E93': '#646155', '#6A86AE': '#9C9783',
  '#63B963': '#6E8601', '#9BD26B': '#6E8601', '#364849': '#434239', '#42595B': '#384442', '#1F2D2E': '#2E3633'
};
const RGBA = { '195, 213, 237': '251, 251, 237', '80, 205, 253': '110, 134, 1', '21, 28, 38': '42, 41, 36', '127,211,251': '110,134,1', '54, 72, 73': '67, 66, 57' };
const recolour = (t) => {
  let s = t.replace(/#[0-9a-fA-F]{6}\b/g, (m) => HEX[m.toUpperCase()] || m);
  for (const [a, b] of Object.entries(RGBA)) s = s.split('rgba(' + a).join('rgba(' + b);
  return s;
};

// ---------- styles: tokens + configurator + description colours, only while the phone layer is on ----------
let tokens = S('design-tokens.css');
for (const [k, v] of Object.entries(TOKENS)) {
  const re = new RegExp('(--' + k.replace(/[-]/g, '\\-') + ':\\s*)[^;]+;');
  must(re.test(tokens), 'token ' + k);
  tokens = tokens.replace(re, '$1' + v + ';');
}
function scope(css, pre) {   // prefixes every selector (one level of @media is handled)
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const outp = []; let i = 0;
  while (i < css.length) {
    const o = css.indexOf('{', i); if (o < 0) break;
    const sel = css.slice(i, o).trim();
    if (sel.startsWith('@media') || sel.startsWith('@supports')) {
      let depth = 1, j = o + 1; while (depth && j < css.length) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      outp.push(sel + '{' + scope(css.slice(o + 1, j - 1), pre) + '}'); i = j; continue;
    }
    if (sel.startsWith('@')) { const c = css.indexOf('}', o); outp.push(css.slice(i, c + 1)); i = c + 1; continue; }
    const c = css.indexOf('}', o);
    const sels = sel.split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
      if (/^:root\b/.test(x)) return pre + x.slice(5);                 // :root.x → html.ddtv-phone.x
      if (/^html\b/.test(x)) return pre + x.slice(4);                   // html.cfg-open … → html.ddtv-phone.cfg-open …
      return pre + ' ' + x;
    });
    outp.push(sels.join(',') + '{' + css.slice(o + 1, c) + '}'); i = c + 1;
  }
  return outp.join('\n');
}
const P = 'html.ddtv-phone';
const extra = `
.cfg{font-family:var(--f)}
#cfg-cta{margin:4px 0 16px}
#cfg-cta .cta{display:block;width:100%;border:2px solid #FBFBED;border-radius:14px;padding:16px 20px;background:#6E8601;color:#FFFFFF;font:700 17px/1.2 var(--f);box-shadow:0 0 0 2px #3F4440;cursor:pointer}
#cfg-cta .cta:focus-visible{outline:3px solid #2E3633;outline-offset:3px}
#toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%) translateY(20px);opacity:0;background:#2E3633;color:#FBFBED;padding:10px 14px;border-radius:10px;font:13px/1.4 var(--f);z-index:80;transition:opacity .2s,transform .2s;pointer-events:none;max-width:86vw}
#toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.fine{margin:10px 0;font-size:.85rem;line-height:1.5;color:#646155}
`;
const css = scope(`:root{--f:'Chillax','Helvetica Neue',Arial,sans-serif}` + recolour(tokens), P) + '\n' +
  scope(recolour(S('graphite.css')), P) + '\n' + scope(extra, P) + '\n' + scope(recolour(S('description.css')), P) +
  `\n${P}.cfg-open body{overflow:hidden}`;
must(!/#1A5C7E|#50CDFD|#151C26/i.test(css), 'no blue left in the styles');

// ---------- data: the preview's, without the stand-in ----------
const a = preview.indexOf('window.DDDATA=') + 'window.DDDATA='.length;
const DATA = JSON.parse(preview.slice(a, preview.indexOf(';</script>', a)));
delete DATA.standin;
// the owner's typographic rules, as on the television: no long dash, never "Organic Natural"
(function walk(o) { for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'string' && k !== 'mattressSvg') o[k] = v.replace(/\s*—\s*/g, ' – ').replace(/\b(?:Organic\s+Natural|Natural\s+Organic)\b/gi, 'Organic'); else if (v && typeof v === 'object') walk(v); } })(DATA);
DATA.mattressSvg = recolour(DATA.mattressSvg || '');
const dataJs = JSON.stringify(DATA).replace(/<\//g, '<\\/');

// ---------- behaviour: the firmness rule, the laws, the adapter, the configurator (unchanged but for its colours) ----------
const core = preview.match(/<script id="firmness-core">([\s\S]*?)<\/script>/)[1];
const rules = readFileSync(join(root, 'engine', 'selection-rules.js'), 'utf8');
const sync = S('sync.js');
// customers do not know the platform's name: the shop's own menus are "the standard menus"
const graphite = recolour(S('graphite.js'))
  .split('Use Ecwid’s own menus instead').join('Use the standard menus instead')
  .split('Use Ecwid’s own option instead').join('Use the standard option below instead')
  .split('use Ecwid’s own options below').join('use the standard options below')
  .split('Price loaded from Ecwid').join('Price from the shop')
  .split('Price from Ecwid').join('Price from the shop')
  .split('See <b>Ecwid’s options</b>').join('See <b>the standard options</b>');
must(!/>[^<]*Ecwid[^<]*</.test(graphite.replace(/\/\*[\s\S]*?\*\//g, '')), 'no platform name in what the customer reads');
must(/getElementById\('cfg'\)/.test(graphite), 'the configurator mounts on #cfg');
const host = readFileSync(join(root, 'engine', 'phone-host.js'), 'utf8');
const version = createHash('sha256').update(css + dataJs + sync + graphite + host).digest('hex').slice(0, 10);

const js = `/* Botanic Experience: the phone layer for the Ecwid product page (tools/build-phone.mjs, ${version}).
   The approved guided configuration over Ecwid's own options, in the approved palette. Phones only; listed products only. ?ddtv=off: nothing. */
(function () {
  if (/[?&]ddtv=off\\b/.test(location.search) || window.__DDPHONE_RUN) return;
  window.__DDPHONE_CONFIG = window.__DDPHONE_CONFIG || { version: ${JSON.stringify(version)}, products: ${JSON.stringify(PRODUCTS)}, phoneMaxShortSide: 600, fontCss: ${JSON.stringify(FONT)} };
  window.__DDPHONE_CSS = ${JSON.stringify(css)};
  window.DDDATA = ${dataJs};
${core}
${rules}
${sync}
  window.__DDPHONE_RUN = function () {
${graphite}
  };
})();
${host}`;
writeFileSync(join(out, 'botanic-phone.js'), js);
const gz = gzipSync(Buffer.from(js)).length;
const m = `Botanic Experience: phone layer (${version})\nbotanic-phone.js  ${js.length} bytes, gzip ${gz}   sha256 ${createHash('sha256').update(js).digest('hex')}\nproducts          ${PRODUCTS.join(', ')}\n`;
writeFileSync(join(out, 'MANIFEST-phone.txt'), m);
console.log(m);
