const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/section-depth';
const url='http://127.0.0.1:4173/index.html';
const pause=p=>p.waitForTimeout(120);
async function go(p,y){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await pause(p);}
async function snapshot(p){return p.evaluate(()=>({
  hero:['--paper-y','--name-y','--frame-y'].map(k=>document.querySelector('.p-hero').style.getPropertyValue(k)),
  notes:[...document.querySelectorAll('.identity-note')].map(e=>e.style.getPropertyValue('--note-y')),
  cards:[...document.querySelectorAll('.feature-card')].map(e=>e.style.getPropertyValue('--card-y')),
  contact:['--closing-y','--closing-note-y','--closing-word-y'].map(k=>document.querySelector('.h-contact').style.getPropertyValue(k)),
  overflow:document.documentElement.scrollWidth>innerWidth,cls:window.qaCLS,
  state:document.documentElement.dataset.assemblyState
}));}
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const report=[];
 for(const width of [1440,1280,768,390,320]){
  const ctx=await browser.newContext({viewport:{width,height:900},recordVideo:width===1440?{dir:out,size:{width,height:900}}:undefined});
  await ctx.addInitScript(()=>{window.qaCLS=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.qaCLS+=e.value})).observe({type:'layout-shift',buffered:true})});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
  await p.waitForTimeout(2900);assert.equal((await snapshot(p)).state,'complete');
  assert.equal(await p.locator('.notebook-colophon').count(),0);
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  await p.screenshot({path:`${out}/hero-${width}.png`});const start=await snapshot(p);
  const tops=await p.evaluate(()=>Object.fromEntries(['.h-work','.h-capabilities','.h-toolkit','.h-contact'].map(s=>[s,document.querySelector(s).getBoundingClientRect().top+scrollY])));
  await go(p,tops['.h-work']*.5);const half=await snapshot(p);assert.notDeepEqual(start.hero,half.hero);assert.equal(new Set(half.notes).size,4);
  await p.screenshot({path:`${out}/hero-half-${width}.png`});
  const seams=[];
  for(const [selector,top] of Object.entries(tops)){
   for(const screenY of [200,450,700]){
    await go(p,top-screenY);await p.waitForTimeout(700);
    assert.equal((await snapshot(p)).overflow,false);
    const seamY=await p.locator(selector).evaluate(e=>e.getBoundingClientRect().top);
    const buffer=await p.screenshot({path:`${out}/boundary-${selector.slice(1)}-${width}-${screenY}.png`});
    // All sampled columns must change light/dark on the same row, including near edges.
    const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const cuts=[];
    for(const x of [2,Math.floor(width*.2),Math.floor(width*.5),Math.floor(width*.8),width-3]){
     let cut=null,previous=null;
     for(let y=Math.max(0,Math.floor(seamY)-28);y<Math.min(900,Math.ceil(seamY)+28);y++){
      const i=(y*info.width+x)*info.channels;const light=(data[i]+data[i+1]+data[i+2])/3>150;
      if(previous!==null&&previous!==light)cut=y;previous=light;
     }
     assert.notEqual(cut,null,`${selector} seam missing at ${width}/${x}`);cuts.push(cut);
    }
    assert(Math.max(...cuts)-Math.min(...cuts)<=1,JSON.stringify({selector,width,cuts}));seams.push({selector,screenY,cuts});
   }
  }
  const cardTop=await p.locator('.feature-card').first().evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await go(p,cardTop-450);const cardA=await snapshot(p);await go(p,cardTop-100);const cardB=await snapshot(p);
  assert.notEqual(cardA.cards[0],cardB.cards[0]);assert(cardB.cards.every(v=>Math.abs(parseFloat(v)||0)<=20));
  await p.waitForTimeout(800);await p.screenshot({path:`${out}/projects-${width}.png`});
  await p.locator('.feature-card').first().hover();await p.waitForTimeout(400);
  assert.equal(await p.locator('.feature-card').first().evaluate(e=>getComputedStyle(e).translate),'0px -5px');
  await p.mouse.move(0,0);await go(p,tops['.h-contact']-450);await p.waitForTimeout(850);const contactA=await snapshot(p);
  const linkA=await p.locator('.contact-email').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await go(p,tops['.h-contact']-100);const contactB=await snapshot(p);
  assert.notDeepEqual(contactA.contact,contactB.contact);
  assert(Math.abs(linkA-await p.locator('.contact-email').evaluate(e=>e.getBoundingClientRect().top+scrollY))<1);
  await p.screenshot({path:`${out}/contact-${width}.png`});
  assert.equal(await p.locator('.pixel-fragment-canvas').count(),0);
  await p.emulateMedia({reducedMotion:'reduce'});await pause(p);const reduced=await snapshot(p);
  assert(reduced.hero.every(v=>parseFloat(v)===0));assert(reduced.cards.every(v=>parseFloat(v)===0));assert(reduced.contact.every(v=>parseFloat(v)===0));
  await p.emulateMedia({reducedMotion:'no-preference'});
  if(width===1440){
   await go(p,0);await p.waitForTimeout(400);
   await p.evaluate(async()=>{const end=document.documentElement.scrollHeight-innerHeight;const start=performance.now();await new Promise(resolve=>{function tick(now){const t=Math.min(1,(now-start)/14000);scrollTo({top:end*t,behavior:'instant'});if(t<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})});
  }
  const final=await snapshot(p);assert.equal(errors.length,0);assert(final.cls<.01);
  report.push({width,start,half,cardA,cardB,contactA,contactB,reduced,seams,errors,cls:final.cls});
  const video=p.video();await ctx.close();if(video)await video.saveAs(`${out}/scroll-depth.webm`);console.log('PASS '+width);
 }
 await fs.writeFile(`${out}/results.json`,JSON.stringify(report,null,2));await browser.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
