// READ-ONLY. Does the television change the store's options column, or does the store change it itself?
// A) CONTROL: no injection; the same three choices are made in Ecwid's own dropdowns.
// B) WITH the television: the same three choices are made by tapping inside the television.
// Prints what changed in the column (tag + classes) in each case. Nothing is saved; Add to Bag is not clicked.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const EMBED = fs.readFileSync(path.join(ROOT, 'dist', 'embed', 'botanic-tv.js'), 'utf8').replace('productIds: [876405767]', 'productIds: [876405767, 831592302]'); // local copy only
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const sig = () => [...document.querySelector('.product-details__sidebar').querySelectorAll('*')].map((n) => n.tagName + '.' + (typeof n.className === 'string' ? n.className : '') + (n.disabled ? '!d' : ''));
const multiset = (a) => a.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
function diff(a, b) {
  const A = multiset(a), B = multiset(b), out = [];
  new Set([...Object.keys(A), ...Object.keys(B)]).forEach((k) => { const d = (B[k] || 0) - (A[k] || 0); if (d) out.push((d > 0 ? '+' : '-') + Math.abs(d) + ' ' + k.slice(0, 110)); });
  return out;
}
async function run(withTv) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.details-product-option', { timeout: 45000 });
  await p.waitForTimeout(3000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}
  if (withTv) { await p.addScriptTag({ content: EMBED }); await p.waitForSelector('.ddtv-host', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1500); }
  const before = await p.evaluate(sig);
  if (withTv) {
    await p.click('.ddtv__btn[data-chapter="firmness"]');
    await p.locator('.ddtv__panel.is-active .sc-seg', { hasText: 'Medium' }).click();
    await p.click('.ddtv__btn[data-chapter="height"]');
    await p.locator('.ddtv__panel.is-active .sc-slabcard', { hasText: 'Deep Comfort' }).click();
    await p.click('.ddtv__btn[data-chapter="covers"]');
    await p.locator('.ddtv__panel.is-active .sc-swatch', { hasText: 'Cotton & Wool' }).click();
  } else {
    const sels = p.locator('.details-product-option select');
    await sels.nth(1).selectOption({ index: 2 });   // depth: Deep Comfort
    await sels.nth(2).selectOption({ index: 2 });   // firmness: Medium
    await sels.nth(3).selectOption({ index: 2 });   // cover: Cotton + Wool
  }
  await p.waitForTimeout(1500);
  const after = await p.evaluate(sig);
  const price = await p.evaluate(() => document.querySelector('.details-product-price__value').textContent);
  await b.close();
  return { n: [before.length, after.length], price, d: diff(before, after) };
}
(async () => {
  const a = await run(false);
  console.log('A) CONTROL, no injection, choices made in Ecwid itself  elements', a.n.join(' → '), ' price', a.price);
  a.d.forEach((x) => console.log('   ' + x));
  const t = await run(true);
  console.log('B) WITH the television, choices made inside it           elements', t.n.join(' → '), ' price', t.price);
  t.d.forEach((x) => console.log('   ' + x));
  const same = JSON.stringify(a.d) === JSON.stringify(t.d);
  console.log('\nThe column changes are ' + (same ? 'IDENTICAL' : 'DIFFERENT') + ' with and without the television.');
  if (!same) { console.log('Only with TV:', t.d.filter((x) => !a.d.includes(x))); console.log('Only without:', a.d.filter((x) => !t.d.includes(x))); }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
