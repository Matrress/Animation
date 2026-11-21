// Validates product models: structure, semantics, cross-model integrity, assets, and (optionally) the model's own
// description against the selectors its config uses.
//
//   node tools/validate-model.mjs                    every model in products/models.json
//   node tools/validate-model.mjs botanic            one model
//   node tools/validate-model.mjs --source-check     also check every selector against the model's description
//                                                    (needs Playwright: NODE_PATH=$(npm root -g))
//   node tools/validate-model.mjs --json             machine-readable result
//   node tools/validate-model.mjs --index file.json   another models index (paths relative to --root, or absolute)
//   node tools/validate-model.mjs --root dir          where the models' files live (default: this repository)
//
// Exit code 1 when any error is found. Warnings never fail. See docs/ONBOARDING-NEW-MODEL.md.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScripts } from './lib-load.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const schema = require(join(root, 'schema', 'ddtv-schema.js'));
const args = process.argv.slice(2);
const wantJson = args.includes('--json'), sourceCheck = args.includes('--source-check');
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--index' && args[i - 1] !== '--root');
const rootFlag = args.indexOf('--root');
const dataRoot = rootFlag >= 0 ? resolve(args[rootFlag + 1]) : root;   // where the models' own files live (default: this repository)
const at = (p) => resolve(dataRoot, p);   // relative to dataRoot, or absolute
const idxFlag = args.indexOf('--index');

const index = JSON.parse(readFileSync(at(idxFlag >= 0 ? args[idxFlag + 1] : 'products/models.json'), 'utf8'));
const idx = schema.validateIndex(index);
const report = { index: idx, models: {} };

// The scene library's scenes: read from the source, the way the engine registers them.
const sceneSrc = readFileSync(join(root, 'engine', 'ddtv-scenes.js'), 'utf8');
const scenes = [...sceneSrc.matchAll(/^\s*scenes\.([a-z][a-z0-9-]*)\s*=\s*function/gm)].map((m) => m[1]);
// The dialect roles the scene library really has: must equal the schema's list.
const dialectRoles = [...(/var DIALECT_DEFAULT = \{([\s\S]*?)\n  \};/.exec(sceneSrc) || [, ''])[1].matchAll(/([a-zA-Z]+):\s*'/g)].map((m) => m[1]);

// Everything every model loads, in one sandbox (profiles first), as the page would.
const files = [...new Set(index.flatMap((m) => [m.profile, m.config, m.assets]).filter(Boolean))].map(at);
const profiles = index.filter((m) => m.profile).map((m) => at(m.profile));
const win = loadScripts([...new Set(profiles), ...files.filter((f) => !profiles.includes(f))]);

const liveProductIds = index.flatMap((m) => (m.ecwid && m.ecwid.live) || []);
const cfgOf = (m) => Object.values(win.DDTV_PRODUCTS).find((p) => p.id === m.id);

// The same merge the engine does for `extends`.
const isPlain = (o) => !!o && typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
const merge = (base, over) => { const out = { ...base }; for (const k of Object.keys(over)) { if (k === 'extends') continue; out[k] = isPlain(out[k]) && isPlain(over[k]) ? merge(out[k], over[k]) : over[k]; } return out; };

const roleDiff = { missing: schema.ENUM.dialectKey.filter((k) => !dialectRoles.includes(k)), extra: dialectRoles.filter((k) => !schema.ENUM.dialectKey.includes(k)) };
if (roleDiff.missing.length || roleDiff.extra.length) report.index.errors.push({ path: 'schema.ENUM.dialectKey', message: `differs from DIALECT_DEFAULT in engine/ddtv-scenes.js (schema only: ${roleDiff.missing}; scenes only: ${roleDiff.extra})` });

for (const m of index) {
  if (only.length && !only.includes(m.id)) continue;
  const raw = cfgOf(m);
  const res = { errors: [], warnings: [], notes: [] };
  report.models[m.id] = res;
  if (!raw) { res.errors.push({ path: m.config, message: `no model with id "${m.id}" is defined by this file` }); continue; }
  const cfg = raw.extends && win.DDTV_PROFILES[raw.extends] ? merge(win.DDTV_PROFILES[raw.extends], raw) : raw;
  const registry = win.DDTV_ASSETS[m.id];
  const ctx = {
    scenes, profiles: win.DDTV_PROFILES, liveProductIds, registry, entry: m,
    otherModels: index.filter((o) => o.id !== m.id).map((o) => ({ id: o.id, name: o.name, productIds: (cfgOf(o) || {}).productIds || [] })),
  };
  // `chapters`/`options` come from the model; layout/price may come from the profile: validate the merged view.
  const v = schema.validateModel(cfg, ctx);
  res.errors.push(...v.errors); res.warnings.push(...v.warnings);
  if (cfg.id !== m.id) res.errors.push({ path: 'model.id', message: `the index says "${m.id}", the config says "${cfg.id}"` });
  if ((cfg.status || 'development') !== m.status) res.warnings.push({ path: 'model.status', message: `the index says "${m.status}", the config says "${cfg.status || 'unset'}"` });
  const ecwidIds = [...((m.ecwid && m.ecwid.test) || []), ...((m.ecwid && m.ecwid.live) || [])];
  if (m.production !== false) for (const id of cfg.productIds || []) if (!ecwidIds.includes(id)) res.warnings.push({ path: 'model.productIds', message: `product ${id} is not listed in the index under ecwid.test or ecwid.live` });
  if (m.production === false && !(cfg.status === 'placeholder' || cfg.status === 'development')) res.warnings.push({ path: 'index.production', message: 'a model that is never built for production should be status placeholder or development' });
  if (registry) {
    const a = schema.validateAssets(registry, { knownModels: index.map((o) => o.id) });
    res.errors.push(...a.errors); res.warnings.push(...a.warnings);
    // an asset in this model's registry must be approved for this model
    (registry.assets || []).forEach((x, i) => { if (!schema.assetFor(x, m.id) && x.status !== 'inactive') res.errors.push({ path: `registry.assets[${i}]`, message: `asset "${x.id}" is in the registry of "${m.id}" but is not approved for it (products ${JSON.stringify(x.products)})` }); });
  } else res.notes.push('no asset registry: the gallery uses the page\'s own images');
}

// Optional: every selector in the config must match something in the model's own description.
if (sourceCheck) {
  let chromium = null;
  try { ({ chromium } = require('playwright')); } catch (e) { report.sourceCheck = 'skipped: Playwright is not available (run with NODE_PATH=$(npm root -g))'; }
  if (chromium) {
    const browser = await chromium.launch();
    for (const m of index) {
      if (only.length && !only.includes(m.id)) continue;
      const res = report.models[m.id], raw = cfgOf(m);
      if (!res || !raw || !m.source) continue;
      const page = await browser.newPage();
      await page.setContent('<!doctype html><body>' + readFileSync(at(m.source), 'utf8') + '</body>');
      const selectors = new Map();
      const looksLikeSelector = (s) => /^[#.\[]/.test(s) || /\s>\s|^[a-z]+[.#]/.test(s);
      const walk = (v, path) => {
        if (typeof v === 'string') { if (looksLikeSelector(v) && !/\s{2,}|[,.]$/.test(v) && v.length < 200) selectors.set(v, path); return; }
        if (Array.isArray(v)) return v.forEach((x, i) => walk(x, path + '[' + i + ']'));
        if (isPlain(v)) for (const k of Object.keys(v)) walk(v[k], path ? path + '.' + k : k);
      };
      walk({ sourceRoot: raw.sourceRoot, chapters: raw.chapters, sync: raw.sync, dialect: raw.dialect }, '');
      const missing = await page.evaluate((list) => list.filter(([s]) => { try { return !document.querySelector(s); } catch (e) { return true; } }), [...selectors.entries()]);
      // a selector with a {n} placeholder (the engine fills it in) cannot be tested as it stands
      // dialect roles are often optional in a description (section numbers, charts…): a warning; any other selector is an error
      for (const [s, p] of missing) if (!/\{n\}/.test(s)) (/^dialect\./.test(p) ? res.warnings : res.errors).push({ path: p, message: `selector "${s}" matches nothing in ${m.source}` + (/^dialect\./.test(p) ? ' (a dialect role this description may simply not use)' : '') });
      // text of the description must not name another model unless declared
      const text = await page.evaluate(() => document.body.textContent);
      for (const o of index) if (o.id !== m.id && o.name && !(m.allowMentions || []).includes(o.name) && new RegExp('\\b' + o.name + '\\b', 'i').test(text)) res.errors.push({ path: m.source, message: `the description mentions another model ("${o.name}")` });
      await page.close();
      res.notes.push(`source check: ${selectors.size} selector(s) tested against ${m.source}`);
    }
    await browser.close();
  }
}

let errors = report.index.errors.length;
for (const r of Object.values(report.models)) errors += r.errors.length;
if (wantJson) { console.log(JSON.stringify(report, null, 2)); process.exit(errors ? 1 : 0); }
const line = (x) => `${x.path}: ${x.message}`;
if (report.index.errors.length) { console.log('INDEX'); report.index.errors.forEach((x) => console.log('  ERROR   ' + line(x))); }
for (const [id, r] of Object.entries(report.models)) {
  console.log(`${errors && r.errors.length ? 'FAIL' : 'ok  '} ${id}: ${r.errors.length} error(s), ${r.warnings.length} warning(s)`);
  r.errors.forEach((x) => console.log('  ERROR   ' + line(x)));
  r.warnings.forEach((x) => console.log('  warning ' + line(x)));
  r.notes.forEach((x) => console.log('  note    ' + x));
}
if (report.sourceCheck) console.log('note: ' + report.sourceCheck);
console.log(errors ? `\n${errors} error(s)` : '\nAll models valid');
process.exit(errors ? 1 : 0);
