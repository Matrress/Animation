#!/usr/bin/env python3
"""Self-contained preview of the Baby & Junior Experience (an imitation of the Ecwid product page with the television mounted).

  python3 tools/make_experience_preview.py OUT_DIR

Reads experience/harness/tv.html and the local-image bundle, inlines the script, the images and the font as data URIs
(the viewer's CSP only allows fonts from data:), and writes OUT_DIR/baby-experience-preview.html.
The Chillax font files are read from OUT_DIR/chillax-400.woff2 and chillax-600.woff2."""
import base64, mimetypes, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
harness = root / 'experience/harness'
page = (harness / 'tv.html').read_text()
bundle = (harness / 'baby-tv.local.js').read_text()
b64 = lambda p: base64.b64encode(pathlib.Path(p).read_bytes()).decode()
mime = lambda p: mimetypes.guess_type(str(p))[0] or ('image/webp' if str(p).endswith('.webp') else 'application/octet-stream')


def inline_paths(s):
    def rep(m):
        rel = m.group(0)
        p = (harness / rel).resolve()
        if not p.exists():
            return rel
        mt = 'image/svg+xml' if p.suffix == '.svg' else 'image/webp'
        return f'data:{mt};base64,{b64(p)}'
    return re.sub(r'\.\./\.\./(?:release|src)/[A-Za-z0-9_./-]+\.(?:webp|svg)', rep, s)


f400 = 'data:font/woff2;base64,' + b64(out / 'chillax-400.woff2')
f600 = 'data:font/woff2;base64,' + b64(out / 'chillax-600.woff2')
font_url = re.compile(r'https://cdn\.jsdelivr\.net/gh/Matrress/Animation@[0-9a-f]{40}/divine-hero/release/1\.17\.1/assets/chillax-(400|600)\.woff2')
fonts = lambda s: font_url.sub(lambda m: f400 if m.group(1) == '400' else f600, s)

page = fonts(inline_paths(page))
bundle = fonts(inline_paths(bundle))
page = page.replace('<script src="baby-tv.local.js"></script>', '<script>' + bundle.replace('</script>', '<\\/script>') + '</script>')
page = page.replace('Shop header (imitation)', 'Preview · an imitation of the Ecwid product page · nothing is published')
page = page.replace('<title>Ecwid product page imitation (tests only)</title>', '<title>Baby Experience Preview</title>')
assert 'jsdelivr' not in page and 'src="baby-tv' not in page
(out / 'baby-experience-preview.html').write_text(page)
print(out / 'baby-experience-preview.html', len(page) // 1024, 'KB')
