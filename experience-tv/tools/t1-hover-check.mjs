// T1: the static comparison does not cover :hover / :focus / :active. This forces each of those states on every interactive element
// of both pages (through the DevTools protocol) and compares the computed values that those states can change.
//   NODE_PATH=$(npm root -g) node tools/t1-hover-check.mjs <before.html> <after.html>
import { createRequire } from 'node:module';
import { openPage, stateProbe } from './t1-snapshot.mjs';
const require = createRequire(import.meta.url);
const [a, b] = process.argv.slice(2);
const { chromium } = require('playwright'); const browser = await chromium.launch();
const R = [];
for (const f of [a, b]) { const { page, ctx } = await openPage(browser, f, 390); const p = await stateProbe(page, ctx); R.push({ sig: await p.sig(), labels: p.labels }); await ctx.close(); }
let bad = 0; const states = ['hover', 'focus', 'active'];
if (R[0].sig.length !== R[1].sig.length) { console.log('interactive element count differs', R[0].sig.length, R[1].sig.length); bad++; }
for (let i = 0; i < Math.min(R[0].sig.length, R[1].sig.length); i++) if (R[0].sig[i] !== R[1].sig[i]) { bad++; const x = R[0].sig[i].split('|'), y = R[1].sig[i].split('|'); console.log('DIFF', R[0].labels[Math.floor(i / 3)], states[i % 3], x.filter((v, k) => v !== y[k]).slice(0, 3).join(' ; '), ' -> ', y.filter((v, k) => v !== x[k]).slice(0, 3).join(' ; ')); }
console.log(`${R[0].labels.length} interactive elements x 3 states compared, differing: ${bad}`);
await browser.close(); process.exitCode = bad ? 1 : 0;
