# Individual project environments

Ten independent environments generated with the built-in **image_gen** tool on 2026-10-21. Exact prompts: [prompts.json](prompts.json). Original generation paths and optimized filenames: [sources.json](sources.json).

Each environment has a 1536 × 1024 WebP and an 800px-wide responsive version. All twenty images total approximately 1.2 MB. Full-size backgrounds are 39–178 KB each. The environment plates contain no generated application interfaces or device screens.

| Project | Environment file |
| --- | --- |
| Chatra | `chatra-scene.webp` |
| Söyle | `soyle-scene.webp` |
| Digital Urpaq | `digital-urpaq-scene.webp` |
| FreelanceOS | `freelanceos-scene.webp` |
| RugPull Risk | `rugpull-risk-scene.webp` |
| FORGE | `forge-scene.webp` |
| Portfolio Website | `portfolio-scene.webp` |
| Chatra API | `chatra-api-scene.webp` |
| Chatra mobile | `chatra-mobile-scene.webp` |
| CS50P + Odin | `learning-scene.webp` |

## Device and interface integrity

The eight MacBooks and four iPhones reuse the existing photographic hardware assets and calibrated display apertures in `../devices/`. All twelve original screenshot sources, descriptions and project links are unchanged. Only hardware in the dark scenes receives a static lighting adjustment; the actual UI does not. Hardware, screen and scene never translate or scale in response to scrolling or hovering.

## Motion implementation

- Environment image `.scene-background`: section progress is `(viewport height − section top) / (viewport height + section height)`, clamped to 0–1. Vertical translation is **−90px → +90px** desktop, **−63px → +63px** at widths ≤800px. A 110px overscan on both edges prevents gaps.
- Lighting field `.story-environment::after`: same progress, horizontal translation **−21% → +21%**, vertical translation **+70px → −70px**; both ranges multiplied by 0.7 on mobile. It is independent of devices and screenshots.
- First-project entrance: the existing paired paper shutters cover the **whole scene**, not just the media. They move horizontally from 0 to ±101% of their own width with smoothstep progress as the section top travels from 98% to 33% of viewport height. Text and actions have separate reveals within that interval.
- Later project titles: live Silkscreen text is revealed by a seven-step vertical mask over 420ms. Descriptions and technology tags use a 480ms horizontal mask with staggered delays of 0–150ms. No glyph distortion or image movement.
- Reduced motion: atmosphere translations and masks are disabled; all content is immediately readable. Native scrolling remains unrestricted. Keyboard focus bypasses the first-project shutters and text masks.

## Verification

`scripts/qa-project-scenes.cjs` checks 1440, 1280, 768, 390 and 320px, unique backgrounds, loading, preserved content/links/screenshots, layout overflow, stationary devices, reduced motion and no-JavaScript content. Hero, RECENT WORK and footer screenshots are compared pixel-for-pixel against the pre-refinement baseline. `scripts/record-project-scenes.cjs` records real wheel scrolling at desktop and mobile sizes.

The existing Home files, shared navigation, footer styles and Projects Hero/intro styling were not changed by this refinement.
