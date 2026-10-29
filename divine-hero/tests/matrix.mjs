// Screenshot + geometry matrix for the hero.
// usage: node tests/matrix.mjs <label> <url-path> [outDir]
// Writes <outDir>/<label>/<viewport>.jpg and <outDir>/<label>/metrics.json
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const VIEWPORTS = [
  // name, width, height, dpr, touch
  ['phone-360x800', 360, 800, 3, true],
  ['phone-390x844', 390, 844, 3, true],
  ['phone-430x932', 430, 932, 3, true],
  ['tablet-768x1024', 768, 1024, 2, true],
  ['tablet-820x1180', 820, 1180, 2, true],
  ['ipad-portrait-1024x1366', 1024, 1366, 2, true],
  ['edge-1050x800', 1050, 800, 1, false],
  ['edge-1051x800', 1051, 800, 1, false],
  ['ipad-landscape-1366x1024', 1366, 1024, 2, true],
  ['laptop-1366x768', 1366, 768, 1, false],
  ['laptop-1440x900-retina', 1440, 900, 2, false],
  ['laptop-1536x864', 1536, 864, 1.25, false],
  ['mbp16-1728x1117-retina', 1728, 1117, 2, false],
  ['desktop-1920x1080', 1920, 1080, 1, false],
  ['desktop-1920x1080-dpr2', 1920, 1080, 2, false],
  ['desktop-2560x1440', 2560, 1440, 1, false],
  ['5k-2560x1440-dpr2', 2560, 1440, 2, false],
  ['6k-32in-3008x1692-dpr2', 3008, 1692, 2, false],
  ['4k-3840x2160', 3840, 2160, 1, false],
];

const label = process.argv[2];
const urlPath = process.argv[3];
const outDir = process.argv[4] || 'reports/matrix';
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const base = process.env.BASE || 'http://127.0.0.1:8765/';

const dir = path.join(outDir, label);
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const results = {};

for (const [name, w, h, dpr, touch] of VIEWPORTS) {
  if (only && !only.test(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: touch, isMobile: touch && w < 1100 });
  const page = await ctx.newPage();
  const requests = [];
  page.on('requestfinished', async (req) => {
    try { const r = await req.sizes(); if (requests.some((x) => x.url === req.url().replace(base, ''))) return; requests.push({ url: req.url().replace(base, ''), bytes: r.responseBodySize, type: req.resourceType() }); } catch {}
  });
  await page.goto(base + urlPath, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1) }; };
    const textBox = (el) => { if (!el) return null; const rg = document.createRange(); rg.selectNodeContents(el); const b = rg.getBoundingClientRect(); return { x: +b.left.toFixed(1), r: +b.right.toFixed(1), y: +b.top.toFixed(1), b: +b.bottom.toFixed(1) }; };
    const img = q('.ddh__img');
    const navLinks = [...document.querySelectorAll('.ddh__hero-nav a')].map(textBox);
    const ctas = [...document.querySelectorAll('.ddh__cta')].map(r);
    const points = [...document.querySelectorAll('.ddh__point')].map((p) => ({ key: p.dataset.ddhPoint, ...r(p) }));
    return {
      vw: innerWidth, vh: innerHeight, docW: document.documentElement.scrollWidth,
      hero: r(q('.ddh')), scene: r(q('.ddh__scene')), art: r(q('.ddh__art')), plane: r(q('.ddh__plane')), img: r(img),
      imgSrc: img && img.currentSrc.split('/').pop(), imgNatural: img && img.naturalWidth,
      lockup: r(q('.ddh__sky-lockup')), nav: r(q('.ddh__hero-nav')), navText: navLinks,
      word: r(q('.ddh__sky-word')), wordLetters: [...document.querySelectorAll('.ddh__sky-word>span')].map(r),
      cert: r(q('.ddh__sky-cert')), leaf: r(q('.ddh__leaf')), certText: textBox(q('.ddh__sky-cert>span:last-child')),
      shop: r(q('.ddh__shop')), ctas, points,
      fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight),
    };
  });
  m.requests = requests;
  m.bytes = requests.reduce((a, b) => a + (b.bytes || 0), 0);
  results[name] = { w, h, dpr, ...m };
  await page.screenshot({ path: path.join(dir, name + '.jpg'), type: 'jpeg', quality: 82 });
  await ctx.close();
  process.stdout.write(`${name}: img=${m.imgSrc} rendered=${m.img && m.img.w}x${m.img && m.img.h} need=${Math.round((m.img && m.img.w) * dpr)}px ctaBottom=${m.ctas[0] && m.ctas[0].b}/${h} docW=${m.docW}/${w} bytes=${m.bytes}\n`);
}
fs.writeFileSync(path.join(dir, 'metrics.json'), JSON.stringify(results, null, 1));
await browser.close();
