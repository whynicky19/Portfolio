/* Raster posters exported from the same real-image/CSS compositions as the
   interactive page. Live rendering retains separate layers for parallax. */
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
  await page.goto('http://127.0.0.1:4173');
  await page.waitForTimeout(1300);
  await page.addStyleTag({content:`
    .feature-copy,.card-arrow,.mini-phone,.product-caption,.product-note{visibility:hidden!important}
    .feature-card{min-height:460px!important}
    .feature-art{transform:none!important}
    .feature-art .media-window{width:82%!important;right:9%!important;top:14%!important;transform:rotate(-5deg)!important}
    .feature-soyle .media-window{width:78%!important;right:11%!important;top:9%!important}
    .feature-urpaq .media-window{width:65%!important;right:17%!important;top:12%!important}
    .finance-phone{width:39%!important;right:29%!important;top:5%!important}
    .h-reveal{animation:none!important;opacity:1!important}
  `});
  for(const [selector,folder] of [['.feature-chatra','chatra'],['.feature-soyle','soyle'],['.feature-urpaq','digital-urpaq'],['.feature-freelance','freelanceos']]) {
    const buffer = await page.locator(selector).screenshot();
    const dest = path.join(root,'assets/projects',folder);
    await fs.writeFile(path.join(dest,'product-composition-master.png'),buffer);
    await sharp(buffer).resize({width:1200}).webp({quality:90}).toFile(path.join(dest,'product-composition-1200.webp'));
    await sharp(buffer).resize({width:640}).webp({quality:86}).toFile(path.join(dest,'product-composition-640.webp'));
  }
  await browser.close();
})();
