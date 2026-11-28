const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + path.resolve('experience/harness/tv.html')); await p.waitForTimeout(2500);
  const info = await p.evaluate(() => ({ host: !!document.getElementById('ddtv-experience'), cls: document.documentElement.className, shadow: !!(document.getElementById('ddtv-experience') || {}).shadowRoot, h: document.documentElement.scrollHeight }));
  console.log(JSON.stringify(info), errs.slice(0, 5));
  const host = await p.$('#ddtv-experience'); if (host) { await host.screenshot({ path: 'docs/shots/x-tv-start.png' }); }
  await b.close();
})();
