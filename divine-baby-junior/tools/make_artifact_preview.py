#!/usr/bin/env python3
"""Build a self-contained preview page (production description inside an imitation of the Ecwid product page).

  python3 tools/make_artifact_preview.py OUT_DIR

Writes OUT_DIR/baby-junior-preview.html and OUT_DIR/assets/*.webp. Chillax is embedded as data URIs
(the viewer's CSP only allows fonts from data: or Google Fonts). The font files are read from
OUT_DIR/chillax-400.woff2 and chillax-600.woff2 (download them from the jsDelivr URLs in build.py first).
"""
import re, sys, base64, shutil, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); (out / "assets").mkdir(parents=True, exist_ok=True)
for d in ("release/0.1.0/assets", "release/0.2.0/assets"):
    for f in (root / d).glob("*.webp"):
        shutil.copy(f, out / "assets" / f.name)

version = re.search(r'VERSION = "([^"]+)"', (root / "build.py").read_text()).group(1)
prod = (root / f"ecwid/description-{version}.html").read_text()
proto = (root / "preview/prototype.html").read_text()
b64 = lambda p: base64.b64encode(open(p, "rb").read()).decode()
f400 = "data:font/woff2;base64," + b64(out / "chillax-400.woff2")
f600 = "data:font/woff2;base64," + b64(out / "chillax-600.woff2")
prod = re.sub(r"https://cdn\.jsdelivr\.net/gh/Matrress/Animation@[0-9a-f]{40}/divine-hero/release/1\.17\.1/assets/chillax-400\.woff2", f400, prod)
prod = re.sub(r"https://cdn\.jsdelivr\.net/gh/Matrress/Animation@[0-9a-f]{40}/divine-hero/release/1\.17\.1/assets/chillax-600\.woff2", f600, prod)
prod = re.sub(r"https://cdn\.jsdelivr\.net/gh/Matrress/Animation@[0-9a-f]{40}/divine-baby-junior/release/0\.[12]\.0/assets/", "assets/", prod)
assert "jsdelivr" not in prod
css = re.search(r"/\* Prototype shell.*?\*/\n(.*?)</style>", proto, re.S).group(1)
pdp = re.search(r'(<div class="proto-bar">.*?)<div class="product-details__description">', proto, re.S).group(1)
pdp = pdp.replace("../release/0.1.0/assets/", "assets/").replace(
    "Prototype · unpublished draft · amber boxes are review items, removed from the Ecwid code",
    "Preview · unpublished draft · not live · this is the code that would go into the Ecwid description")
page = f"""<title>Baby &amp; Junior Preview</title>
<style>
body{{background:#fff;color:#0B1726}}
@font-face{{font-family:"DBJChillax";font-style:normal;font-weight:400;font-display:swap;src:url({f400}) format("woff2")}}
@font-face{{font-family:"DBJChillax";font-style:normal;font-weight:600;font-display:swap;src:url({f600}) format("woff2")}}
{css}
</style>
{pdp}<div class="product-details__description">
{prod}
</div>
"""
page = page.replace('body{margin:0;background:#fff;font-family:system-ui,sans-serif;color:#0B1726}', "")
(out / "baby-junior-preview.html").write_text(page)
print(version, len(page) // 1024, "KB")
