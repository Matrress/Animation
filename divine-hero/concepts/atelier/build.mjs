// node concepts/atelier/build.mjs [commit]  → ecwid/atelier-0.1.0-jsdelivr.html + preview/sim-atelier.html
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../..');
const tpl = fs.readFileSync(path.join(here, 'src/section.html'), 'utf8');
const commit = process.argv[2] || 'COMMIT';
const cdn = `https://cdn.jsdelivr.net/gh/Matrress/Animation@${commit}/divine-hero/concepts/atelier/`;
fs.writeFileSync(path.join(root, 'ecwid/atelier-0.1.0-jsdelivr.html'), tpl.replaceAll('{{BASE}}', cdn));
const sim = fs.readFileSync(path.join(root, 'preview/sim194.html'), 'utf8');
const a = sim.indexOf('<div class="ins-tile ins-tile--custom-code">'), b = sim.indexOf('<div class="ins-tile next');
const out = sim.slice(0, a) + '<div class="ins-tile ins-tile--custom-code">\n' + tpl.replaceAll('{{BASE}}', '/concepts/atelier/') + '\n</div>\n' + sim.slice(b);
fs.writeFileSync(path.join(root, 'preview/sim-atelier.html'), out);
console.log('section chars', tpl.replaceAll('{{BASE}}', cdn).length);
