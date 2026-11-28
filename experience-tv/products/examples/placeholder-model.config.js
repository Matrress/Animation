/*
 * Divine DunlopDreams — Experience TV
 * Model configuration: PLACEHOLDER MODEL (a non-production example)
 *
 * !! NOT A PRODUCT. NOT APPROVED CONTENT. NOT SHIPPED. !!
 * This is the second model of the reusability proof (docs/ARCHITECTURE-MULTI-MODEL.md, section 10). Its product
 * id is invented (900000001: it is not an Ecwid product of this store), it is never included in a production
 * build, and its description is invented test text. It exists to show what a model has to provide and what it
 * does NOT have to write.
 *
 * What this file does NOT contain (it comes from the shared engine, the scene library, or the store profile):
 *   - any layout, price or gallery selector                  (profile 'divine-store')
 *   - how a size, a list of choices or a summary is drawn      (scene library)
 *   - the two views, the gallery, the mode switching           (engine)
 * What it does contain is only what is specific to this model: its id, its source markup (a content dialect
 * of its own), its options, its choices and its chapters.
 *
 * What it deliberately LACKS, to show that nothing is forced on a model: no depth, no cover, no firmness
 * scale, no seven zones, no video. Features it does not configure stay off.
 */
(function (global) {
  'use strict';

  /* Where each option's choices are written in the placeholder description. */
  var ITEMS = {
    support: { sel: '#px-support .px-level', title: '.px-level__name', detail: '.px-level__detail', text: '.px-level__text' },
    size:    { sel: '#px-sizes .px-size', name: '.px-size__n', dims: '.px-size__d' }
  };

  global.DDTV_PRODUCTS = global.DDTV_PRODUCTS || {};

  global.DDTV_PRODUCTS.placeholder = {
    id: 'placeholder',
    name: 'Placeholder',
    status: 'placeholder',
    extends: 'divine-store',

    productIds: [900000001],
    sourceRoot: '#px-top',

    /* This model's description is written in other markup than Botanic's: only the roles it uses are overridden. */
    dialect: {
      headTitle: '.px-sh__t', headSub: '.px-sh__s',
      factLabel: '.px-fact__lbl', factValue: '.px-fact__val', factPills: '.px-fact__pills span', factNote: '.px-fact__note', factWide: '--wide'
    },

    /* Two options, where Botanic has four. `kind` says how the choices are read and drawn. */
    options: {
      size:    { label: 'Size',    match: /size/i,    chapter: 'sizes',   panel: 'choose', kind: 'size' },
      support: { label: 'Support', match: /support/i, chapter: 'support', panel: 'choose', kind: 'list' }
    },
    values: {
      support: [
        { id: 'gentle',     label: 'Gentle',     test: /gentle/i },
        { id: 'supportive', label: 'Supportive', test: /supportive/i }
      ]
    },

    /* Classic View only: highlight the customer's choice on the original cards. */
    sync: [
      { option: 'support', items: '.px-level', key: '.px-level__name', badge: 'Your support' },
      { option: 'size',    items: '.px-size',  key: '.px-size__n', dims: '.px-size__d', badge: 'Your size', mode: 'size' }
    ],

    chapters: [
      {
        id: 'overview', label: 'Overview', source: '#px-overview',
        panels: [
          { id: 'intro', label: 'Introduction', scene: 'hero', dark: true, params: {
              kicker: '#px-overview .px-kicker', brand: '#px-overview .px-brand', headline: '#px-overview .px-h1',
              intro: '#px-overview .px-intro', actions: '#px-overview .px-btns a', note: '#px-overview .px-rule' } },
          { id: 'glance', label: 'At a Glance', scene: 'facts', params: {
              title: '#px-overview .px-card__title', facts: '#px-overview .px-fact',
              featuresTitle: '#px-overview .px-nav__title', features: '#px-overview .px-nav a' } },
          { id: 'note', label: 'Model Note', scene: 'placeholder-note', params: { text: '#px-overview .px-rule' } }
        ]
      },
      {
        id: 'support', label: 'Support', source: '#px-support',
        panels: [
          { id: 'choose', label: 'Choose', group: 'Select', scene: 'choose', params: {
              option: 'support', visual: 'list', head: '#px-support .px-sh', items: ITEMS.support,
              result: 'result', resultLabel: 'Your support', label: 'Support level',
              hint: 'Choose the level you want.' } },
          { id: 'result', label: 'Your support', group: 'Select', scene: 'result', result: 'support', tour: false, params: {
              option: 'support', visual: 'list', items: ITEMS.support, kicker: 'Your support', choose: 'choose', changeLabel: 'Change support',
              empty: { title: 'No support level chosen yet', text: 'Compare the two levels and choose one.', action: 'Choose support' } } },
          { id: 'how', label: 'How It Is Chosen', group: 'Learn', scene: 'reader', params: { details: '#px-support .px-dstack details' } }
        ]
      },
      {
        id: 'sizes', label: 'Sizes', source: '#px-sizes',
        panels: [
          { id: 'choose', label: 'Choose size', group: 'Select', scene: 'choose', result: 'size', params: {
              option: 'size', visual: 'sizes', head: '#px-sizes .px-sh', items: ITEMS.size, label: 'Mattress size',
              hint: 'Choose a size to see it drawn to scale.' } }
        ]
      },
      {
        id: 'end', label: 'Your Selection', source: '#px-end',
        panels: [
          { id: 'yours', label: 'Your selection', scene: 'summary', params: {
              title: 'Your selection', items: ITEMS, ctaTitle: '#px-end .px-cta__t', ctaText: '#px-end .px-cta__s',
              changeLabel: 'Change', chooseLabel: 'Choose' } }
        ]
      }
    ],

    /* Contextual visuals (prepared architecture: declared and resolved, no screen draws them yet). The technical
       illustration is approved for THIS model only, and only while the customer has chosen "Supportive". */
    topics: [
      { id: 'support-choose', chapter: 'support', panel: 'choose', options: ['support'], visuals: [
          { asset: 'placeholder-technical-001', presentation: 'panel', relation: 'illustrates', when: { option: 'support', value: 'supportive' }, priority: 5 },
          { asset: 'placeholder-educational-001', presentation: 'inline', relation: 'explains', priority: 1 }
      ] }
    ],

    /* A scene of this model's own (the extension mechanism): it wins over a library scene of the same name. It reads
       only what the model's description says. */
    scenes: {
      'placeholder-note': function (c) {
        var U = window.DDTV.util, node = U.$(c.p.text);
        c.root.appendChild(U.el('div', { class: 'sc-glance' }, [U.el('p', { class: 'sc-lead', text: node ? U.txt(node) : '' })]));
      }
    },

    notInTelevision: [],
    media: []
  };
})(window);
