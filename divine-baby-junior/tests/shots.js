/* Screenshots of the prototype: node tests/shots.js preview/prototype.html <outdir> */
const { chromium, devices } = require('playwright'); const path = require('path');
const file = 'file://' + path.resolve(process.argv[2]); const out = process.argv[3];
(async () => {
  const b = await chromium.launch();
  for (const [name, opt] of [['desk', { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }], ['ipad', { viewport: { width: 834, height: 1100 }, reducedMotion: 'reduce' }], ['phone', { ...devices['iPhone 13'], reducedMotion: 'reduce' }]]) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage(); await p.goto(file); await p.waitForSelector('.dbs--on'); await p.waitForFunction(() => [...document.querySelectorAll('.dbj-car__s--1 img')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 20000 });
        const hero = await p.$('.dbj-hero'); await hero.screenshot({ path: `${out}/v10-${name}-hero.png` });
    await p.click('.dbs-btn:has-text("Baby Cot Size")'); await p.click('.dbs-btn:has-text("60 × 120 cm")'); await p.click('[data-h="14"] .dbs-btn');
    await p.waitForTimeout(2200);
    const sel = await p.$('.dbs'); await sel.screenshot({ path: `${out}/v10-${name}-select.png` });
    await p.click('.dbs-tab:has-text("Prices")'); await p.click('.dbs-loadall'); await p.waitForTimeout(500); await p.waitForFunction(() => document.querySelector('.dbs').getAttribute('data-probing') !== 'true', null, { timeout: 60000 }); await p.waitForTimeout(500);
    await sel.screenshot({ path: `${out}/v10-${name}-prices.png` });
    const cover = await p.$('section[aria-labelledby="dbj-c"]'); await cover.screenshot({ path: `${out}/v10-${name}-cover.png` });
    await ctx.close();
  }
  await b.close();
})();
