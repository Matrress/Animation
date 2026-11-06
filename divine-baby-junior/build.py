#!/usr/bin/env python3
"""Build the Baby & Junior description from one source.

  preview/prototype.html        full page mock-up, review notes visible, local images
  ecwid/description-<v>.html    paste-ready Ecwid Description (<> mode), review notes removed,
                                CSS inlined and scoped to .dbj, images and fonts on pinned jsDelivr URLs

Usage: python3 build.py
"""
import re, pathlib

VERSION = "0.2.0"
ASSET_VERSION = "0.1.0"                                     # images did not change
ASSET_COMMIT = "c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63"   # commit that added release/0.1.0/assets
FONT_COMMIT = "57479ca18f8e6bab02e2a4aa0ec4f0cf82578fad"    # Chillax files already used by Hero 1.17.1 and Collection
CDN = "https://cdn.jsdelivr.net/gh/Matrress/Animation@"
FONT400 = f"{CDN}{FONT_COMMIT}/divine-hero/release/1.17.1/assets/chillax-400.woff2"
FONT600 = f"{CDN}{FONT_COMMIT}/divine-hero/release/1.17.1/assets/chillax-600.woff2"
REMOTE_ASSETS = f"{CDN}{ASSET_COMMIT}/divine-baby-junior/release/{ASSET_VERSION}/assets/"
LOCAL_ASSETS = f"../release/{ASSET_VERSION}/assets/"

IMAGES = {  # key: (file stem, width, height of the 1600 px file)
    "closed":  ("dunlop-baby-junior-latex-mattress-cotton-cover-closed", 1600, 800),
    "open":    ("dunlop-baby-junior-latex-core-cotton-cover-open", 1600, 800),
    "heights": ("dunlop-baby-junior-latex-mattress-heights-10-12-14-cm", 1600, 800),
}

root = pathlib.Path(__file__).parent
css_src = (root / "src/dbj.css").read_text()
html_src = (root / "src/description.html").read_text()


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


def build_html(src: str, assets: str, keep_review: bool) -> str:
    def img(m):
        key, alt, mode = m.group(1), m.group(2), m.group(3)
        stem, w, h = IMAGES[key]
        eager = mode == "eager"
        prio = ' fetchpriority="high"' if eager else ""
        return (f'<img src="{assets}{stem}-1600.webp" '
                f'srcset="{assets}{stem}-800.webp 800w, {assets}{stem}-1600.webp 1600w" '
                f'sizes="(min-width: 1120px) 1080px, 100vw" '
                f'width="{w}" height="{h}" alt="{alt}" '
                f'loading="{"eager" if eager else "lazy"}" decoding="async"'
                f'{prio}>')

    out = re.sub(r"\{\{IMG:(\w+)\|([^|]+)\|(\w+)\}\}", img, src)
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
prod_html = build_html(html_src, REMOTE_ASSETS, keep_review=False)
assert "dbj-rv" not in prod_html and "REVIEW" not in prod_html and "dbj-rv" not in css_prod
prod = (f"<!-- Divine DunlopDreams · Dunlop Baby & Junior description {VERSION} · scoped to .dbj · no JavaScript -->"
        f"<style>{css_prod}</style>{prod_html}")
(root / "ecwid").mkdir(exist_ok=True)
(root / f"ecwid/description-{VERSION}.html").write_text(prod + "\n")

# ---------- prototype (full page mock-up) ----------
proto_html = build_html(html_src, LOCAL_ASSETS, keep_review=True)
closed = IMAGES["closed"][0]
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
/* Prototype shell (not part of the Ecwid code) */
body{{margin:0;background:#fff;font-family:system-ui,sans-serif;color:#0B1726}}
.proto-bar{{background:#003A68;color:#fff;font:600 12.5px/1.3 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:10px 16px;text-align:center}}
.proto-pdp{{max-width:1180px;margin:0 auto;padding:32px 24px 8px;display:grid;gap:32px;grid-template-columns:1fr}}
.proto-gallery{{background:#F4F6FA;border-radius:22px;overflow:hidden}}
.proto-gallery img{{display:block;width:100%;height:auto;border:0!important}}
.proto-buy h1{{font:600 28px/1.2 "DBJChillax",system-ui,sans-serif;color:#003A68;margin:0 0 8px}}
.proto-price{{font:600 15px/1.4 system-ui;color:#34465C;letter-spacing:.12em;text-transform:uppercase;margin:0 0 20px}}
.proto-opt{{margin:0 0 18px}}
.proto-opt b{{display:block;font:600 12.5px/1 system-ui;letter-spacing:.14em;text-transform:uppercase;color:#006591;margin-bottom:8px}}
.proto-opt span{{display:inline-block;margin:0 6px 6px 0;padding:9px 12px;border:1px solid #D3DAE6;border-radius:10px;font:500 14px/1 system-ui}}
.proto-opt span.on{{border-color:#003A68;box-shadow:inset 0 0 0 1px #003A68}}
.proto-cta{{display:block;text-align:center;background:#006591;color:#fff;border-radius:12px;padding:15px;font:600 14px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;opacity:.55}}
.proto-note{{font:400 13px/1.5 system-ui;color:#34465C;margin-top:10px}}
@media (min-width:860px){{.proto-pdp{{grid-template-columns:1.2fr 1fr;align-items:start}}}}
</style>
<style>{css}</style>
</head>
<body id="ecwid_body">
<div class="proto-bar">Prototype · unpublished draft · amber boxes are review items, removed from the Ecwid code</div>
<div class="proto-pdp" aria-label="Simulated Ecwid product header (not part of the description)">
  <div class="proto-gallery"><img src="{LOCAL_ASSETS}{closed}-1600.webp" width="1600" height="800" alt=""></div>
  <div class="proto-buy">
    <h1>Dunlop Baby &amp; Junior 100% Natural Latex Mattress</h1>
    <p class="proto-price">Price set in Ecwid</p>
    <div class="proto-opt"><b>Range</b><span class="on">Baby Cot</span><span>Junior</span></div>
    <div class="proto-opt"><b>Size</b><span>60 × 110</span><span class="on">60 × 120</span><span>70 × 130</span><span>70 × 140</span></div>
    <div class="proto-opt"><b>Height</b><span class="on">10 cm</span><span>12 cm</span><span>14 cm</span></div>
    <span class="proto-cta">Add to bag</span>
    <p class="proto-note">This block imitates Ecwid's own product options. It is not in the description code: prices, options and checkout stay with Ecwid.</p>
  </div>
</div>
{proto_html}
</body>
</html>
"""
(root / "preview").mkdir(exist_ok=True)
(root / "preview/prototype.html").write_text(shell)

print(f"css {len(css_prod):,} chars · production description {len(prod):,} chars · prototype {len(shell):,} chars")
