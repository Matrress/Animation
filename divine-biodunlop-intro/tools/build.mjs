// Builds the BioDunlop intro: minified CSS/JS + media into release/<ver>/, the integration candidate section (a byte-for-byte
// copy of the stable Hero 1.20.2 jsDelivr section with the intro additions inserted) and a local preview page.
// usage: node tools/build.mjs            (JSDELIVR_REF=<sha> to pin the candidate's intro files to a commit)
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const VER = '0.1.0-dev', HERO = '1.20.2';
const here = path.dirname(new URL(import.meta.url).pathname), mod = path.join(here, '..'), repo = path.join(mod, '..');
const rel = path.join(mod, 'release', VER);
fs.mkdirSync(path.join(rel, 'assets'), { recursive: true });
for (const f of ['intro.css', 'intro.js']) {
  const out = execFileSync('esbuild', [path.join(mod, 'src', f), '--minify', '--legal-comments=inline', '--target=es2017'], { encoding: 'utf8' });
  fs.writeFileSync(path.join(rel, f), out);
}
for (const f of fs.readdirSync(path.join(mod, 'assets'))) if (/^ddb-/.test(f)) fs.copyFileSync(path.join(mod, 'assets', f), path.join(rel, 'assets', f));
const gate = fs.readFileSync(path.join(mod, 'src', 'gate.html'), 'utf8').trim();
const LINE = 'From natural latex milk to a complete natural latex sleep system.';
// the stable section, untouched, is the starting point
const stable = fs.readFileSync(path.join(repo, 'divine-hero', 'ecwid', `section-${HERO}-jsdelivr.html`), 'utf8');
function candidate(src, introBase) {
  let s = src;
  const heroJs = s.match(/<script src="[^"]*\/hero\.js" defer><\/script>\n/)[0];
  s = s.replace(heroJs, heroJs + `<link rel="stylesheet" href="${introBase}intro.css">\n<script src="${introBase}intro.js" defer></script>\n`);
  s = s.replace('<section class="ddh"', gate + '\n<section class="ddh"');
  s = s.replace('<script>window.DDHero&&DDHero.boot()</script>', '<script>window.DDHero&&DDHero.boot()</script>\n<script>window.DDBIntro&&DDBIntro.boot()</script>');
  const last = s.match(/<p class="ddh__sr">European production[^\n]*<\/p>\n/)[0];
  s = s.replace(last, last + `<div class="ddb" aria-hidden="true"></div>\n<p class="ddb-line">${LINE}</p>\n`);
  s = s.replace(/^<!-- Divine DunlopDreams Hero [^|]*\|/, `<!-- Divine DunlopDreams Hero ${HERO} + BioDunlop intro ${VER} (development candidate 1.21.0-dev, NOT for production) |`);
  return s;
}
const ref = process.env.JSDELIVR_REF;
const cdn = ref ? `https://cdn.jsdelivr.net/gh/Matrress/Animation@${ref}/divine-biodunlop-intro/release/${VER}/` : `https://cdn.jsdelivr.net/gh/Matrress/Animation@<COMMIT>/divine-biodunlop-intro/release/${VER}/`;
fs.mkdirSync(path.join(mod, 'candidate'), { recursive: true });
fs.writeFileSync(path.join(mod, 'candidate', 'section-1.21.0-dev-jsdelivr.html'), candidate(stable, cdn));
// local preview: the same candidate inside the Instant Site imitation the hero is tested in
const sim = fs.readFileSync(path.join(repo, 'divine-hero', 'preview', 'sim110.html'), 'utf8');
const a = sim.indexOf('<div class="ins-tile ins-tile--custom-code">') + '<div class="ins-tile ins-tile--custom-code">'.length;
const b = sim.indexOf('</div>\n', sim.indexOf('DDHero.boot()'));
const local = candidate(stable, `/divine-biodunlop-intro/release/${VER}/`).split(`https://cdn.jsdelivr.net/gh/Matrress/Animation@f727e88417fd562938847735378af9a167e96034/divine-hero/release/${HERO}/`).join(`/divine-hero/release/${HERO}/`);
fs.writeFileSync(path.join(mod, 'preview', 'intro.html'), sim.slice(0, a) + '\n' + local + sim.slice(b));
const sizes = {}; for (const f of ['intro.css', 'intro.js']) sizes[f] = fs.statSync(path.join(rel, f)).size;
for (const f of fs.readdirSync(path.join(rel, 'assets'))) sizes[f] = fs.statSync(path.join(rel, 'assets', f)).size;
const c = fs.readFileSync(path.join(mod, 'candidate', 'section-1.21.0-dev-jsdelivr.html'), 'utf8');
console.log({ version: VER, sizes, 'candidate chars': c.length, 'stable chars': stable.length, 'added chars': c.length - stable.length });
