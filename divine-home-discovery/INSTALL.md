# Install
**0.2.0** (visual polish): replace the code of the same tile with `ecwid/section-0.2.0-pinned.html`. **0.1.0** (`section-0.1.0-pinned.html`) is the rollback.

Placement: Homepage → the existing hidden **"Navigation & Custom Code"** custom-code tile (between the Hero tile "HEADER Code" and the benefits tile "Latex Mattress Benefits"). Replace its code with `ecwid/section-<v>-pinned.html`. Leave the Hero tile alone.
One section, ~17k characters (Ecwid is documented/observed to truncate near 20k; if the editor ever cuts it, the `<script>` at the end is lost and the section simply stays a complete static page).
Rollback: restore the previous code of that tile (it is hidden today, so nothing visible changes) or hide the tile.
