/* Divine DunlopDreams · Baby & Junior Experience: the phone layer (guided configuration).
   Same scheme as Botanic TV, for the Dunlop Baby & Junior mattress. Ecwid stays the executor: options, price, bag and checkout are the shop's own.
   Acts only on the listed product; ?ddtv=off switches it off. Built by experience/build.py. */
(function () {
  'use strict';
  if (/[?&]ddtv=off\b/.test(location.search) || window.__DDBABY_PHONE) { return; }
  window.__DDBABY_PHONE = 1;
var DATA = {"model":"baby","product":{"id":644897086,"brand":[["b","Dunlop"],["i","Baby & Junior"],["s","100%"],["b","Natural Latex"],["s","Mattress"]],"name":"Dunlop Baby & Junior 100% Natural Latex Mattress","intro":"A cot and junior bed mattress with a single core of 100% natural Dunlop latex, inside a quilted 100% cotton cover. Made to order, in the size and depth you choose, for the first beds of childhood.","heroHead":"One piece of natural latex"},"groups":[{"key":"cot","name":"Single sizes","sub":"Test"},{"key":"junior","name":"Double sizes","sub":"Test"}],"sizes":[{"w":80,"l":200,"g":"cot"},{"w":90,"l":200,"g":"cot"},{"w":100,"l":200,"g":"cot"},{"w":120,"l":200,"g":"junior"},{"w":140,"l":200,"g":"junior"}],"heights":[{"cm":23,"name":"23 cm","sub":"","desc":"Test."},{"cm":26,"name":"26 cm","sub":"","desc":"Test."}],"videos":{"origin":{"url":"https://media.divinedunlop.com/videos/natural-latex-milk-to-foam-origin.mp4","end":13.2,"label":"Where natural latex begins","poster":"https://cdn.jsdelivr.net/gh/Matrress/Animation@7ec5ad8ae12e1e16be82f8928cdb1fcc6f78126c/divine-baby-junior/experience/assets/dunlop-natural-latex-origin-film-poster-960.webp"},"vent":{"url":"https://media.divinedunlop.com/videos/natural-latex-airflow-ventilation-channels.mp4","end":0,"label":"Air moving through the latex","poster":"https://cdn.jsdelivr.net/gh/Matrress/Animation@7ec5ad8ae12e1e16be82f8928cdb1fcc6f78126c/divine-baby-junior/experience/assets/dunlop-natural-latex-ventilation-film-poster-960.webp"}},"keyFeatures":["100% natural Dunlop latex","One-piece core","Ventilation channels","100% cotton cover","Baby Cot and Junior sizes","Made to order"],"slides":[{"id":"closed","label":"Closed","alt":"Dunlop Baby & Junior mattress with its cotton cover closed, showing the wide quilted waves and the zip along the side"},{"id":"open","label":"Open","alt":"Dunlop Baby & Junior mattress with the cotton cover unzipped and folded back to reveal the one-piece natural latex core"},{"id":"core","label":"Latex core","alt":"Close-up of the one-piece natural Dunlop latex core with its rows of ventilation channels"},{"id":"quilt","label":"Quilting","alt":"Close-up of the quilted 100% cotton cover with its wide transverse waves"},{"id":"zip","label":"Zip","alt":"Close-up of the zip puller and the side panel of the cotton cover"}],"topicSlide":{"discover":0,"origin":1,"healthy":2,"comfort":0,"benefits":1,"ventilation":2,"hygiene":4,"cover":3,"firmness":0,"care":0},"facts":[{"l":"Material","v":"100% natural Dunlop latex"},{"l":"Depths","v":"10 / 14 cm"},{"l":"Sizes","v":"8 sizes","pills":["Baby Cot Size · 4","Junior Size · 4"]},{"l":"Firmness","v":"Medium","pills":["One firmness"]},{"l":"Cover","v":"100% cotton","pills":["Quilted","Zip along the side"]},{"l":"Made","v":"To order","pills":["Your size","Your depth"]}],"chapters":[{"id":"discover","label":"Discover","head":"Everything about the mattress, topic by topic.","panels":[{"id":"intro","label":"Introduction","kind":"hero"},{"id":"glance","label":"At A Glance","kind":"facts","title":"Your mattress at a glance"},{"id":"who","label":"Who It Is For","kind":"read","title":"For cots and first beds","groups":[{"h":null,"blocks":[{"k":"p","t":"**Baby Cot Size** is made for cots and cot beds. **Junior Size** is made for junior and single beds. Every size has the same core, the same Medium firmness and the same cotton cover."},{"k":"p","t":"Each mattress is made to order, in the size and depth you choose in **Select & Buy**."}]},{"h":"Before you choose","blocks":[{"k":"p","t":"Cot and bed sizes differ between manufacturers. Measure the **inside** of the frame, length and width, and check the maximum mattress depth your cot or bed allows."}]}]},{"id":"promise","label":"Honest Promise","kind":"read","title":"What we say, and what we do not","groups":[{"h":"What we say","blocks":[{"k":"p","t":"One piece of 100% natural Dunlop latex with ventilation channels, inside a quilted 100% cotton cover with a zip along the side. Medium firmness. Made to order in the size and depth you select."}]},{"h":"What we do not say","blocks":[{"k":"p","t":"We do not say this mattress suits every cot, and we make no medical claims. Always follow current guidance from the NHS and The Lullaby Trust, together with the instructions supplied with your cot."}]}]}]},{"id":"origin","label":"Origin","head":"Where natural latex comes from.","panels":[{"id":"milk","label":"From Tree To Foam","kind":"video","video":"origin","title":"Where natural latex begins","text":["Natural latex starts as the **milk of the rubber tree**, a renewable plant. It is gathered, and **Dunlop Technology** turns it into foam.","In the film, the milk flows, gathers and is poured into the shape that becomes the core of the mattress."]},{"id":"plant","label":"Plant-Based","kind":"points","title":"A plant-based material","items":[{"t":"Made from a plant","d":"Natural latex comes from the rubber tree. Memory foam, HR foam and standard polyurethane foam are made from refined petroleum."},{"t":"Renewable source","d":"The tree is tapped for its milk, and keeps growing."},{"t":"One block","d":"The core is moulded as a single piece of 100% natural latex, with no glued layers."},{"t":"Open-cell structure","d":"Latex foam is open-celled, so air can move through it."}]},{"id":"dunlop","label":"Dunlop Technology","kind":"read","title":"One piece, made with Dunlop Technology","groups":[{"h":null,"blocks":[{"k":"p","t":"The core is made with **Dunlop Technology** as one moulded block, with rows of ventilation channels formed in it during moulding."},{"k":"p","t":"Because it is one piece, there are no glued layers to separate and nothing hidden inside that you cannot see: open the zip and the whole core is in view."}]}]}]},{"id":"healthy","label":"Healthy","head":"A healthy place to sleep starts with the surface.","panels":[{"id":"means","label":"What Healthy Means","kind":"points","title":"What a healthy sleep surface is made of","items":[{"t":"A natural, plant-based core","d":"100% natural Dunlop latex, from the rubber tree, moulded as one piece."},{"t":"Air moves through it","d":"An open-cell structure with ventilation channels lets air move through the core instead of being held at the surface."},{"t":"A natural-fibre cover","d":"A quilted cover of 100% cotton, a natural plant fibre."},{"t":"Easy to check","d":"The cover opens along the side with a zip, so the core can be seen and checked."}]},{"id":"air","label":"Air And Dryness","kind":"read","title":"Air and dryness","groups":[{"h":"Why air matters for a child","blocks":[{"k":"p","t":"Children sleep warm, and every night leaves some warmth and moisture behind. A core that lets air move through it, instead of holding it at the surface, keeps the sleeping surface fresher and drier."}]},{"h":"A note on claims","blocks":[{"k":"p","t":"A mattress is not a climate control system: the room matters most. What ventilation genuinely does is stop warmth and moisture being trapped inside the mattress."}]}]},{"id":"even","label":"Even Support","kind":"read","title":"Support that stays even","groups":[{"h":null,"blocks":[{"k":"p","t":"Natural latex is dense and elastic. It carries the body evenly across the surface and answers every movement at once, without a slow recovery."},{"k":"p","t":"The mattress is made in one firmness, **Medium**, in every size and depth."}]}]},{"id":"honest","label":"Honest Note","kind":"read","title":"A whole environment, not one product","groups":[{"h":null,"blocks":[{"k":"p","t":"A healthy night's sleep for a baby or child depends on the whole sleep environment: the cot, the bedding, the room temperature and the way the child is put down to sleep."},{"k":"p","t":"This mattress is not a medical device and we make no medical claims. Always follow current guidance from the **NHS** and **The Lullaby Trust**, together with the instructions supplied with your cot."}]}]}]},{"id":"comfort","label":"Comfort","head":"What comfort to expect from natural latex.","panels":[{"id":"expect","label":"What To Expect","kind":"read","title":"What comfort to expect","groups":[{"h":null,"blocks":[{"k":"p","t":"Natural latex keeps the body **on the surface** and still follows its shape. It is the balance between **support** and **adaptation** that makes latex feel the way it does."},{"k":"p","t":"You feel lightness and softness on top, and steady support underneath: a natural material, used with engineering precision."}]}]},{"id":"support","label":"Support","kind":"points","title":"Support comes from density","items":[{"t":"Dense, not hard","d":"Latex is very dense, almost twice as dense as many foams used in mattresses. That density carries the body without a hard surface."},{"t":"Stays on the surface","d":"The body rests on the mattress rather than sinking into a hollow that closes around it."},{"t":"Free to move","d":"Because the body is held up, turning over takes little effort."},{"t":"Keeps its shape","d":"A dense, elastic material keeps its shape under repeated use."}]},{"id":"adapt","label":"Adaptation","kind":"points","title":"Adaptation comes from elasticity","items":[{"t":"Instant response","d":"No delay and no warming-up: the latex answers the moment the body touches it."},{"t":"Weight spread across the surface","d":"The load is shared across the whole surface instead of concentrating in one spot."},{"t":"Movement absorbed","d":"Every small movement in sleep is absorbed and answered as it happens."},{"t":"No slow recovery","d":"The surface resets at once, unlike foams that recover slowly."}]}]},{"id":"benefits","label":"Benefits","head":"Why natural latex is a different kind of material.","panels":[{"id":"why","label":"Why Latex","kind":"points","title":"Why natural latex is different","items":[{"t":"Different from memory foam","d":"Latex responds at once and does not wrap around the body or recover slowly."},{"t":"Different from springs","d":"No coils: a continuous, silent, even surface across the whole mattress."},{"t":"A bio-based material","d":"Tapped from a renewable plant, and not made from petroleum."},{"t":"One piece, made with Dunlop Technology","d":"A single moulded block with ventilation channels and no glued layers."}]},{"id":"last","label":"Made To Last","kind":"read","title":"A material that keeps its shape","groups":[{"h":null,"blocks":[{"k":"p","t":"Latex is dense and elastic, and a dense, elastic material keeps its shape and its response under repeated use."},{"k":"p","t":"Because the core is one piece, it does not rely on layers that can separate."}]}]}]},{"id":"ventilation","label":"Ventilation","head":"How air moves through the core.","panels":[{"id":"airflow","label":"Airflow","kind":"video","video":"vent","title":"Air moving through the latex","text":["The open-cell structure of natural latex, together with the **ventilation channels** formed in the core, lets air move through the mattress.","This is a structural feature of the material, not a surface treatment."]},{"id":"flow","label":"How It Works","kind":"flow","title":"From the structure to a fresher surface","steps":["Open-cell latex","Ventilation channels","Air moves through","A drier, fresher surface"],"close":"Ventilation does not cool the room. It stops warmth and moisture from being trapped inside the mattress."}]},{"id":"hygiene","label":"Hygiene","head":"A cleaner, drier sleep surface.","panels":[{"id":"clean","label":"Cleaner Sleep","kind":"points","title":"Built to stay clean and dry","items":[{"t":"Dry by design","d":"Airflow through the open-cell core keeps the surface drier than a closed foam would."},{"t":"Easy to check","d":"The zip opens the cover along the side, so the core can be seen and checked."},{"t":"Nothing hidden","d":"One moulded block: there are no glued layers to trap anything between them."}]},{"id":"care","label":"Keeping It Clean","kind":"read","title":"A realistic picture","groups":[{"h":"What we can say","blocks":[{"k":"p","t":"No mattress completely eliminates dust or bacteria. A dry, ventilated structure with a cover you can open is a sound starting point, and the rest is everyday care."}]},{"h":"Everyday care","blocks":[{"k":"p","t":"Follow the care instructions supplied with your mattress, and use a fitted sheet made for the exact mattress size."}]}]}]},{"id":"cover","label":"Cover","head":"100% cotton. Quilted. Zipped.","panels":[{"id":"cotton","label":"100% Cotton","kind":"cover","title":"100% cotton, quilted in wide waves","text":["The cover is **100% cotton**, a natural fibre. It is quilted in wide transverse waves and closes with a zip along the side, so the core inside can be seen.","The cover and the latex core are made together as one mattress: the cover is not a separate choice."]},{"id":"zip","label":"The Zip","kind":"read","title":"A zip along the side","groups":[{"h":null,"blocks":[{"k":"p","t":"A zip runs along the side, so the cover opens and the one-piece latex core inside can be seen and checked."},{"k":"p","t":"Follow the care instructions supplied with your mattress."}]}]},{"id":"fixed","label":"One Cover","kind":"read","title":"One cover, nothing to choose","groups":[{"h":null,"blocks":[{"k":"p","t":"Every Baby & Junior mattress has the same cover: **100% cotton**, quilted in wide transverse waves, with a zip along the side. There is nothing to select, so it is simply part of every order."}]}]}]},{"id":"firmness","label":"Firmness","head":"One firmness for the whole range.","panels":[{"id":"medium","label":"Medium","kind":"read","title":"Medium. Only Medium.","groups":[{"h":null,"blocks":[{"k":"p","t":"The Baby & Junior range is made in a single firmness, **Medium**, in every size and depth. There is nothing to select."}]}]},{"id":"why","label":"Not Weight-Based","kind":"read","title":"Why there is no firmness choice","groups":[{"h":null,"blocks":[{"k":"p","t":"Our adult, weight-based firmness recommendations do not apply to babies and children and are not used for this range."}]}]}]},{"id":"care","label":"Care & Fit","head":"Fit, care and safer sleep.","panels":[{"id":"fit","label":"Fit","kind":"read","title":"Find the right fit","groups":[{"h":null,"blocks":[{"k":"p","t":"Cot and bed sizes differ between manufacturers. The right mattress is the one that matches the inside of your frame."},{"k":"li","t":["**Measure inside.** Length and width of the cot or bed frame, not the outside.","**Match the size.** It should fit snugly, with no gaps at the sides or ends.","**Check the depth.** Many cots state a maximum mattress height: choose a depth within it.","**Follow your cot.** Use its instructions on mattress size and maximum height."]}]}]},{"id":"before","label":"Before Use","kind":"read","title":"Before it goes in the cot","groups":[{"h":null,"blocks":[{"k":"li","t":["**Unpacking.** Remove all packaging, including any plastic wrapping, before use, and keep it away from children.","**Bedding.** Use a fitted sheet made for the exact mattress size. Keep the sleeping surface flat and clear.","**Cover.** Follow the care instructions supplied with your mattress."]}]}]},{"id":"latex","label":"Latex & Safer Sleep","kind":"read","title":"Latex and safer sleep","groups":[{"h":"Contains natural rubber latex","blocks":[{"k":"p","t":"If anyone in your household has a latex allergy, please seek medical advice before purchase."}]},{"h":"Safer sleep","blocks":[{"k":"p","t":"Always follow current guidance from the NHS and The Lullaby Trust, together with the instructions supplied with your cot."}]}]}]}],"images":{"closed":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-mattress-cotton-cover-closed-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-mattress-cotton-cover-closed-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-mattress-cotton-cover-closed-1600.webp 1600w"},"open":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-core-cotton-cover-open-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-core-cotton-cover-open-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-core-cotton-cover-open-1600.webp 1600w"},"latex":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@b0c161a67ae725da9db1cfeaa2eae2b82d7e9b0f/divine-baby-junior/release/0.2.0/assets/dunlop-baby-junior-natural-latex-core-ventilation-detail-690.webp"},"quilt":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@b0c161a67ae725da9db1cfeaa2eae2b82d7e9b0f/divine-baby-junior/release/0.2.0/assets/dunlop-baby-junior-cotton-cover-quilting-detail-660.webp"},"zip":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@b0c161a67ae725da9db1cfeaa2eae2b82d7e9b0f/divine-baby-junior/release/0.2.0/assets/dunlop-baby-junior-cotton-cover-zip-detail-340.webp"}},"logo":"https://cdn.jsdelivr.net/gh/Matrress/Animation@9d681f860c9dae7dd866236d6824f413443b8512/divine-home-discovery/assets/bio-dunlop.svg"};
var FONT400 = "https://cdn.jsdelivr.net/gh/Matrress/Animation@57479ca18f8e6bab02e2a4aa0ec4f0cf82578fad/divine-hero/release/1.17.1/assets/chillax-400.woff2";
var FONT600 = "https://cdn.jsdelivr.net/gh/Matrress/Animation@57479ca18f8e6bab02e2a4aa0ec4f0cf82578fad/divine-hero/release/1.17.1/assets/chillax-600.woff2";
var PH_CSS = ":host{all:initial;display:block}:host{--w:#FFFFFF;--ink:#003A68;--ink2:rgba(0,58,104,.78);--line:rgba(0,58,104,.18);--sky2:rgba(178,227,251,.55);--acc:#91E8F1;--surf:#E4E8F0;--strong:#006591;--r:12px;--rl:16px;--f:'DBJChillax','Chillax','Helvetica Neue',Arial,system-ui,sans-serif}*{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer;margin:0}b{font-weight:600}:focus-visible{outline:3px solid var(--strong);outline-offset:2px}.sheet{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;display:flex;flex-direction:column;background:var(--w);color:var(--ink);font-family:var(--f);font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}.hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:calc(12px + env(safe-area-inset-top)) 16px 10px;border-bottom:1px solid var(--line);background:var(--w)}.hdt{display:flex;flex-direction:column;min-width:0}.hdt b{font-size:15px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stp{font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--strong)}.x{flex:0 0 44px;width:44px;height:44px;border:1px solid var(--line);background:var(--w);border-radius:var(--r);font-size:26px;line-height:1;color:var(--ink)}.prog{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 16px 0}.prog i{height:4px;border-radius:2px;background:var(--line)}.prog i.on{background:var(--strong)}.bd{flex:1 1 auto;overflow:auto;padding:16px 16px 20px;-webkit-overflow-scrolling:touch}.q{margin:0 0 6px;font-size:28px;line-height:1.12;font-weight:400;letter-spacing:-.015em}.sub{margin:0 0 14px;font-size:15.5px;line-height:1.5;color:var(--ink2)}.lab2{margin:16px 0 10px;font-size:12px;line-height:1.2;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--strong)}.fam,.cards{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}.card{display:flex;flex-direction:column;gap:2px;text-align:left;width:100%;background:var(--w);border:1.5px solid var(--line);border-radius:var(--rl);padding:16px 18px;color:var(--ink);min-height:64px}.card:active:not(:disabled){border-color:var(--ink)}.card:disabled{opacity:.5}.card .cm{font-size:22px;line-height:1.2;font-weight:600}.card .in{font-size:15px;color:var(--ink2)}.card .pr{font-size:16px;font-weight:600;margin-top:4px}.card .dsc{margin-top:6px;font-size:14.5px;line-height:1.45;color:var(--ink2)}.card.on{background:var(--strong);border-color:var(--strong);color:#fff}.card.on .in,.card.on .dsc{color:rgba(255,255,255,.92)}.fm1{font-size:20px;font-weight:600}.fm3{font-size:15px;color:var(--ink2)}.fm.on .fm3{color:rgba(255,255,255,.92)}.need{margin:14px 2px 0;font-size:14.5px;color:var(--ink2)}.rv{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:8px}.rv li{display:flex;justify-content:space-between;gap:12px;background:var(--surf);border:1px solid var(--line);border-radius:var(--r);padding:13px 16px;font-size:15.5px}.rv li span{color:var(--ink2)}.rv li b{text-align:right}.rv li i,.rvp i{font-style:normal;font-weight:400;color:var(--ink2)}.rvp{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-radius:var(--rl);border:1.5px solid var(--strong);background:var(--w)}.rvp span{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--strong)}.rvp b{font-size:26px}.guide{margin:12px 2px 0;text-align:center;font-size:14px;line-height:1.4;font-weight:600;color:var(--ink2)}.ft{display:flex;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:var(--w)}.btn{flex:1 1 0;border:1.5px solid var(--strong);background:var(--strong);color:#fff;border-radius:var(--r);padding:15px 18px;font-weight:600;font-size:17px;line-height:1.2;min-height:52px}.btn:disabled{opacity:.45}.btn.ghost{flex:0 0 auto;background:var(--w);color:var(--ink);border-color:var(--line)}.btn.big.ready{box-shadow:0 0 0 4px var(--acc)}.toast{font-family:var(--f);position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;pointer-events:none;background:var(--ink);color:#fff;border-radius:var(--r);padding:12px 18px;font-weight:600;font-size:15px;transition:opacity .25s,transform .25s;z-index:2147483001;max-width:calc(100vw - 32px);text-align:center}.toast.on{opacity:1;transform:translate(-50%,0)}@media (prefers-reduced-motion:reduce){*{transition:none!important}}.incl{margin:12px 2px 0;font-size:14.5px;line-height:1.45;color:rgba(0,58,104,.78)}.incl b{color:#003A68}";
/* ===== core: the binding to Ecwid, shared by the television and the phone layer =====
   Ecwid stays the executor: options, price, bag and checkout are the store's own. This file only
   (1) reads and sets Ecwid's own dropdowns the way a customer would, (2) shows Ecwid's own price,
   (3) presses Ecwid's own Add to Bag button, only when the customer asks, and (4) keeps the selection laws. */
var doc = document, win = window;
function $(s, r) { return (r || doc).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
function txt(n) { return n ? String(n.textContent || '').replace(/[\s ]+/g, ' ').replace(/^ | $/g, '') : ''; }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fire(node, type) {
  var e; try { e = new Event(type, { bubbles: true }); } catch (x) { e = doc.createEvent('Event'); e.initEvent(type, true, true); }
  node.dispatchEvent(e);
}
function inch(cm) { return (Math.round(cm / 2.54 * 10) / 10).toFixed(1); }
function isPhone() {
  var q = win.location.search, s = win.screen || {}, p = Math.min(s.width || 9999, s.height || 9999) < 600;
  if (/[?&]ddtv=tv\b/.test(q)) { p = false; } if (/[?&]ddtv=phone\b/.test(q)) { p = true; }
  return p;
}

/* ---------- the two choices the customer makes (firmness and cover are fixed for this model) ---------- */
var ROLE = { size: /^size\b/i, height: /height|depth/i };
var ROLES = ['size', 'height'];
var ORDER = [['size', 'Size'], ['height', 'Depth']];   /* the shop's own option is still called Height: the interface says Depth */
function shopRoot() {
  var c = $$('.product-details');
  for (var i = 0; i < c.length; i++) { if (c[i].offsetParent || c[i].getClientRects().length) { return c[i]; } }
  return c[0] || null;
}
function selectFor(role) {
  var r = shopRoot(); if (!r) { return null; }
  var bs = $$('.details-product-option', r);
  for (var i = 0; i < bs.length; i++) {
    var t = txt($('.details-product-option__title, .product-details-module__title, legend, label.form-control__label', bs[i])).replace(/[*\s]+$/, '');
    if (ROLE[role].test(t)) { return $('select', bs[i]); }
  }
  return null;
}
function chosenText(sel) {
  if (!sel || sel.selectedIndex < 0) { return null; }
  var o = sel.options[sel.selectedIndex], t = txt(o);
  if (!t || o.disabled || /^please\s+choose/i.test(t) || /contact\s+us/i.test(t)) { return null; }
  return t;
}
function dimsOf(t) { var m = /(\d{2,3})\s*[x×]\s*(\d{2,3})/.exec(String(t || '')); return m ? [+m[1], +m[2]].sort(function (a, b) { return a - b; }) : null; }
function cmOf(t) { var m = /(\d{1,2})\s*cm/i.exec(String(t || '')); return m ? m[1] : null; }
function shopKey(role, t) {
  if (t == null) { return null; }
  if (role === 'size') { var d = dimsOf(t); return d ? d.join('x') : null; }
  return cmOf(t);
}
function sizeKey(z) { return Math.min(z.w, z.l) + 'x' + Math.max(z.w, z.l); }
function sizeByKey(k) { for (var i = 0; i < DATA.sizes.length; i++) { if (sizeKey(DATA.sizes[i]) === k) { return DATA.sizes[i]; } } return null; }
function heightByKey(k) { for (var i = 0; i < DATA.heights.length; i++) { if (String(DATA.heights[i].cm) === String(k)) { return DATA.heights[i]; } } return null; }
function groupByKey(k) { for (var i = 0; i < DATA.groups.length; i++) { if (DATA.groups[i].key === k) { return DATA.groups[i]; } } return null; }
/* is this size / height among Ecwid's own options? (an option the store does not have is shown as not available yet) */
function shopHas(role, key) {
  var sel = selectFor(role); if (!sel) { return null; }                 /* null: the options have not arrived yet */
  for (var i = 0; i < sel.options.length; i++) { if (shopKey(role, txt(sel.options[i])) === key && !sel.options[i].disabled) { return true; } }
  return false;
}

/* ---------- reading the shop and setting the shop ---------- */
var X = { S: { size: null, height: null, bagged: '' }, busy: false, probing: false, prices: {}, hooks: {} };
function readShop() { var o = {}; ROLES.forEach(function (r) { o[r] = shopKey(r, chosenText(selectFor(r))); }); return o; }
function setShop(role, key) {
  var sel = selectFor(role); if (!sel || key == null) { return false; }
  for (var i = 0; i < sel.options.length; i++) {
    if (shopKey(role, txt(sel.options[i])) === key && !sel.options[i].disabled) {
      if (sel.selectedIndex !== i) { sel.selectedIndex = i; fire(sel, 'input'); fire(sel, 'change'); }
      return true;
    }
  }
  return false;
}
/* the customer's choice goes into the shop's dropdowns */
function push() {
  if (X.busy) { return; }
  var shop = readShop(); X.busy = true;
  try { ROLES.forEach(function (r) { var want = X.S[r]; if (want != null && want !== shop[r]) { setShop(r, want); } }); } finally { X.busy = false; }
}
/* the shop changed (the customer used Ecwid's own dropdowns): bring the selection up to date */
function pull() {
  if (X.busy) { return false; }
  var shop = readShop(), changed = false;
  ROLES.forEach(function (r) {
    if (X.S[r] === shop[r]) { return; }
    if (shop[r] != null && (r === 'size' ? !sizeByKey(shop[r]) : !heightByKey(shop[r]))) { return; }
    X.S[r] = shop[r]; changed = true;
  });
  return changed;
}

/* ---------- price: Ecwid's own text, never calculated here ---------- */
function rawPrice() { var r = shopRoot(), e = r && $('.details-product-price__value', r); return e ? e.textContent : ''; }
function priceNow() {
  var t = txt($('.details-product-price__value', shopRoot() || doc));
  return /\d/.test(t) && !/^[^\d]*0(?:[.,]0+)?[^\d]*$/.test(t.replace(/[\s ]/g, '')) ? t : '';
}
function numOf(t) { var n = parseFloat(String(t).replace(/,/g, '').replace(/[^\d.]/g, '')); return isNaN(n) ? null : n; }
function pkey(z, h) { return sizeKey(z) + '|' + h.cm; }
function priceOf(z, h) { return X.prices[pkey(z, h)] || ''; }
function remember() {
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height), p = priceNow();
  if (z && h && p) { X.prices[pkey(z, h)] = p; }
}
/* Ecwid changes its price in one step, 250 to 480 ms after a change: wait for the real change (or, for an equal price, long enough) */
var pollT = 0;
function awaitPrice(before, cb, t) {
  t = t || 0; if (t === 0 && pollT) { win.clearTimeout(pollT); }
  var raw = rawPrice(), p = priceNow();
  if (p && ((raw !== before) || t >= 900)) { remember(); pollT = 0; cb(p); return; }
  if (t < 2600) { pollT = win.setTimeout(function () { awaitPrice(before, cb, t + 40); }, 40); } else { pollT = 0; cb(''); }
}
function missingCombos(only) {
  var list = []; DATA.sizes.forEach(function (z) { if (only && z !== only) { return; } DATA.heights.forEach(function (h) { if (!X.prices[pkey(z, h)] && shopHas('size', sizeKey(z)) && shopHas('height', String(h.cm))) { list.push({ z: z, h: h }); } }); });
  return list;
}
/* Select each combination in Ecwid's own dropdowns, wait for the price to change, remember it, then put the customer's selection back.
   While it runs, Ecwid's price, its Add to Bag button and its dropdowns are blocked, so nothing wrong can be bought. */
function readCombos(list, progress, finish) {
  var ss = selectFor('size'), hs = selectFor('height'), buy = shopBagButton();
  if (X.probing || !ss || !hs || !buy || !list.length) { if (finish) { finish(false); } return; }
  X.probing = true; X.busy = true; if (X.hooks.state) { X.hooks.state(); }
  var root = shopRoot(), box = $('.details-product-price', root), blocks = [ss, hs].map(function (s0) { return s0.closest ? s0.closest('.details-product-option') : null; });
  var keep = { s: ss.selectedIndex, h: hs.selectedIndex, raw: rawPrice(), vis: box ? box.style.visibility : '', pe: buy.style.pointerEvents, bp: blocks.map(function (x) { return x ? x.style.pointerEvents : ''; }) };
  if (box) { box.style.visibility = 'hidden'; }
  buy.style.pointerEvents = 'none'; blocks.forEach(function (x) { if (x) { x.style.pointerEvents = 'none'; } });
  var i = 0;
  function idx(sel, role, key) { for (var k = 0; k < sel.options.length; k++) { if (shopKey(role, txt(sel.options[k])) === key) { return k; } } return -1; }
  function leave() {
    if (box) { box.style.visibility = keep.vis; } buy.style.pointerEvents = keep.pe;
    blocks.forEach(function (x, k) { if (x) { x.style.pointerEvents = keep.bp[k]; } });
    X.busy = false; X.probing = false; if (X.hooks.state) { X.hooks.state(); } if (finish) { finish(true); }
  }
  function restore() {
    var s2 = selectFor('size'), h2 = selectFor('height');
    try {
      if (s2 && s2.selectedIndex !== keep.s) { s2.selectedIndex = keep.s; fire(s2, 'input'); fire(s2, 'change'); }
      if (h2 && h2.selectedIndex !== keep.h) { h2.selectedIndex = keep.h; fire(h2, 'input'); fire(h2, 'change'); }
    } catch (e) { /* leave the dropdowns as they are */ }
    var w = 0;
    (function settle() { if (rawPrice() === keep.raw || w >= 1500) { leave(); return; } w += 40; win.setTimeout(settle, 40); }());
  }
  function next() {
    if (i >= list.length) { restore(); return; }
    var c = list[i++], s2 = selectFor('size'), h2 = selectFor('height');
    if (!s2 || !h2) { restore(); return; }
    var zi = idx(s2, 'size', sizeKey(c.z)), hi = idx(h2, 'height', String(c.h.cm)), before = rawPrice(), t = 0;
    if (zi < 0 || hi < 0) { next(); return; }
    s2.selectedIndex = zi; h2.selectedIndex = hi; fire(s2, 'input'); fire(s2, 'change'); fire(h2, 'input'); fire(h2, 'change');
    (function wait() {
      var raw = rawPrice(), p = priceNow();
      if ((raw !== before && p) || t >= 900) { if (p) { X.prices[pkey(c.z, c.h)] = p; } if (progress) { progress(i, list.length); } if (X.hooks.prices) { X.hooks.prices(); } next(); return; }
      t += 25; win.setTimeout(wait, 25);
    }());
  }
  next();
}

/* ---------- the bag: Ecwid's own button, pressed only by the customer ---------- */
function shopBagButton() {
  var r = shopRoot(); if (!r) { return null; }
  var b = $$('button', r);
  for (var i = 0; i < b.length; i++) { if (/add\s+to\s+(bag|cart)/i.test(txt(b[i]))) { return b[i]; } }
  return null;
}
var bagAt = 0, bagSig = '';
function addToBag() {
  push(); var b = shopBagButton(); if (!b) { return false; }
  bagAt = Date.now(); bagSig = signature(); b.click(); return true;
}
function onCart() { if (!bagAt || Date.now() - bagAt > 15000) { return; } bagAt = 0; X.S.bagged = bagSig; if (X.hooks.draw) { X.hooks.draw(); } }
function openCart() { if (win.Ecwid && win.Ecwid.openPage) { win.Ecwid.openPage('cart'); } }

/* ---------- the selection laws (one place; the television and the phone layer share them) ----------
   1. The bag button is READY only when every choice is made: size and depth. Firmness (Medium) and cover (100% cotton) are fixed and have nothing to select.
   2. Once complete, changing a choice keeps the button active for the new configuration.
   3. When the bag holds exactly this configuration, the same button is Go to Checkout (it opens the shopping cart, Ecwid's own).
   4. Whatever is missing is named: "Still to choose: Size · Depth".
   5. A coupon or code is entered in the cart, never here. */
function missing() { return ORDER.filter(function (o) { return X.S[o[0]] == null; }).map(function (o) { return o[1]; }); }
function complete() { return missing().length === 0; }
function signature() { return complete() ? ORDER.map(function (o) { return o[0] + '=' + X.S[o[0]]; }).join('|') : ''; }
function bagFace() {
  if (!complete()) { return { face: 'add', enabled: false, ready: false, text: 'Add to Bag', guide: 'Still to choose: ' + missing().join(' · ') }; }
  if (X.S.bagged && X.S.bagged === signature()) { return { face: 'checkout', enabled: true, ready: false, text: 'Go to Checkout', guide: 'Added to your bag' }; }
  return { face: 'add', enabled: true, ready: true, text: 'Add to Bag', guide: X.S.bagged ? 'Your new choice is not in the bag yet: Add to Bag again' : 'Ready to order: size and depth chosen' };
}
function chosenLabel(role) {
  if (role === 'size') { var z = X.S.size && sizeByKey(X.S.size); return z ? (groupByKey(z.g).name + ' · ' + z.w + ' × ' + z.l + ' cm') : null; }
  var h = X.S.height && heightByKey(X.S.height); return h ? h.cm + ' cm' : null;
}

/* ---------- the picture carousels of the standard description ([data-dbg]): dots, mouse drag, arrow keys ---------- */
var reduce = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
function initCarousel(fig) {
  if (fig.__dbg) { return; }
  var v = $('.dbj-car__v', fig), slides = $$('.dbj-car__s', fig), d = $('.dbj-car__d', fig);
  if (!v || slides.length < 2 || !d) { return; }
  fig.__dbg = 1;
  var dots = [], raf = 0;
  function cur() { return Math.max(0, Math.min(slides.length - 1, Math.round(v.scrollLeft / (v.clientWidth || 1)))); }
  function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); var x = i * v.clientWidth; try { v.scrollTo({ left: x, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { v.scrollLeft = x; } }
  function mark() { var n = cur(); dots.forEach(function (b, k) { b.className = 'dbj-car__dot' + (k === n ? ' on' : ''); b.setAttribute('aria-current', k === n ? 'true' : 'false'); }); }
  slides.forEach(function (s, i) {
    var b = doc.createElement('button'); b.className = 'dbj-car__dot'; b.type = 'button'; b.setAttribute('aria-label', 'Picture ' + (i + 1) + ' of ' + slides.length);
    b.addEventListener('click', function () { go(i); }); d.appendChild(b); dots.push(b);
  });
  v.addEventListener('scroll', function () { if (!raf) { raf = win.requestAnimationFrame(function () { raf = 0; mark(); }); } }, { passive: true });
  v.addEventListener('keydown', function (e) { var k = e.key || e.keyCode; if (k === 'ArrowRight' || k === 39) { e.preventDefault(); go(cur() + 1); } else if (k === 'ArrowLeft' || k === 37) { e.preventDefault(); go(cur() - 1); } });
  var drag = null;
  v.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) { return; } drag = { x: e.clientX, s: v.scrollLeft, moved: false }; });
  win.addEventListener('pointermove', function (e) { if (!drag) { return; } var dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; v.className += ' dbj-drag'; } if (drag.moved) { v.scrollLeft = drag.s - dx; } });
  win.addEventListener('pointerup', function () { if (!drag) { return; } var was = drag.moved; drag = null; if (was) { v.className = v.className.replace(/\s*dbj-drag/, ''); go(cur()); } });
  fig.className += ' dbj-car--on'; mark();
}
function carousels() { $$('[data-dbg]').forEach(initCarousel); }

/* ===== the phone layer: a guided configuration over Ecwid's own options (same scheme as Botanic TV's phone layer) =====
   Phones only, listed products only. The shop's own dropdowns, price, bag and checkout stay in the page and do the work. */
var CFG = win.__DDPHONE_CONFIG = win.__DDPHONE_CONFIG || {};
CFG.products = CFG.products || [DATA.product.id];
var PH = null, ctaBtn = null, ctaNote = null, shopWatch = null, lastPid = null, booted = false;
function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function pageStylePhone() {
  if (!doc.getElementById('ddp-font')) {
    var f = doc.createElement('style'); f.id = 'ddp-font';
    f.textContent = '@font-face{font-family:"DBJChillax";font-style:normal;font-weight:400;font-display:swap;src:url(' + FONT400 + ') format("woff2")}@font-face{font-family:"DBJChillax";font-style:normal;font-weight:600;font-display:swap;src:url(' + FONT600 + ') format("woff2")}' +
      '#ddp-cta{display:block;width:100%;margin:14px 0 6px;padding:16px 18px;border:2px solid #003A68;border-radius:16px;background:#006591;color:#fff;font:600 18px/1.2 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif;text-align:center;cursor:pointer;box-shadow:0 0 0 3px #91E8F1}' +
      '#ddp-cta:active{background:#003A68}' +
      '#ddp-note{margin:0 0 12px;padding:10px 14px;border:1px solid rgba(0,58,104,.18);border-radius:12px;background:#E4E8F0;color:#003A68;font:400 14.5px/1.45 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif}' +
      '#ddp-note b{font-weight:600}' +
      'html.ddp-lock,html.ddp-lock body{overflow:hidden!important}';
    (doc.head || doc.documentElement).appendChild(f);
  }
}
/* the guided steps */
var PSTEPS = ['size', 'depth', 'review'];
function phSheetHtml(U) {
  var idx = PSTEPS.indexOf(U.step) + 1, body = '', foot = '';
  if (U.step === 'size') {
    body = '<h2 class="q">How big is the cot or bed?</h2><p class="sub">Choose your size. Every size in centimetres and in inches.</p>' + DATA.groups.map(function (g) {
      return '<p class="lab2">' + esc(g.name) + ' · ' + esc(g.sub) + '</p><div class="cards">' + DATA.sizes.filter(function (z) { return z.g === g.key; }).map(function (z) {
        var on = X.S.size === sizeKey(z), av = shopHas('size', sizeKey(z));
        return '<button type="button" class="card sz' + (on ? ' on' : '') + '" data-pick-size="' + sizeKey(z) + '"' + (av === false ? ' disabled' : '') + '><span class="cm">' + z.w + ' × ' + z.l + ' cm</span><span class="in">' + inch(z.w) + ' × ' + inch(z.l) + ' in</span></button>'; }).join('') + '</div>'; }).join('');
    body += '<p class="need">Cot and bed sizes differ between manufacturers: measure the <b>inside</b> of the frame.</p>';
    foot = '<button type="button" class="btn" data-go="depth"' + (X.S.size ? '' : ' disabled') + '>Continue to Depth</button>';
  } else if (U.step === 'depth') {
    var z = X.S.size && sizeByKey(X.S.size);
    body = '<h2 class="q">How deep should it be?</h2><p class="sub">Two depths. Length and width stay the same: check the maximum mattress depth your cot or bed allows.</p><div class="cards">' + DATA.heights.map(function (h) {
      var p = z ? priceOf(z, h) : '', on = X.S.height === String(h.cm), av = shopHas('height', String(h.cm));
      return '<button type="button" class="card hc' + (on ? ' on' : '') + '" data-pick-height="' + h.cm + '"' + (av === false ? ' disabled' : '') + '><span class="cm">' + h.cm + ' cm</span><span class="in">' + inch(h.cm) + ' in</span>' + (p ? '<span class="pr">' + esc(p) + '</span>' : '') + '<span class="dsc">' + esc(h.desc) + '</span></button>'; }).join('') + '</div>';
    foot = '<button type="button" class="btn ghost" data-go="size">Back</button><button type="button" class="btn" data-go="review"' + (X.S.height ? '' : ' disabled') + '>Review</button>';
  } else {
    var fc = bagFace();
    body = '<h2 class="q">Review your order</h2><ul class="rv">' + ORDER.map(function (o) { return '<li><span>' + o[1] + '</span><b>' + (chosenLabel(o[0]) ? esc(chosenLabel(o[0])) : '<i>Not chosen yet</i>') + '</b></li>'; }).join('') +
      '</ul><p class="bp s incl">Every mattress is <b>Medium</b> firmness with a <b>100% cotton</b> cover. Both are explained in the description; there is nothing to select.</p><div class="rvp"><span>Price</span><b>' + (complete() && priceNow() ? esc(priceNow()) : '<i>Choose a size and a depth</i>') + '</b></div><p class="guide">' + esc(fc.guide) + '</p>';
    foot = '<button type="button" class="btn ghost" data-go="depth">Back</button><button type="button" class="btn big' + (fc.ready ? ' ready' : '') + '" data-bag="1"' + (fc.enabled ? '' : ' disabled') + '>' + fc.text + '</button>';
  }
  return '<header class="hd"><div class="hdt"><span class="stp">Step ' + idx + ' of 3</span><b>' + esc(DATA.product.name) + '</b></div><button type="button" class="x" data-close aria-label="Close the configuration">×</button></header><div class="prog">' + PSTEPS.map(function (s, i) { return '<i class="' + (i < idx ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="bd">' + body + '</div><footer class="ft">' + foot + '</footer>';
}
function phoneCss() { return PH_CSS; }
function openSheet() {
  if (PH) { return; }
  pageStylePhone();
  var hostEl = doc.createElement('div'); hostEl.id = 'ddp-sheet'; doc.body.appendChild(hostEl);
  var R = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;
  R.innerHTML = '<style>' + phoneCss() + '</style><div class="sheet" role="dialog" aria-modal="true" aria-label="Configure your mattress"></div><div class="toast" role="status"></div>';
  var U = { step: nextStepP() }, sh = $('.sheet', R), toast = $('.toast', R);
  function draw() { sh.innerHTML = phSheetHtml(U); var b = $('.bd', sh); if (b && draw.keep != null) { b.scrollTop = draw.keep; } }
  function say(t) { toast.textContent = t; toast.classList.add('on'); win.clearTimeout(say.t); say.t = win.setTimeout(function () { toast.classList.remove('on'); }, 2600); }
  function close() { doc.documentElement.classList.remove('ddp-lock'); if (hostEl.parentNode) { hostEl.parentNode.removeChild(hostEl); } PH = null; X.hooks.draw = null; X.hooks.prices = null; X.hooks.state = null; refreshCta(); }
  sh.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t || t.disabled) { return; } var v;
    if (t.hasAttribute('data-close')) { close(); return; }
    if ((v = t.getAttribute('data-go'))) { U.step = v; draw.keep = 0; draw(); return; }
    if ((v = t.getAttribute('data-pick-size'))) {
      var prev = rawPrice(); X.S.size = v; push(); draw();
      if (X.S.height) { awaitPrice(prev, function () { draw(); readOthers(); }); }
      return;
    }
    if ((v = t.getAttribute('data-pick-height'))) { var prev2 = rawPrice(); X.S.height = v; push(); draw(); awaitPrice(prev2, function () { draw(); readOthers(); }); return; }
    if (t.hasAttribute('data-bag')) { var f = bagFace(); if (f.face === 'checkout') { close(); openCart(); } else if (f.enabled) { if (addToBag()) { say('Added to your bag'); } else { say('The store\'s bag button is not ready yet. Please try again.'); } } draw(); return; }
  });
  function readOthers() { var z = X.S.size && sizeByKey(X.S.size); if (!z) { return; } var miss = missingCombos(z); if (miss.length) { win.setTimeout(function () { readCombos(miss, null, function () { draw(); }); }, 150); } }
  X.hooks.draw = draw; X.hooks.prices = draw; X.hooks.state = draw;
  doc.documentElement.classList.add('ddp-lock'); PH = { host: hostEl, draw: draw, close: close }; draw();
  var fb = $('.btn:not(:disabled)', sh); if (fb && fb.focus) { try { fb.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
}
function nextStepP() { return X.S.size == null ? 'size' : X.S.height == null ? 'depth' : 'review'; }
/* the button and its one-line status, in the shop's own options block */
function refreshCta() {
  if (!ctaBtn || !ctaNote) { return; }
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height), fc = bagFace();
  ctaBtn.textContent = complete() ? 'Review your mattress' : (X.S.size || X.S.height ? 'Continue configuring' : 'Configure Your Mattress');
  ctaNote.innerHTML = complete() ? '<b>' + esc(chosenLabel('size')) + ' · ' + esc(chosenLabel('height')) + '</b>' + (priceNow() ? ' · ' + esc(priceNow()) : '') : esc(fc.guide);
}
function mountCta() {
  if (ctaBtn && doc.body.contains(ctaBtn)) { return true; }
  var r = shopRoot(); if (!r) { return false; }
  var first = $('.details-product-option', r); if (!first || !first.parentNode) { return false; }
  pageStylePhone();
  ctaBtn = doc.createElement('button'); ctaBtn.type = 'button'; ctaBtn.id = 'ddp-cta'; ctaBtn.onclick = openSheet;
  ctaNote = doc.createElement('p'); ctaNote.id = 'ddp-note'; ctaNote.setAttribute('aria-live', 'polite');
  first.parentNode.insertBefore(ctaNote, first); first.parentNode.insertBefore(ctaBtn, ctaNote);
  doc.documentElement.classList.add('ddtv-phone'); pull(); refreshCta();
  shopWatch = setInterval(function () { if (!doc.hidden && !X.busy) { if (pull() && PH) { PH.draw(); } refreshCta(); carousels(); } }, 1200);
  doc.addEventListener('change', function (e) { if (!X.busy && e.target && e.target.closest && e.target.closest('.details-product-option')) { win.setTimeout(function () { pull(); refreshCta(); if (PH) { PH.draw(); } }, 120); } }, true);
  carousels(); return true;
}
function unmountPhone() { if (PH) { PH.close(); } if (ctaBtn && ctaBtn.parentNode) { ctaBtn.parentNode.removeChild(ctaBtn); } if (ctaNote && ctaNote.parentNode) { ctaNote.parentNode.removeChild(ctaNote); } ctaBtn = null; ctaNote = null; clearInterval(shopWatch); doc.documentElement.classList.remove('ddtv-phone'); }
function onPage(page) {
  var pid = page && page.type === 'PRODUCT' ? Number(page.productId) : null;
  if (pid != null && CFG.products.indexOf(pid) >= 0) { if (lastPid !== pid) { unmountPhone(); } var tries = 0; (function go() { if (!mountCta() && ++tries < 60) { setTimeout(go, 150); } })(); lastPid = pid; }
  else { unmountPhone(); lastPid = null; }
}
function currentProductId() { var n = $('[class*="ecwid-productBrowser-ProductPage-"]'), m = n && /ecwid-productBrowser-ProductPage-(\d+)/.exec(String(n.className)); return m ? Number(m[1]) : null; }
function boot() {
  if (booted) { return; } booted = true; var E = win.Ecwid;
  E.OnPageLoaded.add(onPage); if (E.OnCartChanged) { E.OnCartChanged.add(onCart); }
  var id = currentProductId(); if (id == null && win.__ddtvPage) { id = Number(win.__ddtvPage.productId); }
  if (id != null) { onPage({ type: 'PRODUCT', productId: id }); }
}
(function waitEcwid(n) { if (win.Ecwid && win.Ecwid.OnPageLoaded) { boot(); return; } if (n < 300) { setTimeout(function () { waitEcwid(n + 1); }, 100); } })(0);

}());
