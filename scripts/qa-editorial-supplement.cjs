const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/editorial-stability';
(async()=>{
 const browser=await chromium.launch(),report={accessibility:[],reducedToggle:[],imageLinks:[]};
 for(const name of ['index','projects']){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:4173/'+name+'.html');
  await page.waitForTimeout(300);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(100);
  const state=await page.evaluate(name=>name==='index'?!document.documentElement.classList.contains('assembly-intro'):document.querySelector('.projects-hero').dataset.reveal==='complete',name);
  report.reducedToggle.push({page:name,completed:state});assert(state);
  await page.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact})));
  report.accessibility.push({page:name,violations});assert.equal(violations.length,0);
  if(name==='projects')for(const story of await page.locator('.project-story').all()){
   await story.scrollIntoViewIfNeeded();
   const result=await story.evaluate(e=>{const s=e.querySelector('.project-stage').getBoundingClientRect();const hit=document.elementFromPoint(innerWidth*.82,Math.max(10,Math.min(innerHeight-10,s.top+s.height*.5)));return {id:e.id,sceneClickable:hit?.closest('a')===e.querySelector('.project-scene')};});
   report.imageLinks.push(result);assert(result.sceneClickable);
  }
  await page.close();
 }
 const delayed=await browser.newPage();
 await delayed.route('**/pixel-assembly.js*',async route=>{await new Promise(r=>setTimeout(r,900));await route.continue();});
 await delayed.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
 await delayed.waitForFunction(()=>document.documentElement.dataset.assemblyCount==='1');
 report.delayedScript=await delayed.evaluate(()=>({elapsed:performance.now()-Number(document.documentElement.dataset.assemblyStart),state:document.documentElement.dataset.assemblyState,nameComplete:document.documentElement.classList.contains('assembly-name-done')}));
 assert(report.delayedScript.elapsed<300&&!report.delayedScript.nameComplete);
 await delayed.waitForTimeout(2800);assert.equal(await delayed.evaluate(()=>document.documentElement.dataset.assemblyState),'complete');
 await browser.close();fs.writeFileSync(out+'/supplement-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})();
