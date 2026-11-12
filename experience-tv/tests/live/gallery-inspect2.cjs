// READ-ONLY. (A) Which network response carries the product's image data and what does it look like?
// (B) The full image-set of the thumbnails. (C) Lifecycle of the native gallery element when the customer
// interacts or navigates. Local browser, public product, nothing saved. Tokens are masked in the output.
const { chromium } = require('playwright');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const mask = (u) => u.replace(/([?&](?:token|public_token|appClientId|key)=)[^&]+/gi, '$1***');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const found = [];
  p.on('response', async (r) => {
    const u = r.url(), ct = r.headers()['content-type'] || '';
    if (!/json/.test(ct)) return;
    if (!/(831592302|products|graphql|storefront)/i.test(u)) return;
    let txt = ''; try { txt = await r.text(); } catch (e) { return; }
    if (!/(galleryImages|imageUrl|image1500pxUrl|imageOriginalUrl|"media"|hdThumbnailUrl)/.test(txt)) return;
    found.push({ url: mask(u), method: r.request().method(), status: r.status(), len: txt.length, txt });
  });
  await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.details-gallery__thumbs', { timeout: 45000 });
  await p.waitForTimeout(4000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}

  console.log('=== A. responses that carry image data ===', found.length);
  found.slice(0, 4).forEach((f) => {
    console.log(f.method, f.status, f.len + ' bytes', f.url.slice(0, 220));
    try {
      const j = JSON.parse(f.txt);
      const walk = (v, path, d) => { if (d > 8 || !v || typeof v !== 'object') return; if (Array.isArray(v)) { if (v.length && v[0] && typeof v[0] === 'object' && /image|media|gallery/i.test(path)) { console.log('  ARRAY', path, 'len', v.length, 'item keys:', Object.keys(v[0]).join(',')); console.log('   sample:', JSON.stringify(v[0]).slice(0, 900)); } v.slice(0, 1).forEach((x, i) => walk(x, path + '[]', d + 1)); return; } for (const k of Object.keys(v)) { if (/token|secret|password/i.test(k)) continue; if (/^(imageUrl|thumbnailUrl|hdThumbnailUrl|originalImageUrl|smallThumbnailUrl|alt|media|galleryImages|images)$/i.test(k) && !Array.isArray(v[k]) && typeof v[k] !== 'object') console.log('  FIELD', path + '.' + k, '=', String(v[k]).slice(0, 150)); walk(v[k], path + '.' + k, d + 1); } };
      walk(j, '$', 0);
    } catch (e) { console.log('  (not parseable)', e.message); }
  });

  const thumbs = await p.evaluate(() => [...document.querySelectorAll('.details-gallery__thumb-img, .details-gallery__thumb-bg')].slice(0, 4).map((e) => getComputedStyle(e).backgroundImage.slice(0, 600)));
  console.log('\n=== B. thumbnail image-set (first 4) ===');
  thumbs.forEach((t, i) => console.log(' ', i, t));

  // C. lifecycle
  await p.evaluate(() => {
    window.__g = document.querySelector('.product-details__gallery');
    window.__mut = { n: 0, added: 0, removed: 0 };
    window.__mo = new MutationObserver((ms) => ms.forEach((m) => { window.__mut.n++; window.__mut.added += m.addedNodes.length; window.__mut.removed += m.removedNodes.length; }));
    window.__mo.observe(window.__g, { childList: true, subtree: true });
  });
  const probe = (label) => p.evaluate((label) => {
    const g = document.querySelector('.product-details__gallery');
    return { label, sameElement: g === window.__g, mut: JSON.stringify(window.__mut), thumbs: g ? g.querySelectorAll('.details-gallery__thumb').length : null, activeThumb: g ? [...g.querySelectorAll('.details-gallery__thumb')].findIndex((t) => t.classList.contains('details-gallery__thumb--active')) : null, mainSrc: g && g.querySelector('.details-gallery__picture') ? g.querySelector('.details-gallery__picture').getAttribute('src').split('/').pop() : null, pswp: !!document.querySelector('.pswp'), galleryInlineStyle: g ? g.getAttribute('style') : null };
  }, label);
  console.log('\n=== C. lifecycle ===');
  console.log(JSON.stringify(await probe('start')));
  await p.locator('.details-gallery__thumb').nth(3).click().catch((e) => console.log('thumb click failed', e.message.slice(0, 80)));
  await p.waitForTimeout(1200);
  console.log(JSON.stringify(await probe('after thumb 4 clicked')));
  const sels = p.locator('.details-product-option select');
  await sels.nth(1).selectOption({ index: 2 }); await sels.nth(2).selectOption({ index: 2 });
  await p.waitForTimeout(1500);
  console.log(JSON.stringify(await probe('after options chosen')));
  await p.evaluate(() => Ecwid.openPage('category', { id: 0 })); await p.waitForTimeout(3500);
  console.log(JSON.stringify(await probe('on category page')));
  await p.goBack({ timeout: 30000 }).catch(() => {}); await p.waitForSelector('.details-gallery__thumbs', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(2500);
  console.log(JSON.stringify(await probe('after back (same element?)')));
  await p.setViewportSize({ width: 820, height: 1180 }); await p.waitForTimeout(1500);
  console.log(JSON.stringify(await probe('after resize to 820')));
  const mobile = await p.evaluate(() => ({ cls: document.querySelector('.product-details__gallery').className, thumbsDisplay: getComputedStyle(document.querySelector('.details-gallery__thumbs')).display, scrollDots: getComputedStyle(document.querySelector('.details-gallery__scroll')).display }));
  console.log('at 820:', JSON.stringify(mobile));
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
