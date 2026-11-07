// Tests of the store embed (dist/embed/botanic-tv.js) on dist/embed/test-page.html.
//   node tools/build-embed.mjs && node tests/embed.mjs
//
// !! EVERYTHING HERE RUNS AGAINST A SIMULATED ECWID in a Chromium engine. It is not Ecwid and it is not
// !! Safari. A pass proves the embed's own logic; it does not prove compatibility with the real store.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const embedFile = join(root, 'dist', 'embed', 'botanic-tv.js');
const page0 = pathToFileURL(join(root, 'dist', 'embed', 'test-page.html')).href;

const SHIM = `window.__q = (s) => document.querySelector(s) || (window.DDTV && DDTV.current && DDTV.current.shadow.querySelector(s));
window.__qa = (s) => [...document.querySelectorAll(s), ...(window.DDTV && DDTV.current ? DDTV.current.shadow.querySelectorAll(s) : [])];`;

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };
console.log('NOTE: simulated Ecwid storefront API, Chromium engine only. Not live Ecwid, not Safari.\n');

const browser = await chromium.launch();

async function open(query = '', viewport = { width: 1440, height: 900 }, extra = {}) {
  const ctx = await browser.newContext({ viewport, screen: extra.screen || { width: 1920, height: 1080 }, deviceScaleFactor: 1, ...extra });
  await ctx.addInitScript(() => sessionStorage.setItem('ddtv:botanic:splash', '1'));
  await ctx.addInitScript(SHIM);
  await ctx.route(/^https?:\/\//, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(page0 + query);
  return { ctx, page, errors };
}
const hosts = (page) => page.evaluate(() => document.querySelectorAll('.ddtv-host').length);
const settle = (page, ms = 400) => page.waitForTimeout(ms);
const mounted = (page) => page.waitForFunction(() => document.querySelectorAll('.ddtv-host').length === 1 && window.DDTV && DDTV.current, null, { timeout: 5000 }).then(() => true, () => false);

/* The store's options column and Add to Bag, without the price text (which the store updates). */
const sideMarkup = (page) => page.evaluate(() => { const c = document.querySelector('.product-details__sidebar').cloneNode(true); c.querySelectorAll('.details-product-price__value, #mock-bag-error').forEach((n) => { n.textContent = ''; n.removeAttribute('hidden'); }); return c.outerHTML; });

/* ====================================================================== */
/* 1. Product guard and the emergency switch                               */
/* ====================================================================== */
{
  const a = await open();
  ok(await mounted(a.page), 'starts on the listed test product (876405767)');
  ok(a.errors.length === 0, 'no page errors on start ' + a.errors.join(' | '));
  await a.ctx.close();

  for (const [label, q] of [['another product (111)', '?pid=111'], ['the LIVE Botanic product (831592302)', '?pid=831592302']]) {
    const { ctx, page, errors } = await open(q);
    await settle(page, 700);
    ok((await hosts(page)) === 0, `does not start on ${label}`);
    ok(await page.evaluate(() => !DDTV.current && document.getElementById('bp-top').offsetParent !== null && !document.documentElement.classList.contains('ddtv-ready')), `… and leaves its description untouched (${label})`);
    ok(errors.length === 0, `no page errors on ${label}`);
    await ctx.close();
  }

  const off = await open('?ddtv=off');
  await settle(off.page, 700);
  ok(await off.page.evaluate(() => typeof window.DDTV === 'undefined' && !document.getElementById('ddtv-font') && !document.querySelector('.ddtv-host') && !window.__ddtvEmbedLoaded), '?ddtv=off: the embed creates nothing at all (no engine, no font link, no host)');
  ok(await off.page.evaluate(() => document.getElementById('bp-top').offsetParent !== null), '?ddtv=off: the original description is shown');
  await off.ctx.close();
}

/* ====================================================================== */
/* 2. Repeated page-load events, navigation, re-render, double load        */
/* ====================================================================== */
{
  const { ctx, page, errors } = await open();
  await mounted(page);
  await page.evaluate(() => { window.__first = DDTV.current; });
  await page.evaluate(() => { for (let i = 0; i < 5; i++) __ecwid.fire({ type: 'PRODUCT', productId: 876405767 }); });
  await settle(page, 500);
  ok((await hosts(page)) === 1 && await page.evaluate(() => DDTV.current === window.__first), 'five repeated page-load events keep exactly one television (same instance, no flicker)');

  await page.addScriptTag({ path: embedFile });
  await page.evaluate(() => __ecwid.fire({ type: 'PRODUCT', productId: 876405767 }));
  await settle(page, 400);
  ok((await hosts(page)) === 1 && await page.evaluate(() => DDTV.current === window.__first), 'loading the file a second time does not add a second engine or handler');

  const before = await sideMarkup(page);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => __ecwid.fire({ type: 'PRODUCT', productId: 111 }));
    await settle(page, 200);
    const gone = await page.evaluate(() => ({ h: document.querySelectorAll('.ddtv-host').length, cur: !!DDTV.current, desc: document.getElementById('bp-top').offsetParent !== null, ready: document.documentElement.classList.contains('ddtv-ready') }));
    ok(gone.h === 0 && !gone.cur && gone.desc && !gone.ready, `navigating to another product removes the television and restores the description (round ${i + 1})`);
    await page.evaluate(() => __ecwid.fire({ type: 'CATEGORY' }));
    await page.evaluate(() => __ecwid.fire({ type: 'PRODUCT', productId: 876405767 }));
    ok(await mounted(page), `coming back to the test product mounts one television (round ${i + 1})`);
  }
  ok((await sideMarkup(page)) === before, 'the store options column is identical after the navigation rounds');

  // The store re-renders the description (new node, same page): the television is rebuilt from it, once.
  await page.evaluate(() => { window.__before = DDTV.current; const old = document.getElementById('bp-top'); old.replaceWith(old.cloneNode(true)); __ecwid.fire({ type: 'PRODUCT', productId: 876405767 }); });
  await settle(page, 600);
  ok((await hosts(page)) === 1 && await page.evaluate(() => DDTV.current !== window.__before && DDTV.current.alive()), 'a re-rendered description rebuilds the television once, from the new node');
  ok(errors.length === 0, 'no page errors during all of the above ' + errors.join(' | '));
  await ctx.close();
}

/* ====================================================================== */
/* 3. The page was announced before the script ran (event missed)         */
/* ====================================================================== */
{
  const cases = [
    ['product-page class, test product', '?late=1', 1],
    ['product-page class, another product', '?late=1&pid=111', 0],
    ['hash route #!/…/p/876405767 (no class)', '?late=1&noclass=1#!/Botanic/p/876405767', 1],
    ['hash route of another product (no class)', '?late=1&noclass=1#!/Botanic/p/111', 0],
  ];
  for (const [label, q, want] of cases) {
    const { ctx, page } = await open(q);
    await settle(page, 900);
    ok((await hosts(page)) === want, `event missed, found from the ${label}: ${want ? 'starts' : 'stays off'}`);
    await ctx.close();
  }
}

/* ====================================================================== */
/* 4. Placement and layout on every device size                           */
/* ====================================================================== */
const MEASURE = () => {
  const root = DDTV.current.shadow;
  const tv = root.querySelector('.ddtv-wrap');
  const fonts = [...root.querySelectorAll('.ddtv__btn, .ddtv__tab, .ddtv__nav, .ddtv__play, .ddtv-switch button')].map((n) => parseFloat(getComputedStyle(n).fontSize));
  const foot = [...root.querySelectorAll('.ddtv__foot > *')].map((e) => e.getBoundingClientRect());
  let overlap = 0;
  for (let i = 0; i < foot.length; i++) for (let j = i + 1; j < foot.length; j++) if (foot[i].width && foot[j].width && foot[i].left < foot[j].right - 0.5 && foot[j].left < foot[i].right - 0.5) overlap++;
  const box = (s) => { const r = root.querySelector(s).getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; };
  const heights = (s) => [...root.querySelectorAll(s)].map((n) => n.getBoundingClientRect().height);
  const gallery = document.querySelector('.mock-gallery');
  return {
    placement: tv.getAttribute('data-placement'), phone: tv.classList.contains('is-phone'),
    hosts: document.querySelectorAll('.ddtv-host').length,
    clipped: [...root.querySelectorAll('.ddtv__btn')].filter((b) => b.scrollWidth > b.clientWidth + 1).map((b) => b.textContent.trim()),
    minFont: Math.min(...fonts), overlap,
    docScroll: document.documentElement.scrollWidth - window.innerWidth,
    screen: box('.ddtv__screen'), unit: box('.ddtv'), innerH: window.innerHeight,
    minBtn: Math.min(...heights('.ddtv__btn')), minTab: Math.min(...heights('.ddtv__tab')), minNav: Math.min(...heights('.ddtv__nav, .ddtv__play')), minChip: Math.min(...heights('.ddtv__chip')),
    galleryShown: gallery ? gallery.offsetParent !== null : null,
    columnW: Math.round(document.querySelector('.product-details__gallery').getBoundingClientRect().width),
    sideAside: Math.round(root.querySelector('.ddtv__aside').getBoundingClientRect().width),
  };
};
const DEVICES = [
  ['desktop 1440×900', { width: 1440, height: 900 }, false],
  ['iPad Pro 12.9 landscape 1366×1024', { width: 1366, height: 1024 }, true],
  ['iPad Air landscape 1180×820', { width: 1180, height: 820 }, true],
  ['iPad mini landscape 1133×744', { width: 1133, height: 744 }, true],
  ['iPad 10.2 landscape 1080×810', { width: 1080, height: 810 }, true],
  ['iPad 9.7 landscape 1024×768', { width: 1024, height: 768 }, true],
  ['iPad Air portrait 820×1180', { width: 820, height: 1180 }, true],
  ['iPad 10.2 portrait 810×1080', { width: 810, height: 1080 }, true],
  ['iPad 9.7 portrait 768×1024', { width: 768, height: 1024 }, true],
  ['iPad mini portrait 744×1133', { width: 744, height: 1133 }, true],
];
for (const [name, vp, touch] of DEVICES) {
  const { ctx, page, errors } = await open('', vp, touch ? { hasTouch: true, isMobile: true, screen: vp } : {});
  await mounted(page);
  await settle(page, 500);
  const m = await page.evaluate(MEASURE);
  ok(m.hosts === 1 && !m.phone && errors.length === 0, `${name}: one television, no page errors`);
  ok(m.placement === (m.columnW < 700 ? 'stacked' : 'column'), `${name}: placement follows the column width (${m.columnW}px → ${m.placement})`);
  ok(m.clipped.length === 0, `${name}: no chapter label is clipped` + (m.clipped.length ? ' (' + m.clipped.join(', ') + ')' : ''));
  ok(m.overlap === 0, `${name}: footer controls do not overlap`);
  ok(m.minFont >= 12, `${name}: every control is at least 12px (${m.minFont.toFixed(1)}px)`);
  ok(m.docScroll <= 0, `${name}: no horizontal page scroll`);
  ok(m.unit.h <= m.innerH, `${name}: the television unit fits the screen height (${m.unit.h} ≤ ${m.innerH})`);
  ok(m.screen.h <= m.screen.w * 1.35, `${name}: the monitor stays proportional (${m.screen.w}×${m.screen.h})`);
  if (touch) ok(m.minBtn >= 43.5 && m.minTab >= 43.5 && m.minNav >= 43.5 && m.minChip >= 43.5, `${name}: every tap target of the shell is at least 44px (chapter ${m.minBtn.toFixed(0)}, tab ${m.minTab.toFixed(0)}, nav ${m.minNav.toFixed(0)}, selection ${m.minChip.toFixed(0)})`);
  ok(m.placement === 'column' ? m.galleryShown === false : m.galleryShown === true, `${name}: the store gallery is ${m.placement === 'column' ? 'replaced by the television' : 'left visible below it'}`);
  await ctx.close();
}

/* ====================================================================== */
/* 5. Rotation without a reload                                            */
/* ====================================================================== */
{
  const land = { width: 1180, height: 820 }, port = { width: 820, height: 1180 };
  const { ctx, page, errors } = await open('', land, { hasTouch: true, isMobile: true, screen: land });
  await mounted(page);
  const sideBefore = await sideMarkup(page);
  await page.evaluate(() => DDTV.current.go('firmness', 'choose'));
  const m1 = await page.evaluate(MEASURE);
  await page.setViewportSize(port); await settle(page, 700);
  const m2 = await page.evaluate(MEASURE);
  await page.setViewportSize(land); await settle(page, 700);
  const m3 = await page.evaluate(MEASURE);
  ok(m1.placement === 'column' && m2.placement === 'stacked' && m3.placement === 'column', `rotation moves the television between column and stacked and back (${m1.placement} → ${m2.placement} → ${m3.placement})`);
  ok(m1.hosts === 1 && m2.hosts === 1 && m3.hosts === 1, 'rotation never leaves two televisions');
  ok(m2.galleryShown === true && m3.galleryShown === false, 'the store gallery comes back when stacked and is replaced again in the column');
  ok(await page.evaluate(() => DDTV.current.chapterIndex === 1 && !!document.querySelector('#bp-top') && document.getElementById('bp-top').offsetParent === null), 'rotation keeps the chapter the customer was on, and the long description stays hidden');
  ok((await sideMarkup(page)) === sideBefore, 'the store options column is identical after rotating twice');
  ok(errors.length === 0, 'no page errors while rotating ' + errors.join(' | '));
  await ctx.close();
}

/* ====================================================================== */
/* 6. Window width sweep on a large screen (a resized desktop window)      */
/* ====================================================================== */
for (const w of [640, 700, 720, 744, 768, 820, 900, 1024, 1100, 1180, 1280, 1440, 1700]) {
  const { ctx, page } = await open('', { width: w, height: 900 });
  await settle(page, 700);
  const info = await page.evaluate(() => {
    const t = DDTV.current && DDTV.current.shadow.querySelector('.ddtv-wrap');
    if (!t) return null;
    return { phone: t.classList.contains('is-phone'), tvHidden: DDTV.current.tv.hidden || getComputedStyle(DDTV.current.tv).display === 'none', desc: document.getElementById('bp-top').offsetParent !== null };
  });
  if (w < 720) ok(info && info.phone && info.desc, `window ${w}px: below 720px the complete Classic View is shown instead`);
  else {
    const m = await page.evaluate(MEASURE);
    ok(!m.phone && m.hosts === 1 && m.clipped.length === 0 && m.overlap === 0 && m.minFont >= 12 && m.docScroll <= 0, `window ${w}px: ${m.placement}, no clipped label, no overlap, min font ${m.minFont.toFixed(1)}px, no sideways scroll`);
  }
  await ctx.close();
}

/* ====================================================================== */
/* 7. Phones, both orientations: the complete Classic View, no television  */
/* ====================================================================== */
for (const [name, vp] of [['iPhone 13 portrait', { width: 390, height: 844 }], ['iPhone 13 landscape', { width: 844, height: 390 }], ['iPhone Pro Max landscape', { width: 932, height: 430 }], ['Android portrait', { width: 412, height: 915 }]]) {
  const scr = { width: Math.min(vp.width, vp.height) === vp.width ? vp.width : vp.height, height: Math.max(vp.width, vp.height) };
  const { ctx, page, errors } = await open('', vp, { hasTouch: true, isMobile: true, screen: vp.width < vp.height ? vp : { width: vp.height, height: vp.width } });
  await settle(page, 700);
  const r = await page.evaluate(() => {
    const t = DDTV.current && DDTV.current.shadow.querySelector('.ddtv-wrap');
    return {
      phone: !!(t && t.classList.contains('is-phone')), tvVisible: !!(DDTV.current && DDTV.current.tv.offsetParent !== null),
      switchVisible: !!(DDTV.current && DDTV.current.shadow.querySelector('.ddtv-switch').offsetParent !== null),
      sections: [...document.querySelectorAll('#bp-top section[id^="bp-"]')].filter((s) => s.offsetParent !== null).length,
      videos: document.querySelectorAll('#bp-top video').length, scroll: document.documentElement.scrollWidth - window.innerWidth,
      screen: screen.width + '×' + screen.height,
    };
  });
  ok(r.phone && !r.tvVisible && !r.switchVisible, `${name} (screen ${r.screen}): no television and no view switch`);
  ok(r.sections === 13 && r.videos === 7, `${name}: the complete Classic View (${r.sections}/13 sections, ${r.videos}/7 videos)`);
  ok(r.scroll <= 0 && errors.length === 0, `${name}: no sideways scroll, no page errors`);
  await ctx.close();
}

/* ====================================================================== */
/* 8. Add to Bag, original controls, video attributes (simulated store)    */
/* ====================================================================== */
{
  const { ctx, page } = await open();
  await mounted(page);
  const bagHtml = await page.evaluate(() => document.getElementById('mock-add-to-bag').outerHTML);
  const reachable = () => page.evaluate(() => { const b = document.getElementById('mock-add-to-bag'), r = b.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === b; });
  await page.evaluate(() => document.getElementById('mock-add-to-bag').scrollIntoView({ block: 'center' }));
  ok(await reachable(), 'Add to Bag (scrolled into view) is not covered by the television');
  await page.click('#mock-add-to-bag');
  ok(await page.evaluate(() => !document.getElementById('mock-bag-error').hidden && window.__bag.length === 0), 'Add to Bag with nothing chosen: the store refuses (nothing added)');

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.ddtv__btn[data-chapter="firmness"]');
  await page.locator('.ddtv__panel.is-active .sc-seg', { hasText: 'Medium' }).click();
  await page.click('.ddtv__btn[data-chapter="height"]');
  await page.locator('.ddtv__panel.is-active .sc-slabcard', { hasText: 'Deep Comfort' }).click();
  await page.click('.ddtv__tab:has-text("Choose size")');
  await page.locator('.ddtv__panel.is-active .sc-size', { hasText: '180 × 200' }).first().click();
  await page.click('.ddtv__btn[data-chapter="covers"]');
  await page.locator('.ddtv__panel.is-active .sc-swatch', { hasText: 'Cotton & Wool' }).click();
  await page.waitForTimeout(200);
  await page.evaluate(() => document.getElementById('mock-add-to-bag').scrollIntoView({ block: 'center' }));
  ok(await reachable(), 'Add to Bag is still not covered after choosing in the television');
  await page.click('#mock-add-to-bag');
  const bag = await page.evaluate(() => ({ items: window.__bag.slice(), price: document.querySelector('.details-product-price__value').textContent, err: !document.getElementById('mock-bag-error').hidden }));
  ok(bag.items.length === 1 && bag.items[0].options.length === 4 && bag.items[0].price === bag.price && !bag.err, `choices made in the television reach the store's own Add to Bag (${bag.items[0] && bag.items[0].options.map((o) => o.slice(0, 22)).join(' | ')}; price ${bag.price})`);
  ok(await page.evaluate((h) => document.getElementById('mock-add-to-bag').outerHTML === h, bagHtml), 'the Add to Bag button itself is unchanged');
  ok(await page.evaluate(() => document.querySelector('.details-product-price__value').textContent === DDTV.current.shadow.querySelector('.ddtv__price-v').textContent), 'the price on the monitor is exactly the price the store shows');

  // After a valid choice the real store adds a struck-through earlier price and a discount note.
  // This markup is copied from the live DOM (tests/live/ shows it); the simulated store does not produce it itself.
  await page.evaluate(() => {
    document.querySelector('.mock-price').insertAdjacentHTML('beforeend', '<div class="details-product-price-compare__container"><span><span class="grid-product__price-label">was</span> <span class=""><s>£156</s></span> <span class="product-details__product-price-discount whitespace-nowrap"><span class="details-product-price-discount__text">Save </span><span class="details-product-price-discount__value notranslate">10%</span></span></span></div>');
    document.querySelector('.details-product-option select').dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => { const b = DDTV.current.shadow.querySelector('.ddtv__price'); return !!b.querySelector('.ddtv__price-old') && /£156/.test(b.textContent) && /Save 10%/.test(b.textContent); }), 'the monitor mirrors the earlier price and the discount note the store shows');

  const vids = await page.evaluate(() => [...__qa('video')].map((v) => ({ inline: v.hasAttribute('playsinline'), loop: v.hasAttribute('loop'), muted: v.muted })));
  ok(vids.length === 7 && vids.every((v) => v.inline) && vids.filter((v) => v.loop).every((v) => v.muted), `all 7 videos keep playsinline, and every loop is muted (${vids.length} videos). Attributes only: playback is not testable offline`);
  await page.click('.ddtv__btn[data-chapter="discover"]');
  await page.click('.ddtv__panel.is-active .sc-play');
  ok(await page.evaluate(() => { const v = __q('.ddtv-player video'); return !!v && v.hasAttribute('playsinline') && v.hasAttribute('controls'); }), 'the full video opens inline with controls (playsinline)');
  await ctx.close();
}

/* ====================================================================== */
/* 9. Vertical placement modes: 'top' (default) and 'size'                 */
/* ====================================================================== */
for (const [name, vp, touch] of [['desktop 1440×900', { width: 1440, height: 900 }, false], ['iPad Air landscape 1180×820', { width: 1180, height: 820 }, true]]) {
  const { ctx, page } = await open('', vp, touch ? { hasTouch: true, isMobile: true, screen: vp } : {});
  await mounted(page);
  await settle(page, 500);
  const geo = () => page.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    const T = DDTV.current, col = document.querySelector('.product-details__gallery'), size = document.querySelector('.details-product-option--SIZE'), side = document.querySelector('.product-details__sidebar');
    return { placement: T.placement, mode: T.product.layout.placement, barTop: Math.round(r(T.tv.firstElementChild).top), colTop: Math.round(r(col).top), sizeTop: Math.round(r(size).top), unitBottom: Math.round(r(T.tv).bottom), sideBottom: Math.round(r(side).bottom), screenH: Math.round(r(T.shadow.querySelector('.ddtv__screen')).height), margin: T.root.style.marginTop };
  });
  const top = await geo();
  ok(top.mode === 'top' && top.placement === 'column' && top.barTop - top.colTop <= 70, `${name}: default 'top': the television starts at the top of the column (header and buttons begin ${top.barTop - top.colTop}px below it)`);
  await page.evaluate(() => { DDTV_PRODUCTS.botanic.layout.placement = 'size'; DDTV.current.layout(); });
  await settle(page, 300);
  const sz = await geo();
  ok(Math.abs(sz.barTop - sz.sizeTop) <= 1, `${name}: 'size': the top row of chapter buttons starts level with the SIZE selector (${sz.barTop} vs ${sz.sizeTop})`);
  ok(sz.unitBottom <= sz.sideBottom + 6, `${name}: 'size': the unit ends with the options column, not below it (${sz.unitBottom} ≤ ${sz.sideBottom + 6})`);
  ok(sz.screenH >= 300, `${name}: 'size': the monitor stays usable (${sz.screenH}px tall)`);
  await page.evaluate(() => { DDTV_PRODUCTS.botanic.layout.placement = 'top'; DDTV.current.layout(); });
  await settle(page, 300);
  const back = await geo();
  ok(back.margin === '' && back.barTop === top.barTop, `${name}: switching back to 'top' restores the position exactly`);
  await ctx.close();
}
{
  // Stacked placement ignores 'size': there is no column to align with.
  const vp = { width: 820, height: 1180 };
  const { ctx, page } = await open('', vp, { hasTouch: true, isMobile: true, screen: vp });
  await mounted(page);
  await page.evaluate(() => { DDTV_PRODUCTS.botanic.layout.placement = 'size'; DDTV.current.layout(); });
  await settle(page, 300);
  ok(await page.evaluate(() => DDTV.current.placement === 'stacked' && DDTV.current.root.style.marginTop === ''), "stacked placement (iPad portrait) is unaffected by the 'size' setting");
  await ctx.close();
}

console.log(failures ? `\n${failures} check(s) failed (simulated Ecwid)` : '\nAll checks passed (simulated Ecwid; this is not a live Ecwid verification)');
await browser.close();
process.exit(failures ? 1 : 0);
