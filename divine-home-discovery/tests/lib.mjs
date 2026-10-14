// Shared test helpers: open the REAL live homepage in Chromium, inject the locally built section where the old navigator sat
// (right after the Hero's wrapper), and serve our release files from disk. The live site is only read, never changed.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.join(here, '..');
const require = createRequire(process.env.PW_PATH || '/opt/node22/lib/node_modules/');
export const { chromium } = require('playwright');
export const VERSION = /const VERSION = '([\d.]+)'/.exec(fs.readFileSync(path.join(root, 'build.mjs'), 'utf8'))[1];   // the release this checkout builds
export const PREVIEW_HOST = 'https://ddhd-preview.invalid/';
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 720 },
  'ipad-landscape': { width: 1180, height: 820, touch: true },
  'ipad-landscape-xl': { width: 1366, height: 1024, touch: true },
  'ipad-portrait': { width: 820, height: 1180, touch: true },
  phone: { width: 390, height: 844, touch: true, mobile: true },
};
export async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); }

export async function openLive(browser, vp, { inject = true, motion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.touch, isMobile: !!vp.mobile, deviceScaleFactor: 1, reducedMotion: motion });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error' && /ddhd/i.test(m.text())) errors.push(m.text().slice(0, 160)); });
  await page.route(/divine-home-discovery\/release\/[\d.]+\//, (route) => { const v = /release\/([\d.]+)\//.exec(route.request().url())[1]; return v === VERSION ? route.fallback() : route.abort(); });   // any other version the live site carries (0.1.0 ... today's): never let it run in a test
  await page.route(PREVIEW_HOST + '**', (route) => {
    const f = path.join(root, 'release', VERSION, new URL(route.request().url()).pathname.replace(/^\//, ''));
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
    route.fulfill({ status: 200, contentType: f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'application/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) });
  });
  await page.goto('https://divinedunlop.com/', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.addStyleTag({ content: '[class*="cookie" i],[id*="gdpr" i],[class*="gdpr" i],[class*="privacy" i],.ins-notices{display:none!important}' });
  await page.evaluate(() => { for (const e of document.querySelectorAll('div,section,aside')) { const s = getComputedStyle(e); if ((s.position === 'fixed') && /Privacy notice/.test(e.innerText || '') && e.innerText.length < 900) e.style.display = 'none'; } });
  if (inject) {
    const html = fs.readFileSync(path.join(root, 'ecwid', process.env.DDHD_EMBED || `section-${VERSION}.html`), 'utf8');   // DDHD_EMBED=section-0.1.0-pinned.html tests the real jsDelivr URLs
    await page.evaluate((html) => {
      const frag = document.createRange().createContextualFragment(html);
      const live = document.querySelector('#ddhd');
      if (live) {   // the live site already carries a version: replace it in the same Ecwid tile wrapper, exactly where it sits
        const parent = live.parentElement;
        parent.querySelectorAll('link[href*="divine-home-discovery"]').forEach((e) => e.remove());
        [...parent.querySelectorAll('script')].filter((s) => /ddhd/.test(s.textContent)).forEach((s) => s.remove());
        document.head.querySelectorAll('script[src*="divine-home-discovery"]').forEach((e) => e.remove());
        live.remove(); parent.append(frag);
      } else {
        const hero = document.querySelector('.ddh'); let a = hero;
        while (a.parentElement && [...a.parentElement.children].every((c) => c === a || /^(SCRIPT|LINK|STYLE)$/.test(c.tagName))) a = a.parentElement;
        a.after(frag);
      }
    }, html);
    errors.length = 0; // only what happens from here on counts: the live page throws its own errors (Ecwid's OnPageLoaded, blocked trackers)
    await page.waitForFunction(() => window.DDHD && document.querySelector('#ddhd[data-ddhd]'), null, { timeout: 15000 });
    await page.waitForTimeout(400);
  }
  return { ctx, page, errors };
}
