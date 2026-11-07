// Smoke test for the Experience TV prototype.
//   node tools/build.mjs && node tests/smoke.mjs [screenshot-dir]
// Uses the pre-installed Playwright + Chromium. External media is blocked,
// so the test checks structure and behaviour, not video playback.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

// Resolve Playwright from the project or from the globally installed copy.
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(join(root, 'dist', 'botanic-experience-tv-demo.html')).href;
const shots = process.argv[2];
if (shots) mkdirSync(shots, { recursive: true });

// The television lives in an open shadow root (the store's CSS cannot reach it).
// These helpers search the page first, then the television, so tests read the same either way.
const SHIM = `window.__q = (s) => document.querySelector(s) || (window.DDTV && DDTV.current && DDTV.current.shadow.querySelector(s));
window.__qa = (s) => [...document.querySelectorAll(s), ...(window.DDTV && DDTV.current ? DDTV.current.shadow.querySelectorAll(s) : [])];`;

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };
// Let transitions finish and move the pointer away before a screenshot.
const settle = async (page) => { await page.mouse.move(0, 0); await page.waitForTimeout(450); return page; };

const browser = await chromium.launch();

async function open(viewport, extra = {}, { splash = false, query = '' } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...extra });
  if (!splash) await ctx.addInitScript(() => sessionStorage.setItem('ddtv:botanic:splash', '1'));
  await ctx.addInitScript(SHIM);
  await ctx.route(/^https?:\/\//, (r) => r.abort()); // offline: no media, no fonts
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url + query);
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}

const NATIVE = {
  size: '.details-product-option--Size select',
  depth: '.details-product-option--Depth select',
  firmness: '.details-product-option--Firmness select',
  cover: '.details-product-option--Covers select',
};
const nativeText = (page, key) => page.evaluate((s) => { const el = __q(s); return el.selectedIndex > 0 ? el.options[el.selectedIndex].text : ''; }, NATIVE[key]);

/* ====================================================================== */
/* Nothing from the description is lost                                    */
/* ====================================================================== */
{
  // Every sentence, label and number of the source must be on a screen,
  // except what the config explicitly lists as not shown (with a reason).
  const { ctx, page } = await open({ width: 1440, height: 900 });
  const coverage = await page.evaluate(() => {
    const T = DDTV.current, src = __q('#bp-top'), excl = T.product.notInTelevision || [];
    const sels = excl.filter((x) => x.selector).map((x) => x.selector), strips = excl.filter((x) => x.strip).map((x) => x.strip);
    const norm = (s) => { strips.forEach((r) => { s = s.replace(r, ' '); }); return s.toLowerCase().replace(/[^a-z0-9£%]+/g, ' ').trim(); };
    const skip = (n) => sels.some((s) => { try { return n.closest(s); } catch (e) { return false; } });
    let tv = '';
    __qa('.ddtv__panel').forEach((p) => {
      const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) tv += ' ' + n.nodeValue;
    });
    tv = ' ' + norm(tv) + ' ';
    const missing = [];
    let checked = 0;
    src.querySelectorAll('*').forEach((n) => {
      if (['STYLE', 'SCRIPT', 'VIDEO', 'SOURCE'].includes(n.tagName.toUpperCase()) || n.closest('svg') || n.tagName.toLowerCase() === 'svg' || skip(n)) return;
      if (!(n.children.length === 0 || n.tagName === 'P')) return;
      const c = n.cloneNode(true);
      c.querySelectorAll('br').forEach((b) => b.replaceWith(' '));
      const t = norm(c.textContent);
      if (!t) return;
      checked++;
      if (tv.indexOf(' ' + t + ' ') < 0) missing.push(n.tagName + '.' + n.className + ': ' + c.textContent.replace(/\s+/g, ' ').trim().slice(0, 70));
    });
    return { checked, missing };
  });
  ok(coverage.missing.length === 0, `every one of the ${coverage.checked} source texts is shown on a screen` + (coverage.missing.length ? ' — missing: ' + coverage.missing.slice(0, 6).join(' | ') : ''));
  await ctx.close();
}

/* ====================================================================== */
/* Desktop                                                                 */
/* ====================================================================== */
{
  const { ctx, page, errors } = await open({ width: 1440, height: 900 });
  ok(errors.length === 0, 'no page errors on desktop ' + errors.join(' | '));
  ok(await page.locator('.ddtv').isVisible(), 'television visible on desktop');

  const report = await page.evaluate(() => DDTV.current.report);
  ok(report.missingMedia.length === 0, 'all registered media present in source');
  ok(report.unmappedSections.length === 0, 'every source section mapped to a chapter');
  ok(report.unplacedMedia.length === 0, 'no unregistered media in source');

  const buttons = await page.locator('.ddtv__btn').allTextContents();
  ok(buttons.length === 14, '14 chapter buttons (' + buttons.length + ')');
  // "7-Zone" is a name; numbering looks like "01 —", "1.", "2)" or "A."
  const numbered = /^\s*(\d+\s*[.)—:]|0\d|[A-Z][.)]\s)/;
  ok(buttons.every((b) => !numbered.test(b)), 'no numbering on chapter buttons');

  /* ---- layout ---- */
  const align = await page.evaluate(() => {
    const r = (s) => __q(s).getBoundingClientRect();
    return { frame: Math.round(r('.ddtv__screen').top - r('.details-product-option--Size').top), lead: Math.round(r('.ddtv-top').top - r('.product-details__layout').top), gap: Math.round(r('.ddtv__bar--top').top - r('.ddtv-top').bottom) };
  });
  ok(Math.abs(align.frame) <= 1, 'monitor top frame aligned with the top of the SIZE row (' + align.frame + 'px)');
  ok(align.lead <= 24, 'no empty band above the header row (' + align.lead + 'px)');
  ok(align.gap <= 26, 'chapter buttons sit close under the header (' + align.gap + 'px)');
  const compact = await page.evaluate(() => ({ btn: __q('.ddtv__bar--bottom .ddtv__btn').offsetHeight, sw: __q('.ddtv-switch button').offsetHeight }));
  ok(compact.btn <= 44 && compact.sw <= 38, 'compact controls (button ' + compact.btn + 'px, switch ' + compact.sw + 'px)');
  const fonts = await page.evaluate(() => [...__qa('.ddtv__btn, .ddtv__tab, .ddtv__nav, .ddtv__play, .ddtv-switch button, .sc-btn, .sc-topic')].map((n) => parseFloat(getComputedStyle(n).fontSize)));
  ok(Math.min(...fonts) >= 13, 'every control keeps a readable size (min ' + Math.min(...fonts) + 'px)');
  ok(!(await page.locator('.product-details__description-title').isVisible()), 'Product Details heading hidden');
  ok(!(await page.locator('#bp-top').isVisible()), 'long description hidden in Interactive View');

  /* ---- every chapter and screen is built from the source ---- */
  const chapters = await page.evaluate(() => DDTV.current.product.chapters.map((c) => ({ id: c.id, panels: c.panels.map((p) => ({ id: p.id, group: p.group || '', result: !!p.result })) })));
  const total = chapters.reduce((n, c) => n + c.panels.length, 0);
  const offenders = new Set();
  let short = 0;
  for (const c of chapters) {
    await page.click(`.ddtv__btn[data-chapter="${c.id}"]`);
    const groups = await page.locator('.ddtv__tabgroup').allTextContents();
    const hasSelect = c.panels.some((p) => p.group === 'Select');
    ok(hasSelect ? groups.join() === 'Select,Learn' : groups.length === 0, `${c.id}: Explore list ${hasSelect ? 'separates Select from Learn' : 'has no group labels'}`);
    for (let i = 0; i < c.panels.length; i++) {
      await page.evaluate(([cid, pid]) => DDTV.current.go(cid, pid), [c.id, c.panels[i].id]);
      await page.waitForTimeout(60);
      const info = await page.evaluate(() => {
        const p = __q('.ddtv__panel.is-active');
        const bad = [];
        for (const n of p.querySelectorAll('*')) {
          const s = getComputedStyle(n), b = n.getBoundingClientRect();
          const r = parseFloat(s.borderTopLeftRadius) || 0, m = Math.min(b.width, b.height);
          if (r > 0 && m >= 8 && r >= m / 2 - 0.5 && !(n.tagName === 'IMG')) bad.push(n.className || n.tagName);
        }
        return { id: p.dataset.panel, len: p.textContent.trim().length, vis: p.offsetHeight > 0, bad };
      });
      if (!(info.id === c.panels[i].id && info.len > 40 && info.vis)) short++;
      info.bad.forEach((b) => offenders.add(c.id + ':' + b));
      if (shots) await (await settle(page)).locator('.ddtv-wrap').screenshot({ path: join(shots, `desktop-${c.id}-${c.panels[i].id}.png`) });
    }
  }
  ok(short === 0, `all ${total} screens render real content`);
  ok(offenders.size === 0, 'no pills or circles anywhere on the screens' + (offenders.size ? ' (' + [...offenders].slice(0, 5).join(', ') + ')' : ''));
  const shell = await page.evaluate(() => [...__qa('.ddtv-wrap *')].filter((n) => { const s = getComputedStyle(n), b = n.getBoundingClientRect(), r = parseFloat(s.borderTopLeftRadius) || 0, m = Math.min(b.width, b.height); return r > 0 && m >= 8 && r >= m / 2 - 0.5 && n.tagName !== 'IMG' && !n.closest('.ddtv__panel'); }).map((n) => n.className));
  ok(shell.length === 0, 'no pills or circles in the shell either' + (shell.length ? ' (' + shell.slice(0, 4).join(', ') + ')' : ''));

  /* ---- Discover, video ---- */
  await page.click('.ddtv__btn[data-chapter="ventilation"]');
  ok(await page.locator('.ddtv__panel.is-active video').isVisible(), 'ventilation video visible as soon as the chapter opens');
  ok(await page.evaluate(() => { const v = __q('.ddtv__panel.is-active video').getBoundingClientRect(), vp = __q('.ddtv__viewport').getBoundingClientRect(); return v.top >= vp.top && v.bottom <= vp.bottom + 2; }), 'ventilation video fully inside the screen without scrolling');
  await page.click('.ddtv__btn[data-chapter="discover"]');
  ok(await page.evaluate(() => !__q('.ddtv-player')), 'full video not created until asked for');
  await page.click('.ddtv__panel.is-active .sc-play');
  ok(await page.locator('.ddtv-player video').isVisible(), 'full video opens inside the monitor');
  ok(await page.evaluate(() => /presentation-full\.mp4$/.test(__q('.ddtv-player video').getAttribute('src'))), 'it plays the original full presentation file');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => !__q('.ddtv-player') && __q('.ddtv__overlay').hidden), 'Escape closes it and releases the file');
  await page.click('.ddtv__panel.is-active .sc-hero .sc-btn--solid');
  ok(await page.locator('.ddtv__btn[data-chapter="firmness"].is-active').count() === 1, 'hero "Choose Your Firmness" opens the Firmness chapter');
  ok(await page.locator('.ddtv__tab.is-active').innerText() === 'Choose', '… on its choose screen');

  /* ---- selection and price: nothing assumed ---- */
  const markup = () => { const c = __q('.product-details__sidebar').cloneNode(true); c.querySelectorAll('.details-product-price__value, .details-product-price__compare').forEach((n) => { n.textContent = ''; }); return c.outerHTML; };
  const before = await page.evaluate(markup);
  ok(await page.locator('.ddtv__chip.is-set').count() === 0, 'no selection assumed before the customer chooses');
  ok(await page.locator('.ddtv__tab.has-value').count() === 0, 'no "ready" ticks before any choice');
  const priceBefore = await page.locator('.ddtv__price-v').innerText();
  ok(priceBefore === (await page.locator('.details-product-price__value').innerText()), 'price shown in the television is the price Ecwid shows (' + priceBefore + ')');
  await page.click('.ddtv__tab:has-text("Your firmness")');
  ok(await page.locator('.ddtv__panel.is-active .sc-empty').isVisible(), '"Your firmness" says nothing is chosen yet (no guess)');
  await page.click('.ddtv__panel.is-active .sc-empty .sc-btn');
  ok(await page.locator('.ddtv__tab.is-active').innerText() === 'Choose', 'its button leads to the choose screen');

  /* ---- choosing inside the television drives the native control ---- */
  await page.evaluate(() => { window.__native = []; __qa('.product-details__sidebar select').forEach((s) => s.addEventListener('change', () => window.__native.push(s.closest('.details-product-option').querySelector('.details-product-option__title').textContent))); });
  await page.locator('.ddtv__panel.is-active .sc-seg', { hasText: 'Extra Firm' }).click();
  ok((await nativeText(page, 'firmness')).startsWith('Extra Firm'), 'tapping Extra Firm in the TV sets the Ecwid dropdown (' + await nativeText(page, 'firmness') + ')');
  await page.locator('.ddtv__panel.is-active .sc-seg:has(.sc-seg__n:text-is("Firm"))').click();
  ok((await nativeText(page, 'firmness')).startsWith('Firm ·'), '"Firm" is not confused with "Extra Firm" (' + await nativeText(page, 'firmness') + ')');
  ok(await page.locator('.ddtv__panel.is-active .sc-seg.is-selected .sc-seg__n').innerText() === 'Firm', 'the tapped range is shown as selected');
  ok(await page.evaluate(() => window.__native.length) >= 2, 'Ecwid received real change events from the television');
  ok(await page.locator('.ddtv__chip[data-opt="firmness"] .ddtv__chip-v').innerText() === 'Firm', '"Your selection" follows at once');
  ok(await page.locator('.ddtv__tab[data-opt="firmness"].has-value').count() === 1, '"Your firmness" is ticked as ready');
  await page.click('.ddtv__tab:has-text("Your firmness")');
  ok(/Firm/.test(await page.locator('.ddtv__panel.is-active .sc-big').innerText()) && /88 – 114 kg/.test(await page.locator('.ddtv__panel.is-active .sc-result').innerText()), '"Your firmness" shows the chosen range from the source text');

  await page.click('.ddtv__btn[data-chapter="height"]');
  await page.locator('.ddtv__panel.is-active .sc-slabcard', { hasText: 'Deep Comfort' }).click();
  ok((await nativeText(page, 'depth')) === '24 cm', 'height tapped in the TV sets the Ecwid dropdown');
  await page.click('.ddtv__tab:has-text("Choose size")');
  await page.locator('.ddtv__panel.is-active .sc-size', { hasText: '180 × 200' }).first().click();
  ok((await nativeText(page, 'size')).includes('180 × 200'), 'size tapped in the TV sets the Ecwid dropdown');
  ok(await page.locator('.ddtv__panel.is-active .sc-print').count() === 1, 'the chosen size is drawn to scale');
  await page.click('.ddtv__btn[data-chapter="covers"]');
  await page.locator('.ddtv__panel.is-active .sc-swatch', { hasText: 'Cotton & Wool' }).click();
  ok((await nativeText(page, 'cover')) === 'Cotton & Wool', 'cover tapped in the TV sets the Ecwid dropdown');
  ok(await page.locator('.ddtv__panel.is-active .sc-viewer__badge').textContent() === 'Selected', 'the texture viewer marks it as selected');
  await page.waitForTimeout(150);
  ok(await page.locator('.ddtv__chip.is-set').count() === 4, 'all four choices appear in "Your selection"');
  const priceAfter = await page.locator('.ddtv__price-v').innerText();
  ok(priceAfter !== priceBefore && priceAfter === (await page.locator('.details-product-price__value').innerText()), 'the price follows Ecwid after the choices (' + priceBefore + ' → ' + priceAfter + ')');
  const after = await page.evaluate(markup);
  ok(after === before, 'Ecwid column markup is unchanged (price text aside, which Ecwid updates): only the chosen values moved');

  // selection made in Ecwid's own dropdown reaches the television too
  await page.selectOption(NATIVE.cover, { index: 3 });
  await page.waitForTimeout(200);
  await page.click('.ddtv__tab:has-text("Your cover")');
  ok(await page.locator('.ddtv__panel.is-active .sc-big').innerText() === 'Aloe Vera + Cotton', 'a choice made in the Ecwid dropdown shows on "Your cover"');
  ok(await page.locator('.ddtv__panel.is-active .sc-result .sc-facts dd').first().innerText() === '+2 cm total (1 cm top + 1 cm bottom)', 'cover facts come from the source text');
  await page.click('.ddtv__btn[data-chapter="height"]');
  ok(await page.locator('.ddtv__tab.is-active').innerText() === 'Choose height', 'changing options never moved the customer away from what they were reading');

  /* ---- summary and brand ---- */
  await page.click('.ddtv__btn[data-chapter="delivery"]');
  await page.locator('.ddtv__tab:has-text("Your Botanic")').click();
  const sum = await page.locator('.ddtv__panel.is-active .sc-sum').innerText();
  ok(/Firm/.test(sum) && /24 cm/.test(sum) && /Aloe Vera/.test(sum) && /180/.test(sum) && /Every choice is made/.test(sum), 'summary confirms the whole configuration');
  ok(/£/.test(await page.locator('.ddtv__panel.is-active .sc-sum__price').innerText()), 'summary shows the Ecwid price');
  ok(await page.locator('.ddtv__panel.is-active .sc-sum__sign .ddtv-mark').innerText().then((t) => /Divine\s*DunlopDreams/.test(t)), 'the brand mark signs off the summary');
  if (shots) await (await settle(page)).locator('.ddtv-wrap').screenshot({ path: join(shots, 'desktop-summary-done.png') });

  /* ---- presentation ---- */
  await page.evaluate(() => { DDTV.current.opts.tourMin = 250; DDTV.current.opts.tourMax = 250; });
  await page.click('.ddtv__btn[data-chapter="firmness"]');
  await page.click('.ddtv__play');
  await page.evaluate(() => DDTV.current.step(1));
  ok(await page.locator('.ddtv__tab.is-active').innerText() === 'Correct vs Softer', 'the presentation skips "Your …" screens');
  await page.waitForTimeout(700);
  ok(await page.evaluate(() => DDTV.current.playing), 'the presentation keeps going on its own');
  await page.click('.ddtv__btn[data-chapter="comfort"]');
  ok(!(await page.evaluate(() => DDTV.current.playing)), 'manual navigation pauses the presentation');

  /* ---- Classic View ---- */
  await page.click('.ddtv-switch button[data-view="classic"]');
  const classic = await page.evaluate(() => ({
    tv: __q('.ddtv').hidden,
    sections: __qa('#bp-top section[id^="bp-"]').length,
    videos: __qa('video').length,
    numbering: __q('#bp-firmness .b-sh__n').offsetParent !== null,
    order: [...__qa('#bp-top section[id^="bp-"]')].map((s) => s.id).join(','),
    firmSel: __qa('#bp-top .b-fc.ddtv-selected').length,
    kept: __q('.details-product-option--Cover s select, .details-product-option--Covers select').selectedIndex,
    inHeroFrame: !!__q('#bp-main-video-card .b-main-video-frame video'),
  }));
  ok(classic.tv, 'television hidden in Classic View');
  ok(classic.sections === 13, 'Classic View has all 13 original sections (' + classic.sections + ')');
  ok(classic.videos === 7 && classic.inHeroFrame, 'the 7 original videos are back where they were, none duplicated (' + classic.videos + ')');
  ok(classic.numbering, 'original section numbering visible in Classic View');
  ok(classic.order === 'bp-firmness,bp-comfort,bp-height,bp-covers,bp-benefits,bp-support,bp-adaptation,bp-zones,bp-ventilation,bp-hygiene,bp-certs,bp-warranty,bp-delivery', 'original section order preserved');
  ok(classic.kept === 3, 'selections kept when switching view');
  ok(classic.firmSel === 1, 'the customer\'s firmness is highlighted on the original card in Classic View');
  if (shots) await (await settle(page)).screenshot({ path: join(shots, 'desktop-classic.png') });
  await page.click('.ddtv-switch button[data-view="interactive"]');
  ok(await page.locator('.ddtv').isVisible() && await page.evaluate(() => __qa('video').length) === 7, 'back to Interactive View, still 7 videos');
  ok(await page.locator('.ddtv__chip.is-set').count() === 4, 'choices survive a view round trip');
  await ctx.close();
}

/* ====================================================================== */
/* Brand moment                                                            */
/* ====================================================================== */
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, {}, { splash: true });
  const shown = await page.evaluate(() => { const b = __q('.ddtv__brand'); return b.classList.contains('is-on') && /Divine\s*DunlopDreams/.test(b.textContent) && getComputedStyle(b).pointerEvents === 'none'; });
  ok(shown, 'the brand mark appears when the television first opens, without blocking input');
  await page.click('.ddtv__btn[data-chapter="comfort"]');
  ok(await page.locator('.ddtv__btn[data-chapter="comfort"].is-active').count() === 1, 'the chapter buttons work while it is showing');
  await page.waitForTimeout(1800);
  ok(await page.evaluate(() => __q('.ddtv__brand').hidden), 'it fades away on its own');
  await ctx.close();
}

/* ====================================================================== */
/* iPad landscape and portrait                                             */
/* ====================================================================== */
for (const [name, vp] of [['ipad-landscape', { width: 1180, height: 820 }], ['ipad-portrait', { width: 820, height: 1180 }]]) {
  const { ctx, page, errors } = await open(vp, { hasTouch: true });
  ok(errors.length === 0, `no page errors on ${name}`);
  ok(await page.locator('.ddtv').isVisible(), `television visible on ${name}`);
  ok(await page.evaluate(() => __q('.ddtv').getBoundingClientRect().height <= window.innerHeight), `television fits within the ${name} viewport`);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `no horizontal page scroll on ${name}`);
  await page.tap('.ddtv__btn[data-chapter="firmness"]');
  await page.locator('.ddtv__panel.is-active .sc-seg', { hasText: 'Medium' }).tap();
  await page.tap('.ddtv__btn[data-chapter="height"]');
  await page.locator('.ddtv__panel.is-active .sc-slabcard').nth(1).tap();
  await page.tap('.ddtv__btn[data-chapter="covers"]');
  await page.locator('.ddtv__panel.is-active .sc-swatch').nth(2).tap();
  await page.tap('.ddtv__tab:has-text("Choose")');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => { const a = __q('.ddtv__aside').getBoundingClientRect(); return __qa('.ddtv__chip.is-set').length === 3 && [...__qa('.ddtv__chip')].every((c) => c.getBoundingClientRect().bottom <= a.bottom + 1); }), `choices made by touch show in Your selection on ${name}`);
  const fits = await page.evaluate(() => {
    // each screen must stay inside the monitor horizontally (no sideways scrolling)
    const bad = [];
    for (const p of __qa('.ddtv__panel')) { if (p.scrollWidth > p.clientWidth + 2) bad.push(p.dataset.chapter + '/' + p.dataset.panel); }
    return bad;
  });
  ok(fits.length === 0, `no screen scrolls sideways on ${name}` + (fits.length ? ': ' + fits.join(',') : ''));
  if (shots) {
    for (const [c, pn] of [['firmness', 'choose'], ['covers', 'choose'], ['height', 'sizes'], ['zones', 'map']]) {
      await page.evaluate(([c, pn]) => DDTV.current.go(c, pn), [c, pn]);
      await (await settle(page)).locator('.ddtv-wrap').screenshot({ path: join(shots, `${name}-${c}-${pn}.png`) });
    }
  }
  await ctx.close();
}

/* ====================================================================== */
/* iPhone: Classic View only                                               */
/* ====================================================================== */
{
  const { ctx, page, errors } = await open(devices['iPhone 13'].viewport, { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  ok(errors.length === 0, 'no page errors on iPhone');
  ok(!(await page.locator('.ddtv').isVisible()), 'no television on iPhone');
  ok(!(await page.locator('.ddtv-switch').isVisible()), 'no view switch on iPhone');
  ok(await page.locator('#bp-firmness').isVisible(), 'Classic View content visible on iPhone');
  ok(await page.evaluate(() => __qa('video[data-ddtv-parked]').length) >= 6, 'off-screen videos deferred on iPhone');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal page scroll on iPhone');
  if (shots) await (await settle(page)).screenshot({ path: join(shots, 'iphone.png') });
  await ctx.close();
}

/* ====================================================================== */
/* Kill switch, and the native column with the engine off / on             */
/* ====================================================================== */
{
  const snapshot = () => {
    const side = __q('.product-details__sidebar');
    const r = side.getBoundingClientRect();
    const clone = side.cloneNode(true);
    clone.querySelectorAll('.details-product-price__value, .details-product-price__compare').forEach((n) => { n.textContent = ''; });
    const look = [...side.querySelectorAll('*')].filter((n) => !n.closest('.mock-price')).map((n) => {
      const s = getComputedStyle(n), b = n.getBoundingClientRect();
      return [n.tagName, s.display, s.visibility, s.fontSize, s.color, s.backgroundColor, s.borderRadius, Math.round(b.width), Math.round(b.height)].join('|');
    });
    return { html: clone.outerHTML, box: [r.left, r.width, r.height].map(Math.round).join(','), look: look.join('\n') };
  };
  const take = async (q, act) => {
    const { ctx, page } = await open({ width: 1440, height: 900 }, {}, { query: q });
    if (act) await act(page);
    const s = await page.evaluate(snapshot);
    const killed = (await page.locator('.ddtv').count()) === 0 && (await page.locator('#bp-top').isVisible());
    await ctx.close();
    return { ...s, killed };
  };
  const off = await take('?ddtv=off');
  ok(off.killed, '?ddtv=off leaves the original page untouched');
  const on = await take('');
  const classic = await take('', (p) => p.click('.ddtv-switch button[data-view="classic"]'));
  const touched = await take('', async (p) => { await p.click('.ddtv__btn[data-chapter="firmness"]'); await p.locator('.ddtv__panel.is-active .sc-seg').nth(1).click(); await p.click('.ddtv__btn[data-chapter="discover"]'); });
  ok(on.html === off.html && classic.html === off.html, 'Ecwid options column markup identical with the TV off, on and in Classic View');
  ok(on.look === off.look && classic.look === off.look && touched.look === off.look, 'Ecwid controls keep exactly their own styling and size');
  ok(on.box === off.box && touched.box === off.box, 'Ecwid options column keeps its position and size (' + on.box + ')');
  ok(touched.html === off.html, 'after a choice made in the TV the Ecwid markup is still identical (only the chosen value changed)');
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
