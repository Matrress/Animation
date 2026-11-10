// Tests the PROPOSED loader gate (docs/mobile/premium/proposals/loader-gate.js) with stub bundles: what is requested, per device.
// Offline; the stub origin is intercepted. This tests the decision and the requests, not the television itself.
//   NODE_PATH=$(npm root -g) node tests/loader-gate.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gate = readFileSync(join(root, 'docs/mobile/premium/proposals/loader-gate.js'), 'utf8').replace('https://YOUR-SITE.example/PATH/', 'https://stub.test/');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const b = await chromium.launch();

async function visit(label, ctxOpts, search = '', after) {
  const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage();
  const asked = []; const errors = [];
  p.on('pageerror', e => errors.push(String(e)));
  await p.route('https://stub.test/**', r => { asked.push(r.request().url().split('/').pop().split('?')[0]); r.fulfill(after === 'fail' ? { status: 500, body: 'x' } : { contentType: 'text/javascript', body: 'window.__loaded=(window.__loaded||[]).concat(location.pathname.length?"ok":"ok");' }); });
  await p.route('https://page.test/**', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name=viewport content="width=device-width"></head><body><p>standard page</p><script>${gate}</script></body></html>` }));
  await p.goto('https://page.test/' + search, { waitUntil: 'load' }); await p.waitForTimeout(300);
  let extra = {};
  if (after === 'rotate') { const vp = p.viewportSize(); await p.setViewportSize({ width: vp.height, height: vp.width }); await p.waitForTimeout(300); }
  if (after === 'narrow') { await p.setViewportSize({ width: 480, height: 800 }); await p.waitForTimeout(300); }
  extra.body = await p.evaluate(() => document.querySelector('p').textContent); extra.failedAttr = await p.evaluate(() => document.documentElement.getAttribute('data-ddtv-load'));
  await ctx.close();
  return { label, asked, errors, ...extra };
}
const land = d => { const s = d.screen || d.viewport; return { ...d, viewport: { width: d.viewport.height, height: d.viewport.width }, screen: { width: s.height, height: s.width } }; };
const T = 'botanic-tv.js', P = 'botanic-phone.js';
let r;
r = await visit('iPhone 13 portrait', devices['iPhone 13']); ok(r.asked.join() === P, `${r.label}: only the phone layer (${r.asked})`);
r = await visit('iPhone 13 landscape', land(devices['iPhone 13'])); ok(r.asked.join() === P, `${r.label}: only the phone layer (${r.asked})`);
r = await visit('iPhone 14 Pro Max portrait', devices['iPhone 14 Pro Max']); ok(r.asked.join() === P, `${r.label}: only the phone layer (${r.asked})`);
r = await visit('Pixel 7', { ...devices['Pixel 7'], screen: devices['Pixel 7'].screen || devices['Pixel 7'].viewport }); ok(r.asked.join() === P, `${r.label}: only the phone layer (${r.asked})`);
r = await visit('Galaxy S9+ landscape', land(devices['Galaxy S9+'])); ok(r.asked.join() === P, `${r.label}: only the phone layer (${r.asked})`);
r = await visit('iPad Mini portrait', devices['iPad Mini']); ok(r.asked.join() === T, `${r.label}: only the television (${r.asked})`);
r = await visit('iPad Mini landscape', land(devices['iPad Mini'])); ok(r.asked.join() === T, `${r.label}: only the television (${r.asked})`);
r = await visit('iPad Pro 11 portrait', devices['iPad Pro 11']); ok(r.asked.join() === T, `${r.label}: only the television (${r.asked})`);
r = await visit('Desktop 1440', { viewport: { width: 1440, height: 900 }, screen: { width: 1440, height: 900 } }); ok(r.asked.join() === T, `${r.label}: only the television (${r.asked})`);
r = await visit('Desktop dragged to 480 px', { viewport: { width: 1440, height: 900 }, screen: { width: 1920, height: 1080 } }, '', 'narrow'); ok(r.asked.join() === T, `${r.label}: the decision is the device's, so the television bundle stays (${r.asked}); the engine's own width rules choose the view`);
r = await visit('iPhone 13 rotated after load', devices['iPhone 13'], '', 'rotate'); ok(r.asked.join() === P, `${r.label}: nothing more requested on rotation (${r.asked})`);
r = await visit('iPad Mini rotated after load', devices['iPad Mini'], '', 'rotate'); ok(r.asked.join() === T, `${r.label}: nothing more requested on rotation (${r.asked})`);
r = await visit('iPhone ?ddtv=off', devices['iPhone 13'], '?ddtv=off'); ok(r.asked.length === 0, `${r.label}: nothing requested`);
r = await visit('Desktop ?ddtv=off', { viewport: { width: 1440, height: 900 }, screen: { width: 1440, height: 900 } }, '?ddtv=off'); ok(r.asked.length === 0, `${r.label}: nothing requested`);
r = await visit('Desktop ?ddtv=phone (review only)', { viewport: { width: 1440, height: 900 }, screen: { width: 1440, height: 900 } }, '?ddtv=phone'); ok(r.asked.join() === P, `${r.label}: the phone layer (${r.asked})`);
r = await visit('iPhone, bundle fails (500)', devices['iPhone 13'], '', 'fail'); ok(r.errors.length === 0 && r.body === 'standard page', `${r.label}: standard page intact, no page error`);
r = await visit('iPad, bundle fails (500)', devices['iPad Mini'], '', 'fail'); ok(r.errors.length === 0 && r.body === 'standard page', `${r.label}: standard page intact, no page error`);
console.log(fails ? `\n${fails} FAILED` : '\nall checks passed'); await b.close(); process.exit(fails ? 1 : 0);
