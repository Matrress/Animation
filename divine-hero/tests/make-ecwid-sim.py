#!/usr/bin/env python3
"""Instant Site imitation for testing the hero in its real context (see screenshots 2026-10-02):
 - announcement/promo bar in normal flow (49px)
 - TRANSPARENT header (logo row + 9-item menu + Email Us / search / account / bag) laid OVER the first section
 - the hero inside an `ins-tile ins-tile--custom-code` wrapper
 - the next section (dark photo band) right after it
 - "hostile" global CSS of the kind a site builder ships (`.ins-tile button`, `.ins-tile a`, `.ins-tile nav`)
 - optional: strip every style="" attribute from the pasted code (editor sanitiser)

usage: make-ecwid-sim.py <section.html> <out.html> [--strip-style] [--solid-header]
"""
import sys, re, pathlib
src, out = sys.argv[1], sys.argv[2]
strip = '--strip-style' in sys.argv
solid = '--solid-header' in sys.argv
code = pathlib.Path(src).read_text()
if strip:
    code = re.sub(r'(<(?:section|button|div|a|span|nav)\b[^>]*?)\s+style="[^"]*"', r'\1', code)
menu = ''.join(f'<a href="#">{t}</a>' for t in ['Mattresses', 'Toppers', 'Pillows', 'Quality &amp; Benefits', 'Firmness &amp; Comfort', 'Custom Sizes &amp; Shapes', 'Terms &amp; Conditions', 'Explore', 'About Us'])
hdr_pos = 'position:relative' if solid else 'position:absolute;top:49px;left:0;right:0'
hdr_bg = 'background:#fff' if solid else 'background:transparent'
page = f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Instant Site imitation</title>
<style>
body{{margin:0;font-family:Comfortaa,system-ui,sans-serif;background:#fff;color:#234}}
.ins-tile{{position:relative;display:block}}
.ins-tile--announcement{{height:49px;display:flex;align-items:center;justify-content:center;gap:14px;background:#b9d0de;font:15px system-ui;color:#234}}
.ins-tile--announcement a{{border:1px solid #234;border-radius:20px;padding:6px 18px;color:#234;text-decoration:none}}
.ins-tile--header{{{hdr_pos};{hdr_bg};z-index:20;padding:6px 3% 10px}}
.ins-header__top{{display:flex;justify-content:center;align-items:center;height:72px;position:relative}}
.ins-header__logo{{width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 40% 45%,#2b6f86,#123 70%);}}
.ins-header__tools{{position:absolute;right:0;top:12px;display:flex;gap:22px;align-items:center}}
.ins-header__tools a{{border:1px solid #234;border-radius:20px;padding:6px 26px;color:#234;text-decoration:none;font-size:15px}}.ins-header__tools a.ico{{border:0;padding:0;line-height:0}}
.ins-header__tools i{{display:inline-block;width:22px;height:22px;border:2px solid #234;border-radius:50%}}
.ins-header__menu{{display:flex;justify-content:space-between;gap:12px;margin-top:14px;font-size:clamp(11px,1.15vw,17px)}}
.ins-header__menu a{{color:#234;text-decoration:none;white-space:nowrap}}
@media (max-width:1050px){{.ins-header__menu{{display:none}}.ins-header__top{{height:58px}}.ins-header__tools a{{display:none}}}}
/* typical builder resets that collide with embedded code */
.ins-tile button{{position:relative;display:inline-block;margin:0 4px;font:inherit}}
.ins-tile a{{position:relative;display:inline-block}}
.ins-tile nav{{display:block}}
.next{{height:1600px;background:linear-gradient(#3a2a20 0,#3a2a20 60px,#efe7dc 60px)}}
</style></head><body>
<div class="ins-tile ins-tile--announcement">-10% OFF + 2 FREE Natural Latex Pillows - "Summer Moves On" <a href="#">Contact Us</a></div>
<div class="ins-tile ins-tile--header"><div class="ins-header__top"><div class="ins-header__logo"></div><div class="ins-header__tools"><a href="#">Email Us</a><a class="ico" href="#" aria-label="Search"><svg width="22" height="22"><circle cx="11" cy="11" r="9" fill="none" stroke="#234" stroke-width="2"/></svg></a><a class="ico" href="#" aria-label="Account"><svg width="22" height="22"><circle cx="11" cy="11" r="9" fill="none" stroke="#234" stroke-width="2"/></svg></a><a class="ico" href="#" aria-label="Bag"><svg width="22" height="22"><rect x="3" y="5" width="16" height="15" fill="none" stroke="#234" stroke-width="2"/></svg></a></div></div><nav class="ins-header__menu">{menu}</nav></div>
<div class="ins-tile ins-tile--custom-code">
{code}
</div>
<div class="ins-tile next next-section"></div>
</body></html>'''
pathlib.Path(out).write_text(page)
