// Builds the STORE module of the Botanic Experience television from the APPROVED design page.
//
//   node tools/build-tv-design-preview.mjs   (the design page, as approved)
//   node tools/build-experience.mjs          (this: the same television, for Ecwid)
//
// What you approved is what ships: the styles, the markup, the texts and the behaviour are taken from
// docs/tv-preview/large-screen-design.html and only the stand-ins are replaced:
//   - the page becomes a Shadow DOM (the store's CSS cannot reach it, its CSS cannot reach the store);
//   - the stand-in price is replaced by Ecwid's own price texts, the stand-in bag by Ecwid's own Add to Bag,
//     the stand-in checkout by Ecwid's cart; every choice is set on Ecwid's own dropdowns (engine/experience-host.js);
//   - the copy of the description, the unused core picture and the stand-in data are left out (the real description is
//     on the page); the certificate logos load only when Certifications is opened.
//
// Output (dist/experience/):
//   botanic-tv.js          the television + its host (upload to the media host)
//   botanic-tv-logos.js    the certificate logos, loaded on demand (upload next to it)
//   loader.html            what goes into Ecwid → Website → Custom JavaScript code (≤ 4000 characters)
//   MANIFEST.txt           sizes, gzip sizes, hashes
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'experience'); mkdirSync(out, { recursive: true });
const page = readFileSync(join(root, 'docs', 'tv-preview', 'large-screen-design.html'), 'utf8');
const hostJs = readFileSync(join(root, 'engine', 'experience-host.js'), 'utf8');

const BASE = 'https://media.divinedunlop.com/ddtv/';                // where the owner uploads the two files
const FONT = 'https://api.fontshare.com/v2/css?f[]=chillax@300,400,500,600,700&display=swap';
const PRODUCTS = [876405767];                                        // the test product only; the live one after the owner's word

function must(cond, what) { if (!cond) { console.error('BUILD STOPPED: ' + what); process.exit(1); } }
function replaceExact(src, a, b, n = 1) {
  const count = src.split(a).length - 1;
  must(count === n, `expected ${n}× "${a.slice(0, 70)}", found ${count}`);
  return src.split(a).join(b);
}

// ---------- 1. take the approved page apart ----------
const css0 = page.slice(page.indexOf('<style>') + 7, page.indexOf('</style>'));
const bodyStart = page.indexOf('<body>') + 6;
const firstScript = page.indexOf('<script>', bodyStart);
let markup = page.slice(bodyStart, firstScript).trim();
const scripts = [...page.slice(firstScript).matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
must(scripts.length >= 3, 'three scripts after the markup');
const [core, rules, main] = scripts;
must(/DDFirmnessCore/.test(core), 'the firmness rule script');
must(/DDRules/.test(rules), 'the selection laws script');
must(/^\s*var D = /.test(main), 'the main script starts with the data');

// ---------- 2. the data: lean ----------
const dStart = main.indexOf('var D = ') + 8, dEnd = main.indexOf(';\n(function () {');
const D = JSON.parse(main.slice(dStart, dEnd));
const logos = D.logos || {};
const dropped = {};
for (const k of ['descHtml', 'core', 'standin', 'logos']) { dropped[k] = JSON.stringify(D[k] || '').length; delete D[k]; }
D.logos = {};
// the cup picture: a real file next to the module (a picture inside the script cannot be compressed and is downloaded twice)
const bowlM = /^data:image\/(webp|png|jpeg);base64,(.+)$/.exec(D.bowl || '');
must(bowlM, 'the cup picture is a data URI in the design');
const BOWL_FILE = 'botanic-cup.' + (bowlM[1] === 'jpeg' ? 'jpg' : bowlM[1]);
writeFileSync(join(out, BOWL_FILE), Buffer.from(bowlM[2], 'base64'));
dropped.bowl = D.bowl.length;
D.bowl = '__BASE__' + BOWL_FILE;
const dataJs = JSON.stringify(D).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\u0021--');

// ---------- 3. the styles: from a page to a Shadow DOM ----------
let css = css0
  .replace(/\/\*[\s\S]*?\*\//g, '')                                   // comments are for the source, not the customer
  .replace(/:root\.ivory/g, '.ivory')
  .replace(/:root/g, ':host')
  .replace(/html,\s*body\s*\{/g, '.ddx {')
  .replace(/\.ivory body\s*\{/g, '.ddx.ivory {')
  .replace(/(^|[}\s])body\.(std|vopen)/g, '$1.ddx.$2')
  .replace(/(^|[}\s])body\s*\{/g, '$1.ddx {')
  .replace(/\s+/g, ' ').replace(/\s*([{};])\s*/g, '$1').trim();
must(!/(^|[\s,}])(html|body)[\s,.{:]/.test(css.replace(/\.(ddx|ivory)/g, '')), 'no html/body selector left');
css = ':host{all:initial;display:block;contain:layout style}\n' + css +
  '\n.ddx{display:block;font-family:var(--f);font-size:16px;line-height:1.4;color:var(--ink);text-align:left;border-radius:14px;overflow:hidden}' +
  '\n.ddx .pv,.ddx .seg,.ddx .stdv,.ddx .shopstrip{display:none!important}';

// ---------- 4. the markup: the same, inside one root ----------
markup = '<div class="ddx ivory">' + markup + '</div>';

// ---------- 5. the behaviour: the approved script, bound to the Shadow DOM and to Ecwid ----------
let body = main.slice(main.indexOf('(function () {') + '(function () {'.length, main.lastIndexOf('})();'));
body = replaceExact(body, 'var $ = function (s) { return document.querySelector(s); }', 'var $ = function (s) { return R.querySelector(s); }');
body = body.split('document.querySelectorAll(').join('R.querySelectorAll(');
body = body.split('document.querySelector(').join('R.querySelector(');
body = body.split("document.documentElement.classList.contains('ivory')").join('true');
body = body.split('document.body.classList').join('W.classList');
body = body.split('document.activeElement').join('(R.activeElement || document.activeElement)');
for (const ev of ['click', 'change', 'input']) body = body.split(`document.addEventListener('${ev}',`).join(`R.addEventListener('${ev}',`);
must(!/document\.(querySelector|body|addEventListener\('(click|change|input))/.test(body), 'no page-level query left');
// the price: Ecwid's own texts
body = replaceExact(body, '  function shop() {', '  function shop() { return H.shop(S); }\n  function shop_standin() {');
// the bag and the checkout: Ecwid's own
body = body.replace(/else if \(d\.bag != null\) \{[^\n]*\n/, "else if (d.bag != null) { if (!H.addToBag(sig())) toast('Please use the shop\\'s own Add to Bag just below the screen.'); }\n");
body = body.replace(/else if \(d\.checkout != null\) \{[^\n]*\n/, 'else if (d.checkout != null) { H.checkout(); return; }\n');
must(/H\.addToBag\(sig\(\)\)/.test(body) && /H\.checkout\(\)/.test(body), 'bag and checkout bound to Ecwid');
// the note under the price: the shop's own price, not a stand-in
body = replaceExact(body, "'Stand-in here. In the shop, the prices and the discount are Ecwid\\'s own.'", "'The shop\\'s own price for your choices.'");
// the custom-size request: the store's contact page (there is no form backend in the shop)
body = body.replace(/toast\('Preview only: nothing was sent\.[^']*'\)/, "window.open('https://divinedunlop.com/contact-us', '_blank')");
// after every drawing, the shop's dropdowns follow the screen
body = replaceExact(body, 'function draw() { draw0(); boldTerms(); }', 'function draw() { draw0(); boldTerms(); if (H.after) H.after(); }');
// the certificate logos arrive on demand
body = replaceExact(body, 'var L = D.logos || {},', 'var L = (LOGOS(), D.logos || {}),');
// the start-up film plays once per visit in the shop (the owner: it plays when the model is entered, not at every page view)
body = replaceExact(body, "if (S.view === 'tv') ignite();", "if (S.view === 'tv' && H.firstTime()) ignite();");
// the television tells the host where its state is, before the first picture
const tail = body.lastIndexOf('  draw();');
must(tail > 0, 'the first draw');
body = body.slice(0, tail) + '  H.attach({ S: S, draw: draw, D: D });\n' + body.slice(tail);
must(!/Stand-in|stand-in:|Preview only/.test(body.replace(/function shop_standin[\s\S]*?\n  \}/, '').replace(/function drawStd\(\)[\s\S]*?\n  \}\n/, '')), 'no stand-in message left (the unreachable Standard Product View aside)');

const factory = `
  window.__DDTVX_TV = function (R, H) {
    R.innerHTML = '<style>' + CSS + '</style>' + MARKUP;
    var W = R.querySelector('.ddx');
    window.__cbh = null;
    var D = JSON.parse(DATA.split('__BASE__').join(window.__DDTVX_CONFIG.base));
    function LOGOS() {
      if (LOGOS.asked || !window.__DDTVX_CONFIG.logosUrl) return; LOGOS.asked = true;
      window.__ddtvLogos = function (o) { for (var k in o) D.logos[k] = o[k]; try { draw(); } catch (e) {} };
      var s = document.createElement('script'); s.async = true; s.src = window.__DDTVX_CONFIG.logosUrl; document.head.appendChild(s);
    }
${body}
    return { S: S, draw: draw };
  };`;

// ---------- 6. the file ----------
const version = createHash('sha256').update(css + markup + body + dataJs + hostJs).digest('hex').slice(0, 10);
const tv = `/* Botanic Experience: the television for the Ecwid product page (tools/build-experience.mjs, ${version}).
   Built from the approved design. Ecwid stays the executor: options, price, bag and checkout are the shop's own.
   Starts only on the listed products, never on phones. ?ddtv=off switches it off. */
(function () {
  if (/[?&]ddtv=off\\b/.test(location.search) || window.__DDTVX_TV) return;
  var me = document.currentScript && document.currentScript.src || '';
  var base = me ? me.replace(/[^/]*$/, '') : ${JSON.stringify(BASE)};
  window.__DDTVX_CONFIG = window.__DDTVX_CONFIG || { version: ${JSON.stringify(version)}, products: ${JSON.stringify(PRODUCTS)}, phoneMaxShortSide: 600,
    base: base, fontCss: ${JSON.stringify(FONT)}, logosUrl: base + 'botanic-tv-logos.js?v=${version}' };
  var CSS = ${JSON.stringify(css)};
  var MARKUP = ${JSON.stringify(markup)};
  var DATA = ${JSON.stringify(dataJs)};
${core}
${rules}
${factory}
})();
${hostJs}`;
writeFileSync(join(out, 'botanic-tv.js'), tv);
const logosJs = `/* Botanic Experience: certificate logos, loaded when Certifications is opened. */\nwindow.__ddtvLogos && window.__ddtvLogos(${JSON.stringify(logos)});\n`;
writeFileSync(join(out, 'botanic-tv-logos.js'), logosJs);

// ---------- 7. the loader for Ecwid → Website → Custom JavaScript code ----------
const loader = `<script>/* Divine Dunlop Dreams: Botanic Experience loader (${version}). Phones keep the shop's page; tablets and computers get the television. ?ddtv=off: nothing. */
(function(w,d){if(/[?&]ddtv=off\\b/.test(w.location.search)||w.__ddtvLoader)return;w.__ddtvLoader=1;var s=w.screen||{},p=Math.min(s.width||9999,s.height||9999)<600;if(p&&!/[?&]ddtv=tv\\b/.test(w.location.search))return;var e=d.createElement('script');e.async=true;e.src='${BASE}botanic-tv.js?v=${version}';e.onerror=function(){d.documentElement.setAttribute('data-ddtv-load','failed')};d.head.appendChild(e)})(window,document);
</script>`;
must(loader.length <= 4000, 'the loader fits the 4000-character field');
writeFileSync(join(out, 'loader.html'), loader);

const gz = (s) => gzipSync(Buffer.from(s)).length;
const sha = (s) => createHash('sha256').update(s).digest('hex');
const manifest = `Botanic Experience: store module (${version})
botanic-tv.js        ${tv.length} bytes, gzip ${gz(tv)}   sha256 ${sha(tv)}
${BOWL_FILE.padEnd(20)} ${readFileSync(join(out, BOWL_FILE)).length} bytes (picture)
botanic-tv-logos.js  ${logosJs.length} bytes, gzip ${gz(logosJs)}   sha256 ${sha(logosJs)}
loader.html          ${loader.length} characters (field limit 4000)
upload to            ${BASE}
products             ${PRODUCTS.join(', ')}
left out of the data ${Object.entries(dropped).map(([k, v]) => k + ' ' + v).join(', ')}
`;
writeFileSync(join(out, 'MANIFEST.txt'), manifest);
console.log(manifest);
