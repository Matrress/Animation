/*
 * Divine DunlopDreams — Experience TV
 * Product configuration: Botanic (first reference model)
 *
 * This file holds everything that is specific to Botanic. The engine
 * (engine/ddtv-engine.js) holds everything that is shared between models.
 *
 * Content is NOT copied here. Every `take` selector points at a node that
 * already exists in the original product description. The engine moves that
 * node into the television for Interactive View and puts it back for Classic
 * View, so the description stays the single source of content.
 */
(function (global) {
  'use strict';

  var MEDIA = 'https://media.divinedunlop.com';

  global.DDTV_PRODUCTS = global.DDTV_PRODUCTS || {};

  global.DDTV_PRODUCTS.botanic = {
    id: 'botanic',
    name: 'Botanic',

    /* Ecwid product IDs the engine may run on.
       831592302 (live Botanic) is deliberately NOT listed: the live product
       must not change until the test product is approved. */
    productIds: [876405767],

    /* Root element and CSS scope of the original description. */
    sourceRoot: '#bp-top',
    scopeClass: 'dd-botanic-page',

    /* ---------------------------------------------------------------
       Layout integration (Phase F). Every selector here is an
       ASSUMPTION about Ecwid's rendered DOM and must be confirmed
       against the live test product before sign-off.
       --------------------------------------------------------------- */
    layout: {
      /* Left presentation column. The TV is placed at the start of it. */
      mountSelector: '.product-details__gallery',
      mountPosition: 'prepend',
      /* Hide the native gallery while Interactive View is active
         (Discover shows the presentation video instead). Decision pending. */
      hideInInteractive: [
        '.product-details__gallery > :not(.ddtv-wrap)',
        '.product-details__description-title',
        '.product-details-module__title--description'
      ],
      /* The block whose top edge the TV's upper navigation row aligns to. */
      alignToSelector: '.details-product-option--Size',
      /* The right-hand column, used to balance the monitor height. */
      sidePanelSelector: '.product-details__sidebar',
      /* Below this width the TV is never rendered (phones get Classic). */
      interactiveMinWidth: 768
    },

    /* ---------------------------------------------------------------
       Native Ecwid options. `match` is tested against the option title
       rendered by Ecwid. Option names must be confirmed on the test product.
       --------------------------------------------------------------- */
    options: {
      size:     { label: 'Size',     match: /^\s*size/i,            chapter: 'height', panel: 'sizes' },
      depth:    { label: 'Depth',    match: /depth|height/i,        chapter: 'height', panel: 'heights' },
      firmness: { label: 'Firmness', match: /firmness/i,            chapter: 'firmness', panel: 'weight' },
      cover:    { label: 'Cover',    match: /cover/i,               chapter: 'covers', panel: 'textures' }
    },

    /* How raw Ecwid option values map onto the content. Order matters:
       the first matching test wins ("Extra Firm" before "Firm"). */
    values: {
      firmness: [
        { id: 'extra-firm', label: 'Extra Firm', test: /extra/i },
        { id: 'firm',       label: 'Firm',       test: /firm/i },
        { id: 'medium',     label: 'Medium',     test: /medium/i },
        { id: 'soft',       label: 'Soft',       test: /soft/i }
      ],
      cover: [
        { id: 'cashmere', label: 'Cashmere + Silver Ions', test: /cashmere|silver/i, index: 4 },
        { id: 'aloe',     label: 'Aloe Vera + Cotton',     test: /aloe/i,            index: 3 },
        { id: 'wool',     label: 'Cotton & Wool',          test: /wool/i,            index: 2 },
        { id: 'cotton',   label: 'Organic Cotton',         test: /cotton/i,          index: 1 }
      ]
    },

    /* Configuration-aware visualisation: which existing elements reflect
       which native selection. Matching is read from the content itself. */
    sync: [
      { option: 'firmness', items: '.b-fc',  key: '.b-fc__name', badge: 'Your firmness' },
      { option: 'depth',    items: '.b-hcol', key: '.b-hcol__cm', badge: 'Your height', mode: 'number' },
      { option: 'size',     items: '.b-si',  key: '.b-si__n', dims: '.b-si__d', badge: 'Your size', mode: 'size' },
      { option: 'cover',    items: '.b-cover-menu', badge: 'Your cover', mode: 'index',
        radio: '#bp-cover-micro-{n}', tab: 'label[for="bp-cover-micro-{n}"]' }
    ],

    /* Height added by every cover. Source: Covers chapter
       ("All covers add approximately 2 cm … 1 cm top + 1 cm bottom"). */
    coverAddsCm: 2,

    /* ---------------------------------------------------------------
       Chapters. One main button per chapter, in this order.
       `take` lists existing nodes moved into each internal panel.
       Panels without a `label` are not allowed: every panel has its own
       internal navigation tab.
       --------------------------------------------------------------- */
    chapters: [
      {
        id: 'discover', label: 'Discover', source: '#bp-top',
        panels: [
          { id: 'intro', label: 'Introduction', layout: 'hero',
            take: ['#bp-top > .b-hero'] },
          { id: 'glance', label: 'At a Glance', layout: 'dark',
            take: ['#bp-top .b-ocard', '#bp-top > div.b-hero-bar'] }
        ]
      },
      {
        id: 'firmness', label: 'Firmness', source: '#bp-firmness',
        panels: [
          { id: 'weight', label: 'By Body Weight',
            take: ['#bp-firmness .b-sh', '#bp-firmness .b-fcards', '#bp-firmness .b-fdecision'] },
          { id: 'principle', label: 'Correct vs Softer',
            take: ['#bp-firmness .b-fconf', '#bp-firmness .b-dstack--fconf details'] },
          { id: 'regulation', label: 'How It Works',
            take: ['#bp-firmness .b-dstack:not(.b-dstack--fconf):not(.b-dstack--who) details'] },
          { id: 'who', label: 'Who It Is For',
            take: ['#bp-firmness .b-dstack--who details'] }
        ]
      },
      {
        id: 'comfort', label: 'Comfort', source: '#bp-comfort',
        panels: [
          { id: 'expect', label: 'What To Expect',
            take: ['#bp-comfort .b-sh', '#bp-comfort .b-comfort-card'] },
          { id: 'behaviour', label: 'Latex Behaviour',
            take: ['#bp-comfort .b-dstack details'] }
        ]
      },
      {
        id: 'height', label: 'Height', source: '#bp-height',
        panels: [
          { id: 'heights', label: 'Heights', components: ['depthProfile'],
            take: ['#bp-height .b-sh', '#bp-height .b-htable'] },
          { id: 'why', label: 'Why Height Matters',
            take: ['#bp-height .b-dstack details:nth-of-type(1)'] },
          { id: 'sizes', label: 'Sizes',
            take: ['#bp-height .b-dstack details:nth-of-type(2)'] }
        ]
      },
      {
        id: 'covers', label: 'Covers', source: '#bp-covers',
        panels: [
          { id: 'textures', label: 'Textures', layout: 'split',
            take: ['#bp-covers .b-sh', '#bp-covers .b-cover-micro-wrap'] },
          { id: 'materials', label: 'Materials',
            take: ['#bp-covers .b-cover-menus'] },
          { id: 'system', label: 'Cover System',
            take: ['#bp-covers .b-dstack details'] }
        ]
      },
      {
        id: 'benefits', label: 'Benefits', source: '#bp-benefits',
        panels: [
          { id: 'origin', label: 'Origin', layout: 'media-first',
            take: ['#bp-benefits .b-sh', '#bp-benefits .b-proof-layout'] },
          { id: 'why', label: 'Why Latex',
            take: ['#bp-benefits .b-dstack details'] }
        ]
      },
      {
        id: 'support', label: 'Support', source: '#bp-support',
        panels: [
          { id: 'bearing', label: 'Bearing Force',
            take: ['#bp-support .b-sh', '#bp-support .b-bgrid'] },
          { id: 'together', label: 'Support + Adaptation',
            take: ['#bp-support .b-dstack details'] }
        ]
      },
      {
        id: 'adaptation', label: 'Adaptation', source: '#bp-adaptation',
        panels: [
          { id: 'elasticity', label: 'Elasticity', layout: 'media-first',
            take: ['#bp-adaptation .b-sh', '#bp-adaptation .b-proof-layout'] },
          { id: 'feel', label: 'How It Feels',
            take: ['#bp-adaptation .b-dstack details'] }
        ]
      },
      {
        id: 'zones', label: '7-Zone', source: '#bp-zones',
        panels: [
          { id: 'map', label: 'Zone Map', layout: 'media-first',
            take: ['#bp-zones .b-sh', '#bp-zones .b-proof-layout'] },
          { id: 'detail', label: 'Zone By Zone',
            take: ['#bp-zones .b-dstack details'] }
        ]
      },
      {
        id: 'ventilation', label: 'Ventilation', source: '#bp-ventilation',
        panels: [
          { id: 'airflow', label: 'Airflow', layout: 'media-first',
            take: ['#bp-ventilation .b-sh', '#bp-ventilation .b-proof-layout'] },
          { id: 'sleep', label: 'Why It Matters',
            take: ['#bp-ventilation .b-dstack details'] }
        ]
      },
      {
        id: 'hygiene', label: 'Hygiene', source: '#bp-hygiene',
        panels: [
          { id: 'clean', label: 'Cleaner Sleep',
            take: ['#bp-hygiene .b-sh', '#bp-hygiene .b-bgrid'] },
          { id: 'picture', label: 'Realistic Picture',
            take: ['#bp-hygiene .b-dstack details'] }
        ]
      },
      {
        id: 'certs', label: 'Certifications', source: '#bp-certs',
        panels: [
          { id: 'bodies', label: 'Certifications', layout: 'media-first',
            take: ['#bp-certs .b-sh', '#bp-certs .b-proof-layout'] },
          { id: 'made', label: 'Where It Is Made',
            take: ['#bp-certs .b-dstack details'] }
        ]
      },
      {
        id: 'warranty', label: 'Warranty', source: '#bp-warranty',
        panels: [
          { id: 'cover', label: 'Warranty + Gift',
            take: ['#bp-warranty .b-wrow'] },
          { id: 'conditions', label: 'Conditions',
            take: ['#bp-warranty .b-wc details'] }
        ]
      },
      {
        id: 'delivery', label: 'Delivery', source: '#bp-delivery',
        panels: [
          { id: 'made', label: 'Made To Order',
            take: ['#bp-delivery .b-sh', '#bp-delivery .b-dstack details'] },
          { id: 'yours', label: 'Your Botanic', components: ['selectionSummary'],
            take: ['#bp-top > .b-cta'] }
        ]
      }
    ],

    /* Original elements intentionally not shown inside the television,
       with the reason. They stay in place and remain in Classic View. */
    notInTelevision: [
      { selector: '#bp-top > nav.b-hero-bar', reason: 'Section navigation; replaced by the chapter buttons.' },
      { selector: '#bp-top .b-leaf-divider', reason: 'Decorative divider between long-page sections.' },
      { selector: '#bp-top > .b-floating-top', reason: 'Back-to-top link; the television does not scroll the page.' },
      { selector: '#bp-top .b-sh__n', reason: 'Section numbering is not used in Interactive View (kept in Classic View).' }
    ],

    /* Media Asset Registry (Phase A). Exact URLs taken from the source.
       The engine checks at start-up that every entry is present in the
       description and reports anything unaccounted for. */
    media: [
      { url: MEDIA + '/videos/botanic-natural-latex-mattress-premium-presentation-loop.mp4',
        type: 'video', chapter: 'discover', role: 'preview-loop', pairs: 'presentation-full',
        playback: 'autoplay muted loop inline', priority: 'high' },
      { url: MEDIA + '/videos/botanic-natural-latex-mattress-premium-presentation-full.mp4',
        type: 'video', chapter: 'discover', role: 'presentation-full', pairs: 'preview-loop',
        playback: 'user-initiated, controls, sound', priority: 'on-demand' },
      { url: MEDIA + '/videos/natural-latex-milk-to-foam-origin.mp4',
        type: 'video', chapter: 'benefits', role: 'proof-loop', playback: 'autoplay muted loop inline', priority: 'chapter' },
      { url: MEDIA + '/videos/natural-latex-elasticity-adjustable-bed.mp4',
        type: 'video', chapter: 'adaptation', role: 'proof-loop', playback: 'autoplay muted loop inline', priority: 'chapter' },
      { url: MEDIA + '/videos/natural-latex-7-zone-spinal-alignment.mp4',
        type: 'video', chapter: 'zones', role: 'proof-loop', playback: 'autoplay muted loop inline', priority: 'chapter' },
      { url: MEDIA + '/videos/natural-latex-airflow-ventilation-channels.mp4',
        type: 'video', chapter: 'ventilation', role: 'proof-loop', playback: 'autoplay muted loop inline', priority: 'chapter' },
      { url: MEDIA + '/videos/natural-latex-durability-pressure-test.mp4',
        type: 'video', chapter: 'certs', role: 'proof-loop', playback: 'autoplay muted loop inline', priority: 'chapter' },
      { url: MEDIA + '/covers/natural-cotton-cover-texture.webp',
        type: 'image', chapter: 'covers', role: 'cover-texture', cover: 'cotton', priority: 'chapter' },
      { url: MEDIA + '/covers/cotton-wool-cover-texture.webp',
        type: 'image', chapter: 'covers', role: 'cover-texture', cover: 'wool', priority: 'chapter' },
      { url: MEDIA + '/covers/aloe-vera-cotton-viscose-cover-texture.webp',
        type: 'image', chapter: 'covers', role: 'cover-texture', cover: 'aloe', priority: 'chapter' },
      { url: MEDIA + '/covers/cashmere-silver-ions-cover-texture.webp',
        type: 'image', chapter: 'covers', role: 'cover-texture', cover: 'cashmere', priority: 'chapter' }
    ]
  };
})(window);
