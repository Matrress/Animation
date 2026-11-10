// READ-ONLY. The consolidated requirements on the REAL Ecwid storefront (E2): the storefront image source, complete
// restoration of Standard Product View (the store's own gallery, its zoom/lightbox, its options and price), 10+ mode
// cycles with listener/node counts, the stacked iPad-portrait layout compared with the store's own rectangles, and
// video playback in the real browser media engine.
//
// Public live product 831592302, local browser, nothing saved, Add to Bag never clicked. 831592302 is added to
// productIds ONLY in the injected copy of the embed. This is NOT the test product (E3) and NOT Safari (E4).
// The production media host (media.divinedunlop.com) is not reachable from this environment: a SYNTHETIC H.264 MP4
// answers it locally. The browser really decodes and plays that file, but it is not the production media.
//
//   node tools/build-embed.mjs && NODE_PATH=$(npm root -g) node tests/live/restore-e2.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const EMBED = fs.readFileSync(path.join(ROOT, 'dist', 'embed', 'botanic-tv.js'), 'utf8').replace('productIds: [876405767]', 'productIds: [876405767, 831592302]');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
let failures = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failures++; };
console.log('NOTE: real Ecwid DOM and runtime of the PUBLIC live product, local injection, read-only. Not the test product, not Safari; media is synthetic.\n');

let VIDEO = null;
try {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ddtv-e2-video-'));
  VIDEO = path.join(d, 'loop.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=480x270:rate=24', '-t', '8', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', VIDEO], { stdio: 'ignore' });
} catch (e) { VIDEO = null; }

async function session(viewport, extra) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext(Object.assign({ viewport, deviceScaleFactor: 1 }, extra || {}));
  if (VIDEO) await ctx.route(/^https:\/\/media\.divinedunlop\.com\//, (r) => r.fulfill({ status: 200, contentType: 'video/mp4', body: fs.readFileSync(VIDEO) }));
  const p = await ctx.newPage();
  const sfPosts = [], writes = [], errors = [], own = { body: null };
  p.on('request', (r) => {
    const u = r.url();
    if (r.method() === 'POST' && /\/storefront\/api\/v1\/\d+\/catalog\/product(\?|$)/.test(u)) sfPosts.push({ body: r.postData(), t: Date.now(), req: r });
    if (r.method() !== 'GET' && r.method() !== 'OPTIONS' && r.method() !== 'HEAD' && /ecwid|divinedunlop/.test(u) && !/storefront\/api|stats|beacon|analytics|collect|log/i.test(u)) writes.push(r.method() + ' ' + u.slice(0, 90));
  });
  p.on('response', async (r) => { if (!own.body && r.request().method() === 'POST' && /\/catalog\/product(\?|$)/.test(r.url().split('?')[0])) { try { own.body = JSON.parse(await r.text()); } catch (e) { /* ignore */ } } });
  p.on('pageerror', (e) => errors.push(e.message));
  for (let attempt = 1; ; attempt++) {
    try { await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForSelector('.details-gallery__thumbs', { timeout: 60000 }); break; }
    catch (e) { if (attempt >= 3) throw e; console.log('INFO page load attempt ' + attempt + ' failed, retrying'); }
  }
  await p.waitForTimeout(3500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) { /* no banner */ }
  const cdp = await ctx.newCDPSession(p);
  return { b, ctx, p, cdp, sfPosts, writes, errors, own };
}
const baseline = (p) => p.evaluate(() => {
  const g = document.querySelector('.product-details__gallery'), rect = (s) => { const n = document.querySelector(s); if (!n) return null; const r = n.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; };
  const kids = {}; [...g.children].filter((c) => !c.classList.contains('ddtv-host')).forEach((c) => { kids[c.className] = getComputedStyle(c).display; });
  const th = g.querySelector('.details-gallery__thumb');
  return { kids: JSON.stringify(kids), thumbs: g.querySelectorAll('.details-gallery__thumb').length, thumbH: th ? Math.round(th.getBoundingClientRect().height) : 0, sidebar: rect('.product-details__sidebar'), desc: rect('.product-details__description'), block: rect('.product-details') };
});
const state = (p) => p.evaluate(() => {
  const g = document.querySelector('.product-details__gallery'), T = window.DDTV && DDTV.current;
  const kids = {}; [...g.children].filter((c) => !c.classList.contains('ddtv-host')).forEach((c) => { kids[c.className] = getComputedStyle(c).display; });
  const kv = Object.values(kids), th = g.querySelector('.details-gallery__thumb');
  const tvr = T && T.tv ? T.tv.getBoundingClientRect() : { width: 0, height: 0 };
  const rect = (s) => { const n = document.querySelector(s); if (!n) return null; const r = n.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; };
  return {
    attr: g.getAttribute('data-ddtv-gallery'), stack: document.querySelectorAll('[data-ddtv-stacked]').length, kids: JSON.stringify(kids), allHidden: kv.length > 0 && kv.every((d) => d === 'none'),
    thumbs: g.querySelectorAll('.details-gallery__thumb').length, thumbH: th ? Math.round(th.getBoundingClientRect().height) : 0,
    hosts: document.querySelectorAll('.ddtv-host').length, styles: document.querySelectorAll('#ddtv-gallery-style').length,
    tvVisible: tvr.width > 0 && tvr.height > 0, btn: !!(T && T.modelGallery && T.modelGallery.ui.btn.offsetParent !== null), overlay: !!(T && T.shadow.querySelector('.ddtv-gal')),
    sel: [...document.querySelectorAll('.details-product-option select')].map((s) => s.value).join('|'),
    price: document.querySelector('.details-product-price__value').textContent, tvPrice: T && T.shadow.querySelector('.ddtv__price-v') ? T.shadow.querySelector('.ddtv__price-v').textContent : null,
    sidebar: rect('.product-details__sidebar'), desc: rect('.product-details__description'), block: rect('.product-details'), xs: document.documentElement.scrollWidth - innerWidth,
  };
});
const mounted = (p) => p.waitForFunction(() => document.querySelectorAll('.ddtv-host').length === 1 && window.DDTV && DDTV.current && DDTV.current.modelGallery, null, { timeout: 25000 }).then(() => true, () => false);
const chooseAll = async (p) => { const s = p.locator('.details-product-option select'); for (let i = 0; i < 4; i++) { await s.nth(i).selectOption({ index: 2 }); await p.waitForTimeout(350); } await p.waitForTimeout(1200); };

(async () => {
  /* ---- 1. desktop: storefront source, restoration, native zoom, options, cycles, counters ---- */
  {
    const s = await session({ width: 1440, height: 900 });
    const { p, cdp, sfPosts, writes, errors, own } = s;
    const base = await baseline(p);
    await p.addScriptTag({ content: EMBED });
    ok(await mounted(p), 'the television mounted on the real page');
    await p.waitForTimeout(1500);
    const pageOwnPosts = sfPosts.length;
    ok(pageOwnPosts === 1, 'before the visitor reaches for the gallery the television has made no storefront request (the page\'s own is the only one)');

    // storefront source
    await p.hover('.ddtv__galbtn');
    await p.waitForFunction(() => DDTV.current.modelGallery.adapter.storeState === 'ok' || DDTV.current.modelGallery.adapter.storeState === 'failed' || DDTV.current.modelGallery.adapter.storeState === 'mismatch', null, { timeout: 15000 }).catch(() => {});
    const ours = sfPosts.slice(pageOwnPosts);
    ok(ours.length === 1 && JSON.stringify(JSON.parse(ours[0].body)) === JSON.stringify({ productIdentifier: { type: 'PUBLISHED', productId: 831592302 } }), 'hovering the button made exactly one request to the page\'s own endpoint, with only the product identifier in its body');
    let encoded = 0; try { encoded = (await ours[0].req.sizes()).responseBodySize; } catch (e) { /* ignore */ }
    console.log('INFO the request\'s response was ' + Math.round(encoded / 1024) + ' KB on the wire (it carries the product record, which includes the long description); it is made only when the visitor reaches for the gallery');
    const R = await p.evaluate(() => { const ad = DDTV.current.modelGallery.adapter; return { rep: ad.report(), imgs: ad.images().map((i) => ({ u1500: i.urls[1500] || '', u800: i.urls[800] || '', alt: i.alt, main: i.isMain, src: i.source })) }; });
    const own1500 = own.body && own.body.defaultOptionsOverrides && own.body.defaultOptionsOverrides.variationOverrides.mediaItems.map((m) => m.image1500pxUrl);
    const ownAlt = own.body && own.body.defaultOptionsOverrides.variationOverrides.mediaItems.map((m) => String(m.alt || '').replace(/\s+/g, ' ').trim());
    ok(R.rep.sizes === 'storefront' && R.rep.storefront === 'ok' && R.imgs.length === 14, 'the records agree with the real gallery and are used: 14 images (' + JSON.stringify(R.rep) + ')');
    ok(own1500 && R.imgs.every((im, i) => im.u1500 === own1500[i] && im.src === 'storefront'), 'each image\'s 1500 px file is exactly what the page\'s own response lists for it, in the same order');
    ok(ownAlt && R.imgs.every((im, i) => im.alt === ownAlt[i]) && R.imgs.filter((i) => i.main).length === 1, 'alt text and the single main-image flag come from the store\'s records');

    // Optimised Preview with real options chosen
    await chooseAll(p);
    const o0 = await state(p);
    ok(o0.allHidden && o0.attr === 'isolated' && o0.tvVisible && o0.btn && o0.hosts === 1 && o0.price === o0.tvPrice && o0.price !== '£0', 'Optimised Preview with four real options chosen: gallery isolated, television and button visible, store price mirrored (' + o0.price + ')');
    for (let i = 0; i < 2; i++) { await p.click('.ddtv-switch button[data-view="classic"]'); await p.waitForTimeout(250); await p.click('.ddtv-switch button[data-view="interactive"]'); await p.waitForTimeout(250); }
    await p.waitForTimeout(800);
    const gc = async () => { await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); return cdp.send('Memory.getDOMCounters'); };
    const c0 = await gc();
    let bad = 0, detail = '';
    for (let i = 0; i < 12; i++) {
      await p.click('.ddtv-switch button[data-view="classic"]'); await p.waitForTimeout(450);
      const s1 = await state(p);
      const good1 = s1.attr === null && s1.stack === 0 && s1.kids === base.kids && s1.thumbs === base.thumbs && s1.thumbH === base.thumbH && s1.styles === 0 && !s1.tvVisible && !s1.overlay && s1.hosts === 1 && s1.sel === o0.sel && s1.price === o0.price && s1.xs <= 0;
      await p.click('.ddtv-switch button[data-view="interactive"]'); await p.waitForTimeout(450);
      if (i % 4 === 0) { await p.locator('.ddtv__galbtn').click(); await p.waitForTimeout(500); await p.keyboard.press('Escape'); }
      const s2 = await state(p);
      const good2 = s2.allHidden && s2.attr === 'isolated' && s2.thumbs === base.thumbs && s2.tvVisible && s2.btn && !s2.overlay && s2.hosts === 1 && s2.styles === 1 && s2.sel === o0.sel && s2.price === o0.price && s2.tvPrice === o0.price && s2.xs <= 0;
      if (!(good1 && good2)) { bad++; detail = JSON.stringify({ i, good1, good2, s1: { a: s1.attr, k: s1.kids, t: s1.thumbs, h: s1.thumbH, sel: s1.sel, p: s1.price }, s2: { a: s2.attr, h: s2.allHidden, sel: s2.sel, p: s2.price, tp: s2.tvPrice } }).slice(0, 600); }
    }
    ok(bad === 0, '12 cycles Optimised → Standard → Optimised on the real page: every time the store\'s own gallery is exactly as before the television existed (same children, 14 thumbnails of ' + base.thumbH + ' px) and then isolated again; the four chosen options and the price never change; one television, no duplicates, no sideways scroll' + (bad ? ' — ' + detail : ''));
    const c1 = await gc();
    console.log(`INFO real page, 12 cycles + 3 gallery visits: documents ${c0.documents}→${c1.documents}, DOM nodes ${c0.nodes}→${c1.nodes}, JS event listeners ${c0.jsEventListeners}→${c1.jsEventListeners}`);
    ok(c1.documents === c0.documents && c1.jsEventListeners - c0.jsEventListeners <= 25 && c1.nodes - c0.nodes <= 300, 'no accumulation: no extra documents; event listeners +' + (c1.jsEventListeners - c0.jsEventListeners) + ', DOM nodes +' + (c1.nodes - c0.nodes) + ' over 12 cycles (the store\'s own activity included)');

    // Standard Product View: the store's own controls really work
    await p.click('.ddtv-switch button[data-view="classic"]'); await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelector('.product-details__gallery').scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(400);
    const before = await p.evaluate(() => document.querySelector('.details-gallery__picture').getAttribute('src'));
    await p.locator('.details-gallery__thumb').nth(2).click();
    await p.waitForTimeout(900);
    const after = await p.evaluate(() => document.querySelector('.details-gallery__picture').getAttribute('src'));
    ok(before !== after, 'Standard Product View: clicking the store\'s own thumbnail 3 changes its main picture (' + before.split('/').pop() + ' → ' + after.split('/').pop() + ')');
    const bb = await p.locator('.details-gallery__picture').first().boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(700); await p.mouse.down(); await p.mouse.up();
    await p.waitForSelector('.pswp--open', { timeout: 8000 }).catch(() => {});
    const ps = await p.evaluate(() => { const n = document.querySelector('.pswp'); return n ? { open: n.classList.contains('pswp--open'), counter: (n.querySelector('.pswp__counter') || {}).textContent } : null; });
    ok(ps && ps.open && ps.counter === '3 / 14', 'the store\'s own zoom/lightbox opens on that photo (' + (ps && ps.counter) + ')');
    // (the store's lightbox ignores the ArrowRight key in this automation even with no television on the page, checked
    // separately; its own arrow button is what a visitor uses and what is tested)
    await p.locator('.pswp__button--arrow--right').click(); await p.waitForTimeout(900);
    ok(await p.evaluate(() => (document.querySelector('.pswp__counter') || {}).textContent === '4 / 14'), 'and navigates with its own arrow inside the lightbox (4 / 14)');
    await p.keyboard.press('Escape'); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.querySelector('.pswp--open')), 'and closes with Escape');
    ok(!(await state(p)).overlay && (await state(p)).hosts === 1, 'the television and its photo gallery do not obstruct or duplicate the store\'s gallery (no overlay, one hidden host)');
    const bag = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /add to bag/i.test(x.textContent)); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { present: !!b, enabled: !b.disabled, reachable: top === b || b.contains(top) }; });
    ok(bag.present && bag.enabled && bag.reachable, 'Standard Product View: the real Add to Bag is present, enabled and not covered (not clicked)');
    await p.evaluate(() => scrollTo(0, 0));
    // an option changed in the store's own dropdowns is what the television shows when it returns
    await p.locator('.details-product-option select').nth(3).selectOption({ index: 3 });
    await p.waitForTimeout(1200);
    const std = await state(p);
    await p.click('.ddtv-switch button[data-view="interactive"]'); await p.waitForTimeout(900);
    const back = await state(p);
    ok(back.sel === std.sel && back.price === std.price && back.tvPrice === std.price && back.allHidden, 'a cover changed in Standard Product View is kept on return, and the television shows the store\'s price (' + back.price + ')');
    ok(writes.length === 0, 'no write request to the store was made by the page during all of this' + (writes.length ? ' (' + writes.join(' ; ') + ')' : ''));
    ok(errors.every((e) => /Uncaught \(in promise\)|Timeout exceeded/.test(e)), 'no page error beyond those the store itself logs' + (errors.length ? ' [' + errors.join(' ; ').slice(0, 200) + ']' : ''));
    await s.b.close();
  }

  /* ---- 2. the stacked layout on the real store, against the store's own rectangles ---- */
  for (const [name, vp] of [['iPad portrait 820×1180', { width: 820, height: 1180 }], ['iPad mini portrait 744×1133', { width: 744, height: 1133 }]]) {
    const s = await session(vp, { hasTouch: true, isMobile: true });
    const { p } = s;
    const base = await baseline(p);
    await p.addScriptTag({ content: EMBED });
    await mounted(p);
    await p.waitForTimeout(1500);
    const a = await state(p), place = await p.evaluate(() => DDTV.current.placement);
    ok(place === 'stacked' && a.stack === 1 && a.sidebar[0] === a.block[0] && a.sidebar[1] === a.block[1] && a.desc[0] === a.block[0] && a.desc[1] === a.block[1], name + ': stacked; the store\'s sidebar and description now use the product block\'s full width (' + a.sidebar + ' in ' + a.block + '), so no left column is left unused');
    ok(a.xs <= 0, name + ': no sideways scroll');
    const gap = await p.evaluate(() => { const tv = document.querySelector('.ddtv-host').getBoundingClientRect(), sb = document.querySelector('.product-details__sidebar').getBoundingClientRect(); return Math.round(sb.top - tv.bottom); });
    ok(gap >= 0 && gap < 160, name + ': the product title, price and options start directly under the television (' + gap + ' px below it)');
    const sel = await p.evaluate(() => { const o = [...document.querySelectorAll('.details-product-option select')]; return o.length === 4 && o.every((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth; }); });
    ok(sel, name + ': the four store options are all there, visible and inside the screen');
    await p.click('.ddtv-switch button[data-view="classic"]'); await p.waitForTimeout(700);
    const b = await baseline(p), st = await state(p);
    ok(st.stack === 0 && JSON.stringify([b.sidebar, b.desc, b.block]) === JSON.stringify([base.sidebar, base.desc, base.block]), name + ': Standard Product View: the sidebar, description and block are exactly where the store had them before the television existed (sidebar ' + b.sidebar + ', description ' + b.desc + ')');
    await p.click('.ddtv-switch button[data-view="interactive"]'); await p.waitForTimeout(700);
    if (name.startsWith('iPad portrait')) {
      await p.setViewportSize({ width: 1180, height: 820 }); await p.waitForTimeout(1200);
      const c = await state(p), cp = await p.evaluate(() => DDTV.current.placement);
      ok(cp === 'column' && c.stack === 0, name + ': rotated to landscape the television returns to the column and the stacked layout is removed');
      await p.setViewportSize(vp); await p.waitForTimeout(1200);
      const d = await state(p);
      ok(d.stack === 1 && d.allHidden && d.hosts === 1 && d.xs <= 0, name + ': rotated back it is applied again, one television, no sideways scroll');
    }
    await s.b.close();
  }

  /* ---- 3. retina iPad: the 1500 px file, and the gallery over real photos ---- */
  {
    const vp = { width: 820, height: 1180 };
    const s = await session(vp, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const { p, sfPosts } = s;
    await p.addScriptTag({ content: EMBED });
    await mounted(p);
    await p.waitForTimeout(1200);
    const n0 = sfPosts.length;
    await p.locator('.ddtv__galbtn').click();
    await p.waitForFunction(() => DDTV.current.modelGallery.adapter.storeState === 'ok', null, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(2500);
    const g = await p.evaluate(() => { const i = DDTV.current.shadow.querySelector('.ddtv-gal__img'); return { src: i.getAttribute('src'), w: i.naturalWidth, h: i.naturalHeight, count: DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent, stage: DDTV.current.shadow.querySelector('.ddtv-gal__stage').clientWidth }; });
    ok(sfPosts.length === n0 + 1 && g.count === '1 / 14', 'iPad (touch, no hover): opening the gallery made the one request and shows photo 1 of 14');
    ok(/image1500|\/\d+\.webp/.test(g.src) && g.w >= 1400, 'on a 2x screen the large photo is the 1500 px file, loaded from the store\'s CDN (' + g.w + '×' + g.h + ' px file in a ' + g.stage + ' px stage)');
    const r = await p.evaluate(() => { const i = DDTV.current.shadow.querySelector('.ddtv-gal__img'), a = i.naturalWidth / i.naturalHeight, b = i.getBoundingClientRect(); const shown = b.width / b.height; return { natural: a, box: shown, fit: getComputedStyle(i).objectFit }; });
    ok(r.fit === 'contain', 'proportions are preserved (object-fit: contain; the photo is never stretched)');
    await s.b.close();
  }

  /* ---- 4. real media playback on the real page (synthetic MP4) ---- */
  if (!VIDEO) console.log('SKIP real-media playback: ffmpeg is not available (NOT counted as a pass)');
  else {
    const s = await session({ width: 1440, height: 900 });
    const { p, errors } = s;
    await p.addScriptTag({ content: EMBED });
    await mounted(p);
    const probe = () => p.evaluate(() => { const vs = [...DDTV.current.shadow.querySelectorAll('video')], loops = vs.filter((v) => v.loop && v.getClientRects().length > 0); return { total: vs.length, loops: loops.length, playing: vs.filter((v) => !v.paused && !v.ended).length, loopsPlaying: loops.filter((v) => !v.paused).length, t: loops.map((v) => v.currentTime), errs: vs.filter((v) => v.error).length }; });
    await p.waitForFunction(() => [...DDTV.current.shadow.querySelectorAll('video')].some((v) => v.loop && !v.paused && v.currentTime > 0.3), null, { timeout: 12000 }).catch(() => {});
    const a = await probe(); await p.waitForTimeout(800); const a2 = await probe();
    ok(a.loops >= 1 && a.loopsPlaying === a.loops && a2.t.every((t, i) => t > a.t[i] + 0.2), 'on the real page the screen\'s ' + a.loops + ' loop(s) really play (currentTime advances)');
    let clean = true, detail = '';
    for (let i = 0; i < 8; i++) {
      await p.locator('.ddtv__galbtn').click(); await p.waitForTimeout(250);
      const o = await probe();
      const t1 = await p.evaluate(() => [...DDTV.current.shadow.querySelectorAll('video')].map((v) => v.currentTime)); await p.waitForTimeout(400);
      const t2 = await p.evaluate(() => [...DDTV.current.shadow.querySelectorAll('video')].map((v) => v.currentTime));
      await p.keyboard.press('Escape');
      await p.waitForFunction(() => [...DDTV.current.shadow.querySelectorAll('video')].some((v) => v.loop && !v.paused), null, { timeout: 5000 }).catch(() => {});
      await p.waitForTimeout(400);
      const c = await probe();
      if (!(o.playing === 0 && t1.every((t, k) => t === t2[k]) && c.playing === c.loops && c.loopsPlaying === c.loops && c.total === a.total && c.errs === 0)) { clean = false; detail = JSON.stringify({ i, o, c }); }
    }
    ok(clean, '8 gallery round trips on the real page: nothing plays (time frozen) while the gallery is open, exactly the visible loops play after, same number of video elements, no media error' + (clean ? '' : ' — ' + detail));
    // Standard Product View: the television's videos do not keep playing behind the original page
    await p.click('.ddtv-switch button[data-view="classic"]'); await p.waitForTimeout(900);
    const std = await p.evaluate(() => [...DDTV.current.shadow.querySelectorAll('video')].filter((v) => !v.paused).length);
    ok(std === 0, 'in Standard Product View no video of the television is playing');
    ok(errors.every((e) => /Uncaught \(in promise\)|Timeout exceeded/.test(e)), 'no page error beyond those the store itself logs');
    await s.b.close();
  }

  /* ---- 5. iPhone: standard only; the television makes no request ---- */
  {
    const vp = { width: 390, height: 844 };
    const s = await session(vp, { hasTouch: true, isMobile: true, screen: vp });
    const { p, sfPosts } = s;
    const base = await baseline(p);
    const n0 = sfPosts.length;
    await p.addScriptTag({ content: EMBED });
    await p.waitForTimeout(3500);
    const st = await state(p).catch(() => null);
    const after = await baseline(p);
    const tv = await p.evaluate(() => ({ visible: !!(window.DDTV && DDTV.current && DDTV.current.tv && DDTV.current.tv.offsetParent !== null), btn: !!(window.DDTV && DDTV.current && DDTV.current.modelGallery && DDTV.current.modelGallery.ui.btn.offsetParent !== null), attrs: document.querySelectorAll('[data-ddtv-gallery],[data-ddtv-stacked]').length, rule: !!document.getElementById('ddtv-gallery-style') }));
    ok(!tv.visible && !tv.btn && tv.attrs === 0 && !tv.rule && after.kids === base.kids && after.thumbs === 14, 'iPhone 390×844: standard Ecwid view only: no television, no gallery button, no attribute, no rule, the store\'s own gallery exactly as it was');
    ok(sfPosts.length === n0, 'and the television made no storefront request');
    await s.b.close();
  }

  console.log(failures ? `\n${failures} check(s) failed (real Ecwid DOM, public product)` : '\nAll checks passed (real Ecwid DOM of the public product; synthetic media; the test product and real devices are not covered)');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERR', e.message); process.exit(2); });
