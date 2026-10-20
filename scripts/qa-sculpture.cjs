const {chromium}=require('playwright');
const sharp=require('sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const output='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/light-sculpture';
const origin='http://127.0.0.1:4173';
const pause=(p,n=250)=>p.waitForTimeout(n);
async function go(p,y){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await pause(p);}
async function top(p,s){return p.locator(s).evaluate(e=>e.getBoundingClientRect().top+scrollY);}
async function motion(p){return p.evaluate(()=>Object.fromEntries(['.sculpture-image','.feature-chatra .feature-art','.tech-light','.closing-sculpture'].map(s=>[s,getComputedStyle(document.querySelector(s)).transform])));}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const report={viewports:[],motion:[],links:[]};
 const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
 assert.equal(hash(await fs.readFile('assets/hero/light-sculpture-source.png')),hash(await fs.readFile('/var/folders/7_/0tw2mmzs5yj7271pqmcv31wm0000gn/T/codex-clipboard-cf7ba038-2d97-4206-9d82-6a0d75b3c3b0.png')));
 report.originalHeroPreserved=true;
 const browser=await chromium.launch();
 for(const width of [1440,1280,768,390,320]){
  const p=await browser.newPage({viewport:{width,height:1000}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await p.goto(origin);
  await p.evaluate(()=>{for(const i of document.images)i.loading='eager'});
  await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0),{},{timeout:15000});
  await pause(p,1200);
  assert.equal(await p.locator('.p-hero img').count(),1);
  assert.equal(await p.locator('.hero-product,.craft-scene,.principle-number,.contact-orb').count(),0);
  assert.equal(await p.locator('.project-atmosphere').count(),8);
  for(const s of ['.h-work','.h-capabilities','.h-principles','.h-toolkit','.h-contact']){
   await go(p,await top(p,s));await pause(p,700);
   if(width===1440||width===390)await p.screenshot({path:path.join(output,s.slice(3)+'-'+width+'.png')});
  }
  const result=await p.evaluate(()=>({
   overflow:document.documentElement.scrollWidth>innerWidth,
   clipped:[...document.querySelectorAll('h1,h2,h3,main a,main button')].filter(e=>{const r=e.getBoundingClientRect();return(!e.matches('a')&&e.scrollWidth>e.clientWidth+3)||r.left<-3||r.right>innerWidth+3}).map(e=>e.textContent.trim()),
   broken:[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src),
   navClear:document.querySelector('.apple-nav').getBoundingClientRect().bottom<0
  }));
  report.viewports.push({width,...result,errors});
  assert(!result.overflow&&!result.clipped.length&&!result.broken.length&&result.navClear&&!errors.length,JSON.stringify(report.viewports.at(-1)));
  if(width===1440||width===390){
   await go(p,0);await pause(p,800);await p.screenshot({path:path.join(output,'hero-'+width+'.png')});await p.screenshot({path:path.join(output,'full-'+width+'.png'),fullPage:true});
   await sharp(path.join(output,'full-'+width+'.png')).resize(width===1440?740:390).webp({quality:90}).toFile(path.join(output,'overview-'+width+'.webp'));
   await p.locator('.h-work').screenshot({path:path.join(output,'projects-'+width+'.png')});
   const h=await p.locator('.p-hero').evaluate(e=>e.offsetHeight);
   for(const[name,start,end]of [['hero',0,h*.65],['projects',await top(p,'.h-work')-700,await top(p,'.h-work')+400],['tech',await top(p,'.h-toolkit')-800,await top(p,'.h-toolkit')+400],['closing',await top(p,'.h-contact')-800,await top(p,'.h-contact')+200]]){
    const samples=[];for(const t of [0,.5,1]){await go(p,Math.max(0,start+(end-start)*t));samples.push({scrollY:await p.evaluate(()=>scrollY),transforms:await motion(p)});await p.screenshot({path:path.join(output,name+'-motion-'+width+'-'+t+'.png')});}
    const selector={hero:'.sculpture-image',projects:'.feature-chatra .feature-art',tech:'.tech-light',closing:'.closing-sculpture'}[name];assert.notEqual(samples[0].transforms[selector],samples[2].transforms[selector]);report.motion.push({width,name,samples});
   }
   await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});await pause(p,800);
   const violations=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
   report.viewports.at(-1).accessibility=violations;assert.equal(violations.length,0,JSON.stringify(violations));
   await p.emulateMedia({reducedMotion:'reduce'});await go(p,0);const before=await motion(p);await go(p,await top(p,'.h-toolkit'));assert.deepEqual(await motion(p),before);
  }
  if(width===1440){
   await p.emulateMedia({reducedMotion:'no-preference'});await go(p,await top(p,'.h-capabilities'));
   const wide=await p.locator('.study-preview').evaluate(e=>e.offsetWidth);
   await p.locator('[data-study-width="narrow"]').focus();await p.keyboard.press('Enter');await pause(p,450);
   assert((await p.locator('.study-preview').evaluate(e=>e.offsetWidth))<wide);
   assert.equal(await p.locator('[data-study-width="narrow"]').getAttribute('aria-pressed'),'true');
   assert.equal(await p.locator('.study-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1);
   await p.screenshot({path:path.join(output,'study-narrow.png')});
   await p.locator('[data-study-width="wide"]').click();
   await p.locator('.feature-chatra').hover();await pause(p,400);assert.equal(await p.locator('.feature-chatra').evaluate(e=>getComputedStyle(e).translate),'0px -5px');
   await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));await pause(p,1000);
   const dark=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));report.darkAccessibility=dark;assert.equal(dark.length,0);
   const hrefs=await p.locator('a[href]').evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute('href')).filter(h=>!h.startsWith('http')&&!h.startsWith('mailto:')&&!h.startsWith('#')))]);
   for(const href of hrefs){const[file,fragment]=href.split('#');const r=await p.request.get(origin+'/'+file);const body=await r.text();const valid=r.ok()&&(!fragment||body.includes('id="'+fragment+'"'));report.links.push({href,valid});assert(valid);}
  }
  if(width===390){await go(p,0);await p.locator('#navBurger').click();assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'false');}
  console.log(JSON.stringify(report.viewports.at(-1)));await p.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:output,size:{width:1440,height:900}}});
 const p=await context.newPage();await p.goto(origin);await pause(p,1400);
 for(const target of [500,150,await top(p,'.h-work')+900,await top(p,'.h-capabilities'),await top(p,'.h-toolkit')-450,await top(p,'.h-toolkit')+450,await top(p,'.h-contact')]){
  const current=await p.evaluate(()=>scrollY),delta=target-current,steps=Math.max(12,Math.ceil(Math.abs(delta)/65));
  for(let i=0;i<steps;i++){await p.mouse.wheel(0,delta/steps);await pause(p,65);}await pause(p,500);
 }
 const video=p.video();await context.close();await video.saveAs(path.join(output,'homepage-scroll.webm'));await video.delete();
 report.interactions={responsiveStudyKeyboard:true,cardHover:true,mobileMenuEscape:true,reducedMotion:true};
 await fs.writeFile(path.join(output,'qa-results.json'),JSON.stringify(report,null,2));await browser.close();console.log('PASS');
})().catch(e=>{console.error(e);process.exit(1)});
