const {chromium}=require('playwright');
const fs=require('node:fs/promises');const assert=require('node:assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/motion-redesign';
const url='http://127.0.0.1:4173/';
async function until(p,t){const now=await p.evaluate(()=>performance.now());if(now<t)await p.waitForTimeout(t-now);}
async function scroll(p,y,duration=900){return p.evaluate(async({y,duration})=>{const start=performance.now(),from=scrollY;await new Promise(resolve=>{function frame(now){const q=Math.min(1,(now-start)/duration);scrollTo({top:from+(y-from)*q,behavior:'instant'});if(q<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)})},{y,duration});}
async function state(p){return p.evaluate(()=>({time:performance.now(),scroll:scrollY,entrance:document.documentElement.dataset.assemblyState,canvas:!!document.querySelector('.pixel-name canvas'),hero:document.querySelector('.p-hero,.projects-hero')?.getAttribute('style'),recent:document.querySelector('.recent-work')?.getAttribute('style')}));}
(async()=>{
 await fs.mkdir(out,{recursive:true});const b=await chromium.launch();const report={early:[],scenes:[]};
 for(const width of [1440,768,390]){
  for(const time of [200,500,1000,1500]){
   const ctx=await b.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,recordVideo:time===500?{dir:out,size:{width,height:900}}:undefined});const p=await ctx.newPage();
   await p.goto(url+'index.html',{waitUntil:'domcontentloaded'});await until(p,time);
   if(width===390)await p.dispatchEvent('body','pointerdown',{pointerType:'touch'});
   await p.mouse.wheel(0,150);await p.waitForTimeout(60);const after=await state(p);assert.equal(after.entrance,'running',JSON.stringify(after));
   if(time===200){await p.keyboard.press('ArrowDown');await p.setViewportSize({width,height:844});await p.waitForTimeout(50);assert.equal((await state(p)).entrance,'running');}
   await until(p,2800);assert.equal((await state(p)).entrance,'complete');
   if(time===500){await scroll(p,0);await p.screenshot({path:`${out}/home-complete-${width}.png`});await scroll(p,450,1500);await p.screenshot({path:`${out}/home-depth-${width}.png`});await scroll(p,0);}
   report.early.push({width,time,after});const video=p.video();await ctx.close();if(video)await video.saveAs(`${out}/home-early-${width}.webm`);
  }
  const ctx=await b.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}}),p=await ctx.newPage();await p.goto(url+'projects.html');await until(p,1900);
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  const heroHeight=await p.locator('.projects-hero').evaluate(e=>e.offsetHeight);
  for(const fraction of [0,.25,.5,.75,1]){await scroll(p,heroHeight*fraction,1000);report.scenes.push({width,fraction,...await state(p)});await p.screenshot({path:`${out}/projects-${width}-${fraction}.png`});}
  for(const id of ['chatra-project','soyle-project','digital-urpaq-project','freelanceos']){
   const card=p.locator('#'+id+' .project-scene'),y=await card.evaluate(e=>e.getBoundingClientRect().top+scrollY);
   const states=[];
   for(const offset of [650,300,50]){await scroll(p,Math.max(0,y-offset),1000);states.push(await card.evaluate(e=>{const c=e.getBoundingClientRect();return{media:[...e.querySelectorAll('.scene-depth img')].map(i=>{const r=i.getBoundingClientRect();return[r.x-c.x,r.y-c.y,r.width,r.height]}),background:getComputedStyle(e.querySelector('.scene-background')).transform,light:getComputedStyle(e,'::before').transform}}));if(offset===300)await p.screenshot({path:`${out}/${id}-${width}.png`});}
   for(const s of states)for(let j=0;j<s.media.length;j++)for(let k=0;k<4;k++)assert(Math.abs(s.media[j][k]-states[0].media[j][k])<.01);
   assert.notEqual(states[0].light,states[2].light);report.scenes.push({width,id,states});
  }
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const video=p.video();await ctx.close();await video.saveAs(`${out}/projects-${width}.webm`);console.log('PASS',width);
 }
 // Refresh with an in-progress entrance and a large scroll must not skip the clock.
 const p=await b.newPage();await p.goto(url+'index.html');await until(p,200);await p.evaluate(()=>scrollTo(0,1800));await p.waitForTimeout(70);assert.equal((await state(p)).entrance,'running');await p.reload();await p.waitForTimeout(500);assert.equal((await state(p)).entrance,'running');await p.waitForTimeout(2500);assert.equal((await state(p)).entrance,'complete');
 const ctx=await b.newContext({reducedMotion:'reduce',viewport:{width:390,height:844},recordVideo:{dir:out,size:{width:390,height:844}}}),rp=await ctx.newPage();
 for(const name of ['index','projects']){await rp.goto(url+name+'.html');await scroll(rp,600);assert.equal(await rp.locator(name==='index'?'.notebook-paper':'.projects-light').evaluate(e=>getComputedStyle(e).transform),'none');await rp.screenshot({path:`${out}/${name}-reduced.png`});}
 const v=rp.video();await ctx.close();await v.saveAs(`${out}/reduced-motion.webm`);
 await fs.writeFile(out+'/results.json',JSON.stringify(report,null,2));await b.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
