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
    if (key === 'depth') {
      var m = raw.match(/(\d{2}(?:[.,]\d+)?)\s*cm/i) || raw.match(/(\d{2})/);
      if (m) { out.value = parseFloat(m[1].replace(',', '.')); out.label = out.value + ' cm'; }
    }
    if (key === 'size') {
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
    var c = txt(P.current && $(P.current)), o = txt(P.compare && $(P.compare));
    if (!c) return null;
    return { current: c, compare: o && o !== c ? o : '' };
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

  /* ------------------------------------------------------------------ */
  /* Television                                                          */
  /* ------------------------------------------------------------------ */

  function Television(product, options) {
    this.product = product;
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
  }

  Television.prototype.chapters = function () { return this.product.chapters; };

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

    this.switchEl = el('div', { class: 'ddtv-switch', role: 'group', 'aria-label': 'Presentation view' }, [
      el('button', { type: 'button', 'data-view': 'interactive', onclick: function () { self.setView('interactive', true); }, text: 'Interactive View' }),
      el('button', { type: 'button', 'data-view': 'classic', onclick: function () { self.setView('classic', true); }, text: 'Classic View' })
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

  Television.prototype.mount = function () {
    var L = this.product.layout || {};
    var host = this.opts.mount || $(L.mountSelector);
    if (!host) {
      /* Fallback: directly before the original description. */
      host = this.sourceRoot.parentNode;
      host.insertBefore(this.host, this.sourceRoot);
    } else if (L.mountPosition === 'append') host.appendChild(this.host);
    else host.insertBefore(this.host, host.firstChild);
  };

  /* Aligns the top frame of the monitor with the top of the SIZE row.
     Whatever height Ecwid leaves above SIZE is spent in small, even steps so
     no single empty band appears: the upper chapter buttons grow a little
     (up to 8 px), then the space between header and buttons (up to 14 px),
     then between buttons and monitor (up to 14 px). Only a remainder beyond
     that becomes top margin. The engine owns just these four values; the
     native options column is measured, never changed. */
  Television.prototype.measureAlign = function () {
    var L = this.product.layout || {};
    var target = $(L.alignToSelector), root = this.root;
    root.style.marginTop = '';
    each(['--ddtv-bar-x', '--ddtv-gap-a', '--ddtv-gap-b'], function (v) { root.style.removeProperty(v); });
    if (!target || this.view !== 'interactive') return;
    var tvBox = this.tv.getBoundingClientRect();
    var tBox = target.getBoundingClientRect();
    /* Align only when the two columns sit side by side. */
    if (tBox.left < tvBox.right - 4) return;
    var offset = Math.round(tBox.top - this.screen.getBoundingClientRect().top);
    if (offset < -2) return warn('Monitor starts ' + (-offset) + 'px below the SIZE row; check layout.mountSelector.');
    if (offset <= 0) return;
    var left = offset;
    var bar = Math.min(left, 8); left -= bar;
    var ga = Math.min(left, 14); left -= ga;
    var gb = Math.min(left, 14); left -= gb;
    root.style.setProperty('--ddtv-bar-x', bar + 'px');
    root.style.setProperty('--ddtv-gap-a', (10 + ga) + 'px');
    root.style.setProperty('--ddtv-gap-b', gb + 'px');
    if (left > 0) root.style.marginTop = left + 'px';
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
    /* Balance with the native options column when it is beside the TV: end
       the unit at about the same height as that column. */
    var side = $(L.sidePanelSelector);
    if (side) {
      var sBox = side.getBoundingClientRect();
      if (sBox.left >= tvBox.right - 4) {
        var balanced = sBox.bottom - vp.top - below;
        if (balanced > min) target = Math.min(max, Math.max(balanced, max * 0.82));
      }
    }
    this.tv.style.setProperty('--ddtv-view-h', Math.round(clamp(target, min, 860)) + 'px');
  };

  Television.prototype.layout = function () {
    if (this.view !== 'interactive') return;
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
        var fn = scenes[pn.def.scene], inst;
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

    each(this.product.sync || [], function (rule) {
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

  Television.prototype.canInteract = function () {
    var L = this.product.layout || {};
    return (global.innerWidth || 0) >= (L.interactiveMinWidth || 768);
  };

  Television.prototype.hideNative = function (hide) {
    var L = this.product.layout || {}, self = this;
    if (hide) {
      /* The native Ecwid selection area is off limits: nothing inside the
         options column or any option block is ever hidden or changed. */
      var protectedAreas = $$(L.sidePanelSelector || '').concat($$(ECWID.block));
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
      this.media.unobserve();
      this.fill();
      this.hideNative(true);
      this.tv.hidden = false;
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
    } else {
      this.tv.hidden = true;
      this.root.style.marginTop = '';
      if (prevView === 'interactive') { this.hideNative(false); this.unfill(); }
      this.media.observe(this.sourceRoot);
      if (byUser && this.sourceRoot) this.sourceRoot.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    if (byUser) local.set(this.storeKey + ':view', view);
    this.applySync(this.connector.state);
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
    this.build();
    this.mount();
    this.audit();
    this.connector.start();
    this.connector.subscribe(this.onConfigChange.bind(this));
    /* Defer every video until it is on screen. */
    var self = this;
    each($$('video', this.sourceRoot), function (v) { self.media.park(v); });

    var param = (global.location && /[?&]ddtv=(classic|interactive)/.exec(global.location.search)) || [];
    var saved = local.get(this.storeKey + ':view');
    this.setView(param[1] || saved || 'interactive');

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
    this.togglePlay(false);
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

  function productFor(productId) {
    var all = global.DDTV_PRODUCTS || {};
    for (var k in all) {
      if (!all.hasOwnProperty(k)) continue;
      var p = all[k];
      if (productId == null ? !!$(p.sourceRoot) : (p.productIds || []).indexOf(Number(productId)) >= 0) return p;
    }
    return null;
  }

  function whenPresent(selector, cb, timeout) {
    if ($(selector)) return cb();
    if (!global.MutationObserver) return;
    var mo = new MutationObserver(function () { if ($(selector)) { mo.disconnect(); cb(); } });
    mo.observe(doc.body || doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, timeout || 15000);
  }

  function start(productId, options) {
    if (/[?&]ddtv=off/.test((global.location && global.location.search) || '')) return null;
    var product = productFor(productId);
    if (!product) return null;
    whenPresent(product.sourceRoot, function () {
      try {
        if (current) current.destroy();
        current = new Television(product, options).start();
        DDTV.current = current;
      } catch (err) {
        /* Any failure leaves the original description in place. */
        warn('Start failed; Classic View remains.', err);
        try { if (current) current.destroy(); } catch (e) { /* ignore */ }
        current = null;
      }
    });
    return true;
  }

  function stop() { if (current) { current.destroy(); current = null; DDTV.current = null; } }

  function boot(options) {
    if (global.Ecwid && global.Ecwid.OnPageLoaded) {
      global.Ecwid.OnPageLoaded.add(function (page) {
        stop();
        if (page && page.type === 'PRODUCT') start(page.productId, options);
      });
    } else if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', function () { start(null, options); });
    } else start(null, options);
  }

  var DDTV = {
    version: VERSION,
    boot: boot,
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
