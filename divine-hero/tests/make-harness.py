#!/usr/bin/env python3
"""Wrap an Ecwid-side embed in a page that imitates the Instant Site context.

header=0  -> the approved v26-preview conditions (no store header above the hero)
header=50 -> a 50px store-header stand-in, matching the --ddh-bars:50px the embed declares
"""
import sys, re, pathlib
src, out, header = sys.argv[1], sys.argv[2], int(sys.argv[3])
embed = pathlib.Path(src).read_text()
bars = re.search(r'--ddh-bars:(\d+)px', embed)
if header == 0:
    embed = embed.replace('--ddh-bars:50px', '--ddh-bars:0px')
hdr = (f'<header class="sim-header" style="height:{header}px">Store header stand-in ({header}px)</header>' if header else '')
page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hero test harness</title><meta name="robots" content="noindex">
<style>
body{{margin:0;background:#d6f3fb;font-family:system-ui,sans-serif;color:#1f3f4a}}
.sim-header{{display:flex;align-items:center;padding:0 24px;background:#fff;font:600 14px system-ui;color:#555;box-sizing:border-box;border-bottom:1px solid #ddd}}
.next-section{{min-height:1600px;background:#d6f3fb;padding:24px 5%;font:600 20px/1.4 system-ui;color:#2f5d57}}
</style></head><body>
{hdr}
<main>
{embed}
<section class="next-section">Next homepage section</section>
</main></body></html>'''
pathlib.Path(out).write_text(page)
