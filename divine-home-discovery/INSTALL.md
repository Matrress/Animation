# Install

**0.7.0 (System module): TWO tiles.**
1. Navigator tile: replace the code of the existing Home Discovery tile with `ecwid/section-0.7.0-pinned.html` (adds the "What Makes Our Latex Sleep System Different?" row with the "Explore the System" button, between the choice and the needs; the Bio logo window was kept in all four places).
2. System tile: add a NEW custom-code tile **directly below** the navigator tile and paste `ecwid/system-0.7.0-pinned.html` into it.
The tiles are joined by one id (`#ddhd-system`) and by the navigator's mattress tab (the story's last button returns there). The navigator can be installed alone: its "Explore the System" button then hides itself instead of leading nowhere.
Rollback: delete the System tile and restore the previous navigator code (`section-0.6.0-pinned.html`).
**0.3.0** (comfort pass): replace the code of the same tile with `ecwid/section-0.3.0-pinned.html` (full code, not a 3-URL swap: the markup changed). **0.2.0** (visual polish): replace the code of the same tile with `ecwid/section-0.2.0-pinned.html`. **0.1.0** (`section-0.1.0-pinned.html`) is the rollback.

Placement: Homepage → the existing hidden **"Navigation & Custom Code"** custom-code tile (between the Hero tile "HEADER Code" and the benefits tile "Latex Mattress Benefits"). Replace its code with `ecwid/section-<v>-pinned.html`. Leave the Hero tile alone.
One section, ~17k characters (Ecwid is documented/observed to truncate near 20k; if the editor ever cuts it, the `<script>` at the end is lost and the section simply stays a complete static page).
Rollback: restore the previous code of that tile (it is hidden today, so nothing visible changes) or hide the tile.
