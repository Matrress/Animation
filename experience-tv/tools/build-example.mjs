// Builds the NON-PRODUCTION second-model page: dist/examples/placeholder-model-page.html
//
//   node tools/build-example.mjs
//
// The same stand-in store page as the Botanic prototype (prototype/template.html), with only the model-specific
// parts swapped: the heading, the option blocks, the description and the config. The engine, the scene library, the
// gallery and the store profile are the SAME files the Botanic build uses, byte for byte. Never shipped; never part of
// a production embed (tools/build-embed.mjs does not know this file).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mockGalleryHtml, MOCK_GALLERY_SCRIPT } from './mock-gallery.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Invented image records for the stand-in gallery (the placeholder model has no real photographs).
const placeholderImages = [1, 2, 3, 4].map((n) => {
  const u = (w, k) => `https://placeholder.invalid/images/900000001/products/900000001/${7000000 + n * 10 + k}.svg`;
  return { type: 'PICTURE', id: String(n - 1), isMain: n === 1, width: 1500, height: 1000, alt: `Placeholder photograph ${n} (not a real product)`,
    image160pxUrl: u(160, 1), image400pxUrl: u(400, 2), image800pxUrl: u(800, 3), image1500pxUrl: u(1500, 4), imageOriginalUrl: u(0, 5) };
});

const head = `<h1 class="product-details__product-title">Placeholder Model | NOT A PRODUCT</h1>
        <div class="mock-price"><span class="details-product-price__value">£0</span></div>
        <p class="mock-text">Placeholder text standing in for the store's short description.</p>`;
const options = `<div class="product-details-module details-product-option details-product-option--MATTRESS-SIZE details-product-option--select">
          <div class="product-details-module__title ec-header-h6 details-product-option__title">MATTRESS SIZE</div>
          <select aria-label="MATTRESS SIZE">
            <option value="">Please choose</option>
            <option>Single 90x190 cm (+£10)</option>
            <option>Double 135x190 cm (+£30)</option>
            <option>King 150x200 cm (+£50)</option>
          </select>
        </div>
        <div class="product-details-module details-product-option details-product-option--SUPPORT-LEVEL details-product-option--select">
          <div class="product-details-module__title ec-header-h6 details-product-option__title">SUPPORT LEVEL</div>
          <select aria-label="SUPPORT LEVEL">
            <option value="">Please choose</option>
            <option>Gentle</option>
            <option>Supportive (+£20)</option>
          </select>
        </div>`;

const between = (s, a, b, to) => { const i = s.indexOf(a), j = s.indexOf(b); if (i < 0 || j < 0) throw new Error('template marker missing: ' + a); return s.slice(0, i) + to + s.slice(j + b.length); };

let out = read('prototype/template.html')
  .replace('/*ENGINE_CSS*/', () => read('engine/ddtv-engine.css') + '\n' + read('engine/ddtv-scenes.css') + '\n' + read('engine/ddtv-gallery.css'))
  .replace('<!--MOCK_GALLERY-->', () => mockGalleryHtml(placeholderImages))
  .replace('/*MOCK_GALLERY_SCRIPT*/', () => MOCK_GALLERY_SCRIPT)
  .replace('<!--DESCRIPTION-->', () => read('source/examples/placeholder-model-description.html'))
  .replace('/*PRODUCT_CONFIG*/', () => read('products/profiles/divine-store.profile.js') + '\n' + read('products/examples/placeholder-model.config.js') + '\n' + read('products/examples/placeholder-model.assets.js'))
  .replace('/*ENGINE_JS*/', () => read('engine/ddtv-engine.js'))
  .replace('/*SCENES_JS*/', () => read('engine/ddtv-scenes.js'))
  .replace('/*GALLERY_JS*/', () => read('engine/ddtv-gallery.js'))
  .replace('/*ASSETS_JS*/', () => read('engine/ddtv-assets.js'))
  .replace('/*MODEL_JS*/', () => read('engine/ddtv-model.js'))
  .replace('<title>Botanic Experience TV — Prototype</title>', '<title>Placeholder model: reusability proof (not a product)</title>')
  .replace('ecwid-productBrowser-ProductPage-876405767', 'ecwid-productBrowser-ProductPage-900000001')
  .replace(/<p class="mock-note">[\s\S]*?<\/p>/, '<p class="mock-note"><b>Offline stand-in for Ecwid.</b> Invented option titles and texts for a placeholder model. Nothing here is a real product.</p>')
  .replace('<span><b>Prototype</b> · Offline stand-in for the Ecwid product page, used for development and tests. Not the live store and not Ecwid.</span>', '<span><b>Placeholder model</b> · Offline stand-in for an Ecwid product page. Invented data. Not a product, not the live store and not Ecwid.</span>');
out = between(out, '<!--MOCK_HEAD-->', '<!--/MOCK_HEAD-->', head);
out = between(out, '<!--MOCK_OPTIONS-->', '<!--/MOCK_OPTIONS-->', options);

mkdirSync(join(root, 'dist', 'examples'), { recursive: true });
const file = join(root, 'dist', 'examples', 'placeholder-model-page.html');
writeFileSync(file, out);
console.log(`Wrote ${file} (${(out.length / 1024).toFixed(1)} KB): a NON-PRODUCTION page for the second-model proof`);
