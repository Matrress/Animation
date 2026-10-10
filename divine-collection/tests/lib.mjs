// Shared helpers: launch Chromium and serve the pinned jsDelivr URLs from the local repository
// (the sandbox cannot reach the CDN; the files are byte-identical to what the pinned commits hold).
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BASE = process.env.DDC_BASE || 'http://127.0.0.1:8790/divine-collection/preview/';
const types = { '.webp': 'image/webp', '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'application/javascript' };
export async function browser() { return chromium.launch(); }
export async function page(br, opts = {}) {
  const ctx = await br.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, deviceScaleFactor: opts.dpr || 1, hasTouch: !!opts.touch, isMobile: !!opts.mobile, reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
  await ctx.route(/cdn\.jsdelivr\.net\/gh\/Matrress\/Animation@[^/]+\/(.+)$/, (route) => {
    const rel = /Animation@[^/]+\/(.+)$/.exec(route.request().url())[1];
    const file = path.join(repo, rel);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
    route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'access-control-allow-origin': '*' } });
  });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()); });
  return p;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
