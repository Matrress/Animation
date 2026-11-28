/*!
 * Divine DunlopDreams — Experience TV: schemas and validation
 *
 * ONE dependency-free module, used by the command-line validator (tools/validate-model.mjs), by the tests and, if
 * wanted, in the browser (window.DDTV.schema). It defines:
 *
 *   MODEL            the product model configuration (products/<model>.config.js)
 *   ASSET_REGISTRY   the Visual Asset Registry (products/<model>.assets.js)
 *   VISUAL_REF       a contextual visualisation attached to a topic
 *   MODELS_INDEX     the onboarding index (products/models.json): which models exist and where they may run
 *
 * and the SEMANTIC rules a structural schema cannot express: a scene must exist, an option must point at a screen
 * that exists, a model must not claim another model's visuals, a live product must not be listed before approval.
 *
 * Specs are plain objects: { type, required, enum, items, props, additional, min, pattern, doc }. Types: string,
 * number, integer, boolean, array, object, map (an object whose values all follow `of`), regexp, function, any, null.
 * `additional: 'warn'` (the default for objects) reports unknown keys as warnings, so a typo is caught without
 * stopping a model that is deliberately extended.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.DDTV = root.DDTV || {}; root.DDTV.schema = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Vocabularies                                                         */
  /* ------------------------------------------------------------------ */

  var ENUM = {
    status: ['placeholder', 'development', 'test', 'approved', 'live'],
    optionKind: ['size', 'depth', 'firmness', 'cover', 'list'],
    assetType: ['image', 'video'],
    assetRole: ['main', 'gallery', 'lifestyle', 'detail', 'construction', 'technical', 'cover', 'educational', 'video', 'animation'],
    assetScope: ['model', 'shared'],
    assetStatus: ['active', 'inactive'],
    presentation: ['inline', 'panel', 'expandable', 'media', 'response'],
    relation: ['explains', 'illustrates', 'compares', 'responds-to'],
    /* Features a model may switch off (true or absent = on when configured). */
    feature: ['modelGallery', 'storefrontImages', 'stackedLayout', 'classicHighlight', 'contextualVisuals'],
    /* The content dialect: the class roles the scene library reads (see DDTV.dialect in engine/ddtv-scenes.js). */
    dialectKey: ['summaryNoise', 'quote', 'statsRow', 'statsItem', 'statsValue', 'statsLabel', 'factsTable', 'factsRow', 'factsKey', 'factsValue',
      'chart', 'chartTitle', 'chartRow', 'chartName', 'chartPct', 'headTitle', 'headNumber', 'headSub', 'mediaMode', 'mediaTitle', 'mediaDesc',
      'factLabel', 'factValue', 'factPills', 'factNote', 'factWide', 'coverTag', 'coverBody', 'decisionMark', 'decisionLabel', 'decisionHint', 'detailBody'],
    /* Roles whose pictures say something about HOW a mattress is built: never shared with a model that was not named. */
    structural: ['construction', 'technical', 'animation']
  };

  /* ------------------------------------------------------------------ */
  /* Spec builders                                                        */
  /* ------------------------------------------------------------------ */

  function S(type, o) { o = o || {}; o.type = type; return o; }
  function str(o) { return S('string', o); }
  function sel(o) { o = o || {}; o.doc = o.doc || 'a CSS selector'; return S('string', o); }
  function obj(props, o) { o = o || {}; o.props = props; return S('object', o); }
  function arr(items, o) { o = o || {}; o.items = items; return S('array', o); }
  function map(of, o) { o = o || {}; o.of = of; return S('map', o); }
  function en(values, o) { o = o || {}; o.enum = values; return S('string', o); }
  var num = function (o) { return S('number', o); }, int = function (o) { return S('integer', o); }, bool = function (o) { return S('boolean', o); };
  var re = function (o) { return S('regexp', o); }, fn = function (o) { return S('function', o); }, any = function (o) { return S('any', o); };

  /* ------------------------------------------------------------------ */
  /* The specs                                                            */
  /* ------------------------------------------------------------------ */

  var VISUAL_REF = obj({
    asset: str({ required: true, doc: 'id of an asset in the registry' }),
    presentation: en(ENUM.presentation, { required: true }),
    relation: en(ENUM.relation),
    when: obj({ option: str({ required: true }), value: str({ required: true, doc: 'a normalised value id, e.g. "firmness: soft"' }) }),
    priority: num({ doc: 'higher first' }),
    caption: str()
  }, { additional: false });

  var TOPIC = obj({
    id: str({ required: true, pattern: /^[a-z][a-z0-9-]*$/ }),
    label: str(),
    chapter: str({ required: true }),
    panel: str(),
    options: arr(str(), { doc: 'option keys this topic is about' }),
    visuals: arr(VISUAL_REF),
    content: arr(sel(), { doc: 'selectors of approved description text for this topic' })
  }, { additional: false });

  var PANEL = obj({
    id: str({ required: true }), label: str({ required: true }), scene: str({ required: true }),
    group: str(), dark: bool(), result: str(), tour: bool(), params: obj({}, { additional: true })
  }, { additional: false });

  var CHAPTER = obj({
    id: str({ required: true }), label: str({ required: true }), source: sel({ required: true }),
    panels: arr(PANEL, { required: true, min: 1 })
  }, { additional: false });

  var MODEL = obj({
    id: str({ required: true, pattern: /^[a-z][a-z0-9-]*$/ }),
    name: str({ required: true }),
    status: en(ENUM.status),
    extends: str({ doc: 'a profile in window.DDTV_PROFILES' }),
    experienceTitle: str(),
    productIds: arr(int(), { required: true, min: 1 }),
    sourceRoot: sel({ required: true }),
    dialect: map(sel(), { doc: 'overrides of the content dialect; keys: ' + ENUM.dialectKey.join(', ') }),
    viewLabels: obj({ interactive: str(), classic: str() }, { additional: false }),
    modelGallery: obj({ label: str(), title: str(), native: obj({ thumb: sel(), picture: sel() }), manifestUrl: S('any'), storefront: bool(), assetRegistry: str() }, { additional: false }),
    brand: obj({ name: str(), logo: S('any') }, { additional: false }),
    layout: obj({}, { additional: true }),
    price: obj({ current: sel(), compare: sel(), discount: sel() }, { additional: false }),
    options: map(obj({
      label: str({ required: true }), match: re({ required: true }), chapter: str({ required: true }), panel: str({ required: true }),
      kind: str({ pattern: /^[a-z][a-z0-9-]*$/, doc: 'built-in: ' + ENUM.optionKind.join(', ') + '; a custom kind is registered through DDTV.kinds' })
    }, { additional: false })),
    values: map(arr(obj({ id: str({ required: true }), label: str({ required: true }), test: re({ required: true }), index: int() }, { additional: false }))),
    sync: arr(obj({
      option: str({ required: true }), items: sel({ required: true }), key: sel(), badge: str(), mode: str(), dims: sel(), radio: str(), tab: str()
    }, { additional: false })),
    chapters: arr(CHAPTER, { required: true, min: 1 }),
    features: map(bool()),
    topics: arr(TOPIC),
    scenes: map(fn(), { doc: 'model-specific scenes, by name' }),
    coverAddsCm: num(), zonesSvg: str(),
    notInTelevision: arr(obj({}, { additional: true })),
    media: arr(obj({}, { additional: true }))
  }, { additional: 'warn' });

  var ASSET = obj({
    id: str({ required: true, pattern: /^[a-z0-9][a-z0-9._-]*$/ }),
    type: en(ENUM.assetType, { required: true }),
    role: en(ENUM.assetRole, { required: true }),
    scope: en(ENUM.assetScope, { required: true }),
    products: arr(str(), { doc: 'model ids. scope "model": the owners; scope "shared": the models it is approved for' }),
    status: en(ENUM.assetStatus),
    ecwid: obj({ productId: int(), mediaId: str(), key: str() }, { additional: false }),
    urls: obj({ 160: str(), 400: str(), 800: str(), 1500: str(), original: str() }, { additional: false }),
    url: str({ doc: 'a video or other single file' }),
    alt: str(), title: str(), caption: str(), width: int(), height: int(),
    categories: arr(str()), tags: arr(str()),
    priority: num({ doc: 'priority INSIDE the Product TV; independent of the image\'s order in Ecwid' }),
    visibility: obj({ gallery: bool(), contexts: arr(str()) }, { additional: false }),
    usedIn: arr(str())
  }, { additional: false });

  var ASSET_REGISTRY = obj({
    version: int({ required: true }),
    galleryOrder: en(['ecwid', 'priority'], { doc: 'order of the customer gallery; default ecwid' }),
    assets: arr(ASSET, { required: true })
  }, { additional: false });

  var MODELS_INDEX = arr(obj({
    id: str({ required: true }), name: str({ required: true }), status: en(ENUM.status, { required: true }),
    config: str({ required: true }), assets: str(), source: str(), profile: str(),
    ecwid: obj({ test: arr(int()), live: arr(int()) }, { additional: false }),
    deployment: en(['not-authorised', 'authorised']),
    allowMentions: arr(str(), { doc: 'names of other models this model\'s own text may mention' }),
    production: bool({ doc: 'false: never part of a production build' })
  }, { additional: false }), { min: 1 });

  /* ------------------------------------------------------------------ */
  /* Structural validation                                                */
  /* ------------------------------------------------------------------ */

  function typeOf(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (Object.prototype.toString.call(v) === '[object RegExp]') return 'regexp';   /* not instanceof: a config may come from another realm (a VM, an iframe) */
    return typeof v;
  }

  function check(spec, v, path, out) {
    var t = typeOf(v), i, k, keys;
    function err(msg) { out.errors.push({ path: path, message: msg }); }
    if (v === undefined) { if (spec.required) err('is required'); return; }
    switch (spec.type) {
      case 'any': return;
      case 'string':
        if (t !== 'string') return err('must be a string (is ' + t + ')');
        if (spec.enum && spec.enum.indexOf(v) < 0) err('must be one of ' + spec.enum.join(', ') + ' (is "' + v + '")');
        if (spec.pattern && !spec.pattern.test(v)) err('"' + v + '" does not match ' + spec.pattern);
        if (!v.length && spec.required) err('must not be empty');
        return;
      case 'number': if (t !== 'number' || !isFinite(v)) err('must be a number (is ' + t + ')'); return;
      case 'integer': if (t !== 'number' || v % 1 !== 0) err('must be an integer (is ' + (t === 'number' ? v : t) + ')'); return;
      case 'boolean': if (t !== 'boolean') err('must be true or false (is ' + t + ')'); return;
      case 'regexp': if (t !== 'regexp') err('must be a regular expression (is ' + t + ')'); return;
      case 'function': if (t !== 'function') err('must be a function (is ' + t + ')'); return;
      case 'array':
        if (t !== 'array') return err('must be an array (is ' + t + ')');
        if (spec.min && v.length < spec.min) err('must have at least ' + spec.min + ' item(s)');
        if (spec.items) for (i = 0; i < v.length; i++) check(spec.items, v[i], path + '[' + i + ']', out);
        return;
      case 'map':
        if (t !== 'object') return err('must be an object (is ' + t + ')');
        for (k in v) if (v.hasOwnProperty(k)) check(spec.of, v[k], path + '.' + k, out);
        return;
      case 'object':
        if (t !== 'object') return err('must be an object (is ' + t + ')');
        keys = spec.props || {};
        for (k in keys) if (keys.hasOwnProperty(k)) check(keys[k], v[k], path ? path + '.' + k : k, out);
        if (spec.additional !== true) {
          for (k in v) if (v.hasOwnProperty(k) && !keys.hasOwnProperty(k)) {
            (spec.additional === false ? out.errors : out.warnings).push({ path: path ? path + '.' + k : k, message: 'unknown key' });
          }
        }
        return;
    }
  }

  function run(spec, value, name) {
    var out = { errors: [], warnings: [] };
    check(spec, value, name || '', out);
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Semantic validation                                                  */
  /* ------------------------------------------------------------------ */

  function walkStrings(v, fnc, path) {
    var k, i;
    if (typeof v === 'string') return fnc(v, path);
    if (Array.isArray(v)) { for (i = 0; i < v.length; i++) walkStrings(v[i], fnc, path + '[' + i + ']'); return; }
    if (v && typeof v === 'object' && Object.prototype.toString.call(v) !== '[object RegExp]') for (k in v) if (v.hasOwnProperty(k)) walkStrings(v[k], fnc, path ? path + '.' + k : k);
  }

  function mentions(text, name) { return new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text); }

  /* Is this asset one this model may use? */
  function assetFor(asset, modelId) {
    if (!asset || asset.status === 'inactive') return false;
    var list = asset.products || [];
    return list.indexOf(modelId) >= 0 || (asset.scope === 'shared' && list.indexOf('*') >= 0 && ENUM.structural.indexOf(asset.role) < 0 && asset.role !== 'cover');
  }

  /* ctx: { scenes:[names], profiles:{}, otherModels:[{id,name,productIds}], liveProductIds:[], registry, entry (MODELS_INDEX item) } */
  function validateModel(cfg, ctx) {
    ctx = ctx || {};
    var res = run(MODEL, cfg, 'model'), E = res.errors, W = res.warnings;
    if (!cfg || typeof cfg !== 'object') return res;
    function e(path, msg) { E.push({ path: path, message: msg }); }
    function w(path, msg) { W.push({ path: path, message: msg }); }
    var chapters = Array.isArray(cfg.chapters) ? cfg.chapters : [], i, j, k, ch, pn, o;

    /* identity and where it may run */
    (cfg.productIds || []).forEach(function (id) {
      (ctx.otherModels || []).forEach(function (m) { if ((m.productIds || []).indexOf(id) >= 0 && m.id !== cfg.id) e('model.productIds', 'product ' + id + ' is already claimed by model "' + m.id + '"'); });
      if ((ctx.liveProductIds || []).indexOf(id) >= 0 && ['approved', 'live'].indexOf(cfg.status) < 0 && !(ctx.entry && ctx.entry.deployment === 'authorised')) {
        e('model.productIds', 'product ' + id + ' is a LIVE product; a model is not authorised to run on it (status "' + (cfg.status || 'unset') + '", deployment not authorised)');
      }
    });
    if (ctx.profiles && cfg.extends && !ctx.profiles[cfg.extends]) e('model.extends', 'profile "' + cfg.extends + '" does not exist');

    /* chapters, panels, scenes */
    var chapterIds = {}, panelIds = {};
    chapters.forEach(function (c, ci) {
      if (!c) return;
      if (chapterIds[c.id]) e('model.chapters[' + ci + '].id', 'duplicate chapter id "' + c.id + '"');
      chapterIds[c.id] = true;
      panelIds[c.id] = {};
      (c.panels || []).forEach(function (p, pi) {
        var at = 'model.chapters[' + ci + '].panels[' + pi + ']';
        if (!p) return;
        if (panelIds[c.id][p.id]) e(at + '.id', 'duplicate panel id "' + p.id + '" in chapter "' + c.id + '"');
        panelIds[c.id][p.id] = true;
        if (p.scene && ctx.scenes && ctx.scenes.indexOf(p.scene) < 0 && !(cfg.scenes && cfg.scenes[p.scene])) e(at + '.scene', 'scene "' + p.scene + '" is neither in the scene library nor defined by this model');
      });
    });

    /* options: kinds, the screen where they are chosen, values, sync */
    var opts = cfg.options || {};
    for (k in opts) if (opts.hasOwnProperty(k) && opts[k]) {
      o = opts[k];
      if (o.kind && ENUM.optionKind.indexOf(o.kind) < 0) w('model.options.' + k + '.kind', 'custom kind "' + o.kind + '": it must be registered through DDTV.kinds, or the choices are read as a plain list');
      if (!chapterIds[o.chapter]) e('model.options.' + k + '.chapter', 'chapter "' + o.chapter + '" does not exist');
      else if (!panelIds[o.chapter][o.panel]) e('model.options.' + k + '.panel', 'panel "' + o.panel + '" does not exist in chapter "' + o.chapter + '"');
    }
    for (k in (cfg.values || {})) if (cfg.values.hasOwnProperty(k) && !opts[k]) e('model.values.' + k, 'values for an option the model does not have');
    (cfg.sync || []).forEach(function (s, si) { if (s && !opts[s.option]) e('model.sync[' + si + '].option', 'option "' + s.option + '" does not exist'); });
    chapters.forEach(function (c, ci) {
      (c.panels || []).forEach(function (p, pi) {
        var P = (p && p.params) || {}, at = 'model.chapters[' + ci + '].panels[' + pi + '].params.option';
        if (P.option && !opts[P.option]) e(at, 'option "' + P.option + '" does not exist');
        if (p && p.scene === 'choose' && P.result && !panelIds[c.id][P.result]) w(at, 'result panel "' + P.result + '" does not exist in this chapter');
      });
    });
    if (opts && Object.keys(opts).length && !cfg.price) w('model.price', 'no price selectors: the television will show no price');

    /* dialect */
    for (k in (cfg.dialect || {})) if (cfg.dialect.hasOwnProperty(k) && ENUM.dialectKey.indexOf(k) < 0) w('model.dialect.' + k, 'not a known dialect role (ignored by the scene library)');

    /* features */
    for (k in (cfg.features || {})) if (cfg.features.hasOwnProperty(k) && ENUM.feature.indexOf(k) < 0) w('model.features.' + k, 'not a known feature');

    /* topics and their visuals: every visual must be an asset this model may use */
    (cfg.topics || []).forEach(function (t, ti) {
      var at = 'model.topics[' + ti + ']';
      if (!t) return;
      if (!chapterIds[t.chapter]) e(at + '.chapter', 'chapter "' + t.chapter + '" does not exist');
      else if (t.panel && !panelIds[t.chapter][t.panel]) e(at + '.panel', 'panel "' + t.panel + '" does not exist in chapter "' + t.chapter + '"');
      (t.options || []).forEach(function (ok) { if (!opts[ok]) e(at + '.options', 'option "' + ok + '" does not exist'); });
      (t.visuals || []).forEach(function (v, vi) {
        var vat = at + '.visuals[' + vi + ']', a = null;
        if (!v) return;
        if (v.when && !opts[v.when.option]) e(vat + '.when.option', 'option "' + v.when.option + '" does not exist');
        if (!ctx.registry) return w(vat + '.asset', 'no asset registry supplied: the asset "' + v.asset + '" could not be checked');
        (ctx.registry.assets || []).forEach(function (x) { if (x && x.id === v.asset) a = x; });
        if (!a) e(vat + '.asset', 'asset "' + v.asset + '" is not in the registry');
        else if (!assetFor(a, cfg.id)) e(vat + '.asset', 'asset "' + v.asset + '" is not approved for model "' + cfg.id + '" (scope ' + a.scope + ', products ' + JSON.stringify(a.products || []) + (a.status === 'inactive' ? ', inactive' : '') + ')');
      });
    });

    /* content integrity: this model's own text must not name another model (unless declared) */
    var allow = (ctx.entry && ctx.entry.allowMentions) || [];
    (ctx.otherModels || []).forEach(function (m) {
      if (!m.name || m.id === cfg.id || allow.indexOf(m.name) >= 0) return;
      walkStrings(cfg, function (s, p) { if (mentions(s, m.name)) e('model.' + p, 'mentions another model ("' + m.name + '"): a model\'s content must be its own'); }, '');
    });
    return res;
  }

  function validateAssets(reg, ctx) {
    ctx = ctx || {};
    var res = run(ASSET_REGISTRY, reg, 'registry'), E = res.errors, W = res.warnings;
    if (!reg || !Array.isArray(reg.assets)) return res;
    var seen = {};
    reg.assets.forEach(function (a, i) {
      var at = 'registry.assets[' + i + ']';
      if (!a || typeof a !== 'object') return;
      if (seen[a.id]) E.push({ path: at + '.id', message: 'duplicate asset id "' + a.id + '"' });
      seen[a.id] = true;
      if (a.scope === 'model' && !(a.products && a.products.length)) E.push({ path: at + '.products', message: 'a model-specific asset must name its model(s)' });
      if (a.scope === 'shared' && !(a.products && a.products.length)) E.push({ path: at + '.products', message: 'a shared asset must name the models it is approved for (or "*" for a non-structural role)' });
      if (a.products && a.products.indexOf('*') >= 0 && (ENUM.structural.indexOf(a.role) >= 0 || a.role === 'cover')) {
        E.push({ path: at + '.products', message: 'a "' + a.role + '" asset says how a model is built or finished: it cannot be approved for "*"; name each model' });
      }
      if (a.type === 'image' && !a.urls) E.push({ path: at + '.urls', message: 'an image needs urls (copied from Ecwid, never typed or derived)' });
      if (a.type === 'video' && !a.url) E.push({ path: at + '.url', message: 'a video needs url' });
      ['urls', 'url'].forEach(function (f) {
        var vals = a[f] && typeof a[f] === 'object' ? Object.keys(a[f]).map(function (x) { return a[f][x]; }) : (a[f] ? [a[f]] : []);
        vals.forEach(function (u) { if (typeof u === 'string' && !/^https:\/\//.test(u)) E.push({ path: at + '.' + f, message: 'must be an https URL (is "' + u + '")' }); });
      });
      if (a.type === 'image' && a.status !== 'inactive' && !a.alt && ['main', 'gallery', 'lifestyle', 'detail'].indexOf(a.role) >= 0) W.push({ path: at + '.alt', message: 'a customer-facing image should have alt text' });
      if (a.visibility && a.visibility.gallery && ['educational', 'technical', 'construction', 'animation', 'video'].indexOf(a.role) >= 0) {
        W.push({ path: at + '.visibility.gallery', message: 'a "' + a.role + '" asset is a supporting resource; check that it really belongs in the customer-facing gallery' });
      }
      (ctx.knownModels || []).length && (a.products || []).forEach(function (p) { if (p !== '*' && ctx.knownModels.indexOf(p) < 0) E.push({ path: at + '.products', message: 'unknown model "' + p + '"' }); });
    });
    return res;
  }

  function validateIndex(index) {
    var res = run(MODELS_INDEX, index, 'models'), seen = {};
    (Array.isArray(index) ? index : []).forEach(function (m, i) {
      if (m && seen[m.id]) res.errors.push({ path: 'models[' + i + '].id', message: 'duplicate model id "' + m.id + '"' });
      if (m) seen[m.id] = true;
    });
    return res;
  }

  return {
    ENUM: ENUM,
    specs: { MODEL: MODEL, ASSET_REGISTRY: ASSET_REGISTRY, ASSET: ASSET, VISUAL_REF: VISUAL_REF, TOPIC: TOPIC, MODELS_INDEX: MODELS_INDEX },
    validate: run,
    validateModel: validateModel,
    validateAssets: validateAssets,
    validateIndex: validateIndex,
    assetFor: assetFor
  };
});
