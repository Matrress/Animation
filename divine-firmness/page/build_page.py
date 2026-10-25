#!/usr/bin/env python3
"""/firmnesses: a backup copy of section 04's styles, loaded by section 07.

Section 04 carries its styles inline (it must sit before section 05, whose script measures the layout).
Twice it went missing from the published page, and without it the monitor and the cards fall apart.
So section 07, which is small and has never gone missing, also loads the same styles from jsDelivr.
With 04 present nothing changes (the rules are identical); with 04 missing the page still looks right.

Source of truth: divine-firmness/page/firmnesses.css. It must equal the inline styles of section 04
(the page-check banner style excluded); this script refuses to build when they differ.
Writes release/1.0.0-inline/07_Markup_distribution.html.
Without --sha the link is relative (firmnesses.css) for local tests; with --sha it is pinned on jsDelivr.
"""
import re, os, sys, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
REL = os.path.join(os.path.dirname(HERE), 'release', '1.0.0-inline')
CSS = os.path.join(HERE, 'firmnesses.css')
P04 = os.path.join(REL, '04_Markup_zone_texts.html')
P07 = os.path.join(REL, '07_Markup_distribution.html')
LINK_RE = re.compile(r'^<link rel="stylesheet" href="[^"]*firmnesses\.css">')

def must(c, m):
    if not c: sys.exit('BUILD ERROR: ' + m)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sha'); a = ap.parse_args()
    css = open(CSS, encoding='utf8').read()
    s04 = open(P04, encoding='utf8').read()
    inline = '\n'.join(b for b in re.findall(r'<style[^>]*>(.*?)</style>', s04, re.S) if '.dnchk' not in b[:60])
    must(inline == css, 'section 04 inline styles and page/firmnesses.css differ: change both together')
    s07 = LINK_RE.sub('', open(P07, encoding='utf8').read())
    must('id="dn-wd"' in s07, '07 changed shape')
    if a.sha:
        must(re.fullmatch(r'[0-9a-f]{40}', a.sha), 'sha must be 40 hex')
        href = 'https://cdn.jsdelivr.net/gh/Matrress/Animation@%s/divine-firmness/page/firmnesses.css' % a.sha
    else:
        href = 'firmnesses.css'
    new07 = '<link rel="stylesheet" href="%s">' % href + s07
    open(P07, 'w', encoding='utf8').write(new07)
    print('04: %d chars (unchanged, styles match firmnesses.css)' % len(s04))
    print('07: %d chars | \\xNN: %d | %s' % (len(new07), len(re.findall(r'\\x[0-9a-fA-F]{2}', new07)), href))

if __name__ == '__main__':
    main()
