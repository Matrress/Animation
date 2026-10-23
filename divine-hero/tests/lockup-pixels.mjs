// Pixel-exact ink bounds of the lockup rows: renders each row alone in black on white and scans the bitmap.
import { chromium } from 'playwright';
import pngjs from '/tmp/claude-0/tools/node_modules/pngjs/lib/png.js'; const { PNG } = pngjs;
const url = process.argv[2];
const vps = [[360,800,3],[390,844,3],[430,932,3],[768,1024,2],[1024,1366,2],[1366,768,2],[1440,900,2],[1920,1080,2],[2560,1440,2]];
const b = await chromium.launch();
const rows = { nav: '.ddh__hero-nav', word: '.ddh__sky-word', cert: '.ddh__sky-cert' };
for (const [w,h,d] of vps) {
  const p = await (await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d})).newPage();
  await p.goto(url); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(150);
  await p.addStyleTag({content:'.ddh__art,.ddh__shop,.ddh__points{visibility:hidden!important}.ddh__scene{background:#fff!important}.ddh *{text-shadow:none!important;box-shadow:none!important}.ddh__leaf::after{display:none}'});
  const out = {};
  for (const [k, sel] of Object.entries(rows)) {
    await p.evaluate(([sel]) => { const L = document.querySelector('.ddh__sky-lockup'); L.querySelectorAll(':scope > *').forEach(e => { e.style.visibility = e.matches(sel) ? 'visible' : 'hidden'; e.style.color = '#000'; e.querySelectorAll('*').forEach(c => c.style.color = '#000'); }); const lf = L.querySelector('.ddh__leaf'); if (lf) lf.style.background = '#000'; }, [sel]);
    const box = await p.evaluate(() => { const r = document.querySelector('.ddh__sky-lockup').getBoundingClientRect(); return { x: Math.max(0, r.left - 20), y: Math.max(0, r.top - 10), width: r.width + 40, height: r.height + 30 }; });
    const png = PNG.sync.read(await p.screenshot({ clip: box }));
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) { const i = (y * png.width + x) * 4; if (png.data[i] < 160) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    out[k] = { l: +(box.x + x0 / d).toFixed(1), r: +(box.x + (x1 + 1) / d).toFixed(1), t: +(box.y + y0 / d).toFixed(1), b: +(box.y + (y1 + 1) / d).toFixed(1) };
  }
  const f = (n) => n.toFixed(1);
  console.log(`${w}x${h}`.padEnd(10), `nav ${out.nav.l}-${out.nav.r}`, `| word ${out.word.l}-${out.word.r} (Δl ${f(out.word.l-out.nav.l)} Δr ${f(out.word.r-out.nav.r)})`, `| cert ${out.cert.l}-${out.cert.r} (Δl ${f(out.cert.l-out.nav.l)})`,
    `| gaps nav→word ${f(out.word.t-out.nav.b)} word→cert ${f(out.cert.t-out.word.b)} | block ${out.nav.t}-${out.cert.b}`);
}
await b.close();
