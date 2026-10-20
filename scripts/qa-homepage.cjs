const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const output = process.env.PORTFOLIO_QA_OUTPUT || '/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/home-review';
const origin = 'http://127.0.0.1:4173';
const results = [];
const pause = (page, ms = 750) => page.waitForTimeout(ms);
async function jump(page, selector) {
  await page.locator(selector).evaluate(element => window.scrollTo({ top:element.getBoundingClientRect().top + scrollY - 72, behavior:'instant' }));
  await pause(page);
}
(async () => {
  await fs.mkdir(output, { recursive:true });
  const browser = await chromium.launch();
  for (const width of [1440,1280,1024,768,430,390,320]) {
    const page = await browser.newPage({ viewport:{ width, height:width > 900 ? 1000 : 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(origin);
    await pause(page,1300);
    await page.screenshot({path:path.join(output,`hero-${width}.png`)});
    const initialTransform = await page.locator('.product-browser').evaluate(e => getComputedStyle(e).transform);
    for (let i=0;i<5;i++) { await page.mouse.wheel(0,60); await pause(page,70); }
    await page.screenshot({path:path.join(output,`scroll-${width}.png`)});
    const scrollTransform = await page.locator('.product-browser').evaluate(e => getComputedStyle(e).transform);
    await jump(page,'.h-work');
    await page.screenshot({path:path.join(output,`projects-${width}.png`)});
    for (const selector of ['.h-capabilities','.h-principles','.h-toolkit','.h-contact']) {
      await jump(page,selector);
      if(width === 1440 || width === 390) await page.screenshot({path:path.join(output,`${selector.slice(3)}-${width}.png`)});
    }
    await page.evaluate(() => scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
    await pause(page);
    await page.screenshot({path:path.join(output,`bottom-${width}.png`)});
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
    });
    const layout = await page.evaluate(() => ({
      overflow:document.documentElement.scrollWidth > innerWidth,
      clippedText:[...document.querySelectorAll('h1,h2,h3,.hero-facts,.tech-group ul')].filter(e => e.scrollWidth > e.clientWidth+2).map(e => e.textContent),
      broken:[...document.images].filter(e=>!e.complete || !e.naturalWidth).map(e=>e.getAttribute('src')),
      heroHeight:document.querySelector('.p-hero').offsetHeight,
      totalHeight:document.body.scrollHeight
    }));
    if(width === 1440 || width === 390) {
      await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
      await pause(page);
      await page.screenshot({path:path.join(output,`full-${width}.png`),fullPage:true});
    }
    results.push({width,...layout,scrollChangesTransform:initialTransform !== scrollTransform,errors});
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(origin);
  await pause(page,1300);
  await page.locator('[data-home-depth]').hover({position:{x:550,y:200}});
  await pause(page,400);
  const pointer = await page.locator('[data-home-depth]').evaluate(e=>parseFloat(e.style.getPropertyValue('--pointer-x')));
  assert(Math.abs(pointer)>1);
  await jump(page,'.h-work');
  const card = page.locator('.feature-chatra');
  await card.hover();
  await pause(page,550);
  assert.equal(await card.evaluate(e=>getComputedStyle(e).translate),'0px -5px');
  await jump(page,'.h-principles');
  assert.equal(await page.locator('.principle').count(),4);
  assert.equal(await page.locator('.feature-card').count(),8);
  assert.equal(await page.locator('.nav-logo').textContent(),'Alimzhan');
  assert.equal(await page.locator('.footer-col-intro .footer-col-title').textContent(),'Alimzhan');
  await page.locator('.feature-forge').focus();
  assert.equal(await page.locator('.feature-forge').evaluate(e=>e===document.activeElement),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await pause(page);
  const reducedBefore = await page.locator('.product-browser').evaluate(e=>getComputedStyle(e).transform);
  await page.mouse.wheel(0,300);
  await pause(page);
  const reducedAfter = await page.locator('.product-browser').evaluate(e=>getComputedStyle(e).transform);
  assert.equal(reducedBefore,reducedAfter);
  const hrefs = await page.locator('a[href]').evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute('href')).filter(h=>!h.startsWith('http')&&!h.startsWith('mailto:')&&!h.startsWith('#')))]);
  const links = [];
  for(const href of hrefs) {
    const response=await page.request.get(`${origin}/${href.split('#')[0]}`);
    const html=await response.text();
    const fragment=href.split('#')[1];
    links.push({href,status:response.status(),fragmentExists:!fragment||html.includes(`id="${fragment}"`)});
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#navBurger').click();
  assert.equal(await page.locator('#navBurger').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#navBurger').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('main').getAttribute('inert'),null);
  await page.close();
  // Both absence and silent failure of scroll observers leave content visible.
  const failure = await browser.newPage({viewport:{width:1440,height:900}});
  await failure.addInitScript(() => { window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} }; });
  await failure.goto(origin);
  await pause(failure,1300);
  const visibleWithoutObserver = await failure.locator('.h-reveal').evaluateAll(es=>es.every(e=>getComputedStyle(e).opacity==='1'&&getComputedStyle(e).visibility==='visible'));
  assert(visibleWithoutObserver);
  await failure.close();
  const report = {viewports:results,interactions:{pointer:true,hover:true,projectKeyboardFocus:true,principles:true,branding:true,reducedMotion:true,mobileMenuEscape:true,observerFailureFallback:visibleWithoutObserver},links};
  await fs.writeFile(path.join(output,'qa-results.json'),JSON.stringify(report,null,2));
  // Real browser capture, including scroll, pointer and working controls.
  const context = await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:output,size:{width:1440,height:900}}});
  const motion = await context.newPage();
  await motion.goto(origin);
  await pause(motion,1600);
  await motion.mouse.move(1150,380);
  await pause(motion,350);
  await motion.mouse.move(760,220,{steps:20});
  for(let i=0;i<20;i++){await motion.mouse.wheel(0,55);await pause(motion,85);}
  await motion.locator('.feature-soyle').hover();
  await pause(motion,600);
  for(let i=0;i<24;i++){await motion.mouse.wheel(0,55);await pause(motion,70);}
  await jump(motion,'.h-principles');
  await pause(motion,700);
  const video = motion.video();
  await context.close();
  await video.saveAs(path.join(output,'homepage-motion.webm'));
  await video.delete();
  await browser.close();
  assert(results.every(r=>!r.overflow&&!r.clippedText.length&&!r.broken.length&&!r.errors.length&&r.scrollChangesTransform));
  assert(links.every(link=>link.status===200&&link.fragmentExists));
  console.log('PASS: viewport, links, interactions, motion and observer fallback checks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
