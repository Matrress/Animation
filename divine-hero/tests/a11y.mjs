// axe-core scan of the hero + reduced-motion / forced-colors checks. usage: node tests/a11y.mjs <url-path>
import { chromium } from 'playwright';
import fs from 'node:fs';
const axe = fs.readFileSync(process.env.AXE || '/tmp/claude-0/tools/node_modules/axe-core/axe.min.js', 'utf8');
const url = 'http://127.0.0.1:8765/' + process.argv[2];
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto(url); await p.waitForTimeout(300); await p.addScriptTag({ content: axe });
  const r = await p.evaluate(async () => (await axe.run('.ddh', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.length} node(s) — ${v.help}`));
  console.log(`${w}x${h} axe violations: ${r.length}`); r.forEach((x) => console.log('   ' + x));
}
// 1.10.0: each sheet, open (desktop hover/dialog and phone full screen)
for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch })).newPage();
  await p.goto(url); await p.waitForFunction(() => document.querySelector('.ddh__sheets'), null, { timeout: 8000 }); await p.addScriptTag({ content: axe });
  for (const name of ['bio', 'mattress', 'topper']) {
    await p.evaluate((n) => { document.querySelectorAll('.ddh__sheet').forEach((s) => { s.hidden = s.id !== 'ddh-sheet-' + n; }); }, name); await p.waitForTimeout(500);
    const r = await p.evaluate(async (n) => (await axe.run('#ddh-sheet-' + n, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'], rules: { region: { enabled: false } } })).violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.slice(0, 3).map((x) => x.target.join(' ')).join(' | ')}`), name);
    console.log(`${w}x${h} sheet ${name} axe violations: ${r.length}`); r.forEach((x) => console.log('   ' + x));
  }
}
const rm = await (await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })).newPage();
await rm.goto(url); await rm.waitForTimeout(200);
console.log('reduced-motion pulse:', await rm.evaluate(() => { const s = getComputedStyle(document.querySelector('.ddh__point'), '::after'); return s.animationName + ' / opacity ' + s.opacity; }));
const fc = await (await b.newContext({ forcedColors: 'active', viewport: { width: 1440, height: 900 } })).newPage();
await fc.goto(url); await fc.waitForTimeout(200);
console.log('forced-colors hotspot ring:', await fc.evaluate(() => getComputedStyle(document.querySelector('.ddh__point'), '::after').borderTopColor));
await b.close();
