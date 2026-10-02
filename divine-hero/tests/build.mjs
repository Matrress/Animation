// Build: src/ -> release/<version>/ (minified CSS/JS) + Ecwid section files + local test harnesses.
// usage: node tests/build.mjs   (needs esbuild; see README "Rebuilding")
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const VERSION = '1.4.0';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const esbuild = process.env.ESBUILD || 'esbuild';
const rel = path.join(root, 'release', VERSION);
fs.mkdirSync(rel, { recursive: true });

execFileSync(esbuild, [path.join(root, 'src/hero.css'), '--minify', '--legal-comments=inline', '--target=chrome105,safari16,firefox110', '--outfile=' + path.join(rel, 'hero.css')], { stdio: 'inherit' });
execFileSync(esbuild, [path.join(root, 'src/hero.js'), '--minify', '--legal-comments=inline', '--target=es2017', '--outfile=' + path.join(rel, 'hero.js')], { stdio: 'inherit' });

const tpl = fs.readFileSync(path.join(root, 'src/section.html'), 'utf8');
const render = (base) => tpl.replaceAll('{{BASE}}', base).replaceAll('{{ORIGIN}}', new URL(base, 'http://local.test/').origin);

export const HOSTS = {
  // Recommended production: first-party static host (see INSTALL.md §2).
  production: `https://assets.divinedunlop.com/divine-hero/${VERSION}/`,
};
fs.mkdirSync(path.join(root, 'ecwid'), { recursive: true });
fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}.html`), render(HOSTS.production));
// Fallback only (INSTALL.md §9): same markup, whitespace between tags removed.
const compact = (h) => h.replace(/\n(?=<)/g, '').replace(/>\n/g, '>').trim() + '\n';
fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}.min.html`), compact(render(HOSTS.production)));
// All-in-one: CSS and JS inlined into the one section; only images/fonts are fetched from `base`.
const css = fs.readFileSync(path.join(rel, 'hero.css'), 'utf8');
const js = fs.readFileSync(path.join(rel, 'hero.js'), 'utf8');
const allInOne = (base) => render(base)
  .replace(/<!-- [^\n]*-->\n/, `<!-- Divine DunlopDreams Hero ${VERSION} | ALL-IN-ONE: one Instant Site "Embed & Custom Code" section | images/fonts: ${base} -->\n`)
  .replace(/<link rel="stylesheet" href="[^"]*hero\.css">\n/, () => `<style>${css.replace(/url\(assets\//g, 'url(' + base + 'assets/').trim()}</style>\n`)
  .replace(/<script src="[^"]*hero\.js" defer><\/script>\n<script>window\.DDHero&&DDHero\.boot\(\)<\/script>\n/, () => `<script>${js.trim()}</script>\n`);
fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-allinone.html`), allInOne(HOSTS.production));
if (process.env.JSDELIVR_REF) {
  const base = `https://cdn.jsdelivr.net/gh/Matrress/Animation@${process.env.JSDELIVR_REF}/divine-hero/release/${VERSION}/`;
  fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-jsdelivr.html`), render(base));
  fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-jsdelivr.min.html`), compact(render(base)));
  fs.writeFileSync(path.join(root, 'ecwid', `section-${VERSION}-allinone-jsdelivr.html`), allInOne(base));
}

// Local harnesses (same markup, assets served from ../release/<version>/)
const local = render(`/release/${VERSION}/`).replace(/<link rel="preconnect"[^>]*>\n/, '');
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview', 'section-local.html'), local);
for (const h of [0, 50]) {
  execFileSync('python3', [path.join(root, 'tests/make-harness.py'), path.join(root, 'preview/section-local.html'), path.join(root, `preview/harness-polished-h${h}.html`), String(h)]);
}

const sizes = {};
for (const f of ['hero.css', 'hero.js']) sizes[f] = fs.statSync(path.join(rel, f)).size;
const sec = fs.readFileSync(path.join(root, 'ecwid', `section-${VERSION}.html`), 'utf8');
sizes['section chars'] = [...sec].length;
sizes['section bytes'] = Buffer.byteLength(sec);
const min = fs.readFileSync(path.join(root, 'ecwid', `section-${VERSION}.min.html`), 'utf8');
sizes['min section chars'] = [...min].length;
console.log(sizes);
