# Firmness Navigator: Ecwid installation (option B, 3 sections)

Pinned commit: `fc5d586b68ddb37420fbfc9a3d3c9a7cf6a9a8ac`. The files on jsDelivr are immutable. The loader carries SRI hashes, so a changed or tampered file will not run.

## Sections (page /firmnesses, above the old firmness sections)
1. `ecwid_1_markup_intro_visual.html` : intro text and the visual (real text in the HTML, indexable)
2. `ecwid_2_markup_module.html`       : the selection module and the contact card
3. `ecwid_3_loader.html`             : loads `firmness.css` and the three JS files (engine, module, visual) in order

Homepage section 1 is not touched.

## Safe order
1. Copy the current firmness sections of the page (backup), keep them off the page but saved.
2. Make a hidden test page, paste 1, 2, 3, check iPad, phone, desktop.
3. Only after approval: replace on /firmnesses and Publish once.
4. Rollback: paste the backup sections back and Publish.

## Contact form
`ENDPOINT` in `firmness-module.js` is empty. With it empty the form opens the visitor's email app (mailto) and shows the email and phone. Set a form endpoint (POST, JSON) to send straight from the page; on any failure the form falls back to the email app.
Recipient in the mail fallback: divinedreams.d@gmail.com. Visible contact card: +44 7491 965733, support@divinedunlop.com.

## Verified
Loader plus files tested in a three-section page at 1366 px and 820 px: engine, module and visual start, 7 vertebrae drawn, Extra Firm shows Orthopaedic Coconut Coir first. SRI passes. No console errors.
