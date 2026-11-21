/* The presentation page: the working television (docs/tv-preview/large-screen-design.html) as ONE self-contained page with a
   guided-tour strip attached under the television. Output: docs/tv-presentation/botanic-experience-tv.html (the published
   artifact body: no document wrapper, no external fonts except Google Fonts, which the artifact viewer allows).
   Run after tools/build-tv-design-preview.mjs:  node tools/build-presentation.mjs */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let h = readFileSync(join(root, 'docs', 'tv-preview', 'large-screen-design.html'), 'utf8');
const part = readFileSync(join(root, 'tools', 'presentation-tour.html'), 'utf8');
const bar = part.slice(part.indexOf('<!--TOURBAR-->'), part.indexOf('<!--/TOURBAR-->'));
const code = part.slice(part.indexOf('<!--TOURCODE-->'), part.indexOf('<!--/TOURCODE-->'));
h = h.replace(/<!doctype html>\s*/i, '').replace(/<\/?html[^>]*>/g, '').replace(/<\/?head>/g, '').replace(/<body[^>]*>/g, '').replace(/<\/body>/g, '')
  .replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '').replace(/<title>.*?<\/title>\s*/s, '')
  .replace(/<link rel="preconnect"[^>]*>\s*/, '').replace(/<link rel="stylesheet" href="https:\/\/api\.fontshare[^>]*>\s*/, '');
h = h.replace("--f: 'Chillax', 'Helvetica Neue', Arial, system-ui, sans-serif;", "--f: 'Chillax', 'Figtree', 'Helvetica Neue', Arial, system-ui, sans-serif;");
if (!h.includes('</main>')) throw new Error('monitor not found');
h = h.replace('</main>', '</main>\n' + bar);
/* OWNER 16 Nov (VIII): the published page may only load its own files, so the films and photographs of the description travel
   WITH the page (docs/tv-presentation/media/, not committed: fetched from the shop's own media addresses at build time).
   In the shop the module keeps the original addresses. */
const MEDIA = [...new Set(h.match(/https:\/\/(?:media\.divinedunlop\.com|d2j6dbq0eux0bg\.cloudfront\.net)\/[^"' )\\]+/g) || [])];
const mdir = join(root, 'docs', 'tv-presentation', 'media'); mkdirSync(mdir, { recursive: true });
const manifest = {};
for (const u of MEDIA) {
  const name = u.split('/').pop(); const dest = join(mdir, name);
  if (!existsSync(dest)) { try { execFileSync('curl', ['-sSL', '-m', '120', '--fail', '-o', dest, u]); } catch (e) { console.warn('media not fetched (kept remote):', u); continue; } }
  manifest['media/' + name] = dest; h = h.split(u).join('media/' + name);
}
writeFileSync(join(root, 'docs', 'tv-presentation', 'media-files.json'), JSON.stringify(manifest, null, 1));
console.log('media files with the page:', Object.keys(manifest).length);
const head = '<title>Botanic Experience TV</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap">\n';
mkdirSync(join(root, 'docs', 'tv-presentation'), { recursive: true });
writeFileSync(join(root, 'docs', 'tv-presentation', 'botanic-experience-tv.html'), head + h.trim() + '\n' + code);
console.log('wrote docs/tv-presentation/botanic-experience-tv.html', (head + h + code).length, 'bytes');
