// READ-ONLY. Captures the image records the storefront itself loads for the PUBLIC live product, as a test fixture.
// Only the public CDN URLs, sizes and alt texts are saved; no tokens, no request headers.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  let body = null;
  p.on('response', async (r) => { if (/\/catalog\/product$/.test(r.url().split('?')[0]) && r.request().method() === 'POST') { try { body = JSON.parse(await r.text()); } catch (e) {} } });
  await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.details-gallery__thumbs', { timeout: 45000 });
  await p.waitForTimeout(4000);
  if (!body) { console.error('no product response captured'); process.exit(1); }
  // Where do image arrays live, and do option choices have their own media?
  const paths = [];
  (function walk(v, pth, d) { if (d > 9 || !v || typeof v !== 'object') return; if (Array.isArray(v)) { if (v.length && v[0] && typeof v[0] === 'object' && 'image800pxUrl' in v[0]) paths.push(pth + ' len ' + v.length); v.slice(0, 40).forEach((x, i) => walk(x, pth + '[]', d + 1)); return; } for (const k of Object.keys(v)) { if (/token|secret|password/i.test(k)) continue; walk(v[k], pth + '.' + k, d + 1); } })(body, '$', 0);
  console.log('image arrays in the product response:'); [...new Set(paths)].slice(0, 12).forEach((x) => console.log('  ', x));
  console.log('top-level keys:', Object.keys(body).slice(0, 40).join(','));
  const items = body.defaultOptionsOverrides.variationOverrides.mediaItems;
  const out = { capturedAt: new Date().toISOString(), note: 'Public live product; fields as returned by the storefront API. Used only as a test fixture.', storeId: 100333285, productId: 831592302,
    mediaItems: items.map((m) => ({ type: m.type, id: m.id, isMain: m.isMain, width: m.width, height: m.height, image160pxUrl: m.image160pxUrl, image400pxUrl: m.image400pxUrl, image800pxUrl: m.image800pxUrl, image1500pxUrl: m.image1500pxUrl, imageOriginalUrl: m.imageOriginalUrl, alt: m.alt, altType: m.altType })) };
  fs.writeFileSync(path.join(__dirname, '..', 'fixtures', 'live-media-831592302.json'), JSON.stringify(out, null, 2));
  console.log('saved', out.mediaItems.length, 'items;', 'altTypes:', [...new Set(out.mediaItems.map((m) => m.altType))].join(','), '| main flags:', out.mediaItems.filter((m) => m.isMain).length, '| ids:', out.mediaItems.map((m) => m.id).join(','));
  console.log('alt empty count:', out.mediaItems.filter((m) => !m.alt || !m.alt.trim()).length, '| types:', [...new Set(out.mediaItems.map((m) => m.type))].join(','));
  console.log('sizes (w x h):', [...new Set(out.mediaItems.map((m) => m.width + 'x' + m.height))].join(' '));
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
