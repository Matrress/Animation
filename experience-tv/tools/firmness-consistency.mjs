// Firmness consistency check. READ-ONLY. Runs the PUBLISHED Firmness Navigator engine (divine-firmness, front release 0.7.0,
// section "Logic", read straight from git) and compares its published bands with (1) the BOTANIC description and (2) the labels
// of the native Ecwid FIRMNESS option. It reuses nothing at run time and changes nothing.
//   NODE_PATH=$(npm root -g) node tools/firmness-consistency.mjs [git-ref] [out.json]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ref = process.argv[2] || 'origin/claude/divine-firmness-visual';
const out = process.argv[3] || join(root, 'docs', 'mobile', 'premium', 'data', 'firmness-consistency.json');
const src = execFileSync('git', ['-C', root, 'show', `${ref}:divine-firmness/release/1.0.0-inline/08_Logic.html`], { encoding: 'utf8', maxBuffer: 1 << 26 });
const js = src.replace(/^[\s\S]*?<script>/, '').replace(/<\/script>[\s\S]*$/, '');
const base = (js.match(/base:\{softMax:(\d+),mediumMax:(\d+),firmMax:(\d+),extraFirmMin:(\d+)\}/) || []).slice(1).map(Number);
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent('<body></body>');
await p.evaluate(js);                                  // defines window.DDFT_API (the pure rule is DDFT_API.setups(weightKg, heightCm))
const heights = [150, 160, 170, 180, 190, 200];
const weights = []; for (let w = 40; w <= 130; w++) weights.push(w);
const grid = await p.evaluate(({ weights, heights }) => weights.map(w => ({ w, byHeight: heights.map(h => { const r = DDFT_API.setups(w, h); return [r.display, r.first, r.second]; }) })), { weights, heights });
// where does the single-mattress firmness ("display") change, by weight, for each height?
const edges = {};
heights.forEach((h, i) => { let prev = null; edges[h] = []; grid.forEach(g => { const d = g.byHeight[i][0]; if (d !== prev) { edges[h].push(`${g.w} kg -> ${d}`); prev = d; } }); });
await b.close();
// the other two sources, as read from the repository / the live page (see the study)
const description = { Soft: '0–48 kg', Medium: '49–83 kg', Firm: '83–114 kg', 'Extra Firm': '115+ kg', where: 'source/botanic-original-description.html (.b-fc__kg)' };
const ecwid = { Soft: 'Up to 47 kg', Medium: '48–85 kg', Firm: '85–110 kg', 'Extra Firm': 'Over 120 kg', where: 'native Ecwid FIRMNESS BY BODY WEIGHT option labels, public page 831592302, read by tests/live/options-probe.cjs' };
const module_ = { base: { Soft: `up to ${base[0]} kg`, Medium: `${base[0] + 1}–${base[1]} kg`, Firm: `${base[1] + 1}–${base[2]} kg`, 'Extra Firm': `${base[3]}+ kg` }, where: `${ref}:divine-firmness (engine base bands; height windows refine them)` };
const result = { engineRef: ref, engineBase: base, heights, edgesByHeight: edges, sources: { module: module_, description, ecwid } };
mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(result, null, 1));
console.log('ENGINE base bands:', JSON.stringify(module_.base));
console.log('DESCRIPTION:', JSON.stringify(description));
console.log('ECWID option:', JSON.stringify(ecwid));
for (const h of heights) console.log(`height ${h} cm: ${edges[h].join(' | ')}`);
