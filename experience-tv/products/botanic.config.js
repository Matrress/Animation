/*
 * Divine DunlopDreams — Experience TV
 * Product configuration: Botanic (first reference model)
 *
 * Everything specific to Botanic lives here; the engine and the scene
 * library are shared between models.
 *
 * Content is NOT copied into this file. Every selector points at text,
 * numbers or media that already exist in the original product description
 * (source/botanic-original-description.html). The scenes read them and
 * compose them into screens for the monitor; Classic View keeps showing the
 * description itself, so there is a single source of content.
 *
 * Words written in this file (button labels, "No firmness chosen yet" …) are
 * interface text only, in British English.
 */
(function (global) {
  'use strict';

  var MEDIA = 'https://media.divinedunlop.com';

  /* Where each selectable option's choices are written in the source.
     Shared by the choose screens, the result screens and the summary. */
  var ITEMS = {
    firmness: { sel: '#bp-firmness .b-fc', title: '.b-fc__name', kg: '.b-fc__kg', st: '.b-fc__st', text: '.b-fc__desc' },
    depth:    { sel: '#bp-height .b-hcol', cm: '.b-hcol__cm', inch: '.b-hcol__in', name: '.b-hcol__n', text: '.b-hcol__d' },
    cover:    { micro: '#bp-covers .b-cover-micro-text', img: '#bp-covers .b-cover-micro-slide img', tab: '#bp-covers .b-cover-micro-tabs label', menu: '#bp-covers .b-cover-menu' },
    size:     { sel: '#bp-height .b-sgrid .b-si', name: '.b-si__n', dims: '.b-si__d' }
  };
  var CARDS = { title: '.b-bi__t', text: '.b-bi__d' };

  global.DDTV_PRODUCTS = global.DDTV_PRODUCTS || {};

  global.DDTV_PRODUCTS.botanic = {
    id: 'botanic',
    name: 'Botanic',
    /* 'test': it may run on the test product only. The live product is not authorised. */
    status: 'test',
    experienceTitle: 'Experience',

    /* Ecwid product IDs the engine may run on.
       831592302 (live Botanic) is deliberately NOT listed: the live product
       must not change until the test product is approved. */
    productIds: [876405767],

    /* Root element of the original description. */
    sourceRoot: '#bp-top',

    /* The two presentation modes over the same Ecwid data. Internal ids are
       'interactive' and 'classic'. */
    viewLabels: { interactive: 'Optimised Preview', classic: 'Standard Product View' },

    /* The View Model Gallery inside the television. Ecwid owns the images: the
       television only reads them. `native` says where to read the store's own
       gallery (a snapshot when the television starts). `mediaManifest` (see
       products/botanic.media.js) adds the sizes the store's page does not
       carry, categories, and which images are meant for the customer gallery.
       `manifestUrl` may point at a hosted copy instead (fetched only when needed). */
    modelGallery: {
      label: 'View Model Gallery',
      title: 'Model Gallery',
      native: { thumb: '.details-gallery__thumb' },
      manifestUrl: null,
      /* Automatic image data: the same storefront request Ecwid's own page makes,
         repeated once (no credentials, only when the visitor reaches for the
         gallery) to obtain the 1500 px files, alt text and order. Verified against
         the page's own gallery and ignored if it disagrees or fails. Set false to
         use only what the page itself shows (about 800 px) and the manifest. */
      storefront: true
    },

    /* Brand mark for the short brand moments (opening, presentation, a
       completed configuration) and the sign-off on "Your Botanic".
       `logo` takes the URL of the official logo file once supplied; until
       then the engine shows the name as a wordmark. */
    brand: { name: 'Divine DunlopDreams', logo: null },

    /* ---------------------------------------------------------------
       Layout integration. CONFIRMED against the DOM of the public live
       Botanic product (read-only, local browser, 2026-11-07): the classes
       below exist there. NOT yet confirmed on the test product 876405767.
       --------------------------------------------------------------- */
    layout: {
      /* Left presentation column. The TV is placed at the start of it. */
      mountSelector: '.product-details__gallery',
      mountPosition: 'prepend',
      /* Hidden while Interactive View is active. Never the options column:
         the engine refuses to hide anything inside it. */
      hideInInteractive: [
        '.product-details__description-title',
        '.product-details-module__title--description'
      ],
      /* The store's own image gallery. In Optimised Preview it is isolated, in
         both placements, by one scoped attribute rule (never deleted, never
         cloned, never edited); in Standard Product View it is back, untouched.
         See docs/GALLERY-ARCHITECTURE.md. */
      gallery: { container: '.product-details__gallery' },

      /* Stacked placement only (iPad portrait): the store floats its gallery and
         description left and its options right. With the gallery isolated and the
         description mostly hidden that leaves the left column empty, so while the
         television is stacked the store's own sidebar and description take the
         single column the store uses on small screens (one attribute on the
         product block, one rule, removed on Standard Product View or when the
         placement returns to the column). Nothing is moved or hidden. */
      stacked: { block: '.product-details', fill: ['.product-details__sidebar', '.product-details__description'] },

      /* Vertical position in the column placement:
           'top'  the TV starts at the top of the left column and covers the
                  space above the options (the owner's decision after the
                  annotated screenshot);
           'size' the top row of chapter buttons starts at the same height as
                  the native SIZE selector (V11 prototype), and the space above
                  it stays empty.
         The two instructions conflict; 'top' is the default until the owner
         confirms. Changing it is this one line. */
      placement: 'top',
      alignToSelector: '.details-product-option--SIZE',

      /* The right-hand column, used to balance the monitor height. */
      sidePanelSelector: '.product-details__sidebar',

      /* When the left column is narrower than this (iPad portrait), seven
         chapter buttons per row no longer fit: the TV is placed full width
         directly above this element instead (the product block, untouched). */
      stackBelowColumn: 700,
      stackBeforeSelector: '.product-details',

      /* The TV is never rendered below this window width, nor on a phone (the
         short side of the screen is below phoneMaxShortSide, whatever the
         orientation), nor when it would be narrower than minTvWidth. Those
         visitors get the complete Classic View. */
      interactiveMinWidth: 720,
      phoneMaxShortSide: 600,
      minTvWidth: 600
    },

    /* Price and discount exactly as Ecwid renders them. The TV only mirrors
       this text; it never calculates or stores a price. Confirmed on the
       public live product. */
    price: {
      current: '.details-product-price__value',
      /* Real DOM after a choice: "was <s>£156</s> Save 10%". Absent before. */
      compare: '.details-product-price-compare__container s',
      discount: '.product-details__product-price-discount'
    },

    /* ---------------------------------------------------------------
       Native Ecwid options. `match` is tested against the option title
       rendered by Ecwid; `chapter` / `panel` is the screen where the
       customer chooses it. Live titles: "SIZE", "Select Mattress Depth",
       "FIRMNESS BY BODY WEIGHT", "COVERS". Not yet confirmed on the test
       product.
       --------------------------------------------------------------- */
    options: {
      size:     { label: 'Size',     match: /^\s*size/i,     chapter: 'height',   panel: 'sizes' },
      depth:    { label: 'Depth',    match: /depth|height/i, chapter: 'height',   panel: 'heights' },
      firmness: { label: 'Firmness', match: /firmness/i,     chapter: 'firmness', panel: 'choose' },
      cover:    { label: 'Cover',    match: /cover/i,        chapter: 'covers',   panel: 'choose' }
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

    /* Classic View only: highlight the customer's choice on the original
       cards of the long page. */
    sync: [
      { option: 'firmness', items: '.b-fc',   key: '.b-fc__name', badge: 'Your firmness' },
      { option: 'depth',    items: '.b-hcol', key: '.b-hcol__cm', badge: 'Your height', mode: 'number' },
      { option: 'size',     items: '.b-si',   key: '.b-si__n', dims: '.b-si__d', badge: 'Your size', mode: 'size' },
      { option: 'cover',    items: '.b-cover-menu', badge: 'Your cover', mode: 'index',
        radio: '#bp-cover-micro-{n}', tab: 'label[for="bp-cover-micro-{n}"]' }
    ],

    /* Height added by every cover. Source: Covers chapter
       ("All covers add approximately 2 cm … 1 cm top + 1 cm bottom"). */
    coverAddsCm: 2,

    /* ---------------------------------------------------------------
       Chapters. One main button per chapter, in this order. Each panel is
       one screen: `scene` names the layout, `params` says where its content
       is in the source. `group` ("Select" / "Learn") keeps choosing apart
       from explaining; `result` marks a "Your …" screen; `tour: false`
       keeps it out of the automatic presentation.
       --------------------------------------------------------------- */
    chapters: [
      {
        id: 'discover', label: 'Discover', source: '#bp-top',
        panels: [
          { id: 'intro', label: 'Introduction', scene: 'hero', dark: true, params: {
              kicker: '#bp-top .b-eyebrow', brand: '#bp-top .b-logo-text', headline: '#bp-top .b-h1',
              intro: '#bp-top .b-intro', actions: '#bp-top .b-btns a', note: '#bp-top .b-hero-rule',
              video: '#bp-main-video-card video', videoTitle: '#bp-main-video-card .b-main-video-top',
              fullSrc: '#botanic-main-video-modal video source', fullTitle: '#botanic-main-video-modal .b-video-modal__title',
              fullLabel: '#bp-main-video-card .b-main-video-actions a.b-btn-p' } },
          { id: 'glance', label: 'At a Glance', scene: 'facts', params: {
              title: '#bp-top .b-ocard__title', facts: '#bp-top .b-ocard__item',
              featuresTitle: '#bp-top > div.b-hero-bar .b-hero-bar__title', features: '#bp-top > div.b-hero-bar .b-hero-bar__item' } }
        ]
      },
      {
        id: 'firmness', label: 'Firmness', source: '#bp-firmness',
        panels: [
          { id: 'choose', label: 'Choose', group: 'Select', scene: 'choose', params: {
              option: 'firmness', visual: 'scale', head: '#bp-firmness .b-sh', items: ITEMS.firmness,
              decision: '#bp-firmness .b-fdecision__item', note: '#bp-top .b-ocard__note',
              result: 'result', resultLabel: 'Your firmness', label: 'Firmness by body weight',
              hint: 'Choose the range that holds your own body weight.' } },
          { id: 'result', label: 'Your firmness', group: 'Select', scene: 'result', result: 'firmness', tour: false, params: {
              option: 'firmness', visual: 'firmness', items: ITEMS.firmness, kicker: 'Your firmness',
              note: '#bp-top .b-ocard__note', choose: 'choose', changeLabel: 'Change firmness',
              empty: { title: 'No firmness chosen yet', text: 'Find your own body weight on the scale and choose that range.', action: 'Choose firmness' } } },
          { id: 'principle', label: 'Correct vs Softer', group: 'Learn', scene: 'reader', params: {
              lead: '#bp-firmness .b-fconf__notice', details: '#bp-firmness .b-dstack--fconf details', mode: 'article' } },
          { id: 'regulation', label: 'How It Works', group: 'Learn', scene: 'reader', params: {
              details: '#bp-firmness .b-dstack:not(.b-dstack--fconf):not(.b-dstack--who) details' } },
          { id: 'who', label: 'Who It Is For', group: 'Learn', scene: 'reader', params: {
              details: '#bp-firmness .b-dstack--who details', mode: 'split' } }
        ]
      },
      {
        id: 'comfort', label: 'Comfort', source: '#bp-comfort',
        panels: [
          { id: 'expect', label: 'What To Expect', scene: 'reader', params: {
              head: '#bp-comfort .b-sh', container: '#bp-comfort .b-comfort-card', mode: 'article', leadFirst: true } },
          { id: 'behaviour', label: 'Latex Behaviour', scene: 'reader', params: { details: '#bp-comfort .b-dstack details' } }
        ]
      },
      {
        id: 'height', label: 'Height', source: '#bp-height',
        panels: [
          { id: 'heights', label: 'Choose height', group: 'Select', scene: 'choose', params: {
              option: 'depth', visual: 'slabs', head: '#bp-height .b-sh', items: ITEMS.depth,
              result: 'yourheight', resultLabel: 'Your height', label: 'Mattress depth' } },
          { id: 'yourheight', label: 'Your height', group: 'Select', scene: 'result', result: 'depth', tour: false, params: {
              option: 'depth', visual: 'height', items: ITEMS.depth, kicker: 'Your height', choose: 'heights', changeLabel: 'Change height',
              empty: { title: 'No height chosen yet', text: 'Compare the three depths and choose the one you want.', action: 'Choose height' } } },
          { id: 'sizes', label: 'Choose size', group: 'Select', scene: 'choose', result: 'size', params: {
              option: 'size', visual: 'sizes', title: 'Choose your size', items: ITEMS.size, label: 'Mattress size',
              hint: 'Choose a size to see it drawn to scale.' } },
          { id: 'why', label: 'Why Height Matters', group: 'Learn', scene: 'reader', params: {
              details: '#bp-height .b-dstack details:nth-of-type(1)' } }
        ]
      },
      {
        id: 'covers', label: 'Covers', source: '#bp-covers',
        panels: [
          { id: 'choose', label: 'Choose cover', group: 'Select', scene: 'choose', params: {
              option: 'cover', visual: 'swatches', head: '#bp-covers .b-sh', items: ITEMS.cover,
              result: 'yourcover', resultLabel: 'Your cover', label: 'Cover material' } },
          { id: 'yourcover', label: 'Your cover', group: 'Select', scene: 'result', result: 'cover', tour: false, params: {
              option: 'cover', visual: 'cover', items: ITEMS.cover, kicker: 'Your cover', choose: 'choose', changeLabel: 'Change cover',
              facts: '#bp-covers .b-dstack .b-itab',
              empty: { title: 'No cover chosen yet', text: 'Look at the four materials and choose the one you want.', action: 'Choose cover' } } },
          { id: 'materials', label: 'Materials', group: 'Learn', scene: 'compare', params: {
              items: '#bp-covers .b-cover-menu', images: '#bp-covers .b-cover-micro-slide img' } },
          { id: 'system', label: 'Cover System', group: 'Learn', scene: 'reader', params: { details: '#bp-covers .b-dstack details' } }
        ]
      },
      {
        id: 'benefits', label: 'Benefits', source: '#bp-benefits',
        panels: [
          { id: 'origin', label: 'Origin', scene: 'points', params: {
              head: '#bp-benefits .b-sh', items: '#bp-benefits .b-bi', map: CARDS, media: '#bp-benefits .b-mtv' } },
          { id: 'why', label: 'Why Latex', scene: 'reader', params: { details: '#bp-benefits .b-dstack details' } }
        ]
      },
      {
        id: 'support', label: 'Support', source: '#bp-support',
        panels: [
          { id: 'bearing', label: 'Bearing Force', scene: 'points', params: { head: '#bp-support .b-sh', items: '#bp-support .b-bi', map: CARDS } },
          { id: 'together', label: 'Support + Adaptation', scene: 'reader', params: { details: '#bp-support .b-dstack details' } }
        ]
      },
      {
        id: 'adaptation', label: 'Adaptation', source: '#bp-adaptation',
        panels: [
          { id: 'elasticity', label: 'Elasticity', scene: 'points', params: {
              head: '#bp-adaptation .b-sh', items: '#bp-adaptation .b-bi', map: CARDS, media: '#bp-adaptation .b-mtv' } },
          { id: 'feel', label: 'How It Feels', scene: 'reader', params: { details: '#bp-adaptation .b-dstack details' } }
        ]
      },
      {
        id: 'zones', label: '7-Zone', source: '#bp-zones',
        panels: [
          { id: 'map', label: 'Zone Map', scene: 'zones', params: {
              head: '#bp-zones .b-sh', items: '#bp-zones .b-zone-pill', map: { code: '.b-zone-pill__num', name: '.b-zone-pill__name', note: '.b-zone-pill__note' },
              details: '#bp-zones .b-dstack details', media: '#bp-zones .b-mtv', label: 'Seven support zones, head to feet' } },
          { id: 'detail', label: 'Zone By Zone', scene: 'reader', params: { details: '#bp-zones .b-dstack details', introTitle: 'Overview' } }
        ]
      },
      {
        id: 'ventilation', label: 'Ventilation', source: '#bp-ventilation',
        panels: [
          { id: 'airflow', label: 'Airflow', scene: 'points', params: {
              head: '#bp-ventilation .b-sh', items: '#bp-ventilation .b-bi', map: CARDS, media: '#bp-ventilation .b-mtv' } },
          { id: 'sleep', label: 'Why It Matters', scene: 'reader', params: { details: '#bp-ventilation .b-dstack details' } }
        ]
      },
      {
        id: 'hygiene', label: 'Hygiene', source: '#bp-hygiene',
        panels: [
          { id: 'clean', label: 'Cleaner Sleep', scene: 'points', params: { head: '#bp-hygiene .b-sh', items: '#bp-hygiene .b-bi', map: CARDS } },
          { id: 'picture', label: 'Realistic Picture', scene: 'reader', params: { details: '#bp-hygiene .b-dstack details' } }
        ]
      },
      {
        id: 'certs', label: 'Certifications', source: '#bp-certs',
        panels: [
          { id: 'bodies', label: 'Certifications', scene: 'points', params: {
              head: '#bp-certs .b-sh', items: '#bp-certs .b-cert', map: { title: '.b-cert__m', sub: '.b-cert__s', text: '.b-cert__d' }, media: '#bp-certs .b-mtv' } },
          { id: 'made', label: 'Where It Is Made', scene: 'reader', params: { details: '#bp-certs .b-dstack details' } }
        ]
      },
      {
        id: 'warranty', label: 'Warranty', source: '#bp-warranty',
        panels: [
          { id: 'cover', label: 'Warranty + Gift', scene: 'numerals', params: {
              head: '#bp-warranty .b-sh', items: '#bp-warranty .b-wrow > .b-wc', map: { kicker: '.b-over', value: '.b-wv', unit: '.b-wu', text: '.b-wb' } } },
          { id: 'conditions', label: 'Conditions', scene: 'reader', params: { details: '#bp-warranty .b-wc details' } }
        ]
      },
      {
        id: 'delivery', label: 'Delivery', source: '#bp-delivery',
        panels: [
          { id: 'made', label: 'Made To Order', scene: 'reader', params: { head: '#bp-delivery .b-sh', details: '#bp-delivery .b-dstack details' } },
          { id: 'yours', label: 'Your Botanic', scene: 'summary', params: {
              title: 'Your Botanic', items: ITEMS, ctaTitle: '#bp-top > .b-cta .b-cta__t', ctaText: '#bp-top > .b-cta .b-cta__s',
              changeLabel: 'Change', chooseLabel: 'Choose' } }
        ]
      }
    ],

    /* Original elements the television deliberately does not show (they
       stay in the description and in Classic View), with the reason. The
       coverage test uses this list; anything else in the source must appear
       on a screen. */
    notInTelevision: [
      { selector: '#bp-top > nav.b-hero-bar', reason: 'Section navigation; replaced by the chapter buttons.' },
      { selector: '#bp-top .b-leaf-divider', reason: 'Decorative divider between long-page sections.' },
      { selector: '#bp-top > .b-floating-top', reason: 'Back-to-top link; the television does not scroll the page.' },
      { selector: '#bp-top > .b-cta .b-btn-o[href="#bp-top"]', reason: 'Back to Top; not needed inside the television.' },
      { selector: '#bp-top .b-sh__n', reason: 'Section numbers are not used in Interactive View.' },
      { selector: '#bp-top .b-zone-pill__num', reason: 'Zone codes (Z1–Z7) are not shown; the zone map shows position head to feet instead.' },
      { strip: /\(Z\d\)/g, reason: 'Zone codes inside the zone-by-zone text (see above).' },
      { selector: '#botanic-main-video-modal .b-video-modal__close', reason: 'Close control of the page overlay; the monitor has its own.' },
      { selector: '#bp-main-video-card .b-main-video-actions a.b-btn-o', reason: 'Duplicate of the "Choose Your Firmness" button on the introduction.' },
      { selector: '#bp-height .b-dstack details:nth-of-type(2) > summary', reason: 'Heading says the size list is "for reference only"; the television now lets the customer choose a size.' },
      { selector: '#bp-height .b-label', reason: 'Tells the customer to use the dropdown "above"; the television now lets the customer choose a size.' }
    ],

    /* Media Asset Registry. Exact URLs taken from the source. The engine
       checks at start-up that every entry is present in the description
       and reports anything unaccounted for. */
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
