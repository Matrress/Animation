/* Media manifest for Botanic (test product 876405767).
 *
 * The images stay in Ecwid: nothing here uploads, moves or replaces one. This
 * file is DATA ABOUT them: which images are meant for the customer-facing
 * "View Model Gallery", what each one is, and the larger sizes that the
 * store's page does not carry.
 *
 * STATUS: not created yet for the test product, because its images are not
 * known to this repository. While this is null, the gallery shows every image
 * the store's own gallery shows (the thumbnail size, about 800 px wide), so
 * the gallery is never empty.
 *
 * To create it, from an export of the product (the storefront's product record,
 * or the REST API's product with its media images):
 *
 *     node tools/media-manifest.mjs product.json --product-id 876405767 --out products/botanic.media.js
 *
 * then open the generated file, set `category` and `customerGallery` on each
 * image, rebuild, and upload botanic-tv.js again. When images are later
 * added or replaced in Ecwid, regenerate with `--merge products/botanic.media.js`:
 * images that are new stay hidden until classified, replaced ones are dropped.
 *
 * Never type an image address by hand: the generator copies the addresses Ecwid
 * returned. An address of one size cannot be worked out from another.
 */
(function (global) {
  global.DDTV_PRODUCTS.botanic.mediaManifest = null;
})(window);
