/* SELECTION RULES of the Botanic configuration: one place for the laws the owner set (12 November 2026), shared by the large
   television and the mobile configuration. Pure functions, no page, no store: they decide what the single Add to Bag button
   shows and what the checkout is made of. Formatting of money is left to the screen; nothing here calculates a store price.

   The four choices, in the order the customer makes them: size, firmness, depth, cover.
   The five factors of a price: size, firmness, depth, cover and the promotion Ecwid applies (never its name).

   LAWS
   1. The button is READY only when all four choices are covered. READY lights it (larger, crisp ring); clicking it adds the mattress.
   2. Once the four are covered, changing any one of them keeps the button active: it is READY again for the new configuration.
   3. When the bag holds exactly the four choices, the same button is Go to Checkout (a second click opens the checkout).
   4. Whatever is missing is named, so the customer always knows where they are: "Still to choose: Size · Cover".
   5. The checkout is made of the five factors, and the promotion's discount is shown as the store gives it. A coupon or an
      e-mail code is entered in the checkout, never here.

   Each choice is an object with a key that identifies the choice (a value, an index or a label); a missing choice is null/undefined. */
(function (g) {
  'use strict';
  var ORDER = [['size', 'Size'], ['firmness', 'Firmness'], ['depth', 'Depth'], ['cover', 'Cover']];

  /* the names of the choices that are still missing, in the customer's order */
  function missing(sel) {
    return ORDER.filter(function (o) { return !(sel && sel[o[0]] && sel[o[0]].key != null && sel[o[0]].key !== ''); }).map(function (o) { return o[1]; });
  }
  function complete(sel) { return missing(sel).length === 0; }

  /* identifies one whole configuration; '' while anything is missing */
  function signature(sel) {
    if (!complete(sel)) return '';
    return ORDER.map(function (o) { return o[0] + '=' + sel[o[0]].key; }).join('|');
  }

  /* the face of the one bag button.
     bagSig: the signature Ecwid confirmed as being in the bag (or '' when nothing is in the bag). */
  function bagFace(sel, bagSig) {
    if (!complete(sel)) return { face: 'add', enabled: false, ready: false, text: 'Add to Bag', guide: 'Still to choose: ' + missing(sel).join(' · ') };
    if (bagSig && bagSig === signature(sel)) return { face: 'checkout', enabled: true, ready: false, text: 'Go to Checkout', guide: 'Added to your bag' };
    return { face: 'add', enabled: true, ready: true, text: 'Add to Bag', guide: bagSig ? 'Your new choice is not in the bag yet: Add to Bag again' : 'Ready to order: all four choices are made' };
  }

  /* the checkout's lines: the five factors, in order, and the promotion as the store shows it */
  function checkoutLines(sel, promoPct) {
    var lines = ORDER.map(function (o) { return { factor: o[1], value: sel && sel[o[0]] ? sel[o[0]].label : null }; });
    lines.push({ factor: 'Promotion', value: promoPct ? 'Save ' + promoPct + '%' : null });
    return lines;
  }

  var api = { ORDER: ORDER, missing: missing, complete: complete, signature: signature, bagFace: bagFace, checkoutLines: checkoutLines };
  g.DDRules = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
