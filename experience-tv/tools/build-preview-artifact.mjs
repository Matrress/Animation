// The design preview as an Artifact page. The artifact viewer only admits the artifact's own files, so a film or a picture on another
// address (the owner's media host, Ecwid's image host) shows as an empty box there. For the PREVIEW ONLY they are fetched from the
// same addresses and published beside the page; the page then points at them. The design file, the store module and the package
// keep the owner's own links, untouched.
//
//   node tools/build-preview-artifact.mjs      → dist/preview-artifact/index.html + videos/ covers/ gallery/ + FILES.json
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'preview-artifact');
mkdirSync(out, { recursive: true });
let html = readFileSync(join(root, 'docs', 'tv-preview', 'large-screen-design.html'), 'utf8');
// every picture and film the page takes from another address (the owner's media host, Ecwid's image host) becomes a file beside the page
const SOURCES = [
  { base: 'https://media.divinedunlop.com/videos/', dir: 'videos/', ext: 'mp4' },
  { base: 'https://media.divinedunlop.com/covers/', dir: 'covers/', ext: 'webp' },
  { base: 'https://d2j6dbq0eux0bg.cloudfront.net/images/100333285/products/831592302/', dir: 'gallery/', ext: 'webp' }];
const made = [];
for (const S of SOURCES) {
  const names = [...new Set([...html.matchAll(new RegExp(S.base.replace(/[.\/]/g, '\\$&') + '([A-Za-z0-9._-]+\\.' + S.ext + ')', 'g'))].map((m) => m[1]))];
  if (!names.length) throw new Error('no address found for ' + S.base);
  mkdirSync(join(out, S.dir), { recursive: true });
  for (const n of names) {
    const f = join(out, S.dir, n);
    if (!existsSync(f) || statSync(f).size < 1000) execFileSync('curl', ['-sfL', '--max-time', '120', '-o', f, S.base + n]);
    const size = statSync(f).size; if (size < 1000) throw new Error(n + ': download failed');
    made.push(S.dir + n);
  }
  html = html.split(S.base).join(S.dir);
  if (html.includes(S.base)) throw new Error('an address is left: ' + S.base);
}
writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, 'FILES.json'), JSON.stringify(made, null, 1));
console.log('wrote dist/preview-artifact/index.html with', made.length, 'files:', SOURCES.map((S) => S.dir + ' ' + made.filter((m) => m.startsWith(S.dir)).length).join(', '));
