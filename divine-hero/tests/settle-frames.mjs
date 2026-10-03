// Renders the Natural Adaptation settle frame by frame on a virtual clock (for review videos). usage: node tests/settle-frames.mjs <page> <outdir> [W H dpr fps]
import { chromium } from 'playwright';
import fs from 'fs';
const [,, u, out, W = '1440', H = '900', DPR = '1', FPS = '25'] = process.argv;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +DPR });
await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return g.call(this, t, o && Object.assign({}, o, { failIfMajorPerformanceCaveat: false })); }; });
const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('pageerror', e.message)); p.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
await p.clock.install();
await p.goto('http://127.0.0.1:8765/' + u, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.clock.runFor(600);
const c = await p.evaluate(() => { const e = document.querySelector('.ddh__point[data-ddh-point=firmness]'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); const pl = document.querySelector('.ddh__plane').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, pl: [pl.left, pl.top, pl.width] }; });
await p.mouse.move(c.x - 160, c.y + 140); await p.clock.runFor(100); await p.waitForTimeout(1500); await p.clock.runFor(100);
await p.clock.pauseAt(new Date(Date.now() + 5000));
await p.mouse.move(c.x, c.y, { steps: 2 }); await p.clock.runFor(1); await p.waitForTimeout(1500);   // CSS fades settle in real time
const k = c.pl[2] / 3554, clip = { x: c.pl[0], y: c.pl[1] + 660 * k, width: 2960 * k, height: 1500 * k };
fs.mkdirSync(out, { recursive: true });
const dt = 1000 / +FPS; let i = 0;
for (let t = 0; t <= 3400; t += dt, i++) { if (i) await p.clock.runFor(dt); await p.screenshot({ path: `${out}/f${String(i).padStart(3, '0')}.png`, clip }); }
console.log('frames', i, JSON.stringify(await p.evaluate(() => ({ s: document.querySelector('.ddh').getAttribute('data-ddh-state'), cv: !!document.querySelector('.ddh__settle') }))));
await b.close();
