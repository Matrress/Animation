// The design preview as an Artifact page. The artifact viewer only admits the artifact's own files, so a video on another address
// (the shop's media.divinedunlop.com) shows as an empty white box there. For the PREVIEW ONLY the seven videos are fetched from the
// same addresses and published beside the page; the page then points at them. The design file, the store module and the package
// keep the owner's own links, untouched.
//
//   node tools/build-preview-artifact.mjs      → dist/preview-artifact/index.html + dist/preview-artifact/videos/*.mp4
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'preview-artifact'), vdir = join(out, 'videos');
mkdirSync(vdir, { recursive: true });
let html = readFileSync(join(root, 'docs', 'tv-preview', 'large-screen-design.html'), 'utf8');
const BASE = 'https://media.divinedunlop.com/videos/';
const names = [...new Set([...html.matchAll(/https:\/\/media\.divinedunlop\.com\/videos\/([A-Za-z0-9._-]+\.mp4)/g)].map((m) => m[1]))];
if (!names.length) throw new Error('no video addresses found in the design');
for (const n of names) {
  const f = join(vdir, n);
  if (!existsSync(f) || statSync(f).size < 1000) execFileSync('curl', ['-sfL', '--max-time', '120', '-o', f, BASE + n]);
  const size = statSync(f).size; if (size < 1000) throw new Error(n + ': download failed');
  console.log(n.padEnd(70), size, 'bytes');
}
html = html.split(BASE).join('videos/');
if (html.includes('media.divinedunlop.com/videos/')) throw new Error('a video address is left');
writeFileSync(join(out, 'index.html'), html);
console.log('wrote dist/preview-artifact/index.html with', names.length, 'videos');
