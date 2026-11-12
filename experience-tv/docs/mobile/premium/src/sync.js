/* Ecwid synchronisation adapter (PROPOSAL, NOT DEPLOYED).  window.DDSync
 *
 * The guided panel is only a presentation layer. The native Ecwid <select>s stay the single source of truth:
 *   panel -> Ecwid : set(role, which) chooses the native choice and fires `input` and `change` exactly as a person would
 *   Ecwid -> panel : any change to a native control (by the visitor, by Ecwid, by the television) is observed and reported
 * It computes no price. It reads the price text Ecwid renders. It never touches Add to Bag.
 *
 * Observed on the real page (tests/live/options-probe.cjs): the option nodes and the price node survive a change; the price
 * follows about 0.7 s later; Ecwid exposes OnProductSelectedOptionsChanged; on a slow phone TWO live product pages can exist,
 * each with its own state, so the active instance is resolved, never assumed.
 *
 * ES5, no dependencies.
 */
(function (w, d) {
  'use strict';
  var ROLES = [
    { role: 'size', re: /size/i },
    { role: 'depth', re: /depth|height/i },
    { role: 'firmness', re: /firm/i },
    { role: 'cover', re: /cover/i }
  ];
  function roleOf(title) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].re.test(title)) return ROLES[i].role; return null; }
  function text(e) { return (e && e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function each(l, f) { for (var i = 0; i < l.length; i++) f(l[i], i); }

  function Sync(opts) {
    this.opts = opts || {};
    this.subs = []; this.busy = 0; this.last = null; this.touched = null; this.mo = null; this.timer = null; this.dead = false;
    var self = this;
    this._pointer = function (e) { self.touched = e.target; };
    d.addEventListener('pointerdown', this._pointer, true); d.addEventListener('focusin', this._pointer, true);
    this._change = function (e) {
      var t = e.target; if (!t || t.tagName !== 'SELECT') return;
      var blk = t.closest && t.closest('.details-product-option'); if (!blk) return;
      self._emit(self.busy ? 'panel' : 'native', roleOf(text(blk.querySelector('.details-product-option__title, .form-control__label, label'))));
    };
    d.addEventListener('change', this._change, true);
    try { if (w.Ecwid && w.Ecwid.OnProductSelectedOptionsChanged) w.Ecwid.OnProductSelectedOptionsChanged.add(function () { self._schedule('ecwid-event'); }); } catch (e) { /* optional */ }
    try { if (w.Ecwid && w.Ecwid.OnPageLoaded) w.Ecwid.OnPageLoaded.add(function () { self._schedule('page-loaded'); }); } catch (e) { /* optional */ }
    this.mo = new MutationObserver(function () { self._schedule('dom'); });
    this.mo.observe(d.body, { subtree: true, childList: true, characterData: true });
  }

  /* The live product page. With more than one (slow phone), prefer the instance the visitor touched, else the one in the
     popup layer (the one on top), else the first. */
  Sync.prototype.root = function () {
    var pages = d.querySelectorAll('.ec-store__product-page');
    if (!pages.length) return d;
    if (pages.length === 1) return pages[0];
    var t = this.touched, i;
    if (t) for (i = 0; i < pages.length; i++) if (pages[i].contains(t)) return pages[i];
    for (i = 0; i < pages.length; i++) if (pages[i].closest('.ecwid-popup')) return pages[i];
    return pages[0];
  };
  Sync.prototype.instances = function () { return d.querySelectorAll('.ec-store__product-page').length || 1; };

  Sync.prototype.blocks = function () {
    var out = {}, r = this.root();
    each(r.querySelectorAll('.details-product-option'), function (b) {
      var sel = b.querySelector('select'); if (!sel) return;
      var role = roleOf(text(b.querySelector('.details-product-option__title, .form-control__label, label')));
      if (role && !out[role]) out[role] = { block: b, select: sel };
    });
    return out;
  };

  Sync.prototype.priceNode = function () { return this.root().querySelector('.details-product-price__value'); };
  /* Ecwid's own earlier price (struck through) and discount note: present only while the store shows a promotion. Read as text, never calculated. */
  Sync.prototype.compareNode = function () { return this.root().querySelector('.details-product-price-compare__container s'); };
  Sync.prototype.discountNode = function () { return this.root().querySelector('.product-details__product-price-discount'); };

  /* A plain snapshot: what each native option says now, which choices it offers, the price text. */
  Sync.prototype.read = function () {
    var bl = this.blocks(), s = { options: {}, price: text(this.priceNode()), compare: text(this.compareNode()), discount: text(this.discountNode()), instances: this.instances(), found: false };
    for (var role in bl) {
      var sel = bl[role].select, o = sel.options[sel.selectedIndex];
      var chosen = !!(o && sel.selectedIndex > 0 && !/^(please choose|select)/i.test(o.text));
      s.found = true;
      s.options[role] = { chosen: chosen, label: chosen ? o.text.replace(/\s+/g, ' ').trim() : '', value: sel.value, choices: [] };
      for (var i = 0; i < sel.options.length; i++) {
        var c = sel.options[i]; if (!i && /^(please choose|select)/i.test(c.text)) continue;
        s.options[role].choices.push({ value: c.value, label: c.text.replace(/\s+/g, ' ').trim(), disabled: !!c.disabled });
      }
    }
    return s;
  };

  /* Choose a native value. `which` is a value, a label, a RegExp or a function(choice)->bool. Resolves {ok, reason}. */
  Sync.prototype.set = function (role, which) {
    var self = this, bl = this.blocks(), b = bl[role];
    return new Promise(function (resolve) {
      if (!b) return resolve({ ok: false, reason: 'no-native-option' });
      var sel = b.select, pick = null, i;
      for (i = 0; i < sel.options.length; i++) {
        var o = sel.options[i], lab = o.text.replace(/\s+/g, ' ').trim();
        var hit = typeof which === 'function' ? which({ value: o.value, label: lab }) : which instanceof RegExp ? which.test(lab) : (o.value === which || lab === which);
        if (hit && !o.disabled && !/^(please choose|select)/i.test(lab)) { pick = o; break; }
      }
      if (!pick) return resolve({ ok: false, reason: 'choice-unavailable' });
      self.busy++;
      try { sel.value = pick.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
      finally { setTimeout(function () { self.busy = Math.max(0, self.busy - 1); }, 50); }
      var t0 = Date.now();
      (function check() {
        var now = self.blocks()[role];
        if (now && now.select.value === pick.value) return resolve({ ok: true, label: pick.text.replace(/\s+/g, ' ').trim() });
        if (Date.now() - t0 > (self.opts.verifyMs || 2000)) return resolve({ ok: false, reason: 'not-reflected' });
        setTimeout(check, 80);
      })();
    });
  };
  Sync.prototype.clear = function (role) { var b = this.blocks()[role]; if (!b) return; var self = this; self.busy++; b.select.selectedIndex = 0; b.select.dispatchEvent(new Event('input', { bubbles: true })); b.select.dispatchEvent(new Event('change', { bubbles: true })); setTimeout(function () { self.busy = Math.max(0, self.busy - 1); }, 50); };

  /* The panel can be shown only when the native options exist. Resolves false after `timeout` ms: the panel then stays
     unavailable and the standard Ecwid controls remain the way to configure (nothing is hidden or removed by this module). */
  Sync.prototype.ready = function (timeout) {
    var self = this;
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function poll() { if (self.read().found) return resolve(true); if (Date.now() - t0 > (timeout || 8000)) return resolve(false); setTimeout(poll, 150); })();
    });
  };

  Sync.prototype.onChange = function (fn) { this.subs.push(fn); var s = this; return function () { s.subs = s.subs.filter(function (x) { return x !== fn; }); }; };
  Sync.prototype._schedule = function (why) { var self = this; if (this.timer) return; this.timer = setTimeout(function () { self.timer = null; self._emit(why, null, true); }, 120); };
  Sync.prototype._emit = function (source, role, onlyIfDifferent) {
    if (this.dead) return;
    var s = this.read(), key = JSON.stringify([s.price, s.compare, s.discount, s.instances, Object.keys(s.options).map(function (k) { return s.options[k].value; })]);
    if (onlyIfDifferent && key === this.last) return;
    this.last = key;
    for (var i = 0; i < this.subs.length; i++) { try { this.subs[i](s, { source: source, role: role }); } catch (e) { /* a subscriber must not break the others */ } }
  };
  Sync.prototype.destroy = function () {
    this.dead = true; this.subs = [];
    d.removeEventListener('pointerdown', this._pointer, true); d.removeEventListener('focusin', this._pointer, true); d.removeEventListener('change', this._change, true);
    if (this.mo) this.mo.disconnect();
  };

  w.DDSync = { create: function (o) { return new Sync(o); }, roleOf: roleOf };
}(window, document));
