/*!
 * Divine DunlopDreams — Experience TV Engine
 * Version 0.1.0 (prototype for review — not for live deployment)
 *
 * Shared, product-agnostic infrastructure. A product is described by a
 * configuration object (see products/botanic.config.js).
 *
 *   Relocator         moves existing description nodes into the TV and back
 *   ConfigConnector   reads native Ecwid Size / Depth / Firmness / Cover
 *   MediaManager      plays only what is on screen, defers heavy video
 *   Television        navigation, screen, panels, tour, layout alignment
 *   Scenes            screens composed for the monitor (ddtv-scenes.js)
 *
 * No dependencies. ES5 syntax so older Safari can parse it. If anything
 * fails the original description is left untouched (Classic View).
 */
(function (global) {
  'use strict';

  var VERSION = '0.1.0';
  var doc = global.document;
  var NS = 'ddtv';

  /* ------------------------------------------------------------------ */
  /* Utilities                                                           */
  /* ------------------------------------------------------------------ */

  function $(sel, root) { try { return (root || doc).querySelector(sel); } catch (e) { return null; } }
  function $$(sel, root) {
    try { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); } catch (e) { return []; }
  }
  function txt(node) { return node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function each(list, fn) { for (var i = 0; i < list.length; i++) fn(list[i], i); }
  function noop() {}
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k) || attrs[k] == null || attrs[k] === false) continue;
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
      }
    }
    if (children) each([].concat(children), function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c);
    });
    return node;
  }

  function safeStore(kind) {
    return {
      get: function (k) { try { return global[kind].getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { global[kind].setItem(k, v); } catch (e) { /* storage unavailable */ } }
    };
  }
  var local = safeStore('localStorage');
  var session = safeStore('sessionStorage');

  function debounce(fn, ms) {
    var t;
    return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
  }

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function log() {
    if (global.console && console.info) console.info.apply(console, ['[DDTV]'].concat([].slice.call(arguments)));
  }
  function warn() {
    if (global.console && console.warn) console.warn.apply(console, ['[DDTV]'].concat([].slice.call(arguments)));
  }

  /* ------------------------------------------------------------------ */
  /* Relocator — one copy of content, moved in and out of the TV         */
  /* ------------------------------------------------------------------ */

  function Relocator() { this.moves = []; }

  Relocator.prototype.move = function (node, target) {
    var marker = doc.createComment(NS + '-slot');
    node.parentNode.insertBefore(marker, node);
    var record = { node: node, marker: marker, open: null };
    if (node.tagName === 'DETAILS') {
      record.open = node.hasAttribute('open');
      node.setAttribute('open', '');
    }
    this.moves.push(record);
    target.appendChild(node);
  };

  /* Restore in reverse order so nested moves land back where they were. */
  Relocator.prototype.restoreAll = function () {
    for (var i = this.moves.length - 1; i >= 0; i--) {
      var r = this.moves[i];
      if (r.marker.parentNode) {
        r.marker.parentNode.insertBefore(r.node, r.marker);
        r.marker.parentNode.removeChild(r.marker);
      }
      if (r.open === false) r.node.removeAttribute('open');
    }
    this.moves = [];
  };

  /* ------------------------------------------------------------------ */
  /* ConfigConnector — native Ecwid options are the single source of     */
  /* truth. The TV never moves, restyles or replaces them. It reads them */
  /* and, when the customer taps a choice inside the TV, performs the    */
  /* same change a customer would (value + change event). Price and      */
  /* discount are read from what Ecwid renders, never calculated.        */
  /* ------------------------------------------------------------------ */

  var ECWID = {
    /* Selectors for Ecwid's rendered option blocks. To be confirmed on the
       live test product (see docs/MASTER-PLAN.md, Ecwid Integration). */
    block: '.details-product-option, .product-details-module.details-product-option',
    title: '.details-product-option__title, .product-details-module__title, legend, label.form-control__label'
  };

  function ConfigConnector(product) {
    this.product = product;
    this.listeners = [];
    this.state = {};
    this.last = '';
    this._onEvent = debounce(this.refresh.bind(this), 60);
  }

  ConfigConnector.prototype.keyFor = function (title) {
    var opts = this.product.options || {};
    for (var key in opts) if (opts.hasOwnProperty(key) && opts[key].match.test(title)) return key;
    return null;
  };

  ConfigConnector.prototype.rawValue = function (block) {
    var checked = $('input[type="radio"]:checked, input[type="checkbox"]:checked', block);
    if (checked) {
      var label = (checked.id && $('label[for="' + checked.id + '"]', block)) || (checked.closest && checked.closest('label'));
      return txt(label) || checked.value || null;
    }
    var select = $('select', block);
    if (select && select.selectedIndex >= 0) {
      /* The placeholder ("Please choose") is not a choice. */
      var o = select.options[select.selectedIndex], label = txt(o) || o.value;
      if (!label || o.disabled || /^\s*please\s+choose/i.test(label)) return null;
      return label;
    }
    var swatch = $('[aria-checked="true"], [aria-pressed="true"], .form-control--selected', block);
    if (swatch) return txt(swatch) || swatch.getAttribute('title');
    return null;
  };

  ConfigConnector.prototype.normalise = function (key, raw) {
    if (!raw) return null;
    var out = { raw: raw, label: raw };
    var table = (this.product.values || {})[key];
    if (table) {
      for (var i = 0; i < table.length; i++) {
        if (table[i].test.test(raw)) { out.id = table[i].id; out.label = table[i].label; out.index = table[i].index; break; }
      }
    }
    /* How the raw text is parsed depends on the option's KIND (config:
       options.<key>.kind), not on what the option is called. Without a kind the
       kind is the key, which is what the first model relies on. */
    var kind = ((this.product.options || {})[key] || {}).kind || key;
    var custom = global.DDTV && global.DDTV.kinds && global.DDTV.kinds.normalisers[kind];
    if (custom) custom(raw, out);          /* a kind registered by a model: DDTV.kinds.normalisers.<kind> = function (raw, out) */
    if (kind === 'depth') {
      var m = raw.match(/(\d{2}(?:[.,]\d+)?)\s*cm/i) || raw.match(/(\d{2})/);
      if (m) { out.value = parseFloat(m[1].replace(',', '.')); out.label = out.value + ' cm'; }
    }
    if (kind === 'size') {
      var d = raw.match(/(\d{2,3})\s*[x×*]\s*(\d{2,3})/i);
      if (d) {
        out.dims = d[1] + 'x' + d[2];
        var name = raw.slice(0, d.index).replace(/[\s—–\-·:(]+$/, '').trim();
        out.label = (name ? name + ' · ' : '') + d[1] + '×' + d[2];
      }
    }
    return out;
  };

  ConfigConnector.prototype.read = function () {
    var self = this, state = {};
    for (var k in (this.product.options || {})) state[k] = null;
    each($$(ECWID.block), function (block) {
      var title = txt($(ECWID.title, block)) || block.getAttribute('data-option-name') || '';
      var key = self.keyFor(title);
      if (!key) return;
      state[key] = self.normalise(key, self.rawValue(block));
    });
    state.$price = this.readPrice();
    return state;
  };

  /* Price as rendered by Ecwid (text only). Selectors come from the product
     config; if they match nothing the TV simply shows no price. */
  ConfigConnector.prototype.readPrice = function () {
    var P = this.product.price;
    if (!P) return null;
    var c = txt(P.current && $(P.current)), o = txt(P.compare && $(P.compare)), d = txt(P.discount && $(P.discount));
    if (!c) return null;
    /* The struck-through earlier price and the discount note exist in Ecwid's
       page only once the store shows a discount; until then they are empty. */
    return { current: c, compare: o && o !== c ? o : '', discount: d };
  };

  /* True when two normalised values describe the same option value. */
  function sameValue(a, b) {
    if (!a || !b) return false;
    return !!((a.id && a.id === b.id) || (a.value != null && a.value === b.value) || (a.dims && a.dims === b.dims));
  }
  ConfigConnector.sameValue = sameValue;

  function fire(node, type) {
    var ev;
    try { ev = new Event(type, { bubbles: true, cancelable: true }); }
    catch (e) { ev = doc.createEvent('Event'); ev.initEvent(type, true, true); }
    node.dispatchEvent(ev);
  }

  /* Perform a choice in the native control, as the customer would.
     `ref` is a normalised value (see normalise()). Returns true when a
     matching native option was found and activated. */
  ConfigConnector.prototype.choose = function (key, ref) {
    var self = this, done = false;
    each($$(ECWID.block), function (block) {
      if (done) return;
      var title = txt($(ECWID.title, block)) || block.getAttribute('data-option-name') || '';
      if (self.keyFor(title) !== key) return;
      var select = $('select', block), i, n;
      if (select) {
        for (i = 0; i < select.options.length; i++) {
          var o = select.options[i], t = txt(o) || o.value;
          if (!t) continue;
          n = self.normalise(key, t);
          if (sameValue(n, ref)) {
            select.selectedIndex = i;
            fire(select, 'input');
            fire(select, 'change');
            done = true;
            return;
          }
        }
        return;
      }
      var inputs = $$('input[type="radio"]', block);
      for (i = 0; i < inputs.length; i++) {
        var lab = (inputs[i].id && $('label[for="' + inputs[i].id + '"]', block)) || (inputs[i].closest && inputs[i].closest('label'));
        n = self.normalise(key, txt(lab) || inputs[i].value);
        if (sameValue(n, ref)) { (lab || inputs[i]).click(); done = true; return; }
      }
      var swatches = $$('[role="radio"], [aria-checked], .form-control--radio, .details-product-option__value', block);
      for (i = 0; i < swatches.length; i++) {
        n = self.normalise(key, txt(swatches[i]) || swatches[i].getAttribute('title'));
        if (sameValue(n, ref)) { swatches[i].click(); done = true; return; }
      }
    });
    if (done) this.refresh();
    return done;
  };

  ConfigConnector.prototype.refresh = function () {
    var next = this.read();
    var sig = JSON.stringify(next);
    if (sig === this.last) return;
    var prev = this.state;
    this.state = next;
    this.last = sig;
    each(this.listeners, function (fn) { fn(next, prev); });
  };

  ConfigConnector.prototype.subscribe = function (fn) { this.listeners.push(fn); fn(this.state, null); };

  /* What this connector can and cannot do, stated rather than assumed (docs/ARCHITECTURE-MULTI-MODEL.md, section 7).
     Ecwid stays the only authority: the television reads the native controls and drives them as a customer would. It
     does not know which combinations are valid, never writes a price, and has no way to set several options at once. */
  ConfigConnector.prototype.capabilities = function () {
    return {
      read: true, choose: true, subscribe: true, price: !!this.product.price,
      nativeToTelevision: true, televisionToNative: true,   /* by events and a low-frequency safety poll */
      validateCombination: false, atomicSet: false, writesPrice: false
    };
  };

  ConfigConnector.prototype.start = function () {
    var self = this;
    this.state = this.read();
    this.last = JSON.stringify(this.state);
    doc.addEventListener('change', this._onEvent, true);
    doc.addEventListener('click', this._onEvent, true);
    if (global.MutationObserver) {
      this.mo = new MutationObserver(this._onEvent);
      var L = this.product.layout || {};
      var root = $(L.sidePanelSelector) || $('.product-details') || doc.body;
      this.mo.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'aria-checked', 'checked'] });
    }
    /* Low-frequency safety net for option widgets that change state without
       a DOM event (re-rendered by Ecwid). */
    this.poll = setInterval(function () { if (!doc.hidden) self.refresh(); }, 1500);
  };

  ConfigConnector.prototype.stop = function () {
    doc.removeEventListener('change', this._onEvent, true);
    doc.removeEventListener('click', this._onEvent, true);
    if (this.mo) this.mo.disconnect();
    clearInterval(this.poll);
  };

  /* ------------------------------------------------------------------ */
  /* MediaManager — no hidden video plays, heavy video loads on demand   */
  /* ------------------------------------------------------------------ */

  function MediaManager() { this.parked = []; this.io = null; }

  MediaManager.prototype.park = function (video) {
    if (video.getAttribute('data-ddtv-parked')) return;
    var sources = $$('source', video);
    if (!sources.length) return;
    video.setAttribute('data-ddtv-parked', '1');
    try { video.pause(); } catch (e) { /* ignore */ }
    each(sources, function (s) {
      s.setAttribute('data-ddtv-src', s.getAttribute('src'));
      s.removeAttribute('src');
    });
    video.removeAttribute('autoplay');
    try { video.load(); } catch (e) { /* aborts the pending download */ }
    this.parked.push(video);
  };

  MediaManager.prototype.unpark = function (video) {
    if (!video.getAttribute('data-ddtv-parked')) return;
    video.removeAttribute('data-ddtv-parked');
    each($$('source', video), function (s) {
      if (s.getAttribute('data-ddtv-src')) s.setAttribute('src', s.getAttribute('data-ddtv-src'));
    });
    try { video.load(); } catch (e) { /* ignore */ }
  };

  MediaManager.prototype.isLoop = function (v) { return v.hasAttribute('loop'); };

  /* Interactive View: only the active panel's loop videos play. */
  MediaManager.prototype.focus = function (scope, active) {
    var self = this;
    each($$('video', scope), function (v) {
      var on = active && active.contains(v);
      if (on && self.isLoop(v) && !prefersReducedMotion()) {
        self.unpark(v);
        v.muted = true;
        var p = v.play();
        if (p && p.catch) p.catch(noop);
      } else if (!on) {
        if (!v.paused) try { v.pause(); } catch (e) { /* ignore */ }
      }
    });
  };

  /* Classic View / phones: play loops only while they are on screen. */
  MediaManager.prototype.observe = function (root) {
    var self = this;
    if (!global.IntersectionObserver) return;
    this.io = new IntersectionObserver(function (entries) {
      each(entries, function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          self.unpark(v);
          if (self.isLoop(v) && !prefersReducedMotion()) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(noop); }
        } else if (!v.paused) {
          try { v.pause(); } catch (err) { /* ignore */ }
        }
      });
    }, { rootMargin: '240px 0px' });
    each($$('video', root), function (v) { if (self.isLoop(v)) self.io.observe(v); });
  };

  MediaManager.prototype.unobserve = function () { if (this.io) this.io.disconnect(); this.io = null; };

  MediaManager.prototype.restoreAll = function () {
    var self = this;
    each(this.parked.slice(), function (v) { self.unpark(v); });
    this.parked = [];
  };

  /* ------------------------------------------------------------------ */
  /* Scenes — screens composed for the monitor from the product content. */
  /* Registered by engine/ddtv-scenes.js:  DDTV.scenes[name] = fn(ctx)   */
  /* ------------------------------------------------------------------ */

  var scenes = {};

  /* Extensions attached to every television: fn(tv) returns { view(v), destroy() }.
     The model gallery registers itself here (engine/ddtv-gallery.js). */
  var extensions = [];

  /* ------------------------------------------------------------------ */
  /* Television                                                          */
  /* ------------------------------------------------------------------ */

  function Television(product, options) {
    this.product = product;
    /* The model as the engine sees it (identity, options, topics, features): see ddtv-model.js.
       Without that file every feature behaves as the config alone says. */
    this.model = (global.DDTV && global.DDTV.model) ? global.DDTV.model.resolve(product) : null;
    this.opts = options || {};
    this.reloc = new Relocator();
    this.media = new MediaManager();
    this.connector = new ConfigConnector(product);
    this.view = null;
    this.chapterIndex = 0;
    this.panelIndex = {};
    this.visited = {};
    this.scenes = [];
    this.hidden = [];
    this.tourTimer = null;
    this.playing = false;
    this.sourceRoot = $(product.sourceRoot);
    this.storeKey = NS + ':' + product.id;
    this._layout = debounce(this.layout.bind(this), 80);
    this._key = this.onKey.bind(this);
    this.gallery = new NativeGallery(this);   /* isolation of the store's own gallery */
    this.ext = [];                            /* extensions attached with DDTV.use (e.g. the model gallery) */
    this.overlayCleanup = null;
    this.overlayKeys = null;
    this._recover = debounce(this.recover.bind(this), 60);
  }

  Television.prototype.chapters = function () { return this.product.chapters; };

  /* Still the television of the page on screen: mounted, and built from the
     very description node that is in the page now. */
  Television.prototype.alive = function () {
    return !!(this.host && this.host.isConnected && this.sourceRoot && this.sourceRoot.isConnected &&
      $(this.product.sourceRoot) === this.sourceRoot);
  };

  /* ---------------- shell ---------------- */

  Television.prototype.build = function () {
    var self = this, p = this.product, ch = p.chapters;
    var half = Math.ceil(ch.length / 2);

    function bar(list, where) {
      /* Equal tiles: as many columns as buttons in the row, so 9, 12 or 14
         chapters all fill the width without code changes. */
      var nav = el('nav', { class: 'ddtv__bar ddtv__bar--' + where, 'aria-label': p.name + ' chapters', style: '--ddtv-cols:' + list.length });
      each(list, function (c) {
        nav.appendChild(el('button', {
          type: 'button', class: 'ddtv__btn', 'data-chapter': c.id, 'aria-pressed': 'false',
          onclick: function () { self.userAction(); self.go(c.id); }
        }, [el('span', { class: 'ddtv__btn-dot', 'aria-hidden': 'true' }), c.label]));
      });
      return nav;
    }

    this.stage = el('div', { class: 'ddtv__stage ' + (p.scopeClass || '') });
    this.overlay = el('div', { class: 'ddtv__overlay', hidden: true });
    this.toastEl = el('p', { class: 'ddtv__toast', role: 'status', 'aria-live': 'polite', hidden: true });
    this.viewport = el('div', { class: 'ddtv__viewport' }, [this.stage, this.overlay, this.toastEl]);
    this.titleEl = el('h3', { class: 'ddtv__title', id: NS + '-title-' + p.id });
    this.tabsEl = el('div', { class: 'ddtv__tabs', role: 'tablist', 'aria-orientation': 'vertical', 'aria-labelledby': this.titleEl.id });
    this.chipsEl = el('div', { class: 'ddtv__chips', 'aria-label': 'Your selection in the options panel' });
    this.priceEl = el('div', { class: 'ddtv__price', 'aria-label': 'Price', hidden: true });
    this.brandEl = el('div', { class: 'ddtv__brand', 'aria-hidden': 'true', hidden: true });
    this.prevBtn = el('button', { type: 'button', class: 'ddtv__nav ddtv__nav--prev', 'aria-label': 'Previous', onclick: function () { self.userAction(); self.step(-1); } }, [el('span', { 'aria-hidden': 'true', text: '‹' }), el('span', { class: 'ddtv__nav-txt' })]);
    this.nextBtn = el('button', { type: 'button', class: 'ddtv__nav ddtv__nav--next', 'aria-label': 'Next', onclick: function () { self.userAction(); self.step(1); } }, [el('span', { class: 'ddtv__nav-txt' }), el('span', { 'aria-hidden': 'true', text: '›' })]);
    this.playBtn = el('button', { type: 'button', class: 'ddtv__play', 'aria-pressed': 'false', onclick: function () { self.togglePlay(); } }, [
      el('span', { class: 'ddtv__play-ico', 'aria-hidden': 'true' }), el('span', { class: 'ddtv__play-txt', text: 'Play presentation' })
    ]);
    this.dotsEl = el('div', { class: 'ddtv__dots', 'aria-hidden': 'true' });
    this.progressEl = el('div', { class: 'ddtv__progress', 'aria-hidden': 'true' }, [el('i')]);

    /* Monitor: Explore sidebar (internal screens + read-only selection)
       beside the chapter content. */
    this.screen = el('div', { class: 'ddtv__screen' }, [
      el('div', { class: 'ddtv__aside' }, [
        el('div', { class: 'ddtv__explore' }, [el('p', { class: 'ddtv__aside-k', text: 'Explore' }), this.tabsEl]),
        /* Pinned: always on screen, whatever the chapter or screen height. */
        el('div', { class: 'ddtv__mine', role: 'region', 'aria-label': 'Your selection' }, [
          el('p', { class: 'ddtv__aside-k', text: 'Your selection' }),
          this.chipsEl,
          this.priceEl
        ])
      ]),
      el('div', { class: 'ddtv__main' }, [
        el('div', { class: 'ddtv__head' }, [
          this.titleEl,
          el('span', { class: 'ddtv__eyebrow', text: p.name + ' ' + (p.experienceTitle || 'Experience') })
        ]),
        this.viewport,
        el('div', { class: 'ddtv__foot' }, [this.prevBtn, el('div', { class: 'ddtv__mid' }, [this.playBtn, this.dotsEl]), this.nextBtn])
      ]),
      this.progressEl,
      this.brandEl
    ]);

    this.tv = el('div', { class: 'ddtv', tabindex: '-1', 'aria-roledescription': 'interactive product presentation' }, [
      bar(ch.slice(0, half), 'top'),
      this.screen,
      bar(ch.slice(half), 'bottom')
    ]);

    /* The two modes over the same Ecwid data. Internal ids stay 'interactive'
       and 'classic'; the names the customer sees come from the config. */
    var VL = p.viewLabels || {};
    this.switchEl = el('div', { class: 'ddtv-switch', role: 'group', 'aria-label': 'Product presentation' }, [
      el('button', { type: 'button', 'data-view': 'interactive', onclick: function () { self.setView('interactive', true); }, text: VL.interactive || 'Optimised Preview' }),
      el('button', { type: 'button', 'data-view': 'classic', onclick: function () { self.setView('classic', true); }, text: VL.classic || 'Standard Product View' })
    ]);

    var brand = el('p', { class: 'ddtv-top__brand' }, [el('b', { text: p.name }), ' / ' + (p.experienceTitle || 'Experience')]);
    this.topEl = el('div', { class: 'ddtv-top' }, [brand, this.switchEl]);

    this.root = el('div', { class: 'ddtv-wrap', 'data-ddtv-product': p.id }, [this.topEl, this.tv]);

    /* Isolation. The store's own stylesheet restyles plain elements (nav,
       figure, h2, button …) inside its product area with rules that beat
       any class we could write. The television therefore lives in a shadow
       root: those rules cannot reach it, and it keeps its own styles. The
       source description and the Ecwid options stay in the page, untouched. */
    this.host = el('div', { class: 'ddtv-host', 'data-ddtv-product': p.id });
    this.host.style.cssText = 'all: initial; display: block; width: 100%;';
    this.shadow = this.host.attachShadow({ mode: 'open' });
    var sheet = doc.getElementById('ddtv-styles');
    this.shadow.appendChild(el('style', { text: sheet ? sheet.textContent : '' }));
    this.shadow.appendChild(this.root);

    /* Panels */
    this.panels = {};
    each(ch, function (c) {
      self.panels[c.id] = [];
      each(c.panels, function (pn) {
        var id = NS + '-' + c.id + '-' + pn.id;
        var panel = el('section', {
          class: 'ddtv__panel' + (pn.dark ? ' ddtv__panel--dark' : ''),
          id: id, role: 'tabpanel', 'data-chapter': c.id, 'data-panel': pn.id, hidden: true, tabindex: '-1'
        });
        self.stage.appendChild(panel);
        self.panels[c.id].push({ def: pn, el: panel, id: id });
      });
    });

    this.tv.addEventListener('click', this.onClick.bind(this));
    this.tv.addEventListener('keydown', this._key);
  };

  /* ---------------- mounting & layout ---------------- */

  /* Two placements, chosen from the width the store really gives the left
     column (not from the screen size):
       column  the TV sits at the top of the store's left column, beside the
               options (desktop, iPad landscape);
       stacked the column is too narrow for seven chapter buttons per row (iPad
               portrait), so the TV takes the full width directly above the
               store's product block, which stays exactly as it is. */
  Television.prototype.wantedPlacement = function () {
    var L = this.product.layout || {};
    var col = $(L.mountSelector), ref = $(L.stackBeforeSelector);
    if (this.opts.mount || !col || !ref || !L.stackBelowColumn) return 'column';
    return col.getBoundingClientRect().width < L.stackBelowColumn ? 'stacked' : 'column';
  };

  Television.prototype.place = function (mode) {
    var L = this.product.layout || {}, self = this;
    mode = mode || this.wantedPlacement();
    /* Only one television may ever exist in the page. */
    each($$('.ddtv-host'), function (h) { if (h !== self.host && h.parentNode) h.parentNode.removeChild(h); });
    var host = this.opts.mount || $(L.mountSelector), ref = $(L.stackBeforeSelector);
    if (mode === 'stacked' && ref && ref.parentNode) ref.parentNode.insertBefore(this.host, ref);
    else if (!host) {
      /* Fallback: directly before the original description. */
      this.sourceRoot.parentNode.insertBefore(this.host, this.sourceRoot);
      mode = 'column';
    } else if (L.mountPosition === 'append') host.appendChild(this.host);
    else host.insertBefore(this.host, host.firstChild);
    this.placement = mode;
    this.root.setAttribute('data-placement', mode);
  };

  Television.prototype.mount = function () { this.place(); };

  /* ---------------- the store's own gallery: scoped isolation ---------------- */

  /* In Optimised Preview the store's image gallery must not appear as a
     second interface, but it must never be deleted, cloned or edited: the
     store owns the images and may re-render the gallery at any moment (it does:
     choosing options re-creates the gallery's children, navigating replaces the
     whole element). So the gallery is not hidden node by node with inline
     styles. The page carries ONE rule that matches only a gallery that has our
     attribute, and the attribute is set only while this product's television
     is showing:

       <gallery selector>[data-ddtv-gallery="isolated"] > :not(.ddtv-host) { display: none }

     Other products, Standard Product View and ?ddtv=off never have the
     attribute, so the rule matches nothing there. Whatever the store renders
     inside an isolated gallery is hidden at once, with no flash. */
  var GALLERY_ATTR = 'data-ddtv-gallery';
  var GALLERY_STYLE = 'ddtv-gallery-style';

  function NativeGallery(tv) { this.tv = tv; this.on = false; this.mo = null; }

  NativeGallery.prototype.selector = function () {
    var G = (this.tv.product.layout || {}).gallery || {};
    return G.container || '.product-details__gallery';
  };

  /* Stacked placement (the television full width above the product block): with
     the store's gallery isolated and most of the description hidden, the store's
     two-column float layout (gallery and description left, options right) leaves
     the left column empty. While, and only while, this product's television is
     stacked and showing, the product block carries a second attribute and the
     same stylesheet gives the store's own sidebar and description the single
     column the store itself uses on small screens, so the options sit directly
     under the television. Nothing is moved, wrapped or hidden. The store's own
     rules are more specific than any selector we can reasonably write, hence the
     one !important, on five properties, behind the attribute. Config:
       layout.stacked = { block: '.product-details', fill: ['.product-details__sidebar', ...] } */
  var STACK_ATTR = 'data-ddtv-stacked';

  NativeGallery.prototype.stackedCfg = function () {
    if (this.tv.model && this.tv.model.features.stackedLayout === false) return null;
    var S = (this.tv.product.layout || {}).stacked;
    return S && S.block && S.fill && S.fill.length ? S : null;
  };

  NativeGallery.prototype.style = function (on) {
    var s = doc.getElementById(GALLERY_STYLE);
    if (!on) { if (s && s.parentNode) s.parentNode.removeChild(s); return; }
    if (s) return;
    s = el('style', { id: GALLERY_STYLE });
    var css = this.selector() + '[' + GALLERY_ATTR + '="isolated"] > :not(.ddtv-host) { display: none; }', S = this.stackedCfg();
    if (S) {
      css += '\n' + S.fill.map(function (f) { return S.block + '[' + STACK_ATTR + '="1"] > ' + f; }).join(', ') +
        ' { float: none !important; width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; padding-left: 0 !important; clear: both !important; }';
    }
    s.textContent = css;
    (doc.head || doc.documentElement).appendChild(s);
  };

  /* Puts the attribute(s) on the gallery and product block that are in the page now. */
  NativeGallery.prototype.apply = function () {
    var c = $(this.selector()), S = this.stackedCfg();
    if (c && c.getAttribute(GALLERY_ATTR) !== 'isolated') c.setAttribute(GALLERY_ATTR, 'isolated');
    if (S) {
      var b = $(S.block), want = this.on && this.tv.placement === 'stacked';
      each($$('[' + STACK_ATTR + ']'), function (n) { if (n !== b || !want) n.removeAttribute(STACK_ATTR); });
      if (b && want && b.getAttribute(STACK_ATTR) !== '1') b.setAttribute(STACK_ATTR, '1');
    }
    return c;
  };

  NativeGallery.prototype.isolate = function () {
    this.on = true;
    this.style(true);
    this.apply();
    this.watch();
  };

  NativeGallery.prototype.restore = function () {
    this.on = false;
    this.unwatch();
    each($$('[' + GALLERY_ATTR + ']'), function (n) { n.removeAttribute(GALLERY_ATTR); });
    each($$('[' + STACK_ATTR + ']'), function (n) { n.removeAttribute(STACK_ATTR); });
    this.style(false);
  };

  /* Watches only the parents of the gallery and of the product block, for
     children being added or removed (no subtree, no attributes): cheap even on
     a page that Ecwid keeps re-rendering. */
  NativeGallery.prototype.watch = function () {
    this.unwatch();
    if (!global.MutationObserver) return;
    var tv = this.tv, self = this, L = tv.product.layout || {};
    var parents = [], c = $(this.selector()), r = $(L.stackBeforeSelector);
    if (c) parents.push(c);                       /* the store removing our host from inside the gallery */
    if (c && c.parentNode) parents.push(c.parentNode);
    if (r && r.parentNode && parents.indexOf(r.parentNode) < 0) parents.push(r.parentNode);
    if (!parents.length) return;
    this.mo = new MutationObserver(function () { tv._recover(); });
    each(parents, function (n) { self.mo.observe(n, { childList: true }); });
  };

  NativeGallery.prototype.unwatch = function () { if (this.mo) { this.mo.disconnect(); this.mo = null; } };

  /* The store replaced the gallery or the product block: put the television
     back where it belongs and isolate the new gallery. */
  Television.prototype.recover = function () {
    if (!this.host || this.failed) return;
    var L = this.product.layout || {}, remounted = false;
    var want = this.opts.mount || $(L.mountSelector);
    if (!this.host.isConnected || (this.placement === 'column' && want && this.host.parentNode !== want)) { this.place(this.placement); remounted = true; }
    if (this.view === 'interactive' && this.gallery.on) {
      this.gallery.apply();
      if (remounted) { this.gallery.watch(); this._layout(); }
    }
  };

  /* Whatever goes wrong while the television is showing, the customer must end
     up with the store's own, working product page: native gallery back, original
     description back, television gone. */
  Television.prototype.failSafe = function (why, err) {
    warn('Optimised Preview stopped (' + why + '). The standard product view is restored.', err);
    this.failed = true;
    this.clearWatchdog();
    try { this.togglePlay(false); } catch (e1) { /* ignore */ }
    try { this.closeOverlay(); } catch (e2) { /* ignore */ }
    try { this.gallery.restore(); } catch (e3) { /* ignore */ }
    try { this.hideNative(false); } catch (e4) { /* ignore */ }
    try { this.unfill(); } catch (e5) { /* ignore */ }
    this.view = 'classic';
    try { this.media.observe(this.sourceRoot); } catch (e6) { /* ignore */ }
    if (this.tv) this.tv.hidden = true;
    if (this.host) this.host.style.display = 'none';
  };

  /* A render check shortly after the television is shown: if it is not
     visible (a style conflict, a script error elsewhere), restore the store's page. */
  Television.prototype.armWatchdog = function () {
    var self = this;
    this.clearWatchdog();
    this._wd = setTimeout(function () {
      if (self.view !== 'interactive' || self.failed || !self.host.isConnected) return;
      var r = self.tv.getBoundingClientRect(), panel = $('.ddtv__panel.is-active', self.tv);
      if (!(r.width > 40 && r.height > 40 && panel && panel.offsetHeight > 0)) self.failSafe('the television is not visible');
    }, this.opts.watchdogMs != null ? this.opts.watchdogMs : 2500);
  };

  Television.prototype.clearWatchdog = function () { if (this._wd) { clearTimeout(this._wd); this._wd = null; } };

  /* Vertical position (column placement only). Configured by
     layout.placement:
       'top'   the television starts at the top of the store's left column, so
               the space above the options is used by the monitor instead of
               being left empty (the owner's decision after the annotated
               screenshot);
       'size'  the top row of chapter buttons starts at the same height as the
               store's SIZE selector (the V11 prototype); the gallery's former
               space above it stays empty.
     The store's own elements are only measured, never changed. */
  Television.prototype.measureAlign = function () {
    var L = this.product.layout || {}, root = this.root;
    root.style.marginTop = '';
    if (this.placement !== 'column' || L.placement !== 'size') return;
    var target = $(L.alignToSelector), firstBar = this.tv.firstElementChild;
    if (!target || !firstBar) return;
    var gap = target.getBoundingClientRect().top - firstBar.getBoundingClientRect().top;
    if (gap > 0) root.style.marginTop = Math.round(gap) + 'px';
  };

  Television.prototype.measureHeight = function () {
    var L = this.product.layout || {};
    var vh = global.innerHeight || 800;
    var vp = this.viewport.getBoundingClientRect();
    var tvBox = this.tv.getBoundingClientRect();
    /* Everything in the unit that is not the scrolling screen: both button
       rows, the monitor frame, heading, footer and gaps. */
    var above = vp.top - tvBox.top, below = tvBox.bottom - vp.bottom;
    var chrome = above + below;
    /* Upper bound: the whole unit stays within ~92% of the viewport, so the
       television never fills the entire screen. */
    var max = Math.min(vh - 24, vh * 0.92) - chrome;
    var min = 340;
    var target = max;
    if (this.placement === 'stacked') {
      /* Full width above the product block: a landscape-leaning monitor. */
      target = Math.min(max, vp.width * 0.78);
    } else {
      /* Balance with the native options column when it is beside the TV: end
         the unit at about the same height as that column. */
      var side = $(L.sidePanelSelector);
      if (side) {
        var sBox = side.getBoundingClientRect();
        if (sBox.left >= tvBox.right - 4) {
          var balanced = sBox.bottom - vp.top - below;
          /* The 90% floor keeps the monitor generous in the default placement. In
             'size' the unit starts lower, so it must end with the options column. */
          var floor = L.placement === 'size' ? 0 : 0.9;
          if (balanced > min) target = Math.min(max, Math.max(balanced, max * floor));
        }
      }
      /* Proportional screen: never much taller than it is wide. */
      target = Math.min(target, vp.width * 1.3);
    }
    this.tv.style.setProperty('--ddtv-view-h', Math.round(clamp(target, min, 860)) + 'px');
  };

  /* Move between the column and the stacked placement (rotation, resize). */
  Television.prototype.replace = function (mode) {
    this.hideNative(false);
    this.place(mode);
    this.hideNative(true);
    if (this.gallery.on) this.gallery.apply();     /* the stacked layout follows the placement */
    /* Moving a node pauses its video; resume the active screen's loop. */
    var list = this.panels[this.product.chapters[this.chapterIndex].id], pn = list && list[this.panelIndex[this.product.chapters[this.chapterIndex].id] || 0];
    if (pn) this.media.focus(this.stage, pn.el);
  };

  Television.prototype.layout = function () {
    if (this.view !== 'interactive') return;
    var want = this.wantedPlacement();
    if (want !== this.placement) this.replace(want);
    this.measureAlign();
    this.measureHeight();
    this.updateScrollHint();
  };

  /* ---------------- content ---------------- */

  Television.prototype.fill = function () {
    var self = this;
    this.scenes = [];
    each(this.product.chapters, function (c) {
      each(self.panels[c.id], function (pn) {
        /* A model may bring scenes of its own (config: `scenes: { name: function (ctx) {…} }`); they win over the library's. */
        var fn = (self.product.scenes && self.product.scenes[pn.def.scene]) || scenes[pn.def.scene], inst;
        if (!fn) return warn('Unknown scene "' + pn.def.scene + '" for ' + c.id + '/' + pn.def.id);
        try {
          inst = fn({ tv: self, def: pn.def, root: pn.el, p: pn.def.params || {}, chapter: c }) || {};
        } catch (err) {
          /* One broken screen must never take the rest down. */
          warn('Screen failed: ' + c.id + '/' + pn.def.id, err);
          inst = {};
          pn.el.appendChild(el('p', { class: 'ddtv-empty', text: 'This screen could not be built. Classic View shows the full content.' }));
        }
        self.scenes.push({ inst: inst, panel: pn });
      });
    });
    this.applySync(this.connector.state);
  };

  Television.prototype.unfill = function () {
    this.closeOverlay();
    this.reloc.restoreAll();
    each(this.scenes || [], function (s) {
      if (s.inst.destroy) s.inst.destroy();
      while (s.panel.el.firstChild) s.panel.el.removeChild(s.panel.el.firstChild);
    });
    this.scenes = [];
  };

  /* Moves an original <video> into a screen (one instance, never cloned). */
  Television.prototype.takeVideo = function (video, container) {
    if (!video) return null;
    this.reloc.move(video, container);
    return video;
  };

  /* The customer's current native selection (see ConfigConnector.read). */
  Television.prototype.state = function () { return this.connector.state || {}; };

  /* Customer taps a choice inside the TV: perform it in the native control. */
  Television.prototype.choose = function (key, ref) {
    this.userAction();
    var ok = this.connector.choose(key, ref);
    if (!ok) this.toast('Please choose “' + (ref && ref.label || '') + '” in the options panel. It could not be set automatically.');
    return ok;
  };

  Television.prototype.toast = function (msg) {
    var self = this;
    this.toastEl.textContent = msg;
    this.toastEl.hidden = false;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(function () { self.toastEl.hidden = true; }, 5000);
  };

  /* The brand mark: the logo when one is configured, a wordmark otherwise. */
  Television.prototype.brandMark = function (cls) {
    var b = this.product.brand || {}, name = b.name || '';
    if (b.logo) return el('img', { class: 'ddtv-mark ' + (cls || ''), src: b.logo, alt: name });
    var i = name.indexOf(' ');
    return el('span', { class: 'ddtv-mark ddtv-mark--word ' + (cls || ''), 'aria-label': name }, [
      el('span', { class: 'ddtv-mark__a', text: i < 0 ? name : name.slice(0, i) }),
      i < 0 ? null : el('span', { class: 'ddtv-mark__b', text: name.slice(i + 1) })
    ]);
  };

  /* A short brand moment over the monitor (never blocks input). */
  Television.prototype.brandMoment = function (label, ms) {
    var self = this, box = this.brandEl;
    if (!box || prefersReducedMotion() || !(this.product.brand || {}).name) return;
    clearTimeout(this._brandT);
    while (box.firstChild) box.removeChild(box.firstChild);
    box.appendChild(this.brandMark('ddtv-mark--big'));
    if (label) box.appendChild(el('p', { class: 'ddtv__brand-label', text: label }));
    box.hidden = false;
    box.classList.remove('is-on');
    void box.offsetWidth;
    box.classList.add('is-on');
    this._brandT = setTimeout(function () { box.classList.remove('is-on'); box.hidden = true; }, ms || 1500);
  };

  /* ---------------- navigation ---------------- */

  Television.prototype.chapterById = function (id) {
    var ch = this.product.chapters;
    for (var i = 0; i < ch.length; i++) if (ch[i].id === id) return i;
    return -1;
  };

  Television.prototype.go = function (chapterId, panelId) {
    var ci = this.chapterById(chapterId);
    if (ci < 0) return;
    var list = this.panels[chapterId];
    /* A chapter always opens on its lead screen (where its main visual is);
       an explicit panel id is used for deep links and "Review" buttons. */
    var pi = 0;
    if (panelId) each(list, function (p, i) { if (p.def.id === panelId) pi = i; });
    this.show(ci, pi);
  };

  Television.prototype.show = function (ci, pi) {
    var self = this, c = this.product.chapters[ci], list = this.panels[c.id];
    pi = clamp(pi, 0, list.length - 1);
    this.chapterIndex = ci;
    this.panelIndex[c.id] = pi;
    this.visited[c.id] = true;
    this.closeOverlay();

    each($$('.ddtv__btn', this.tv), function (b) {
      var on = b.getAttribute('data-chapter') === c.id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (self.visited[b.getAttribute('data-chapter')]) b.classList.add('is-visited');
    });

    this.titleEl.textContent = c.label;
    while (this.tabsEl.firstChild) this.tabsEl.removeChild(this.tabsEl.firstChild);
    /* When a chapter has both selection screens and explanation screens,
       the Explore list says which is which. */
    var groups = [];
    each(list, function (p) { if (p.def.group && groups.indexOf(p.def.group) < 0) groups.push(p.def.group); });
    var lastGroup = null;
    each(list, function (p, i) {
      if (groups.length > 1 && p.def.group !== lastGroup) {
        lastGroup = p.def.group;
        self.tabsEl.appendChild(el('p', { class: 'ddtv__tabgroup', role: 'presentation', text: lastGroup || '' }));
      }
      self.tabsEl.appendChild(el('button', {
        type: 'button', role: 'tab', class: 'ddtv__tab' + (i === pi ? ' is-active' : ''),
        id: p.id + '-tab', 'aria-controls': p.id, 'aria-selected': i === pi ? 'true' : 'false',
        tabindex: i === pi ? '0' : '-1', 'data-opt': p.def.result || null,
        onclick: function () { self.userAction(); self.show(ci, i); }
      }, [p.def.label]));
      p.el.setAttribute('aria-labelledby', p.id + '-tab');
    });
    this.markTabs(this.state());

    each(this.product.chapters, function (cc) {
      each(self.panels[cc.id], function (p, i) {
        var on = cc.id === c.id && i === pi;
        if (on) { p.el.hidden = false; p.el.scrollTop = 0; } else p.el.hidden = true;
        p.el.classList.toggle('is-active', on);
      });
    });

    this.dotsEl.innerHTML = '';
    each(list, function (p, i) { self.dotsEl.appendChild(el('i', { class: i === pi ? 'is-active' : '' })); });

    var prev = this.neighbour(-1), next = this.neighbour(1);
    $('.ddtv__nav-txt', this.prevBtn).textContent = prev ? prev.label : '';
    $('.ddtv__nav-txt', this.nextBtn).textContent = next ? next.label : '';
    this.prevBtn.disabled = !prev;
    this.nextBtn.disabled = !next;
    this.prevBtn.setAttribute('aria-label', prev ? 'Previous: ' + prev.label : 'Previous');
    this.nextBtn.setAttribute('aria-label', next ? 'Next: ' + next.label : 'Next');

    this.viewport.classList.toggle('is-dark', !!list[pi].def.dark);
    this.media.focus(this.stage, list[pi].el);
    this.updateScrollHint();
    this.restartProgress();
    session.set(this.storeKey + ':pos', c.id + '/' + list[pi].def.id);
  };

  /* Label of the neighbouring panel, crossing chapter boundaries. */
  Television.prototype.neighbour = function (dir, from) {
    var ch = this.product.chapters, ci = from ? from.ci : this.chapterIndex, c = ch[ci];
    var pi = from ? from.pi : (this.panelIndex[c.id] || 0), list = this.panels[c.id];
    if (pi + dir >= 0 && pi + dir < list.length) return { ci: ci, pi: pi + dir, label: list[pi + dir].def.label };
    var nci = ci + dir;
    if (nci < 0 || nci >= ch.length) return null;
    var nlist = this.panels[ch[nci].id];
    var npi = dir > 0 ? 0 : nlist.length - 1;
    return { ci: nci, pi: npi, label: ch[nci].label + (dir > 0 ? '' : ' · ' + nlist[npi].def.label) };
  };

  Television.prototype.step = function (dir) {
    var self = this, n = this.neighbour(dir), guard = 0;
    /* The presentation skips "Your …" result screens (they only mean
       something once the customer has chosen); manual navigation does not. */
    while (n && this.playing && guard++ < 40 && this.panels[this.product.chapters[n.ci].id][n.pi].def.tour === false) n = this.neighbour(dir, n);
    if (n) this.show(n.ci, n.pi);
    else if (this.playing) this.togglePlay(false);
  };

  Television.prototype.updateScrollHint = function () {
    var c = this.product.chapters[this.chapterIndex];
    if (!c) return;
    var p = this.panels[c.id][this.panelIndex[c.id] || 0];
    if (!p) return;
    var scrollable = p.el.scrollHeight > p.el.clientHeight + 8;
    this.viewport.classList.toggle('is-scrollable', scrollable);
    var self = this;
    p.el.onscroll = function () {
      self.viewport.classList.toggle('is-end', p.el.scrollTop + p.el.clientHeight >= p.el.scrollHeight - 8);
    };
    this.viewport.classList.remove('is-end');
  };

  /* ---------------- presentation tour ---------------- */

  Television.prototype.tourDelay = function () {
    var c = this.product.chapters[this.chapterIndex];
    var p = this.panels[c.id][this.panelIndex[c.id] || 0];
    var words = txt(p.el).split(' ').length;
    /* Roughly reading time, bounded so the tour keeps moving. */
    return clamp(Math.round(words / 4.2) * 1000, this.opts.tourMin || 7000, this.opts.tourMax || 22000);
  };

  Television.prototype.restartProgress = function () {
    var self = this, bar = $('i', this.progressEl);
    clearTimeout(this.tourTimer);
    bar.style.transition = 'none';
    bar.style.width = '0';
    if (!this.playing) return;
    var ms = this.tourDelay();
    /* Force reflow so the transition restarts. */
    void bar.offsetWidth;
    bar.style.transition = 'width ' + ms + 'ms linear';
    bar.style.width = '100%';
    this.tourTimer = setTimeout(function () { self.step(1); }, ms);
  };

  Television.prototype.togglePlay = function (force) {
    this.playing = typeof force === 'boolean' ? force : !this.playing;
    this.playBtn.setAttribute('aria-pressed', this.playing ? 'true' : 'false');
    this.tv.classList.toggle('is-playing', this.playing);
    $('.ddtv__play-txt', this.playBtn).textContent = this.playing ? 'Pause presentation' : 'Play presentation';
    if (this.playing) this.brandMoment('Presentation', 1200);
    this.restartProgress();
  };

  Television.prototype.userAction = function () { if (this.playing) this.togglePlay(false); };

  /* ---------------- events ---------------- */

  Television.prototype.onClick = function (e) {
    var go = e.target.closest && e.target.closest('[data-go]');
    if (!go) return;
    var parts = go.getAttribute('data-go').split('/');
    this.userAction();
    this.go(parts[0], parts[1]);
  };

  /* Map an original anchor (#bp-firmness …) to its chapter. */
  Television.prototype.chapterFor = function (id) {
    var ch = this.product.chapters;
    for (var i = 0; i < ch.length; i++) if (ch[i].source === '#' + id) return ch[i].id;
    if (id === (this.product.sourceRoot || '').slice(1)) return ch[0].id;
    return null;
  };

  Television.prototype.goHref = function (href) {
    var c = this.chapterFor(String(href || '').replace(/^#/, ''));
    if (c) { this.userAction(); this.go(c); }
  };

  /* Full-length video inside the monitor. Created on demand from the URL in
     the original description, so nothing heavy loads until it is asked for. */
  Television.prototype.openPlayer = function (o) {
    var self = this;
    this.closeOverlay();
    var video = el('video', { controls: true, playsinline: true, 'webkit-playsinline': true, preload: 'auto', 'aria-label': o.title });
    var close = el('button', { type: 'button', class: 'ddtv-player__close', onclick: function () { self.closeOverlay(); } }, ['Close']);
    this.overlayBox = el('div', { class: 'ddtv-player', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title }, [
      el('div', { class: 'ddtv-player__top' }, [el('span', { class: 'ddtv-player__title', text: o.title }), close]),
      el('div', { class: 'ddtv-player__frame' }, [video])
    ]);
    this.overlay.appendChild(this.overlayBox);
    this.overlay.hidden = false;
    video.src = o.src;
    var pr = video.play();
    if (pr && pr.catch) pr.catch(noop);
    close.focus();
  };

  Television.prototype.closeOverlay = function () {
    var box = this.overlayBox;
    if (!box) return;
    var cleanup = this.overlayCleanup;
    this.overlayCleanup = null;
    this.overlayKeys = null;
    if (cleanup) { try { cleanup(); } catch (e0) { warn('Overlay cleanup failed', e0); } }
    var v = $('video', box);
    if (v) {
      try { v.pause(); } catch (e) { /* ignore */ }
      v.removeAttribute('src');
      try { v.load(); } catch (e2) { /* stops the download */ }
    }
    if (box.parentNode) box.parentNode.removeChild(box);
    this.overlayBox = null;
    this.overlay.hidden = true;
  };

  Television.prototype.onKey = function (e) {
    /* An open overlay may take keys first (the model gallery uses the arrows). */
    if (this.overlayBox && this.overlayKeys && this.overlayKeys(e)) return;
    if (e.key === 'Escape' && this.overlayBox) { this.closeOverlay(); return; }
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'video') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.userAction();
      this.step(e.key === 'ArrowRight' ? 1 : -1);
      var active = $('.ddtv__tab.is-active', this.tabsEl);
      if (active && e.target.getAttribute && e.target.getAttribute('role') === 'tab') active.focus();
    }
  };

  /* ---------------- configuration sync ---------------- */

  Television.prototype.applySync = function (state) {
    var self = this;
    var roots = [this.root, this.sourceRoot].filter(Boolean);

    each(this.model && this.model.features.classicHighlight === false ? [] : (this.product.sync || []), function (rule) {
      var sel = state[rule.option];
      var items = [];
      each(roots, function (r) { items = items.concat($$(rule.items, r)); });
      each(items, function (item, i) {
        var on = false;
        if (sel) {
          if (rule.mode === 'number') on = parseFloat(txt($(rule.key, item))) === sel.value;
          else if (rule.mode === 'index') on = sel.index === i + 1;
          else if (rule.mode === 'size') {
            var dims = txt($(rule.dims, item)).replace(/\s|cm/g, '').replace('×', 'x');
            on = sel.dims ? dims === sel.dims : norm(sel.raw).indexOf(norm(txt($(rule.key, item)))) === 0;
          } else on = norm(txt($(rule.key, item))) === norm(sel.label);
        }
        item.classList.toggle('ddtv-selected', on);
        if (on) item.setAttribute('data-ddtv-badge', rule.badge); else item.removeAttribute('data-ddtv-badge');
      });
      /* Size: prefer an exact dimension match over a name prefix. */
      if (rule.mode === 'size' && sel && !sel.dims) {
        var hits = items.filter(function (i) { return i.classList.contains('ddtv-selected'); });
        hits.sort(function (a, b) { return txt($(rule.key, b)).length - txt($(rule.key, a)).length; });
        each(hits.slice(1), function (h) { h.classList.remove('ddtv-selected'); h.removeAttribute('data-ddtv-badge'); });
      }
      if (rule.radio && sel && sel.index) {
        var radio = $(rule.radio.replace('{n}', sel.index));
        if (radio && !radio.checked) radio.checked = true;
        each([1, 2, 3, 4, 5, 6], function (n) {
          var tab = $(rule.tab.replace('{n}', n));
          if (!tab) return;
          var on = n === sel.index;
          tab.classList.toggle('ddtv-selected', on);
          if (on) tab.setAttribute('data-ddtv-badge', 'Selected'); else tab.removeAttribute('data-ddtv-badge');
        });
      }
    });

    each(this.scenes || [], function (sc) { if (sc.inst.update) sc.inst.update(state); });
    this.markTabs(state);
    this.renderChips(state);
    this.renderPrice(state);
  };

  /* Result tabs ("Your firmness" …) get a tick once that option is chosen. */
  Television.prototype.markTabs = function (state) {
    each($$('.ddtv__tab[data-opt]', this.tabsEl), function (t) {
      t.classList.toggle('has-value', !!state[t.getAttribute('data-opt')]);
    });
  };

  /* Price and discount exactly as Ecwid renders them (read-only mirror). */
  Television.prototype.renderPrice = function (state) {
    var box = this.priceEl, pr = state.$price;
    while (box.firstChild) box.removeChild(box.firstChild);
    box.hidden = !pr;
    if (!pr) return;
    box.appendChild(el('span', { class: 'ddtv__price-k', text: 'Price' }));
    box.appendChild(el('span', { class: 'ddtv__price-v', text: pr.current }));
    if (pr.compare) box.appendChild(el('span', { class: 'ddtv__price-old', text: pr.compare }));
    if (pr.discount) box.appendChild(el('span', { class: 'ddtv__price-save', text: pr.discount }));
  };

  Television.prototype.renderChips = function (state) {
    var opts = this.product.options;
    while (this.chipsEl.firstChild) this.chipsEl.removeChild(this.chipsEl.firstChild);
    for (var key in opts) {
      if (!opts.hasOwnProperty(key)) continue;
      var v = state[key];
      this.chipsEl.appendChild(el('button', {
        type: 'button', class: 'ddtv__chip' + (v ? ' is-set' : ''), 'data-opt': key, 'data-go': opts[key].chapter + '/' + opts[key].panel,
        title: v ? opts[key].label + ': ' + v.raw : opts[key].label + ' not selected yet'
      }, [el('span', { class: 'ddtv__chip-k', text: opts[key].label }), el('span', { class: 'ddtv__chip-v', text: v ? v.label : '—' })]));
    }
  };

  Television.prototype.onConfigChange = function (state, prev) {
    var opts = this.product.options, complete = true, wasComplete = true;
    this.applySync(state);
    /* Show which selection just changed, without moving the customer away. */
    for (var k in opts) {
      if (!opts.hasOwnProperty(k)) continue;
      if (!state[k]) complete = false;
      if (!prev || !prev[k]) wasComplete = false;
      if (prev && state[k] && JSON.stringify(state[k]) !== JSON.stringify(prev[k])) {
        var chip = $('.ddtv__chip[data-opt="' + k + '"]', this.chipsEl);
        if (chip) { chip.classList.remove('is-flash'); void chip.offsetWidth; chip.classList.add('is-flash'); }
      }
    }
    if (this.view === 'interactive') {
      if (prev && complete && !wasComplete) this.brandMoment('Your ' + this.product.name, 1400);
      this.updateScrollHint();
    }
  };

  /* ---------------- views ---------------- */

  /* A phone is recognised by the shortest side of its screen, so a phone held
     sideways (a wide window) still gets the complete Classic View. An iPad
     mini, the smallest tablet, has a short side of 744 px. */
  Television.prototype.isPhone = function () {
    var L = this.product.layout || {}, s = global.screen || {};
    var short = Math.min(s.width || 9999, s.height || 9999);
    return short < (L.phoneMaxShortSide || 600);
  };

  Television.prototype.canInteract = function () {
    var L = this.product.layout || {};
    if (this.isPhone()) return false;
    if ((global.innerWidth || 0) < (L.interactiveMinWidth || 720)) return false;
    /* Never render a cramped monitor: it needs a minimum width of its own. */
    var w = this.host && this.host.isConnected ? this.host.getBoundingClientRect().width : Infinity;
    return !(w > 0 && w < (L.minTvWidth || 600));
  };

  Television.prototype.hideNative = function (hide) {
    var L = this.product.layout || {}, self = this;
    if (hide) {
      /* The native Ecwid selection area is off limits: nothing inside the
         options column or any option block is ever hidden or changed. */
      var protectedAreas = $$(L.sidePanelSelector || '').concat($$(ECWID.block));
      /* The store's image gallery is NOT handled here: it is isolated by the
         scoped attribute rule of NativeGallery, in both placements. */
      each(L.hideInInteractive || [], function (sel) {
        each($$(sel), function (n) {
          if (self.root.contains(n) || n === self.root) return;
          for (var i = 0; i < protectedAreas.length; i++) {
            var a = protectedAreas[i];
            if (a === n || a.contains(n) || n.contains(a)) { warn('Refusing to hide native option area: ' + sel); return; }
          }
          self.hidden.push({ n: n, d: n.style.display });
          n.style.display = 'none';
        });
      });
      /* The description's own heading ("Product Details") is not needed on the
         monitor. Found by its text, since the store's class names vary. */
      each($$('.product-details-module__title'), function (t) {
        if (self.root.contains(t) || !/^\s*product\s+details\s*$/i.test(txt(t))) return;
        var mod = t.closest('.product-details-module') || t;
        if (mod.contains(self.host) || self.host.contains(mod)) return;
        self.hidden.push({ n: mod, d: mod.style.display });
        mod.style.display = 'none';
      });
      if (this.sourceRoot) { this.hidden.push({ n: this.sourceRoot, d: this.sourceRoot.style.getPropertyValue('display'), p: this.sourceRoot.style.getPropertyPriority('display') }); this.sourceRoot.style.setProperty('display', 'none', 'important'); }
    } else {
      each(this.hidden, function (h) {
        if (h.p !== undefined) { h.n.style.removeProperty('display'); if (h.d) h.n.style.setProperty('display', h.d, h.p); }
        else h.n.style.display = h.d;
      });
      this.hidden = [];
    }
  };

  Television.prototype.setView = function (view, byUser) {
    if (view === 'interactive' && !this.canInteract()) view = 'classic';
    if (view === this.view) return;
    var prevView = this.view;
    this.view = view;
    this.userAction();
    each($$('button', this.switchEl), function (b) {
      var on = b.getAttribute('data-view') === view;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    this.root.setAttribute('data-view', view);
    this.root.classList.toggle('is-phone', !this.canInteract());

    if (view === 'interactive') {
      /* Optimised Preview. The store's gallery is isolated only AFTER the
         screens were built and the television is visible; any failure on the
         way restores the store's page (failSafe). */
      try {
        this.media.unobserve();
        this.fill();
        this.hideNative(true);
        this.tv.hidden = false;
        this.gallery.isolate();
        if (!session.get(this.storeKey + ':splash')) {
          session.set(this.storeKey + ':splash', '1');
          this.brandMoment((this.product.experienceTitle ? this.product.name + ' ' + this.product.experienceTitle : this.product.name), 1500);
        }
        var pos = (session.get(this.storeKey + ':pos') || '').split('/');
        if (pos[0] && this.chapterById(pos[0]) >= 0) this.go(pos[0], pos[1]);
        else this.show(0, 0);
        this.layout();
        var self = this;
        if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { self.layout(); });
        if (byUser) this.tv.focus({ preventScroll: true });
        this.armWatchdog();
      } catch (err) {
        this.failSafe('a screen failed to build', err);
        return;
      }
    } else {
      /* Standard Product View: the store's own page, gallery included. */
      this.clearWatchdog();
      try { this.closeOverlay(); } catch (e0) { /* ignore */ }
      this.tv.hidden = true;
      this.root.style.marginTop = '';
      this.gallery.restore();
      if (prevView === 'interactive') { this.hideNative(false); this.unfill(); }
      this.media.observe(this.sourceRoot);
      if (byUser && this.sourceRoot) this.sourceRoot.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    if (byUser) local.set(this.storeKey + ':view', view);
    this.applySync(this.connector.state);
    each(this.ext, function (x) { if (x.view) { try { x.view(view); } catch (e) { warn('Extension failed', e); } } });
  };

  /* ---------------- audit: no silent omissions ---------------- */

  Television.prototype.audit = function () {
    var p = this.product, root = this.sourceRoot, report = { missingMedia: [], unmappedSections: [], unplacedMedia: [] };
    var html = root ? root.innerHTML : '';
    each(p.media || [], function (m) { if (html.indexOf(m.url) < 0) report.missingMedia.push(m.url); });
    var sources = p.chapters.map(function (c) { return c.source; });
    each($$('section[id]', root), function (s) { if (sources.indexOf('#' + s.id) < 0) report.unmappedSections.push('#' + s.id); });
    each($$('video source, img', root), function (m) {
      var url = m.getAttribute('src') || m.getAttribute('data-ddtv-src');
      var known = (p.media || []).some(function (r) { return r.url === url; });
      if (!known) report.unplacedMedia.push(url);
    });
    this.report = report;
    var issues = report.missingMedia.length + report.unmappedSections.length + report.unplacedMedia.length;
    if (issues) warn('Audit found ' + issues + ' item(s) to review', report); else log('Audit: every section and media asset is accounted for.');
    return report;
  };

  /* ---------------- lifecycle ---------------- */

  Television.prototype.start = function () {
    if (!this.sourceRoot) throw new Error('Source root ' + this.product.sourceRoot + ' not found');
    /* The class vocabulary of this model's description (config: `dialect`; the
       scene library's default is the markup of the first model). One television
       per page, so one dialect at a time. */
    if (global.DDTV && global.DDTV.dialect) global.DDTV.dialect.use(this.product.dialect);
    this.build();
    this.mount();
    this.audit();
    this.connector.start();
    this.connector.subscribe(this.onConfigChange.bind(this));
    /* Defer every video until it is on screen. */
    var self = this;
    each($$('video', this.sourceRoot), function (v) { self.media.park(v); });

    /* Extensions (the model gallery) attach before the first view is set, so
       they see it. One that fails to attach never stops the television. */
    each(extensions, function (fn) {
      try { var x = fn(self); if (x) self.ext.push(x); } catch (e) { warn('Extension failed to attach', e); }
    });

    var param = (global.location && /[?&]ddtv=(classic|interactive|standard|optimi[sz]ed)/.exec(global.location.search)) || [];
    var wanted = { standard: 'classic', optimised: 'interactive', optimized: 'interactive' }[param[1]] || param[1];
    var saved = local.get(this.storeKey + ':view');
    this.setView(wanted || saved || 'interactive');

    this._resize = debounce(function () {
      var want = self.canInteract() ? (local.get(self.storeKey + ':view') || 'interactive') : 'classic';
      if (want !== self.view) self.setView(want); else self.layout();
    }, 150);
    global.addEventListener('resize', this._resize);
    if (global.ResizeObserver) {
      this.ro = new ResizeObserver(this._layout);
      var side = $((this.product.layout || {}).sidePanelSelector);
      if (side) this.ro.observe(side);
    }
    doc.addEventListener('keydown', this._docKey = function (e) { if (e.key === 'Escape') self.closeOverlay(); });
    doc.documentElement.classList.add(NS + '-ready');
    log('Experience TV ' + VERSION + ' started for ' + this.product.name);
    return this;
  };

  Television.prototype.destroy = function () {
    this.clearWatchdog();
    if (global.DDTV && global.DDTV.dialect) global.DDTV.dialect.reset();
    each(this.ext, function (x) { if (x.destroy) { try { x.destroy(); } catch (e) { warn('Extension failed to detach', e); } } });
    this.ext = [];
    try { this.closeOverlay(); } catch (e0) { /* ignore */ }
    this.togglePlay(false);
    this.gallery.restore();
    if (this.view === 'interactive') { this.hideNative(false); this.unfill(); }
    this.media.unobserve();
    this.media.restoreAll();
    this.connector.stop();
    global.removeEventListener('resize', this._resize);
    if (this.ro) this.ro.disconnect();
    doc.removeEventListener('keydown', this._docKey);
    if (this.host.parentNode) this.host.parentNode.removeChild(this.host);
    doc.documentElement.classList.remove(NS + '-ready');
  };

  /* ------------------------------------------------------------------ */
  /* Bootstrap                                                           */
  /* ------------------------------------------------------------------ */

  var current = null;
  /* Every start and stop moves this on; a wait that belongs to an older
     generation does nothing when its element finally appears. */
  var generation = 0;
  var cancelWait = null;
  var booted = false;

  /* Only a product listed in a config (productIds) is ever matched. With no
     id (a plain page without Ecwid's API, e.g. the prototype) the config whose
     source root is on the page is used. */
  /* A model config may say `extends: '<profile>'`. A PROFILE (window.DDTV_PROFILES)
     holds what belongs to the store's theme rather than to a mattress: the
     layout selectors, the price selectors, the view labels, the gallery selectors.
     The model's own values win; objects are merged key by key, everything else
     (arrays, regular expressions, functions, strings) is replaced. */
  function isPlain(o) { return !!o && typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]'; }
  function mergeConfig(base, over) {
    var out = {}, k;
    for (k in base) if (base.hasOwnProperty(k)) out[k] = base[k];
    for (k in over) {
      if (!over.hasOwnProperty(k) || k === 'extends') continue;
      out[k] = isPlain(out[k]) && isPlain(over[k]) ? mergeConfig(out[k], over[k]) : over[k];
    }
    return out;
  }
  /* The merged config of one model must be the SAME object every time it is asked for (the engine's idempotent start
     compares products by identity), but a config that was replaced must be merged again: so the cache is keyed on the
     identity of the raw config and of the profile, not on a name. */
  var resolvedCache = [];
  function resolveProfile(p) {
    if (!p.extends) return p;
    var base = (global.DDTV_PROFILES || {})[p.extends], i;
    if (!base) { warn('Profile "' + p.extends + '" (extended by ' + p.id + ') is not loaded; using the model config as it is.'); return p; }
    for (i = 0; i < resolvedCache.length; i++) if (resolvedCache[i].raw === p && resolvedCache[i].base === base) return resolvedCache[i].out;
    var out = mergeConfig(base, p);
    resolvedCache.push({ raw: p, base: base, out: out });
    return out;
  }

  function productFor(productId) {
    var all = global.DDTV_PRODUCTS || {};
    for (var k in all) {
      if (!all.hasOwnProperty(k)) continue;
      var p = all[k];
      if (productId == null ? !!$(p.sourceRoot) : (p.productIds || []).indexOf(Number(productId)) >= 0) return resolveProfile(p);
    }
    return null;
  }

  /* Waits for a selector; returns a function that cancels the wait. */
  function whenPresent(selector, cb, timeout) {
    if ($(selector)) { cb(); return noop; }
    if (!global.MutationObserver) return noop;
    var finished = false, timer = null, mo = new MutationObserver(function () {
      if (!finished && $(selector)) { finish(); cb(); }
    });
    function finish() { finished = true; mo.disconnect(); if (timer) clearTimeout(timer); }
    mo.observe(doc.body || doc.documentElement, { childList: true, subtree: true });
    timer = setTimeout(finish, timeout || 15000);
    return finish;
  }

  /* The id of the product page on screen, read from the class Ecwid puts on
     it (…ProductPage-<id>) or from a hash route (#!/…/p/<id>). Used when the
     store announced the page before this script was loaded. null = not a
     product page. */
  function currentProductId() {
    var n = doc.querySelector('[class*="ecwid-productBrowser-ProductPage-"]');
    var m = n && /ecwid-productBrowser-ProductPage-(\d+)/.exec(String(n.className));
    if (m) return Number(m[1]);
    var h = /\/p\/(\d+)/.exec((global.location && global.location.hash) || '');
    return h ? Number(h[1]) : null;
  }

  function start(productId, options) {
    if (/[?&]ddtv=off/.test((global.location && global.location.search) || '')) return null;
    var product = productFor(productId);
    if (!product) return null;
    /* The same page announced again keeps the television that is running. */
    if (current && current.product === product && current.alive()) return true;
    if (cancelWait) { cancelWait(); cancelWait = null; }
    var mine = ++generation;
    cancelWait = whenPresent(product.sourceRoot, function () {
      if (mine !== generation) return;
      cancelWait = null;
      try {
        if (current) current.destroy();
        current = new Television(product, options).start();
        DDTV.current = current;
      } catch (err) {
        /* Any failure leaves the original description in place. */
        warn('Start failed; Classic View remains.', err);
        try { if (current) current.destroy(); } catch (e) { /* ignore */ }
        current = null;
        DDTV.current = null;
      }
    });
    return true;
  }

  function stop() {
    generation++;
    if (cancelWait) { cancelWait(); cancelWait = null; }
    if (current) { current.destroy(); current = null; DDTV.current = null; }
  }

  function boot(options) {
    if (booted) return;
    booted = true;
    if (global.Ecwid && global.Ecwid.OnPageLoaded) {
      global.Ecwid.OnPageLoaded.add(function (page) {
        if (page && page.type === 'PRODUCT' && productFor(page.productId)) start(page.productId, options);
        else stop();
      });
      /* The store may have announced the current page before this script ran. */
      var id = currentProductId();
      if (id != null) start(id, options);
    } else if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', function () { start(null, options); });
    } else start(null, options);
  }

  var DDTV = {
    version: VERSION,
    boot: boot,
    use: function (fn) { extensions.push(fn); },
    start: start,
    stop: stop,
    current: null,
    scenes: scenes,
    util: { $: $, $$: $$, el: el, txt: txt, norm: norm, each: each, clamp: clamp, debounce: debounce, noop: noop, warn: warn, reducedMotion: prefersReducedMotion },
    Television: Television,
    ConfigConnector: ConfigConnector
  };

  global.DDTV = DDTV;
})(window);
