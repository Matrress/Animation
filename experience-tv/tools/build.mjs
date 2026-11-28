// Builds dist/botanic-experience-tv-demo.html (and a copy as dist/index.html): the mock Ecwid page with the
// original description, the Botanic config and the engine inlined, so the
// prototype opens from a single file on desktop or iPad.
//
//   node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mockGalleryHtml, MOCK_GALLERY_SCRIPT } from './mock-gallery.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Function replacers so "$" sequences in the sources are kept literally.
const out = read('prototype/template.html')
  .replace('/*ENGINE_CSS*/', () => read('engine/ddtv-engine.css') + '\n' + read('engine/ddtv-scenes.css') + '\n' + read('engine/ddtv-gallery.css'))
  .replace('<!--MOCK_GALLERY-->', () => mockGalleryHtml())
  .replace('/*MOCK_GALLERY_SCRIPT*/', () => MOCK_GALLERY_SCRIPT)
  .replace('<!--DESCRIPTION-->', () => read('source/botanic-original-description.html'))
  .replace('/*PRODUCT_CONFIG*/', () => read('products/botanic.config.js') + '\n' + read('products/botanic.zones.js') + '\n' + read('products/botanic.media.js') + '\n' + read('products/botanic.assets.js'))
  .replace('/*ENGINE_JS*/', () => read('engine/ddtv-engine.js'))
  .replace('/*SCENES_JS*/', () => read('engine/ddtv-scenes.js'))
  .replace('/*GALLERY_JS*/', () => read('engine/ddtv-gallery.js'))
  .replace('/*ASSETS_JS*/', () => read('engine/ddtv-assets.js'))
  .replace('/*MODEL_JS*/', () => read('engine/ddtv-model.js'));

mkdirSync(join(root, 'dist'), { recursive: true });
const file = join(root, 'dist', 'botanic-experience-tv-demo.html');
writeFileSync(file, out);
// index.html lets a plain static server (the site preview) open it directly.
writeFileSync(join(root, 'dist', 'index.html'), out);
console.log(`Wrote ${file} (${(out.length / 1024).toFixed(1)} KB) and dist/index.html`);
