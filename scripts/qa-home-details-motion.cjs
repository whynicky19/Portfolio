const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/home-details-motion';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch();const results=[];
 for(const width of [1440,390]){
  const c=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}});
  const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/index.html');await p.waitForTimeout(2900);
  assert.equal(await p.locator('.notebook-hero [data-home-extra]').count(),0);
  for(const selector of ['.h-work','.h-capabilities','.home-stack','.h-contact','.apple-footer']){
   const top=await p.locator(selector).evaluate(e=>e.getBoundingClientRect().top+scrollY);
   const delta=top-120-await p.evaluate(()=>scrollY);
   for(let i=0;i<3;i++){await p.mouse.wheel(0,delta/3);await p.waitForTimeout(120);}
   await p.waitForTimeout(140);await p.screenshot({path:`${out}/${width}-${selector.slice(1)}-entry.png`});
   await p.waitForTimeout(650);
  }
  // On narrow screens, individually expose any supporting items below the fold.
  const extras=p.locator('[data-home-extra]');
  for(let i=0;i<await extras.count();i++)if(await extras.nth(i).getAttribute('data-home-extra')==='ready'){
   await extras.nth(i).scrollIntoViewIfNeeded();await p.waitForTimeout(750);
  }
  const state=await extras.evaluateAll(es=>es.map(e=>({state:e.dataset.homeExtra,count:e.dataset.revealCount})));
  assert(state.every(e=>e.state==='complete'&&e.count==='1'));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);results.push({width,extras:state.length,errors});
  await p.locator('.h-contact').evaluate(e=>scrollTo(0,e.offsetTop-70));await p.waitForTimeout(100);await p.screenshot({path:`${out}/${width}-contact-complete.png`});
  const video=p.video();await c.close();await video.saveAs(`${out}/scroll-${width}.webm`);
 }
 for(const mode of ['reduced','toggle','keyboard','early-scroll','tablet','no-js','dark']){
  const c=await browser.newContext({viewport:{width:mode==='tablet'?768:320,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js',colorScheme:mode==='dark'?'dark':'light'});
  const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173/index.html');
  if(mode==='early-scroll'){await p.waitForTimeout(200);await p.mouse.wheel(0,900);await p.waitForTimeout(3100);assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('assembly-intro')),false);}
  if(mode==='toggle')await p.emulateMedia({reducedMotion:'reduce'});
  await p.locator('.h-capabilities').scrollIntoViewIfNeeded();await p.waitForTimeout(800);
  if(mode==='keyboard'){await p.locator('.contact-email').focus();assert.equal(await p.evaluate(()=>document.activeElement.className),'contact-email');}
  if(['reduced','toggle','no-js'].includes(mode))assert.equal(await p.locator('.principle p').first().evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  if(mode==='dark')await p.screenshot({path:`${out}/dark-320.png`});
  results.push({mode,passed:true});await c.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
