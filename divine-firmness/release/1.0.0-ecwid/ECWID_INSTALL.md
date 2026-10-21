# Firmness Navigator: Ecwid installation (option B, 3 sections)

Pinned commit: `0b95079439e9224ea0cd610dbe1ab7e0c94ad804`. The files on jsDelivr are immutable. The loader carries SRI hashes, so a changed or tampered file will not run.

## Sections (page /firmnesses, above the old firmness sections)
1. `ecwid_1_markup_intro_visual.html` : intro text and the visual (real text in the HTML, indexable)
2. `ecwid_2_markup_module.html`       : the selection module and the contact card
3. `ecwid_3_ai_seo_layer.html`        : rules table, FAQ and JSON-LD (Organization, WebPage, FAQPage, ItemList) in plain HTML
4. `ecwid_4_loader.html`              : loads `firmness.css` and the three JS files (engine, module, visual) in order

Homepage section 1 is not touched.

## Safe order
1. Copy the current firmness sections of the page (backup), keep them off the page but saved.
2. Make a hidden test page, paste 1, 2, 3, 4, check iPad, phone, desktop.
3. Only after approval: replace on /firmnesses and Publish once.
4. Rollback: paste the backup sections back and Publish.

## Contact form
`ENDPOINT` in `firmness-module.js` is empty. With it empty the form opens the visitor's email app (mailto) and shows the email and phone. Set a form endpoint (POST, JSON) to send straight from the page; on any failure the form falls back to the email app.
Recipient in the mail fallback: divinedreams.d@gmail.com. Visible contact card: +44 7491 965733, support@divinedunlop.com.

## Verified
Loader plus files tested in a three-section page at 1366 px and 820 px: engine, module and visual start, 7 vertebrae drawn, Extra Firm shows Orthopaedic Coconut Coir first. SRI passes. No console errors.

## AI and search visibility
- The live robots.txt already allows GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, anthropic-ai, PerplexityBot, Google-Extended, cohere-ai and Diffbot.
- Ecwid renders custom-code HTML into the page itself, so section 1, 2 and 3 text (visible text, FAQ, rules table, JSON-LD) is readable without running scripts. Results are calculated by script; the rules table states the same rules in plain text.
- FAQ text in JSON-LD is identical to the visible FAQ (tested).
- Shareable selection links (validated, anything invalid is ignored): `/firmnesses?kg=110&cm=180&need=balance&pain=no`
  Parameters: kg 30-250, cm 120-230, product (mattress, topper), need (support, comfort, balance, hard), pain (yes, no), position, current, budget.
- `window.DDFT_API` and the event `ddn:state` expose the same result to scripts and browsing agents.
- Not possible on Ecwid: files at the site root (`/llms.txt` returns 404). The page title and meta description are set in the Ecwid page SEO settings, not in this code.
