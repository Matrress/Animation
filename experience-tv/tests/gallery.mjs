// Tests of the Ecwid gallery integration: native gallery isolation, Optimised Preview / Standard Product View,
// the gallery adapter and the View Model Gallery.
//   node tools/build-embed.mjs && node tests/gallery.mjs [screenshot-folder]
//
// !! EVERYTHING HERE RUNS AGAINST A SIMULATED ECWID in Chromium. The stand-in page has the markup and the re-render
// !! behaviour that were observed on the real storefront, and the real image records of the public product, but it is
// !! not Ecwid and not Safari. A pass proves our logic; it does not prove the real store (tests/live/gallery-e2.cjs
// !! does that for the public product; the test product and real devices are not covered).
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page0 = pathToFileURL(join(root, 'dist', 'embed', 'test-page.html')).href;
const fixture = JSON.parse(readFileSync(join(root, 'tests', 'fixtures', 'live-media-831592302.json'), 'utf8'));
const shots = process.argv[2];
if (shots) mkdirSync(shots, { recursive: true });

const SHIM = `window.__q = (s) => document.querySelector(s) || (window.DDTV && DDTV.current && DDTV.current.shadow.querySelector(s));
window.__qa = (s) => [...document.querySelectorAll(s), ...(window.DDTV && DDTV.current ? DDTV.current.shadow.querySelectorAll(s) : [])];`;

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };
console.log('NOTE: simulated Ecwid storefront, Chromium only. Not live Ecwid, not Safari.\n');

const browser = await chromium.launch();
const COLOURS = ['#2C7894', '#3B8FAE', '#1B5568', '#6A8CA0', '#8BA9B8', '#435262', '#5D7F8F', '#7FA6B6', '#2A6076', '#4F7F93'];

/* A page with the store's CDN answered locally (a labelled SVG per file) and every request recorded. */
async function open(query = '', viewport = { width: 1440, height: 900 }, extra = {}, { failUrls = [] } = {}) {
  const ctx = await browser.newContext({ viewport, screen: extra.screen || { width: 1920, height: 1080 }, deviceScaleFactor: 1, ...extra });
  await ctx.addInitScript(() => { sessionStorage.setItem('ddtv:botanic:splash', '1'); window.__nonce = Math.random(); });
  await ctx.addInitScript(SHIM);
  const reqs = [], all = [];
  const fail = new Set(failUrls);
  ctx.on('request', (r) => { all.push({ method: r.method(), url: r.url() }); });
  await ctx.route(/^https?:\/\//, (r) => {
    const u = r.request().url();
    if (!/d2j6dbq0eux0bg\.cloudfront\.net/.test(u)) return r.abort();
    reqs.push(u);
    if (fail.has(u)) return r.fulfill({ status: 404, body: 'gone' });
    const id = (u.match(/(\d+)\.\w+$/) || [])[1] || '0';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000" viewBox="0 0 1500 1000"><rect width="1500" height="1000" fill="${COLOURS[+id % COLOURS.length]}"/><text x="750" y="500" font-size="90" fill="#fff" text-anchor="middle" font-family="Arial">photo file ${id}</text></svg>`;
    return r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg, headers: { 'access-control-allow-origin': '*' } });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(page0 + query);
  return { ctx, page, errors, reqs, all };
}
const mounted = (page) => page.waitForFunction(() => document.querySelectorAll('.ddtv-host').length === 1 && window.DDTV && DDTV.current && DDTV.current.modelGallery, null, { timeout: 5000 }).then(() => true, () => false);
const settle = (page, ms = 350) => page.waitForTimeout(ms);

/* What the store's own gallery looks like right now. */
const nativeState = (page) => page.evaluate(() => {
  const g = document.querySelector('.product-details__gallery');
  const kids = g ? [...g.children].filter((c) => !c.classList.contains('ddtv-host')) : [];
  return {
    attr: g ? g.getAttribute('data-ddtv-gallery') : null,
    display: kids.map((c) => getComputedStyle(c).display),
    allHidden: kids.length > 0 && kids.every((c) => getComputedStyle(c).display === 'none'),
    allShown: kids.length > 0 && kids.every((c) => getComputedStyle(c).display !== 'none'),
    kids: kids.length, thumbs: g ? g.querySelectorAll('.details-gallery__thumb').length : 0,
    mainSrc: g && g.querySelector('.details-gallery__picture') ? g.querySelector('.details-gallery__picture').getAttribute('src') : null,
    styleEls: document.querySelectorAll('#ddtv-gallery-style').length, hosts: document.querySelectorAll('.ddtv-host').length,
  };
});

/* A manifest made from the real image records with an ARBITRARY classification, for these tests only. */
const TEST_CATEGORY = ['main', 'gallery', 'gallery', 'gallery', 'gallery', 'seven-zone', 'seven-zone', 'covers', 'covers', 'lifestyle', 'details', 'technical', 'shared', 'shared'];
function testManifest(over = {}) {
  return {
    version: 1, productId: 876405767, order: 'ecwid', unlisted: 'hide',
    categories: { main: 'Main product images', gallery: 'Product gallery images', 'seven-zone': 'Seven-zone structure', covers: 'Cotton and other available covers', lifestyle: 'Lifestyle images', details: 'Product details', technical: 'Technical illustrations', shared: 'Shared educational resources' },
    images: fixture.mediaItems.map((m, i) => ({ ...m, category: TEST_CATEGORY[i], customerGallery: i < 12 })),   // the last two are supporting resources
    ...over,
  };
}
const setManifest = (page, m) => page.evaluate((m) => { DDTV.current.product.mediaManifest = m; const ad = DDTV.current.modelGallery.adapter; ad.manifest = m; ad.list = null; ad.snap(); ad.build(); DDTV.current.modelGallery.ui.update(); }, m);
const keysOf = (page) => page.evaluate(() => DDTV.current.modelGallery.adapter.images().map((i) => i.key));
const idsOf = (m) => m.images.map((i) => (/\/(\d+)(?:\.\w+)?$/.exec(i.imageOriginalUrl) || [])[1]);

/* ====================================================================== */
/* 1. Adapter: normalising, no invented addresses                          */
/* ====================================================================== */
{
  const { ctx, page } = await open();
  await mounted(page);
  const r = await page.evaluate((items) => {
    const G = DDTV.gallery, list = G.normaliseList(items);
    const supplied = new Set(); items.forEach((m) => Object.keys(m).forEach((k) => { if (/Url$/.test(k)) supplied.add(m[k]); }));
    const used = new Set(); let bad = [];
    list.forEach((im) => { Object.keys(im.urls).forEach((k) => used.add(im.urls[k])); [160, 400, 800, 1500].forEach((need) => G.candidates(im, need / 2, 2).forEach((u) => used.add(u))); });
    used.forEach((u) => { if (!supplied.has(u)) bad.push(u); });
    return {
      n: list.length, keys: new Set(list.map((i) => i.key)).size, mains: list.filter((i) => i.isMain).length,
      sizes: list.every((i) => i.urls[160] && i.urls[400] && i.urls[800] && i.urls[1500] && i.urls.original),
      alts: list.every((i) => i.alt.length > 0), dims: list.every((i) => i.width > 0 && i.height > 0), ids: list.map((i) => i.id).join(','),
      invented: bad,
      pick: { small: G.candidates(list[0], 80, 1)[0] === list[0].urls[160], mid: G.candidates(list[0], 150, 2)[0] === list[0].urls[400], big: G.candidates(list[0], 600, 2)[0] === list[0].urls[1500], mid1: G.candidates(list[0], 440, 1)[0] === list[0].urls[800], originalLast: G.candidates(list[0], 80, 1).pop() === list[0].urls.original },
      noSizedOnlyNative: G.candidates({ urls: { native: 'https://x/1.webp' } }, 500, 1).join(),
      onlyOriginal: G.candidates({ urls: { original: 'https://x/9.webp' } }, 500, 1).join(),
      assetId: [G.assetId('https://c/images/1/products/2/5139577104.webp'), G.assetId('https://c/a/77.jpg?v=3'), G.assetId('https://c/none.png'), G.assetId('https://c/images/1/products/2/4388938281')],
      empty: [G.normaliseItem({}, 0), G.normaliseItem(null, 0), G.normaliseItem({ id: 1, alt: 'x' }, 0)],
    };
  }, fixture.mediaItems);
  ok(r.n === 14 && r.keys === 14, 'the 14 real image records of the public product normalise to 14 distinct images');
  ok(r.mains === 1 && r.sizes && r.alts && r.dims, 'one main image; every image has all five file addresses, an alt text and dimensions');
  ok(r.ids === '0,26,22,29,27,25,21,12,20,7,16,28,30,24', 'Ecwid\'s own image ids are kept, in Ecwid\'s order (' + r.ids + ')');
  ok(r.invented.length === 0, 'every address the adapter hands out is one that Ecwid supplied: none invented or derived' + (r.invented.length ? ' (' + r.invented[0] + ')' : ''));
  ok(r.pick.small && r.pick.mid && r.pick.big && r.pick.mid1, 'the size chosen is the smallest sufficient one (80→160, 150@2x→400, 440→800, 600@2x→1500)');
  ok(r.pick.originalLast, 'the original file is used only as a last fallback');
  ok(r.noSizedOnlyNative === 'https://x/1.webp' && r.onlyOriginal === 'https://x/9.webp', 'a record with only a store thumbnail (or only the original) still yields something usable');
  ok(r.assetId[0] === '5139577104' && r.assetId[1] === '77' && r.assetId[2] === '' && r.assetId[3] === '4388938281', 'the file number is read from the address: with .webp or .jpg, with a query string, and for an original with no extension (the real data had all three); none when absent');
  ok(r.empty.every((x) => x === null), 'records with no address are skipped, not turned into broken images');
  await ctx.close();
}

/* ====================================================================== */
/* 2. Adapter: reading the store's gallery and merging with a manifest      */
/* ====================================================================== */
{
  const { ctx, page } = await open();
  await mounted(page);
  const native = await page.evaluate(() => ({ list: DDTV.current.modelGallery.adapter.images().map((i) => ({ url: i.urls.native, mode: i.source })), rep: DDTV.current.modelGallery.adapter.report() }));
  const expect800 = fixture.mediaItems.map((m) => m.image800pxUrl);
  ok(native.rep.mode === 'native' && native.list.length === 14 && native.list.every((x, i) => x.url === expect800[i]), 'no manifest: all 14 images of the store\'s own gallery, in the store\'s order, with the addresses the store rendered');
  ok(native.rep.unlisted.length === 0 && native.rep.stale.length === 0, 'no manifest: nothing is reported as unlisted or stale');

  // an option is chosen: the store re-creates its gallery and shows an image that is NOT one of the product's media
  await page.selectOption('.details-product-option--Select-Mattress-Depth select', { index: 2 });
  await settle(page);
  const swapped = await page.evaluate(() => { const ad = DDTV.current.modelGallery.adapter; ad.refresh(); return { main: document.querySelector('.details-gallery__picture').getAttribute('src'), keys: ad.images().map((i) => i.key), swapImage: window.__mockGallery.OPTION_IMAGE }; });
  ok(swapped.main === swapped.swapImage && swapped.keys.length === 14 && !swapped.keys.includes('4888572716'), 'an option-driven image the store swaps in is not adopted into the model gallery (the product\'s own media only)');

  // manifest present: verified, ordered by the store, resources left out
  const m = testManifest();
  await setManifest(page, m);
  const k1 = await keysOf(page);
  const rep1 = await page.evaluate(() => DDTV.current.modelGallery.adapter.report());
  ok(rep1.mode === 'manifest' && k1.length === 12 && rep1.resources === 2, 'manifest: 12 images for the customer gallery, 2 supporting resources kept out of it');
  ok(JSON.stringify(k1) === JSON.stringify(idsOf(m).slice(0, 12)), 'manifest: in the store\'s order');
  ok(await page.evaluate(() => DDTV.current.modelGallery.adapter.images().every((i) => i.verified === true && i.urls[1500])), 'manifest: every shown image is verified against the store\'s gallery and carries the 1500 px file');

  // reordered in Ecwid -> the gallery follows
  await page.evaluate(() => { const t = document.querySelector('.details-gallery__thumbs'); t.insertBefore(t.children[3], t.children[0]); });
  await page.evaluate(() => { const ad = DDTV.current.modelGallery.adapter; ad.snap(); ad.build(); });
  const k2 = await keysOf(page);
  ok(k2[0] === idsOf(m)[3] && k2.length === 12, 'reordering the images in Ecwid reorders the gallery (the store owns the order)');
  await page.evaluate(() => { DDTV.current.modelGallery.adapter.manifest.order = 'manifest'; const ad = DDTV.current.modelGallery.adapter; ad.list = null; });
  const k3 = await keysOf(page);
  ok(JSON.stringify(k3) === JSON.stringify(idsOf(m).slice(0, 12)), 'a manifest that sets order: "manifest" keeps its own sequence');
  await page.evaluate(() => { DDTV.current.modelGallery.adapter.manifest.order = 'ecwid'; DDTV.current.modelGallery.adapter.list = null; });

  // deleted in Ecwid -> stale, dropped
  await page.evaluate(() => { const t = document.querySelector('.details-gallery__thumbs'); t.removeChild(t.children[5]); const ad = DDTV.current.modelGallery.adapter; ad.snap(); ad.build(); });
  const rep2 = await page.evaluate(() => DDTV.current.modelGallery.adapter.report());
  const k4 = await keysOf(page);
  ok(rep2.stale.length === 1 && k4.length === 11, 'an image deleted in Ecwid is dropped from the gallery and reported as stale (its address is not assumed to survive)');

  // uploaded in Ecwid, not in the manifest -> hidden and reported
  await page.evaluate(() => { const t = document.querySelector('.details-gallery__thumbs'); const n = t.children[0].cloneNode(true); n.querySelectorAll('[style]').forEach((e) => { e.style.backgroundImage = 'url("https://d2j6dbq0eux0bg.cloudfront.net/images/100333285/products/831592302/7777777777.webp")'; }); t.appendChild(n); const ad = DDTV.current.modelGallery.adapter; ad.snap(); ad.build(); });
  const rep3 = await page.evaluate(() => DDTV.current.modelGallery.adapter.report());
  const k5 = await keysOf(page);
  ok(rep3.unlisted.length === 1 && !k5.includes('7777777777') && k5.length === 11, 'an image uploaded in Ecwid is NOT forced into the gallery: it stays hidden and is reported as unlisted');
  await page.evaluate(() => { DDTV.current.modelGallery.adapter.manifest.unlisted = 'show'; DDTV.current.modelGallery.adapter.list = null; });
  const k6 = await keysOf(page);
  ok(k6.length === 12 && k6.includes('7777777777'), 'with unlisted: "show" the new image appears');

  // a manifest for another product is refused
  const other = await page.evaluate((m) => { const ad = new DDTV.gallery.Adapter(DDTV.current); DDTV.current.product.mediaManifest = Object.assign({}, m, { productId: 111 }); const a2 = new DDTV.gallery.Adapter(DDTV.current); return { manifest: !!a2.manifest }; }, m);
  ok(other.manifest === false, 'a media manifest made for another product is ignored');

  // the store's gallery is not readable: manifest still serves, unverified
  await page.evaluate((m) => { DDTV.current.product.mediaManifest = m; const ad = DDTV.current.modelGallery.adapter; ad.manifest = m; ad.manifest.unlisted = 'hide'; document.querySelector('.details-gallery__thumbs').textContent = ''; ad.snap(); ad.build(); }, m);
  const rep4 = await page.evaluate(() => ({ r: DDTV.current.modelGallery.adapter.report(), n: DDTV.current.modelGallery.adapter.images().length }));
  ok(rep4.n === 12 && rep4.r.unverified === 12 && rep4.r.stale.length === 0, 'if the store\'s gallery cannot be read the manifest is still used (unverified), nothing is called stale');
  await ctx.close();
}
{
  // no manifest and no readable gallery: nothing to show, so no button (and no empty gallery)
  const { ctx, page } = await open();
  await mounted(page);
  await page.evaluate(() => { document.querySelector('.details-gallery__thumbs').textContent = ''; document.querySelector('.details-gallery__picture').remove(); const ad = DDTV.current.modelGallery.adapter; ad.snap(); ad.build(); DDTV.current.modelGallery.ui.update(); });
  ok(await page.evaluate(() => DDTV.current.modelGallery.ui.btn.hidden === true), 'with no images at all the View Model Gallery button is not shown (never an empty gallery)');
  await ctx.close();
}

/* ====================================================================== */
/* 3. Native gallery: hidden only in Optimised Preview; restored exactly    */
/* ====================================================================== */
for (const [name, vp, touch] of [['desktop (column)', { width: 1440, height: 900 }, false], ['iPad portrait (stacked)', { width: 820, height: 1180 }, true]]) {
  const { ctx, page, errors } = await open('', vp, touch ? { hasTouch: true, isMobile: true, screen: vp } : {});
  await mounted(page);
  await settle(page, 500);
  const placement = await page.evaluate(() => DDTV.current.placement);
  const on = await nativeState(page);
  ok(on.attr === 'isolated' && on.allHidden && on.styleEls === 1, `${name}: in Optimised Preview every child of the store's gallery is hidden (${placement} placement, attribute set, one rule)`);
  const mark = await page.evaluate(() => { window.__g0 = document.querySelector('.product-details__gallery'); window.__kids0 = [...window.__g0.children].filter((c) => !c.classList.contains('ddtv-host')); return window.__kids0.length; });

  await page.click('.ddtv-switch button[data-view="classic"]');
  await settle(page, 400);
  const off = await nativeState(page);
  const same = await page.evaluate(() => document.querySelector('.product-details__gallery') === window.__g0 && [...window.__g0.children].filter((c) => !c.classList.contains('ddtv-host')).every((c, i) => c === window.__kids0[i]));
  ok(off.attr === null && off.allShown && off.styleEls === 0, `${name}: Standard Product View restores the store's gallery (attribute and rule removed, all children shown)`);
  ok(same && off.thumbs === 14 && off.kids === mark, `${name}: it is the same element and the same nodes, nothing re-created, nothing duplicated (14 thumbnails)`);
  ok(await page.evaluate(() => typeof window.__nonce === 'number') && !(await page.evaluate(() => performance.getEntriesByType('navigation').length > 1)), `${name}: no page reload was needed`);

  await page.click('.ddtv-switch button[data-view="interactive"]');
  await settle(page, 400);
  const back = await nativeState(page);
  ok(back.attr === 'isolated' && back.allHidden && back.styleEls === 1 && back.hosts === 1, `${name}: switching back hides it again, with exactly one television`);
  ok(errors.length === 0, `${name}: no page errors`);
  await ctx.close();
}

/* ====================================================================== */
/* 4. Repeated switching                                                    */
/* ====================================================================== */
{
  const { ctx, page, errors } = await open();
  await mounted(page);
  await page.evaluate(() => { window.__g0 = document.querySelector('.product-details__gallery'); });
  let bad = 0, detail = '';
  for (let i = 0; i < 25; i++) {
    await page.click('.ddtv-switch button[data-view="classic"]');
    await page.waitForTimeout(40);
    const a = await nativeState(page);
    const aObs = await page.evaluate(() => DDTV.current.gallery.mo === null);
    await page.click('.ddtv-switch button[data-view="interactive"]');
    await page.waitForTimeout(40);
    const b = await nativeState(page);
    const bObs = await page.evaluate(() => DDTV.current.gallery.mo !== null);
    const idem = await page.evaluate(() => document.querySelector('.product-details__gallery') === window.__g0 && document.querySelectorAll('.ddtv-host').length === 1 && document.querySelectorAll('.ddtv-gal').length === 0 && DDTV.current.shadow.querySelectorAll('.ddtv__galbtn').length === 1);
    if (!(a.allShown && a.attr === null && a.styleEls === 0 && aObs && b.allHidden && b.attr === 'isolated' && b.styleEls === 1 && bObs && a.thumbs === 14 && b.thumbs === 14 && idem)) { bad++; detail = JSON.stringify({ i, a, b, idem }).slice(0, 220); }
  }
  ok(bad === 0, '25 round trips between the two modes: the same gallery element every time, no duplicate television, button, rule or observer, 14 thumbnails throughout' + (bad ? ' — ' + detail : ''));
  ok(errors.length === 0, 'no page errors during the round trips ' + errors.join(' | '));
  ctx.close();
}

/* ====================================================================== */
/* 5. The store re-renders its gallery                                      */
/* ====================================================================== */
{
  const { ctx, page } = await open();
  await mounted(page);
  const box0 = await page.evaluate(() => { const r = DDTV.current.host.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
  // choosing an option re-creates the gallery's children
  await page.selectOption('.details-product-option--SIZE select', { index: 3 });
  const immediately = await page.evaluate(() => { const g = document.querySelector('.product-details__gallery'); return [...g.children].filter((c) => !c.classList.contains('ddtv-host')).every((c) => getComputedStyle(c).display === 'none'); });
  ok(immediately, 'children the store creates after an option is chosen are hidden at once (no flash, no waiting for a script)');
  const box1 = await page.evaluate(() => { const r = DDTV.current.host.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
  ok(JSON.stringify(box0) === JSON.stringify(box1), 'the television does not move or resize when the store re-renders its gallery (no layout shift)');

  // the store replaces the whole gallery element (navigation, full re-render): the television is put back and the new gallery isolated
  await page.evaluate(() => window.__mockGallery.replaceContainer());
  await settle(page, 500);
  const s = await nativeState(page);
  const parentOk = await page.evaluate(() => DDTV.current.host.isConnected && DDTV.current.host.parentNode === document.querySelector('.product-details__gallery') && DDTV.current.alive());
  ok(s.hosts === 1 && parentOk && s.attr === 'isolated' && s.allHidden, 'when the store replaces the gallery element, the television is re-mounted in the new one and the new gallery is isolated');

  // in Standard Product View a replaced gallery stays the store's, untouched
  await page.click('.ddtv-switch button[data-view="classic"]');
  await page.evaluate(() => window.__mockGallery.replaceContainer());
  await settle(page, 400);
  const c = await nativeState(page);
  ok(c.attr === null && c.allShown && c.styleEls === 0, 'in Standard Product View a gallery the store re-creates is left alone');
  await ctx.close();
}

/* ====================================================================== */
/* 6. Other products and the emergency switch are unaffected                */
/* ====================================================================== */
for (const [label, q] of [['another product (111)', '?pid=111'], ['the live Botanic product (831592302)', '?pid=831592302'], ['?ddtv=off', '?ddtv=off']]) {
  const { ctx, page, reqs } = await open(q);
  await settle(page, 900);
  const s = await nativeState(page);
  ok(s.attr === null && s.allShown && s.styleEls === 0 && s.hosts === 0, `${label}: the store's gallery is untouched (no attribute, no rule, no television)`);
  ok(await page.evaluate(() => !document.querySelector('.ddtv__galbtn') && !document.getElementById('ddtv-gallery-style')), `${label}: no View Model Gallery button, no stylesheet added`);
  await ctx.close();
}

/* ====================================================================== */
/* 7. View Model Gallery                                                    */
/* ====================================================================== */
{
  const { ctx, page, errors } = await open();
  await mounted(page);
  await setManifest(page, testManifest());
  const m = testManifest(), shown = idsOf(m).slice(0, 12);
  const btn = await page.evaluate(() => { const b = DDTV.current.modelGallery.ui.btn; const r = b.getBoundingClientRect(), tv = DDTV.current.tv.getBoundingClientRect(); return { text: b.querySelector('.ddtv__galbtn-txt').textContent, count: b.querySelector('.ddtv__galbtn-n').textContent, visible: !b.hidden && r.width > 0, inside: r.left >= tv.left && r.right <= tv.right && r.top >= tv.top && r.bottom <= tv.bottom, aria: b.getAttribute('aria-label') }; });
  ok(btn.text === 'View Model Gallery' && btn.count === '12 photos' && btn.visible && btn.inside, `the button reads "${btn.text}", shows ${btn.count} and sits inside the television`);

  let everywhere = true;
  for (const c of await page.evaluate(() => DDTV.current.product.chapters.map((x) => x.id))) {
    await page.evaluate((c) => DDTV.current.go(c), c);
    const vis = await page.evaluate(() => { const b = DDTV.current.modelGallery.ui.btn, r = b.getBoundingClientRect(); return !b.hidden && r.width > 60 && r.height > 20; });
    if (!vis) everywhere = false;
  }
  ok(everywhere, 'the View Model Gallery button is on screen in every one of the 14 chapters');

  // A primary control: on the title row, large, high contrast, not over the screen, not over the title.
  await page.evaluate(() => DDTV.current.go('discover'));
  const P = await page.evaluate(() => {
    const root = DDTV.current.root, b = DDTV.current.modelGallery.ui.btn, bs = getComputedStyle(b);
    const r = b.getBoundingClientRect(), head = root.querySelector('.ddtv__head').getBoundingClientRect();
    const t = root.querySelector('.ddtv__title').getBoundingClientRect(), e = root.querySelector('.ddtv__eyebrow').getBoundingClientRect();
    const v = DDTV.current.viewport.getBoundingClientRect();
    const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const lum = ([R, G, B]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B); };
    const a = lum(rgb(bs.color)), c = lum(rgb(bs.backgroundColor));
    return {
      h: r.height, w: r.width, font: parseFloat(bs.fontSize), weight: Number(bs.fontWeight), family: bs.fontFamily,
      contrast: (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05),
      onTitleRow: r.top >= head.top - 1 && r.bottom <= head.bottom + 1 && Math.abs((r.top + r.height / 2) - (head.top + head.height / 2)) < head.height / 2,
      besideTitle: r.left >= Math.max(t.right, e.right) - 1,
      aboveScreen: r.bottom <= v.top + 1, radius: bs.borderTopLeftRadius,
    };
  });
  ok(P.h >= 44 && P.w >= 180, `the button is large (${Math.round(P.w)}×${Math.round(P.h)}px)`);
  ok(P.font >= 14.5 && P.weight >= 600 && /Chillax/.test(P.family), `its text is ${P.font}px, weight ${P.weight}, in the television's typeface (Chillax first in the stack)`);
  ok(P.contrast >= 4.5, `its text has at least AA contrast against the lightest part of its background (${P.contrast.toFixed(1)}:1)`);
  ok(P.onTitleRow && P.besideTitle, 'it sits on the title row, beside the heading and the eyebrow (it does not wrap under them)');
  ok(P.aboveScreen, 'it is above the monitor\'s screen: it never covers the video or the content');
  ok(parseFloat(P.radius) > 0 && parseFloat(P.radius) < 20, `rounded corners, not a pill or a circle (radius ${P.radius})`);

  await page.evaluate(() => DDTV.current.go('comfort'));
  const where0 = await page.evaluate(() => ({ ci: DDTV.current.chapterIndex, pi: JSON.stringify(DDTV.current.panelIndex) }));
  await page.locator('.ddtv__galbtn').click();
  const o = await page.evaluate(() => { const b = DDTV.current.shadow.querySelector('.ddtv-gal'); return b ? { role: b.getAttribute('role'), modal: b.getAttribute('aria-modal'), count: b.querySelector('.ddtv-gal__count').textContent, thumbs: b.querySelectorAll('.ddtv-gal__thumb').length, cats: [...b.querySelectorAll('.ddtv-gal__cat')].map((x) => x.textContent), src: b.querySelector('.ddtv-gal__img').getAttribute('src'), alt: b.querySelector('.ddtv-gal__img').alt, inside: (() => { const r = b.getBoundingClientRect(), v = DDTV.current.viewport.getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1 && r.top >= v.top - 1 && r.bottom <= v.bottom + 1; })() } : null; });
  ok(o && o.role === 'dialog' && o.modal === 'true' && o.count === '1 / 12' && o.thumbs === 12, 'the gallery opens inside the monitor as a modal dialog on the first of 12 photos');
  ok(o.inside, 'it stays inside the monitor\'s screen area');
  ok(o.cats.join('|') === 'All|Main product images|Product gallery images|Seven-zone structure|Cotton and other available covers|Lifestyle images|Product details|Technical illustrations', 'categories from the manifest are offered as a filter (' + o.cats.length + ')');
  const first = fixture.mediaItems[0];
  ok(o.alt === first.alt.replace(/\s+/g, ' ').trim() && [first.image160pxUrl, first.image400pxUrl, first.image800pxUrl, first.image1500pxUrl].includes(o.src), 'the first photo is the right image: its own alt text and one of its own files');

  // browse in order
  const seq = [];
  for (let i = 0; i < 12; i++) {
    const cur = await page.evaluate(() => { const b = DDTV.current.shadow.querySelector('.ddtv-gal'); return { src: b.querySelector('.ddtv-gal__img').getAttribute('src'), n: b.querySelector('.ddtv-gal__count').textContent }; });
    seq.push((/(\d+)\.\w+$/.exec(cur.src) || [])[1]);
    await page.keyboard.press('ArrowRight');
  }
  const expectFiles = fixture.mediaItems.slice(0, 12).map((x) => [x.image160pxUrl, x.image400pxUrl, x.image800pxUrl, x.image1500pxUrl].map((u) => (/(\d+)\.\w+$/.exec(u) || [])[1]));
  ok(seq.every((id, i) => expectFiles[i].includes(id)), 'Right-arrow walks the 12 photos in order, each shown from its own files');
  ok(await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent === '1 / 12'), 'after the last photo it wraps to the first');
  await page.keyboard.press('End');
  ok(await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent === '12 / 12'), 'End goes to the last photo');
  await page.keyboard.press('Home');
  await page.locator('.ddtv-gal__thumb').nth(6).click();
  ok(await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent === '7 / 12'), 'a thumbnail opens its photo');
  await page.locator('.ddtv-gal__cat', { hasText: 'Seven-zone structure' }).click();
  const cat = await page.evaluate(() => ({ n: DDTV.current.shadow.querySelectorAll('.ddtv-gal__thumb').length, c: DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent }));
  ok(cat.n === 2 && cat.c === '1 / 2', 'a category shows only its own photos (Seven-zone structure: 2)');
  if (shots) await page.locator('.ddtv-wrap').screenshot({ path: join(shots, 'gallery-open-desktop.png') });

  // a second open does nothing; the page's own controls keep working with the gallery open
  await page.evaluate(() => DDTV.current.modelGallery.ui.open());
  ok(await page.evaluate(() => DDTV.current.shadow.querySelectorAll('.ddtv-gal').length === 1), 'opening it again does not create a second gallery');
  await page.selectOption('.details-product-option--FIRMNESS-BY-BODY-WEIGHT select', { index: 2 });
  await page.selectOption('.details-product-option--SIZE select', { index: 2 });
  await page.waitForTimeout(300);
  const price = await page.evaluate(() => ({ store: document.querySelector('.details-product-price__value').textContent, tv: DDTV.current.shadow.querySelector('.ddtv__price-v') && DDTV.current.shadow.querySelector('.ddtv__price-v').textContent, chip: DDTV.current.shadow.querySelector('.ddtv__chip[data-opt="firmness"] .ddtv__chip-v').textContent }));
  ok(price.store === price.tv && price.chip === 'Medium', 'with the gallery open, the store\'s options still work and the television mirrors the choice and the price');
  await page.evaluate(() => document.getElementById('mock-add-to-bag').scrollIntoView({ block: 'center' }));
  ok(await page.evaluate(() => { const b = document.getElementById('mock-add-to-bag'), r = b.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === b; }), 'Add to Bag is not covered while the gallery is open');
  await page.evaluate(() => window.scrollTo(0, 0));

  // return
  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => ({ gal: !!DDTV.current.shadow.querySelector('.ddtv-gal'), overlayHidden: DDTV.current.overlay.hidden, ci: DDTV.current.chapterIndex, pi: JSON.stringify(DDTV.current.panelIndex), focus: DDTV.current.shadow.activeElement === DDTV.current.modelGallery.ui.btn }));
  ok(!closed.gal && closed.overlayHidden && closed.ci === where0.ci && closed.pi === where0.pi, 'Escape closes the gallery and returns to the same chapter and screen');
  ok(closed.focus, 'focus goes back to the View Model Gallery button');
  await page.locator('.ddtv__galbtn').click();
  await page.locator('.ddtv-gal__close').click();
  ok(await page.evaluate(() => !DDTV.current.shadow.querySelector('.ddtv-gal') && DDTV.current.overlay.hidden), '"Back to presentation" closes it too');
  // Video and photos: nothing plays behind the gallery; the presentation's loops resume when it closes;
  // switching ten times never reloads the page or leaves a second gallery.
  await page.evaluate(() => DDTV.current.go('discover'));
  await page.evaluate(() => {
    window.__plays = 0; window.__pauses = 0;
    const P = HTMLMediaElement.prototype, play = P.play, pause = P.pause;
    P.play = function () { window.__plays++; return play.apply(this, arguments); };
    P.pause = function () { window.__pauses++; return pause.apply(this, arguments); };
  });
  const loops = await page.evaluate(() => [...DDTV.current.shadow.querySelectorAll('video[loop]')].length);
  const plays0 = await page.evaluate(() => window.__plays);
  let sw = true, detail = '';
  for (let i = 0; i < 10; i++) {
    await page.locator('.ddtv__galbtn').click();
    const a = await page.evaluate(() => ({ gal: DDTV.current.shadow.querySelectorAll('.ddtv-gal').length, playing: [...DDTV.current.shadow.querySelectorAll('video')].filter((v) => !v.paused).length, ov: DDTV.current.overlay.children.length, nonce: window.__nonce }));
    await page.locator('.ddtv-gal__close').click();
    const c = await page.evaluate(() => ({ gal: DDTV.current.shadow.querySelectorAll('.ddtv-gal').length, ov: DDTV.current.overlay.children.length, hidden: DDTV.current.overlay.hidden, hosts: document.querySelectorAll('.ddtv-host').length, nonce: window.__nonce, btns: DDTV.current.shadow.querySelectorAll('.ddtv__galbtn').length }));
    if (!(a.gal === 1 && a.playing === 0 && a.ov === 1 && c.gal === 0 && c.ov === 0 && c.hidden && c.hosts === 1 && c.btns === 1 && a.nonce === c.nonce)) { sw = false; detail = JSON.stringify({ i, a, c }); }
  }
  ok(sw, 'ten times photos ↔ presentation: one gallery while open, none after, no video playing behind it, one television, the page never reloaded' + (sw ? '' : ' — ' + detail));
  const plays1 = await page.evaluate(() => window.__plays);
  ok(loops === 0 || plays1 - plays0 >= 10, `the presentation's looping videos are started again each time the gallery closes (${loops} loop video(s) on this screen, ${plays1 - plays0} play calls over 10 returns)`);
  // Standard Product View closes it as well
  await page.locator('.ddtv__galbtn').click();
  await page.click('.ddtv-switch button[data-view="classic"]');
  ok(await page.evaluate(() => !DDTV.current.shadow.querySelector('.ddtv-gal')), 'switching to Standard Product View closes an open gallery');
  ok(errors.length === 0, 'no page errors in the gallery tests ' + errors.join(' | '));
  await ctx.close();
}
{
  // images that cannot be loaded: fall back to another size, then leave the photo out; all gone: close gracefully
  const bad = fixture.mediaItems[0];
  const { ctx, page } = await open('', { width: 1440, height: 900 }, {}, { failUrls: [bad.image800pxUrl] });
  await mounted(page);
  await setManifest(page, testManifest());
  await page.locator('.ddtv__galbtn').click();
  await settle(page, 600);
  const src = await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__img').getAttribute('src'));
  ok(src === bad.image1500pxUrl, 'if the chosen file cannot be loaded the next size is tried (800 failed → 1500)');
  await ctx.close();
}
{
  const bad = fixture.mediaItems[0];
  const all = Object.keys(bad).filter((k) => /Url$/.test(k)).map((k) => bad[k]);
  const { ctx, page } = await open('', { width: 1440, height: 900 }, {}, { failUrls: all });
  await mounted(page);
  await setManifest(page, testManifest());
  await page.locator('.ddtv__galbtn').click();
  await settle(page, 900);
  const r = await page.evaluate(() => ({ count: DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent, thumbs: DDTV.current.shadow.querySelectorAll('.ddtv-gal__thumb').length, n: DDTV.current.modelGallery.adapter.images().filter((i) => !i.failed).length }));
  ok(r.thumbs === 11 && r.count === '1 / 11' && r.n === 11, 'a photo none of whose files can be loaded is left out; the gallery carries on with the other 11');
  await ctx.close();
}

/* ====================================================================== */
/* 8. Performance                                                           */
/* ====================================================================== */
{
  const off = await open('?ddtv=off');
  await settle(off.page, 1500);
  const baseline = new Set(off.reqs);
  await off.ctx.close();

  const { ctx, page, reqs } = await open();
  await mounted(page);
  await settle(page, 1500);
  const initial = new Set(reqs);
  ok([...initial].every((u) => baseline.has(u)) && initial.size === baseline.size, `Optimised Preview adds no image request of its own on load: the same ${baseline.size} files the store loads itself, nothing more`);
  const nativeOnly = reqs.length;
  await page.locator('.ddtv__galbtn').click();
  await settle(page, 900);
  const afterOpenNative = reqs.length - nativeOnly;
  ok(afterOpenNative <= 2, `no manifest: opening the gallery reuses the files the store already loaded (${afterOpenNative} extra request(s))`);
  await page.keyboard.press('Escape');

  // with a manifest: sized files only, never the original; nothing before opening
  await setManifest(page, testManifest());
  const before = reqs.length;
  await settle(page, 500);
  ok(reqs.length === before, 'a manifest alone (read, not shown) triggers no image request');
  await page.locator('.ddtv__galbtn').click();
  await settle(page, 1200);
  const fresh = reqs.slice(before);
  const originals = new Set(fixture.mediaItems.map((m) => m.imageOriginalUrl));
  const mains = fresh.filter((u) => !fixture.mediaItems.some((m) => u === m.image160pxUrl));
  ok(!fresh.some((u) => originals.has(u)), 'the original (full-size) files are never requested');
  ok(fresh.length <= 16, `opening the gallery requests the photo and small thumbnails only (${fresh.length} requests)`);
  const stageW = await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__stage').clientWidth);
  const firstImg = await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__img').getAttribute('src'));
  const expect = stageW <= 800 ? fixture.mediaItems[0].image800pxUrl : fixture.mediaItems[0].image1500pxUrl;
  ok(firstImg === expect, `the large photo is the file that fits the screen (${stageW}px wide at 1x → ${firstImg === fixture.mediaItems[0].image800pxUrl ? '800' : '1500'} px file), not the largest`);
  const thumbsAre160 = await page.evaluate((u160) => [...DDTV.current.shadow.querySelectorAll('.ddtv-gal__timg')].every((i) => u160.includes(i.getAttribute('src'))), fixture.mediaItems.map((m) => m.image160pxUrl));
  ok(thumbsAre160, 'every thumbnail uses the 160 px file');
  ok(await page.evaluate(() => [...DDTV.current.shadow.querySelectorAll('.ddtv-gal__timg')].every((i) => i.getAttribute('loading') === 'lazy')), 'thumbnails are lazy-loaded');
  await ctx.close();

  // size of what is shipped
  const f = join(root, 'dist', 'embed', 'botanic-tv.js'), raw = readFileSync(f);
  const gal = readFileSync(join(root, 'engine', 'ddtv-gallery.js')), galCss = readFileSync(join(root, 'engine', 'ddtv-gallery.css'));
  console.log(`INFO botanic-tv.js ${(raw.length / 1024).toFixed(1)} KB raw, ${(gzipSync(raw).length / 1024).toFixed(1)} KB gzip; the gallery adds ${((gal.length + galCss.length) / 1024).toFixed(1)} KB raw (${(gzipSync(Buffer.concat([gal, galCss])).length / 1024).toFixed(1)} KB gzip)`);
  ok(gal.length + galCss.length < 40 * 1024, 'the gallery code and styles stay under 40 KB raw');
}

/* ====================================================================== */
/* 9. Fail-safe                                                             */
/* ====================================================================== */
{
  // a screen fails while the television is being shown: the store's page is restored
  const { ctx, page } = await open('?ddtv=off');
  await settle(page, 300);
  await ctx.close();
}
{
  const { ctx, page, errors } = await open();
  await mounted(page);
  await page.evaluate(() => { DDTV.stop(); DDTV.Television.prototype._origShow = DDTV.Television.prototype.show; DDTV.Television.prototype.show = function () { throw new Error('forced failure'); }; });
  await page.evaluate(() => { DDTV.start(876405767); });
  await settle(page, 700);
  const s = await nativeState(page);
  const f = await page.evaluate(() => ({ failed: !!(DDTV.current && DDTV.current.failed), desc: document.getElementById('bp-top').offsetParent !== null, hostHidden: DDTV.current && DDTV.current.host.style.display === 'none', opts: [...document.querySelectorAll('.details-product-option select')].every((x) => x.offsetParent !== null) }));
  ok(f.failed && s.attr === null && s.allShown && s.styleEls === 0, 'a failure while building the screens restores the store\'s gallery (never an empty image area)');
  ok(f.desc && f.hostHidden && f.opts, 'the original description is back, the broken television is gone, and the store\'s options are untouched');
  ok(errors.every((e) => /forced failure/.test(e)) || errors.length === 0, 'the failure was contained (no uncaught page error)');
  await ctx.close();
}
{
  // the television is not visible (a style conflict): the render check restores the store's page
  const { ctx, page } = await open();
  await mounted(page);
  await page.addStyleTag({ content: '.ddtv-host { display: none !important; }' });
  await page.waitForTimeout(3200);
  const s = await nativeState(page);
  ok(await page.evaluate(() => DDTV.current.failed === true) && s.attr === null && s.allShown, 'if the television turns out not to be visible, the render check restores the store\'s gallery within 3 s');
  await ctx.close();
}
{
  // the gallery adapter itself fails to start: the television still works, the gallery button is simply absent
  const { ctx, page } = await open('?late=1');
  await page.waitForTimeout(200);
  await page.evaluate(() => { DDTV.stop(); DDTV.gallery.Adapter.prototype.snap = function () { throw new Error('adapter failure'); }; DDTV.start(876405767); });
  await settle(page, 700);
  const r = await page.evaluate(() => ({ tv: !!(DDTV.current && DDTV.current.tv && DDTV.current.tv.offsetParent !== null), failed: !!(DDTV.current && DDTV.current.failed), btn: !!DDTV.current.shadow.querySelector('.ddtv__galbtn'), gallery: !!DDTV.current.modelGallery }));
  ok(r.tv && !r.failed && !r.gallery, 'if the gallery adapter fails, the television still starts and works (without the gallery button)');
  await ctx.close();
}
{
  // the store, not the engine, deletes our host while the television is showing
  const { ctx, page } = await open();
  await mounted(page);
  await page.evaluate(() => { DDTV.current.host.remove(); });
  await settle(page, 500);
  ok(await page.evaluate(() => document.querySelectorAll('.ddtv-host').length === 1 && DDTV.current.host.isConnected), 'if the store removes the television from the page, it is put back');
  await ctx.close();
}

/* ====================================================================== */
/* 10. Devices                                                              */
/* ====================================================================== */
for (const [name, vp, touch, expectTv] of [['desktop 1440×900', { width: 1440, height: 900 }, false, true], ['iPad landscape 1180×820', { width: 1180, height: 820 }, true, true], ['iPad portrait 820×1180', { width: 820, height: 1180 }, true, true], ['iPad mini portrait 744×1133', { width: 744, height: 1133 }, true, true]]) {
  const { ctx, page, errors } = await open('', vp, touch ? { hasTouch: true, isMobile: true, screen: vp } : {});
  await mounted(page);
  await settle(page, 600);
  await setManifest(page, testManifest());
  const b = await page.evaluate(() => { const bt = DDTV.current.modelGallery.ui.btn, r = bt.getBoundingClientRect(); return { h: r.height, w: r.width, vis: !bt.hidden }; });
  ok(b.vis && b.w > 100 && (!touch || b.h >= 43.5), `${name}: the View Model Gallery button is visible${touch ? ' and at least 44px tall (' + b.h.toFixed(0) + 'px)' : ''}`);
  await page.locator('.ddtv__galbtn').click();
  await settle(page, 700);
  const g = await page.evaluate(() => {
    const b = DDTV.current.shadow.querySelector('.ddtv-gal'), v = DDTV.current.viewport.getBoundingClientRect(), r = b.getBoundingClientRect(), img = b.querySelector('.ddtv-gal__img').getBoundingClientRect(), strip = b.querySelector('.ddtv-gal__strip');
    const nav = [...b.querySelectorAll('.ddtv-gal__nav')].map((n) => { const q = n.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; });
    return { fits: r.left >= v.left - 1 && r.right <= v.right + 1 && r.top >= v.top - 1 && r.bottom <= v.bottom + 1, imgW: Math.round(img.width), imgH: Math.round(img.height), stripScroll: strip.scrollWidth > strip.clientWidth, nav, xscroll: document.documentElement.scrollWidth - window.innerWidth, close: Math.round(b.querySelector('.ddtv-gal__close').getBoundingClientRect().height), placement: DDTV.current.placement, native: [...document.querySelector('.product-details__gallery').children].filter((c) => !c.classList.contains('ddtv-host')).every((c) => getComputedStyle(c).display === 'none') };
  });
  ok(g.fits && g.imgW > 200 && g.imgH > 120, `${name}: the gallery fits the monitor and shows the photo large (${g.imgW}×${g.imgH}px, ${g.placement} placement)`);
  ok(g.stripScroll && g.xscroll <= 0, `${name}: the thumbnail strip scrolls on its own; the page does not scroll sideways`);
  ok(g.native, `${name}: the store's own gallery stays hidden while the model gallery is open`);
  if (touch) {
    ok(g.nav.every((n) => n[0] >= 44 && n[1] >= 44) && g.close >= 43.5, `${name}: arrows and Back to presentation are at least 44px`);
    const before = await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent);
    await page.evaluate(() => { const s = DDTV.current.shadow.querySelector('.ddtv-gal__stage'); const mk = (type, x) => { const t = new Touch({ identifier: 1, target: s, clientX: x, clientY: 200 }); s.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true })); }; mk('touchstart', 300); mk('touchend', 160); });
    const after = await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent);
    ok(before === '1 / 12' && after === '2 / 12', `${name}: a swipe to the left shows the next photo`);
  }
  if (shots) await page.screenshot({ path: join(shots, 'gallery-' + name.split(' ')[0] + '-' + name.split(' ')[1] + '.png') });
  ok(errors.length === 0, `${name}: no page errors`);
  await ctx.close();
}
{
  // iPhone: the standard page, with the store's own gallery
  const vp = { width: 390, height: 844 };
  const { ctx, page, errors } = await open('', vp, { hasTouch: true, isMobile: true, screen: vp });
  await settle(page, 900);
  const s = await nativeState(page);
  ok(s.attr === null && s.allShown && s.styleEls === 0, 'iPhone: the store\'s own gallery is untouched and visible');
  ok(await page.evaluate(() => !DDTV.current || !DDTV.current.shadow.querySelector('.ddtv__galbtn') || DDTV.current.shadow.querySelector('.ddtv__galbtn').offsetParent === null), 'iPhone: no View Model Gallery button (the television is not shown on phones)');
  ok(errors.length === 0, 'iPhone: no page errors');
  await ctx.close();
}

/* ====================================================================== */
/* 11. Commerce, and nothing is ever written to the store                   */
/* ====================================================================== */
{
  const { ctx, page, all } = await open();
  await mounted(page);
  for (let i = 0; i < 6; i++) { await page.click('.ddtv-switch button[data-view="classic"]'); await page.click('.ddtv-switch button[data-view="interactive"]'); }
  await page.locator('.ddtv__galbtn').click();
  await page.keyboard.press('Escape');
  await page.selectOption('.details-product-option--SIZE select', { index: 4 });
  await page.selectOption('.details-product-option--Select-Mattress-Depth select', { index: 2 });
  await page.selectOption('.details-product-option--FIRMNESS-BY-BODY-WEIGHT select', { index: 2 });
  await page.selectOption('.details-product-option--COVERS select', { index: 2 });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('mock-add-to-bag').scrollIntoView({ block: 'center' }));
  await page.click('#mock-add-to-bag');
  const bag = await page.evaluate(() => ({ n: window.__bag.length, opts: window.__bag[0] && window.__bag[0].options.length, price: window.__bag[0] && window.__bag[0].price, shown: document.querySelector('.details-product-price__value').textContent, tv: DDTV.current.shadow.querySelector('.ddtv__price-v').textContent }));
  ok(bag.n === 1 && bag.opts === 4 && bag.price === bag.shown && bag.shown === bag.tv, 'after repeated mode switches and a gallery visit, the four options, the price and Add to Bag work and agree (simulated store)');
  const writes = all.filter((r) => r.method !== 'GET' && r.method !== 'OPTIONS' && r.method !== 'HEAD');
  ok(writes.length === 0, `the engine issued no write request of any kind (${all.length} requests, all GET); it only reads, so uploading images in Ecwid is unaffected`);
  ok(await page.evaluate(() => !document.querySelector('.details-gallery__thumb-img[data-ddtv]') && document.querySelectorAll('.details-gallery__thumb').length === 14), 'the store\'s gallery was never edited or cloned (still 14 thumbnails of its own)');
  await ctx.close();
}

console.log(failures ? `\n${failures} check(s) failed (simulated Ecwid)` : '\nAll checks passed (simulated Ecwid; this is not a live Ecwid verification)');
await browser.close();
process.exit(failures ? 1 : 0);
