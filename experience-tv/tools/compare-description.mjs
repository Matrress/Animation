// Compares the RAW description exported from the Ecwid API (the full HTML string of the product)
// with source/botanic-original-description.html, and says WHERE they differ.
//
//   node tools/compare-description.mjs path/to/api-description.(html|json|txt) [source.html]
//
// Why it exists: the API reports ~157,948 characters for the live product and our source has
// 141,763. A read-only comparison of the live page's RENDERED description with the source found the
// same 256 text lines, ids, 7 videos, 4 images, 32 SVG, 29 links and the same 55 KB style block, so
// visible content is not missing. The raw string is the only way to see what else adds up to the rest
// (whitespace, line endings, entities, wrappers). No dependencies; plain regular expressions.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [, , apiPath, srcPath] = process.argv;
if (!apiPath) { console.error('usage: node tools/compare-description.mjs <api-description-file> [source.html]'); process.exit(2); }

let api = readFileSync(apiPath, 'utf8');
// Accept a saved JSON response ({"description": "..."}) or a JSON string as well as plain HTML.
const t = api.trimStart();
if (t[0] === '{' || t[0] === '"') {
  try { const j = JSON.parse(api); api = typeof j === 'string' ? j : (j.description || j.descriptionHtml || ''); } catch (e) { /* plain HTML that starts with a brace: keep */ }
}
const src = readFileSync(srcPath || join(root, 'source', 'botanic-original-description.html'), 'utf8');

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
const blocks = (h, tag) => (h.match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, 'gi')) || []);
const strip = (h) => h.replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|section|tr|details|summary|figure|figcaption)>/gi, '\n').replace(/<[^>]+>/g, ' ');
const lines = (h) => decode(strip(h)).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 2);
const attrs = (h, re) => [...h.matchAll(re)].map((m) => m[1]);
const count = (h, tag) => (h.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
const set = (a) => new Set(a);
const diff = (a, b) => [...a].filter((x) => !b.has(x));

const facts = (h) => ({
  chars: h.length, crlf: (h.match(/\r\n/g) || []).length, tabs: (h.match(/\t/g) || []).length, nbsp: (h.match(/&nbsp;| /g) || []).length,
  entities: (h.match(/&(?:[a-z]+|#\d+|#x[0-9a-f]+);/gi) || []).length,
  styleBytes: blocks(h, 'style').join('').length, scriptBytes: blocks(h, 'script').join('').length,
  ids: set(attrs(h, /\bid="([^"]+)"/g)), media: set(attrs(h, /\b(?:src|data-src)="(https?:[^"]+)"/g)), links: set(attrs(h, /\bhref="(https?:[^"]+)"/g)),
  video: count(h, 'video'), source: count(h, 'source'), img: count(h, 'img'), svg: count(h, 'svg'), iframe: count(h, 'iframe'), script: count(h, 'script'), style: count(h, 'style'),
  lines: lines(h),
});
const A = facts(api), S = facts(src);
const row = (k, a, b) => console.log(`${(a === b ? '  =  ' : ' !!  ')}${k.padEnd(22)} API ${String(a).padStart(9)}   source ${String(b).padStart(9)}`);

console.log('RAW API DESCRIPTION vs source/botanic-original-description.html\n');
['chars', 'crlf', 'tabs', 'nbsp', 'entities', 'styleBytes', 'scriptBytes', 'video', 'source', 'img', 'svg', 'iframe', 'script', 'style'].forEach((k) => row(k, A[k], S[k]));
console.log(`  .  ${'text lines'.padEnd(22)} API ${String(A.lines.length).padStart(9)}   source ${String(S.lines.length).padStart(9)}`);
console.log(`  .  ${'ids'.padEnd(22)} API ${String(A.ids.size).padStart(9)}   source ${String(S.ids.size).padStart(9)}`);

let problems = 0;
const list = (title, items, mark) => { if (!items.length) return; problems++; console.log(`\n${title} (${items.length}):`); items.slice(0, 25).forEach((x) => console.log('  ' + mark + ' ' + String(x).slice(0, 170))); if (items.length > 25) console.log(`  … and ${items.length - 25} more`); };
const sl = set(S.lines), al = set(A.lines);
list('Visible text only in the API description', diff(al, sl), 'API>');
list('Visible text only in the source', diff(sl, al), 'SRC>');
list('Ids only in the API description', diff(A.ids, S.ids), 'API>');
list('Ids only in the source', diff(S.ids, A.ids), 'SRC>');
list('Media URLs only in the API description', diff(A.media, S.media), 'API>');
list('Media URLs only in the source', diff(S.media, A.media), 'SRC>');
list('Links only in the API description', diff(A.links, S.links), 'API>');
list('Links only in the source', diff(S.links, A.links), 'SRC>');

// Where do the extra characters live? Remove each kind of difference and see how much is left.
const diffChars = A.chars - S.chars;
const norm = (h) => h.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim().length;
console.log(`\nCharacter gap: API − source = ${diffChars}`);
console.log(`  after normalising whitespace and line endings: API ${norm(api)}  source ${norm(src)}  (gap ${norm(api) - norm(src)})`);
if (Math.abs(norm(api) - norm(src)) > 2000) console.log('  → a large gap remains after whitespace: look at the lists above, at scripts/styles, and at wrapper markup the API adds.');
console.log(problems ? '\nRESULT: the descriptions differ in the lists above. Review them before pasting anything into the product.' : '\nRESULT: same visible text, ids, media and links. Any remaining gap is whitespace, markup or entities.');
process.exit(problems ? 1 : 0);
