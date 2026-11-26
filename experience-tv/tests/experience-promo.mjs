// Promotions and options: the television shows exactly what the shop shows, whatever the store does with prices.
// A simulated Ecwid page (the same class names and the same slow price update as the real one, observed on 22 Nov): the promotion is
// changed WHILE the television is open: a percentage, an amount, no promotion, a new percentage, an option that costs more.
//   NODE_PATH=$(npm root -g) node tests/experience-promo.mjs   (after: node tools/build-experience.mjs)
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist', 'experience') + '/';
const js = readFileSync(dist + 'botanic-tv.js', 'utf8');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };

const opt = (title, list) => `<div class="details-product-option details-product-option--select"><label class="details-product-option__title form-control__label">${title}</label><select class="form-control__select"><option>Please choose</option>${list.map((x) => `<option>${x}</option>`).join('')}</select></div>`;
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name=viewport content="width=device-width"><title>sim</title></head><body>
<div class="ec-store"><div class="product-details">
${opt('SIZE', ['Single 90x190 cm / 35.4” x 74.8” (+£797)', 'Super King 180x200 cm. / 70.9” x 78.7” (+£1 555)', 'For More Options CONTACT US'])}
${opt('Select Mattress Depth', ['H- 20 cm (8”) Balanced Comfort', 'H -24 cm (9.5”) Deep Comfort (+£156)', 'H- 26 cm (10.25”) Premium Deep Comfort (+£190)', 'H- 28 cm (11”) New Depth (+£230)'])}
${opt('FIRMNESS BY BODY WEIGHT', ['Up to 47 kg – SOFT', '48–85 kg – MEDIUM', '85–110 kg – FIRM', 'Over 120 kg – EXTRA FIRM (+£88)'])}
${opt('COVERS', ['100% Natural Cotton', '100% Natural Cotton Other Side 100% Natural Wool', 'Combination Aloe Vera &Cotton & Viscose', 'Cashmere with Silver Ions (+£77)'])}
<div class="product-details__product-price ec-price-item"><span class="details-product-price__value ec-price-item">£0</span></div>
<div class="details-product-price-compare__container"></div><div class="product-details__product-price-discount"></div>
<button class="form-control__button">Add to Bag</button></div>
<div class="product-details__description"><p>The shop's own description.</p></div></div>
<script>
window.PROMO = { kind: 'pct', v: 20 }; window.DELAY = 700;
function fmt(n){return '£'+n.toFixed(2).replace(/\\.00$/,'').replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u00a0');}
function mods(){var t=0,any=false;document.querySelectorAll('.details-product-option select').forEach(function(s){var m=/\\(\\+£([\\d\\s]+)\\)/.exec(s.options[s.selectedIndex].text);if(m){t+=parseInt(m[1].replace(/\\s/g,''),10);any=true;}});return any?t:0;}
function render(){var list=mods(),p=window.PROMO,cur=list,old='',badge='';
  if(list&&p.kind==='pct'&&p.v){cur=list*(100-p.v)/100;old=fmt(list);badge='Save '+p.v+'%';}
  else if(list&&p.kind==='amt'){cur=list-p.v;old=fmt(list);badge='Save '+fmt(p.v);}
  document.querySelector('.details-product-price__value').textContent=list?fmt(cur):'£0';
  document.querySelector('.details-product-price-compare__container').innerHTML=old?'was <s>'+old+'</s> '+badge:'';
  document.querySelector('.product-details__product-price-discount').textContent=badge;}
var t=null;document.addEventListener('change',function(e){if(!e.target.closest('.details-product-option'))return;clearTimeout(t);t=setTimeout(render,window.DELAY);},true);
window.__render=render;
window.Ecwid={OnPageLoaded:{add:function(f){setTimeout(function(){f({type:'PRODUCT',productId:876405767});},50);}},OnProductSelectedOptionsChanged:{add:function(){}},OnCartChanged:{add:function(){}},openPage:function(){}};
</script></body></html>`;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1366, height: 1000 }, screen: { width: 1366, height: 1000 } });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.route('https://shop.test/**', (r) => r.fulfill({ contentType: 'text/html', body: PAGE }));
await p.route('https://media.divinedunlop.com/**', (r) => r.fulfill({ contentType: /\.js/.test(r.request().url()) ? 'text/javascript' : 'image/webp', body: /\.js/.test(r.request().url()) ? '/* x */' : readFileSync(dist + readdirSync(dist).find((f) => /^botanic-cup-[0-9a-f]{20}\./.test(f))) }));
await p.goto('https://shop.test/', { waitUntil: 'load' });
await p.evaluate((code) => { window.__ddtvAllow = [876405767]; (0, eval)(code); }, js);
await p.waitForSelector('#ddtv-experience', { timeout: 10000 }); await p.waitForTimeout(500);

const shopPrice = () => p.evaluate(() => { const t = (e) => e ? e.textContent.replace(/[\s ]+/g, ' ').trim() : ''; return { cur: t(document.querySelector('.details-product-price__value')), old: t(document.querySelector('.details-product-price-compare__container s')), badge: t(document.querySelector('.product-details__product-price-discount')) }; });
const tvPrice = () => p.evaluate(() => { const sh = document.getElementById('ddtv-experience').shadowRoot, t = (e) => e ? e.textContent.replace(/[\s ]+/g, ' ').trim() : ''; return { cur: t(sh.querySelector('#price b')), old: t(sh.querySelector('#price .pold')), badge: t(sh.querySelector('#price .sv')) }; });
const pick = (n, i) => p.evaluate(([n, i]) => { const s = document.querySelectorAll('.details-product-option select')[n]; s.selectedIndex = i; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); }, [n, i]);
const same = async (label, wait = 3300) => { await p.waitForTimeout(wait); const a = await shopPrice(), t = await tvPrice(); ok(a.cur && a.cur !== '£0' && a.cur === t.cur && a.old === t.old && a.badge === t.badge, label, JSON.stringify({ shop: a, tv: t })); return a; };

await pick(0, 2); await pick(1, 2); await pick(2, 2); await pick(3, 4);   // size 180x200, depth 26, firmness MEDIUM, cashmere
const first = await shopPrice();
const mid = await tvPrice();
ok(mid.cur !== '£0' && !/^£?\s*0$/.test(mid.cur), 'while Ecwid is still updating the television never shows a zero price', JSON.stringify({ shopNow: first, tv: mid }));
await same('a percentage promotion (20 %): price, struck price and discount note are the shop\'s');
await p.evaluate(() => { window.PROMO = { kind: 'pct', v: 10 }; window.__render(); });
await same('the promotion changes to 10 % while the television is open: the television follows', 3300);
await p.evaluate(() => { window.PROMO = { kind: 'amt', v: 120 }; window.__render(); });
await same('a promotion of a fixed amount (£120 off): the television shows the shop\'s texts', 3300);
await p.evaluate(() => { window.PROMO = { kind: 'pct', v: 0 }; window.__render(); });
const none = await same('the promotion ends: no struck price and no note remain on the television', 3300);
ok(none.old === '' && none.badge === '', 'no promotion: Ecwid shows only the price', JSON.stringify(none));
await p.evaluate(() => { window.PROMO = { kind: 'pct', v: 15 }; window.__render(); });
await same('a new promotion (15 %) starts: the television follows', 3300);
await pick(2, 4);   // Extra Firm (+£88)
await same('an option that costs more (Extra Firm +£88): the price follows after Ecwid updates', 3300);
await pick(1, 1);   // depth 20 cm (no modifier)
await same('a cheaper depth: the price follows', 3300);
await pick(1, 4);   // a depth the television does not know yet (28 cm, +£230): the shop stays the authority
await same('a new option value the television does not know yet: the price still follows the shop, nothing breaks', 3300);
await pick(1, 1);
await same('and back to a known depth', 3300);
await pick(0, 0);   // size cleared
await p.waitForTimeout(2500);
const cleared = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#price').textContent.replace(/\s+/g, ' ').trim());
ok(!/£\s*\d/.test(cleared), 'with no size chosen the television shows no price', cleared);
ok(errs.length === 0, 'no page errors', errs.join(' | '));
await b.close();
console.log(fails ? `\n${fails} promotion check(s) FAILED` : '\nAll promotion checks passed: the television shows what the shop shows');
process.exit(fails ? 1 : 0);
