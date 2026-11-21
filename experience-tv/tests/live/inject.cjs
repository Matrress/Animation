// LOCAL INJECTION into the public live page (READ-ONLY for the store: nothing is saved anywhere).
// This uses the real Ecwid DOM of product 831592302, NOT the test product 876405767.
// usage: node live-inject.cjs <name> <width> <height> <touch 0|1> [pre-choose 0|1]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const R = ROOT + '/';
const [name, w, h, touch, choose] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5] === '1', process.argv[6] === '1'];
const css = fs.readFileSync(R + 'engine/ddtv-engine.css', 'utf8') + '\n' + fs.readFileSync(R + 'engine/ddtv-scenes.css', 'utf8');
const js = ['products/botanic.config.js', 'products/botanic.zones.js', 'engine/ddtv-engine.js', 'engine/ddtv-scenes.js'].map(f => fs.readFileSync(R + f, 'utf8')).join('\n;\n');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('#bp-top', { timeout: 45000 });
  await p.waitForSelector('.details-product-option', { timeout: 45000 });
  await p.waitForTimeout(2000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}
  await p.evaluate(({ css, js, PLACEMENT }) => {
    const st = document.createElement('style'); st.id = 'ddtv-styles'; st.textContent = css; document.head.appendChild(st);
    (0, eval)(js);
    if (PLACEMENT) window.DDTV_PRODUCTS.botanic.layout.placement = PLACEMENT; window.DDTV.start(null);
  }, { css, js, PLACEMENT: process.argv[7] || '' });
  await p.waitForSelector('.ddtv-host', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const m = await p.evaluate(() => {
    const box = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top + scrollY), Math.round(q.width), Math.round(q.height)]; };
    const host = document.querySelector('.ddtv-host');
    const root = host && host.shadowRoot;
    const q = (s) => root && root.querySelector(s);
    const size = document.querySelector('.details-product-option--SIZE');
    return { host: box(host), size: box(size), sidebar: box(document.querySelector('.product-details__sidebar')), gallery: box(document.querySelector('.product-details__gallery')),
      topbar: box(q('.ddtv__bar')), viewport: box(q('.ddtv__viewport')), side: box(q('.ddtv__side')), main: box(q('.ddtv__main')), wrap: box(q('.ddtv-wrap')),
      hostCount: document.querySelectorAll('.ddtv-host').length, docScrollW: document.documentElement.scrollWidth, innerW: innerWidth,
      placement: root && root.querySelector('.ddtv-wrap') && root.querySelector('.ddtv-wrap').getAttribute('data-placement'),
      isPhone: root && root.querySelector('.ddtv-wrap') && root.querySelector('.ddtv-wrap').classList.contains('is-phone'),
      clipped: root ? [...root.querySelectorAll('.ddtv__btn')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent.trim()) : null,
      btnFont: root && root.querySelector('.ddtv__btn') ? getComputedStyle(root.querySelector('.ddtv__btn')).fontSize : null,
      footOverlap: (() => { if (!root) return null; const r = [...root.querySelectorAll('.ddtv__foot > *')].map(e => e.getBoundingClientRect()); let o = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { if (r[i].left < r[j].right - 0.5 && r[j].left < r[i].right - 0.5 && r[i].width && r[j].width) o++; } return o; })(),
      galleryVisible: (() => { const g = document.querySelector('.product-details__gallery'); if (!g) return null; return [...g.children].filter(c => !c.classList.contains('ddtv-host')).some(c => c.offsetHeight > 0); })(),
      tvScreen: box(q('.ddtv__screen')) };
  });
  console.log(name, JSON.stringify(m), 'errors', errs.slice(0, 2));
  const clip = m.host ? { x: 0, y: Math.max(0, Math.min(m.host[1], m.gallery ? m.gallery[1] : m.host[1]) - 90), width: w, height: Math.min(1500, m.host[3] + 700) } : undefined;
  fs.mkdirSync(path.join(ROOT, 'dist', 'live'), { recursive: true });
  await p.screenshot({ path: path.join(ROOT, 'dist', 'live', `live-${name}.png`), fullPage: true, clip });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
