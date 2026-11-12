// Firmness step of the Graphite preview: what happens as the sliders are set, and the button labels. Real clicks and a real
// mouse drag on the stand-in; asserts the behaviour as well as capturing it.
//   NODE_PATH=$(npm root -g) node tools/graphite-firmness-shots.mjs
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), out = join(root, 'docs/mobile/premium/shots/graphite-firmness'); mkdirSync(out, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const b = await chromium.launch(); const vp = { width: 390, height: 844 };
const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: vp, screen: vp, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
await p.goto('file://' + join(root, 'docs/mobile/premium/preview/graphite.html') + '?chrome=0', { waitUntil: 'load' }); await p.waitForTimeout(1000);
const snap = n => p.screenshot({ path: join(out, n + '.png') });
const state = () => p.evaluate(() => ({ dim: [...document.querySelectorAll('.gx-card.dim')].map(c => c.dataset.key), rec: [...document.querySelectorAll('.gx-card.rec')].map(c => c.dataset.key), sel: [...document.querySelectorAll('.gx-card[aria-pressed=true]')].map(c => c.dataset.key), guide: (document.querySelector('.gx-guide') || { textContent: '' }).textContent.slice(0, 70), btn: document.querySelector('.gx-btn').innerHTML, btnWeights: [getComputedStyle(document.querySelector('.gx-btn')).fontWeight, document.querySelector('.gx-btn b') ? getComputedStyle(document.querySelector('.gx-btn b')).fontWeight : null] }));
const setBody = async (w, h) => { await p.locator('#gw').fill(String(w)); await p.locator('#gh').fill(String(h)); await p.waitForTimeout(450); };
await p.locator('#cfg-cta .cta').click(); await p.waitForTimeout(400);
let s = await state(); await snap('0-size');
const sizeBtn = await p.evaluate(() => document.querySelector('.gx-btn').innerHTML); ok(sizeBtn === 'Continue to <b>Firmness</b>', `size step button: "${sizeBtn}"`);
await p.locator('.gx-chip', { hasText: '150×200' }).click(); await p.waitForTimeout(1500); await p.locator('.gx-btn').click(); await p.waitForTimeout(400);
s = await state(); await snap('1-firmness-start'); ok(s.dim.length === 0 && s.rec.length === 0, 'before the sliders are set: no card is dimmed, none is recommended');
ok(s.btnWeights[0] === '400', 'button text is regular weight (' + s.btnWeights[0] + ') and the key word is bold (' + s.btnWeights[1] + ') on the firmness step: ' + s.btn);
await p.locator('#gw').fill('82'); await p.waitForTimeout(300); s = await state(); await snap('2-weight-only'); ok(s.dim.length === 0, 'weight alone gives no result: nothing dims');
await p.locator('#gh').fill('178'); await p.waitForTimeout(500); s = await state(); await snap('3-both-set');
ok(s.rec.join() === 'firm' && s.dim.sort().join() === 'medium,soft,xfirm', `both set (82 kg, 178 cm): recommended ${s.rec}, dimmed ${s.dim}`);
await setBody(45, 160); s = await state(); await snap('4-light'); ok(s.rec.join() === 'soft' && s.dim.length === 3, `45 kg, 160 cm: recommended ${s.rec}, three others dimmed`);
await setBody(125, 185); s = await state(); await snap('5-heavy'); ok(s.rec.join() === 'xfirm' && s.dim.length === 3, `125 kg, 185 cm: recommended ${s.rec}`);
// a real drag keeps working and the result follows it
const box = await p.locator('#gw').boundingBox(); await p.mouse.move(box.x + box.width * .2, box.y + box.height / 2); await p.mouse.down(); const seen = new Set();
for (let i = 1; i <= 10; i++) { await p.mouse.move(box.x + box.width * (.2 + i * .06), box.y + box.height / 2, { steps: 2 }); await p.waitForTimeout(60); seen.add((await state()).rec.join()); }
await p.mouse.up(); ok(seen.size >= 2, `dragging the weight slider moves the result live (${[...seen].join(' > ')})`);
await setBody(82, 178); await p.waitForTimeout(300);
// choosing the guided card, and choosing a different one: the chosen card never fades
await p.locator('.gx-card.dim', { hasText: 'Medium' }).click(); await p.waitForTimeout(1500); s = await state(); await snap('6-other-chosen');
ok(s.sel.join() === 'medium' && !s.dim.includes('medium'), `a dimmed card can still be chosen (the customer decides): selected ${s.sel}, it no longer fades`);
await p.locator('.gx-card.rec', { hasText: 'Firm' }).click(); await p.waitForTimeout(1500); s = await state(); await snap('7-guided-chosen'); ok(s.sel.join() === 'firm', 'the guided card is chosen');
await p.locator('.gx-btn').click(); await p.waitForTimeout(400); const d = await p.evaluate(() => document.querySelector('.gx-btn').innerHTML); ok(d === 'Continue to <b>Cover</b>', `depth step button: "${d}"`);
await p.locator('.gx-bar', { hasText: 'Deep Comfort' }).click(); await p.waitForTimeout(1500); await p.locator('.gx-btn').click(); await p.waitForTimeout(400);
const c = await p.evaluate(() => document.querySelector('.gx-btn').innerHTML); ok(c === 'Review Your <b>Order</b>', `cover step button: "${c}"`);
await p.locator('[data-role=cover]', { hasText: 'Aloe' }).click(); await p.waitForTimeout(1500); await p.locator('.gx-btn').click(); await p.waitForTimeout(500); await snap('8-review');
const r = await p.evaluate(() => ({ btn: document.querySelector('.gx-btn').innerHTML, chosen: Object.values(__cfg.sync.read().options).filter(o => o.chosen).length }));
ok(r.btn === 'Add to <b>Bag</b>' && r.chosen === 4, `review button: "${r.btn}", ${r.chosen} native selections`);
ok(errs.length === 0, 'no page errors');
// montage
const names = ['1-firmness-start', '3-both-set', '4-light', '5-heavy', '6-other-chosen', '7-guided-chosen'];
const imgs = names.map((n, i) => `<figure style="position:absolute;left:${10 + i * 266}px;top:10px;margin:0"><img src="data:image/png;base64,${readFileSync(join(out, n + '.png')).toString('base64')}" style="width:256px;display:block;border:1px solid #3A4659"><figcaption style="font:600 11px system-ui;color:#C3D5ED;margin-top:4px">${n}</figcaption></figure>`).join('');
const m = await b.newPage({ viewport: { width: 20 + names.length * 266, height: 580 } }); await m.setContent(`<body style="margin:0;background:#0B1018">${imgs}</body>`); await m.waitForTimeout(300); await m.screenshot({ path: join(out, 'montage.jpg'), type: 'jpeg', quality: 86 });
console.log(fails ? `\n${fails} FAILED` : '\nall checks passed'); await b.close(); process.exit(fails ? 1 : 0);
