// The owner's package: the page's Copy buttons put EXACTLY the two blocks on the clipboard, and the zip holds what the page says.
//   NODE_PATH=$(npm root -g) node tests/experience-package.mjs   (after: node tools/build-package.mjs)
import { createRequire } from 'node:module';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), P = join(root, 'dist', 'package');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
const loader = readFileSync(join(P, 'paste', '1-loader.txt'), 'utf8'), desc = readFileSync(join(P, 'paste', '2-description.html'), 'utf8');
const b = await chromium.launch(); const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage(); await p.goto('file://' + join(P, 'PASTE-ME.html'));
for (const [id, want, label] of [['t1', loader, 'the loader'], ['t2', desc, 'the description']]) {
  await p.click(`button[data-for="${id}"]`); await p.waitForTimeout(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  ok(clip === want, `the Copy button puts ${label} on the clipboard exactly (${want.length} characters)`, clip.length + ' copied');
}
ok(loader.length <= 4000 && /ddtv=off/.test(loader) && !/<script[^>]*src=/.test(loader), 'the loader fits the 4000-character field and loads nothing by itself', String(loader.length));
ok(!/<script/i.test(desc) && !/Organic\s+Natural|Natural\s+Organic/i.test(desc), 'the description has no script and no "Organic Natural"');
const names = execFileSync('python3', ['-m', 'zipfile', '-l', join(root, 'dist', 'botanic-ddtv-package.zip')]).toString();
ok(['PASTE-ME.html', 'upload/ddtv/botanic-tv.js', 'upload/ddtv/botanic-phone.js', (() => { const f = readdirSync(join(root, 'dist', 'experience')).find((x) => /^botanic-tv-logos-[0-9a-f]{20}\.js$/.test(x)); return 'upload/ddtv/' + f; })(), 'upload/ddtv/botanic-cup.webp', 'upload/ddtv/botanic-mattress.webp', 'paste/1-loader.txt', 'paste/2-description.html'].every((n) => names.includes(n)), 'the zip holds the page, the four files and the two blocks');
const base = /https:\/\/[^'"]+\/ddtv\//.exec(loader)[0];
ok(['botanic-tv.js', 'botanic-phone.js'].every((f) => loader.includes(base)) && existsSync(join(P, 'upload', 'ddtv', 'botanic-tv.js')), 'the loader asks for the folder the page tells the owner to upload to', base);
await b.close();
console.log(fails ? `\n${fails} package check(s) FAILED` : '\nAll package checks passed');
process.exit(fails ? 1 : 0);
