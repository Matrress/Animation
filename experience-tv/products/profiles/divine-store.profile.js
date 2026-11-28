/*
 * Divine DunlopDreams — Experience TV
 * PROFILE: the Divine store's Ecwid theme.
 *
 * What belongs to the STORE'S THEME rather than to one mattress: where the television is placed, which Ecwid
 * elements it reads for the price, the gallery selectors, the labels of the two views. A model config says
 * `extends: 'divine-store'` and states only what is its own. The model's values win; nested objects are merged.
 *
 * Every selector here was confirmed on the DOM of the public live product (read-only, 2026-11-07); none has been
 * confirmed on another model's page. These values are the ones products/botanic.config.js carries today (a test
 * checks that they stay identical; Botanic will adopt `extends` once its deployment is approved).
 */
(function (global) {
  'use strict';
  global.DDTV_PROFILES = global.DDTV_PROFILES || {};
  global.DDTV_PROFILES['divine-store'] = {
    experienceTitle: 'Experience',
    viewLabels: { interactive: 'Optimised Preview', classic: 'Standard Product View' },
    brand: { name: 'Divine DunlopDreams', logo: null },
    modelGallery: {
      label: 'View Model Gallery',
      title: 'Model Gallery',
      native: { thumb: '.details-gallery__thumb' },
      manifestUrl: null,
      storefront: true
    },
    layout: {
      mountSelector: '.product-details__gallery',
      mountPosition: 'prepend',
      hideInInteractive: ['.product-details__description-title', '.product-details-module__title--description'],
      gallery: { container: '.product-details__gallery' },
      stacked: { block: '.product-details', fill: ['.product-details__sidebar', '.product-details__description'] },
      placement: 'top',
      alignToSelector: '.details-product-option--SIZE',
      sidePanelSelector: '.product-details__sidebar',
      stackBelowColumn: 700,
      stackBeforeSelector: '.product-details',
      interactiveMinWidth: 720,
      phoneMaxShortSide: 600,
      minTvWidth: 600
    },
    price: {
      current: '.details-product-price__value',
      compare: '.details-product-price-compare__container s',
      discount: '.product-details__product-price-discount'
    }
  };
})(window);
