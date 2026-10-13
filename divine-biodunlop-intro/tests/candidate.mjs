// The pasted candidate, exactly as an Instant Site would receive it: every jsDelivr address is answered from the repository, and the
// section is delivered four ways (in the page, injected after load as one piece, scripts-before-markup, intro.js missing).
// Needs tools/serve.py is NOT required: files are read from disk. usage: node tests/candidate.mjs
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const html = fs.readFileSync(path.join(repo, 'divine-biodunlop-intro', 'candidate', 'section-1.21.0-dev-jsdelivr.html'), 'utf8');
const TYPES = { '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm' };
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL', m); } };
const b = await chromium.launch();
async function open(mode, extra = {}) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const hits = [];
  await ctx.route(/cdn\.jsdelivr\.net\/gh\/Matrress\/Animation@[^/]+\/(.*)/, (r) => {
    const rel = r.request().url().replace(/^.*Animation@[^/]+\//, '').split('?')[0]; hits.push(rel);
    if (extra.block && extra.block.test(rel)) return r.fulfill({ status: 404, body: '' });
    const f = path.join(repo, decodeURIComponent(rel)); if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: TYPES[path.extname(f)] || 'application/octet-stream', headers: { 'access-control-allow-origin': '*' } });
  });
  const page = await ctx.newPage();
  await ctx.route('https://shop.test/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>t</title><style>body{margin:0}</style></head><body><div id="slot">' + (mode === 'static' ? html : '') + '</div></body></html>' }));
  await page.goto('https://shop.test/' + (extra.q || ''), { waitUntil: 'load' });
  if (mode === 'fragment') await page.evaluate((h) => { const f = document.createRange().createContextualFragment(h); document.getElementById('slot').appendChild(f); }, html);
  if (mode === 'scripts-first') await page.evaluate(async (h) => {
    // worst case: a loader that inserts the scripts and styles one by one first, the markup afterwards, the inline scripts last
    const doc = new DOMParser().parseFromString('<body>' + h + '</body>', 'text/html'), slot = document.getElementById('slot'), late = [];
    for (const n of [...doc.body.childNodes]) {
      if (n.nodeType === 1 && n.tagName === 'SCRIPT' && n.src) { const s = document.createElement('script'); s.src = n.src; s.defer = true; slot.appendChild(s); await new Promise((r) => { s.onload = s.onerror = r; }); }
      else if (n.nodeType === 1 && n.tagName === 'SCRIPT') late.push(n);
      else if (n.nodeType === 1 && n.tagName === 'LINK') slot.appendChild(n.cloneNode(true));
      else if (n.nodeType === 1 && n.tagName === 'SECTION') late.unshift(n);
    }
    for (const n of late) { if (n.tagName === 'SCRIPT') { const s = document.createElement('script'); s.textContent = n.textContent; slot.appendChild(s); } else slot.appendChild(n.cloneNode(true)); await new Promise((r) => setTimeout(r, 50)); }
  }, html);
  return { ctx, page, hits };
}
const st = (p) => p.evaluate(() => document.documentElement.getAttribute('data-ddb'));
for (const mode of ['static', 'fragment', 'scripts-first']) {
  const { ctx, page, hits } = await open(mode);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ddb-lit'), null, { timeout: 8000 }).catch(() => {});
  ok(hits.some((u) => /intro\.css$/.test(u)) && hits.some((u) => /intro\.js$/.test(u)), `${mode}: intro.css and intro.js are requested from the pinned path`);
  ok(await page.evaluate(() => document.documentElement.hasAttribute('data-ddb-lit')) || await st(page) === null, `${mode}: the points were released and come out (${await st(page)})`);
  ok(!hits.some((u) => /ddb-(turn|again|poster)/.test(u)) && !(await page.$('.ddb video')), `${mode}: no turning film exists or is requested`);
  await page.waitForTimeout(3500);
  const c = await page.evaluate(() => { const r = document.querySelector('[data-ddh-point="firmness"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(c[0], c[1]); await page.waitForTimeout(400);
  ok(await page.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-state')) === 'firmness', `${mode}: the hero works`);
  await page.reload(); await page.waitForTimeout(250);
  if (mode === 'static') ok(['pending', null].includes(await st(page)), 'static: a reload waits for the model again (' + await st(page) + ')');
  await ctx.close();
}
{ // ?ddb=2 shows the points at once; ?ddb=0 switches it all off
  const { ctx, page } = await open('static'); await page.waitForTimeout(600);
  await page.goto('https://shop.test/?ddb=2'); await page.waitForTimeout(500);
  ok(await st(page) === null, '?ddb=2: no waiting');
  await page.goto('https://shop.test/?ddb=0'); await page.waitForTimeout(500);
  ok(await st(page) === null && await page.evaluate(() => !document.documentElement.hasAttribute('data-ddb-ok')), '?ddb=0: off'); await ctx.close();
}
{ // a file of the pair missing: never stuck with hidden points
  for (const [what, re] of [['intro.js', /intro\.js$/], ['intro.css', /intro\.css$/]]) {
    const { ctx, page } = await open('static', { block: re }); await page.waitForTimeout(4200);
    ok(await st(page) === null, `${what} missing: the hero's points are shown within 4 s (${await st(page)})`);
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.ddh__points')).visibility === 'visible'), `${what} missing: the points are visible`);
    await ctx.close();
  }
}
await b.close();
console.log(`candidate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
