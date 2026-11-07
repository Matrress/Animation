// Builds dist/botanic-experience-tv-demo.html: the mock Ecwid page with the
// original description, the Botanic config and the engine inlined, so the
// prototype opens from a single file on desktop or iPad.
//
//   node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Function replacers so "$" sequences in the sources are kept literally.
const out = read('prototype/template.html')
  .replace('/*ENGINE_CSS*/', () => read('engine/ddtv-engine.css'))
  .replace('<!--DESCRIPTION-->', () => read('source/botanic-original-description.html'))
  .replace('/*PRODUCT_CONFIG*/', () => read('products/botanic.config.js'))
  .replace('/*ENGINE_JS*/', () => read('engine/ddtv-engine.js'));

mkdirSync(join(root, 'dist'), { recursive: true });
const file = join(root, 'dist', 'botanic-experience-tv-demo.html');
writeFileSync(file, out);
console.log(`Wrote ${file} (${(out.length / 1024).toFixed(1)} KB)`);
