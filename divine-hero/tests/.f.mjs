import { chromium } from 'playwright';
const b = await chromium.launch();
const [W, H] = [+process.argv[2] || 1440, +process.argv[3] || 900];
const p = await b.newPage({ viewport: { width: W, height: H } }); await p.goto('http://127.0.0.1:8765/preview/sim110.html'); await p.waitForFunction(() => document.querySelector('.ddh__sheets'));
const c = await p.$$('.ddh__cta');
await c[0].hover(); await p.waitForTimeout(1500); await p.screenshot({ path: `/tmp/claude-0/g-${W}-mat.png` });
await p.mouse.move(5, H - 5, { steps: 3 }); await p.waitForTimeout(600); await c[1].hover(); await p.waitForTimeout(1500); await p.screenshot({ path: `/tmp/claude-0/g-${W}-top.png` });
await p.mouse.move(5, H - 5, { steps: 3 }); await p.waitForTimeout(600); await p.click('.ddh__point[data-ddh-point=bio]', { force: true }); await p.waitForTimeout(1500); await p.screenshot({ path: `/tmp/claude-0/g-${W}-bio.png` });
await b.close();
