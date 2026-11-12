/*!
 * Divine DunlopDreams — Experience TV: model descriptor and contracts
 * (prepared architecture; see docs/ARCHITECTURE-MULTI-MODEL.md, sections 3, 4, 7, 11 and 14)
 *
 * DDTV.model.resolve(product) turns a model's config into ONE standard object that the engine, the tools and the
 * tests ask instead of reading config keys directly:
 *
 *   identity()           who the model is (id, name, status, Ecwid product ids)
 *   options()            the selection dimensions it really has, with their kinds and values
 *   topics()             its topics (every panel, plus the explicit `topics` it declares)
 *   assets()             the registry assets it may use
 *   visualsFor(topic, state)   the approved contextual visuals for a topic and the current selection
 *   content()            where its approved content lives
 *   presentation()       its view labels, dialect and placement preferences
 *   features             which optional features are on (a feature is on only if the model configures what it
 *                        needs and does not switch it off)
 *
 * It never invents anything: a dimension, a topic, a visual or a feature that the config does not define does not
 * exist here. A model written for another mattress cannot pick up Botanic's firmness scale, zones or covers.
 *
 * DDTV.model.contracts names the interfaces between the engine's subsystems, and DDTV.model.conforms() checks an
 * object against one. Needs ddtv-engine.js (and, for visuals, ddtv-assets.js). ES5, no dependencies.
 */
(function (global) {
  'use strict';

  var DDTV = global.DDTV;
  if (!DDTV) return;
  var each = DDTV.util.each;

  /* Features that something in the engine actually reads. `contextualVisuals` is a declaration only: no screen
     consumes it yet (prepared, not implemented). */
  var FEATURES = ['modelGallery', 'storefrontImages', 'stackedLayout', 'classicHighlight', 'contextualVisuals'];

  function featuresOf(p) {
    var f = p.features || {}, L = p.layout || {}, derived = {
      modelGallery: !!p.modelGallery,
      storefrontImages: !!(p.modelGallery && p.modelGallery.storefront !== false),
      stackedLayout: !!(L.stacked && L.stacked.block),
      classicHighlight: !!(p.sync && p.sync.length),
      contextualVisuals: false
    }, out = {};
    each(p.topics || [], function (t) { if (t.visuals && t.visuals.length) derived.contextualVisuals = true; });
    each(FEATURES, function (k) { out[k] = f[k] === false ? false : derived[k]; });
    return out;
  }

  function resolve(p) {
    var features = featuresOf(p);
    function reg() { return DDTV.assets ? DDTV.assets.registryFor(p) : null; }

    return {
      id: p.id, name: p.name, features: features,

      identity: function () {
        return { id: p.id, name: p.name, status: p.status || 'development', productIds: (p.productIds || []).slice(), experienceTitle: p.experienceTitle || '', brand: (p.brand || {}).name || '' };
      },

      /* The dimensions this model has, in its own order. Nothing is added. */
      options: function () {
        var out = [], k, o;
        for (k in (p.options || {})) if (p.options.hasOwnProperty(k)) {
          o = p.options[k];
          out.push({
            key: k, label: o.label, kind: o.kind || k, chapter: o.chapter, panel: o.panel,
            values: (p.values && p.values[k] ? p.values[k] : []).map(function (v) { return { id: v.id, label: v.label }; })
          });
        }
        return out;
      },

      /* Every panel is a topic; a model may declare richer topics (visuals, the options a topic is about) that win. */
      topics: function () {
        var out = [], declared = {};
        each(p.topics || [], function (t) { declared[t.id] = t; });
        each(p.chapters || [], function (c) {
          each(c.panels || [], function (pn) {
            var id = c.id + '-' + pn.id, d = declared[id];
            out.push({
              id: id, label: pn.label, chapter: c.id, panel: pn.id, scene: pn.scene, group: pn.group || '',
              options: d && d.options ? d.options.slice() : (pn.params && pn.params.option ? [pn.params.option] : []),
              visuals: d && d.visuals ? d.visuals.slice() : [], declared: !!d
            });
            delete declared[id];
          });
        });
        for (var k in declared) if (declared.hasOwnProperty(k)) out.push({ id: k, label: declared[k].label || k, chapter: declared[k].chapter, panel: declared[k].panel || '', scene: '', group: '', options: (declared[k].options || []).slice(), visuals: (declared[k].visuals || []).slice(), declared: true });
        return out;
      },

      assets: function () { return reg() ? DDTV.assets.forModel(reg(), p.id) : []; },

      visualsFor: function (topicId, state) {
        if (!features.contextualVisuals || !DDTV.assets) return { topic: null, visuals: [], blocked: [{ asset: null, reason: 'contextual visuals are not enabled for this model' }] };
        return DDTV.assets.resolveVisuals(p, topicId, state);
      },

      content: function () {
        return { sourceRoot: p.sourceRoot, chapters: (p.chapters || []).map(function (c) { return { id: c.id, source: c.source }; }) };
      },

      presentation: function () {
        return { viewLabels: p.viewLabels || {}, dialect: p.dialect || {}, placement: (p.layout || {}).placement || 'top', experienceTitle: p.experienceTitle || '' };
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Contracts                                                            */
  /* ------------------------------------------------------------------ */

  var contracts = {
    /* What the engine may ask of a model (implemented by resolve()). */
    model: ['identity', 'options', 'topics', 'assets', 'visualsFor', 'content', 'presentation'],
    /* The Ecwid side: reading the native options and price, and driving the native controls. IMPLEMENTED by
       ConfigConnector; the rest is the planned contract for bidirectional synchronisation (docs section 7). */
    configuration: {
      implemented: ['read', 'choose', 'subscribe', 'refresh', 'start', 'stop', 'normalise', 'capabilities'],
      planned: ['validate', 'set', 'onNativeChange']
    },
    /* What a gallery source must give back: normalised images (see ddtv-gallery.js). */
    imageSource: ['snap', 'images', 'report', 'refresh', 'onChange']
  };

  /* Does `obj` have every function named by the contract? Returns { ok, missing }. */
  function conforms(obj, names) {
    var missing = [];
    each(names, function (n) { if (!obj || typeof obj[n] !== 'function') missing.push(n); });
    return { ok: !missing.length, missing: missing };
  }

  DDTV.model = { FEATURES: FEATURES, resolve: resolve, featuresOf: featuresOf, contracts: contracts, conforms: conforms };
})(window);
