// Tests of the multi-model architecture: schemas, validator, scaffold, asset registry, contracts, the hardcoding
// ratchet, and a SECOND MODEL (a non-production placeholder) running on the unchanged shared engine.
//   node tools/build.mjs && node tools/build-embed.mjs && node tools/build-example.mjs && node tests/model-reuse.mjs
//
// !! SIMULATED. The placeholder model, its description, its assets and its store page are invented. The page is an
// !! offline stand-in for Ecwid (the same one the Botanic tests use). A pass proves that the engine does not need
// !! Botanic's content or Botanic's four options to work; it says nothing about any real second product.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { loadScripts } from '../tools/lib-load.mjs';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = require(join(root, 'schema', 'ddtv-schema.js'));
const { chromium } = require('playwright');
const PAGE_EX = pathToFileURL(join(root, 'dist', 'examples', 'placeholder-model-page.html')).href;
const PAGE_BO = pathToFileURL(join(root, 'dist', 'embed', 'test-page.html')).href;
const file = (p) => join(root, p);
const text = (p) => readFileSync(file(p), 'utf8');

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };
console.log('NOTE: simulated. A placeholder model on an offline stand-in page; nothing here is a real product or a live Ecwid check.\n');

const node = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', cwd: root, env: { ...process.env, NODE_PATH: process.env.NODE_PATH || '' }, ...opts });
const tmp = () => mkdtempSync(join(tmpdir(), 'ddtv-model-'));
const has = (r, needle) => (r.stdout + r.stderr).includes(needle);

/* ====================================================================== */
/* 1. The registered models validate (structure, semantics, assets, sources) */
/* ====================================================================== */
{
  const r = node(['tools/validate-model.mjs', '--source-check']);
  ok(r.status === 0 && has(r, 'All models valid'), 'every model in products/models.json validates, including a check of every selector against its own description');
  ok(/botanic: 0 error/.test(r.stdout) && /placeholder: 0 error/.test(r.stdout), 'Botanic and the placeholder model each report 0 errors');
  ok(/source check: 111 selector/.test(r.stdout) && /source check: \d+ selector/.test(r.stdout.split('placeholder')[1] || ''), 'the source check really ran on both (Botanic: 111 selectors)');
  const idx = JSON.parse(text('products/models.json'));
  const iv = schema.validateIndex(idx);
  ok(iv.errors.length === 0, 'the models index is valid');
  ok(idx.find((m) => m.id === 'placeholder').production === false && idx.every((m) => m.deployment === 'not-authorised'), 'the placeholder is never a production model, and no model is authorised for deployment');
}

/* ====================================================================== */
/* 2. Schema and semantic rules: each one is shown to fail when broken      */
/* ====================================================================== */
{
  const base = () => ({
    id: 'x', name: 'X', status: 'development', productIds: [111], sourceRoot: '#x',
    options: { a: { label: 'A', match: /a/i, chapter: 'c', panel: 'p', kind: 'list' } },
    chapters: [{ id: 'c', label: 'C', source: '#x', panels: [{ id: 'p', label: 'P', scene: 'reader' }] }],
  });
  const ctx = (extra = {}) => ({ scenes: ['hero', 'reader', 'choose'], liveProductIds: [831592302], otherModels: [{ id: 'botanic', name: 'Botanic', productIds: [876405767] }], profiles: {}, ...extra });
  const errs = (cfg, c) => schema.validateModel(cfg, c || ctx()).errors.map((e) => e.path + ' ' + e.message);
  const has1 = (list, re) => list.some((s) => re.test(s));

  ok(errs(base()).length === 0, 'a minimal model is valid');
  let c = base(); c.chapters[0].panels[0].scene = 'firmness-scale-9000';
  ok(has1(errs(c), /scene "firmness-scale-9000" is neither/), 'an unknown scene is an error');
  c = base(); c.chapters[0].panels[0].scene = 'mine'; c.scenes = { mine: function () {} };
  ok(errs(c).length === 0, 'a scene the model defines itself is accepted');
  c = base(); c.options.a.chapter = 'nope';
  ok(has1(errs(c), /chapter "nope" does not exist/), 'an option that points at a missing chapter is an error');
  c = base(); c.options.a.panel = 'nope';
  ok(has1(errs(c), /panel "nope" does not exist/), 'an option that points at a missing panel is an error');
  c = base(); c.values = { zzz: [{ id: 'q', label: 'Q', test: /q/ }] };
  ok(has1(errs(c), /values for an option the model does not have/), 'values for an option the model does not have are an error');
  c = base(); c.sync = [{ option: 'zzz', items: '.x' }];
  ok(has1(errs(c), /option "zzz" does not exist/), 'a sync rule for an unknown option is an error');
  c = base(); c.chapters.push({ id: 'c', label: 'C2', source: '#y', panels: [{ id: 'p', label: 'P', scene: 'hero' }] });
  ok(has1(errs(c), /duplicate chapter id/), 'duplicate chapter ids are an error');
  c = base(); c.productIds = [876405767];
  ok(has1(errs(c), /already claimed by model "botanic"/), 'a product id already claimed by another model is an error');
  c = base(); c.productIds = [831592302];
  ok(has1(errs(c), /LIVE product/), 'a LIVE product id on an unapproved model is an error');
  c = base(); c.productIds = [831592302];
  ok(!has1(errs(c, ctx({ entry: { deployment: 'authorised' } })), /LIVE product/), '...and is accepted only when the index says deployment is authorised');
  c = base(); c.extends = 'nowhere';
  ok(has1(errs(c, ctx({ profiles: { other: {} } })), /profile "nowhere" does not exist/), 'extending a profile that does not exist is an error');
  c = base(); c.options.a.match = 'not a regexp';
  ok(has1(errs(c), /must be a regular expression/), 'a string where a regular expression is needed is an error');
  c = base(); c.options.a.match = /x/i;
  ok(errs(c).length === 0, '...and a RegExp from another realm (a VM) is recognised as one');
  delete (c = base()).name;
  ok(has1(errs(c), /^name is required|model\.name is required/), 'a missing required field is an error');
  c = base(); c.bogusKey = 1;
  ok(schema.validateModel(c, ctx()).warnings.some((w) => /bogusKey/.test(w.path)), 'an unknown top-level key is a warning (a typo is caught, an extension is not blocked)');
  c = base(); c.dialect = { headTitle: '.x', notARole: '.y' };
  ok(schema.validateModel(c, ctx()).warnings.some((w) => /notARole/.test(w.path)), 'an unknown dialect role is a warning');
  c = base(); c.options.a.kind = 'rating';
  ok(errs(c).length === 0 && schema.validateModel(c, ctx()).warnings.some((w) => /custom kind "rating"/.test(w.message)), 'a custom option kind is allowed, with a warning that it must be registered');
  c = base(); c.name = 'Mentions Botanic mattresses';
  ok(has1(errs(c), /mentions another model \("Botanic"\)/), 'a model whose own text names another model is an error (content integrity)');
  ok(!has1(errs(c, ctx({ entry: { allowMentions: ['Botanic'] } })), /mentions another model/), '...unless the index declares the mention');

  // topics and visuals
  const reg = { version: 1, assets: [
    { id: 'own-1', type: 'image', role: 'technical', scope: 'model', products: ['x'], urls: { 800: 'https://h/1.png' }, alt: 'a' },
    { id: 'theirs-1', type: 'image', role: 'technical', scope: 'model', products: ['botanic'], urls: { 800: 'https://h/2.png' }, alt: 'a' },
    { id: 'old-1', type: 'image', role: 'detail', scope: 'model', products: ['x'], status: 'inactive', urls: { 800: 'https://h/3.png' } },
    { id: 'edu-1', type: 'image', role: 'educational', scope: 'shared', products: ['*'], urls: { 800: 'https://h/4.png' }, alt: 'a' },
  ] };
  const withTopic = (asset) => { const m = base(); m.topics = [{ id: 't', chapter: 'c', panel: 'p', options: ['a'], visuals: [{ asset, presentation: 'panel' }] }]; return m; };
  ok(errs(withTopic('own-1'), ctx({ registry: reg })).length === 0, 'a topic may use a visual the model owns');
  ok(has1(errs(withTopic('theirs-1'), ctx({ registry: reg })), /not approved for model "x"/), 'a topic may NOT use another model\'s construction picture');
  ok(has1(errs(withTopic('old-1'), ctx({ registry: reg })), /inactive/), 'a topic may not use an inactive asset');
  ok(has1(errs(withTopic('missing'), ctx({ registry: reg })), /not in the registry/), 'a visual that is not in the registry is an error');
  ok(errs(withTopic('edu-1'), ctx({ registry: reg })).length === 0, 'a shared educational asset approved for every model may be used');
  m_when();
  function m_when() {
    const m = withTopic('own-1'); m.topics[0].visuals[0].when = { option: 'ghost', value: 'v' };
    ok(has1(errs(m, ctx({ registry: reg })), /option "ghost" does not exist/), 'a visual tied to an option the model does not have is an error');
  }
}

/* ====================================================================== */
/* 3. Asset registry rules                                                  */
/* ====================================================================== */
{
  const A = (o) => ({ id: 'a-1', type: 'image', role: 'gallery', scope: 'model', products: ['m'], urls: { 800: 'https://h/1.png' }, alt: 'x', ...o });
  const v = (assets, ctx) => schema.validateAssets({ version: 1, assets }, ctx || { knownModels: ['m', 'n'] });
  const e = (assets, ctx) => v(assets, ctx).errors.map((x) => x.message);
  ok(e([A()]).length === 0, 'a valid asset passes');
  ok(e([A(), A()]).some((m) => /duplicate asset id/.test(m)), 'duplicate asset ids are an error (ids are stable and unique)');
  ok(e([A({ products: [] })]).some((m) => /must name its model/.test(m)), 'a model asset must name its model(s)');
  ok(e([A({ role: 'construction', scope: 'shared', products: ['*'] })]).some((m) => /cannot be approved for "\*"/.test(m)), 'a construction picture cannot be shared with "*"');
  ok(e([A({ role: 'cover', scope: 'shared', products: ['*'] })]).some((m) => /cannot be approved for "\*"/.test(m)), 'a cover picture cannot be shared with "*"');
  ok(e([A({ role: 'educational', scope: 'shared', products: ['*'] })]).length === 0, 'an educational picture may be shared with "*"');
  ok(e([A({ urls: undefined })]).some((m) => /needs urls/.test(m)), 'an image without urls is an error (nothing is typed or derived)');
  ok(e([A({ urls: { 800: 'http://h/1.png' } })]).some((m) => /https/.test(m)), 'a non-https address is an error');
  ok(e([A({ type: 'video', urls: undefined })]).some((m) => /video needs url/.test(m)), 'a video needs a url');
  ok(e([A({ products: ['zzz'] })]).some((m) => /unknown model "zzz"/.test(m)), 'an asset for an unknown model is an error');
  ok(v([A({ alt: undefined })]).warnings.some((w) => /alt text/.test(w.message)), 'a customer-facing image without alt text is a warning');
  ok(e([A({ unknownField: 1 })]).some((m) => /unknown key/.test(m)), 'an unknown asset field is an error');
  const a = (o) => A(o);
  const M = [[a(), 'm', true], [a(), 'n', false], [a({ status: 'inactive' }), 'm', false], [a({ scope: 'shared', products: ['*'], role: 'educational' }), 'n', true], [a({ scope: 'shared', products: ['*'], role: 'technical' }), 'n', false], [a({ scope: 'shared', products: ['n', 'm'] }), 'n', true]];
  ok(M.every(([x, id, want]) => schema.assetFor(x, id) === want), 'the "approved for this model" rule gives the right answer for six cases (owner, other model, inactive, shared, structural-shared, named-shared)');
}

/* ====================================================================== */
/* 4. Validator CLI on deliberately broken models; the scaffold            */
/* ====================================================================== */
{
  const T = tmp();
  mkdirSync(join(T, 'products', 'profiles'), { recursive: true }); mkdirSync(join(T, 'source'), { recursive: true });
  copyFileSync(file('products/profiles/divine-store.profile.js'), join(T, 'products', 'profiles', 'divine-store.profile.js'));
  writeFileSync(join(T, 'source', 'b.html'), '<div id="b-top"><section id="b-one"><h1 class="t">Title</h1></section></div>');
  writeFileSync(join(T, 'products', 'b.config.js'), `(function (g) { g.DDTV_PRODUCTS = g.DDTV_PRODUCTS || {}; g.DDTV_PRODUCTS.broken = {
    id: 'broken', name: 'Broken', status: 'development', extends: 'divine-store', productIds: [424242], sourceRoot: '#b-top',
    chapters: [{ id: 'one', label: 'One', source: '#b-one', panels: [
      { id: 'a', label: 'A', scene: 'hero', params: { headline: '#b-one .t', kicker: '#b-one .does-not-exist' } },
      { id: 'b', label: 'B', scene: 'not-a-scene' } ] }] }; })(window);`);
  writeFileSync(join(T, 'products', 'models.json'), JSON.stringify([{ id: 'broken', name: 'Broken', status: 'development', config: 'products/b.config.js', source: 'source/b.html', profile: 'products/profiles/divine-store.profile.js', ecwid: { test: [424242], live: [] }, deployment: 'not-authorised', production: false }]));
  const r = node(['tools/validate-model.mjs', '--root', T, '--source-check'], { env: { ...process.env } });
  ok(r.status === 1, 'the validator exits with 1 for a broken model');
  ok(has(r, 'scene "not-a-scene" is neither'), '...and says which scene does not exist');
  ok(has(r, 'selector "#b-one .does-not-exist" matches nothing'), '...and which selector matches nothing in the model\'s own description');
  const j = JSON.parse(node(['tools/validate-model.mjs', '--root', T, '--json']).stdout);
  ok(Array.isArray(j.models.broken.errors) && j.models.broken.errors.length >= 1, '--json gives the same result in machine-readable form');

  // scaffold
  const S = tmp();
  mkdirSync(join(S, 'products', 'profiles'), { recursive: true });
  copyFileSync(file('products/profiles/divine-store.profile.js'), join(S, 'products', 'profiles', 'divine-store.profile.js'));
  writeFileSync(join(S, 'products', 'models.json'), '[]');
  const dry = node(['tools/new-model.mjs', 'demo-model', '--name', 'DEMO MODEL', '--product-id', '123456', '--root', S, '--dry-run']);
  ok(dry.status === 0 && !existsSync(join(S, 'products', 'demo-model.config.js')), 'the scaffold\'s --dry-run writes nothing');
  const mk = node(['tools/new-model.mjs', 'demo-model', '--name', 'DEMO MODEL', '--product-id', '123456', '--root', S]);
  ok(mk.status === 0 && existsSync(join(S, 'products', 'demo-model.config.js')) && existsSync(join(S, 'source', 'demo-model-description.html')), 'the scaffold creates a config, an empty registry and a stub description');
  const idxS = JSON.parse(readFileSync(join(S, 'products', 'models.json'), 'utf8'));
  ok(idxS.length === 1 && idxS[0].status === 'development' && idxS[0].deployment === 'not-authorised' && idxS[0].production === false && idxS[0].ecwid.live.length === 0, 'it registers the model as development, not authorised, not production, with no live product');
  const vs = node(['tools/validate-model.mjs', 'demo-model', '--root', S, '--source-check'], { env: { ...process.env } });
  ok(vs.status === 0, 'a freshly scaffolded model validates, selectors included');
  ok(/options: \{\}/.test(readFileSync(join(S, 'products', 'demo-model.config.js'), 'utf8')) && !/firmness|zone|cover/i.test(readFileSync(join(S, 'products', 'demo-model.config.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')), 'the scaffold assumes no option and carries no Botanic concept (no firmness, zones or covers)');
  ok(node(['tools/new-model.mjs', 'demo-model', '--name', 'X', '--product-id', '999', '--root', S]).status === 2, 'it refuses a model id that already exists');
  const live = tmp(); mkdirSync(join(live, 'products'), { recursive: true });
  writeFileSync(join(live, 'products', 'models.json'), JSON.stringify([{ id: 'o', name: 'O', status: 'test', config: 'c', ecwid: { test: [], live: [777] }, deployment: 'not-authorised' }]));
  const lv = node(['tools/new-model.mjs', 'nm', '--name', 'NM', '--product-id', '777', '--root', live]);
  ok(lv.status === 2 && has(lv, 'LIVE product') && !existsSync(join(live, 'products', 'nm.config.js')), 'it refuses to point a new model at a live product, and writes nothing');
  ok(node(['tools/new-model.mjs', 'Bad Id', '--name', 'X', '--product-id', '1']).status === 2, 'it refuses an invalid model id');
}

/* ====================================================================== */
/* 5. Registry data is reproducible; the profile matches Botanic; ratchet   */
/* ====================================================================== */
{
  const T = tmp(), out = join(T, 'regen.js');
  const g = node(['tools/asset-registry.mjs', 'from-legacy', 'products/botanic.config.js', '--model', 'botanic', '--out', out]);
  ok(g.status === 0 && readFileSync(out, 'utf8') === text('products/botanic.assets.js'), 'Botanic\'s registry is exactly what the tool makes from its legacy media list (11 assets, none hand-edited)');
  ok(node(['tools/asset-registry.mjs', 'check', 'products/botanic.assets.js']).status === 0 && node(['tools/asset-registry.mjs', 'check', 'products/examples/placeholder-model.assets.js', '--models', 'placeholder']).status === 0, 'both registries pass the registry check');

  const win = loadScripts([file('products/profiles/divine-store.profile.js'), file('products/botanic.config.js')]);
  const P = win.DDTV_PROFILES['divine-store'], B = win.DDTV_PRODUCTS.botanic;
  const same = (k) => JSON.stringify(P[k]) === JSON.stringify(B[k]);
  const keys = Object.keys(P);
  ok(keys.every(same), `the store profile's values (${keys.join(', ')}) are identical to Botanic's, so Botanic can adopt \`extends\` without any change in behaviour`);

  ok(node(['tools/schema-docs.mjs', '--check']).status === 0, 'docs/SCHEMA-REFERENCE.md is exactly what the schema definitions generate (the reference cannot drift from what the validator enforces)');
  // the sharing claim, checked: the shared files appear byte for byte in BOTH models' pages
  const shared = ['engine/ddtv-engine.js', 'engine/ddtv-scenes.js', 'engine/ddtv-gallery.js', 'engine/ddtv-assets.js', 'engine/ddtv-model.js', 'engine/ddtv-engine.css', 'engine/ddtv-scenes.css', 'engine/ddtv-gallery.css'];
  const pageEx = readFileSync(file('dist/examples/placeholder-model-page.html'), 'utf8'), pageBo = readFileSync(file('dist/botanic-experience-tv-demo.html'), 'utf8');
  ok(shared.every((p) => pageEx.includes(text(p)) && pageBo.includes(text(p))), 'the 8 shared engine files (JS and CSS) appear byte for byte in the Botanic build AND in the placeholder model\'s build: nothing was forked, copied or edited for the second model');
  ok(!shared.some((p) => text(p).includes('placeholder-model') || text(p).includes('900000001')), 'and none of them names the placeholder model or its product id');

  // the ratchet: model-specific tokens in the SHARED code
  const strip = (s, css) => { s = s.replace(/\/\*[\s\S]*?\*\//g, ''); return css ? s : s.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n'); };
  const re = /botanic|#bp-|\.b-[a-z]|'b-[a-z]|dd-botanic/gi;
  const count = (p) => (strip(text(p), p.endsWith('.css')).match(re) || []).length;
  const scenes = text('engine/ddtv-scenes.js'), block = /var DIALECT_DEFAULT = \{[\s\S]*?\n  \};/.exec(scenes)[0];
  const inBlock = (strip(block, false).match(re) || []).length, total = count('engine/ddtv-scenes.js');
  ok(total === inBlock && inBlock === 30, `scene library: every Botanic markup name is inside the one dialect table (${inBlock} of ${total}); none is scattered through the readers`);
  ok(count('engine/ddtv-engine.css') === 3, 'engine CSS: exactly the 3 known Botanic-specific rules (the Classic View badge); a new one fails this test and must be justified in the docs');
  const clean = ['engine/ddtv-engine.js', 'engine/ddtv-gallery.js', 'engine/ddtv-assets.js', 'engine/ddtv-model.js', 'engine/ddtv-gallery.css', 'engine/ddtv-scenes.css'].every((p) => count(p) === 0);
  ok(clean, 'engine, gallery, assets, model and scene CSS: no Botanic name, id or class outside comments');
  const ids = ['876405767', '831592302'].filter((n) => ['engine/ddtv-engine.js', 'engine/ddtv-scenes.js', 'engine/ddtv-gallery.js', 'engine/ddtv-assets.js', 'engine/ddtv-model.js'].some((p) => strip(text(p), false).includes(n)));
  ok(ids.length === 0, 'no Ecwid product id is written in shared code');
}

/* ====================================================================== */
/* 6. A second model on the unchanged engine (browser)                      */
/* ====================================================================== */
const browser = await chromium.launch();
const SVG = (u) => `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000"><rect width="1500" height="1000" fill="#3B8FAE"/><text x="750" y="500" font-size="70" fill="#fff" text-anchor="middle">${u.split('/').pop()}</text></svg>`;
async function open(url, viewport = { width: 1440, height: 900 }, extra = {}, init = []) {
  const ctx = await browser.newContext({ viewport, screen: extra.screen || { width: 1920, height: 1080 }, deviceScaleFactor: 1, ...extra });
  await ctx.addInitScript(() => { sessionStorage.setItem('ddtv:placeholder:splash', '1'); sessionStorage.setItem('ddtv:botanic:splash', '1'); });
  for (const s of init) await ctx.addInitScript(s);
  await ctx.route(/^https?:\/\//, (r) => { const u = r.request().url(); if (/placeholder\.invalid/.test(u)) return r.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG(u), headers: { 'access-control-allow-origin': '*' } }); return r.abort(); });
  const page = await ctx.newPage(), errors = [], warns = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'warning' && /DDTV/.test(m.text())) warns.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.DDTV && DDTV.current, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { ctx, page, errors, warns };
}
const FORBIDDEN = /botanic|latex|zone|firmness|\bcovers?\b|seven|dunlop(?!dreams)|organic|cotton|wool|cashmere/i;

{
  const { ctx, page, errors, warns } = await open(PAGE_EX);
  const info = await page.evaluate(() => { const T = DDTV.current; return { started: !!T, id: T && T.product.id, ver: DDTV.version, labels: T.chapters().map((c) => c.label), btns: T.shadow.querySelectorAll('.ddtv__btn').length, chips: [...T.shadow.querySelectorAll('.ddtv__chip')].map((c) => c.getAttribute('data-opt')), hosts: document.querySelectorAll('.ddtv-host').length, text: T.root.textContent, hasBotanicConfig: !!(window.DDTV_PRODUCTS && DDTV_PRODUCTS.botanic) }; });
  ok(info.started && info.id === 'placeholder' && info.hosts === 1 && !info.hasBotanicConfig, 'the engine starts for the placeholder model on a page that loads NO Botanic file at all (one television)');
  ok(JSON.stringify(info.labels) === JSON.stringify(['Overview', 'Support', 'Sizes', 'Your Selection']) && info.btns === 4, 'it shows the model\'s own four chapters, exactly: no Firmness, Comfort, Height, Covers, 7-Zone, Warranty or Delivery');
  ok(JSON.stringify(info.chips) === JSON.stringify(['size', 'support']), 'its selection panel has exactly the model\'s two options (size, support): no depth, no firmness, no cover');
  ok(!FORBIDDEN.test(info.text), 'nothing from Botanic appears anywhere in the content of the television (no Botanic, latex, zones, firmness, covers, cotton, wool, cashmere; its stylesheet is shared and is not content)');
  ok(warns.filter((w) => !/Audit/.test(w)).length === 0 && errors.length === 0, 'no engine warning and no page error' + (warns.length ? ' [' + warns.join(' | ').slice(0, 160) + ']' : ''));
  const merged = await page.evaluate(() => { const p = DDTV.current.product, g = (o, k) => (o ? o[k] : undefined); return { mount: g(p.layout, 'mountSelector'), price: g(p.price, 'current'), labels: p.viewLabels || {}, brand: g(p.brand, 'name'), own: Object.keys(p.options || {}), prof: DDTV_PROFILES['divine-store'].layout.mountSelector }; });
  ok(merged.mount === merged.prof && merged.price === '.details-product-price__value' && merged.labels.classic === 'Standard Product View' && merged.brand === 'Divine DunlopDreams' && merged.own.join() === 'size,support', 'its layout, price, labels and brand come from the store profile; its options are its own (the merge works: the model wins where it speaks, the profile fills the rest)');
  const same = await page.evaluate(() => { const a = DDTV.current.product; DDTV.start(900000001); return DDTV.current.product === a && document.querySelectorAll('.ddtv-host').length === 1; });
  ok(same, 'a repeated start for the same model keeps the same television (the merged config keeps its identity: no duplicate)');

  // choosing: television -> native, native -> television, price, Add to Bag
  await page.evaluate(() => DDTV.current.go('support', 'choose'));
  await page.evaluate(() => DDTV.current.shadow.querySelectorAll('.sc-slabcard')[1].click());
  await page.evaluate(() => DDTV.current.go('sizes', 'choose'));
  await page.evaluate(() => DDTV.current.shadow.querySelectorAll('.sc-size')[1].click());
  await page.waitForTimeout(300);
  const nat = await page.evaluate(() => ({ support: document.querySelector('.details-product-option--SUPPORT-LEVEL select').value, size: document.querySelector('.details-product-option--MATTRESS-SIZE select').value, price: document.querySelector('.details-product-price__value').textContent, tvPrice: DDTV.current.shadow.querySelector('.ddtv__price-v').textContent }));
  ok(nat.support === 'Supportive (+£20)' && nat.size === 'Double 135x190 cm (+£30)' && nat.price === '£50' && nat.tvPrice === '£50', 'choosing in the television drives the store\'s own two dropdowns, and the store\'s price is what the television shows (£50)');
  await page.selectOption('.details-product-option--MATTRESS-SIZE select', { index: 3 });
  await page.waitForTimeout(300);
  const back = await page.evaluate(() => { const s = DDTV.current.state(); return { size: s.size && s.size.dims, support: s.support && s.support.id, price: DDTV.current.shadow.querySelector('.ddtv__price-v').textContent }; });
  ok(back.size === '150x200' && back.support === 'supportive' && back.price === '£70', 'a change in the store\'s own dropdown is read back: size 150×200, support "supportive", price £70');
  await page.evaluate(() => DDTV.current.go('end', 'yours'));
  await page.waitForTimeout(400);
  const sum = await page.evaluate(() => ({ items: DDTV.current.shadow.querySelectorAll('.sc-sum__item').length, state: DDTV.current.shadow.querySelector('.sc-sum__state').textContent, keys: [...DDTV.current.shadow.querySelectorAll('.sc-sum__k')].map((n) => n.textContent) }));
  ok(sum.items === 2 && /Every choice is made/.test(sum.state) && sum.keys.join() === 'Size,Support', 'the summary screen lists the model\'s two options, in its order, and knows when every choice is made');
  await page.evaluate(() => document.getElementById('mock-add-to-bag').scrollIntoView({ block: 'center' }));
  await page.click('#mock-add-to-bag');
  ok(await page.evaluate(() => window.__bag.length === 1 && window.__bag[0].options.length === 2), 'Add to Bag (the store\'s own button) takes both options');

  // dialect and the model's own scene
  await page.evaluate(() => DDTV.current.go('overview', 'glance'));
  const glance = await page.evaluate(() => DDTV.current.shadow.textContent);
  ok(/Construction/.test(glance) && /One placeholder core/.test(glance) && /Single/.test(glance) && /King/.test(glance), 'the At a Glance screen reads the model\'s own markup (px- classes) through its dialect override');
  const dia = await page.evaluate(() => { const on = DDTV.dialect.current.headTitle; DDTV.stop(); return { on, after: DDTV.dialect.current.headTitle, def: DDTV.dialect.defaults.headTitle }; });
  ok(dia.on === '.px-sh__t' && dia.after === '.b-sh__t' && dia.after === dia.def, 'while the model runs its dialect is active; when it stops the scene library is back to its default');
  await page.evaluate(() => DDTV.start(900000001));
  await page.evaluate(() => DDTV.current.go('overview', 'note'));
  const note = await page.evaluate(() => DDTV.current.shadow.querySelector('.sc-lead') && DDTV.current.shadow.querySelector('.sc-lead').textContent);
  ok(/Placeholder note: no claim here is about a real product/.test(note || ''), 'a scene the model brings itself (config `scenes`) is rendered, from the model\'s own text: the extension mechanism works without touching the shared code');

  // the native gallery, isolation, restore, and the registry feeding the gallery
  const gal = await page.evaluate(() => { const T = DDTV.current; return { rep: T.modelGallery.adapter.report(), btn: !!T.shadow.querySelector('.ddtv__galbtn'), attr: document.querySelector('.product-details__gallery').getAttribute('data-ddtv-gallery') }; });
  ok(gal.btn && gal.attr === 'isolated' && gal.rep.mode === 'manifest' && gal.rep.shown === 3 && gal.rep.resources === 3 && gal.rep.stale.length === 0 && gal.rep.unlisted.length === 0, 'the gallery on the placeholder model: native gallery isolated; the registry feeds it as a manifest: 3 customer photographs, 3 supporting resources, none stale, none unlisted (' + JSON.stringify(gal.rep) + ')');
  await page.locator('.ddtv__galbtn').click();
  await page.waitForTimeout(500);
  const open1 = await page.evaluate(() => { const b = DDTV.current.shadow.querySelector('.ddtv-gal'); return b && { n: b.querySelector('.ddtv-gal__count').textContent, src: b.querySelector('.ddtv-gal__img').getAttribute('src'), thumbs: b.querySelectorAll('.ddtv-gal__thumb').length }; });
  ok(open1 && open1.n === '1 / 3' && open1.thumbs === 3 && /placeholder\.invalid/.test(open1.src), 'View Model Gallery opens on the model\'s 3 customer photographs: the technical illustration, the educational image and the detail stay out of it');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  ok(await page.evaluate(() => DDTV.current.shadow.querySelector('.ddtv-gal__count').textContent === '3 / 3'), 'and the arrows browse them in order');
  await page.keyboard.press('Escape');
  let cyc = true;
  for (let i = 0; i < 4; i++) {
    await page.click('.ddtv-switch button[data-view="classic"]'); await page.waitForTimeout(150);
    const a = await page.evaluate(() => ({ attr: document.querySelector('.product-details__gallery').getAttribute('data-ddtv-gallery'), kids: [...document.querySelector('.product-details__gallery').children].filter((c) => !c.classList.contains('ddtv-host')).every((c) => getComputedStyle(c).display !== 'none'), thumbs: document.querySelectorAll('.details-gallery__thumb').length }));
    await page.click('.ddtv-switch button[data-view="interactive"]'); await page.waitForTimeout(150);
    const b = await page.evaluate(() => ({ attr: document.querySelector('.product-details__gallery').getAttribute('data-ddtv-gallery'), hosts: document.querySelectorAll('.ddtv-host').length, sel: [...document.querySelectorAll('.details-product-option select')].map((s) => s.value).join('|') }));
    if (!(a.attr === null && a.kids && a.thumbs === 4 && b.attr === 'isolated' && b.hosts === 1 && /Single|Double|King/.test(b.sel) && /Supportive/.test(b.sel))) cyc = false;
  }
  ok(cyc, 'four Optimised ↔ Standard cycles: the native gallery is back untouched (4 thumbnails) and isolated again, one television, both chosen options kept');
  // Classic View highlight of the model's own cards
  await page.click('.ddtv-switch button[data-view="classic"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelectorAll('.px-level.ddtv-selected, .px-size.ddtv-selected').length >= 1), 'Standard Product View highlights the customer\'s choice on the model\'s own cards (the sync rules are the model\'s)');
  await page.click('.ddtv-switch button[data-view="interactive"]');
  ok(errors.length === 0, 'no page errors across the whole second-model run ' + errors.join(' | '));
  await ctx.close();
}

{
  // the stacked layout and the phone guard, on the second model
  const vp = { width: 820, height: 1180 };
  const { ctx, page } = await open(PAGE_EX, vp, { hasTouch: true, isMobile: true, screen: vp });
  ok(await page.evaluate(() => DDTV.current.placement === 'stacked' && document.querySelector('.product-details').getAttribute('data-ddtv-stacked') === '1'), 'iPad portrait: the placeholder model gets the stacked layout from the store profile, with no configuration of its own');
  await ctx.close();
  const ph = { width: 390, height: 844 };
  const p2 = await open(PAGE_EX, ph, { hasTouch: true, isMobile: true, screen: ph });
  ok(await p2.page.evaluate(() => !(DDTV.current && DDTV.current.tv && DDTV.current.tv.offsetParent !== null) && !document.querySelector('[data-ddtv-gallery],[data-ddtv-stacked]') && !document.getElementById('ddtv-gallery-style')), 'a phone gets the standard Ecwid page for the second model too: no television, no attribute, no rule');
  await p2.ctx.close();
}

/* ====================================================================== */
/* 7. Two models in one bundle do not touch each other                      */
/* ====================================================================== */
{
  const prof = text('products/profiles/divine-store.profile.js'), exCfg = text('products/examples/placeholder-model.config.js'), exAssets = text('products/examples/placeholder-model.assets.js');
  const a = await open(PAGE_BO, { width: 1440, height: 900 }, {}, [prof, exCfg, exAssets]);
  const ra = await a.page.evaluate(() => ({ models: Object.keys(DDTV_PRODUCTS), id: DDTV.current && DDTV.current.product.id, ch: DDTV.current && DDTV.current.chapters().length, text: DDTV.current && DDTV.current.root.textContent }));
  ok(ra.models.join() === 'placeholder,botanic' && ra.id === 'botanic' && ra.ch === 14 && !/placeholder|invented/i.test(ra.text), 'Botanic\'s page, with the placeholder model also registered: Botanic still starts, with its 14 chapters and nothing of the placeholder');
  ok(a.errors.length === 0, 'no page error');
  await a.ctx.close();
  const botanicCfg = text('products/botanic.config.js');
  const b = await open(PAGE_EX, { width: 1440, height: 900 }, {}, [botanicCfg]);
  const rb = await b.page.evaluate(() => ({ models: Object.keys(DDTV_PRODUCTS), id: DDTV.current && DDTV.current.product.id, text: DDTV.current && DDTV.current.root.textContent }));
  ok(rb.models.length === 2 && rb.id === 'placeholder' && !/botanic|latex|zone|firmness/i.test(rb.text), 'the placeholder\'s page, with Botanic\'s config also registered: the placeholder still starts, with nothing of Botanic');
  const none = await b.page.evaluate(() => { DDTV.stop(); document.querySelector('[class*="ProductPage-"]').className = 'ecwid-productBrowser-ProductPage-111'; return { started: DDTV.start(111), cur: DDTV.current, hosts: document.querySelectorAll('.ddtv-host').length }; });
  ok(!none.started && none.hosts === 0, 'a product that belongs to no model gets no television');
  await b.ctx.close();
}

/* ====================================================================== */
/* 8. Contextual visuals: the resolver shows only what is approved          */
/* ====================================================================== */
{
  const { ctx, page } = await open(PAGE_EX);
  const R = (state) => page.evaluate((st) => { const r = DDTV.current.model.visualsFor('support-choose', st === 'live' ? DDTV.current.state() : st); return { ids: r.visuals.map((v) => v.asset.id), pres: r.visuals.map((v) => v.presentation), blocked: r.blocked.map((b) => b.asset + ': ' + b.reason) }; }, state);
  const t0 = await R('live');
  ok(JSON.stringify(t0.ids) === JSON.stringify(['placeholder-educational-001']) && t0.blocked.some((b) => /technical-001: waits for support = supportive/.test(b)), 'no choice yet: only the shared educational image; the technical illustration waits for "Supportive"');
  await page.evaluate(() => DDTV.current.go('support', 'choose'));
  await page.evaluate(() => DDTV.current.shadow.querySelectorAll('.sc-slabcard')[1].click());
  await page.waitForTimeout(300);
  const t1 = await R('live');
  ok(JSON.stringify(t1.ids) === JSON.stringify(['placeholder-technical-001', 'placeholder-educational-001']) && t1.pres[0] === 'panel', 'after the customer chooses "Supportive": the technical illustration appears first (priority 5), then the educational image (priority 1)');
  await page.evaluate(() => DDTV.current.shadow.querySelectorAll('.sc-slabcard')[0].click());
  await page.waitForTimeout(300);
  ok(JSON.stringify((await R('live')).ids) === JSON.stringify(['placeholder-educational-001']), 'choosing "Gentle" takes the technical illustration away again: a visual is never shown for a choice it does not belong to');
  const lk = await page.evaluate(() => {
    const reg = DDTV_ASSETS.placeholder, a = reg.assets.filter((x) => x.id === 'placeholder-technical-001')[0], st = { support: { id: 'supportive' } }, T = DDTV.current, out = {};
    const ids = () => T.model.visualsFor('support-choose', st).visuals.map((v) => v.asset.id).join();
    const why = () => T.model.visualsFor('support-choose', st).blocked.map((b) => b.reason).join('|');
    out.base = ids();
    a.products = ['another-model']; out.other = ids(); out.otherWhy = why(); a.products = ['placeholder'];
    a.status = 'inactive'; out.inactive = ids(); out.inactiveWhy = why(); a.status = 'active';
    const saved = DDTV_ASSETS.placeholder; delete DDTV_ASSETS.placeholder; out.none = ids(); out.noneWhy = why(); DDTV_ASSETS.placeholder = saved;
    out.restored = ids();
    return out;
  });
  ok(/technical-001/.test(lk.base) && !/technical-001/.test(lk.other) && /not approved for model "placeholder"/.test(lk.otherWhy), 'the same illustration, approved for another model, is blocked for this one (reason: not approved): one model\'s construction picture can never leak into another');
  ok(!/technical-001/.test(lk.inactive) && /inactive/.test(lk.inactiveWhy), 'an inactive asset is blocked');
  ok(lk.none === '' && /no asset registry/.test(lk.noneWhy) && lk.restored === lk.base, 'with no registry nothing is shown, and everything returns when it is back');
  const f = await page.evaluate(() => { const c = Object.assign({}, DDTV_PRODUCTS.placeholder, { features: { contextualVisuals: false } }); DDTV.stop(); DDTV_PRODUCTS.placeholder = c; DDTV.start(900000001); const r = DDTV.current.model.visualsFor('support-choose', {}); return { on: DDTV.current.model.features.contextualVisuals, ids: r.visuals.length, why: r.blocked[0] && r.blocked[0].reason }; });
  ok(f.on === false && f.ids === 0 && /not enabled/.test(f.why), 'a model that switches contextual visuals off gets none, and is told why');
  await ctx.close();
}

/* ====================================================================== */
/* 9. Contracts, capabilities and feature switches                          */
/* ====================================================================== */
{
  const { ctx, page } = await open(PAGE_EX);
  const c = await page.evaluate(() => {
    const T = DDTV.current, K = DDTV.model.contracts, cc = T.connector, g = DDTV.model.conforms;
    return {
      model: g(T.model, K.model), cfgImpl: g(cc, K.configuration.implemented), cfgPlanned: g(cc, K.configuration.planned).missing, imageSource: g(T.modelGallery.adapter, K.imageSource),
      caps: cc.capabilities(), feats: T.model.features, opts: T.model.options().map((o) => o.key + ':' + o.kind), id: T.model.identity(), pres: T.model.presentation(), content: T.model.content().chapters.length,
      topics: T.model.topics().map((t) => t.id), declared: T.model.topics().filter((t) => t.declared).map((t) => t.id),
    };
  });
  ok(c.model.ok && c.cfgImpl.ok && c.imageSource.ok, 'the three contracts are satisfied by what exists: the model descriptor, the configuration connector (its implemented part) and the gallery\'s image source');
  ok(JSON.stringify(c.cfgPlanned) === JSON.stringify(['validate', 'set', 'onNativeChange']), 'the planned synchronisation methods (validate, set, onNativeChange) are NOT implemented, and the test says so: a document cannot claim them');
  ok(c.caps.read && c.caps.choose && c.caps.nativeToTelevision && c.caps.televisionToNative && c.caps.validateCombination === false && c.caps.atomicSet === false && c.caps.writesPrice === false, 'the connector states what it can and cannot do: it reads and drives the native controls; it cannot validate a combination, set options atomically or write a price');
  ok(c.id.id === 'placeholder' && c.id.status === 'placeholder' && c.id.productIds.join() === '900000001' && c.opts.join() === 'size:size,support:list', 'the descriptor says who the model is and which options it has, with their kinds (nothing added)');
  ok(c.feats.modelGallery && c.feats.storefrontImages && c.feats.stackedLayout && c.feats.classicHighlight && c.feats.contextualVisuals, 'features are on because the model configures what they need');
  ok(c.topics.length === 8 && c.declared.join() === 'support-choose', 'topics: every panel is one (8: three in Overview, three in Support, one each in Sizes and Your Selection), and the one the model declares carries its visuals');
  // switching features off
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.waitForTimeout(500);
  const off = await page.evaluate(() => { const c = Object.assign({}, DDTV_PRODUCTS.placeholder, { features: { modelGallery: false, stackedLayout: false, classicHighlight: false } }); DDTV.stop(); DDTV_PRODUCTS.placeholder = c; DDTV.start(900000001); const T = DDTV.current; return { btn: !!T.shadow.querySelector('.ddtv__galbtn'), gallery: !!T.modelGallery, stack: document.querySelectorAll('[data-ddtv-stacked]').length, placement: T.placement }; });
  ok(!off.btn && !off.gallery && off.stack === 0 && off.placement === 'stacked', 'a model can switch features off: no View Model Gallery, no stacked layout rule (the television itself still works)');
  await page.selectOption('.details-product-option--SUPPORT-LEVEL select', { index: 2 });
  await page.click('.ddtv-switch button[data-view="classic"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelectorAll('.ddtv-selected').length === 0), '...and with classicHighlight off, Standard Product View is left exactly as the store has it');
  await ctx.close();

  // Botanic: unchanged by all of this
  const b = await open(PAGE_BO);
  const bo = await b.page.evaluate(() => { const T = DDTV.current; return { id: T.model.identity(), feats: T.model.features, opts: T.model.options().map((o) => o.key + ':' + o.kind).join(), topics: T.model.topics().length, panels: T.product.chapters.reduce((n, c) => n + c.panels.length, 0), assets: T.model.assets().length, manifest: DDTV.assets.manifestFor(T.product), mode: T.modelGallery.adapter.report().mode, why: T.model.visualsFor('x', {}).blocked[0].reason }; });
  ok(bo.id.id === 'botanic' && bo.id.status === 'test' && bo.id.productIds.join() === '876405767' && bo.opts === 'size:size,depth:depth,firmness:firmness,cover:cover', 'Botanic through the same descriptor: its four options with their kinds, status "test", the test product only (the live product is not in it)');
  ok(bo.feats.modelGallery && bo.feats.storefrontImages && bo.feats.stackedLayout && bo.feats.classicHighlight && bo.feats.contextualVisuals === false && /not enabled/.test(bo.why), 'its features are as before, and contextual visuals are off because it declares no topic visuals');
  ok(bo.topics === bo.panels && bo.assets === 11, `its ${bo.panels} panels are its ${bo.topics} topics, and its registry holds its 11 verified supporting assets (videos and cover textures)`);
  ok(bo.manifest === null && bo.mode === 'native', 'its registry has no customer-gallery image, so it produces no manifest and the gallery keeps showing the page\'s own images (behaviour unchanged, never an empty gallery)');
  await b.ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed (simulated)` : '\nAll checks passed (simulated: a placeholder model on an offline stand-in page; no real second product, no live Ecwid)');
process.exit(failures ? 1 : 0);
