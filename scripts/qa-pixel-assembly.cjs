const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/pixel-assembly';
const origin='http://127.0.0.1:4173';
async function elapsed(p){return p.evaluate(()=>performance.now()-(window.portfolioEntrance?.start||0));}
async function until(p,t){const now=await elapsed(p);if(t>now)await p.waitForTimeout(t-now);}
async function state(p){return p.evaluate(()=>({
 elapsed:performance.now()-(window.portfolioEntrance?.start||0),state:document.documentElement.dataset.assemblyState,
 text:document.querySelector('.pixel-name').textContent,font:getComputedStyle(document.querySelector('.pixel-name')).fontFamily,
 titleFill:getComputedStyle(document.querySelector('.pixel-name')).webkitTextFillColor,
 titleRect:(()=>{const r=document.querySelector('.pixel-name').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})(),
 canvases:document.querySelectorAll('.pixel-fragment-canvas').length,
 cls:window.qaShifts||0,overflow:document.documentElement.scrollWidth>innerWidth
}));}
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const report={viewports:[],behavior:{}};
 for(const width of [1440,768,390,320]){
  const ctx=await browser.newContext({viewport:{width,height:width<600?844:1000},deviceScaleFactor:1,recordVideo:width===1440?{dir:out,size:{width:1440,height:1000}}:undefined});
  await ctx.addInitScript(()=>{window.qaShifts=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.qaShifts+=e.value}).observe({type:'layout-shift',buffered:true})});
  const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin,{waitUntil:'domcontentloaded'});
  const frames=[];
  for(const t of [0,500,1100,1800,2800]){await until(p,t);const s=await state(p);frames.push({target:t,...s});await p.screenshot({path:`${out}/hero-${width}-${t}.png`});}
  assert.equal(frames.at(-1).state,'complete');assert.match(frames.at(-1).font,/Silkscreen/);assert.equal(frames.at(-1).text,'ALIMZHAN');
  assert.equal(frames.at(-1).canvases,0);assert(!frames.some(f=>f.overflow));assert(frames.at(-1).cls<.01,JSON.stringify(frames));
  assert.equal(frames[1].canvases,1);assert.equal(frames[2].canvases,1);assert.equal(frames[3].canvases,0);
  assert.deepEqual(frames[1].titleRect,frames.at(-1).titleRect);
  // No finish-frame flash: the settled UI stays visible after WAAPI cleanup.
  await p.waitForTimeout(300);assert.equal(await p.locator('.apple-nav').evaluate(e=>getComputedStyle(e).opacity),'1');
  const before=await p.locator('.pixel-name').evaluate(e=>getComputedStyle(e).transform);
  await p.evaluate(()=>scrollTo({top:240,behavior:'instant'}));await p.waitForTimeout(150);
  assert.notEqual(await p.locator('.pixel-name').evaluate(e=>getComputedStyle(e).transform),before);
  await p.screenshot({path:`${out}/parallax-${width}.png`});
  await p.locator('.feature-chatra').hover();await p.waitForTimeout(400);assert.equal(await p.locator('.feature-chatra').evaluate(e=>getComputedStyle(e).translate),'0px -5px');
  const contactTop=await p.locator('.contact-word').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await p.evaluate(y=>scrollTo({top:y-350,behavior:'instant'}),contactTop);
  await p.waitForTimeout(160);await p.screenshot({path:`${out}/contact-${width}-assembling.png`});
  await p.waitForTimeout(800);assert.equal(await p.locator('.contact-word').getAttribute('data-assembly-state'),'complete');assert.equal(await p.locator('.pixel-fragment-canvas').count(),0);
  await p.screenshot({path:`${out}/contact-${width}-final.png`});
  await p.locator('.pixel-contact').focus();await p.keyboard.press('Tab');assert(await p.locator('.contact-email').evaluate(e=>e===document.activeElement));
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  assert(await p.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
  await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});
  const a11y=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.equal(a11y.length,0,JSON.stringify(a11y));
  if(width===1440||width===390){await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(600);await p.screenshot({path:`${out}/full-${width}.png`,fullPage:true});await sharp(`${out}/full-${width}.png`).resize(width===1440?740:390).webp().toFile(`${out}/overview-${width}.webp`);}
  assert.equal(errors.length,0,JSON.stringify(errors));report.viewports.push({width,frames,a11y,errors});
  const video=p.video();await ctx.close();if(video)await video.saveAs(`${out}/opening-and-contact.webm`);console.log('PASS '+width);
 }
 const p=await browser.newPage();await p.goto(origin);await p.waitForTimeout(2800);
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(500);assert.equal((await state(p)).state,'running');report.behavior.reload='replays';
 await p.keyboard.press('Tab');assert.equal((await state(p)).state,'running');report.behavior.keyboard='entrance clock remains independent';
 await p.goto(origin+'/projects.html');await p.locator('.apple-nav a[href="index.html"]').first().click();await p.waitForURL('**/index.html');await p.waitForTimeout(300);assert.equal((await state(p)).state,'skipped');report.behavior.internalNavigation='skipped';
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(250);await p.mouse.wheel(0,200);await p.waitForTimeout(250);assert.equal((await state(p)).state,'running');report.behavior.scroll='native scrolling does not cancel entrance';await p.close();
 for(const mode of ['reduced','no-js','missing-script','slow-font']){
  const ctx=await browser.newContext({reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
  if(mode==='missing-script')await ctx.route('**/pixel-assembly.js*',route=>route.abort());
  if(mode==='slow-font')await ctx.route('**/Silkscreen-Bold.ttf',async route=>{await new Promise(r=>setTimeout(r,1000));await route.continue()});
  const page=await ctx.newPage();await page.goto(origin);await page.waitForTimeout(mode==='missing-script'?3500:1000);
  assert.notEqual(await page.locator('.pixel-name').evaluate(e=>getComputedStyle(e).webkitTextFillColor),'rgba(0, 0, 0, 0)');
  assert.equal(await page.locator('.pixel-fragment-canvas').count(),0);assert.equal(await page.locator('.notebook-actions').evaluate(e=>getComputedStyle(e).opacity),'1');
  report.behavior[mode]='static content visible';await ctx.close();
 }
 await fs.writeFile(`${out}/qa-results.json`,JSON.stringify(report,null,2));await browser.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
