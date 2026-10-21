const {chromium} = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const out = '/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/mobile-home-stability';
fs.mkdirSync(out, {recursive:true});
const base = 'http://127.0.0.1:4173/';
const cv = 'Alimzhan_Galymzhan_Frontend_CV.pdf';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const width of [390, 320, 768]) {
    const context = await browser.newContext({viewport:{width,height:844}, isMobile:true, hasTouch:true,
      ...(width === 390 ? {recordVideo:{dir:out,size:{width,height:844}}} : {})});
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.motionCalls = [];
      const original = Element.prototype.animate;
      Element.prototype.animate = function(frames, options) {
        if (!this.closest('.notebook-hero,.apple-nav')) window.motionCalls.push({classes:this.className, frames});
        return original.call(this, frames, options);
      };
    });
    await page.goto(base + 'index.html');
    await page.waitForTimeout(2900);
    // Regression: the card was visible, then faded when the observer fired 24px later.
    const card = page.locator('.feature-card').first();
    await card.evaluate(e => scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight + 10));
    await page.waitForTimeout(80);
    assert.equal(await card.evaluate(e => getComputedStyle(e).opacity), '1');
    await page.mouse.wheel(0,60);
    for (let frame=0;frame<30;frame++) {
      await page.waitForTimeout(16);
      assert.equal(await card.evaluate(e => getComputedStyle(e).opacity), '1');
      assert.equal(await card.evaluate(e => getComputedStyle(e).translate), 'none');
    }
    // Slow and fast native scrolling, then revisit sections in reverse.
    for (const selector of ['.h-work','.h-capabilities','.home-stack','.h-contact','.apple-footer']) {
      const top = await page.locator(selector).evaluate(e => e.getBoundingClientRect().top+scrollY-90);
      const delta = top - await page.evaluate(() => scrollY);
      for(let i=0;i<3;i++) {await page.mouse.wheel(0,delta/3); await page.waitForTimeout(100);}
      await page.waitForTimeout(600);
      if(width===390) await page.screenshot({path:`${out}/390-${selector.slice(1)}.png`});
    }
    await page.mouse.wheel(0,-3200); await page.waitForTimeout(100);
    await page.mouse.wheel(0,3200); await page.waitForTimeout(500);
    await page.setViewportSize({width,height:740}); await page.waitForTimeout(100);
    const calls = await page.evaluate(() => window.motionCalls);
    assert(calls.length>0, 'Supporting motion should remain');
    for(const call of calls) for(const frame of call.frames) {
      assert(!('opacity' in frame) && !('clipPath' in frame), JSON.stringify(call));
    }
    assert.equal(await page.locator('.contact-word.pixel-fragments-active').count(),0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    results.push({width,cardStable:true,supportingAnimations:calls.length,errors});
    const video=page.video(); await context.close();
    if(video) await video.saveAs(`${out}/mobile-scroll.webm`);
  }
  // Opening sequence must still finish on its own clock when the user scrolls early.
  for(const delay of [200,500,1000,1500]) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage(); await page.goto(base+'index.html');
    await page.waitForTimeout(delay); await page.mouse.wheel(0,1200);
    await page.waitForTimeout(3000);
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('assembly-intro')),false);
    assert.equal(await page.locator('.notebook-hero .pixel-fragments-active').count(),0);
    results.push({earlyScrollMs:delay,completed:true}); await context.close();
  }
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(base+'index.html'); await page.waitForTimeout(2900);
  const desktopFrames=await page.evaluate(()=>{
    const element=document.querySelector('.feature-card');
    const animation=PortfolioReveal.animate(element,[{opacity:.35},{opacity:1}]);
    const frames=animation.effect.getKeyframes(); animation.cancel(); return frames;
  });
  assert.equal(desktopFrames[0].opacity,'0.35');
  await page.emulateMedia({reducedMotion:'reduce'}); await page.reload();
  await page.locator('.h-contact').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  for(const file of ['index.html','about.html','projects.html','contact.html']) {
    await page.goto(base+file);
    const links=await page.locator('a[href$=".pdf"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')).filter(s=>s.includes('_CV.pdf')));
    assert(links.length>0); assert(links.every(link=>link===cv));
    results.push({page:file,resumeLinks:links.length});
  }
  const response=await page.request.get(base+cv); assert.equal(response.status(),200);
  assert.equal(hash(await response.body()),hash(fs.readFileSync('/Users/whynicky/Downloads/'+cv)));
  results.push({reducedMotion:true,desktopMotionPreserved:true,cvExactMatch:true});
  fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2)); await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
