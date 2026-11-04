// Lab Web Vitals (LCP, CLS, long tasks) + transfer, under throttling. usage: node tests/perf.mjs <url-path> [runs]
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:8765/';
const url = base + process.argv[2];
const runs = +(process.argv[3] || 3);
const PROFILES = {
  'phone 390x844@3, Slow 4G (1.6 Mbps, 150 ms RTT), 4x CPU': { vp: [390, 844, 3], mobile: true, down: 1.6e6 / 8, rtt: 150, cpu: 4 },
  'laptop 1440x900@2, cable (10 Mbps, 40 ms RTT)': { vp: [1440, 900, 2], mobile: false, down: 10e6 / 8, rtt: 40, cpu: 1 },
  'desktop 1920x1080@1, cable (10 Mbps, 40 ms RTT)': { vp: [1920, 1080, 1], mobile: false, down: 10e6 / 8, rtt: 40, cpu: 1 },
};
const browser = await chromium.launch();
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
for (const [name, p] of Object.entries(PROFILES)) {
  const lcp = [], cls = [], bytes = [], tbt = [];
  let lcpEl = '';
  for (let i = 0; i < runs; i++) {
    const ctx = await browser.newContext({ viewport: { width: p.vp[0], height: p.vp[1] }, deviceScaleFactor: p.vp[2], isMobile: p.mobile, hasTouch: p.mobile });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: p.rtt, downloadThroughput: p.down, uploadThroughput: p.down / 2 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
    let total = 0;
    cdp.on('Network.loadingFinished', (e) => { total += e.encodedDataLength; });
    await page.addInitScript(() => {
      window.__v = { lcp: 0, cls: 0, lt: 0, el: '' };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__v.lcp = e.startTime; window.__v.el = (e.element && (e.element.className || e.element.tagName)) + ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.lt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(url, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1500);
    const v = await page.evaluate(() => window.__v);
    lcp.push(v.lcp); cls.push(v.cls); bytes.push(total); tbt.push(v.lt); lcpEl = v.el;
    await ctx.close();
  }
  console.log(`${name}\n   LCP ${Math.round(med(lcp))} ms (${lcpEl}) | CLS ${med(cls).toFixed(4)} | long-task ms ${Math.round(med(tbt))} | transferred ${(med(bytes) / 1024).toFixed(1)} KB`);
}
await browser.close();
