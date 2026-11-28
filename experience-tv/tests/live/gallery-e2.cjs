// READ-ONLY. The gallery integration against the REAL Ecwid storefront (E2): the real gallery markup, the real
// re-rendering, the real images, the real page-load events. Public live product 831592302, local browser,
// nothing saved, Add to Bag never clicked.
//
// 831592302 is added to productIds ONLY in the injected copy of the embed; the shipped build lists 876405767 alone.
// This is NOT the test product, so it says nothing about 876405767 (E3) or about Safari (E4).
//
//   node tools/build-embed.mjs && NODE_PATH=$(npm root -g) node tests/live/gallery-e2.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const EMBED = fs.readFileSync(path.join(ROOT, 'dist', 'embed', 'botanic-tv.js'), 'utf8').replace('productIds: [876405767]', 'productIds: [876405767, 831592302]');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'live-media-831592302.json'), 'utf8'));
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
let failures = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failures++; };
console.log('NOTE: real Ecwid DOM and runtime of the PUBLIC live product, local injection, read-only. Not the test product, not Safari.\n');

const TEST_CATEGORY = ['main', 'gallery', 'gallery', 'gallery', 'gallery', 'seven-zone', 'seven-zone', 'covers', 'covers', 'lifestyle', 'details', 'technical', 'shared', 'shared'];
const manifest = () => ({ version: 1, productId: 831592302, order: 'ecwid', unlisted: 'hide', categories: { main: 'Main product images', gallery: 'Product gallery images', 'seven-zone': 'Seven-zone structure', covers: 'Cotton and other available covers', lifestyle: 'Lifestyle images', details: 'Product details', technical: 'Technical illustrations', shared: 'Shared educational resources' }, images: fixture.mediaItems.map((m, i) => Object.assign({}, m, { category: TEST_CATEGORY[i], customerGallery: i < 12 })) });

async function session(viewport, extra) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext(Object.assign({ viewport, deviceScaleFactor: 1 }, extra || {}));
  const p = await ctx.newPage();
  const img = [], sizes = {}, writes = [], errors = [];
  p.on('request', (r) => { const u = r.url(); if (r.method() !== 'GET' && /ecwid|divinedunlop/.test(u) && !/storefront\/api|stats|beacon|analytics|collect|log/i.test(u)) writes.push(r.method() + ' ' + u.slice(0, 90)); if (/d2j6dbq0eux0bg\.cloudfront\.net\/images\//.test(u)) img.push({ u, t: Date.now() }); });
  p.on('response', (r) => { const u = r.url(); if (/d2j6dbq0eux0bg\.cloudfront\.net\/images\//.test(u)) sizes[u] = Number(r.headers()['content-length'] || 0); });
  p.on('pageerror', (e) => errors.push(e.message));
  for (let attempt = 1; ; attempt++) {                     // the public store is reached over a shared proxy: retry a slow load
    try { await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForSelector('.details-gallery__thumbs', { timeout: 60000 }); break; }
    catch (e) { if (attempt >= 3) throw e; console.log('INFO page load attempt ' + attempt + ' failed (' + e.message.split('\n')[0].slice(0, 80) + '), retrying'); }
  }
  await p.waitForTimeout(3500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) { /* no banner */ }
  return { b, ctx, p, img, sizes, writes, errors };
}
// The real gallery has children that are display:none by the store's own design (for instance its touch scroller on a
// wide screen), so "shown" is judged by the real thumbnails having a real height, and "untouched" by the children's
// display values being exactly what they were before the television was injected (`kids`).
const native = (p) => p.evaluate(() => { const g = document.querySelector('.product-details__gallery'); const kids = g ? [...g.children].filter((c) => !c.classList.contains('ddtv-host')) : []; const disp = {}; kids.forEach((c) => { disp[c.className] = getComputedStyle(c).display; }); const th = g && g.querySelector('.details-gallery__thumb'); const r = th ? th.getBoundingClientRect() : null; return { attr: g && g.getAttribute('data-ddtv-gallery'), allHidden: kids.length > 0 && kids.every((c) => getComputedStyle(c).display === 'none'), allShown: !!r && r.height > 20 && kids.some((c) => getComputedStyle(c).display !== 'none'), kids: JSON.stringify(disp), thumbs: g ? g.querySelectorAll('.details-gallery__thumb').length : 0, thumbH: r ? r.height : 0, hosts: document.querySelectorAll('.ddtv-host').length, style: document.querySelectorAll('#ddtv-gallery-style').length, main: g && g.querySelector('.details-gallery__picture') ? g.querySelector('.details-gallery__picture').getAttribute('src').split('/').pop() : null }; });
const mounted = (p) => p.waitForFunction(() => document.querySelectorAll('.ddtv-host').length === 1 && window.DDTV && DDTV.current && DDTV.current.modelGallery, null, { timeout: 20000 }).then(() => true, () => false);
// Thumbnail boxes and the main picture's box, separately: the store changes its main picture itself when options are chosen.
const layoutOf = (p) => p.evaluate(() => { const g = document.querySelector('.product-details__gallery'); const box = (sel) => JSON.stringify([...g.querySelectorAll(sel)].slice(0, 20).map((n) => { const r = n.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })); return { thumbs: box('.details-gallery__thumb'), picture: box('.details-gallery__picture') }; });

(async () => {
  /* ---- 1. desktop: adapter on the real markup, isolation, restore, real re-rendering ---- */
  {
    const s = await session({ width: 1440, height: 900 });
    const { p } = s;
    const before = await native(p);
    const boxes0 = await layoutOf(p);
    ok(before.thumbs === 14 && before.allShown && before.attr === null, 'the real store gallery before anything: 14 thumbnails with real height (' + Math.round(before.thumbH) + 'px), children ' + before.kids);
    await p.addScriptTag({ content: EMBED });
    ok(await mounted(p), 'the television mounted on the real page (late injection)');
    await p.waitForTimeout(1500);
    const A = await p.evaluate(() => { const ad = DDTV.current.modelGallery.adapter; return { rep: ad.report(), urls: ad.images().map((i) => i.urls.native), btn: DDTV.current.modelGallery.ui.btn.textContent }; });
    const sizesOf = (m) => [m.image160pxUrl, m.image400pxUrl, m.image800pxUrl, m.image1500pxUrl, m.imageOriginalUrl];
    const wrong = A.urls.map((u, i) => (fixture.mediaItems[i] && sizesOf(fixture.mediaItems[i]).includes(u) ? null : i)).filter((i) => i !== null);
    console.log('INFO adapter addresses that are not one of the store\'s own five files for the same position: ' + (wrong.length ? wrong.join(',') : 'none') + '; sizes read: ' + A.urls.map((u, i) => sizesOf(fixture.mediaItems[i] || {}).indexOf(u)).join(','));
    ok(A.rep.mode === 'native' && A.urls.length === 14 && wrong.length === 0, 'the adapter read the real gallery: 14 images, in the store\'s order, each address one of the store\'s own files for that image (no manifest)');
    ok(/View Model Gallery/.test(A.btn) && /14 photos/.test(A.btn), 'the button reads "' + A.btn + '"');

    const on = await native(p);
    ok(on.attr === 'isolated' && on.allHidden && on.style === 1, 'the real gallery is isolated while the television shows (every child hidden)');
    const iso = await p.evaluate(() => { const g = document.querySelector('.product-details__gallery'); return { sameStyleAsBefore: true, productId: document.querySelector('[class*="ProductPage-"]').className.match(/ProductPage-(\d+)/)[1] }; });

    // the real store re-renders its gallery when options are chosen
    const mainBefore = on.main;
    const sels = p.locator('.details-product-option select');
    for (let i = 0; i < 4; i++) { await sels.nth(i).selectOption({ index: 2 }); await p.waitForTimeout(250); }
    await p.waitForTimeout(1500);
    const afterOpt = await native(p);
    ok(afterOpt.main !== mainBefore, 'the real store did re-create its gallery after the options were chosen (its main image changed: ' + mainBefore + ' → ' + afterOpt.main + ')');
    ok(afterOpt.allHidden && afterOpt.attr === 'isolated' && afterOpt.hosts === 1, 'the new nodes the store created are hidden, the television is still there (one)');
    const keysAfter = await p.evaluate(() => { const ad = DDTV.current.modelGallery.adapter; ad.refresh(); return ad.images().length; });
    ok(keysAfter === 14, 'the model gallery still lists the product\'s own 14 images (the option-driven image is not adopted)');

    // 25 round trips between the modes on the real page
    let bad = 0, detail = '';
    for (let i = 0; i < 25; i++) {
      await p.click('.ddtv-switch button[data-view="classic"]'); await p.waitForTimeout(60);
      const a = await native(p);
      await p.click('.ddtv-switch button[data-view="interactive"]'); await p.waitForTimeout(60);
      const c = await native(p);
      if (!(a.allShown && a.attr === null && a.style === 0 && a.thumbs === 14 && a.kids === before.kids && c.allHidden && c.attr === 'isolated' && c.style === 1 && c.hosts === 1)) { bad++; detail = JSON.stringify({ i, a, c }).slice(0, 300); }
    }
    ok(bad === 0, '25 round trips on the real page: the real gallery is shown (children exactly as before) and hidden every time, one television, no duplicates' + (bad ? ' — ' + detail : ''));
    await p.click('.ddtv-switch button[data-view="classic"]');
    await p.waitForTimeout(500);
    const std = await native(p);
    ok(std.allShown && std.thumbs === 14 && std.thumbH > 20 && std.kids === before.kids && std.attr === null, 'Standard Product View: the real gallery is back, 14 thumbnails with real height (' + Math.round(std.thumbH) + 'px), children as before');
    const boxes1 = await layoutOf(p);
    ok(boxes1.thumbs === boxes0.thumbs, 'Standard Product View: the 14 thumbnail boxes are exactly the size they were before the television existed');
    console.log('INFO main picture box before ' + boxes0.picture + ' / after ' + boxes1.picture + (boxes1.picture === boxes0.picture ? ' (identical)' : ' (differs: the store itself swapped its main image when the options were chosen, so a different photo has a different shape)'));
    await p.click('.ddtv-switch button[data-view="interactive"]');

    // real navigation: category and back
    await p.evaluate(() => Ecwid.openPage('category', { id: 0 }));
    await p.waitForTimeout(4000);
    const away = await p.evaluate(() => ({ hosts: document.querySelectorAll('.ddtv-host').length, attr: document.querySelectorAll('[data-ddtv-gallery]').length, style: document.querySelectorAll('#ddtv-gallery-style').length }));
    ok(away.hosts === 0 && away.attr === 0 && away.style === 0, 'leaving the product page through Ecwid: television, attribute and rule are gone (nothing is left behind on other pages)');
    await p.goBack({ timeout: 30000 }).catch(() => {});
    await p.waitForSelector('.details-gallery__thumbs', { timeout: 20000 }).catch(() => {});
    ok(await mounted(p), 'coming back: one television again (new gallery element, new adapter)');
    await p.waitForTimeout(1500);
    const back = await native(p);
    ok(back.attr === 'isolated' && back.allHidden && back.hosts === 1 && back.thumbs === 14, 'coming back: the new real gallery is isolated, 14 thumbnails, one television');

    // gallery open on the real page: reuse of what the store loaded; options keep working
    const imgBefore = s.img.length;
    await p.locator('.ddtv__galbtn').click();
    await p.waitForTimeout(2500);
    const opened = await p.evaluate(() => { const b = DDTV.current.shadow.querySelector('.ddtv-gal'); return b ? { count: b.querySelector('.ddtv-gal__count').textContent, src: b.querySelector('.ddtv-gal__img').getAttribute('src'), nat: b.querySelector('.ddtv-gal__img').naturalWidth, thumbs: b.querySelectorAll('.ddtv-gal__thumb').length } : null; });
    ok(opened && opened.count === '1 / 14' && opened.thumbs === 14 && opened.nat > 100, 'the model gallery opened on the real page showing real photo 1 of 14 (' + (opened && opened.nat) + 'px wide file)');
    ok(opened && opened.src === fixture.mediaItems[0].image800pxUrl, 'the photo is the store\'s own file for that image (the 800 px address the store rendered)');
    const extra = s.img.slice(imgBefore).map((x) => x.u);
    const extraBytes = extra.reduce((n, u) => n + (s.sizes[u] || 0), 0);
    console.log('INFO opening the gallery (no manifest): ' + extra.length + ' new image request(s), ' + Math.round(extraBytes / 1024) + ' KB');
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    ok(await p.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent === '3 / 14'), 'arrow keys browse the real photos');
    // the real store's options still work with the gallery open; Add to Bag is present and reachable (not clicked)
    // (coming back from the category page reset the store's options, so choose all four again)
    for (let i = 0; i < 4; i++) { await p.locator('.details-product-option select').nth(i).selectOption({ index: 2 }); await p.waitForTimeout(400); }
    await p.waitForTimeout(1500);
    const price = await p.evaluate(() => ({ store: document.querySelector('.details-product-price__value').textContent, tv: DDTV.current.shadow.querySelector('.ddtv__price-v') && DDTV.current.shadow.querySelector('.ddtv__price-v').textContent, gallery: !!DDTV.current.shadow.querySelector('.ddtv-gal') }));
    ok(price.gallery && price.store === price.tv && price.store !== '£0', 'with the gallery open the real options still work and the real price is mirrored (' + price.store + ')');
    const bag = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /add to bag/i.test(x.textContent)); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { present: !!b, enabled: !b.disabled, reachable: top === b || b.contains(top) }; });
    ok(bag.present && bag.enabled && bag.reachable, 'the real Add to Bag button is present, enabled and not covered (not clicked)');
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.keyboard.press('Escape');
    ok(await p.evaluate(() => !DDTV.current.shadow.querySelector('.ddtv-gal') && DDTV.current.overlay.hidden), 'Escape returns to the presentation');
    ok(s.writes.length === 0, 'no write request to the store was made by the page while this ran' + (s.writes.length ? ' (' + s.writes.join(' ; ') + ')' : ''));

    ok(s.errors.every((e) => /Uncaught \(in promise\)|Timeout exceeded/.test(e)), 'no page error beyond the two the store itself logs (seen with no injection at all)' + (s.errors.length ? ' [' + s.errors.join(' ; ').slice(0, 200) + ']' : ''));
    await s.b.close();
  }

  /* ---- 1b. desktop with a manifest present at start (as it would ship): verified against the real gallery ---- */
  {
    const WITH = EMBED.replace('global.DDTV_PRODUCTS.botanic.mediaManifest = null;', 'global.DDTV_PRODUCTS.botanic.mediaManifest = ' + JSON.stringify(manifest()) + ';');
    ok(WITH !== EMBED, 'the injected copy carries the manifest (the shipped build still has none)');
    const s = await session({ width: 1440, height: 900 });
    const { p } = s;
    await p.addScriptTag({ content: WITH });
    ok(await mounted(p), 'manifest mode: the television mounted');
    await p.waitForTimeout(1500);
    const M = await p.evaluate(() => { const ad = DDTV.current.modelGallery.adapter, imgs = ad.images(); return { n: imgs.length, verified: imgs.every((i) => i.verified === true), rep: ad.report(), sizes: imgs.every((i) => i.urls[160] && i.urls[800] && i.urls[1500]), first: imgs[0].urls[800], cats: imgs.map((i) => i.category).filter((c, i, a) => a.indexOf(c) === i), btn: DDTV.current.modelGallery.ui.btn.textContent }; });
    ok(M.rep.mode === 'manifest' && M.n === 12 && M.verified && M.rep.stale.length === 0 && M.rep.unlisted.length === 0 && M.rep.resources === 2 && M.sizes, 'manifest mode on the real data: 12 customer images, all verified against the real gallery, 2 resources kept out, nothing stale or unlisted (' + JSON.stringify(M.rep) + ')');
    ok(M.first === fixture.mediaItems[0].image800pxUrl, 'the first image is the store\'s first image (store order)');
    console.log('INFO button "' + M.btn + '", categories ' + M.cats.join(', '));
    const imgBefore = s.img.length;
    await p.locator('.ddtv__galbtn').click();
    await p.waitForTimeout(3000);
    const fresh = s.img.slice(imgBefore).map((x) => x.u);
    const originals = new Set(fixture.mediaItems.map((m) => m.imageOriginalUrl));
    const stageW = await p.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__stage').clientWidth);
    const shownSrc = await p.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__img').getAttribute('src'));
    const bytes = fresh.reduce((n, u) => n + (s.sizes[u] || 0), 0);
    console.log('INFO manifest mode, opening the gallery: ' + fresh.length + ' new image request(s), ' + Math.round(bytes / 1024) + ' KB; stage ' + stageW + 'px; large photo ' + shownSrc.split('/').pop());
    ok(!fresh.some((u) => originals.has(u)) && !s.img.some((x) => originals.has(x.u)), 'the original (full-size) files are never requested');
    ok(shownSrc === (stageW <= 800 ? fixture.mediaItems[0].image800pxUrl : fixture.mediaItems[0].image1500pxUrl), 'the large photo is the size that fits the screen (' + stageW + 'px stage)');
    const real = await p.evaluate(() => { const i = DDTV.current.shadow.querySelector('.ddtv-gal__img'); return { w: i.naturalWidth, h: i.naturalHeight, complete: i.complete, count: DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent, chips: DDTV.current.shadow.querySelectorAll('.ddtv-gal__cat').length }; });
    ok(real.complete && real.w >= 700 && real.count === '1 / 12', 'the real photo loaded from the store\'s CDN (' + real.w + '×' + real.h + '), counted "' + real.count + '"');
    ok(real.chips >= 2, 'category chips are shown (' + real.chips + ') because the manifest has more than one category');
    // a category narrows the gallery to its images
    await p.evaluate(() => { const chips = [...DDTV.current.shadow.querySelectorAll('.ddtv-gal__cat')]; chips[chips.length - 1].click(); });
    await p.waitForTimeout(300);
    const narrowed = await p.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent);
    ok(/^1 \/ \d+$/.test(narrowed) && narrowed !== '1 / 12', 'choosing a category narrows the gallery (' + narrowed + ')');
    await p.keyboard.press('Escape');
    ok(s.writes.length === 0, 'no write request to the store was made by the page while this ran');
    await s.b.close();
  }

  /* ---- 2. iPad portrait and landscape on the real page ---- */
  for (const [name, vp] of [['iPad portrait 820×1180', { width: 820, height: 1180 }], ['iPad landscape 1180×820', { width: 1180, height: 820 }]]) {
    const s = await session(vp, { hasTouch: true, isMobile: true });
    const { p } = s;
    const base = await native(p);
    await p.addScriptTag({ content: EMBED });
    await mounted(p);
    await p.waitForTimeout(1500);
    const st = await native(p);
    const placement = await p.evaluate(() => DDTV.current.placement);
    ok(st.attr === 'isolated' && st.allHidden, name + ': the real gallery is isolated in the ' + placement + ' placement');
    await p.locator('.ddtv__galbtn').click();
    await p.waitForTimeout(2000);
    const g = await p.evaluate(() => { const b = DDTV.current.shadow.querySelector('.ddtv-gal'), v = DDTV.current.viewport.getBoundingClientRect(), r = b.getBoundingClientRect(), i = b.querySelector('.ddtv-gal__img').getBoundingClientRect(), btn = DDTV.current.modelGallery.ui.btn.getBoundingClientRect(); return { fits: r.left >= v.left - 1 && r.right <= v.right + 1 && r.top >= v.top - 1 && r.bottom <= v.bottom + 1, w: Math.round(i.width), h: Math.round(i.height), btn: Math.round(btn.height), xs: document.documentElement.scrollWidth - innerWidth }; });
    ok(g.fits && g.w > 250 && g.h > 150 && g.btn >= 44 && g.xs <= 0, name + ': the gallery fits the monitor (' + g.w + '×' + g.h + 'px photo), the button is ' + g.btn + 'px tall, no sideways scroll');
    await p.keyboard.press('Escape');
    await p.click('.ddtv-switch button[data-view="classic"]');
    await p.waitForTimeout(500);
    const std = await native(p);
    ok(std.allShown && std.thumbs === 14 && std.attr === null && std.kids === base.kids, name + ': Standard Product View gives the real gallery back (children exactly as before, thumbnails ' + Math.round(std.thumbH) + 'px)');
    await s.b.close();
  }

  /* ---- 3. iPhone: the standard page with the store's own gallery ---- */
  {
    const vp = { width: 390, height: 844 };
    const s = await session(vp, { hasTouch: true, isMobile: true, screen: vp });
    const { p } = s;
    const base = await native(p);
    await p.addScriptTag({ content: EMBED });
    await p.waitForTimeout(3000);
    const st = await native(p);
    const tv = await p.evaluate(() => ({ visible: !!(window.DDTV && DDTV.current && DDTV.current.tv && DDTV.current.tv.offsetParent !== null), btn: !!(window.DDTV && DDTV.current && DDTV.current.modelGallery && DDTV.current.modelGallery.ui.btn.offsetParent !== null) }));
    ok(st.attr === null && st.kids === base.kids && st.thumbs === 14 && st.style === 0 && !tv.visible && !tv.btn, 'iPhone (390×844): no television, no gallery button, no rule, the real store gallery untouched (children exactly as before: ' + st.kids + ')');
    await s.b.close();
  }

  console.log(failures ? `\n${failures} check(s) failed (real Ecwid DOM, public product)` : '\nAll checks passed (real Ecwid DOM of the public product; the test product and real devices are not covered)');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERR', e.message); process.exit(2); });
