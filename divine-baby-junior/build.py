#!/usr/bin/env python3
"""Build the Baby & Junior description from one source.

  preview/prototype.html        full page mock-up inside an imitation of the Ecwid product page,
                                review notes visible, local images
  ecwid/description-<v>.html    paste-ready Ecwid Description (<> mode), review notes removed,
                                CSS inlined and scoped to .dbj, images and fonts on pinned jsDelivr URLs

Usage: python3 build.py
"""
import re, pathlib

VERSION = "0.9.0"
JS_COMMIT = "596f85cfb9d2d8e1a01fd026d78cb05ce9e00fe5"   # commit that holds release/0.9.0/dbs.js
CDN = "https://cdn.jsdelivr.net/gh/Matrress/Animation@"
FONT_COMMIT = "57479ca18f8e6bab02e2a4aa0ec4f0cf82578fad"    # Chillax files already used by Hero 1.17.1 and Collection
FONT400 = f"{CDN}{FONT_COMMIT}/divine-hero/release/1.17.1/assets/chillax-400.woff2"
FONT600 = f"{CDN}{FONT_COMMIT}/divine-hero/release/1.17.1/assets/chillax-600.woff2"

# Each asset folder is pinned to the commit that added it.
ASSETS = {
    "v1": dict(commit="c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63", dir="release/0.1.0/assets/"),
    "v2": dict(commit="b0c161a67ae725da9db1cfeaa2eae2b82d7e9b0f", dir="release/0.2.0/assets/"),
}

# key: (asset set, file stem, widths available, width, height of the largest file, sizes attribute)
BIG = "(min-width: 1120px) 1080px, 100vw"
IMAGES = {
    "closed": ("v1", "dunlop-baby-junior-latex-mattress-cotton-cover-closed", [800, 1600], 1600, 800, BIG),
    "open":   ("v1", "dunlop-baby-junior-latex-core-cotton-cover-open", [800, 1600], 1600, 800, BIG),
    "latex":  ("v2", "dunlop-baby-junior-natural-latex-core-ventilation-detail", [690], 690, 350, "(min-width: 960px) 700px, 100vw"),
    "quilt":  ("v2", "dunlop-baby-junior-cotton-cover-quilting-detail", [660], 660, 300, "(min-width: 960px) 360px, 100vw"),
    "zip":    ("v2", "dunlop-baby-junior-cotton-cover-zip-detail", [340], 340, 220, "(min-width: 960px) 360px, 100vw"),
    "stack":  ("v2", "dunlop-baby-junior-heights-10-12-14-cm-stack", [700, 1060], 1060, 450, BIG),
}

# Bio Dunlop logo: the file already used by the 7 zones section, pinned to the commit that holds it (a copy is in src/assets)
LOGO_REMOTE = f"{CDN}9d681f860c9dae7dd866236d6824f413443b8512/divine-home-discovery/assets/bio-dunlop.svg"
LOGO_LOCAL = "../src/assets/bio-dunlop.svg"

root = pathlib.Path(__file__).parent
css_src = (root / "src/dbj.css").read_text()
html_src = (root / "src/description.html").read_text()


def asset_base(setname: str, remote: bool) -> str:
    a = ASSETS[setname]
    if remote:
        return f"{CDN}{a['commit']}/divine-baby-junior/{a['dir']}"
    return f"../{a['dir']}"


def build_css(src: str, keep_review: bool) -> str:
    if not keep_review:
        src = re.sub(r"/\*R\*/.*?/\*/R\*/", "", src, flags=re.S)
    css = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    css = css.replace("{{FONT400}}", FONT400).replace("{{FONT600}}", FONT600)

    def harden(m):
        sel, body = m.group(1), m.group(2)
        s0 = sel.strip()
        if s0.startswith("@font-face") or s0 in ("from", "to") or s0.endswith("%"):  # !important is invalid in @keyframes
            decls = [d.strip() for d in body.split(";") if d.strip()]
        else:
            decls = []
            for d in body.split(";"):
                d = d.strip()
                if not d:
                    continue
                decls.append(d if d.endswith("!important") else d + "!important")
        return sel.strip() + "{" + ";".join(decls) + "}"

    css = re.sub(r"([^{}]+)\{([^{}]*)\}", harden, css)
    css = re.sub(r"\s*\n\s*", "", css)
    css = re.sub(r"\s*([{};,>])\s*", r"\1", css)
    css = css.replace("!important!important", "!important")
    return css


def build_html(src: str, remote: bool, keep_review: bool) -> str:
    def img(m):
        key, alt, mode = m.group(1), m.group(2), m.group(3)
        setname, stem, widths, w, h, sizes = IMAGES[key]
        base = asset_base(setname, remote)
        eager = mode == "eager"
        prio = ' fetchpriority="high"' if eager else ""
        srcset = ", ".join(f"{base}{stem}-{x}.webp {x}w" for x in widths)
        return (f'<img src="{base}{stem}-{widths[-1]}.webp" srcset="{srcset}" sizes="{sizes}" '
                f'width="{w}" height="{h}" alt="{alt}" '
                f'loading="{"eager" if eager else "lazy"}" decoding="async"{prio}>')

    out = re.sub(r"\{\{IMG:(\w+)\|([^|]+)\|(\w+)\}\}", img, src)
    out = out.replace("{{LOGO}}", LOGO_REMOTE if remote else LOGO_LOCAL)
    if keep_review:
        out = out.replace("<!--R-->", "").replace("<!--/R-->", "")
    else:
        out = re.sub(r"<!--R-->.*?<!--/R-->", "", out, flags=re.S)
        out = re.sub(r"<!--(?!\s*Divine).*?-->", "", out, flags=re.S)
        out = re.sub(r"\n\s*\n+", "\n", out)
        out = re.sub(r">\s+<", "><", out)
    assert "{{" not in out
    return out.strip()


css_prod = build_css(css_src, keep_review=False)
css = build_css(css_src, keep_review=True)

# ---------- production (Ecwid Description, <> mode) ----------
prod_html = build_html(html_src, remote=True, keep_review=False)
assert "dbj-rv" not in prod_html and "REVIEW" not in prod_html and "dbj-rv" not in css_prod
assert "coir" not in prod_html.lower() and "coconut" not in prod_html.lower() and "coir" not in css_prod.lower()
# palette guard: only the six Bio Comfort colours may appear as hex values (shades come from rgba of the same colours)
ALLOWED = {"003A68", "006591", "B2E3FB", "91E8F1", "E4E8F0", "FFFFFF", "FFF"}
used = {h.upper().lstrip("#") for h in re.findall(r"#[0-9A-Fa-f]{3,8}\b", css_prod)}
assert used <= ALLOWED, f"colours outside the palette: {sorted(used - ALLOWED)}"
prod = (f"<!-- Divine DunlopDreams · Dunlop Baby & Junior description {VERSION} · scoped to .dbj · no JavaScript -->"
        f"<style>{css_prod}</style>{prod_html}")
(root / "ecwid").mkdir(exist_ok=True)
import shutil
(root / f"release/{VERSION}").mkdir(parents=True, exist_ok=True)
shutil.copy(root / "src/dbs.js", root / f"release/{VERSION}/dbs.js")
loader_js = ("(function(d,u){if(window.__dbsLoader)return;window.__dbsLoader=1;var s=d.createElement('script');s.src=u;s.defer=true;d.head.appendChild(s)})"
             f"(document,'{CDN}{JS_COMMIT}/divine-baby-junior/release/{VERSION}/dbs.js');")
(root / f"ecwid/loader-{VERSION}.js").write_text(loader_js + "\n")
(root / f"ecwid/loader-{VERSION}.html").write_text(f"<!-- Divine DunlopDreams selector {VERSION} loader (site-wide custom code). Loads dbs.js, which acts only on [data-dbs] blocks. -->\n<script>{loader_js}</script>\n")
(root / f"ecwid/description-{VERSION}.html").write_text(prod + "\n")

# ---------- prototype (imitation of the Ecwid product page) ----------
proto_html = build_html(html_src, remote=False, keep_review=True)
v1 = asset_base("v1", remote=False)
g_closed = f"{v1}{IMAGES['closed'][1]}-800.webp"
g_open = f"{v1}{IMAGES['open'][1]}-800.webp"
g_heights = f"{v1}dunlop-baby-junior-latex-mattress-heights-10-12-14-cm-800.webp"
size_vals = [("Baby Cot", 60, 110), ("Baby Cot", 60, 120), ("Baby Cot", 70, 130), ("Baby Cot", 70, 140),
             ("Junior", 70, 160), ("Junior", 80, 160), ("Junior", 80, 180), ("Junior", 80, 200)]
inch = lambda cm: f"{round(cm / 2.54 * 10) / 10:.1f}"
sizes_opts = "".join(f"<option>{n} · {w} × {l} cm · {inch(w)} × {inch(l)} in</option>" for n, w, l in size_vals)
height_opts = "".join(f"<option>{h} cm · {inch(h)} in</option>" for h in (10, 12, 14))
shell = f"""<!doctype html>
<html lang="en-GB" id="ecwid_html">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Baby &amp; Junior Prototype</title>
<style>
/* Simulated hostile Ecwid storefront rules: the description must look the same with them. */
html#ecwid_html body#ecwid_body h2, html#ecwid_html body#ecwid_body h3{{font-family:Georgia,serif;text-transform:uppercase;letter-spacing:.2em;text-align:center;color:#c00;margin:40px 0}}
html#ecwid_html body#ecwid_body p{{line-height:2.4;margin:0 0 30px;font-size:13px}}
html#ecwid_html body#ecwid_body ul li{{list-style:disc;margin-left:20px}}
html#ecwid_html body#ecwid_body img{{border:4px solid #000;border-radius:0}}
/* Prototype shell: an imitation of the Ecwid product page (gallery and description on the left, options on the right,
   the way Bio Comfort is laid out). It is not part of the Ecwid code. */
body{{margin:0;background:#fff;font-family:system-ui,sans-serif;color:#003A68}}
.proto-bar{{background:#006591;color:#fff;font:600 12.5px/1.3 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:10px 16px;text-align:center}}
.proto-pdp{{max-width:1180px;margin:0 auto;padding:32px 24px 8px;display:grid;gap:28px 48px;grid-template-columns:minmax(0,1fr);grid-template-areas:"gal" "buy" "desc"}}
.proto-gallery{{grid-area:gal;display:grid;gap:10px}}
.proto-main{{background:#fff;border:1px solid rgba(0,58,104,.18);border-radius:16px;overflow:hidden}}
.proto-main img{{display:block;width:100%;height:auto;border:0!important}}
.proto-thumbs{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}}
.proto-thumbs div{{background:#fff;border:1px solid rgba(0,58,104,.18);border-radius:10px;overflow:hidden}}
.proto-thumbs div:first-child{{border-color:#003A68}}
.proto-thumbs img{{display:block;width:100%;height:auto;border:0!important}}
.proto-buy{{grid-area:buy}}
.proto-buy h1{{font:600 26px/1.2 "DBJChillax",system-ui,sans-serif;color:#003A68;margin:0 0 8px}}
.proto-price{{font:600 14px/1.4 system-ui;color:rgba(0,58,104,.78);letter-spacing:.12em;text-transform:uppercase;margin:0 0 20px}}
.details-product-option{{margin:0 0 16px}}
.details-product-option__title{{font:600 12px/1 system-ui;letter-spacing:.14em;text-transform:uppercase;color:#006591;margin-bottom:8px}}
.form-control__select{{width:100%;appearance:auto;padding:13px 12px;border:1px solid rgba(0,58,104,.18);border-radius:10px;font:500 15px/1.2 system-ui;background:#fff;color:#003A68}}
.details-product-price__value{{font:600 22px/1.2 system-ui;color:#003A68;margin:0 0 14px}}
.proto-cta{{display:block;width:100%;border:0;cursor:pointer;text-align:center;background:#003A68;color:#fff;border-radius:10px;padding:15px;font:600 14px/1 system-ui;letter-spacing:.12em;text-transform:uppercase}}
.proto-note{{font:400 13px/1.5 system-ui;color:rgba(0,58,104,.78);margin-top:10px}}
.proto-desc{{grid-area:desc}}
.proto-dh{{font:600 16px/1.3 system-ui;color:#003A68;margin:8px 0 14px;letter-spacing:0;text-transform:none;text-align:left}}
.product-details__description{{padding:0}}
@media (min-width:860px){{.proto-pdp{{grid-template-columns:minmax(0,730px) minmax(0,1fr);grid-template-areas:"gal buy" "desc buy"}}.proto-buy{{align-self:start;position:sticky;top:24px}}}}
</style>
<style>{css}</style>
</head>
<body id="ecwid_body">
<div class="proto-bar">Prototype · unpublished draft · dashed boxes are review items, removed from the Ecwid code</div>
<div class="proto-pdp" aria-label="Simulated Ecwid product page (not part of the description)">
  <div class="proto-gallery">
    <div class="proto-main"><img src="{g_closed}" width="800" height="400" alt=""></div>
    <div class="proto-thumbs"><div><img src="{g_closed}" width="800" height="400" alt=""></div><div><img src="{g_open}" width="800" height="400" alt=""></div><div><img src="{g_heights}" width="800" height="400" alt=""></div></div>
  </div>
  <div class="proto-buy">
    <h1>Dunlop Baby &amp; Junior 100% Natural Latex Mattress</h1>
    <p class="proto-price">Price set in Ecwid</p>
    <div class="details-product-option details-product-option--SIZE"><div class="details-product-option__title">SIZE</div><div class="product-details-module__content"><div class="form-control"><select aria-label="SIZE" class="form-control__select"><option>Please choose</option>{sizes_opts}</select></div></div></div>
    <div class="details-product-option details-product-option--HEIGHT"><div class="details-product-option__title">HEIGHT</div><div class="product-details-module__content"><div class="form-control"><select aria-label="HEIGHT" class="form-control__select"><option>Please choose</option>{height_opts}</select></div></div></div>
    <div class="details-product-price__value" id="proto-price">£0</div>
    <button type="button" class="form-control__button proto-cta" id="proto-add">Add to Bag</button>
    <p class="proto-note">This block imitates Ecwid's own gallery and dropdown options. It is not in the description code: prices, options and checkout stay with Ecwid.</p>
  </div>
  <div class="proto-desc">
    <div class="proto-dh">Product Details</div>
<!--DESC-->
<div class="product-details__description">
{proto_html}
</div>
<!--/DESC-->
  </div>
</div>
<script src="../release/{VERSION}/dbs.js"></script>
<script>
/* prototype only: imitates how Ecwid reacts to its option dropdowns (price) */
(function(){{var s=document.querySelector('.details-product-option--SIZE select'),h=document.querySelector('.details-product-option--HEIGHT select'),p=document.getElementById('proto-price');
function upd(){{var m=/(\\d+) × (\\d+) cm/.exec(s.value),k=/(\\d+) cm/.exec(h.value);p.textContent=(m&&k)?'£'+Math.round(280+m[1]*m[2]/30+k[1]*8):'£0';}}
s.addEventListener('change',upd);h.addEventListener('change',upd);
document.getElementById('proto-add').addEventListener('click',function(){{this.setAttribute('data-clicked',String((+this.getAttribute('data-clicked')||0)+1));}});}})();
</script>
</body>
</html>
"""
(root / "preview").mkdir(exist_ok=True)
(root / "preview/prototype.html").write_text(shell)

print(f"css {len(css_prod):,} chars · production description {len(prod):,} chars · prototype {len(shell):,} chars")
