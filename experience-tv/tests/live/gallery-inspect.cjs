// READ-ONLY inspection of the PUBLIC live product's native Ecwid gallery (local browser, nothing saved).
// Prints structure, image attributes, which image requests the page makes, what data Ecwid exposes, and how the
// gallery element behaves (identity, re-render) when the customer interacts. No tokens are printed.
const { chromium } = require('playwright');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const reqs = [];
  p.on('request', (r) => { const u = r.url(); if (/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u) || r.resourceType() === 'image') reqs.push({ t: Date.now(), u }); });
  const t0 = Date.now();
  await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.product-details__gallery', { timeout: 45000 });
  await p.waitForTimeout(4000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}

  const dom = await p.evaluate(() => {
    const g = document.querySelector('.product-details__gallery');
    const short = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    const tree = (e, d) => d > 4 ? '' : '\n' + '  '.repeat(d) + short(e) + (e.children.length ? ' [' + e.children.length + ']' : '') + [...e.children].slice(0, 6).map((c) => tree(c, d + 1)).join('');
    const imgs = [...g.querySelectorAll('img')].map((i) => ({ cls: i.className, parent: i.parentElement.className.toString().slice(0, 60), src: i.currentSrc || i.src, srcAttr: (i.getAttribute('src') || '').slice(0, 140), srcset: (i.getAttribute('srcset') || '').slice(0, 300), sizes: i.getAttribute('sizes'), loading: i.getAttribute('loading'), alt: i.alt, w: i.naturalWidth, h: i.naturalHeight, shown: i.offsetParent !== null, box: [Math.round(i.getBoundingClientRect().width), Math.round(i.getBoundingClientRect().height)] }));
    const bg = [...g.querySelectorAll('*')].filter((e) => /url\(/.test(getComputedStyle(e).backgroundImage)).map((e) => ({ cls: e.className.toString().slice(0, 50), bg: getComputedStyle(e).backgroundImage.slice(0, 160) }));
    return { tree: tree(g, 0), imgCount: imgs.length, imgs: imgs.slice(0, 12), bg: bg.slice(0, 6), galleryClass: g.className, parent: g.parentElement.className.toString().slice(0, 80) };
  });
  console.log('=== GALLERY DOM ===' + dom.tree);
  console.log('gallery class:', dom.galleryClass, '| parent:', dom.parent);
  console.log('img elements in gallery:', dom.imgCount);
  dom.imgs.forEach((i, n) => console.log('  img#' + n, JSON.stringify(i)));
  console.log('background-image elements:', JSON.stringify(dom.bg));

  const api = await p.evaluate(() => {
    const names = (o) => o ? Object.keys(o).filter((k) => !/token|secret|password/i.test(k)).slice(0, 60) : null;
    return { Ecwid: names(window.Ecwid), ec: names(window.ec), ecStorefront: names(window.ec && window.ec.storefront), EcwidOnPageLoaded: names(window.Ecwid && window.Ecwid.OnPageLoaded), hasInitialState: typeof window.initialState, initialStateLen: typeof window.initialState === 'string' ? window.initialState.length : null };
  });
  console.log('\n=== EXPOSED API (names only) ===\n' + JSON.stringify(api, null, 1));

  // What does the page's own state say about this product's images? (parse, then print image-ish structures only)
  const st = await p.evaluate(() => {
    let s = window.initialState; if (typeof s !== 'string') return { err: 'no string state' };
    let o; try { o = JSON.parse(s); } catch (e) { return { err: 'parse ' + e.message }; }
    const hits = [];
    const seen = new Set();
    (function walk(v, path, depth) {
      if (depth > 9 || !v || typeof v !== 'object' || seen.has(v)) return; seen.add(v);
      if (Array.isArray(v)) { v.slice(0, 3).forEach((x, i) => walk(x, path + '[' + i + ']', depth + 1)); return; }
      for (const k of Object.keys(v)) {
        if (/token|secret|password|key$/i.test(k)) continue;
        const val = v[k];
        if (/image|media|gallery|photo|thumb/i.test(k)) hits.push({ path: path + '.' + k, type: Array.isArray(val) ? 'array(' + val.length + ')' : typeof val, sample: typeof val === 'string' ? val.slice(0, 160) : JSON.stringify(val).slice(0, 700) });
        walk(val, path + '.' + k, depth + 1);
      }
    })(o, '$', 0);
    return { topKeys: Object.keys(o).slice(0, 30), hits: hits.slice(0, 40) };
  });
  console.log('\n=== STATE: image-related fields ===\ntop keys:', JSON.stringify(st.topKeys), st.err || '');
  (st.hits || []).forEach((h) => console.log('  ' + h.path + ' :: ' + h.type + ' :: ' + h.sample));

  // Initial image requests
  const first = reqs.filter((r) => /cloudfront|ecwid|imgix|ecwid\.com/i.test(r.u));
  console.log('\n=== IMAGE REQUESTS (first 4 s, CDN) === count', first.length);
  first.slice(0, 20).forEach((r) => console.log('  +' + (r.t - t0) + 'ms ' + r.u.slice(0, 200)));
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
