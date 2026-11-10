// Drives the Graphite Blue preview by real clicks (stand-in Ecwid) and captures every step, at three phone heights.
//   NODE_PATH=$(npm root -g) node tools/graphite-shots.mjs
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..'); const out = join(root, 'docs/mobile/premium/shots/graphite'); mkdirSync(out, { recursive: true });
const url = 'file://' + join(root, 'docs/mobile/premium/preview/graphite.html') + '?chrome=0';
const b = await chromium.launch(); const report = [];
async function session(name, vp) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: vp, screen: vp, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const fit = async (label) => { const f = await p.evaluate(() => { const b = document.querySelector('.gx-body'); return b ? { overflow: b.scrollHeight > b.clientHeight + 1, sh: b.scrollHeight, ch: b.clientHeight } : null; }); report.push(`${name} ${label}: ${f ? (f.overflow ? 'SCROLLS inside the body (' + f.sh + ' > ' + f.ch + ')' : 'fits one screen (' + f.sh + ' <= ' + f.ch + ')') : 'n/a'}`); };
  const shot = n => p.screenshot({ path: join(out, `${name}-${n}.png`) });
  await p.locator('#cfg-cta .cta').click(); await p.waitForTimeout(500); await shot('1-size'); await fit('size');
  await p.locator('.gx-chip', { hasText: '180×200' }).click(); await p.waitForTimeout(200); await shot('2-size-pending'); await p.waitForTimeout(1400); await shot('3-size-selected');
  const pr = await p.evaluate(() => document.querySelector('.gx-r b').textContent + ' | ' + document.querySelector('.gx-r small').textContent + ' | ' + document.querySelector('.gx-cap').textContent);
  report.push(`${name} size panel: ${pr}`);
  await p.locator('.gx-btn').click(); await p.waitForTimeout(400);
  await p.locator('#gw').fill('82'); await p.locator('#gh').fill('178'); await p.waitForTimeout(300); await shot('4-firmness'); await fit('firmness');
  await p.locator('.gx-card', { hasText: 'Firm' }).first().click(); await p.waitForTimeout(1500); await shot('5-firmness-chosen');
  await p.locator('.gx-btn').click(); await p.waitForTimeout(400); await shot('6-depth'); await fit('depth');
  await p.locator('.gx-bar', { hasText: 'Deep Comfort' }).click(); await p.waitForTimeout(1500); await shot('7-depth-chosen');
  await p.locator('.gx-btn').click(); await p.waitForTimeout(500); await shot('8-cover'); await fit('cover');
  await p.locator('.gx-cov', { hasText: 'Aloe' }).click(); await p.waitForTimeout(1500); await shot('9-cover-chosen');
  await p.locator('.gx-btn').click(); await p.waitForTimeout(500); await shot('10-review'); await fit('review');
  const n = await p.evaluate(() => ({ chosen: Object.values(__cfg.sync.read().options).filter(o => o.chosen).length, price: __cfg.sync.read().price }));
  report.push(`${name}: ${n.chosen} native selections, Ecwid price ${n.price}, ${errs.length ? 'ERRORS ' + errs.join('|').slice(0, 200) : 'no page errors'}`);
  await ctx.close();
}
await session('h844', { width: 390, height: 844 });
await session('h700', { width: 390, height: 700 });
await session('h640', { width: 360, height: 640 });
console.log(report.join('\n'));
// montage of the 390 x 844 flow
const names = ['1-size', '3-size-selected', '4-firmness', '6-depth', '8-cover', '10-review'];
const imgs = names.map((n, i) => `<figure style="position:absolute;left:${10 + i * 266}px;top:10px;margin:0"><img src="data:image/png;base64,${readFileSync(join(out, `h844-${n}.png`)).toString('base64')}" style="width:256px;display:block;border:1px solid #3A4659"><figcaption style="font:600 11px system-ui;color:#C3D5ED;margin-top:4px">${n}</figcaption></figure>`).join('');
const m = await b.newPage({ viewport: { width: 20 + names.length * 266, height: 580 } }); await m.setContent(`<body style="margin:0;background:#0B1018">${imgs}</body>`); await m.waitForTimeout(300); await m.screenshot({ path: join(out, 'montage.jpg'), type: 'jpeg', quality: 85 });
await b.close();
