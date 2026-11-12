/*!
 * Divine DunlopDreams — Experience TV: Visual Asset Registry
 * (prepared architecture; see docs/ARCHITECTURE-MULTI-MODEL.md, sections 5 and 6)
 *
 * The registry is DATA ABOUT assets. Ecwid still owns the product photographs; nothing here uploads, moves or
 * replaces one, and no address is ever typed or derived: every URL in a registry was copied from Ecwid (or, for a
 * video, from the product's own source). It gives each asset a stable id, the models it belongs to, its sizes, its
 * alt text, its role and categories, its tags, its priority INSIDE the Product TV (independent of the order in Ecwid),
 * whether it may appear in the customer gallery and in which contexts, and whether it is active.
 *
 * What it does:
 *   forModel(reg, model)        the active assets this model may use
 *   manifestFor(product)        the same data in the manifest format the existing gallery already reads, or null
 *   resolveVisuals(product, topic, state)   the approved visuals for a topic and the current selection
 *
 * What it does not do: no dashboard, no upload, no network request, no new screen. A registry is optional: a model
 * without one keeps using the page's own gallery exactly as before.
 *
 * Registries live in window.DDTV_ASSETS[<model id>] (or the name given in modelGallery.assetRegistry).
 * Needs ddtv-engine.js. ES5, no dependencies.
 */
(function (global) {
  'use strict';

  var DDTV = global.DDTV;
  if (!DDTV) return;
  var each = DDTV.util.each;

  var STRUCTURAL = ['construction', 'technical', 'animation'];

  function has(list, v) { for (var i = 0; i < list.length; i++) if (list[i] === v) return true; return false; }

  function registryFor(product) {
    var all = global.DDTV_ASSETS || {}, name = (product.modelGallery && product.modelGallery.assetRegistry) || product.id;
    return all[name] || null;
  }

  /* May this model use this asset? Inactive: never. Named in `products`: yes. "*" (every model): only a shared asset of
     a non-structural role; a picture that says how a mattress is built or finished must name each model it is true for. */
  function allowed(asset, modelId) {
    if (!asset || asset.status === 'inactive') return false;
    var list = asset.products || [];
    if (has(list, modelId)) return true;
    return asset.scope === 'shared' && has(list, '*') && !has(STRUCTURAL, asset.role) && asset.role !== 'cover';
  }

  function forModel(reg, modelId) {
    var out = [];
    if (!reg || !reg.assets) return out;
    each(reg.assets, function (a) { if (allowed(a, modelId)) out.push(a); });
    return out;
  }

  function byId(reg, id) {
    var hit = null;
    if (reg && reg.assets) each(reg.assets, function (a) { if (a.id === id) hit = a; });
    return hit;
  }

  function priorityOf(a) { return typeof a.priority === 'number' ? a.priority : 0; }

  /* The registry as the gallery's media manifest (products/botanic.media.js format). Only images. Customer-facing ones
     first-class; the others are carried as supporting resources (customerGallery: false) so the adapter can report them.
     Returns null when there is no customer-facing image: the gallery then keeps showing the page's own images, never an
     empty area. */
  function manifestFor(product) {
    var reg = registryFor(product);
    if (!reg) return null;
    var list = forModel(reg, product.id).filter(function (a) { return a.type === 'image' && a.urls; });
    var gallery = list.filter(function (a) { return a.visibility && a.visibility.gallery; });
    if (!gallery.length) return null;
    var cats = {}, images = [];
    if (reg.galleryOrder === 'priority') list = list.slice().sort(function (a, b) { return priorityOf(b) - priorityOf(a); });
    each(list, function (a) {
      var cat = (a.categories && a.categories[0]) || a.role, rec = {
        type: 'PICTURE', id: a.ecwid && a.ecwid.mediaId ? String(a.ecwid.mediaId) : '', isMain: a.role === 'main',
        width: a.width || 0, height: a.height || 0, alt: a.alt || '', altType: '',
        image160pxUrl: a.urls[160], image400pxUrl: a.urls[400], image800pxUrl: a.urls[800], image1500pxUrl: a.urls[1500], imageOriginalUrl: a.urls.original,
        category: cat, customerGallery: !!(a.visibility && a.visibility.gallery), usedIn: a.usedIn || [], caption: a.caption || ''
      };
      cats[cat] = a.title || cat;
      images.push(rec);
    });
    return {
      version: 1, productId: (product.productIds || [])[0], order: reg.galleryOrder === 'priority' ? 'manifest' : 'ecwid', unlisted: 'hide',
      categories: cats, images: images
    };
  }

  /* The approved visuals of a topic for the current selection.
       product  the resolved model config
       topicId  a topic of that config
       state    { <option key>: { id: <normalised value id>, … } | null }  (the connector's state)
     Returns { topic, visuals: [{ asset, presentation, relation, caption, priority }], blocked: [{ asset, reason }] }.
     A visual is blocked, never shown, when its asset is missing, inactive or not approved for this model, or when it
     is tied to a value the customer has not chosen. Nothing is shown "close enough". */
  function resolveVisuals(product, topicId, state) {
    var out = { topic: null, visuals: [], blocked: [] }, reg = registryFor(product);
    each(product.topics || [], function (t) { if (t.id === topicId) out.topic = t; });
    if (!out.topic) return out;
    state = state || {};
    each(out.topic.visuals || [], function (v) {
      var a = byId(reg, v.asset);
      if (!reg) { out.blocked.push({ asset: v.asset, reason: 'no asset registry for this model' }); return; }
      if (!a) { out.blocked.push({ asset: v.asset, reason: 'not in the registry' }); return; }
      if (a.status === 'inactive') { out.blocked.push({ asset: v.asset, reason: 'inactive' }); return; }
      if (!allowed(a, product.id)) { out.blocked.push({ asset: v.asset, reason: 'not approved for model "' + product.id + '"' }); return; }
      if (v.when) {
        var cur = state[v.when.option];
        if (!cur || cur.id !== v.when.value) { out.blocked.push({ asset: v.asset, reason: 'waits for ' + v.when.option + ' = ' + v.when.value }); return; }
      }
      out.visuals.push({ asset: a, presentation: v.presentation, relation: v.relation || null, caption: v.caption || a.caption || '', priority: typeof v.priority === 'number' ? v.priority : priorityOf(a) });
    });
    out.visuals.sort(function (x, y) { return y.priority - x.priority; });
    return out;
  }

  /* Legacy: a model config's `media: [...]` list (exact URLs from the source description) as registry assets. */
  function fromLegacyMedia(modelId, media) {
    var out = [];
    each(media || [], function (m, i) {
      var video = m.type === 'video', role = video ? 'video' : (m.role === 'cover-texture' ? 'cover' : 'detail');
      var a = {
        id: modelId + '-' + (m.chapter || 'media') + '-' + role + '-' + (i + 1),
        type: video ? 'video' : 'image', role: role, scope: 'model', products: [modelId], status: 'active',
        tags: [m.role, m.cover].filter(Boolean), usedIn: m.chapter ? ['chapter:' + m.chapter] : [],
        visibility: { gallery: false, contexts: m.chapter ? ['chapter:' + m.chapter] : [] },
        priority: m.priority === 'high' ? 2 : m.priority === 'chapter' ? 1 : 0
      };
      if (video) a.url = m.url; else a.urls = { 800: m.url };   /* a legacy entry carries one address only */
      out.push(a);
    });
    return out;
  }

  DDTV.assets = { registryFor: registryFor, allowed: allowed, forModel: forModel, byId: byId, manifestFor: manifestFor, resolveVisuals: resolveVisuals, fromLegacyMedia: fromLegacyMedia };
})(window);
