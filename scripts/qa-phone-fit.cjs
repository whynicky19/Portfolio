const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const out = '/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/phone-fit';
(async () => {
  await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch(), report=[];
  for(const width of [1440,768,390,320]) {
    const page=await browser.newPage({viewport:{width,height:900}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/projects.html');
    await page.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
    const phones=await page.locator('.device-phone').all(); assert.equal(phones.length,4);
    for(const [index,phone] of phones.entries()) {
      const positions=[];
      for(const offset of [450,100,0]) {
        await phone.evaluate((e,n)=>scrollTo({top:e.getBoundingClientRect().top+scrollY-n,behavior:'instant'}),offset);
        await page.waitForTimeout(80);
        const state=await phone.evaluate(e=>{
          const display=e.querySelector('.phone-display'),image=display.querySelector('img');
          const c=getComputedStyle(display),r=e.getBoundingClientRect(),ir=image.getBoundingClientRect();
          return {apertureRatio:parseFloat(c.width)/parseFloat(c.height),fit:getComputedStyle(image).objectFit,transform:getComputedStyle(image).transform,
            topRadius:c.borderTopLeftRadius,bottomRadius:c.borderBottomLeftRadius,
            relative:[ir.x-r.x,ir.y-r.y,ir.width,ir.height],source:image.getAttribute('src'),loaded:image.naturalWidth>0};
        });
        assert(Math.abs(state.apertureRatio-6/13)<.001);assert.equal(state.transform,'none');assert.equal(state.fit,'contain');assert(state.loaded);
        assert.notEqual(state.topRadius,state.bottomRadius);positions.push(state);
      }
      const delta=Math.max(...positions.flatMap(s=>s.relative.map((v,i)=>Math.abs(v-positions[0].relative[i]))));assert(delta<.01);
      report.push({width,index,delta,...positions[0]});
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(errors.length,0);
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const id of ['chatra-project','freelanceos','chatra-mobile']) {
      await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(100);
      if(width===1440||width===390) await page.locator('#'+id).screenshot({path:`${out}/${id}-${width}.png`});
    }
    console.log('PASS',width);await page.close();
  }
  await fs.writeFile(out+'/results.json',JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
