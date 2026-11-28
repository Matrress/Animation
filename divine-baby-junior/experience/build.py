#!/usr/bin/env python3
"""Build the Baby & Junior Experience (the Botanic TV scheme for this model).

  python3 experience/build.py

Writes in experience/dist/:
  baby-tv-<20 hex>.js       the television: Optimised Preview + Standard Product View (desktop and tablets)
  baby-phone-<20 hex>.js    the phone layer: guided configuration over Ecwid's own options
  pointer.html              the hidden pointer element for the product description (#ddtv-pointer)
  loader-baby.js            an alternative loader that serves the two files from jsDelivr (the shop's own loader serves them from media.divinedunlop.com/ddtv/)
and experience/harness/*.html: a page imitating Ecwid's product page, used by the tests.
File names follow the shop's loader rule: ^[a-z][a-z0-9-]{0,45}-[0-9a-f]{20}\\.js$
"""
import json, hashlib, re, pathlib, sys

root = pathlib.Path(__file__).resolve().parent
top = root.parent
src = root / "src"
dist = root / "dist"
dist.mkdir(exist_ok=True)
(root / "harness").mkdir(exist_ok=True)

CDN = "https://cdn.jsdelivr.net/gh/Matrress/Animation@"
FONT_COMMIT = "57479ca18f8e6bab02e2a4aa0ec4f0cf82578fad"
FONT400 = f"{CDN}{FONT_COMMIT}/divine-hero/release/1.17.1/assets/chillax-400.woff2"
FONT600 = f"{CDN}{FONT_COMMIT}/divine-hero/release/1.17.1/assets/chillax-600.woff2"
ASSET = {"v1": ("c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63", "release/0.1.0/assets/"), "v2": ("b0c161a67ae725da9db1cfeaa2eae2b82d7e9b0f", "release/0.2.0/assets/"), "v3": ("7ec5ad8ae12e1e16be82f8928cdb1fcc6f78126c", "experience/assets/")}
LOGO = f"{CDN}9d681f860c9dae7dd866236d6824f413443b8512/divine-home-discovery/assets/bio-dunlop.svg"


def asset(v, name):
    c, d = ASSET[v]
    return f"{CDN}{c}/divine-baby-junior/{d}{name}"


def build_data(local=False):
    data = json.loads((src / "data.json").read_text())
    def u(v, name):
        return (f"../../{ASSET[v][1]}{name}") if local else asset(v, name)
    closed = "dunlop-baby-junior-latex-mattress-cotton-cover-closed"
    opened = "dunlop-baby-junior-latex-core-cotton-cover-open"
    data["images"] = {
        "closed": {"src": u("v1", f"{closed}-1600.webp"), "srcset": f"{u('v1', closed + '-800.webp')} 800w, {u('v1', closed + '-1600.webp')} 1600w"},
        "open": {"src": u("v1", f"{opened}-1600.webp"), "srcset": f"{u('v1', opened + '-800.webp')} 800w, {u('v1', opened + '-1600.webp')} 1600w"},
        "latex": {"src": u("v2", "dunlop-baby-junior-natural-latex-core-ventilation-detail-690.webp")},
        "quilt": {"src": u("v2", "dunlop-baby-junior-cotton-cover-quilting-detail-660.webp")},
        "zip": {"src": u("v2", "dunlop-baby-junior-cotton-cover-zip-detail-340.webp")},
    }
    data["videos"]["origin"]["poster"] = u("v3", "dunlop-natural-latex-origin-film-poster-960.webp")
    data["videos"]["vent"]["poster"] = u("v3", "dunlop-natural-latex-ventilation-film-poster-960.webp")
    data["logo"] = (str(top / "src/assets/bio-dunlop.svg").replace(str(top), "../..")) if local else LOGO
    data["product"]["heroHead"] = "One piece of natural latex"
    return data


def bio_test_data(data):
    """Test only: the same engine pointed at Bio Comfort's real options (SIZE and DEPTH), to prove the binding on the real Ecwid page."""
    data["product"]["id"] = 644897086
    data["groups"] = [{"key": "cot", "name": "Single sizes", "sub": "Test"}, {"key": "junior", "name": "Double sizes", "sub": "Test"}]
    data["sizes"] = [{"w": 80, "l": 200, "g": "cot"}, {"w": 90, "l": 200, "g": "cot"}, {"w": 100, "l": 200, "g": "cot"}, {"w": 120, "l": 200, "g": "junior"}, {"w": 140, "l": 200, "g": "junior"}]
    data["heights"] = [{"cm": 23, "name": "23 cm", "sub": "", "desc": "Test."}, {"cm": 26, "name": "26 cm", "sub": "", "desc": "Test."}]
    return data


def min_css(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"\s*\n\s*", "", s)
    s = re.sub(r"\s*([{};,>])\s*", r"\1", s)
    return s


def bundle(kind, local=False, bio=False):
    data = build_data(local)
    if bio:
        data = bio_test_data(data)
    core = (src / "core.js").read_text()
    parts = [core]
    consts = {"DATA": json.dumps(data, ensure_ascii=False, separators=(",", ":")), "FONT400": json.dumps(FONT400), "FONT600": json.dumps(FONT600)}
    if kind == "tv":
        css = min_css((src / "tv.css").read_text())
        html = (src / "tv.html").read_text().strip().replace("\n", "")
        consts["TV_CSS"] = json.dumps(css)
        consts["TV_MARKUP"] = json.dumps(html)
        parts += [(src / "tv.js").read_text(), (src / "page.js").read_text()]
        guard, title = "__DDBABY_TV", "the television (Optimised Preview and Standard Product View)"
    else:
        consts["PH_CSS"] = json.dumps(min_css((src / "phone.css").read_text()))
        parts += [(src / "phone.js").read_text()]
        guard, title = "__DDBABY_PHONE", "the phone layer (guided configuration)"
    head = (f"/* Divine DunlopDreams · Baby & Junior Experience: {title}.\n"
            "   Same scheme as Botanic TV, for the Dunlop Baby & Junior mattress. Ecwid stays the executor: options, price, bag and checkout are the shop's own.\n"
            "   Acts only on the listed product; ?ddtv=off switches it off. Built by experience/build.py. */\n")
    var = "".join(f"var {k} = {v};\n" for k, v in consts.items())
    body = (f"(function () {{\n  'use strict';\n  if (/[?&]ddtv=off\\b/.test(location.search) || window.{guard}) {{ return; }}\n  window.{guard} = 1;\n"
            + var + "\n".join(parts) + "\n}());\n")
    return head + body


def write_dist():
    out = {}
    for kind, name in (("tv", "baby-tv"), ("phone", "baby-phone")):
        code = bundle(kind)
        h = hashlib.sha256(code.encode()).hexdigest()[:20]
        fn = f"{name}-{h}.js"
        for old in dist.glob(f"{name}-*.js"):
            old.unlink()
        (dist / fn).write_text(code)
        out[kind] = fn
        # local-image twin for the tests (never shipped)
        (root / "harness" / f"{name}.local.js").write_text(bundle(kind, local=True))
        (root / "harness" / f"{name}.bio.js").write_text(bundle(kind, local=False, bio=True))
    pointer = (f'<div id="ddtv-pointer" hidden aria-label="ddtv-pointer-test" data-ddtv-v="1" data-ddtv-model="baby" data-ddtv-channel="test" '
               f'data-ddtv-product="876311857" data-ddtv-tv="{out["tv"]}" data-ddtv-phone="{out["phone"]}"></div>')
    (dist / "pointer.html").write_text(pointer + "\n")
    return out, pointer


def harness(out):
    """A page imitating Ecwid's product page: the options, the price (with Ecwid's 300 ms delay), the bag button, and the events."""
    proto = (top / "preview/prototype.html").read_text()
    css = re.findall(r"<style>(.*?)</style>", proto, re.S)[-1]
    desc = re.search(r"<!--DESC-->(.*?)<!--/DESC-->", proto, re.S).group(1)
    desc = desc.replace('src="../', 'src="../../').replace('srcset="../', 'srcset="../../').replace(", ../", ", ../../")
    desc = re.sub(r"(srcset=\"[^\"]*\")", lambda m: m.group(1).replace(",../", ",../../"), desc)
    sizes = [("Baby Cot Size", 60, 110), ("Baby Cot Size", 60, 120), ("Baby Cot Size", 70, 130), ("Baby Cot Size", 70, 140), ("Junior Size", 70, 160), ("Junior Size", 80, 160), ("Junior Size", 80, 180), ("Junior Size", 80, 200)]
    inch = lambda cm: f"{round(cm / 2.54 * 10) / 10:.1f}"
    s_opts = "".join(f"<option>{n}: {w} × {l} cm ({inch(w)}″ × {inch(l)}″)</option>" for n, w, l in sizes)
    h_opts = "".join(f"<option>{h} cm ({inch(h)}″)</option>" for h in (10, 14))
    pointer = (dist / "pointer.html").read_text().strip()
    shell = f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ecwid product page imitation (tests only)</title>
<style>
body{{margin:0;font-family:system-ui,sans-serif;color:#222;background:#fff}}
.shopbar{{background:#ddd;padding:14px;text-align:center}}
.product-details{{max-width:1120px;margin:0 auto;padding:16px;display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;grid-template-areas:"top top" "title title" "desc side"}}
.product-details__top{{grid-area:top;color:#888}}.product-details__product-title{{grid-area:title;font-size:28px;margin:0}}
.product-details__sidebar{{grid-area:side}}.product-details__description{{grid-area:desc;min-width:0}}
.details-product-option{{margin:0 0 14px}}.details-product-option__title{{font-weight:700;font-size:12px;letter-spacing:.1em;margin-bottom:6px}}
.form-control__select{{width:100%;padding:12px;border:1px solid #bbb;border-radius:8px;font-size:15px}}
.details-product-price__value{{font-size:24px;font-weight:700;margin:10px 0}}
.form-control__button{{display:block;width:100%;padding:14px;border:0;border-radius:8px;background:#333;color:#fff;font-size:16px;cursor:pointer}}
@media (max-width:860px){{.product-details{{grid-template-columns:minmax(0,1fr);grid-template-areas:"top" "title" "side" "desc"}}}}
</style>
<style>{css}</style>
</head><body>
<div class="shopbar">Shop header (imitation)</div>
<div class="ecwid-productBrowser-ProductPage-876311857" id="ecwid-root">
 <div class="product-details">
  <div class="product-details__top">Home / Store / Latex Mattresses Collection</div>
  <h1 class="product-details__product-title">Dunlop 100% Natural Baby &amp; Junior Mattress</h1>
  <div class="product-details__sidebar">
    <div class="details-product-option details-product-option--Size"><div class="details-product-option__title">Size</div><div class="product-details-module__content"><div class="form-control"><select aria-label="Size" class="form-control__select"><option>Please choose</option>{s_opts}</select></div></div></div>
    <div class="details-product-option details-product-option--Height"><div class="details-product-option__title">Height</div><div class="product-details-module__content"><div class="form-control"><select aria-label="Height" class="form-control__select"><option>Please choose</option>{h_opts}</select></div></div></div>
    <div class="details-product-price"><div class="details-product-price__value" id="proto-price">£0</div></div>
    <button type="button" class="form-control__button" id="proto-add"><span>Add to Bag</span></button>
    <div class="details-product-share">Share this product</div>
  </div>
  <div class="product-details__description">{pointer}
{desc}
  </div>
 </div>
</div>
<script>
/* Ecwid imitation: the page type events, the cart event, and a price that changes 300 ms after an option changes */
(function(){{var T={{'60x110':[239,279],'60x120':[255.78,295.78],'70x130':[269,309],'70x140':[289,329],'70x160':[309,369],'80x160':[359,419],'80x180':[409,469],'80x200':[469,529]}};
var s=document.querySelector('.details-product-option--Size select'),h=document.querySelector('.details-product-option--Height select'),p=document.getElementById('proto-price');
function upd(){{var m=/(\\d+) × (\\d+) cm/.exec(s.value),hh=/^(\\d+) cm/.exec(h.value);setTimeout(function(){{var r=m&&T[m[1]+'x'+m[2]];p.textContent=(r&&hh)?'£'+r[hh[1]==='10'?0:1]:'£0';}},300);}}
s.addEventListener('change',upd);h.addEventListener('change',upd);
var pl=[],cl=[];window.__bagClicks=0;window.__cartOpened=0;
window.Ecwid={{OnPageLoaded:{{add:function(f){{pl.push(f);setTimeout(function(){{f({{type:'PRODUCT',productId:876311857}});}},50);}}}},OnProductSelectedOptionsChanged:{{add:function(){{}}}},OnCartChanged:{{add:function(f){{cl.push(f);}}}},openPage:function(x){{window.__cartOpened++;}}}};
document.getElementById('proto-add').addEventListener('click',function(){{window.__bagClicks++;setTimeout(function(){{cl.forEach(function(f){{f({{}});}});}},200);}});}})();
</script>
<script>window.__DDTVX_CONFIG={{products:[876311857]}};window.__DDPHONE_CONFIG={{products:[876311857]}};</script>
<script src="BUNDLE"></script>
</body></html>
"""
    (root / "harness" / "tv.html").write_text(shell.replace("BUNDLE", "baby-tv.local.js"))
    (root / "harness" / "phone.html").write_text(shell.replace("BUNDLE", "baby-phone.local.js"))


LOADER = """/* Divine DunlopDreams · Baby & Junior Experience loader (an alternative to the shop's own loader: it serves the two files from jsDelivr).
   Acts only on a product page that carries its own #ddtv-pointer for that product id. ?ddtv=off: nothing. ?ddtv=test: test opt-in for channel "test". */
(function (w, d) {
  var B = '%(base)s', NAME = /^[a-z][a-z0-9-]{0,45}-[0-9a-f]{20}\\.js$/, q = w.location.search, seen = {};
  if (/[?&]ddtv=off\\b/.test(q) || w.__ddbabyLoader) { return; } w.__ddbabyLoader = 1;
  try { if (/[?&]ddtv=test\\b/.test(q)) { w.sessionStorage.setItem('ddtvTest', '1'); } } catch (e) { /* no storage */ }
  function testOn() { try { return w.sessionStorage.getItem('ddtvTest') === '1'; } catch (e) { return false; } }
  function phone() { var s = w.screen || {}, p = Math.min(s.width || 9999, s.height || 9999) < 600; if (/[?&]ddtv=tv\\b/.test(q)) { p = false; } if (/[?&]ddtv=phone\\b/.test(q)) { p = true; } return p; }
  function use(e) {
    var a = function (k) { return e.getAttribute('data-ddtv-' + k) || ''; }, c = a('channel'), f = phone() ? a('phone') : a('tv');
    if (a('v') !== '1' || a('model') !== 'baby' || !NAME.test(f)) { return; }
    if (!((c === 'test' && testOn()) || c === 'live')) { return; }
    if (seen[f]) { return; } seen[f] = 1;
    var s = d.createElement('script'); s.async = false; s.src = B + f; d.head.appendChild(s);
  }
  function look(n) { var e = d.getElementById('ddtv-pointer'); if (e) { use(e); return; } if (n < 200) { setTimeout(function () { look(n + 1); }, 150); } }
  (function wait(n) { if (w.Ecwid && w.Ecwid.OnPageLoaded) { w.Ecwid.OnPageLoaded.add(function (g) { if (g && g.type === 'PRODUCT') { look(0); } }); look(0); return; } if (n < 300) { setTimeout(function () { wait(n + 1); }, 100); } }(0));
}(window, document));
"""


if __name__ == "__main__":
    out, pointer = write_dist()
    harness(out)
    base_commit = sys.argv[1] if len(sys.argv) > 1 else "COMMIT"
    (dist / "loader-baby.js").write_text(LOADER % {"base": f"{CDN}{base_commit}/divine-baby-junior/experience/dist/"})
    # the Standard Product View description (the approved look, 1.2.0) with the hidden pointer for the Experience in front of it
    base_desc = top / "ecwid/description-1.2.0.html"
    if base_desc.exists():
        (top / "ecwid/description-2.2.0.html").write_text(pointer + "\n" + base_desc.read_text())
    sizes = {k: (dist / v).stat().st_size for k, v in out.items()}
    print(json.dumps(out), sizes)
