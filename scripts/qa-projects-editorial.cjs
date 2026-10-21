const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/projects-editorial';
const origin='http://127.0.0.1:4173';
async function scroll(p,y){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(180);}
async function state(p){return p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,cls:window.qaCLS,
 hero:document.querySelector('.projects-hero').getAttribute('style'),
 scenes:[...document.querySelectorAll('.project-story')].map(e=>({id:e.id,style:e.getAttribute('style')}))}));}
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const report=[];
 for(const width of [1440,1280,1024,768,430,390,320]){
  const ctx=await browser.newContext({viewport:{width,height:900},recordVideo:width===1440?{dir:out,size:{width,height:900}}:undefined});
  await ctx.addInitScript(()=>{window.qaCLS=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.qaCLS+=e.value})).observe({type:'layout-shift',buffered:true})});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(600);assert.match(await p.locator('.projects-hero h1').evaluate(e=>getComputedStyle(e).clipPath),/^polygon/);if(width===1440){const cdp=await ctx.newCDPSession(p);const shot=await cdp.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${out}/pixel-reveal-600.png`,Buffer.from(shot.data,'base64'));await cdp.detach();}
  await p.waitForTimeout(1400);assert.equal(await p.locator('.projects-hero').getAttribute('data-reveal'),'complete');
  assert.equal(await p.locator('.projects-hero').innerText(),'PROJECTS');
  assert.equal(await p.locator('.project-story').count(),10);
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await p.screenshot({path:`${out}/hero-${width}.png`});const top=await state(p);
  const heading=await p.locator('.projects-hero h1').boundingBox();assert(heading.x>=0&&heading.x+heading.width<=width);
  await scroll(p,280);const middle=await state(p);assert.notEqual(top.hero,middle.hero);await p.screenshot({path:`${out}/hero-scroll-${width}.png`});
  await p.locator('.recent-work').scrollIntoViewIfNeeded();await p.waitForTimeout(800);await p.screenshot({path:`${out}/recent-${width}.png`});
  const measurements=[];
  for(const id of ['chatra-project','soyle-project','digital-urpaq-project','freelanceos','rugpull','forge','portfolio','chatra-backend','chatra-mobile','learning']){
   const story=p.locator('#'+id),y=await story.evaluate(e=>e.getBoundingClientRect().top+scrollY);
   await scroll(p,y-240);const a=await story.getAttribute('style');await scroll(p,y-40);const b=await story.getAttribute('style');assert.notEqual(a,b);
   const boxes=await story.evaluate(e=>{const r=e.querySelector('.project-scene').getBoundingClientRect(),t=e.querySelector('.project-copy').getBoundingClientRect(),bg=e.querySelector('.scene-background').getBoundingClientRect();return{scene:{x:r.x,y:r.y,width:r.width,height:r.height},text:{x:t.x,y:t.y,width:t.width,height:t.height},covered:bg.top<=r.top&&bg.bottom>=r.bottom,overflow:document.documentElement.scrollWidth>innerWidth}});
   assert(boxes.covered);assert(!boxes.overflow);
   if(width>800)assert(id==='chatra-project'?boxes.text.x<boxes.scene.x:id==='soyle-project'?boxes.text.x>boxes.scene.x:true);
   else assert(boxes.text.y+boxes.text.height<=boxes.scene.y+1);
   if(width===1440||width===390)await p.screenshot({path:`${out}/${id}-${width}.png`});measurements.push({id,a,b,...boxes});
  }
  await p.locator('#chatra-project .project-scene').hover();await p.waitForTimeout(450);
  assert.equal(await p.locator('#chatra-project .scene-screen').evaluate(e=>getComputedStyle(e).scale),'1.025');
  await p.locator('#chatra-project .project-button').focus();assert(await p.locator('#chatra-project .project-button').evaluate(e=>e===document.activeElement));
  if(width<=768){await scroll(p,0);await p.locator('#navBurger').click();assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'false');}
  await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});
  const violations=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.equal(violations.length,0,JSON.stringify(violations));
  await p.emulateMedia({reducedMotion:'reduce'});await scroll(p,320);assert.equal(await p.locator('.projects-hero h1').evaluate(e=>getComputedStyle(e).transform),'none');assert.equal(await p.locator('.scene-depth').first().evaluate(e=>getComputedStyle(e).transform),'none');
  await p.emulateMedia({reducedMotion:'no-preference'});
  await scroll(p,0);await p.waitForTimeout(300);
  if(width===1440||width===390){await p.screenshot({path:`${out}/full-${width}.png`,fullPage:true});await sharp(`${out}/full-${width}.png`).resize(width===1440?818:390).webp().toFile(`${out}/overview-${width}.webp`);}
  if(width===1440){await p.evaluate(async()=>{const start=performance.now();await new Promise(resolve=>{function tick(now){const t=Math.min(1,(now-start)/14000);scrollTo({top:t*3300,behavior:'instant'});if(t<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})});}
  const final=await state(p);assert(!final.overflow);assert(final.cls<.01,JSON.stringify(final));assert.equal(errors.length,0);
  report.push({width,top,middle,measurements,cls:final.cls,violations,errors});const video=p.video();await ctx.close();if(video)await video.saveAs(`${out}/scroll-demo.webm`);console.log('PASS '+width);
 }
 for(const noJS of [true,false]){const ctx=await browser.newContext({javaScriptEnabled:!noJS,reducedMotion:'reduce',viewport:{width:390,height:844}});const p=await ctx.newPage();await p.goto(origin+'/projects.html');assert.equal(await p.locator('.project-story').count(),10);assert.equal(await p.locator('.projects-hero h1').evaluate(e=>getComputedStyle(e).clipPath),'none');await ctx.close();}
 const p=await browser.newPage();await p.goto(origin+'/projects.html');const hrefs=await p.locator('main a').evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute('href')).filter(h=>!h.startsWith('http')))]);for(const href of hrefs){const res=await p.request.get(origin+'/'+href);assert(res.ok(),href);}
 await fs.writeFile(`${out}/results.json`,JSON.stringify(report,null,2));await browser.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
