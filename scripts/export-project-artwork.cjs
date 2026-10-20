/* Deterministic composition: generated atmosphere + unchanged source UI.
   Screens are never submitted to the generator. Live cards keep layers separate. */
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const projects = [
 ['chatra','chatra'],['soyle','soyle'],['urpaq','digital-urpaq'],
 ['freelance','freelanceos'],['rugpull','rugpull'],['api','api'],
 ['forge','forge'],['archive','archive']
];
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4173');
 await page.evaluate(()=>{for(const i of document.images)i.loading='eager'});
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 await page.addStyleTag({content:'.feature-copy,.card-arrow{visibility:hidden!important}.feature-art{transform:none!important}.feature-card{animation:none!important;translate:none!important}'});
 const manifest=[];
 for(const[cls,id]of projects){
  const card=page.locator('.feature-'+cls);
  const sources=await card.locator('.feature-art img').evaluateAll(es=>es.map(e=>e.getAttribute('src')));
  const dest=path.resolve('assets/projects/artwork');
  const buffer=await card.screenshot();
  await fs.writeFile(path.join(dest,id+'-showcase-master.png'),buffer);
  await sharp(buffer).resize(1200).webp({quality:93}).toFile(path.join(dest,id+'-showcase-1200.webp'));
  await sharp(buffer).resize(640).webp({quality:90}).toFile(path.join(dest,id+'-showcase-640.webp'));
  manifest.push({project:id,atmosphere:id+'-atmosphere.webp',screenshots:sources,exports:[id+'-showcase-master.png',id+'-showcase-1200.webp',id+'-showcase-640.webp'],liveRendering:'Same atmosphere and source screenshots in separate layers to retain independent parallax.'});
 }
 await fs.writeFile('assets/projects/artwork/compositions.json',JSON.stringify(manifest,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
