import { chromium } from 'playwright';
import fs from 'node:fs';
let sec = fs.readFileSync('preview/section-local.html','utf8').replace('class="ddh"','class="ddh ddh--breakout"');
fs.writeFileSync('preview/harness-breakout.html', `<!doctype html><meta name=viewport content="width=device-width"><style>body{margin:0;overflow-y:scroll}.tile{max-width:1200px;margin:0 auto;padding:0 40px}</style><div class=tile>${sec}</div><div style="height:2000px"></div>`);
const b = await chromium.launch({ args: ['--hide-scrollbars=false'] , ignoreDefaultArgs: ['--hide-scrollbars'] });
for (const w of [1440, 1920, 390]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:8765/preview/harness-breakout.html'); await p.waitForTimeout(300);
  console.log(w, await p.evaluate(() => { const r = document.querySelector('.ddh').getBoundingClientRect(); return { left: r.left, right: r.right, clientW: document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth, sbw: getComputedStyle(document.querySelector('.ddh')).getPropertyValue('--ddh-sbw') }; }));
}
await b.close();
