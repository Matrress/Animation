// The stand-in store page's native gallery: the same markup the real Ecwid storefront renders, filled with the
// real image records of the public product (tests/fixtures/live-media-831592302.json). For development and tests
// only; it is NOT Ecwid and it is never shipped.
//
// Real structure (observed on the public live product): a container with a main <img> (the 1500 px file) and a
// strip of thumbnails whose pictures are CSS background `image-set(...)` of the 800 px file.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function mockGalleryHtml() {
  const fx = JSON.parse(readFileSync(join(root, 'tests', 'fixtures', 'live-media-831592302.json'), 'utf8'));
  const items = fx.mediaItems;
  const main = items[0];
  const thumbs = items.map((m, i) => {
    const u = m.image800pxUrl;
    const bg = `background-image: image-set(url(&quot;${u}&quot;) 1dppx, url(&quot;${u}&quot;) 2dppx)`;
    return `<div class="details-gallery__thumb${i === 0 ? ' details-gallery__thumb--active' : ''}" data-mock-index="${i}"><div class="details-gallery__thumb-bg" style="${bg}"></div><div class="details-gallery__thumb-img" style="${bg}"></div></div>`;
  }).join('');
  return `<div class="product-details__gallery details-gallery details-gallery--thumbnails-vertical">
        <div class="details-gallery__wrap"><div class="details-gallery__wrap-inner">
          <div class="details-gallery__spacer"></div>
          <div class="details-gallery__images details-gallery__images--aspect-ratio-auto"><div class="details-gallery__images-container"><div class="details-gallery__main-image-wrapper"><img class="details-gallery__photoswipe-index-0 details-gallery__picture" src="${esc(main.image1500pxUrl)}" srcset="${esc(main.image1500pxUrl)} 1x" loading="eager" alt="${esc(main.alt)}"></div></div></div>
          <div class="details-gallery__thumbs details-gallery__thumbs--preview">${thumbs}</div>
        </div></div>
        <div class="details-gallery__scroll"></div>
      </div>`;
}

// Script for the stand-in page: makes the native gallery behave like the real one when it is re-rendered.
export const MOCK_GALLERY_SCRIPT = `
/* STAND-IN BEHAVIOUR (tests only): what the real storefront was observed to do with its gallery.
   - choosing an option re-creates the gallery's children and shows an image that is NOT one of the product's media;
   - navigating away and back creates a new gallery element.
   Both are triggered by the tests through window.__mockGallery. */
(function () {
  var OPTION_IMAGE = 'https://d2j6dbq0eux0bg.cloudfront.net/images/100333285/products/831592302/4888572716.webp';
  function rerenderChildren() {
    var g = document.querySelector('.product-details__gallery'); if (!g) return;
    var wrap = g.querySelector('.details-gallery__wrap'); if (!wrap) return;
    var fresh = wrap.cloneNode(true);
    var img = fresh.querySelector('.details-gallery__picture');
    if (img) { img.setAttribute('src', OPTION_IMAGE); img.setAttribute('srcset', OPTION_IMAGE + ' 1x'); }
    wrap.replaceWith(fresh);
  }
  function replaceContainer() {
    var g = document.querySelector('.product-details__gallery'); if (!g) return null;
    var fresh = g.cloneNode(false);
    [].forEach.call(g.children, function (c) { if (!c.classList.contains('ddtv-host')) fresh.appendChild(c.cloneNode(true)); });
    fresh.removeAttribute('data-ddtv-gallery');
    g.replaceWith(fresh);
    return fresh;
  }
  document.addEventListener('change', function (e) {
    if (e.target && e.target.closest && e.target.closest('.details-product-option')) rerenderChildren();
  });
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('.details-gallery__thumb'); if (!t) return;
    var g = document.querySelector('.product-details__gallery');
    [].forEach.call(g.querySelectorAll('.details-gallery__thumb'), function (n) { n.classList.toggle('details-gallery__thumb--active', n === t); });
  });
  window.__mockGallery = { rerenderChildren: rerenderChildren, replaceContainer: replaceContainer, OPTION_IMAGE: OPTION_IMAGE };
})();
`;
