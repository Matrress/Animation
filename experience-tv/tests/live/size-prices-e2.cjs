/*
 * READ-ONLY, LOCAL (E2). Is Ecwid's price after choosing ONLY a size really the starting price of the basic 20 cm configuration?
 * For every size the real page offers: choose the size; read Ecwid's price; then choose the 20 cm depth and read it again.
 * The two must be equal for the panel's "Starting price (20 cm base depth)" caption to be true. Also checks that the 22
 * chips the panel derives from Ecwid's labels (dimensions parsed from the label, grouped by width) match the native list.
 * Nothing is saved; Add to Bag is never clicked. The table is a capture of what Ecwid said today, NOT data used by the panel.
 *   NODE_PATH=$(npm root -g) node tests/live/size-prices-e2.cjs [out.json]
 */
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const SYNC = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'mobile', 'premium', 'src', 'sync.js'), 'utf8');
const URL_ = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const p = await ctx.newPage();
  await p.goto(URL_, { waitUntil: 'load', timeout: 120000 }); await p.waitForSelector('.details-product-option', { timeout: 60000 }); await p.waitForTimeout(3000);
  await p.evaluate(SYNC); await p.evaluate(() => { window.__s = DDSync.create(); });
  const rows = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)); const s = __s, out = [];
    const read = () => s.read(); const sizes = read().options.size.choices;
    const settle = async (prev) => { for (let i = 0; i < 30; i++) { await wait(150); if (read().price !== prev) { await wait(400); return read().price; } } return read().price; };
    for (const c of sizes) {
      const m = /(\d{2,3})\s*[x×]\s*(\d{2,3})/.exec(c.label); const before = read().price;
      await s.set('size', c.value); const pSize = await settle(before);
      const mod = /\(\+£([\d\s]+)\)/.exec(c.label);
      let pDepth = pSize; if (m) { await s.set('depth', /20 cm/); await wait(1500); pDepth = read().price; }
      out.push({ label: c.label.replace(/\s+/g, ' '), dims: m ? [+m[1], +m[2]] : null, priceSizeOnly: pSize, priceWith20cm: pDepth, equal: pSize === pDepth, labelModifier: mod ? +mod[1].replace(/\s/g, '') : null });
      s.clear('depth'); s.clear('size'); await wait(900);
    }
    return out;
  });
  const real = rows.filter(r => r.dims), g = w => w <= 100 ? 'SINGLE' : w <= 140 ? 'DOUBLE' : w <= 160 ? 'KING' : 'SUPERKING · EMPEROR';
  const groups = {}; real.forEach(r => { groups[g(r.dims[0])] = (groups[g(r.dims[0])] || 0) + 1; });
  const uniq = new Set(real.map(r => r.dims.join('x'))).size;
  const bad = real.filter(r => !r.equal);
  console.log(`native size choices: ${rows.length} (${real.length} with dimensions, ${uniq} distinct); groups ${JSON.stringify(groups)}`);
  console.log(`size-only price equals the price with the 20 cm depth chosen: ${real.length - bad.length} of ${real.length}${bad.length ? ' | DIFFERENT: ' + JSON.stringify(bad.map(r => [r.label.slice(0, 24), r.priceSizeOnly, r.priceWith20cm])) : ''}`);
  const nonc = rows.filter(r => !r.dims); console.log('choice without dimensions:', JSON.stringify(nonc.map(r => [r.label, r.priceSizeOnly])));
  const mism = real.filter(r => r.labelModifier != null && Math.abs(parseFloat(r.priceSizeOnly.replace(/[£\s]/g, '')) - r.labelModifier * 0.9) > 0.05);
  console.log(`price = 90% of the label modifier: ${real.length - mism.length} of ${real.length} (informational)`);
  if (process.argv[2]) { fs.mkdirSync(path.dirname(process.argv[2]), { recursive: true }); fs.writeFileSync(process.argv[2], JSON.stringify({ date: new Date().toISOString(), url: URL_, rows, note: 'capture of Ecwid output; not used by the panel; local selections only' }, null, 1)); }
  await b.close(); process.exit(bad.length || real.length !== 22 || uniq !== 22 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
