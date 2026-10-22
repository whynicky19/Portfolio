# Native screenshot layers

Projects retains its existing photographic compositions. `projects-screens.js` now renders the genuine UI sources as separate HTML images directly over each physical display. No UI is generated, repainted, or sharpened with invented detail.

`live-screens.json` records the source, canvas aspect ratio, photograph dimensions and four display corners for every square, right-facing wide and left-facing wide composition. The same cover/contain scale and object-position as the background photograph are applied before the projective transform, including on resize.

The existing full scenes remain the no-JavaScript and network-failure fallback. HTML source pixels avoid the earlier warp → photograph encoding → responsive thumbnail → browser scaling chain. Straight display boundaries replace the previously resampled irregular masks.

Chatra mobile now uses genuine 1179×2556 light/dark screenshots rather than 360×780 video posters. FreelanceOS retains its original 364×811 prototype source; it is not represented as a newly captured high-resolution screen.

Verification: all ten project scenes at 1440, 1280, 1024, 768, 430, 390 and 320 CSS pixels, using a 2× pixel-density browser, including resizing across the 1280px composition change. Source images loaded, transforms remained finite, no horizontal overflow or browser errors.
