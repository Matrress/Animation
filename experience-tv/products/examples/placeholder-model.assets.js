/*
 * Divine DunlopDreams — Experience TV
 * Visual Asset Registry: PLACEHOLDER MODEL (a non-production example)
 *
 * !! INVENTED DATA. Every address is on the reserved host placeholder.invalid: none of it exists. !!
 *
 * It shows the registry's rules on a model that is not Botanic:
 *   - the four photographs of the stand-in gallery (the addresses are the ones the stand-in page's own gallery carries,
 *     as they would be copied from Ecwid); three are customer-facing, one is a supporting detail
 *   - a technical illustration that belongs to THIS model only (it may appear for the "Supportive" choice, nowhere else)
 *   - a shared educational image approved for every model (allowed because its role is not structural)
 *   - an inactive asset (never used)
 *   - the order in Ecwid is independent of `priority`, which is only the priority inside the Product TV
 */
(function (global) {
  'use strict';
  var BASE = 'https://placeholder.invalid/images/900000001/products/900000001/';
  function photo(n, extra) {
    var a = {
      id: 'placeholder-photo-' + n, type: 'image', scope: 'model', products: ['placeholder'], status: 'active',
      ecwid: { productId: 900000001, mediaId: String(n - 1) },
      urls: { 160: BASE + (7000000 + n * 10 + 1) + '.svg', 400: BASE + (7000000 + n * 10 + 2) + '.svg', 800: BASE + (7000000 + n * 10 + 3) + '.svg', 1500: BASE + (7000000 + n * 10 + 4) + '.svg', original: BASE + (7000000 + n * 10 + 5) + '.svg' },
      alt: 'Placeholder photograph ' + n + ' (not a real product)', width: 1500, height: 1000, categories: [], tags: [], priority: 10 - n
    };
    for (var k in extra) a[k] = extra[k];
    return a;
  }
  global.DDTV_ASSETS = global.DDTV_ASSETS || {};
  global.DDTV_ASSETS.placeholder = {
    version: 1,
    galleryOrder: 'ecwid',
    assets: [
      photo(1, { role: 'main', categories: ['main'], title: 'Main images', visibility: { gallery: true, contexts: ['chapter:overview'] } }),
      photo(2, { role: 'gallery', categories: ['gallery'], title: 'Gallery images', visibility: { gallery: true } }),
      photo(3, { role: 'lifestyle', categories: ['lifestyle'], title: 'Lifestyle images', visibility: { gallery: true } }),
      photo(4, { role: 'detail', categories: ['details'], title: 'Details', visibility: { gallery: false, contexts: ['topic:support-choose'] } }),
      {
        id: 'placeholder-technical-001', type: 'image', role: 'technical', scope: 'model', products: ['placeholder'], status: 'active',
        urls: { 800: 'https://placeholder.invalid/assets/placeholder-technical-001.svg' }, alt: 'Placeholder technical illustration (invented)',
        tags: ['support'], priority: 5, visibility: { gallery: false, contexts: ['topic:support-choose'] }
      },
      {
        id: 'placeholder-educational-001', type: 'image', role: 'educational', scope: 'shared', products: ['*'], status: 'active',
        urls: { 800: 'https://placeholder.invalid/assets/placeholder-educational-001.svg' }, alt: 'Placeholder educational illustration (invented)',
        tags: ['general'], priority: 1, visibility: { gallery: false }
      },
      {
        id: 'placeholder-retired-001', type: 'image', role: 'gallery', scope: 'model', products: ['placeholder'], status: 'inactive',
        urls: { 800: 'https://placeholder.invalid/assets/placeholder-retired-001.svg' }, alt: 'Retired placeholder image', visibility: { gallery: true }
      }
    ]
  };
})(window);
