// Smoke test for the Experience TV prototype.
//   node tools/build.mjs && node tests/smoke.mjs [screenshot-dir]
// Uses the pre-installed Playwright + Chromium. External media may be
// blocked in CI; the test checks structure and behaviour, not playback.
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

let failures = 0;
// Let transitions finish and move the pointer away before a screenshot.
const settle = async (page) => { await page.mouse.move(0, 0); await page.waitForTimeout(450); return page; };
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };

const browser = await chromium.launch();

async function open(viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...extra });
  await ctx.route(/^https?:\/\//, (r) => r.abort()); // offline: no media, no fonts
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}

/* ---------- Desktop ---------- */
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
  const heads = await page.evaluate(() => [...document.querySelectorAll('.ddtv__tab, .ddtv__title')].map((n) => n.textContent));
  ok(heads.every((h) => !numbered.test(h)), 'no numbering in screen headings or tabs');

  // Alignment: top bar vs SIZE block
  const align = await page.evaluate(() => {
    const bar = document.querySelector('.ddtv__bar--top').getBoundingClientRect().top;
    const size = document.querySelector('.details-product-option--Size').getBoundingClientRect().top;
    return Math.round(bar - size);
  });
  ok(Math.abs(align) <= 2, 'top navigation row aligned with SIZE selector (' + align + 'px)');

  // Product Details heading and description hidden in Interactive View
  ok(!(await page.locator('.product-details__description-title').isVisible()), 'Product Details heading hidden');
  ok(!(await page.locator('#bp-top').isVisible()), 'long description hidden in Interactive View');

  // Every chapter and every internal panel has visible content
  const chapters = await page.evaluate(() => DDTV.current.product.chapters.map((c) => ({ id: c.id, panels: c.panels.map((p) => p.id) })));
  for (const c of chapters) {
    await page.click(`.ddtv__btn[data-chapter="${c.id}"]`);
    for (let i = 0; i < c.panels.length; i++) {
      await page.locator('.ddtv__tab').nth(i).click();
      const info = await page.evaluate(() => {
        const p = document.querySelector('.ddtv__panel.is-active');
        return { id: p && p.dataset.panel, len: p ? p.innerText.trim().length : 0, visible: p && p.offsetHeight > 0 };
      });
      ok(info.id === c.panels[i] && info.len > 40 && info.visible, `${c.id}/${c.panels[i]} shows content (${info.len} chars)`);
      if (shots && i === 0) await (await settle(page)).locator('.ddtv-wrap').screenshot({ path: join(shots, `desktop-${c.id}.png`) });
    }
  }

  // Ventilation: video visible immediately on opening the chapter
  await page.click('.ddtv__btn[data-chapter="ventilation"]');
  ok(await page.locator('.ddtv__panel.is-active video').isVisible(), 'ventilation video visible on chapter open');
  const vidTop = await page.evaluate(() => {
    const v = document.querySelector('.ddtv__panel.is-active video').getBoundingClientRect();
    const vp = document.querySelector('.ddtv__viewport').getBoundingClientRect();
    return v.top >= vp.top && v.bottom <= vp.bottom + 2;
  });
  ok(vidTop, 'ventilation video fully inside the screen without scrolling');

  // Discover: full video plays inside the screen
  await page.click('.ddtv__btn[data-chapter="discover"]');
  await page.locator('.ddtv__tab').first().click();
  await page.click('.ddtv a[href="#botanic-main-video-modal"]');
  ok(await page.locator('.ddtv__overlay .b-video-modal.is-open').isVisible(), 'full video opens inside the screen');
  ok(await page.evaluate(() => !!document.querySelector('.ddtv__overlay video source[src*="presentation-full"]')), 'full video source loaded on demand');
  await page.keyboard.press('Escape');
  ok(!(await page.locator('.ddtv__overlay').isVisible()), 'Escape closes the full video');

  // In-content anchor navigates to the chapter
  await page.click('.ddtv .b-btn-hero-p');
  ok(await page.locator('.ddtv__btn[data-chapter="firmness"].is-active').count() === 1, 'hero "Choose Your Firmness" opens Firmness chapter');

  // Ecwid sync: nothing selected yet
  ok((await page.locator('.ddtv__chip.is-set').count()) === 0, 'no selection assumed before the customer chooses');
  await page.click('label[for="o-fm"]');
  await page.click('label[for="o-d24"]');
  await page.click('label[for="o-c3"]');
  await page.selectOption('.details-product-option--Size select', { index: 17 }); // Super King
  await page.waitForTimeout(250);
  ok(await page.evaluate(() => DDTV.current.chapterIndex) === 1, 'changing options does not move the customer off the current chapter');
  const sync = await page.evaluate(() => ({
    firm: [...document.querySelectorAll('.b-fc.ddtv-selected .b-fc__name')].map((n) => n.textContent.trim()),
    depth: [...document.querySelectorAll('.b-hcol.ddtv-selected .b-hcol__cm')].map((n) => n.textContent.trim()),
    size: [...document.querySelectorAll('.b-si.ddtv-selected .b-si__n')].map((n) => n.textContent.trim()),
    cover: document.querySelector('#bp-cover-micro-3').checked,
    chips: document.querySelectorAll('.ddtv__chip.is-set').length,
    depthViz: [...document.querySelectorAll('.ddtv-depth__col.is-selected')].map((n) => n.dataset.depth),
  }));
  ok(sync.firm.join() === 'Medium', 'firmness card follows native selection (' + sync.firm + ')');
  ok(sync.depth.join() === '24', 'height column follows native Depth (' + sync.depth + ')');
  ok(sync.size.join() === 'Super King', 'size reference follows native Size (' + sync.size + ')');
  ok(sync.cover, 'cover texture viewer shows the selected cover');
  ok(sync.chips === 4, 'all four selection chips set');
  ok(sync.depthViz.join() === '24', 'depth visualisation follows native Depth');

  await page.click('label[for="o-fx"]');
  await page.waitForTimeout(150);
  ok((await page.evaluate(() => [...document.querySelectorAll('.b-fc.ddtv-selected .b-fc__name')].map((n) => n.textContent.trim()).join())) === 'Extra Firm', '"Extra Firm" is not confused with "Firm"');

  await page.click('.ddtv__btn[data-chapter="delivery"]');
  await page.locator('.ddtv__tab').nth(1).click();
  const summary = await page.locator('.ddtv-summary').innerText();
  ok(/Extra Firm/.test(summary) && /115\+ kg/.test(summary) && /Aloe Vera/.test(summary) && /24 cm/.test(summary), 'summary confirms the full configuration from content');
  if (shots) await (await settle(page)).locator('.ddtv-wrap').screenshot({ path: join(shots, 'desktop-summary.png') });

  // Play presentation advances on its own
  await page.click('.ddtv__btn[data-chapter="comfort"]');
  await page.evaluate(() => { DDTV.current.opts.tourMin = 300; DDTV.current.opts.tourMax = 300; });
  await page.click('.ddtv__play');
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => DDTV.current.product.chapters[DDTV.current.chapterIndex].id);
  ok(after !== 'comfort' || (await page.evaluate(() => DDTV.current.panelIndex.comfort)) > 0, 'play presentation advances');
  await page.click('.ddtv__btn[data-chapter="comfort"]');
  ok(!(await page.evaluate(() => DDTV.current.playing)), 'manual navigation pauses the presentation');

  // Classic View restores the original page exactly once
  await page.click('.ddtv-switch button[data-view="classic"]');
  const classic = await page.evaluate(() => ({
    tv: document.querySelector('.ddtv').hidden,
    sections: document.querySelectorAll('#bp-top section[id^="bp-"]').length,
    videos: document.querySelectorAll('video').length,
    numbering: document.querySelector('#bp-firmness .b-sh__n').offsetParent !== null,
    order: [...document.querySelectorAll('#bp-top section[id^="bp-"]')].map((s) => s.id).join(','),
    firmSel: document.querySelectorAll('#bp-top .b-fc.ddtv-selected').length,
    radio: document.querySelector('#o-fx').checked,
  }));
  ok(classic.tv, 'television hidden in Classic View');
  ok(classic.sections === 13, 'Classic View has all 13 original sections (' + classic.sections + ')');
  ok(classic.videos === 7, 'exactly 7 videos in the page, no duplicates (' + classic.videos + ')');
  ok(classic.numbering, 'original section numbering visible in Classic View');
  ok(classic.order === 'bp-firmness,bp-comfort,bp-height,bp-covers,bp-benefits,bp-support,bp-adaptation,bp-zones,bp-ventilation,bp-hygiene,bp-certs,bp-warranty,bp-delivery', 'original section order preserved');
  ok(classic.radio, 'native selections untouched by view switch');
  ok(classic.firmSel === 1, 'selection highlight also shown in Classic View');
  if (shots) await (await settle(page)).screenshot({ path: join(shots, 'desktop-classic.png') });

  await page.click('.ddtv-switch button[data-view="interactive"]');
  ok(await page.locator('.ddtv').isVisible(), 'switch back to Interactive View');
  ok(await page.evaluate(() => document.querySelectorAll('video').length) === 7, 'still 7 videos after round trip');

  if (shots) {
    await page.click('.ddtv__btn[data-chapter="discover"]');
    await page.locator('.ddtv__tab').first().click();
    await (await settle(page)).screenshot({ path: join(shots, 'desktop-page.png') });
  }
  await ctx.close();
}

/* ---------- iPad landscape and portrait ---------- */
for (const [name, vp] of [['ipad-landscape', { width: 1180, height: 820 }], ['ipad-portrait', { width: 820, height: 1180 }]]) {
  const { ctx, page, errors } = await open(vp, { hasTouch: true });
  ok(errors.length === 0, `no page errors on ${name}`);
  ok(await page.locator('.ddtv').isVisible(), `television visible on ${name}`);
  const fits = await page.evaluate(() => document.querySelector('.ddtv').getBoundingClientRect().height <= window.innerHeight);
  ok(fits, `television fits within the ${name} viewport`);
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  ok(noHScroll, `no horizontal page scroll on ${name}`);
  if (shots) {
    await page.click('.ddtv__btn[data-chapter="firmness"]');
    await (await settle(page)).locator('.ddtv-wrap').screenshot({ path: join(shots, `${name}-firmness.png`) });
  }
  await ctx.close();
}

/* ---------- iPhone: Classic View only ---------- */
{
  const { ctx, page, errors } = await open(devices['iPhone 13'].viewport, { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  ok(errors.length === 0, 'no page errors on iPhone');
  ok(!(await page.locator('.ddtv').isVisible()), 'no television on iPhone');
  ok(!(await page.locator('.ddtv-switch').isVisible()), 'no view switch on iPhone');
  ok(await page.locator('#bp-firmness').isVisible(), 'Classic View content visible on iPhone');
  const parked = await page.evaluate(() => document.querySelectorAll('video[data-ddtv-parked]').length);
  ok(parked >= 6, 'off-screen videos deferred on iPhone (' + parked + ' parked)');
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  ok(noHScroll, 'no horizontal page scroll on iPhone');
  if (shots) await (await settle(page)).screenshot({ path: join(shots, 'iphone.png') });
  await ctx.close();
}

/* ---------- Kill switch ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/^https?:\/\//, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(url + '?ddtv=off');
  ok((await page.locator('.ddtv').count()) === 0 && (await page.locator('#bp-top').isVisible()), '?ddtv=off leaves the original page untouched');
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
