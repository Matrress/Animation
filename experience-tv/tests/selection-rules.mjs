// UNIT TESTS of the selection laws (engine/selection-rules.js): pure functions, no page.
//   node tests/selection-rules.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'engine', 'selection-rules.js'), 'utf8');
const sandbox = { window: {}, globalThis: {} }; sandbox.globalThis = sandbox;
new Function('window', 'globalThis', src)(sandbox.window, sandbox);
const R = sandbox.window.DDRules;
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
const full = () => ({ size: { key: '150x210', label: '150 × 210 cm' }, firmness: { key: 'firm', label: 'Firm' }, depth: { key: 24, label: '24 cm' }, cover: { key: 2, label: 'Cotton / Wool' } });
const none = {};

ok(R.missing(none).join('|') === 'Size|Firmness|Depth|Cover', 'with nothing chosen, all four are still to choose, in the customer\'s order', R.missing(none).join(' · '));
const three = full(); delete three.depth;
ok(R.missing(three).join('|') === 'Depth', 'with three chosen, the one missing is named', R.missing(three).join(' · '));
ok(!R.complete(three) && R.complete(full()), 'complete only when all four are covered');
ok(R.bagFace(none).enabled === false && R.bagFace(none).face === 'add', 'incomplete: Add to Bag is off');
ok(R.bagFace(three).guide === 'Still to choose: Depth', 'incomplete: the guidance names the missing choice', R.bagFace(three).guide);
ok(R.bagFace(full()).ready === true && R.bagFace(full()).enabled === true, 'four covered: READY (enabled and lit)');
const sig = R.signature(full());
ok(R.bagFace(full(), sig).face === 'checkout' && R.bagFace(full(), sig).text === 'Go to Checkout', 'the bag holds exactly these four: the same button is Go to Checkout');
// LAW 2: changing one of the four after completion keeps the button active, READY for the new configuration
const changed = full(); changed.depth = { key: 26, label: '26 cm' };
const fc = R.bagFace(changed, sig);
ok(fc.enabled === true && fc.ready === true && fc.face === 'add' && /not in the bag/.test(fc.guide), 'LAW 2: a changed choice keeps the button active and READY; it is Add to Bag again', fc.guide);
ok(R.bagFace(changed).enabled === true, 'LAW 2: no bag yet, changing a choice still leaves the button READY');
// a choice removed after completion: back to the guidance, not READY
const removed = full(); removed.firmness = null;
ok(R.bagFace(removed, sig).enabled === false && /Firmness/.test(R.bagFace(removed, sig).guide), 'a choice removed after completion: Add to Bag off, Firmness named', R.bagFace(removed, sig).guide);
ok(R.signature(none) === '' && R.signature(full()) !== '', 'signature is empty until the four are covered');
const lines = R.checkoutLines(full(), 15);
ok(lines.map((l) => l.factor).join('|') === 'Size|Firmness|Depth|Cover|Promotion', 'the checkout is the five factors, in order', lines.map((l) => l.factor).join(' · '));
ok(lines[4].value === 'Save 15%' && R.checkoutLines(full(), 0)[4].value === null, 'the promotion is shown as the store gives it (its percentage, never its name); none when there is none');
ok(!/coupon/i.test(JSON.stringify(lines)), 'no coupon field is created by the rules: the coupon belongs to the checkout');
console.log(fails ? `\n${fails} rule check(s) FAILED` : '\nAll selection-law checks passed');
process.exit(fails ? 1 : 0);
