# Read-only checks against the PUBLIC live store

These scripts open the public Botanic product page (831592302) in a LOCAL browser. They never log in, never
save, never click **Add to Bag**, and change nothing in the store. They exist to compare our engine with the real
Ecwid DOM and runtime.

What they are NOT: a test of the test product 876405767 (it is disabled and not reachable publicly). Where a
script injects the engine into the live page, product 831592302 is added to `productIds` **only in the injected
copy**; the shipped build lists 876405767 alone.

    node tools/build-embed.mjs                      # builds dist/embed first
    NODE_PATH=$(npm root -g) node tests/live/compare-content.cjs   # rendered description vs source
    NODE_PATH=$(npm root -g) node tests/live/structure.cjs         # real classes and positions at 3 sizes
    NODE_PATH=$(npm root -g) node tests/live/inject.cjs desktop 1440 900 0      # name width height touch [choose] [top|size]
    NODE_PATH=$(npm root -g) node tests/live/events.cjs            # real OnPageLoaded: late load, navigation, back
    NODE_PATH=$(npm root -g) node tests/live/errors-and-addtobag.cjs
    NODE_PATH=$(npm root -g) node tests/live/gallery-e2.cjs        # gallery integration on the real gallery (39 checks)
    NODE_PATH=$(npm root -g) node tests/live/gallery-shots.cjs <out-dir>   # screenshots of the same, for review

`gallery-e2.cjs` also injects a manifest built from `tests/fixtures/live-media-831592302.json` into its local copy of
the embed, with an arbitrary test classification. `capture-media.cjs` and `gallery-inspect*.cjs` are the read-only
scripts that captured that fixture and the gallery's markup.

The live site is reached over the network; a timeout is the network, not the engine: run it again.
