// READ-ONLY. (a) Are the page errors the store's own? Load the live page with NO injection at all.
// (b) Is Add to Bag covered by the television, once scrolled into view? (not clicked)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const EMBED = fs.readFileSync(path.join(ROOT, 'dist', 'embed', 'botanic-tv.js'), 'utf8').replace('productIds: [876405767]', 'productIds: [876405767, 831592302]');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
async function run(inject) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
  await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.details-product-option', { timeout: 45000 });
  await p.waitForTimeout(3000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}
  let bag = null;
  if (inject) {
    await p.addScriptTag({ content: EMBED });
    await p.waitForSelector('.ddtv-host', { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(1500);
  }
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /add to bag/i.test(x.textContent)); b.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(500);
  bag = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /add to bag/i.test(x.textContent)); const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { reachable: top === b || b.contains(top), topTag: top && (top.className || top.tagName).toString().slice(0, 40), hostCount: document.querySelectorAll('.ddtv-host').length }; });
  await p.waitForTimeout(1500);
  console.log(inject ? 'WITH embed   ' : 'NO injection ', JSON.stringify({ errors: errs, addToBag: bag }));
  await b.close();
}
(async () => { await run(false); await run(true); })().catch((e) => { console.error('ERR', e.message); process.exit(1); });
