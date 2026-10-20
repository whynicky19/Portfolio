const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/final-motion';
const origin='http://127.0.0.1:4173';
async function go(p,y){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(250);}
async function top(p,s){return p.locator(s).evaluate(e=>e.getBoundingClientRect().top+scrollY);}
async function motion(p){return p.evaluate(()=>{
 const specs=[['paper','.notebook-paper'],['name','.pixel-name'],['frame','.identity-board','::before'],['mint','.note-mint'],['yellow','.note-yellow'],['peach','.note-peach'],['blue','.note-blue'],['card','.feature-art'],['tech','.tech-light'],['contactPaper','.closing-paper','::before'],['contactNote','.closing-note']];
 return Object.fromEntries(specs.map(([n,s,p])=>[n,getComputedStyle(document.querySelector(s),p||null).transform]));
});}
(async()=>{
 await fs.mkdir(out,{recursive:true});await fs.copyFile('/tmp/pixel-font-comparison.png',`${out}/font-comparison.png`);
 const browser=await chromium.launch();const report={viewports:[],motion:[],checks:{}};
 for(const width of [1440,1280,768,390,320]){
  const p=await browser.newPage({viewport:{width,height:width<600?844:1000},hasTouch:width<600});const errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await p.goto(origin);await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>{for(const image of document.images)image.loading='eager'});
  await p.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
  await p.waitForTimeout(900);
  assert.equal(await p.locator('.layout-study,[data-study-width],.closing-sculpture,.h-principles').count(),0);
  assert.equal(await p.locator('.feature-card').count(),8);
  assert.equal(await p.locator('.pixel-name').textContent(),'ALIMZHAN');
  assert.match(await p.locator('.pixel-name').evaluate(e=>getComputedStyle(e).fontFamily),/Silkscreen/);
  const rects=await p.locator('.identity-note,.pixel-name').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
  assert(rects.every(r=>r.left>=0&&r.right<=width),JSON.stringify(rects));
  await p.screenshot({path:`${out}/hero-${width}.png`});
  if(width===1440)await p.locator('.p-hero').screenshot({path:'assets/hero/pixel-identity-preview.png'});
  const hs=[];for(const y of [0,160,320]){await go(p,y);hs.push({scrollY:y,transforms:await motion(p)});if(width===1440||width===390)await p.screenshot({path:`${out}/hero-${width}-scroll-${y}.png`});}
  for(const key of ['paper','name','frame','mint','yellow','peach','blue'])assert.notEqual(hs[0].transforms[key],hs[2].transforms[key],key);
  report.motion.push({width,hero:hs});
  await go(p,0);const pointerBefore=await motion(p);await p.mouse.move(width*.8,180);await p.waitForTimeout(600);const pointerAfter=await motion(p);
  if(width>=768)assert.notEqual(pointerBefore.mint,pointerAfter.mint,'pointer movement');
  await p.mouse.move(0,1000);
  await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});
  const violations=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.equal(violations.length,0,JSON.stringify(violations));
  const states=[];
  for(const s of ['.h-work','.h-capabilities','.h-toolkit','.h-contact']){
   await go(p,Math.max(0,await top(p,s)-180));await p.waitForTimeout(950);
   const state=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...document.querySelectorAll('main h1,main h2,main h3,main a')].filter(e=>{const r=e.getBoundingClientRect();return r.left< -2||r.right>innerWidth+2||(!e.matches('a')&&e.scrollWidth>e.clientWidth+3)}).map(e=>e.textContent)}));
   assert(!state.overflow&&!state.clipped.length,JSON.stringify({width,s,state}));states.push({s,...state});
   if(width===1440||width===390)await p.screenshot({path:`${out}/${s.slice(3)}-${width}.png`});
  }
  const contactY=await top(p,'.h-contact');const cs=[];
  for(const y of [contactY-750,contactY-300,contactY]){await go(p,y);cs.push({scrollY:await p.evaluate(()=>scrollY),transforms:await motion(p)});if(width===1440)await p.screenshot({path:`${out}/contact-scroll-${Math.round(y)}.png`});}
  assert.notEqual(cs[0].transforms.contactPaper,cs[2].transforms.contactPaper);assert.notEqual(cs[0].transforms.contactNote,cs[2].transforms.contactNote);
  report.motion.at(-1).contact=cs;
  await p.locator('.pixel-contact').focus();assert(await p.locator('.pixel-contact').evaluate(e=>document.activeElement===e));
  await p.keyboard.press('Tab');assert(await p.locator('.contact-email').evaluate(e=>document.activeElement===e));
  await p.locator('.feature-chatra').focus();await p.waitForTimeout(450);assert.equal(await p.locator('.feature-chatra').evaluate(e=>getComputedStyle(e).translate),'0px -5px');
  assert.equal(await p.locator('.feature-chatra .feature-art img').first().evaluate(e=>getComputedStyle(e).scale),'1.025');
  await p.locator('.feature-chatra').evaluate(e=>e.blur());
  await p.emulateMedia({reducedMotion:'reduce'});await go(p,0);const reducedA=await motion(p);await go(p,contactY);assert.deepEqual(await motion(p),reducedA);
  await p.emulateMedia({reducedMotion:'no-preference'});await go(p,0);await p.waitForTimeout(900);
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  if(width===1440||width===390){await p.screenshot({path:`${out}/full-${width}.png`,fullPage:true});await sharp(`${out}/full-${width}.png`).resize(width===1440?740:390).webp({quality:85}).toFile(`${out}/overview-${width}.webp`);}
  if(width===390){await go(p,0);await p.locator('#navBurger').tap();assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'false');await p.locator('.notebook-actions a').first().tap();await p.waitForURL('**/projects.html');assert(await p.locator('main').isVisible());}
  if(width===1440){await p.locator('.pixel-contact').focus();await p.keyboard.press('Enter');await p.waitForURL('**/contact.html');assert(await p.locator('main').isVisible());}
  assert.equal(errors.length,0,JSON.stringify(errors));report.viewports.push({width,errors,violations,states,font:'Silkscreen Bold',reducedMotion:'pass'});console.log('PASS width '+width);await p.close();
 }
 // Progressive enhancement: neither a missing observer nor JS is allowed to hide main content.
 for(const mode of ['no-js','observer-failure']){
  const p=await browser.newPage({javaScriptEnabled:mode!=='no-js'});
  if(mode==='observer-failure')await p.addInitScript(()=>{window.IntersectionObserver=class{constructor(){throw new Error('QA observer unavailable')}}});
  await p.goto(origin);await p.waitForTimeout(800);
  assert(await p.locator('.pixel-name').isVisible());assert(await p.locator('.pixel-contact').isVisible());
  assert.equal(await p.locator('.feature-card').count(),8);report.checks[mode]='main content visible';await p.close();
 }
 const zoom=await browser.newPage({viewport:{width:1440,height:1000}});await zoom.goto(origin);await zoom.evaluate(()=>document.body.style.zoom=2);await zoom.waitForTimeout(800);assert(await zoom.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await zoom.locator('.pixel-name').evaluate(e=>e.scrollWidth<=e.clientWidth+2));await zoom.screenshot({path:`${out}/zoom-200.png`});await zoom.close();report.checks.zoom200='name fits, no overflow';
 const ctx=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});const p=await ctx.newPage();await p.goto(origin);await p.waitForTimeout(1100);await p.mouse.move(1050,230);await p.waitForTimeout(600);
 for(let i=0;i<10;i++){await p.mouse.wheel(0,85);await p.waitForTimeout(110);}
 await p.locator('.feature-chatra').hover();await p.waitForTimeout(700);await p.mouse.move(40,400);await p.waitForTimeout(400);
 for(let i=0;i<24;i++){await p.mouse.wheel(0,130);await p.waitForTimeout(90);}
 await p.locator('.pixel-contact').scrollIntoViewIfNeeded();await p.waitForTimeout(800);await p.locator('.pixel-contact').hover();await p.waitForTimeout(700);
 for(let i=0;i<5;i++){await p.mouse.wheel(0,-85);await p.waitForTimeout(100);}
 const video=p.video();await ctx.close();await video.saveAs(`${out}/homepage-motion.webm`);
 await fs.writeFile(`${out}/qa-results.json`,JSON.stringify(report,null,2));await browser.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
