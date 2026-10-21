const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/cinematic-polish';
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const report=[];
 for(const width of (process.env.WIDTHS?process.env.WIDTHS.split(',').map(Number):process.env.QUICK?[1440]:[1440,1280,1024,768,390,320]))for(const pageName of ['index','projects']){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/'+pageName+'.html');await page.waitForTimeout(3000);
  await page.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  const selector=pageName==='index'?'.feature-card':'.project-scene';const images=pageName==='index'?'.feature-art img':'.scene-depth img';
  const cards=page.locator(selector), samples=[];
  for(let i=0;i<await cards.count();i++){
   const card=cards.nth(i);const y=await card.evaluate(e=>e.getBoundingClientRect().top+scrollY);
   const states=[];
   for(const offset of [350,100,-50]){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y-offset);await page.waitForTimeout(800);states.push(await card.evaluate((e,s)=>{const c=e.getBoundingClientRect();return [...e.querySelectorAll(s)].map(i=>{const r=i.getBoundingClientRect();return [r.x-c.x,r.y-c.y,r.width,r.height]})},images));}
   await card.hover();await page.waitForTimeout(350);states.push(await card.evaluate((e,s)=>{const c=e.getBoundingClientRect();return [...e.querySelectorAll(s)].map(i=>{const r=i.getBoundingClientRect();return [r.x-c.x,r.y-c.y,r.width,r.height]})},images));
   const delta=Math.max(...states.flatMap(s=>s.flatMap((r,j)=>r.map((n,k)=>Math.abs(n-states[0][j][k])))));
   assert(delta<.1,`${pageName} ${width} card ${i}: ${delta}px`);samples.push({card:i,maxDelta:delta});
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth)));assert.equal(errors.length,0);
  if(!process.env.QUICK&&(width===1440||width===390)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${pageName}-${width}.png`,fullPage:true});}
  report.push({page:pageName,width,samples,errors});await page.close();console.log('PASS',pageName,width);
 }
 await fs.writeFile(`${out}/${process.env.QUICK?'baseline':'static-media'}.json`,JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
