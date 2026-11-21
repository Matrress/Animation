// Screenshots of the integrated phone preview, driving the REAL preview UI by clicks (stand-in Ecwid; nothing live).
//   NODE_PATH=$(npm root -g) node tools/premium-shots.mjs [out-dir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'docs', 'mobile', 'premium', 'shots'); mkdirSync(out, { recursive: true });
const url = 'file://' + join(root, 'docs', 'mobile', 'premium', 'preview', 'index.html');
const b = await chromium.launch();
async function open(concept) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 }); const p = await ctx.newPage();
  await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(url + '?chrome=0&concept=' + concept, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  return { p, ctx, errs };
}
const shot = (p, name) => p.screenshot({ path: join(out, name + '.png') });
const pick = async (p, role, text) => { const l = p.locator(`[data-act=pick][data-role=${role}]`, { hasText: text }).first(); await l.evaluate(e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(250); try { await l.click({ timeout: 4000 }); } catch (e) { console.log('   (real tap blocked by the fixed dock during the scripted scroll; dispatching the click)'); await l.evaluate(x => x.click()); } await p.waitForTimeout(1500); };
for (const concept of ['sheet', 'stage', 'journey']) {
  const { p, ctx, errs } = await open(concept);
  await shot(p, `${concept}-1-opening`);
  await p.locator('#cfg-cta .cta').click(); await p.waitForTimeout(concept === 'journey' ? 4000 : 1000); await shot(p, `${concept}-2-size`);
  await pick(p, 'size', 'UK King'); await shot(p, `${concept}-3-size-chosen`);
  // firmness: set the body sliders, as a person would
  if (concept === 'journey') await p.locator('.jr__h', { hasText: 'Firmness' }).evaluate(x => x.click()); else { await p.waitForTimeout(600); }
  await p.waitForTimeout(500);
  await p.locator('#fw').fill('82'); await p.locator('#fh').fill('178'); await p.waitForTimeout(400);
  await p.locator('#fw').dispatchEvent('input'); await p.locator('#fh').dispatchEvent('input'); await p.waitForTimeout(500);
  await shot(p, `${concept}-4-firmness`);
  await pick(p, 'firmness', 'Firm'); 
  if (concept === 'journey') await p.locator('.jr__h', { hasText: 'Depth' }).evaluate(x => x.click()); await p.waitForTimeout(500); await shot(p, `${concept}-5-depth`);
  await pick(p, 'depth', 'Deep Comfort');
  if (concept === 'journey') await p.locator('.jr__h', { hasText: 'Cover' }).evaluate(x => x.click()); await p.waitForTimeout(500); await shot(p, `${concept}-6-cover`);
  await pick(p, 'cover', 'Aloe');
  if (concept === 'journey') await p.locator('.jr__h', { hasText: 'Review' }).evaluate(x => x.click()); await p.waitForTimeout(700); await shot(p, `${concept}-7-review`);
  const n = await p.evaluate(() => ({ done: Object.values(__cfg.sync.read().options).filter(o => o.chosen).length, price: __cfg.sync.read().price }));
  console.log(concept, 'chosen natively:', n.done, 'price', n.price, errs.length ? 'ERRORS ' + errs.join('|').slice(0, 200) : 'no page errors');
  await ctx.close();
}
// the whole refined content: every screen, in columns
{
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 }); const p = await ctx.newPage();
  await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
  await p.goto(url + '?chrome=0&concept=sheet', { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); console.log('page height', total);
  const tiles = []; for (let y = 0; y < total; y += 844) { const buf = await p.screenshot({ type: 'jpeg', quality: 70, clip: { x: 0, y, width: 390, height: Math.min(844, total - y) }, fullPage: true }); tiles.push({ h: Math.min(844, total - y), d: buf.toString('base64') }); }
  const S = 0.36, per = 6, cols = Math.ceil(tiles.length / per), cw = Math.round(390 * S) + 10, ch = Math.round(844 * S) + 22;
  const items = tiles.map((t, i) => `<div style="position:absolute;left:${10 + Math.floor(i / per) * cw}px;top:${10 + (i % per) * ch}px"><div style="font:600 10px system-ui;color:#364849;height:12px">screen ${i + 1}</div><img src="data:image/jpeg;base64,${t.d}" style="width:${Math.round(390 * S)}px;height:${Math.round(t.h * S)}px;border:1px solid #9bb0b4;display:block"></div>`).join('');
  const q2 = await b.newPage({ viewport: { width: 10 + cols * cw, height: 10 + per * ch } }); await q2.setContent(`<body style="margin:0;background:#EDF5F7">${items}</body>`); await q2.waitForTimeout(300);
  await q2.screenshot({ path: join(out, 'content-sheet.jpg'), type: 'jpeg', quality: 80 }); await q2.close();
  // and the first three screens of the content at full size
  const top = tiles.slice(0, 3).map((t, i) => `<img src="data:image/jpeg;base64,${t.d}" style="position:absolute;left:${10 + i * 400}px;top:10px;width:390px;border:1px solid #9bb0b4">`).join('');
  const q3 = await b.newPage({ viewport: { width: 1210, height: 864 } }); await q3.setContent(`<body style="margin:0;background:#EDF5F7">${top}</body>`); await q3.waitForTimeout(300); await q3.screenshot({ path: join(out, 'content-top.jpg'), type: 'jpeg', quality: 82 }); await q3.close();
  await ctx.close();
}
// montages: the seven states of each concept side by side
import { readFileSync, existsSync } from 'node:fs';
for (const concept of ['sheet', 'stage', 'journey']) {
  const names = ['1-opening', '2-size', '3-size-chosen', '4-firmness', '5-depth', '6-cover', '7-review'].filter(n => existsSync(join(out, `${concept}-${n}.png`)));
  const imgs = names.map((n, i) => `<figure style="position:absolute;left:${10 + i * 246}px;top:10px;margin:0"><img src="data:image/png;base64,${readFileSync(join(out, `${concept}-${n}.png`)).toString('base64')}" style="width:236px;border:1px solid #9bb0b4;display:block"><figcaption style="font:600 11px system-ui;color:#364849;margin-top:4px">${n}</figcaption></figure>`).join('');
  const p = await b.newPage({ viewport: { width: 20 + names.length * 246, height: 560 } }); await p.setContent(`<body style="margin:0;background:#EDF5F7">${imgs}</body>`); await p.waitForTimeout(300);
  await p.screenshot({ path: join(out, `montage-${concept}.jpg`), type: 'jpeg', quality: 82 }); await p.close();
}
await b.close();
