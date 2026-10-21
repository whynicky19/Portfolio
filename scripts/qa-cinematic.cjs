const {chromium,firefox,webkit}=require('playwright');
const fs=require('node:fs/promises');const assert=require('node:assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/cinematic-polish';
(async()=>{
 await fs.mkdir(out,{recursive:true});const report={browsers:[],checks:[]};
 for(const engine of [chromium,webkit,firefox]){let b;try{b=await engine.launch()}catch(e){report.browsers.push({name:engine.name(),available:false,reason:e.message.split('\n')[0]});continue;}
 report.browsers.push({name:engine.name(),available:true});
 for(const name of ['index','projects']){
  const ctx=await b.newContext({viewport:{width:1440,height:900},recordVideo:engine===chromium?{dir:out,size:{width:1440,height:900}}:undefined});const p=await ctx.newPage();
  await p.goto('http://127.0.0.1:4173/'+name+'.html');await p.waitForTimeout(3200);
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  const targets=name==='projects'?['.projects-hero','.recent-work',...await p.locator('.project-story').evaluateAll(es=>es.map(e=>'#'+e.id))]:['.p-hero','.h-work','.h-capabilities','.h-toolkit','.h-contact'];
  for(const [i,selector]of targets.entries()){
   const y=await p.locator(selector).evaluate(e=>e.getBoundingClientRect().top+scrollY);
   await p.evaluate(async y=>{const from=scrollY,start=performance.now();await new Promise(resolve=>{function tick(t){const q=Math.min(1,(t-start)/1000);scrollTo({top:from+(y-from)*q,behavior:'instant'});if(q<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})},Math.max(0,y-160));
   await p.waitForTimeout(750);if(engine===chromium)await p.screenshot({path:`${out}/${name}-scene-${i}.png`});
  }
  await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});const violations=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  report.checks.push({name,engine:engine.name(),violations});assert.equal(violations.length,0,JSON.stringify(violations));
  await p.evaluate(()=>scrollTo(0,0));await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.activeElement!==document.body));
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>scrollTo(0,200));await p.waitForTimeout(100);
  const bg=name==='index'?'.notebook-paper':'.projects-sky';assert.equal(await p.locator(bg).evaluate(e=>getComputedStyle(e).transform),'none');
  const video=p.video();await ctx.close();if(video)await video.saveAs(`${out}/${name}-motion.webm`);
  const nojs=await b.newContext({javaScriptEnabled:false,viewport:{width:320,height:844}}),np=await nojs.newPage();await np.goto('http://127.0.0.1:4173/'+name+'.html');assert(await np.locator('h1').isVisible());assert(await np.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await nojs.close();
 }
 await b.close();
 }
 await fs.writeFile(`${out}/quality.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
