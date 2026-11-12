/* PROPOSAL, NOT DEPLOYED. Device-appropriate loader for the Divine Product TV.
 *
 * Replaces the one-line loader (dist/embed/ecwid-loader.js) only after approval. The decision is taken BEFORE any file is
 * requested, from the physical screen, not from the window: a script that is never requested costs nothing, whereas
 * `display:none` on something that was already downloaded and run costs everything.
 *
 *   phone   -> the phone layer only (small); the television bundle is never requested
 *   tablet and desktop -> the television bundle, exactly as today
 *   ?ddtv=off -> nothing; ?ddtv=phone / ?ddtv=tv force a layer (review only; has no effect on what visitors get)
 *
 * The rule is the one the engine already uses (Television.prototype.isPhone: shortest screen side under 600 px), so the
 * behaviour of every device stays what it is; only the download changes. It is orientation-proof (a phone held sideways
 * has the same shortest side), rotation-proof (screen, not window), resize-proof (a desktop window dragged narrow keeps
 * the television bundle, and the engine's own width rules keep showing the standard view, as they do today) and
 * iPad-proof (an iPad mini's shortest side is 744 px; Split View does not change the screen).
 * Not decided here (owner): a foldable unfolded to about 673 px counts as a tablet.
 *
 * Failure: both layers are optional. A failed or interrupted download leaves the standard Ecwid page untouched, which is
 * the default state, so there is nothing to restore.
 */
(function (w, d) {
  'use strict';
  var BASE = 'https://YOUR-SITE.example/PATH/';           // replaced at release
  var V = '?v=REPLACE';                                   // cache key, as today
  var PHONE_MAX_SHORT_SIDE = 600;

  function decide(env) {
    var q = env.search || '', s = env.screen || {};
    if (/[?&]ddtv=off\b/.test(q)) return 'none';
    if (/[?&]ddtv=phone\b/.test(q)) return 'phone';
    if (/[?&]ddtv=tv\b/.test(q)) return 'tv';
    var short = Math.min(s.width || 9999, s.height || 9999);
    return short < PHONE_MAX_SHORT_SIDE ? 'phone' : 'tv';
  }
  w.__ddtvDecide = decide;                                 // exposed for the test only

  if (w.__ddtvLoader) return;
  w.__ddtvLoader = true;
  var which = decide({ search: w.location.search, screen: w.screen });
  if (which === 'none') return;
  var file = which === 'phone' ? 'botanic-phone.js' : 'botanic-tv.js';
  var s = d.createElement('script');
  s.src = BASE + file + V; s.async = true;
  s.onerror = function () { try { d.documentElement.setAttribute('data-ddtv-load', 'failed'); } catch (e) { /* the standard page stays */ } };
  d.head.appendChild(s);
}(window, document));
