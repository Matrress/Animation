// Test helpers: open the REAL live homepage, inject the locally built Four Laws tile directly under the Firmness block
// (after the tile that holds section.dn-c), optionally the System tile under it, and serve our release files from disk.
// The live site is only read, never changed.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.join(here, '..');
const require = createRequire(process.env.PW_PATH || '/opt/node22/lib/node_modules/');
export const { chromium } = require('playwright');
export const VERSION = /const VERSION = '([\d.]+)'/.exec(fs.readFileSync(path.join(root, 'build.mjs'), 'utf8'))[1];
export const PREVIEW_HOST = 'https://dpl-preview.invalid/';
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 720 },
  'ipad-landscape': { width: 1180, height: 820, touch: true },
  'ipad-portrait': { width: 820, height: 1180, touch: true },
  phone: { width: 390, height: 844, touch: true, mobile: true },
};
export async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); }

const SYSTEM_TILE = path.join(root, '..', 'divine-home-discovery', 'ecwid', 'system-0.7.0-pinned.html');

export async function openLive(browser, vp, { motion = 'no-preference', system = true, embed } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.touch, isMobile: !!vp.mobile, deviceScaleFactor: 1, reducedMotion: motion });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error' && /dpl/i.test(m.text())) errors.push(m.text().slice(0, 200)); });
  await page.route(PREVIEW_HOST + '**', (route) => {
    const f = path.join(root, 'release', VERSION, new URL(route.request().url()).pathname.replace(/^\//, ''));
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
    const type = f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : 'application/javascript';
    route.fulfill({ status: 200, contentType: type, headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) });
  });
  await page.goto('https://divinedunlop.com/', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.addStyleTag({ content: '[class*="cookie" i],[id*="gdpr" i],[class*="gdpr" i],[class*="privacy" i],.ins-notices{display:none!important}' });
  await page.evaluate(() => { for (const e of document.querySelectorAll('div,section,aside')) { const s = getComputedStyle(e); if (s.position === 'fixed' && /Privacy notice/.test(e.innerText || '') && e.innerText.length < 900) e.style.display = 'none'; } });
  const html = fs.readFileSync(path.join(root, 'ecwid', embed || process.env.DPL_EMBED || `pillars-${VERSION}.html`), 'utf8');
  const sys = system && fs.existsSync(SYSTEM_TILE) ? fs.readFileSync(SYSTEM_TILE, 'utf8') : '';
  await page.evaluate(([html, sys]) => {
    const wrap = (el) => { let w = el; while (w.parentElement && [...w.parentElement.children].every((c) => c === w || /^(SCRIPT|LINK|STYLE)$/.test(c.tagName))) w = w.parentElement; return w; };
    const last = document.querySelector('section.dn.dn-c') || document.querySelector('section.dn:last-of-type') || document.querySelector('#ddhd');
    const at = wrap(last);
    const box = document.createElement('div'); box.id = 'dpl-test-tile'; at.after(box);
    box.append(document.createRange().createContextualFragment(html));
    if (sys) { const b2 = document.createElement('div'); b2.id = 'dpl-test-system'; box.after(b2); b2.append(document.createRange().createContextualFragment(sys)); }
  }, [html, sys]);
  errors.length = 0;   // only what happens from here on counts: the live page throws its own errors
  await page.waitForFunction(() => window.DPL && document.querySelector('#dpl[data-dpl="on"]'), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}
