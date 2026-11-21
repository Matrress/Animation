// Screenshots the description area of graphite.html at phone width (before/after colour work). Preview only.
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || 'docs/mobile/premium/shots/description-colours/before';
const file = process.argv[3] || 'docs/mobile/premium/preview/graphite.html';
import { mkdirSync } from 'node:fs';
mkdirSync(join(root, out), { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(pathToFileURL(join(root, file)).href, { waitUntil: 'load' });
await p.waitForTimeout(800);
const el = await p.$('#bp-top');
const box = await el.boundingBox();
const H = Math.round(box.height);
console.log('description height', H);
// slice into 1500px tall screenshots
const step = 1500; let i = 1;
for (let y = 0; y < H; y += step) {
  await p.screenshot({ path: join(root, out, `d${String(i++).padStart(2, '0')}.png`), clip: { x: 0, y: box.y + y, width: 390, height: Math.min(step, H - y) }, fullPage: true });
}
await b.close();
