// Synthetic measurements of the PHONE LAYER in the integrated preview (stand-in Ecwid; 4x CPU; no real device).
// Reports the code it ships, the DOM it adds, what the browser spent initialising it, and interaction latency
// (Event Timing durations while a visitor-like flow is driven: the nearest synthetic stand-in for INP).
// This measures the PREVIEW's layer only: not the Ecwid page, not the description, not media. Real devices are still needed.
//   NODE_PATH=$(npm root -g) node tools/premium-measure.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..'); const P = join(root, 'docs', 'mobile', 'premium');
const url = 'file://' + join(P, 'preview', 'index.html');
const sz = f => { const t = readFileSync(join(P, 'src', f), 'utf8'); return { raw: t.length, gzip: gzipSync(t).length }; };
const core = readFileSync(join(P, 'preview', 'index.html'), 'utf8').match(/<script id="firmness-core">([\s\S]*?)<\/script>/)[1];
const code = { sync: sz('sync.js'), configurator: sz('configurator.js'), firmnessCore: { raw: core.length, gzip: gzipSync(core).length }, premiumCss: sz('premium.css'), contentCss: sz('content.css') };
const jsRaw = code.sync.raw + code.configurator.raw + code.firmnessCore.raw, jsGz = code.sync.gzip + code.configurator.gzip + code.firmnessCore.gzip;
const b = await chromium.launch(); const result = { date: new Date().toISOString(), code: { ...code, phoneLayerJsRaw: jsRaw, phoneLayerJsGzip: jsGz, note: 'unminified source; a production build would be smaller (not measured)', televisionBundle: { raw: 284194, gzip: 72719 } }, concepts: {} };
for (const concept of ['sheet', 'stage', 'journey']) {
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
  await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable'); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.addInitScript(() => { window.__ev = []; window.__cls = 0; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__ev.push([e.name, Math.round(e.duration)]))).observe({ type: 'event', durationThreshold: 16, buffered: true }); new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) { /* unsupported */ } });
  await p.goto(url + '?chrome=0&concept=' + concept, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const m = async () => { const o = {}; for (const x of (await cdp.send('Performance.getMetrics')).metrics) o[x.name] = x.value; return o; };
  const m0 = await m(); const dom0 = await p.evaluate(() => document.getElementsByTagName('*').length);
  const t = async (sel) => { const l = p.locator(sel).first(); await l.evaluate(e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(120); try { await l.click({ timeout: 3000 }); } catch (e) { await l.evaluate(x => x.click()); } await p.waitForTimeout(900); };
  await t('#cfg-cta .cta');
  await t('[data-act=pick][data-role=size]'); // first size
  if (concept === 'journey') { await p.locator('.jr__h', { hasText: 'Firmness' }).evaluate(x => x.click()); } await p.waitForSelector('#fw', { timeout: 10000 });
  await p.locator('#fw').fill('82'); await p.locator('#fh').fill('178'); await p.waitForTimeout(400);
  const flow = [['firmness', 'Firm'], ['depth', 'Deep Comfort'], ['cover', 'Aloe']];
  for (const [r, txt] of flow) { if (concept === 'journey') { const h = { firmness: 'Firmness', depth: 'Depth', cover: 'Cover' }[r]; await p.locator('.jr__h', { hasText: h }).evaluate(x => x.click()); await p.waitForTimeout(400); } await t(`[data-act=pick][data-role=${r}]:has-text("${txt}")`); }
  const m1 = await m(); const r = await p.evaluate(() => ({ dom: document.getElementsByTagName('*').length, panelNodes: document.getElementById('cfg').getElementsByTagName('*').length, ev: window.__ev.slice(), cls: +window.__cls.toFixed(4), chosen: Object.values(__cfg.sync.read().options).filter(o => o.chosen).length }));
  const durs = r.ev.map(e => e[1]).sort((a, c) => c - a);
  result.concepts[concept] = { chosenNatively: r.chosen, domAtLoad: dom0, domAfterFlow: r.dom, panelNodes: r.panelNodes, scriptMsInit: Math.round(m0.ScriptDuration * 1000), scriptMsFlow: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000), layoutMsFlow: Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000), styleMsFlow: Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000), heapMB: +(m1.JSHeapUsedSize / 1048576).toFixed(1), interactions: durs.length, slowestInteractionMs: durs[0] || 0, p75InteractionMs: durs[Math.floor(durs.length * 0.25)] || 0, cls: r.cls };
  await ctx.close();
}
await b.close();
writeFileSync(join(P, 'data', 'premium-measure.json'), JSON.stringify(result, null, 1));
console.log('phone layer JS (unminified): ' + (jsRaw / 1024).toFixed(1) + ' KB raw, ' + (jsGz / 1024).toFixed(1) + ' KB gzip; television bundle 278 KB raw, 71 KB gzip');
console.log('CSS: premium ' + (code.premiumCss.raw / 1024).toFixed(1) + ' KB + content ' + (code.contentCss.raw / 1024).toFixed(1) + ' KB raw');
console.table(result.concepts);
