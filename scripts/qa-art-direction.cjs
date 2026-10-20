const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const output = process.env.PORTFOLIO_QA_OUTPUT || '/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/art-direction';
const origin = 'http://127.0.0.1:4173';
const pause = (p, ms=180) => p.waitForTimeout(ms);
async function go(p,y) { await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y); await pause(p); }
async function geometry(p) { return p.evaluate(()=>Object.fromEntries(['.p-hero','.h-capabilities','.h-principles','.h-toolkit','.h-contact'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return [s,{top:r.top+scrollY,height:r.height}]}))); }
async function transforms(p) { return p.evaluate(()=>Object.fromEntries(['.product-browser','.product-phone','.hero-horizon i','.hero-horizon b','.craft-screen','.principle-track i','.tech-portal i','.tech-portal b','.tech-portal span','.contact-halo'].map(s=>[s,getComputedStyle(document.querySelector(s)).transform]))); }
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch();
 const report={viewports:[],motion:[],links:[]};
 for(const width of [1440,1280,1024,768,390,320]) {
  const p=await browser.newPage({viewport:{width,height:1000}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await p.goto(origin);
  await p.evaluate(()=>{for(const i of document.images)i.loading='eager'});
  await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0),{},{timeout:15000});
  await pause(p,900);
  for(const section of ['.h-work','.h-capabilities','.h-principles','.h-toolkit','.h-contact']){
   const y=await p.locator(section).evaluate(e=>e.getBoundingClientRect().top+scrollY);
   await go(p,y);await pause(p,700);
   if(width===1440||width===390)await p.screenshot({path:path.join(output,section.slice(3)+'-'+width+'.png')});
  }
  const checks=await p.evaluate(()=>({
   overflow:document.documentElement.scrollWidth>innerWidth,
   clipped:[...document.querySelectorAll('h1,h2,h3,main a')].filter(e=>{const r=e.getBoundingClientRect();return (!e.matches('a')&&e.scrollWidth>e.clientWidth+3)||r.left < -3||r.right>innerWidth+3}).map(e=>e.textContent.trim()),
   broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),
   navClear:document.querySelector('.apple-nav').getBoundingClientRect().bottom<0
  }));
  // The product note deliberately moves within the hero scene, but remains in bounds.
  report.viewports.push({width,...checks,errors});
  assert(!checks.overflow&&!checks.clipped.length&&!checks.broken.length&&checks.navClear&&!errors.length,JSON.stringify(report.viewports.at(-1)));
  if(width===1440||width===390){
   const geo=await geometry(p);
   const stages=[
    ['hero',0,geo['.p-hero'].height*.65],
    ['horizon',Math.max(0,geo['.p-hero'].height-900),geo['.p-hero'].height-150],
    ['craft',geo['.h-capabilities'].top-700,geo['.h-capabilities'].top+300],
    ['principles',geo['.h-principles'].top-400,geo['.h-principles'].top+geo['.h-principles'].height*.8],
    ['portal',geo['.h-toolkit'].top-1000,geo['.h-toolkit'].top-150]
   ];
   for(const[name,start,end]of stages){
    const samples=[];
    for(const t of [0,.5,1]){const y=Math.max(0,start+(end-start)*t);await go(p,y);samples.push({y,transforms:await transforms(p)});await p.screenshot({path:path.join(output,name+'-'+width+'-'+t+'.png')});}
    report.motion.push({width,name,start,end,samples});
   }
   await go(p,0);await pause(p,800);
   await p.screenshot({path:path.join(output,'hero-'+width+'.png')});
   await p.screenshot({path:path.join(output,'full-'+width+'.png'),fullPage:true});
   await sharp(path.join(output,'full-'+width+'.png')).resize(width===1440?740:390).webp({quality:85}).toFile(path.join(output,'overview-'+width+'.webp'));
   await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});
   const violations=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations);
   report.viewports.at(-1).accessibility=violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
   assert.equal(violations.length,0,JSON.stringify(report.viewports.at(-1).accessibility));
   await p.emulateMedia({reducedMotion:'reduce'});await go(p,0);const first=await transforms(p);await go(p,geo['.h-toolkit'].top-400);assert.deepEqual(await transforms(p),first);
  }
  console.log(JSON.stringify(report.viewports.at(-1)));await p.close();
 }
 for(const m of report.motion){const selector={hero:'.product-phone',horizon:'.hero-horizon b',craft:'.craft-screen',principles:'.principle-track i',portal:'.tech-portal b'}[m.name];assert.notEqual(m.samples[0].transforms[selector],m.samples[2].transforms[selector]);}
 const p=await browser.newPage({viewport:{width:390,height:844}});await p.goto(origin);await p.locator('#navBurger').click();assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'false');
 await p.locator('.contact-orb').focus();assert(await p.locator('.contact-orb').evaluate(e=>e===document.activeElement&&e.getBoundingClientRect().left>=0&&e.getBoundingClientRect().right<=innerWidth));
 const hrefs=await p.locator('main a[href]').evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute('href')).filter(h=>!h.startsWith('http')&&!h.startsWith('mailto:')))]);
 for(const href of hrefs){const [file,fragment]=href.split('#');const response=await p.request.get(origin+'/'+file);const body=await response.text();const valid=response.ok()&&(!fragment||body.includes('id="'+fragment+'"'));report.links.push({href,valid});assert(valid);}
 await p.close();
 // Capture actual browser frames from wheel-driven scrolling, including reversals.
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:output,size:{width:1440,height:900}}});
 const videoPage=await context.newPage();await videoPage.goto(origin);await pause(videoPage,1200);
 const geo=await geometry(videoPage);
 for(const target of [650,300,geo['.h-capabilities'].top,geo['.h-principles'].top+600,geo['.h-toolkit'].top-450,geo['.h-toolkit'].top-850,geo['.h-toolkit'].top+650,geo['.h-contact'].top]){
  let current=await videoPage.evaluate(()=>scrollY);const delta=target-current;const steps=Math.max(12,Math.ceil(Math.abs(delta)/60));
  for(let i=0;i<steps;i++){await videoPage.mouse.wheel(0,delta/steps);await pause(videoPage,65);}await pause(videoPage,500);
 }
 const video=videoPage.video();await context.close();await video.saveAs(path.join(output,'homepage-scroll.webm'));await video.delete();
 await fs.writeFile(path.join(output,'qa-results.json'),JSON.stringify(report,null,2));
 await browser.close();console.log('PASS: layouts, bounds, accessibility, links, keyboard, reduced motion and measured scroll transforms.');
})().catch(e=>{console.error(e);process.exit(1)});
