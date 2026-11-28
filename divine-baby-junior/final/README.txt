Dunlop Baby & Junior · final technical version (description 1.5.0 · Experience 2.5.0 · site loader 1.0)

TWO places, nothing else is uploaded anywhere:

1-PRODUCT-DESCRIPTION.html
   Ecwid admin → Catalog → Products → Dunlop Baby & Junior (876311857) → Description → <> (source) → select all, paste this whole file, Save.
   It is the product's HTML only (the hidden pointer, the style and the page). Leave the product disabled.

2-SITE-LOADER.js   (or 2-SITE-LOADER-with-script-tags.html if the field wants <script> tags)
   Ecwid admin → Instant Site → Settings → the site-wide custom JavaScript / custom code field (4000 characters) → REPLACE the current code with this file.
   It is ONE loader for the whole site. It contains, unchanged in behaviour: Divine Collection 3.13.2-configB, the Baby & Junior selector,
   and the Experience loader v1.5 of Botanic TV (the same mechanism also serves Baby & Junior). Botanic TV keeps its own files on media.divinedunlop.com/ddtv/.
   Before replacing, copy the current site code into a text file as a backup.

Test: open the product with ?ddtv=test. Everyone else sees the standard view. ?ddtv=off switches the television off.
Public launch (only after approval): add 876311857 to LIVE at the top of the loader, and enable the product.
