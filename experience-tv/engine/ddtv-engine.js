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
 *   Components        configuration-aware visualisations (depth, summary)
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
  /* truth. The TV only reads them; it never writes to them.            */
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
    if (select && select.selectedIndex >= 0 && select.value !== '') {
      return txt(select.options[select.selectedIndex]) || select.value;
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
    return state;
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
      var root = $('.product-details') || doc.body;
      this.mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-checked', 'checked'] });
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
  /* Components — engine-generated, configuration-aware visuals          */
  /* ------------------------------------------------------------------ */

  var Components = {};

  /* Depth Visualisation: compares the available depths read from the
     content, highlights the native Depth selection, shows cover allowance. */
  Components.depthProfile = {
    render: function (tv, panelEl) {
      var cols = $$('.b-hcol', panelEl);
      if (!cols.length) return null;
      var depths = cols.map(function (c) { return parseFloat(txt($('.b-hcol__cm', c))); }).filter(function (n) { return !isNaN(n); });
      var max = Math.max.apply(Math, depths) + (tv.product.coverAddsCm || 0);
      var wrap = el('div', { class: 'ddtv-depth', 'aria-label': 'Height comparison' });
      var head = el('div', { class: 'ddtv-depth__head' }, [
        el('span', { class: 'ddtv-depth__k', text: 'Height comparison' }),
        el('span', { class: 'ddtv-depth__sel', 'data-ddtv-depth-label': '' })
      ]);
      var row = el('div', { class: 'ddtv-depth__row' });
      each(depths, function (d) {
        var cover = tv.product.coverAddsCm || 0;
        var slab = el('div', { class: 'ddtv-depth__slab', 'data-depth': d, style: 'height:' + ((d + cover) / max * 100).toFixed(1) + '%' }, [
          el('i', { class: 'ddtv-depth__cover', style: 'height:' + ((cover / 2) / (d + cover) * 100).toFixed(2) + '%' }),
          el('i', { class: 'ddtv-depth__core' }),
          el('i', { class: 'ddtv-depth__cover', style: 'height:' + ((cover / 2) / (d + cover) * 100).toFixed(2) + '%' })
        ]);
        row.appendChild(el('div', { class: 'ddtv-depth__col', 'data-depth': d }, [
          el('div', { class: 'ddtv-depth__stage' }, [slab]),
          el('div', { class: 'ddtv-depth__cm', text: d + ' cm' }),
          el('div', { class: 'ddtv-depth__tot', text: cover ? '≈ ' + (d + cover) + ' cm with cover' : '' })
        ]));
      });
      wrap.appendChild(head);
      wrap.appendChild(row);
      if (tv.product.coverAddsCm) {
        wrap.appendChild(el('p', { class: 'ddtv-depth__note', text: 'Shaded bands: cover allowance of approximately 1 cm top and 1 cm bottom.' }));
      }
      return wrap;
    },
    update: function (tv, node, state) {
      var d = state.depth && state.depth.value;
      each($$('.ddtv-depth__col', node), function (c) {
        c.classList.toggle('is-selected', d != null && parseFloat(c.getAttribute('data-depth')) === d);
      });
      var label = $('[data-ddtv-depth-label]', node);
      if (label) label.textContent = d != null ? 'Your selection: ' + d + ' cm' : 'Choose a depth in the options panel';
    }
  };

  /* Selection Summary: the customer's configuration confirmed visually,
     built only from the native selection and existing content. */
  Components.selectionSummary = {
    render: function (tv) {
      var wrap = el('div', { class: 'ddtv-summary', 'aria-live': 'polite' });
      wrap.appendChild(el('div', { class: 'ddtv-summary__head' }, [
        el('span', { class: 'ddtv-summary__k', text: 'Your configuration' }),
        el('span', { class: 'ddtv-summary__state' })
      ]));
      wrap.appendChild(el('div', { class: 'ddtv-summary__grid' }));
      return wrap;
    },
    update: function (tv, node, state) {
      var grid = $('.ddtv-summary__grid', node);
      grid.innerHTML = '';
      var opts = tv.product.options, missing = 0;
      for (var key in opts) {
        if (!opts.hasOwnProperty(key)) continue;
        var s = state[key];
        if (!s) missing++;
        var detail = s ? Components.selectionSummary.detail(tv, key, s) : 'Not selected yet';
        var visual = s ? Components.selectionSummary.visual(tv, key, s) : null;
        grid.appendChild(el('div', { class: 'ddtv-summary__item' + (s ? '' : ' is-missing') }, [
          visual || el('span', { class: 'ddtv-summary__mark', 'aria-hidden': 'true', text: s ? '✓' : '·' }),
          el('div', { class: 'ddtv-summary__body' }, [
            el('div', { class: 'ddtv-summary__lbl', text: opts[key].label }),
            el('div', { class: 'ddtv-summary__val', text: s ? s.label : '—' }),
            el('div', { class: 'ddtv-summary__det', text: detail })
          ]),
          el('button', { type: 'button', class: 'ddtv-summary__go', 'data-go': opts[key].chapter + '/' + opts[key].panel, text: 'Review' })
        ]));
      }
      $('.ddtv-summary__state', node).textContent = missing
        ? missing + (missing === 1 ? ' selection' : ' selections') + ' still open in the options panel'
        : 'Complete — add to bag from the options panel';
    },
    detail: function (tv, key, s) {
      if (key === 'firmness') {
        var card = tv.find('.b-fc', function (c) { return norm(txt($('.b-fc__name', c))) === norm(s.label); });
        return card ? txt($('.b-fc__kg', card)) + ' · ' + txt($('.b-fc__st', card)) : '';
      }
      if (key === 'depth') {
        var col = tv.find('.b-hcol', function (c) { return parseFloat(txt($('.b-hcol__cm', c))) === s.value; });
        return col ? txt($('.b-hcol__n', col)) : '';
      }
      if (key === 'cover' && s.index) {
        var tag = $$('.b-cover-menu', tv.root)[s.index - 1] || $$('.b-cover-menu', tv.sourceRoot)[s.index - 1];
        return tag ? txt($('.b-cover-menu__tag', tag)) : '';
      }
      return '';
    },
    visual: function (tv, key, s) {
      if (key === 'cover' && s.index) {
        var img = $$('.b-cover-micro-slide img', tv.root)[s.index - 1] || $$('.b-cover-micro-slide img', tv.sourceRoot)[s.index - 1];
        if (img) return el('span', { class: 'ddtv-summary__swatch', style: 'background-image:url("' + img.getAttribute('src') + '")', 'aria-hidden': 'true' });
      }
      return null;
    }
  };

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
    this.components = [];
    this.hidden = [];
    this.tourTimer = null;
    this.playing = false;
    this.sourceRoot = $(product.sourceRoot);
    this.storeKey = NS + ':' + product.id;
    this._layout = debounce(this.layout.bind(this), 80);
    this._key = this.onKey.bind(this);
  }

  Television.prototype.chapters = function () { return this.product.chapters; };

  Television.prototype.find = function (sel, test) {
    var all = $$(sel, this.root).concat(this.sourceRoot ? $$(sel, this.sourceRoot) : []);
    for (var i = 0; i < all.length; i++) if (test(all[i])) return all[i];
    return null;
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
    this.viewport = el('div', { class: 'ddtv__viewport' }, [this.stage, this.overlay]);
    this.titleEl = el('h3', { class: 'ddtv__title', id: NS + '-title-' + p.id });
    this.tabsEl = el('div', { class: 'ddtv__tabs', role: 'tablist', 'aria-orientation': 'vertical', 'aria-labelledby': this.titleEl.id });
    this.chipsEl = el('div', { class: 'ddtv__chips', 'aria-label': 'Your selection in the options panel' });
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
          this.chipsEl
        ])
      ]),
      el('div', { class: 'ddtv__main' }, [
        el('div', { class: 'ddtv__head' }, [
          el('span', { class: 'ddtv__eyebrow', text: p.name + ' Experience' }),
          this.titleEl
        ]),
        this.viewport,
        el('div', { class: 'ddtv__foot' }, [this.prevBtn, el('div', { class: 'ddtv__mid' }, [this.playBtn, this.dotsEl]), this.nextBtn])
      ]),
      this.progressEl
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

    /* Panels */
    this.panels = {};
    each(ch, function (c) {
      self.panels[c.id] = [];
      each(c.panels, function (pn) {
        var id = NS + '-' + c.id + '-' + pn.id;
        var panel = el('section', {
          class: 'ddtv__panel' + (pn.layout ? ' ddtv__panel--' + pn.layout : ''),
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
      host.insertBefore(this.root, this.sourceRoot);
    } else if (L.mountPosition === 'append') host.appendChild(this.root);
    else host.insertBefore(this.root, host.firstChild);
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
    /* Resolve every selector before moving anything, so selectors that
       reference the original structure still match. */
    var plan = [];
    each(this.product.chapters, function (c) {
      each(self.panels[c.id], function (pn) {
        var nodes = [];
        each(pn.def.take || [], function (sel) {
          var found = $$(sel);
          if (!found.length) warn('No content for ' + c.id + '/' + pn.def.id + ': ' + sel);
          each(found, function (n) { if (nodes.indexOf(n) < 0) nodes.push(n); });
        });
        plan.push({ panel: pn, nodes: nodes });
      });
    });
    each(plan, function (step) {
      each(step.nodes, function (n) { self.reloc.move(n, step.panel.el); });
    });
    /* Components after content so they can read it. */
    each(this.product.chapters, function (c) {
      each(self.panels[c.id], function (pn) {
        each(pn.def.components || [], function (name) {
          var comp = Components[name];
          if (!comp) return warn('Unknown component ' + name);
          var node = comp.render(self, pn.el);
          if (!node) return;
          if (name === 'depthProfile') {
            var anchor = $('.b-htable', pn.el);
            pn.el.insertBefore(node, anchor || null);
          } else {
            pn.el.insertBefore(node, pn.el.firstChild);
          }
          self.components.push({ comp: comp, node: node });
        });
      });
    });
    this.applySync(this.connector.state);
  };

  Television.prototype.unfill = function () {
    each(this.components, function (c) { if (c.node.parentNode) c.node.parentNode.removeChild(c.node); });
    this.components = [];
    this.closeOverlay();
    this.reloc.restoreAll();
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
    this.tabsEl.innerHTML = '';
    each(list, function (p, i) {
      self.tabsEl.appendChild(el('button', {
        type: 'button', role: 'tab', class: 'ddtv__tab' + (i === pi ? ' is-active' : ''),
        id: p.id + '-tab', 'aria-controls': p.id, 'aria-selected': i === pi ? 'true' : 'false',
        tabindex: i === pi ? '0' : '-1', text: p.def.label,
        onclick: function () { self.userAction(); self.show(ci, i); }
      }));
      p.el.setAttribute('aria-labelledby', p.id + '-tab');
    });

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

    var layout = list[pi].def.layout;
    this.viewport.classList.toggle('is-dark', layout === 'hero' || layout === 'dark');
    this.media.focus(this.stage, list[pi].el);
    this.updateScrollHint();
    this.restartProgress();
    session.set(this.storeKey + ':pos', c.id + '/' + list[pi].def.id);
  };

  /* Label of the neighbouring panel, crossing chapter boundaries. */
  Television.prototype.neighbour = function (dir) {
    var ch = this.product.chapters, ci = this.chapterIndex, c = ch[ci];
    var pi = this.panelIndex[c.id] || 0, list = this.panels[c.id];
    if (pi + dir >= 0 && pi + dir < list.length) return { ci: ci, pi: pi + dir, label: list[pi + dir].def.label };
    var nci = ci + dir;
    if (nci < 0 || nci >= ch.length) return null;
    var nlist = this.panels[ch[nci].id];
    var npi = dir > 0 ? 0 : nlist.length - 1;
    return { ci: nci, pi: npi, label: ch[nci].label + (dir > 0 ? '' : ' · ' + nlist[npi].def.label) };
  };

  Television.prototype.step = function (dir) {
    var n = this.neighbour(dir);
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
    this.restartProgress();
  };

  Television.prototype.userAction = function () { if (this.playing) this.togglePlay(false); };

  /* ---------------- events ---------------- */

  Television.prototype.onClick = function (e) {
    var t = e.target;
    var go = t.closest && t.closest('[data-go]');
    if (go) {
      var parts = go.getAttribute('data-go').split('/');
      this.userAction();
      this.go(parts[0], parts[1]);
      return;
    }
    /* Summaries become headings inside the TV: no collapsing. */
    if (t.closest && t.closest('.ddtv__stage summary')) { e.preventDefault(); return; }
    var a = t.closest && t.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var target = doc.getElementById(id);
    e.preventDefault();
    this.userAction();
    if (target && target.classList.contains('b-video-modal')) return this.openOverlay(target);
    if (this.overlayNode && (!target || !this.overlay.contains(target))) { this.closeOverlay(); if (!this.chapterFor(id)) return; }
    var chapter = this.chapterFor(id);
    if (chapter) this.go(chapter);
  };

  /* Map an original anchor (#bp-firmness …) to its chapter. */
  Television.prototype.chapterFor = function (id) {
    var ch = this.product.chapters;
    for (var i = 0; i < ch.length; i++) if (ch[i].source === '#' + id) return ch[i].id;
    if (id === (this.product.sourceRoot || '').slice(1)) return ch[0].id;
    return null;
  };

  Television.prototype.openOverlay = function (node) {
    this.closeOverlay();
    var marker = doc.createComment(NS + '-overlay');
    node.parentNode.insertBefore(marker, node);
    this.overlayNode = node;
    this.overlayMarker = marker;
    this.overlay.appendChild(node);
    this.overlay.hidden = false;
    node.classList.add('is-open');
    var v = $('video', node);
    if (v) {
      this.media.unpark(v);
      var p = v.play();
      if (p && p.catch) p.catch(noop);
    }
    var close = $('.b-video-modal__close', node);
    if (close) close.focus();
  };

  Television.prototype.closeOverlay = function () {
    var node = this.overlayNode;
    if (!node) return;
    var v = $('video', node);
    if (v && !v.paused) try { v.pause(); } catch (e) { /* ignore */ }
    node.classList.remove('is-open');
    this.overlayMarker.parentNode.insertBefore(node, this.overlayMarker);
    this.overlayMarker.parentNode.removeChild(this.overlayMarker);
    this.overlayNode = this.overlayMarker = null;
    this.overlay.hidden = true;
  };

  Television.prototype.onKey = function (e) {
    if (e.key === 'Escape' && this.overlayNode) { this.closeOverlay(); return; }
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

    each(this.components, function (c) { if (c.comp.update) c.comp.update(self, c.node, state); });
    this.renderChips(state);
  };

  Television.prototype.renderChips = function (state) {
    var self = this, opts = this.product.options;
    this.chipsEl.innerHTML = '';
    for (var key in opts) {
      if (!opts.hasOwnProperty(key)) continue;
      var s = state[key];
      this.chipsEl.appendChild(el('button', {
        type: 'button', class: 'ddtv__chip' + (s ? ' is-set' : ''), 'data-go': opts[key].chapter + '/' + opts[key].panel,
        title: s ? opts[key].label + ': ' + s.raw : opts[key].label + ' not selected yet'
      }, [el('span', { class: 'ddtv__chip-k', text: opts[key].label }), el('span', { class: 'ddtv__chip-v', text: s ? s.label : '—' })]));
    }
  };

  Television.prototype.onConfigChange = function (state, prev) {
    this.applySync(state);
    /* Signal which selection changed without moving the customer away. */
    var self = this;
    for (var k in state) {
      if (!state.hasOwnProperty(k)) continue;
      var a = JSON.stringify(state[k]), b = JSON.stringify(prev && prev[k]);
      if (prev && a !== b && state[k]) {
        var chip = $('.ddtv__chip[data-go^="' + this.product.options[k].chapter + '/' + this.product.options[k].panel + '"]', this.chipsEl);
        if (chip) { chip.classList.remove('is-flash'); void chip.offsetWidth; chip.classList.add('is-flash'); }
      }
    }
    if (this.view === 'interactive') this.updateScrollHint();
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
    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
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
    Components: Components,
    Television: Television,
    ConfigConnector: ConfigConnector
  };

  global.DDTV = DDTV;
})(window);
