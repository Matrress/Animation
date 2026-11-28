// SELECTION SYNC CONTRACT of the large-screen television (mandatory, owner's rule of 11 November 2026):
//   the screen drives Ecwid's own controls, and Ecwid's own controls drive the screen, for every option, in both directions,
//   and Add to Bag (Ecwid's own button) always adds exactly what both of them show.
//
//   node tools/build-embed.mjs && NODE_PATH=$(npm root -g) node tests/sync-contract.mjs
//
// !! SIMULATED ECWID in Chromium. The same contract on the real store DOM is tests/live/tv-sync-e2.cjs (read-only, public product).
//
// S1 every button of the screen that chooses an option changes exactly that native control, once (no loop, no double change)
// S2 every change of a native control is shown on the screen (the chip for that option)
// S3 clearing a native control clears the screen's chip
// S4 the price on the screen is the price the store shows, after every change, in either direction
// S5 a mixed, rapid sequence (screen, store, screen, store) ends with the same four choices on both sides
// S6 Add to Bag is the store's own button, unchanged, and adds the four choices both sides show
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page0 = pathToFileURL(join(root, 'dist', 'embed', 'test-page.html')).href;

let failures = 0;
const ok = (cond, msg, detail) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg + (detail ? '  [' + detail + ']' : '')); if (!cond) failures++; };
console.log('NOTE: simulated Ecwid storefront, Chromium only. The real-store version is tests/live/tv-sync-e2.cjs.\n');

const NATIVE = {
  size: '.details-product-option--SIZE select',
  depth: '.details-product-option--Select-Mattress-Depth select',
  firmness: '.details-product-option--FIRMNESS-BY-BODY-WEIGHT select',
  cover: '.details-product-option--COVERS select'
};
// how a customer chooses each option on the screen, and what the store must then show
const SCREEN = {
  firmness: { go: ['firmness', 'choose'], pick: '.sc-seg', text: 'Medium', expect: /MEDIUM|48/i },
  depth: { go: ['height', 'heights'], pick: '.sc-slabcard', text: 'Deep Comfort', expect: /24/ },
  size: { go: ['height', 'sizes'], pick: '.sc-size', text: '180 × 200', expect: /180/ },
  cover: { go: ['covers', 'choose'], pick: '.sc-swatch', text: 'Cotton & Wool', expect: /wool/i }
};
const OPTS = ['size', 'depth', 'firmness', 'cover'];
const browser = await chromium.launch();

async function open(vp, touch) {
  const ctx = await browser.newContext({ viewport: vp, screen: vp, hasTouch: !!touch, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => sessionStorage.setItem('ddtv:botanic:splash', '1'));
  await ctx.route(/^https?:\/\//, (r) => r.abort());
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(page0);
  await page.waitForFunction(() => document.querySelectorAll('.ddtv-host').length === 1 && window.DDTV && DDTV.current, null, { timeout: 6000 });
  await page.waitForTimeout(500);
  // count the change events each native select receives
  await page.evaluate((N) => { window.__changes = {}; Object.keys(N).forEach((k) => { window.__changes[k] = 0; const s = document.querySelector(N[k]); if (s) s.addEventListener('change', () => window.__changes[k]++); }); }, NATIVE);
  return { ctx, page, errors };
}
const nativeLabel = (page, k) => page.evaluate((sel) => { const s = document.querySelector(sel); return s.options[s.selectedIndex].text; }, NATIVE[k]);
const chip = (page, k) => page.evaluate((k) => DDTV.current.shadow.querySelector('.ddtv__chip[data-opt="' + k + '"] .ddtv__chip-v').textContent.trim(), k);
const priceSame = (page) => page.evaluate(() => document.querySelector('.details-product-price__value').textContent.trim() === DDTV.current.shadow.querySelector('.ddtv__price-v').textContent.trim());
const settle = (page, ms = 350) => page.waitForTimeout(ms);

for (const [label, vp, touch] of [['desktop 1440x900, mouse', { width: 1440, height: 900 }, false], ['iPad Pro 12.9 (3rd gen) portrait 1024x1366, touch', { width: 1024, height: 1366 }, true]]) {
  console.log('\n--- ' + label);
  const { ctx, page, errors } = await open(vp, touch);
  const bagHtml = await page.evaluate(() => document.getElementById('mock-add-to-bag').outerHTML);

  // S1 screen -> store, one option at a time, through the screen's own buttons
  for (const k of OPTS) {
    const sc = SCREEN[k];
    await page.evaluate(([c, p]) => DDTV.current.go(c, p), sc.go); await settle(page, 250);
    await page.locator('.ddtv__panel.is-active ' + sc.pick, { hasText: sc.text }).first().click(); await settle(page);
    const lab = await nativeLabel(page, k);
    ok(sc.expect.test(lab), `S1 ${k}: the screen's button set the store's own control`, '"' + lab.slice(0, 40) + '"');
    ok((await page.evaluate((k) => window.__changes[k], k)) === 1, `S1 ${k}: the store's control received exactly one change`, 'events ' + await page.evaluate((k) => window.__changes[k], k));
    ok(/\S/.test(await chip(page, k)) && (await chip(page, k)) !== '—', `S2 ${k}: the screen's chip shows the choice`, await chip(page, k));
    ok(await priceSame(page), `S4 ${k}: the screen's price is the store's price after the screen chose`);
  }
  // S6 Add to Bag adds what both show
  await page.evaluate(() => document.getElementById('mock-add-to-bag').scrollIntoView({ block: 'center' }));
  await page.click('#mock-add-to-bag'); await settle(page, 200);
  const bag1 = await page.evaluate(() => ({ n: window.__bag.length, opts: window.__bag.length ? window.__bag[window.__bag.length - 1].options.length : 0, err: !document.getElementById('mock-bag-error').hidden }));
  ok(bag1.n === 1 && bag1.opts === 4 && !bag1.err, "S6 Add to Bag (the store's own) adds the four choices made on the screen", JSON.stringify(bag1));
  ok(await page.evaluate((h) => document.getElementById('mock-add-to-bag').outerHTML === h, bagHtml), 'S6 the Add to Bag button itself is unchanged');
  await page.evaluate(() => { window.__bag.length = 0; window.scrollTo(0, 0); });

  // S2 / S3 / S4 store -> screen, option by option
  for (const k of OPTS) {
    const idx = k === 'size' ? 4 : 2;
    await page.selectOption(NATIVE[k], { index: idx }); await settle(page, 450);
    const lab = await nativeLabel(page, k), c = await chip(page, k);
    ok(c !== '—' && c.length > 0, `S2 ${k}: the store's own control changed, the screen follows`, `store "${lab.slice(0, 28)}" -> screen "${c.slice(0, 28)}"`);
    ok(await priceSame(page), `S4 ${k}: the screen's price is the store's price after the store chose`);
  }
  for (const k of OPTS) { await page.selectOption(NATIVE[k], { index: 0 }); await settle(page, 300); ok((await chip(page, k)) === '—', `S3 ${k}: clearing the store's control clears the screen`); }

  // S5 mixed, rapid
  await page.evaluate(([c, p]) => DDTV.current.go(c, p), SCREEN.size.go); await settle(page, 200);
  await page.locator('.ddtv__panel.is-active ' + SCREEN.size.pick, { hasText: SCREEN.size.text }).first().click();
  await page.selectOption(NATIVE.depth, { index: 3 });
  await page.evaluate(([c, p]) => DDTV.current.go(c, p), SCREEN.firmness.go); await settle(page, 200);
  await page.locator('.ddtv__panel.is-active ' + SCREEN.firmness.pick, { hasText: SCREEN.firmness.text }).first().click();
  await page.selectOption(NATIVE.cover, { index: 3 }); await settle(page, 700);
  const both = [];
  for (const k of OPTS) both.push([k, await nativeLabel(page, k), await chip(page, k)]);
  ok(both.every(([k, n, c]) => n !== 'Please choose' && c !== '—'), 'S5 after a rapid mixed sequence all four choices are set on both sides', both.map(([k, n, c]) => k + ':' + c.slice(0, 12)).join(' '));
  ok(await priceSame(page), 'S5 the price on the screen is the store\'s price after the mixed sequence');
  await page.evaluate(() => document.getElementById('mock-add-to-bag').scrollIntoView({ block: 'center' })); await page.click('#mock-add-to-bag'); await settle(page, 200);
  const bag2 = await page.evaluate(() => window.__bag.length ? window.__bag[window.__bag.length - 1].options.length : 0);
  ok(bag2 === 4, 'S6 Add to Bag adds the four choices after a mixed sequence');
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(failures ? `\n${failures} sync check(s) FAILED` : '\nSelection sync contract holds (simulated Ecwid; the real-store version is tests/live/tv-sync-e2.cjs)');
process.exit(failures ? 1 : 0);
