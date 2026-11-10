// Drafts a media manifest for the Product TV's View Model Gallery from an export of an Ecwid product.
//
//   node tools/media-manifest.mjs <product.json> --product-id 876405767 [--store-id 100333285]
//        [--out products/botanic.media.js] [--var botanic] [--merge products/botanic.media.js]
//
// Input (what was verified): an object with `mediaItems` (the storefront's product media records) or the full
// storefront product record (`defaultOptionsOverrides.variationOverrides.mediaItems`). A REST-API-shaped product
// (`media.images`) is accepted too; its field names match, but that shape was NOT verified (the API documentation
// could not be reached when this was written).
//
// What it does: copies the image records AS ECWID RETURNED THEM (ids, sizes, the five file addresses, alt text).
// It invents no address and derives none. It adds the fields only we own: `category` and `customerGallery`.
//   * first run:  every image is listed for the customer gallery, the main image as category 'main', the rest
//                 'gallery'. Trim and classify them by hand.
//   * --merge:    images already in the existing manifest keep their classification; images that are new in
//                 Ecwid are added as 'unclassified' and NOT shown to customers until classified; images that
//                 are no longer in Ecwid are dropped (and reported).
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : undefined; };
const file = args[0];
if (!file || file.startsWith('--')) { console.error('usage: node tools/media-manifest.mjs <product.json> --product-id N [--store-id N] [--out file.js] [--var botanic] [--merge existing.js]'); process.exit(2); }
const productId = Number(flag('product-id'));
if (!productId) { console.error('--product-id is required (the product the manifest is for)'); process.exit(2); }
const storeId = flag('store-id') ? Number(flag('store-id')) : undefined;
const variable = flag('var') || 'botanic';
const out = flag('out');
const mergeFrom = flag('merge');

const raw = JSON.parse(readFileSync(file, 'utf8'));
const items =
  raw.mediaItems ||
  raw?.defaultOptionsOverrides?.variationOverrides?.mediaItems ||
  raw?.media?.images ||
  null;
if (!Array.isArray(items) || !items.length) { console.error('No image records found (looked for mediaItems, defaultOptionsOverrides.variationOverrides.mediaItems, media.images).'); process.exit(1); }
const shape = raw.mediaItems ? 'storefront media items' : raw?.defaultOptionsOverrides ? 'storefront product record' : 'REST-shaped media.images (field names not verified)';

const KEEP = ['id', 'isMain', 'width', 'height', 'image160pxUrl', 'image400pxUrl', 'image800pxUrl', 'image1500pxUrl', 'imageOriginalUrl', 'alt', 'altType'];
const assetId = (u) => (/\/(\d+)\.[a-z0-9]+(?:[?#].*)?$/i.exec(String(u || '')) || [])[1] || '';
const keyOf = (m) => assetId(m.imageOriginalUrl || m.image1500pxUrl || m.image800pxUrl || m.image400pxUrl || m.image160pxUrl);

let existing = null;
if (mergeFrom) {
  const sandbox = { window: { DDTV_PRODUCTS: { [variable]: {} } } };
  sandbox.window.window = sandbox.window;
  runInNewContext(readFileSync(mergeFrom, 'utf8'), sandbox);
  existing = sandbox.window.DDTV_PRODUCTS[variable].mediaManifest;
  if (!existing) { console.error(`${mergeFrom} has no manifest to merge (mediaManifest is null).`); process.exit(1); }
}
const known = new Map();
if (existing) for (const im of existing.images) known.set(keyOf(im), im);

const added = [], kept = [], images = [];
items.forEach((m) => {
  const rec = {};
  KEEP.forEach((k) => { if (m[k] !== undefined && m[k] !== null && m[k] !== '') rec[k] = m[k]; });
  const key = keyOf(m);
  const old = known.get(key);
  if (existing && old) { rec.category = old.category; rec.customerGallery = old.customerGallery; if (old.usedIn) rec.usedIn = old.usedIn; if (old.caption) rec.caption = old.caption; kept.push(key); }
  else if (existing) { rec.category = 'unclassified'; rec.customerGallery = false; added.push(key); }
  else { rec.category = m.isMain ? 'main' : 'gallery'; rec.customerGallery = true; }
  images.push(rec);
});
const dropped = existing ? [...known.keys()].filter((k) => !items.some((m) => keyOf(m) === k)) : [];

const manifest = {
  version: 1,
  source: 'Ecwid product record (' + shape + ')',
  generatedAt: new Date().toISOString(),
  storeId,
  productId,
  order: 'ecwid',          // 'ecwid': the store's order (reordering in Ecwid works). 'manifest': the order below.
  unlisted: 'hide',        // images uploaded later and not listed here: 'hide' (default) or 'show'
  categories: {
    main: 'Main product images',
    gallery: 'Product gallery images',
    'latex-core': 'Latex core and construction',
    'seven-zone': 'Seven-zone structure',
    covers: 'Cotton and other available covers',
    details: 'Product details',
    lifestyle: 'Lifestyle images',
    technical: 'Technical illustrations',
    shared: 'Shared educational resources',
    unclassified: 'Not yet classified'
  },
  images
};

const header = `/* Media manifest for ${variable} (product ${productId}). GENERATED by tools/media-manifest.mjs on ${manifest.generatedAt}.
 * Addresses, sizes and alt texts are copied from the Ecwid product record. Do not type addresses by hand.
 * Yours to edit: for each image, \`category\` and \`customerGallery\` (false = a supporting resource used elsewhere,
 * not shown in the customer gallery), and optionally \`caption\` and \`usedIn\`.
 * Categories: ${Object.keys(manifest.categories).join(', ')}. */
`;
const text = header + '(function (global) {\n  global.DDTV_PRODUCTS.' + variable + '.mediaManifest = ' + JSON.stringify(manifest, null, 2).replace(/\n/g, '\n  ') + ';\n})(window);\n';

if (out) { writeFileSync(out, text); console.log('Wrote ' + out); } else process.stdout.write(text);
console.error(`${images.length} image(s) from ${shape}.` + (existing ? ` Kept ${kept.length}, new and hidden until classified ${added.length}, dropped ${dropped.length}.` : ' All listed for the customer gallery; classify them.'));
if (dropped.length) console.error('Dropped (no longer in the product): ' + dropped.join(', '));
if (added.length) console.error('New (hidden, category unclassified): ' + added.join(', '));
