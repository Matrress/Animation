/*!
 * Divine DunlopDreams — Experience TV: model gallery
 *
 * Two parts, kept apart:
 *
 *   Adapter    reads the product's images, normalises them and answers "which
 *              images, in which order, in which sizes". It never builds a URL:
 *              every URL it returns was supplied by Ecwid (the store's rendered
 *              gallery) or by a media manifest made from an Ecwid product record.
 *   Gallery    the View Model Gallery inside the television: a button in the
 *              monitor's header and an overlay that is built only when the
 *              customer opens it. Nothing is requested before that.
 *
 * Ecwid owns the images. This file only reads; it uploads, edits and deletes
 * nothing, and it never copies the store's gallery: the store's own gallery is
 * isolated (not touched) by the engine while the television is showing.
 *
 * Needs ddtv-engine.js (window.DDTV). ES5, no dependencies.
 */
(function (global) {
  'use strict';

  var DDTV = global.DDTV;
  if (!DDTV || !DDTV.use) return;
  var doc = global.document, U = DDTV.util;
  var $ = U.$, $$ = U.$$, el = U.el, each = U.each, warn = U.warn;

  /* ================================================================== */
  /* Normalising image records                                           */
  /* ================================================================== */

  /* The size variants Ecwid supplies (field names as returned by the store's
     own product data). Their files have unrelated numbers: a URL of one size
     can NOT be derived from another, so only URLs that were supplied are used. */
  var WIDTHS = [160, 400, 800, 1500];
  var FIELD = { 160: 'image160pxUrl', 400: 'image400pxUrl', 800: 'image800pxUrl', 1500: 'image1500pxUrl' };
  var ORIGINAL = 'imageOriginalUrl';

  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function has(list, v) { for (var i = 0; i < list.length; i++) if (list[i] === v) return true; return false; }

  /* "…/products/831592302/5139577104.webp" -> "5139577104". The extension is
     optional: the original file of an older upload has none (".../4388938281"),
     and some files are .jpg (real data had all three forms). */
  function assetId(url) {
    var m = /\/(\d+)(?:\.[a-z0-9]+)?(?:[?#].*)?$/i.exec(String(url || ''));
    return m ? m[1] : '';
  }

  /* One record in Ecwid's shape (id, isMain, width, height, image160pxUrl …
     image1500pxUrl, imageOriginalUrl, alt, altType) plus, in a manifest, our own
     fields (category, customerGallery, usedIn, caption). Returns null when the
     record carries no URL at all. */
  function normaliseItem(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    var urls = {}, ids = [];
    each(WIDTHS, function (w) {
      var u = raw[FIELD[w]];
      if (u) { urls[w] = String(u); ids.push(assetId(u)); }
    });
    if (raw[ORIGINAL]) { urls.original = String(raw[ORIGINAL]); ids.push(assetId(raw[ORIGINAL])); }
    if (!ids.length) return null;
    return {
      id: raw.id != null ? String(raw.id) : '',
      key: assetId(urls.original || urls[1500] || urls[800] || urls[400] || urls[160]),
      order: index,
      isMain: !!raw.isMain,
      width: Number(raw.width) || 0,
      height: Number(raw.height) || 0,
      alt: clean(raw.alt),
      altType: raw.altType ? String(raw.altType) : '',
      caption: clean(raw.caption),
      category: raw.category ? String(raw.category) : '',
      customerGallery: raw.customerGallery !== false,
      usedIn: raw.usedIn && raw.usedIn.length ? [].slice.call(raw.usedIn) : [],
      urls: urls,
      ids: ids,
      source: 'manifest',
      verified: null
    };
  }

  /* A list of Ecwid-shaped records (a product's media items, or a manifest's images). */
  function normaliseList(rawList) {
    var out = [];
    each(rawList || [], function (raw, i) { var im = normaliseItem(raw, i); if (im) out.push(im); });
    return out;
  }

  /* ================================================================== */
  /* Reading the store's own gallery (once, as a snapshot)               */
  /* ================================================================== */

  function bgUrl(node) {
    var m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(String(global.getComputedStyle(node).backgroundImage || ''));
    return m ? m[1] : '';
  }

  /* The product's images as the store has rendered them: the thumbnails, in the
     store's order (each is a CSS background in Ecwid's markup), or the single
     picture when there are no thumbnails. The product's own set: the store swaps
     other images in when options are chosen, so this is read when the television
     starts, not followed afterwards. */
  function readNative(tv) {
    var L = tv.product.layout || {}, N = (tv.product.modelGallery || {}).native || {};
    var c = $((L.gallery && L.gallery.container) || '.product-details__gallery');
    if (!c) return [];
    var out = [], seen = {};
    function add(url) {
      var id = assetId(url);
      if (!url || !id || seen[id]) return;
      seen[id] = 1;
      out.push({ url: url, id: id });
    }
    each($$(N.thumb || '.details-gallery__thumb', c), function (t) {
      var url = '', nodes = [t].concat($$('*', t));
      for (var i = 0; i < nodes.length && !url; i++) url = bgUrl(nodes[i]);
      if (!url) { var im = $('img', t); if (im) url = im.currentSrc || im.getAttribute('src') || ''; }
      add(url);
    });
    /* The thumbnails are the store's complete listing. A lone picture (a product
       with one image, or a gallery still rendering) is only what is on screen: it
       can show an image, but it must never make other images look deleted. */
    out.complete = out.length > 0;
    if (!out.length) {
      var pic = $(N.picture || '.details-gallery__picture', c);
      if (pic) add(pic.currentSrc || pic.getAttribute('src'));
    }
    return out;
  }

  /* ================================================================== */
  /* Adapter                                                             */
  /* ================================================================== */

  function validManifest(product, m) {
    if (!m || !m.images || !m.images.length) return null;
    var ids = product.productIds || [];
    if (m.productId != null && ids.length && !has(ids, Number(m.productId))) {
      warn('A media manifest for another product (' + m.productId + ') was ignored.');
      return null;
    }
    return m;
  }

  function Adapter(tv) {
    this.tv = tv;
    this.G = tv.product.modelGallery || {};
    this.manifest = validManifest(tv.product, tv.product.mediaManifest);
    this.snapshot = [];
    this.list = null;
    this.rep = null;
    this.listeners = [];
    this.remoteTried = false;
  }

  /* Read the store's gallery now. */
  Adapter.prototype.snap = function () {
    this.snapshot = readNative(this.tv);
    this.list = null;
    return this.snapshot;
  };

  Adapter.prototype.onChange = function (fn) { this.listeners.push(fn); };
  Adapter.prototype.notify = function () {
    each(this.listeners, function (f) { try { f(); } catch (e) { warn('Gallery listener failed', e); } });
  };

  Adapter.prototype.signature = function () {
    return this.images().map(function (i) { return i.key + ':' + i.ids.join(','); }).join('|');
  };

  /* Read again; tell listeners only if the result changed. */
  Adapter.prototype.refresh = function () {
    var before = this.signature();
    this.snap();
    if (this.signature() !== before) this.notify();
  };

  /* The customer gallery: which images, in which order. */
  Adapter.prototype.images = function () { return this.list || this.build(); };

  Adapter.prototype.report = function () { this.images(); return this.rep; };

  Adapter.prototype.build = function () {
    var snap = this.snapshot, known = {}, rep = { mode: '', native: snap.length, shown: 0, unlisted: [], stale: [], unverified: 0, resources: 0 }, out = [];
    var readable = snap.length > 0 && snap.complete !== false;    /* the store's full listing was read */
    each(snap, function (s) { known[s.id] = true; });
    var man = this.manifest;

    if (man) {
      /* The manifest says which images are meant for the customer gallery and
         what they are. The store's gallery says which of them still exist. */
      rep.mode = 'manifest';
      var items = normaliseList(man.images);
      each(items, function (im) {
        /* Only images meant for the customer gallery are checked against the
           store's gallery. A supporting resource (used elsewhere in the
           presentation) need not be in this product's Ecwid gallery at all. */
        if (!im.customerGallery) return;
        var present = false;
        each(im.ids, function (id) { if (known[id]) present = true; });
        im.verified = readable ? present : null;         /* null: the store's gallery was not fully readable */
        if (im.verified === false) rep.stale.push(im.key);   /* deleted or replaced in Ecwid */
        if (im.verified === null) rep.unverified++;
      });
      if (readable) each(snap, function (s) {             /* uploaded in Ecwid, not in the manifest */
        var listed = false;
        each(items, function (im) { if (has(im.ids, s.id)) listed = true; });
        if (!listed) rep.unlisted.push(s.url);
      });
      each(items, function (im) {
        if (!im.customerGallery) rep.resources++;          /* supporting resource, not for this gallery */
        else if (im.verified !== false) out.push(im);
      });
      /* Order: the store's order (so reordering in Ecwid works) unless the manifest keeps its own. */
      if ((man.order || this.G.order || 'ecwid') === 'ecwid' && readable) {
        var pos = {};
        each(snap, function (s, n) { pos[s.id] = n; });
        each(out, function (im) {
          var p = 1e6;
          each(im.ids, function (id) { if (pos[id] != null && pos[id] < p) p = pos[id]; });
          im.sortKey = p;
        });
        out.sort(function (a, b) { return (a.sortKey - b.sortKey) || (a.order - b.order); });
      }
      /* Policy for images the manifest does not know: hidden unless the manifest says 'show'. */
      if (readable && (man.unlisted || this.G.unlisted || 'hide') === 'show') {
        each(snap, function (s, n) {
          var listed = false;
          each(items, function (im) { if (has(im.ids, s.id)) listed = true; });
          if (!listed) out.push(nativeItem(s, n));
        });
      }
    } else {
      /* No manifest (a product not yet migrated): every image of the store's own gallery. */
      rep.mode = 'native';
      each(snap, function (s, n) { out.push(nativeItem(s, n)); });
    }

    each(out, function (im, n) { im.index = n; });
    rep.shown = out.length;
    this.list = out;
    this.rep = rep;
    return out;
  };

  function nativeItem(s, n) {
    return {
      id: '', key: s.id, order: n, isMain: null, width: 0, height: 0, alt: '', altType: '', caption: '',
      category: 'gallery', customerGallery: true, usedIn: [],
      urls: { native: s.url }, ids: [s.id], source: 'native', verified: true
    };
  }

  /* An optional hosted copy of the manifest, fetched once and only when asked
     for (never on the critical path). A manifest for another product is ignored. */
  Adapter.prototype.loadRemote = function (done) {
    var self = this, url = this.G.manifestUrl;
    if (!url || this.remoteTried || !global.fetch) { done(false); return; }
    this.remoteTried = true;
    global.fetch(url, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      var m = validManifest(self.tv.product, j);
      if (m) { self.manifest = m; self.list = null; }
      done(!!m);
    }).catch(function (e) { warn('The hosted media manifest could not be loaded; using what the store shows.', e); done(false); });
  };

  /* The smallest supplied variant that is sharp enough for `cssWidth`, then the
     other supplied variants as fallbacks (larger first, then smaller). The
     original file is used only when no sized variant exists. */
  function candidates(im, cssWidth, dpr) {
    var need = cssWidth * Math.min(dpr || 1, 2), sized = [], i;
    for (i = 0; i < WIDTHS.length; i++) if (im.urls[WIDTHS[i]]) sized.push({ w: WIDTHS[i], u: im.urls[WIDTHS[i]] });
    var out = [];
    if (!sized.length) {
      if (im.urls.native) out.push(im.urls.native);
      if (im.urls.original) out.push(im.urls.original);
      return out;
    }
    var first = sized.length - 1;
    for (i = 0; i < sized.length; i++) if (sized[i].w >= need) { first = i; break; }
    out.push(sized[first].u);
    for (i = first + 1; i < sized.length; i++) out.push(sized[i].u);
    for (i = first - 1; i >= 0; i--) out.push(sized[i].u);
    if (im.urls.original) out.push(im.urls.original);
    return out;
  }

  /* ================================================================== */
  /* Gallery component                                                   */
  /* ================================================================== */

  function Gallery(tv, adapter, cfg) {
    this.tv = tv;
    this.ad = adapter;
    this.cfg = cfg;
    this.box = null;
    this.cur = 0;
    this.cat = '';
    this.timers = [];
    this.mo = null;
  }

  Gallery.prototype.label = function () { return this.cfg.label || 'View Model Gallery'; };

  /* The button lives in the monitor's header row, so it is there on every screen. */
  Gallery.prototype.init = function () {
    var self = this, tv = this.tv;
    this.btn = el('button', {
      type: 'button', class: 'ddtv__galbtn', 'aria-haspopup': 'dialog', hidden: true,
      onclick: function () { self.open(); }
    }, [
      el('span', { class: 'ddtv__galbtn-ico', 'aria-hidden': 'true' }),
      el('span', { class: 'ddtv__galbtn-txt', text: this.label() }),
      el('span', { class: 'ddtv__galbtn-n' })
    ]);
    var head = $('.ddtv__head', tv.root);
    if (head) { head.classList.add('ddtv__head--gal'); head.appendChild(this.btn); }
    this.ad.onChange(function () { self.update(); });
    this.ad.snap();
    this.update();
    /* The store may not have rendered its gallery yet: read again shortly, and
       as soon as it appears. None of this requests an image. */
    this.timers.push(setTimeout(function () { self.ad.refresh(); self.update(); }, 1200));
    this.timers.push(setTimeout(function () { self.ad.refresh(); self.update(); }, 3000));
    if (!this.ad.snapshot.length) this.watchNative();
    if (this.cfg.manifestUrl) this.timers.push(setTimeout(function () { self.ad.loadRemote(function (ok) { if (ok) self.update(); }); }, 1500));
    this.report();
  };

  Gallery.prototype.watchNative = function () {
    var self = this, L = this.tv.product.layout || {}, c = $((L.gallery && L.gallery.container) || '.product-details__gallery');
    if (!c || !global.MutationObserver) return;
    this.mo = new MutationObserver(function () {
      self.ad.refresh();
      if (self.ad.snapshot.length) { self.mo.disconnect(); self.mo = null; self.update(); }
    });
    this.mo.observe(c, { childList: true, subtree: true });
    this.timers.push(setTimeout(function () { if (self.mo) { self.mo.disconnect(); self.mo = null; } }, 15000));
  };

  /* What the owner needs to know: images in the store but not in the manifest
     (hidden until classified) and manifest entries the store no longer has. */
  Gallery.prototype.report = function () {
    var r = this.ad.report();
    if (r.mode === 'manifest' && (r.unlisted.length || r.stale.length)) {
      try {
        global.console.info('[ddtv] Model Gallery: ' + r.unlisted.length + ' image(s) in the store are not in the media manifest (hidden), ' +
          r.stale.length + ' manifest entr' + (r.stale.length === 1 ? 'y is' : 'ies are') + ' no longer in the store (dropped). Regenerate the manifest.');
      } catch (e) { /* ignore */ }
    }
  };

  Gallery.prototype.update = function () {
    var n = this.ad.images().length;
    this.btn.hidden = n === 0;
    $('.ddtv__galbtn-n', this.btn).textContent = n ? n + (n === 1 ? ' photo' : ' photos') : '';
    this.btn.setAttribute('aria-label', this.label() + (n ? ', ' + n + (n === 1 ? ' photo' : ' photos') : ''));
  };

  /* The images shown now: the customer gallery, minus any that failed to load, filtered by category. */
  Gallery.prototype.shown = function () {
    var cat = this.cat;
    return this.ad.images().filter(function (im) { return !im.failed && (!cat || im.category === cat); });
  };

  Gallery.prototype.categories = function () {
    var seen = [], labels = (this.ad.manifest && this.ad.manifest.categories) || {};
    each(this.ad.images(), function (im) {
      if (!im.failed && im.category && !has(seen, im.category)) seen.push(im.category);
    });
    return seen.map(function (c) { return { id: c, label: labels[c] || c }; });
  };

  Gallery.prototype.open = function (startKey) {
    var self = this, tv = this.tv;
    if (this.box || tv.failed || tv.view !== 'interactive') return;
    this.ad.refresh();                     /* the store may have changed since the television started */
    if (!this.shown().length) { this.update(); return; }
    tv.userAction();                       /* pauses the presentation */
    tv.closeOverlay();

    var title = this.cfg.title || 'Model Gallery';
    this.count = el('span', { class: 'ddtv-gal__count', 'aria-live': 'polite' });
    this.closeBtn = el('button', { type: 'button', class: 'ddtv-gal__close', onclick: function () { tv.closeOverlay(); } }, ['Back to presentation']);
    this.cats = el('div', { class: 'ddtv-gal__cats', role: 'group', 'aria-label': 'Photo categories' });
    this.img = el('img', { class: 'ddtv-gal__img', decoding: 'async', alt: '' });
    this.cap = el('figcaption', { class: 'ddtv-gal__cap' });
    this.prev = el('button', { type: 'button', class: 'ddtv-gal__nav ddtv-gal__nav--prev', 'aria-label': 'Previous photo', onclick: function () { self.step(-1); } }, [el('span', { 'aria-hidden': 'true', text: '‹' })]);
    this.next = el('button', { type: 'button', class: 'ddtv-gal__nav ddtv-gal__nav--next', 'aria-label': 'Next photo', onclick: function () { self.step(1); } }, [el('span', { 'aria-hidden': 'true', text: '›' })]);
    this.stage = el('div', { class: 'ddtv-gal__stage' }, [this.prev, el('figure', { class: 'ddtv-gal__fig' }, [this.img, this.cap]), this.next]);
    this.strip = el('div', { class: 'ddtv-gal__strip', role: 'group', 'aria-label': 'All photos' });
    this.box = el('div', { class: 'ddtv-gal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
      el('div', { class: 'ddtv-gal__top' }, [el('span', { class: 'ddtv-gal__title', text: title }), this.count, this.closeBtn]),
      this.cats, this.stage, this.strip
    ]);

    /* Swipe on touch; the page behind keeps its own vertical scroll. */
    this.stage.addEventListener('touchstart', function (e) { if (e.touches.length === 1) self._tx = e.touches[0].clientX; }, { passive: true });
    this.stage.addEventListener('touchend', function (e) {
      if (self._tx == null || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - self._tx;
      self._tx = null;
      if (Math.abs(dx) > 40) self.step(dx < 0 ? 1 : -1);
    }, { passive: true });

    tv.overlayBox = this.box;
    tv.overlay.appendChild(this.box);
    tv.overlay.hidden = false;
    tv.overlayCleanup = function () { self.cleanup(); };
    tv.overlayKeys = function (e) { return self.keys(e); };
    tv.media.focus(tv.stage, null);        /* nothing plays behind the gallery */

    this.cat = '';
    this.buildCats();
    this.buildStrip();
    var list = this.shown(), at = 0;
    if (startKey) each(list, function (im, i) { if (im.key === startKey) at = i; });
    this.show(at);
    this.closeBtn.focus();
  };

  Gallery.prototype.buildCats = function () {
    var self = this, cats = this.categories();
    while (this.cats.firstChild) this.cats.removeChild(this.cats.firstChild);
    this.cats.hidden = cats.length < 2;     /* a single category needs no filter */
    if (cats.length < 2) return;
    function chip(id, label) {
      return el('button', {
        type: 'button', class: 'ddtv-gal__cat' + (self.cat === id ? ' is-on' : ''), 'aria-pressed': self.cat === id ? 'true' : 'false',
        onclick: function () { self.cat = id; self.buildCats(); self.buildStrip(); self.show(0); }
      }, [label]);
    }
    this.cats.appendChild(chip('', 'All'));
    each(cats, function (c) { self.cats.appendChild(chip(c.id, c.label)); });
  };

  Gallery.prototype.buildStrip = function () {
    var self = this;
    while (this.strip.firstChild) this.strip.removeChild(this.strip.firstChild);
    var dpr = global.devicePixelRatio || 1;
    each(this.shown(), function (im, i) {
      var urls = candidates(im, 76, dpr), t = el('img', { class: 'ddtv-gal__timg', alt: '', loading: 'lazy', decoding: 'async' });
      var tryAt = 0;
      t.onerror = function () { tryAt++; if (urls[tryAt]) t.src = urls[tryAt]; else t.classList.add('is-missing'); };
      t.src = urls[0] || '';
      self.strip.appendChild(el('button', {
        type: 'button', class: 'ddtv-gal__thumb', 'data-i': String(i),
        'aria-label': 'Photo ' + (i + 1) + (im.alt ? ': ' + im.alt : ''),
        onclick: function () { self.show(i); }
      }, [t]));
    });
  };

  Gallery.prototype.step = function (d) { this.show(this.cur + d); };

  /* Show one photo. Only this one large image is requested (and its next
     neighbour, once it has loaded). */
  Gallery.prototype.show = function (n) {
    var self = this, list = this.shown();
    if (!list.length || !this.box) return;
    n = (n + list.length) % list.length;
    this.cur = n;
    var im = list[n], width = this.stage.clientWidth || 600, urls = candidates(im, width, global.devicePixelRatio || 1), tryAt = 0;
    this.count.textContent = (n + 1) + ' / ' + list.length;
    this.img.alt = im.alt || ('Model photo ' + (n + 1) + ' of ' + list.length);
    this.cap.textContent = im.caption || '';
    this.cap.hidden = !im.caption;
    this.img.classList.add('is-loading');
    this.img.onload = function () { self.img.classList.remove('is-loading'); self.preload(n); };
    this.img.onerror = function () {
      tryAt++;
      if (urls[tryAt]) { self.img.src = urls[tryAt]; return; }
      self.drop(im);                        /* none of its files could be loaded: the store no longer has it */
    };
    this.img.src = urls[0] || '';
    each($$('.ddtv-gal__thumb', this.strip), function (b) {
      var on = Number(b.getAttribute('data-i')) === n;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
      if (on && b.scrollIntoView) { try { b.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* older engines */ } }
    });
    this.prev.disabled = this.next.disabled = list.length < 2;
  };

  /* Warm the next photo only, and not on a data-saving connection. */
  Gallery.prototype.preload = function (n) {
    var list = this.shown(), nav = global.navigator || {}, conn = nav.connection || {};
    if (conn.saveData || list.length < 2) return;
    var nx = list[(n + 1) % list.length], u = candidates(nx, this.stage.clientWidth || 600, global.devicePixelRatio || 1)[0];
    if (u) { var p = new global.Image(); p.src = u; }
  };

  /* An image whose files cannot be loaded (deleted in the store): leave it out. */
  Gallery.prototype.drop = function (im) {
    im.failed = true;
    this.update();
    var list = this.shown();
    if (!list.length) { this.tv.closeOverlay(); this.tv.toast('The photos are not available right now.'); return; }
    this.buildCats();
    this.buildStrip();
    this.show(Math.min(this.cur, list.length - 1));
  };

  Gallery.prototype.keys = function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); return true; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); return true; }
    if (e.key === 'Home') { e.preventDefault(); this.show(0); return true; }
    if (e.key === 'End') { e.preventDefault(); this.show(-1); return true; }
    if (e.key === 'Tab' && this.box) {          /* keep focus inside the dialog */
      var f = $$('button:not([disabled])', this.box).filter(function (b) { return b.offsetParent !== null; });
      if (!f.length) return false;
      var active = this.tv.shadow.activeElement, first = f[0], last = f[f.length - 1];
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); return true; }
      if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); return true; }
    }
    return false;
  };

  /* Closing: nothing of the gallery stays; the presentation resumes where it was. */
  Gallery.prototype.cleanup = function () {
    var tv = this.tv;
    this.box = null;
    this.img = this.stage = this.strip = this.cats = this.count = this.prev = this.next = this.cap = this.closeBtn = null;
    var c = tv.product.chapters[tv.chapterIndex], list = c && tv.panels[c.id], pn = list && list[tv.panelIndex[c.id] || 0];
    if (pn) tv.media.focus(tv.stage, pn.el);
    if (this.btn && !this.btn.hidden && tv.view === 'interactive') { try { this.btn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  };

  Gallery.prototype.onView = function (view) {
    if (view !== 'interactive') this.tv.closeOverlay();
  };

  Gallery.prototype.destroy = function () {
    each(this.timers, function (t) { clearTimeout(t); });
    this.timers = [];
    if (this.mo) { this.mo.disconnect(); this.mo = null; }
    if (this.btn && this.btn.parentNode) {
      this.btn.parentNode.classList.remove('ddtv__head--gal');
      this.btn.parentNode.removeChild(this.btn);
    }
  };

  /* ================================================================== */
  /* Attach to every television whose product config has `modelGallery`  */
  /* ================================================================== */

  DDTV.use(function (tv) {
    var cfg = tv.product.modelGallery;
    if (!cfg) return null;
    var adapter = new Adapter(tv), ui = new Gallery(tv, adapter, cfg);
    tv.modelGallery = { adapter: adapter, ui: ui };
    try { ui.init(); } catch (err) {
      /* The television works without the gallery: leave nothing half-built behind. */
      try { ui.destroy(); } catch (e) { /* ignore */ }
      tv.modelGallery = null;
      throw err;
    }
    return {
      view: function (v) { ui.onView(v); },
      destroy: function () { ui.destroy(); tv.modelGallery = null; }
    };
  });

  DDTV.gallery = {
    assetId: assetId,
    normaliseItem: normaliseItem,
    normaliseList: normaliseList,
    candidates: candidates,
    Adapter: Adapter
  };
}(window));
