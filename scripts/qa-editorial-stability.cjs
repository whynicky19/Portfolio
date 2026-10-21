/* Run with Playwright + sharp. Evidence uses real Chromium rendering. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=process.env.PORTFOLIO_QA_OUT || '/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/editorial-stability';
const base='http://127.0.0.1:4173/';
const widths=process.env.PORTFOLIO_QA_PHASE==='entrances'?[]:[320,360,375,390,430,768,1024,1280,1440];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const prepare=async page=>{
 await page.evaluate(async()=>{await document.fonts.ready;for(const image of document.images)image.loading='eager';await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
};
function instrument(){
 window.qa={shifts:[],animations:[],scrollWrites:[]};
 new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)qa.shifts.push(e.value);})).observe({type:'layout-shift',buffered:true});
 const animate=Element.prototype.animate;
 Element.prototype.animate=function(...args){qa.animations.push({element:this.id||this.className,time:performance.now()});return animate.apply(this,args);};
}
const audit=page=>page.evaluate(()=>{
 const meaningful=[...document.querySelectorAll('main h1,main h2,main h3,main p,.project-stack,.project-links,.stack-group li')];
 const hidden=meaningful.filter(e=>{if(!e.getClientRects().length)return false;for(let p=e;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(s.opacity==='0'||s.visibility==='hidden')return true;}return false;}).map(e=>e.id||e.className);
 const overflow=[...document.querySelectorAll('main h1,main h2,.identity-note,.stack-group li,.project-links,.contact-email')].filter(e=>{const r=e.getBoundingClientRect();return r.left < -1||r.right>innerWidth+1}).map(e=>e.id||e.className);
 return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,hidden,overflow,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc),cls:qa.shifts.reduce((a,b)=>a+b,0),reveals:[...document.querySelectorAll('[data-reveal-count]')].map(e=>({id:e.id||e.className,count:e.dataset.revealCount})),animations:qa.animations};
});
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch();const report={browser:'Chromium',breakpoints:widths.length?[]:JSON.parse(fs.readFileSync(path.join(out,'results.json'))).breakpoints,entrances:[],fallbacks:[]};
 for(const width of widths){
  for(const name of ['index','projects']){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<=430,hasTouch:width<=430});
   await context.addInitScript(instrument);
   const page=await context.newPage(),errors=[],networkErrors=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>networkErrors.push({url:r.url(),error:r.failure()?.errorText}));
   await page.goto(base+name+'.html');await prepare(page);await page.waitForTimeout(2800);
   const height=await page.evaluate(()=>document.documentElement.scrollHeight);
   // Slow traversal, pausing just inside each entrance boundary.
   for(let y=0;y<height;y+=650){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(45);}
   await page.waitForTimeout(700);
   const countBefore=await page.evaluate(()=>qa.animations.length);
   for(let repeat=0;repeat<3;repeat++){
    for(const y of [height,Math.round(height*.6),Math.round(height*.3),0,height,0]){
     await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(25);
    }
   }
   await page.waitForTimeout(700);
   const data=await audit(page);
   data.page=name;data.errors=errors;data.networkErrors=networkErrors;data.animationRestarts=await page.evaluate(before=>qa.animations.length-before,countBefore);
   if(width<=768){
    await page.locator('#navBurger').click();await page.waitForTimeout(250);
    data.mobileMenuOpen=await page.locator('#navBurger').getAttribute('aria-expanded')==='true';
    data.mobileMenuLinksFit=await page.locator('#mobileMenu a').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));
    await page.keyboard.press('Escape');
    data.mobileMenuClosed=await page.locator('#navBurger').getAttribute('aria-expanded')==='false';
   }
   if(name==='projects'){
    data.projects=await page.locator('.project-story').evaluateAll(es=>es.map(e=>({id:e.id,text:[...e.querySelectorAll('h2,p,li')].map(x=>x.textContent),links:[...e.querySelectorAll('a')].map(a=>a.getAttribute('href')),image:e.querySelector('img').currentSrc})));
    data.mediaStatic=[];
    for(const story of await page.locator('.project-story').all()){
     const states=[];
     for(const p of [.15,.5,.85]){
      await story.evaluate((e,p)=>scrollTo({top:e.offsetTop-innerHeight+p*(e.offsetHeight+innerHeight),behavior:'instant'}),p);
      states.push(await story.evaluate(e=>{const im=e.querySelector('img'),r=im.getBoundingClientRect(),q=e.getBoundingClientRect(),s=getComputedStyle(im);return {x:r.x-q.x,y:r.y-q.y,w:r.width,h:r.height,transform:s.transform,translate:s.translate,scale:s.scale};}));
     }
     data.mediaStatic.push({id:await story.getAttribute('id'),stable:states.every(s=>JSON.stringify(s)===JSON.stringify(states[0]))});
    }
   }
   await page.evaluate(()=>{document.activeElement?.blur();scrollTo({top:0,behavior:'instant'});});
   await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
   if([320,390,768,1440].includes(width)){
    const selectors=name==='index'?['.p-hero','.h-work','.home-stack','.h-contact']:['.projects-hero','.recent-work',...await page.locator('.project-story').evaluateAll(es=>es.map(e=>'#'+e.id))];
    for(const sel of selectors)await page.locator(sel).screenshot({path:path.join(out,`${name}-${sel.slice(1)}-${width}.png`)});
   }
   report.breakpoints.push(data);await context.close();console.log(name,width,'overflow',data.overflow.length,'hidden',data.hidden.length,'restarts',data.animationRestarts,'CLS',data.cls);
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
 }
 // Early scroll and height-only viewport changes: entrance clocks must continue.
 for(const name of ['index','projects'])for(const width of [1440,390])for(const timing of [0,200,500,1000]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});
  const p=await context.newPage();await p.goto(base+name+'.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(timing);
  await p.evaluate(()=>scrollTo({top:650,behavior:'instant'}));
  const state=()=>p.evaluate(name=>name==='index'?document.documentElement.dataset.assemblyState:document.querySelector('.projects-hero').dataset.reveal,name);
  const afterScroll=await state();
  const timingEvidence=await p.evaluate(name=>{const e=name==='index'?document.documentElement:document.querySelector('.projects-hero');return {elapsed:performance.now()-Number(name==='index'?e.dataset.assemblyStart:e.dataset.entranceStart),nameComplete:e.classList.contains('assembly-name-done'),fragmentCanvases:document.querySelectorAll('.pixel-name .pixel-fragment-canvas').length};},name);
  await p.setViewportSize({width,height:840});await p.waitForTimeout(30);const afterHeightChange=await state();
  await p.waitForTimeout(2800);const complete=await state();
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(60);const afterReturn=await state();
  report.entrances.push({page:name,width,timing,afterScroll,afterHeightChange,complete,afterReturn,timingEvidence});
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);report.entrances.at(-1).refresh=await state();await context.close();
  console.log('entrance',name,width,timing,afterScroll,afterHeightChange,complete);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
 }
 for(const name of ['index','projects'])for(const mode of ['reduce','no-js','blocked-script']){
  const c=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduce'?'reduce':'no-preference'});
  if(mode==='blocked-script')await c.route('**/*.js*',route=>route.abort());
  const p=await c.newPage();await p.goto(base+name+'.html');await p.waitForTimeout(mode==='blocked-script'?3600:150);await p.evaluate(()=>document.fonts.ready);
  const result=await p.evaluate(()=>({invisible:[...document.querySelectorAll('main h1,main h2,main p')].filter(e=>{const s=getComputedStyle(e);return s.opacity==='0'||s.visibility==='hidden'||s.webkitTextFillColor==='rgba(0, 0, 0, 0)'}).map(e=>e.className),overflow:document.documentElement.scrollWidth>innerWidth,assembly:document.documentElement.classList.contains('assembly-intro')}));
  report.fallbacks.push({page:name,mode,...result});await c.close();
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();
 const failed=report.breakpoints.filter(r=>r.hidden.length||r.overflow.length||r.errors.length||r.animationRestarts||r.scrollWidth>r.width||r.brokenImages.length||r.mediaStatic?.some(s=>!s.stable));
 console.log('Failures',failed.map(r=>[r.page,r.width]));assert.equal(failed.length,0);
 assert(report.entrances.every(r=>r.complete==='complete'&&r.afterReturn==='complete'&&r.refresh==='complete'));
 assert(report.fallbacks.every(r=>!r.invisible.length&&!r.overflow&&!r.assembly));
})();
