const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/recent-transition';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch();
 const results=[];
 for(const width of [1440,768,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/projects.html');
  await page.waitForTimeout(1700);
  // A real wheel gesture starts the entrance; no synthetic timeline seeking.
  await page.evaluate(()=>scrollTo(0,0));
  if(width>=800){
   await page.mouse.wheel(0,440);
   await page.waitForFunction(()=>document.querySelector('.recent-work').dataset.transition==='running');
   await page.waitForTimeout(130);
   await page.screenshot({path:`${out}/${width}-opening.png`});
   await page.waitForTimeout(170);
   await page.screenshot({path:`${out}/${width}-assembling.png`});
  } else {
   await page.mouse.wheel(0,300);
   await page.waitForFunction(()=>document.querySelector('.recent-work').dataset.transition==='running');
   await page.waitForTimeout(150);
   await page.screenshot({path:`${out}/${width}-opening.png`});
  }
  await page.waitForTimeout(1100);
  await page.screenshot({path:`${out}/${width}-complete.png`});
  await page.mouse.wheel(0,900);await page.waitForTimeout(150);
  await page.mouse.wheel(0,-1100);await page.waitForTimeout(200);
  const state=await page.evaluate(()=>({
   width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
   phase:document.querySelector('.recent-work').dataset.transition,
   count:document.querySelector('.recent-work').dataset.transitionCount,
   curtains:document.querySelectorAll('.recent-shutters').length,
   title:getComputedStyle(document.querySelector('.recent-work h2')).visibility,
   media:[...document.querySelectorAll('.unified-showcase')].every(e=>getComputedStyle(e).transform==='none'),
   projects:document.querySelectorAll('.project-story').length
  }));
  assert(!state.overflow);assert.equal(state.phase,'complete');assert.equal(state.count,'1');
  assert.equal(state.curtains,0);assert.equal(state.title,'visible');assert(state.media);assert.equal(state.projects,10);assert.deepEqual(errors,[]);
  results.push({...state,errors});
  const video=page.video();await context.close();await video.saveAs(`${out}/scroll-${width}.webm`);
 }
 for(const mode of ['reduced','no-js','anchor','switch-reduced','fast-scroll']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173/projects.html'+(mode==='anchor'?'#chatra-project':''));
  if(mode==='switch-reduced')await page.emulateMedia({reducedMotion:'reduce'});
  if(mode==='fast-scroll'){await page.mouse.wheel(0,2500);await page.mouse.wheel(0,-2500);}
  await page.waitForTimeout(1400);
  await page.locator('.recent-work').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  const state=await page.locator('.recent-work').evaluate(e=>({visible:getComputedStyle(e.querySelector('h2')).visibility,curtains:e.querySelectorAll('.recent-shutters').length}));
  assert.equal(state.visible,'visible');assert.equal(state.curtains,0);
  results.push({mode,...state});await context.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
