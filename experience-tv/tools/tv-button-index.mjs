// The button map as ONE page: every screen of the large-screen design with its picture, every button numbered on it, and for each
// button the screen it leads to (a link, with a small picture of that screen). Reads docs/tv-catalogue/catalogue.json (written by
// tools/tv-button-catalogue.mjs) and writes docs/tv-catalogue/index.html next to the pictures. Open it in any browser.
//   node tools/tv-button-catalogue.mjs && node tools/tv-button-index.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'docs', 'tv-catalogue');
const cat = JSON.parse(readFileSync(join(dir, 'catalogue.json'), 'utf8'));
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const byId = Object.fromEntries(cat.screens.map((s) => [s.id, s]));
const TOPIC_FIRST = { discover: 'discover-intro', firmness: 'firmness-principle', comfort: 'comfort-expect', height: 'start', covers: 'cover', benefits: 'benefits-origin', support: 'support-bearing', adaptation: 'adaptation-elasticity', zones: 'zones-map', ventilation: 'ventilation-airflow', hygiene: 'hygiene-clean', certs: 'certs-bodies', warranty: 'warranty-cover', delivery: 'delivery-made' };
const linkTo = (id, text) => {
  const s = byId[id]; if (!s) return esc(text || '');
  return `<a href="#${s.id}">${esc(text || s.title)}</a> <img class="mini" src="${esc(s.file)}" alt="" loading="lazy">`;
};
const dest = (b) => {
  if (!b.dest) return esc(b.leads || '');
  if (/^stays/.test(b.dest.text || '')) return esc(b.dest.text);
  if (b.dest.screen && b.dest.key !== null) return linkTo(b.dest.screen, b.dest.where || b.dest.text);
  return esc(b.dest.text || b.leads || '');
};
let n = 0, rows = '';
const screenHtml = cat.screens.map((s) => {
  const trs = s.buttons.map((b) => `<tr><td class="no">${b.n}</td><td><b>${esc(b.label)}</b>${b.disabled ? ' <i>(off)</i>' : ''}</td><td>${esc(b.kind)}</td><td>${esc(b.does)}</td><td>${dest(b)}</td><td class="dec"></td></tr>`).join('');
  n += s.buttons.length;
  return `<section id="${s.id}"><h2>${esc(s.title)} <small>${esc(s.id)}</small></h2><a href="${esc(s.file)}"><img class="shot" src="${esc(s.file)}" alt="${esc(s.title)}" loading="lazy"></a>` +
    (s.buttons.length ? `<table><thead><tr><th>No.</th><th>Button</th><th>Kind</th><th>What it does</th><th>Leads to</th><th>Your decision</th></tr></thead><tbody>${trs}</tbody></table>` : '<p>Only the buttons on every screen (groups A to E).</p>') + '</section>';
}).join('\n');
const A = cat.always.A.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.does)}</td><td>${r.label.includes('Gallery') ? linkTo('gallery', 'View Model Gallery') : r.label.includes('Standard') ? linkTo('standard', 'Standard Product View') : linkTo('start', 'Optimised Preview')}</td><td class="dec"></td></tr>`).join('');
const B = cat.always.B.map((r) => { const t = r.label.toLowerCase().replace(/\s+/g, '').replace('7-zone', 'zones').replace('certifications', 'certs'); const first = TOPIC_FIRST[t] || TOPIC_FIRST[t === 'certs' ? 'certs' : t]; return `<tr><td>${esc(r.label)}</td><td>${esc(r.does)}</td><td>${first ? linkTo(first, 'first panel of ' + r.label) : ''}</td><td class="dec"></td></tr>`; }).join('');
const C = Object.entries(cat.always.C_panels).map(([c, ps]) => `<tr><td>${esc(c)}</td><td>${ps.map((p) => esc(p)).join(' · ')}</td><td class="dec"></td></tr>`).join('');
const CS = cat.always.C_steps.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.does)}</td><td class="dec"></td></tr>`).join('');
const D = cat.always.D.map((r) => `<tr><td>${esc(r.label.split(/\s/)[0])}</td><td>${esc(r.does)}</td><td class="dec"></td></tr>`).join('');
const E = cat.always.E.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.does)}</td><td class="dec"></td></tr>`).join('');
const toc = cat.screens.map((s) => `<a href="#${s.id}">${esc(s.title)}</a>`).join('');
const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Button map: large-screen television (design preview)</title>
<style>
:root{--ink:#272D32;--ink3:#5B666E;--line:#D9E1E6;--band:#173A52;--sky:#297CA2}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,Arial,sans-serif;color:var(--ink);background:#F4F6F8}
main{max-width:1200px;margin:0 auto;padding:22px 20px 60px}
h1{font-size:26px;margin:0 0 6px}h2{font-size:19px;margin:0 0 10px}h2 small{color:var(--ink3);font-weight:400;font-size:13px}
p.lead{color:var(--ink3);margin:0 0 16px;max-width:80ch}
nav.toc{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 26px;padding:12px;background:#fff;border:1px solid var(--line);border-radius:12px}
nav.toc a{font-size:13px;padding:4px 9px;border-radius:8px;border:1px solid var(--line);color:var(--band);text-decoration:none;background:#fff}
section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin:0 0 22px}
img.shot{display:block;width:100%;max-width:1100px;height:auto;border-radius:10px;border:1px solid var(--line);margin:0 0 14px}
img.mini{width:64px;height:auto;border-radius:6px;border:1px solid var(--line);vertical-align:middle;margin-left:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink3)}td.no{width:44px;font-weight:700;color:#E8590C}
td.dec{width:190px;border:1px dashed #C6CDD3;}a{color:var(--sky)}
.grp{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:0 0 22px}
</style></head><body><main>
<h1>Button map of the large-screen television</h1>
<p class="lead">${cat.screens.length} screens of the design preview (simulated store; not deployed). Each screen has its picture and its buttons numbered on it. The last column of each table is for your decision: keep, remove, change, or add. Click a picture to open it full size; click a "Leads to" link to jump to the screen the button leads to. Generated ${esc(cat.generated)}.</p>
<nav class="toc">${toc}</nav>
<div class="grp"><h2>A. Tools (top right)</h2><table><thead><tr><th>Button</th><th>What it does</th><th>Leads to</th><th>Your decision</th></tr></thead><tbody>${A}</tbody></table></div>
<div class="grp"><h2>B. The fourteen topics (top of the television)</h2><table><thead><tr><th>Button</th><th>What it does</th><th>Leads to</th><th>Your decision</th></tr></thead><tbody>${B}</tbody></table></div>
<div class="grp"><h2>C. The left menu: the panels of each topic</h2><table><thead><tr><th>Topic</th><th>Panels</th><th>Your decision</th></tr></thead><tbody>${C}</tbody></table>
<h2 style="margin-top:16px">C. Your order: the five steps, always the same</h2><table><thead><tr><th>Button</th><th>What it does</th><th>Your decision</th></tr></thead><tbody>${CS}</tbody></table></div>
<div class="grp"><h2>D. Your selection (right): the four chips</h2><table><thead><tr><th>Chip</th><th>What it does</th><th>Your decision</th></tr></thead><tbody>${D}</tbody></table></div>
<div class="grp"><h2>E. Add to Bag / Go to Checkout</h2><table><thead><tr><th>Button</th><th>What it does</th><th>Your decision</th></tr></thead><tbody>${E}</tbody></table></div>
${screenHtml}
<p class="lead">${n} numbered buttons on the screens, plus the groups A to E above.</p>
</main></body></html>`;
writeFileSync(join(dir, 'index.html'), html);
console.log('wrote docs/tv-catalogue/index.html:', cat.screens.length, 'screens,', n, 'numbered buttons');
